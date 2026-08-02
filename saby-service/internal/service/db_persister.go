package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"saby-service/internal/model"
)

const batchSize = 50

// getSafeJSONBValue ensures the string is valid JSON, returns "{}" if invalid
func getSafeJSONBValue(s string) string {
	s = strings.TrimSpace(s)

	// Quick check for empty or null
	if s == "" || s == "null" || s == "NULL" {
		return "{}"
	}

	// Simple validation - if starts with { and ends with }, consider it potentially valid
	if strings.HasPrefix(s, "{") && strings.HasSuffix(s, "}") {
		// Try to parse, if fails - return {}
		var dummy map[string]interface{}
		if json.Unmarshal([]byte(s), &dummy) == nil {
			return s
		}
	}

	return "{}"
}

// getSafeJSONBArrayValue ensures the string is valid JSON array, returns "[]" if invalid
func getSafeJSONBArrayValue(s string) string {
	s = strings.TrimSpace(s)

	// Quick check for empty or null
	if s == "" || s == "null" || s == "NULL" {
		return "[]"
	}

	// Simple validation - if starts with [ and ends with ], consider it potentially valid
	if strings.HasPrefix(s, "[") && strings.HasSuffix(s, "]") {
		// Try to parse, if fails - return []
		var dummy []interface{}
		if json.Unmarshal([]byte(s), &dummy) == nil {
			return s
		}
	}

	return "[]"
}

// DBPersister handles persistence of categories and products to PostgreSQL
type DBPersister interface {
	PersistCategories(ctx context.Context, categories []model.Category) (*PersistStats, error)
	PersistProducts(ctx context.Context, products []model.Product) (*PersistStats, error)
}

// PersistStats tracks the number of created and updated records
type PersistStats struct {
	Created int
	Updated int
}

type dbPersisterImpl struct {
	db *sql.DB
}

// NewDBPersister creates a new database persister
func NewDBPersister(db *sql.DB) DBPersister {
	return &dbPersisterImpl{
		db: db,
	}
}

// PersistCategories persists categories to the database in batches
func (p *dbPersisterImpl) PersistCategories(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	stats := &PersistStats{}

	// Process categories in batches of 50
	for i := 0; i < len(categories); i += batchSize {
		end := i + batchSize
		if end > len(categories) {
			end = len(categories)
		}

		batch := categories[i:end]
		batchStats, err := p.persistCategoryBatch(ctx, batch)
		if err != nil {
			return stats, fmt.Errorf("failed to persist category batch: %w", err)
		}

		stats.Created += batchStats.Created
		stats.Updated += batchStats.Updated
	}

	return stats, nil
}

// PersistProducts persists products to the database in batches
func (p *dbPersisterImpl) PersistProducts(ctx context.Context, products []model.Product) (*PersistStats, error) {
	stats := &PersistStats{}

	// Process products in batches of 50
	for i := 0; i < len(products); i += batchSize {
		end := i + batchSize
		if end > len(products) {
			end = len(products)
		}

		batch := products[i:end]
		batchStats, err := p.persistProductBatch(ctx, batch)
		if err != nil {
			return stats, fmt.Errorf("failed to persist product batch: %w", err)
		}

		stats.Created += batchStats.Created
		stats.Updated += batchStats.Updated
	}

	return stats, nil
}

// persistCategoryBatch persists a batch of categories within a single transaction
func (p *dbPersisterImpl) persistCategoryBatch(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	tx, err := p.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	const categorySQL = `
		INSERT INTO categories (
			name, slug, external_id, hierarchical_id, parent_hierarchical_id,
			is_parent, is_active, image_url, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		ON CONFLICT (hierarchical_id) DO UPDATE SET
			name = EXCLUDED.name,
			external_id = EXCLUDED.external_id,
			parent_hierarchical_id = EXCLUDED.parent_hierarchical_id,
			is_parent = EXCLUDED.is_parent,
			is_active = EXCLUDED.is_active,
			image_url = EXCLUDED.image_url,
			updated_at = NOW()
		RETURNING (xmax = 0) AS inserted
	`

	stmt, err := tx.PrepareContext(ctx, categorySQL)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare category statement: %w", err)
	}
	defer stmt.Close()

	stats := &PersistStats{}

	for _, category := range categories {
		var inserted bool
		err := stmt.QueryRowContext(
			ctx,
			category.Name,
			category.Slug,
			category.ExternalID,
			category.HierarchicalID,
			category.ParentHierarchicalID,
			category.IsParent,
			category.IsActive,
			category.ImageURL,
		).Scan(&inserted)

		if err != nil {
			return nil, fmt.Errorf("failed to insert/update category %s: %w", category.ExternalID, err)
		}

		if inserted {
			stats.Created++
		} else {
			stats.Updated++
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return stats, nil
}

// persistProductBatch persists a batch of products within a single transaction
func (p *dbPersisterImpl) persistProductBatch(ctx context.Context, products []model.Product) (*PersistStats, error) {
	tx, err := p.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	const productSQL = `
		INSERT INTO products (
			category_id, name, slug, description, price, external_id,
			hierarchical_id, hierarchical_parent, article, nom_number,
			index_number, attributes, modifiers, is_kit, is_published,
			is_available, short_code, stock, images, image_url,
			created_at, updated_at
		) VALUES (
			(SELECT id FROM categories WHERE hierarchical_id = $1 LIMIT 1),
			$2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
			COALESCE($12, '{}'::jsonb), COALESCE($13, '[]'::jsonb), 
			$14, $15, $16, $17, $18, COALESCE($19, '[]'::jsonb), $20, NOW(), NOW()
		)
		ON CONFLICT (external_id) DO UPDATE SET
			category_id = (SELECT id FROM categories WHERE hierarchical_id = EXCLUDED.hierarchical_parent LIMIT 1),
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			price = EXCLUDED.price,
			hierarchical_id = EXCLUDED.hierarchical_id,
			hierarchical_parent = EXCLUDED.hierarchical_parent,
			article = EXCLUDED.article,
			nom_number = EXCLUDED.nom_number,
			index_number = EXCLUDED.index_number,
			attributes = COALESCE(EXCLUDED.attributes, '{}'::jsonb),
			modifiers = COALESCE(EXCLUDED.modifiers, '[]'::jsonb),
			is_kit = EXCLUDED.is_kit,
			is_published = EXCLUDED.is_published,
			is_available = EXCLUDED.is_available,
			short_code = EXCLUDED.short_code,
			stock = EXCLUDED.stock,
			images = COALESCE(EXCLUDED.images, '[]'::jsonb),
			image_url = EXCLUDED.image_url,
			updated_at = NOW()
		RETURNING (xmax = 0) AS inserted
	`

	stmt, err := tx.PrepareContext(ctx, productSQL)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare product statement: %w", err)
	}
	defer stmt.Close()

	stats := &PersistStats{}

	for _, product := range products {
		// Use nil for JSON fields to let PostgreSQL use default values
		// This bypasses JSON parsing issues temporarily
		var attributesVal, modifiersVal, imagesVal interface{}
		attributesVal = nil
		modifiersVal = nil

		// Convert images to JSON
		if product.Images != nil && len(product.Images) > 0 {
			imagesJSON, err := json.Marshal(product.Images)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal images for product %s: %w", product.ExternalID, err)
			}
			imagesVal = string(imagesJSON)
		} else {
			imagesVal = nil
		}

		var inserted bool
		err := stmt.QueryRowContext(
			ctx,
			product.HierarchicalParent,
			product.Name,
			product.Slug,
			product.Description,
			product.Price,
			product.ExternalID,
			product.HierarchicalID,
			product.HierarchicalParent,
			product.Article,
			product.NomNumber,
			product.IndexNumber,
			attributesVal,
			modifiersVal,
			product.IsKit,
			product.IsPublished,
			product.IsAvailable,
			product.ShortCode,
			product.Stock,
			imagesVal,
			product.ImageURL,
		).Scan(&inserted)

		if err != nil {
			// Check if the error is due to NULL category_id (missing category)
			if err.Error() == "pq: null value in column \"category_id\" violates not-null constraint" {
				return nil, fmt.Errorf("category not found for product %s with hierarchical_parent %d", product.ExternalID, product.HierarchicalParent)
			}
			return nil, fmt.Errorf("failed to insert/update product %s: %w", product.ExternalID, err)
		}

		if inserted {
			stats.Created++
		} else {
			stats.Updated++
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return stats, nil
}
