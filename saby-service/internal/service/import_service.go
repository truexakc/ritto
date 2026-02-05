package service

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"saby-service/internal/client"
	"saby-service/internal/model"
)

// ImportService orchestrates the entire catalog import process
type ImportService interface {
	StartImport(ctx context.Context, params ImportParams) (*model.ImportStats, error)
	GetStatus() *model.ImportStatus
}

// ImportParams contains parameters for starting an import
type ImportParams struct {
	PointID     int
	PriceListID int
	PageSize    int
}

// importServiceImpl implements the ImportService interface
type importServiceImpl struct {
	sbisClient      client.SBISClient
	classifier      NomenclatureClassifier
	imageDownloader ImageDownloader
	slugGenerator   SlugGenerator
	dbPersister     DBPersister
	logger          *slog.Logger

	// In-memory status with mutex for thread-safety
	status      *model.ImportStatus
	statusMutex sync.RWMutex
}

// ImportServiceConfig holds configuration for the import service
type ImportServiceConfig struct {
	SBISClient      client.SBISClient
	Classifier      NomenclatureClassifier
	ImageDownloader ImageDownloader
	SlugGenerator   SlugGenerator
	DBPersister     DBPersister
	Logger          *slog.Logger
}

// NewImportService creates a new import service with all dependencies
func NewImportService(config ImportServiceConfig) ImportService {
	logger := config.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &importServiceImpl{
		sbisClient:      config.SBISClient,
		classifier:      config.Classifier,
		imageDownloader: config.ImageDownloader,
		slugGenerator:   config.SlugGenerator,
		dbPersister:     config.DBPersister,
		logger:          logger,
		status:          nil, // No import has run yet
	}
}

// GetStatus returns the current import status
// Returns nil if no import has been executed yet
func (s *importServiceImpl) GetStatus() *model.ImportStatus {
	s.statusMutex.RLock()
	defer s.statusMutex.RUnlock()

	if s.status == nil {
		return nil
	}

	// Return a copy to prevent external modification
	statusCopy := *s.status
	return &statusCopy
}

// updateStatus updates the import status in a thread-safe manner
func (s *importServiceImpl) updateStatus(updateFn func(*model.ImportStatus)) {
	s.statusMutex.Lock()
	defer s.statusMutex.Unlock()

	if s.status == nil {
		s.status = &model.ImportStatus{}
	}

	updateFn(s.status)
}

// StartImport orchestrates the entire import process
func (s *importServiceImpl) StartImport(ctx context.Context, params ImportParams) (*model.ImportStats, error) {
	startTime := time.Now()

	// Log import start
	s.logger.Info("import started",
		"pointId", params.PointID,
		"priceListId", params.PriceListID,
		"pageSize", params.PageSize,
		"startTime", startTime)

	// Initialize status to "running"
	s.updateStatus(func(status *model.ImportStatus) {
		status.Status = model.ImportStatusRunning
		status.StartedAt = startTime
		status.CompletedAt = nil
		status.Error = nil
		status.CategoriesCreated = 0
		status.CategoriesUpdated = 0
		status.ProductsCreated = 0
		status.ProductsUpdated = 0
	})

	// Execute import and handle errors
	stats, err := s.executeImport(ctx, params)
	completedAt := time.Now()
	duration := completedAt.Sub(startTime)

	if err != nil {
		// Update status to "failed"
		errorMsg := err.Error()
		s.updateStatus(func(status *model.ImportStatus) {
			status.Status = model.ImportStatusFailed
			status.CompletedAt = &completedAt
			status.Error = &errorMsg
		})

		// Log import failure
		s.logger.Error("import failed",
			"error", err,
			"duration", duration,
			"completedAt", completedAt)

		return nil, fmt.Errorf("import failed: %w", err)
	}

	// Update status to "completed"
	s.updateStatus(func(status *model.ImportStatus) {
		status.Status = model.ImportStatusCompleted
		status.CompletedAt = &completedAt
		status.CategoriesCreated = stats.CategoriesCreated
		status.CategoriesUpdated = stats.CategoriesUpdated
		status.ProductsCreated = stats.ProductsCreated
		status.ProductsUpdated = stats.ProductsUpdated
	})

	// Log import completion
	s.logger.Info("import completed",
		"categoriesCreated", stats.CategoriesCreated,
		"categoriesUpdated", stats.CategoriesUpdated,
		"productsCreated", stats.ProductsCreated,
		"productsUpdated", stats.ProductsUpdated,
		"duration", duration,
		"completedAt", completedAt)

	return stats, nil
}

// executeImport performs the actual import logic
func (s *importServiceImpl) executeImport(ctx context.Context, params ImportParams) (*model.ImportStats, error) {
	// Step 1: Fetch all nomenclatures from SBIS API
	s.logger.Info("fetching nomenclatures from SBIS API")
	fetchParams := client.FetchParams{
		PointID:     params.PointID,
		PriceListID: params.PriceListID,
		PageSize:    params.PageSize,
		Page:        0,
	}

	response, err := s.sbisClient.FetchNomenclature(ctx, fetchParams)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch nomenclatures: %w", err)
	}

	s.logger.Info("fetched nomenclatures",
		"count", len(response.Nomenclatures),
		"total", response.Total)

	// Step 2: Classify nomenclatures into categories and products
	s.logger.Info("classifying nomenclatures")
	classified, err := s.classifier.Classify(response.Nomenclatures)
	if err != nil {
		return nil, fmt.Errorf("failed to classify nomenclatures: %w", err)
	}

	s.logger.Info("classification complete",
		"categories", len(classified.Categories),
		"products", len(classified.Products))

	stats := &model.ImportStats{}

	// Step 3: Process categories (Phase 1)
	if len(classified.Categories) > 0 {
		s.logger.Info("processing categories", "count", len(classified.Categories))
		categoryStats, err := s.processCategories(ctx, classified.Categories)
		if err != nil {
			return nil, fmt.Errorf("failed to process categories: %w", err)
		}
		stats.CategoriesCreated = categoryStats.Created
		stats.CategoriesUpdated = categoryStats.Updated
		s.logger.Info("categories processed",
			"created", categoryStats.Created,
			"updated", categoryStats.Updated)
	}

	// Step 4: Process products (Phase 2)
	if len(classified.Products) > 0 {
		s.logger.Info("processing products", "count", len(classified.Products))
		productStats, err := s.processProducts(ctx, classified.Products)
		if err != nil {
			return nil, fmt.Errorf("failed to process products: %w", err)
		}
		stats.ProductsCreated = productStats.Created
		stats.ProductsUpdated = productStats.Updated
		s.logger.Info("products processed",
			"created", productStats.Created,
			"updated", productStats.Updated)
	}

	return stats, nil
}

// processCategories processes categories in batches
func (s *importServiceImpl) processCategories(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	// Track slugs within the entire category batch to prevent collisions
	batchSlugs := make(map[string]bool)

	// Process each category: download images and generate slugs
	for i := range categories {
		// Download images
		if categories[i].ImageURL != nil && *categories[i].ImageURL != "" {
			imageURLs := []string{*categories[i].ImageURL}
			localPaths, err := s.imageDownloader.DownloadImages(ctx, imageURLs)
			if err != nil {
				return nil, fmt.Errorf("failed to download images for category %s: %w", categories[i].ExternalID, err)
			}
			if len(localPaths) > 0 {
				categories[i].ImageURL = &localPaths[0]
			}
		}

		// Generate unique slug
		slug, err := s.slugGenerator.GenerateUniqueSlug(ctx, categories[i].Name, "categories", categories[i].Slug, batchSlugs)
		if err != nil {
			return nil, fmt.Errorf("failed to generate slug for category %s: %w", categories[i].ExternalID, err)
		}
		categories[i].Slug = slug
	}

	// Persist all categories to database
	stats, err := s.dbPersister.PersistCategories(ctx, categories)
	if err != nil {
		return nil, fmt.Errorf("failed to persist categories: %w", err)
	}

	return stats, nil
}

// processProducts processes products in batches
func (s *importServiceImpl) processProducts(ctx context.Context, products []model.Product) (*PersistStats, error) {
	// Track slugs within the entire product batch to prevent collisions
	batchSlugs := make(map[string]bool)

	// Process each product: download images and generate slugs
	for i := range products {
		// Download images
		if len(products[i].Images) > 0 {
			localPaths, err := s.imageDownloader.DownloadImages(ctx, products[i].Images)
			if err != nil {
				return nil, fmt.Errorf("failed to download images for product %s: %w", products[i].ExternalID, err)
			}
			if len(localPaths) > 0 {
				products[i].Images = localPaths
				products[i].ImageURL = &localPaths[0]
			}
		}

		// Generate unique slug
		slug, err := s.slugGenerator.GenerateUniqueSlug(ctx, products[i].Name, "products", products[i].Slug, batchSlugs)
		if err != nil {
			return nil, fmt.Errorf("failed to generate slug for product %s: %w", products[i].ExternalID, err)
		}
		products[i].Slug = slug
	}

	// Persist all products to database
	stats, err := s.dbPersister.PersistProducts(ctx, products)
	if err != nil {
		return nil, fmt.Errorf("failed to persist products: %w", err)
	}

	return stats, nil
}
