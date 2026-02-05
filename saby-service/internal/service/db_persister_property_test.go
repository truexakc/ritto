package service

import (
	"context"
	"encoding/json"
	"testing"

	"saby-service/internal/model"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/lib/pq"
)

// Feature: scheduled-catalog-import, Property 8: Batch Transaction Boundaries
// For any list of items to persist, the items should be grouped into batches of exactly 50
// (or fewer for the final batch), with each batch processed in a single database transaction.
func TestProperty_BatchTransactionBoundaries(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("categories are processed in batches of 50 with proper transaction boundaries", prop.ForAll(
		func(count int) bool {
			if count < 0 {
				return true // Skip negative counts
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				return false
			}
			defer db.Close()

			persister := NewDBPersister(db)

			// Create categories
			categories := make([]model.Category, count)
			for i := 0; i < count; i++ {
				categories[i] = model.Category{
					Name:           "Category",
					Slug:           "category",
					ExternalID:     "ext",
					HierarchicalID: i,
					IsParent:       true,
					IsActive:       true,
				}
			}

			// Calculate expected number of batches
			expectedBatches := (count + 49) / 50 // Ceiling division
			if count == 0 {
				expectedBatches = 0
			}

			// Set up mock expectations for each batch
			for batchNum := 0; batchNum < expectedBatches; batchNum++ {
				batchStart := batchNum * 50
				batchEnd := batchStart + 50
				if batchEnd > count {
					batchEnd = count
				}
				batchSize := batchEnd - batchStart

				// Each batch should have: BEGIN, PREPARE, N queries, COMMIT
				mock.ExpectBegin()
				mock.ExpectPrepare("INSERT INTO categories")
				for i := 0; i < batchSize; i++ {
					mock.ExpectQuery("INSERT INTO categories").
						WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
				}
				mock.ExpectCommit()
			}

			ctx := context.Background()
			stats, err := persister.PersistCategories(ctx, categories)
			if err != nil {
				return false
			}

			// Verify all items were processed
			if stats.Created != count {
				return false
			}

			// Verify all expectations were met (ensures correct batching)
			if err := mock.ExpectationsWereMet(); err != nil {
				return false
			}

			return true
		},
		gen.IntRange(0, 200), // Test various sizes including edge cases
	))

	properties.Property("products are processed in batches of 50 with proper transaction boundaries", prop.ForAll(
		func(count int) bool {
			if count < 0 {
				return true // Skip negative counts
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				return false
			}
			defer db.Close()

			persister := NewDBPersister(db)

			// Create products
			products := make([]model.Product, count)
			for i := 0; i < count; i++ {
				products[i] = model.Product{
					Name:               "Product",
					Slug:               "product",
					ExternalID:         "ext",
					HierarchicalID:     i,
					HierarchicalParent: 1,
					Price:              99.99,
					Description:        "desc",
					Attributes:         map[string]interface{}{},
					Modifiers:          []interface{}{},
					Images:             []string{},
					IsPublished:        true,
					IsAvailable:        true,
					Stock:              10,
				}
			}

			// Calculate expected number of batches
			expectedBatches := (count + 49) / 50
			if count == 0 {
				expectedBatches = 0
			}

			// Set up mock expectations for each batch
			for batchNum := 0; batchNum < expectedBatches; batchNum++ {
				batchStart := batchNum * 50
				batchEnd := batchStart + 50
				if batchEnd > count {
					batchEnd = count
				}
				batchSize := batchEnd - batchStart

				// Each batch should have: BEGIN, PREPARE, N queries, COMMIT
				mock.ExpectBegin()
				mock.ExpectPrepare("INSERT INTO products")
				for i := 0; i < batchSize; i++ {
					mock.ExpectQuery("INSERT INTO products").
						WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
				}
				mock.ExpectCommit()
			}

			ctx := context.Background()
			stats, err := persister.PersistProducts(ctx, products)
			if err != nil {
				return false
			}

			// Verify all items were processed
			if stats.Created != count {
				return false
			}

			// Verify all expectations were met (ensures correct batching)
			if err := mock.ExpectationsWereMet(); err != nil {
				return false
			}

			return true
		},
		gen.IntRange(0, 200),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 9: Foreign Key Resolution
// For any Product with hierarchicalParent value H, the persisted product's category_id should match
// the id of the Category with hierarchical_id equal to H.
func TestProperty_ForeignKeyResolution(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("product category_id is resolved via hierarchical_parent subquery", prop.ForAll(
		func(hierarchicalParent int) bool {
			if hierarchicalParent <= 0 {
				return true // Skip invalid values
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				return false
			}
			defer db.Close()

			persister := NewDBPersister(db)

			product := model.Product{
				Name:               "Test Product",
				Slug:               "test-product",
				ExternalID:         "prod-123",
				HierarchicalID:     100,
				HierarchicalParent: hierarchicalParent,
				Price:              99.99,
				Description:        "desc",
				Attributes:         map[string]interface{}{},
				Modifiers:          []interface{}{},
				Images:             []string{},
				IsPublished:        true,
				IsAvailable:        true,
				Stock:              10,
			}

			attributesJSON, _ := json.Marshal(product.Attributes)
			modifiersJSON, _ := json.Marshal(product.Modifiers)
			imagesArray := pq.Array(product.Images)

			mock.ExpectBegin()
			mock.ExpectPrepare("INSERT INTO products")

			// The first parameter should be hierarchical_parent for the subquery
			mock.ExpectQuery("INSERT INTO products").
				WithArgs(
					hierarchicalParent, // First arg is for category lookup subquery
					product.Name,
					product.Slug,
					product.Description,
					product.Price,
					product.ExternalID,
					product.HierarchicalID,
					hierarchicalParent, // Also used in the INSERT
					nil,                // article
					nil,                // nom_number
					nil,                // index_number
					attributesJSON,
					modifiersJSON,
					product.IsKit,
					product.IsPublished,
					product.IsAvailable,
					nil, // short_code
					product.Stock,
					imagesArray,
					nil, // image_url
				).
				WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))

			mock.ExpectCommit()

			ctx := context.Background()
			stats, err := persister.PersistProducts(ctx, []model.Product{product})
			if err != nil {
				return false
			}

			if stats.Created != 1 {
				return false
			}

			// Verify the hierarchical_parent was used correctly in the query
			if err := mock.ExpectationsWereMet(); err != nil {
				return false
			}

			return true
		},
		gen.IntRange(1, 1000),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 20: Idempotent Import - Record Updates
// For any nomenclature with an external_id that already exists in the database, importing it again
// should UPDATE the existing record rather than creating a duplicate, preserving the original id
// and created_at values while updating updated_at.
func TestProperty_IdempotentImport_RecordUpdates(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("categories with existing external_id are updated not duplicated", prop.ForAll(
		func(externalID string, name1 string, name2 string) bool {
			if externalID == "" {
				return true // Skip empty external IDs
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				return false
			}
			defer db.Close()

			persister := NewDBPersister(db)

			// First insert
			category1 := model.Category{
				Name:           name1,
				Slug:           "slug",
				ExternalID:     externalID,
				HierarchicalID: 1,
				IsParent:       true,
				IsActive:       true,
			}

			mock.ExpectBegin()
			mock.ExpectPrepare("INSERT INTO categories")
			mock.ExpectQuery("INSERT INTO categories").
				WithArgs(name1, "slug", externalID, 1, nil, true, true, nil).
				WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
			mock.ExpectCommit()

			ctx := context.Background()
			stats1, err := persister.PersistCategories(ctx, []model.Category{category1})
			if err != nil {
				return false
			}

			if stats1.Created != 1 || stats1.Updated != 0 {
				return false
			}

			// Second insert with same external_id but different name (should update)
			category2 := model.Category{
				Name:           name2,
				Slug:           "slug",
				ExternalID:     externalID,
				HierarchicalID: 1,
				IsParent:       true,
				IsActive:       true,
			}

			mock.ExpectBegin()
			mock.ExpectPrepare("INSERT INTO categories")
			mock.ExpectQuery("INSERT INTO categories").
				WithArgs(name2, "slug", externalID, 1, nil, true, true, nil).
				WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(false)) // false = updated
			mock.ExpectCommit()

			stats2, err := persister.PersistCategories(ctx, []model.Category{category2})
			if err != nil {
				return false
			}

			// Second operation should update, not create
			if stats2.Created != 0 || stats2.Updated != 1 {
				return false
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				return false
			}

			return true
		},
		gen.Identifier(),
		gen.AlphaString(),
		gen.AlphaString(),
	))

	properties.Property("products with existing external_id are updated not duplicated", prop.ForAll(
		func(externalID string, price1 float64, price2 float64) bool {
			if externalID == "" {
				return true
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				return false
			}
			defer db.Close()

			persister := NewDBPersister(db)

			// First insert
			product1 := model.Product{
				Name:               "Product",
				Slug:               "product",
				ExternalID:         externalID,
				HierarchicalID:     10,
				HierarchicalParent: 1,
				Price:              price1,
				Description:        "desc",
				Attributes:         map[string]interface{}{},
				Modifiers:          []interface{}{},
				Images:             []string{},
				IsPublished:        true,
				IsAvailable:        true,
				Stock:              10,
			}

			attributesJSON, _ := json.Marshal(product1.Attributes)
			modifiersJSON, _ := json.Marshal(product1.Modifiers)
			imagesArray := pq.Array(product1.Images)

			mock.ExpectBegin()
			mock.ExpectPrepare("INSERT INTO products")
			mock.ExpectQuery("INSERT INTO products").
				WithArgs(
					1, "Product", "product", "desc", price1, externalID,
					10, 1, nil, nil, nil, attributesJSON, modifiersJSON,
					false, true, true, nil, 10, imagesArray, nil,
				).
				WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
			mock.ExpectCommit()

			ctx := context.Background()
			stats1, err := persister.PersistProducts(ctx, []model.Product{product1})
			if err != nil {
				return false
			}

			if stats1.Created != 1 || stats1.Updated != 0 {
				return false
			}

			// Second insert with same external_id but different price (should update)
			product2 := product1
			product2.Price = price2

			attributesJSON2, _ := json.Marshal(product2.Attributes)
			modifiersJSON2, _ := json.Marshal(product2.Modifiers)
			imagesArray2 := pq.Array(product2.Images)

			mock.ExpectBegin()
			mock.ExpectPrepare("INSERT INTO products")
			mock.ExpectQuery("INSERT INTO products").
				WithArgs(
					1, "Product", "product", "desc", price2, externalID,
					10, 1, nil, nil, nil, attributesJSON2, modifiersJSON2,
					false, true, true, nil, 10, imagesArray2, nil,
				).
				WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(false)) // false = updated
			mock.ExpectCommit()

			stats2, err := persister.PersistProducts(ctx, []model.Product{product2})
			if err != nil {
				return false
			}

			// Second operation should update, not create
			if stats2.Created != 0 || stats2.Updated != 1 {
				return false
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				return false
			}

			return true
		},
		gen.Identifier(),
		gen.Float64Range(0, 10000),
		gen.Float64Range(0, 10000),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
