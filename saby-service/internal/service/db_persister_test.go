package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"

	"saby-service/internal/model"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
)

func TestPersistCategories_InsertSQL(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	categories := []model.Category{
		{
			Name:           "Test Category",
			Slug:           "test-category",
			ExternalID:     "ext-123",
			HierarchicalID: 1,
			IsParent:       true,
			IsActive:       true,
		},
	}

	// Expect transaction begin
	mock.ExpectBegin()

	// Expect prepare statement
	mock.ExpectPrepare("INSERT INTO categories")

	// Expect query with specific parameters
	mock.ExpectQuery("INSERT INTO categories").
		WithArgs(
			"Test Category",
			"test-category",
			"ext-123",
			1,
			nil,
			true,
			true,
			nil,
		).
		WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))

	// Expect commit
	mock.ExpectCommit()

	ctx := context.Background()
	stats, err := persister.PersistCategories(ctx, categories)
	if err != nil {
		t.Fatalf("PersistCategories failed: %v", err)
	}

	if stats.Created != 1 {
		t.Errorf("expected 1 created, got %d", stats.Created)
	}

	if stats.Updated != 0 {
		t.Errorf("expected 0 updated, got %d", stats.Updated)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestPersistProducts_InsertSQL(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	attributes := map[string]interface{}{"color": "red"}
	modifiers := []interface{}{"spicy"}
	images := []string{"/path/to/image.jpg"}

	products := []model.Product{
		{
			Name:               "Test Product",
			Slug:               "test-product",
			Description:        "A test product",
			Price:              99.99,
			ExternalID:         "prod-123",
			HierarchicalID:     10,
			HierarchicalParent: 1,
			Attributes:         attributes,
			Modifiers:          modifiers,
			IsKit:              false,
			IsPublished:        true,
			IsAvailable:        true,
			Stock:              100,
			Images:             images,
		},
	}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesArray := pq.Array(images)

	// Expect transaction begin
	mock.ExpectBegin()

	// Expect prepare statement
	mock.ExpectPrepare("INSERT INTO products")

	// Expect query with specific parameters
	mock.ExpectQuery("INSERT INTO products").
		WithArgs(
			1, // hierarchical_parent for category lookup
			"Test Product",
			"test-product",
			"A test product",
			99.99,
			"prod-123",
			10,
			1,
			nil, // article
			nil, // nom_number
			nil, // index_number
			attributesJSON,
			modifiersJSON,
			false,
			true,
			true,
			nil, // short_code
			100,
			imagesArray,
			nil, // image_url
		).
		WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))

	// Expect commit
	mock.ExpectCommit()

	ctx := context.Background()
	stats, err := persister.PersistProducts(ctx, products)
	if err != nil {
		t.Fatalf("PersistProducts failed: %v", err)
	}

	if stats.Created != 1 {
		t.Errorf("expected 1 created, got %d", stats.Created)
	}

	if stats.Updated != 0 {
		t.Errorf("expected 0 updated, got %d", stats.Updated)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestPersistCategories_TransactionRollback(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	categories := []model.Category{
		{
			Name:           "Test Category",
			Slug:           "test-category",
			ExternalID:     "ext-123",
			HierarchicalID: 1,
			IsParent:       true,
			IsActive:       true,
		},
	}

	// Expect transaction begin
	mock.ExpectBegin()

	// Expect prepare statement
	mock.ExpectPrepare("INSERT INTO categories")

	// Expect query to fail
	mock.ExpectQuery("INSERT INTO categories").
		WithArgs(
			"Test Category",
			"test-category",
			"ext-123",
			1,
			nil,
			true,
			true,
			nil,
		).
		WillReturnError(sql.ErrConnDone)

	// Expect rollback
	mock.ExpectRollback()

	ctx := context.Background()
	_, err = persister.PersistCategories(ctx, categories)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestPersistProducts_TransactionRollback(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	products := []model.Product{
		{
			Name:               "Test Product",
			Slug:               "test-product",
			Description:        "A test product",
			Price:              99.99,
			ExternalID:         "prod-123",
			HierarchicalID:     10,
			HierarchicalParent: 1,
			Attributes:         map[string]interface{}{},
			Modifiers:          []interface{}{},
			IsKit:              false,
			IsPublished:        true,
			IsAvailable:        true,
			Stock:              100,
			Images:             []string{},
		},
	}

	// Expect transaction begin
	mock.ExpectBegin()

	// Expect prepare statement
	mock.ExpectPrepare("INSERT INTO products")

	// Expect query to fail
	mock.ExpectQuery("INSERT INTO products").
		WillReturnError(sql.ErrConnDone)

	// Expect rollback
	mock.ExpectRollback()

	ctx := context.Background()
	_, err = persister.PersistProducts(ctx, products)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestPersistCategories_UpdateExisting(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	categories := []model.Category{
		{
			Name:           "Updated Category",
			Slug:           "test-category",
			ExternalID:     "ext-123",
			HierarchicalID: 1,
			IsParent:       true,
			IsActive:       true,
		},
	}

	// Expect transaction begin
	mock.ExpectBegin()

	// Expect prepare statement
	mock.ExpectPrepare("INSERT INTO categories")

	// Expect query with inserted=false (indicating update)
	mock.ExpectQuery("INSERT INTO categories").
		WithArgs(
			"Updated Category",
			"test-category",
			"ext-123",
			1,
			nil,
			true,
			true,
			nil,
		).
		WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(false))

	// Expect commit
	mock.ExpectCommit()

	ctx := context.Background()
	stats, err := persister.PersistCategories(ctx, categories)
	if err != nil {
		t.Fatalf("PersistCategories failed: %v", err)
	}

	if stats.Created != 0 {
		t.Errorf("expected 0 created, got %d", stats.Created)
	}

	if stats.Updated != 1 {
		t.Errorf("expected 1 updated, got %d", stats.Updated)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestPersistCategories_BatchProcessing(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	persister := NewDBPersister(db)

	// Create 75 categories to test batching (should be 2 batches: 50 + 25)
	categories := make([]model.Category, 75)
	for i := 0; i < 75; i++ {
		categories[i] = model.Category{
			Name:           "Category",
			Slug:           "category",
			ExternalID:     "ext",
			HierarchicalID: i,
			IsParent:       true,
			IsActive:       true,
		}
	}

	// First batch (50 items)
	mock.ExpectBegin()
	mock.ExpectPrepare("INSERT INTO categories")
	for i := 0; i < 50; i++ {
		mock.ExpectQuery("INSERT INTO categories").
			WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
	}
	mock.ExpectCommit()

	// Second batch (25 items)
	mock.ExpectBegin()
	mock.ExpectPrepare("INSERT INTO categories")
	for i := 0; i < 25; i++ {
		mock.ExpectQuery("INSERT INTO categories").
			WillReturnRows(sqlmock.NewRows([]string{"inserted"}).AddRow(true))
	}
	mock.ExpectCommit()

	ctx := context.Background()
	stats, err := persister.PersistCategories(ctx, categories)
	if err != nil {
		t.Fatalf("PersistCategories failed: %v", err)
	}

	if stats.Created != 75 {
		t.Errorf("expected 75 created, got %d", stats.Created)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}
