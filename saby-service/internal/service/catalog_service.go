package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	"saby-service/internal/model"
)

// CatalogService provides methods for retrieving catalog data
type CatalogService interface {
	GetCategories(ctx context.Context) ([]model.CategoryResponse, error)
	GetProducts(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error)
	GetPopularProducts(ctx context.Context, limit int) ([]model.PopularProductResponse, error)
}

// catalogServiceImpl implements the CatalogService interface
type catalogServiceImpl struct {
	db     *sql.DB
	logger *slog.Logger
}

// NewCatalogService creates a new catalog service instance
func NewCatalogService(db *sql.DB, logger *slog.Logger) CatalogService {
	if logger == nil {
		logger = slog.Default()
	}

	return &catalogServiceImpl{
		db:     db,
		logger: logger,
	}
}

// GetCategories retrieves all active categories sorted by name
func (s *catalogServiceImpl) GetCategories(ctx context.Context) ([]model.CategoryResponse, error) {
	s.logger.Info("fetching categories")

	query := `
		SELECT 
			id::text,
			name,
			slug,
			description,
			image_url,
			is_active,
			external_id,
			hierarchical_id,
			parent_hierarchical_id,
			is_parent,
			created_at,
			updated_at
		FROM categories
		WHERE is_active = true
		ORDER BY name ASC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		s.logger.Error("failed to query categories", "error", err)
		return nil, err
	}
	defer rows.Close()

	var categories []model.CategoryResponse

	for rows.Next() {
		var (
			id                   string
			name                 string
			slug                 string
			description          sql.NullString
			imageURL             sql.NullString
			isActive             bool
			externalID           sql.NullString
			hierarchicalID       int
			parentHierarchicalID sql.NullInt64
			isParent             bool
			createdAt            sql.NullTime
			updatedAt            sql.NullTime
		)

		err := rows.Scan(
			&id,
			&name,
			&slug,
			&description,
			&imageURL,
			&isActive,
			&externalID,
			&hierarchicalID,
			&parentHierarchicalID,
			&isParent,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			s.logger.Error("failed to scan category row", "error", err)
			return nil, err
		}

		// Use helper function to create response
		category := model.NewCategoryResponseFromDB(
			id,
			name,
			slug,
			description,
			imageURL,
			isActive,
			externalID.String,
			hierarchicalID,
			parentHierarchicalID,
			isParent,
			createdAt.Time,
			updatedAt.Time,
		)

		categories = append(categories, category)
	}

	if err = rows.Err(); err != nil {
		s.logger.Error("error iterating category rows", "error", err)
		return nil, err
	}

	s.logger.Info("categories fetched successfully", "count", len(categories))
	return categories, nil
}

// GetProducts retrieves products with optional filtering and pagination
func (s *catalogServiceImpl) GetProducts(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
	s.logger.Info("fetching products", "filter", filter)

	// Build dynamic query with filters
	query := `
		SELECT 
			p.id::text,
			p.category_id::text,
			c.name as category_name,
			p.name,
			p.slug,
			p.description,
			p.price,
			p.discount_price,
			p.image_url,
			p.images,
			p.stock,
			p.is_available,
			p.is_featured,
			p.is_popular,
			p.weight,
			p.unit,
			p.external_id,
			p.hierarchical_id,
			p.hierarchical_parent,
			p.article,
			p.nom_number,
			p.index_number,
			p.attributes,
			p.modifiers,
			p.is_kit,
			p.is_published,
			p.short_code,
			p.sort,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 1

	// Add filters dynamically
	if filter.CategoryID != nil {
		query += ` AND p.category_id = $` + formatArgIndex(argIndex)
		args = append(args, *filter.CategoryID)
		argIndex++
	}

	if filter.HierarchicalParent != nil {
		query += ` AND p.hierarchical_parent = $` + formatArgIndex(argIndex)
		args = append(args, *filter.HierarchicalParent)
		argIndex++
	}

	if filter.Search != nil && *filter.Search != "" {
		searchPattern := "%" + *filter.Search + "%"
		query += ` AND (p.name ILIKE $` + formatArgIndex(argIndex) + ` OR p.description ILIKE $` + formatArgIndex(argIndex) + `)`
		args = append(args, searchPattern)
		argIndex++
	}

	// Add sorting
	query += ` ORDER BY p.sort DESC, p.created_at DESC`

	// Handle pagination
	var total *int
	var page *int
	var limit *int

	if filter.Page != nil && filter.Limit != nil {
		// Get total count for pagination
		countQuery := `
			SELECT COUNT(*)
			FROM products p
			WHERE 1=1
		`

		countArgs := []interface{}{}
		countArgIndex := 1

		if filter.CategoryID != nil {
			countQuery += ` AND p.category_id = $` + formatArgIndex(countArgIndex)
			countArgs = append(countArgs, *filter.CategoryID)
			countArgIndex++
		}

		if filter.HierarchicalParent != nil {
			countQuery += ` AND p.hierarchical_parent = $` + formatArgIndex(countArgIndex)
			countArgs = append(countArgs, *filter.HierarchicalParent)
			countArgIndex++
		}

		if filter.Search != nil && *filter.Search != "" {
			searchPattern := "%" + *filter.Search + "%"
			countQuery += ` AND (p.name ILIKE $` + formatArgIndex(countArgIndex) + ` OR p.description ILIKE $` + formatArgIndex(countArgIndex) + `)`
			countArgs = append(countArgs, searchPattern)
			countArgIndex++
		}

		var totalCount int
		err := s.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&totalCount)
		if err != nil {
			s.logger.Error("failed to get total count", "error", err)
			return nil, err
		}

		total = &totalCount
		page = filter.Page
		limit = filter.Limit

		// Add LIMIT and OFFSET
		offset := (*filter.Page - 1) * *filter.Limit
		query += ` LIMIT $` + formatArgIndex(argIndex) + ` OFFSET $` + formatArgIndex(argIndex+1)
		args = append(args, *filter.Limit, offset)
	}

	// Execute query
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		s.logger.Error("failed to query products", "error", err)
		return nil, err
	}
	defer rows.Close()

	var products []model.ProductResponse

	for rows.Next() {
		var (
			id                 string
			categoryID         sql.NullString
			categoryName       sql.NullString
			name               string
			slug               string
			description        sql.NullString
			price              float64
			discountPrice      sql.NullFloat64
			imageURL           sql.NullString
			imagesJSON         []byte
			stock              int
			isAvailable        bool
			isFeatured         bool
			isPopular          bool
			weight             sql.NullFloat64
			unit               string
			externalID         string
			hierarchicalID     int
			hierarchicalParent int
			article            sql.NullString
			nomNumber          sql.NullString
			indexNumber        sql.NullInt64
			attributesJSON     []byte
			modifiersJSON      []byte
			isKit              bool
			isPublished        bool
			shortCode          sql.NullString
			sort               int
			createdAt          sql.NullTime
			updatedAt          sql.NullTime
		)

		err := rows.Scan(
			&id,
			&categoryID,
			&categoryName,
			&name,
			&slug,
			&description,
			&price,
			&discountPrice,
			&imageURL,
			&imagesJSON,
			&stock,
			&isAvailable,
			&isFeatured,
			&isPopular,
			&weight,
			&unit,
			&externalID,
			&hierarchicalID,
			&hierarchicalParent,
			&article,
			&nomNumber,
			&indexNumber,
			&attributesJSON,
			&modifiersJSON,
			&isKit,
			&isPublished,
			&shortCode,
			&sort,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			s.logger.Error("failed to scan product row", "error", err)
			return nil, err
		}

		// Use helper function to create response
		product, err := model.NewProductResponseFromDB(
			id,
			categoryID,
			categoryName,
			name,
			slug,
			description,
			price,
			discountPrice,
			imageURL,
			imagesJSON,
			stock,
			isAvailable,
			isFeatured,
			isPopular,
			weight,
			unit,
			externalID,
			hierarchicalID,
			hierarchicalParent,
			article,
			nomNumber,
			indexNumber,
			attributesJSON,
			modifiersJSON,
			isKit,
			isPublished,
			shortCode,
			sort,
			createdAt.Time,
			updatedAt.Time,
		)
		if err != nil {
			s.logger.Error("failed to create product response", "error", err)
			return nil, err
		}

		products = append(products, product)
	}

	if err = rows.Err(); err != nil {
		s.logger.Error("error iterating product rows", "error", err)
		return nil, err
	}

	s.logger.Info("products fetched successfully", "count", len(products))

	// Create response with or without pagination
	response := model.NewProductListResponse(products, total, page, limit)
	return &response, nil
}

// formatArgIndex formats an argument index for SQL query building
func formatArgIndex(index int) string {
	return fmt.Sprintf("%d", index)
}

// GetPopularProducts retrieves popular/featured products
func (s *catalogServiceImpl) GetPopularProducts(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
	s.logger.Info("fetching popular products", "limit", limit)

	query := `
		SELECT 
			p.id::text,
			p.category_id::text,
			c.name as category_name,
			p.name,
			p.slug,
			p.description,
			p.price,
			p.discount_price,
			p.image_url,
			p.images,
			p.stock,
			p.is_available,
			p.is_featured,
			p.is_popular,
			p.weight,
			p.unit,
			p.external_id,
			p.hierarchical_id,
			p.hierarchical_parent,
			p.article,
			p.nom_number,
			p.index_number,
			p.attributes,
			p.modifiers,
			p.is_kit,
			p.is_published,
			p.short_code,
			p.sort,
			p.created_at,
			p.updated_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.is_popular = true
		ORDER BY p.sort DESC, p.created_at DESC
		LIMIT $1
	`

	rows, err := s.db.QueryContext(ctx, query, limit)
	if err != nil {
		s.logger.Error("failed to query popular products", "error", err)
		return nil, err
	}
	defer rows.Close()

	var products []model.PopularProductResponse

	for rows.Next() {
		var (
			id                 string
			categoryID         sql.NullString
			categoryName       sql.NullString
			name               string
			slug               string
			description        sql.NullString
			price              float64
			discountPrice      sql.NullFloat64
			imageURL           sql.NullString
			imagesJSON         []byte
			stock              int
			isAvailable        bool
			isFeatured         bool
			isPopular          bool
			weight             sql.NullFloat64
			unit               string
			externalID         string
			hierarchicalID     int
			hierarchicalParent int
			article            sql.NullString
			nomNumber          sql.NullString
			indexNumber        sql.NullInt64
			attributesJSON     []byte
			modifiersJSON      []byte
			isKit              bool
			isPublished        bool
			shortCode          sql.NullString
			sort               int
			createdAt          sql.NullTime
			updatedAt          sql.NullTime
		)

		err := rows.Scan(
			&id,
			&categoryID,
			&categoryName,
			&name,
			&slug,
			&description,
			&price,
			&discountPrice,
			&imageURL,
			&imagesJSON,
			&stock,
			&isAvailable,
			&isFeatured,
			&isPopular,
			&weight,
			&unit,
			&externalID,
			&hierarchicalID,
			&hierarchicalParent,
			&article,
			&nomNumber,
			&indexNumber,
			&attributesJSON,
			&modifiersJSON,
			&isKit,
			&isPublished,
			&shortCode,
			&sort,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			s.logger.Error("failed to scan popular product row", "error", err)
			return nil, err
		}

		// Use helper function to create product response
		productResp, err := model.NewProductResponseFromDB(
			id,
			categoryID,
			categoryName,
			name,
			slug,
			description,
			price,
			discountPrice,
			imageURL,
			imagesJSON,
			stock,
			isAvailable,
			isFeatured,
			isPopular,
			weight,
			unit,
			externalID,
			hierarchicalID,
			hierarchicalParent,
			article,
			nomNumber,
			indexNumber,
			attributesJSON,
			modifiersJSON,
			isKit,
			isPublished,
			shortCode,
			sort,
			createdAt.Time,
			updatedAt.Time,
		)
		if err != nil {
			s.logger.Error("failed to create product response", "error", err)
			return nil, err
		}

		// Create popular product response with order count = 0 (not tracked anymore)
		popularProduct := model.NewPopularProductResponseFromDB(productResp, 0)
		products = append(products, popularProduct)
	}

	if err = rows.Err(); err != nil {
		s.logger.Error("error iterating popular product rows", "error", err)
		return nil, err
	}

	s.logger.Info("popular products fetched successfully", "count", len(products))
	return products, nil
}
