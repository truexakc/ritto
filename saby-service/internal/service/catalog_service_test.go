package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"saby-service/internal/model"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestGetCategories_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	// Mock data
	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "slug", "description", "image_url", "is_active",
		"external_id", "hierarchical_id", "parent_hierarchical_id", "is_parent",
		"created_at", "updated_at",
	}).
		AddRow(
			"cat-1", "Category 1", "category-1", "Description 1", "/img1.jpg", true,
			"ext-1", 1, nil, true,
			now, now,
		).
		AddRow(
			"cat-2", "Category 2", "category-2", nil, nil, true,
			"ext-2", 2, 1, false,
			now, now,
		)

	mock.ExpectQuery("SELECT (.+) FROM categories WHERE is_active = true ORDER BY name ASC").
		WillReturnRows(rows)

	ctx := context.Background()
	categories, err := service.GetCategories(ctx)
	if err != nil {
		t.Fatalf("GetCategories failed: %v", err)
	}

	if len(categories) != 2 {
		t.Errorf("expected 2 categories, got %d", len(categories))
	}

	if categories[0].Name != "Category 1" {
		t.Errorf("expected name 'Category 1', got '%s'", categories[0].Name)
	}

	if categories[1].Description != nil {
		t.Errorf("expected nil description, got '%v'", categories[1].Description)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetCategories_Empty(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	rows := sqlmock.NewRows([]string{
		"id", "name", "slug", "description", "image_url", "is_active",
		"external_id", "hierarchical_id", "parent_hierarchical_id", "is_parent",
		"created_at", "updated_at",
	})

	mock.ExpectQuery("SELECT (.+) FROM categories WHERE is_active = true ORDER BY name ASC").
		WillReturnRows(rows)

	ctx := context.Background()
	categories, err := service.GetCategories(ctx)
	if err != nil {
		t.Fatalf("GetCategories failed: %v", err)
	}

	if len(categories) != 0 {
		t.Errorf("expected 0 categories, got %d", len(categories))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetProducts_NoFilters(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	// Mock data
	now := time.Now()
	attributes := map[string]interface{}{"color": "red"}
	modifiers := []interface{}{"spicy"}
	images := []string{"/img1.jpg"}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesJSON, _ := json.Marshal(images)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at",
	}).
		AddRow(
			"prod-1", "cat-1", "Category 1", "Product 1", "product-1", "Description",
			99.99, nil, "/img1.jpg", imagesJSON, 10, true,
			false, false, 1.5, "kg", "ext-1",
			10, 1, nil, nil,
			nil, attributesJSON, modifiersJSON, false, true,
			nil, 100, now, now,
		)

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c").
		WillReturnRows(rows)

	ctx := context.Background()
	filter := model.ProductFilter{}
	response, err := service.GetProducts(ctx, filter)
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if len(response.Products) != 1 {
		t.Errorf("expected 1 product, got %d", len(response.Products))
	}

	if response.Products[0].Name != "Product 1" {
		t.Errorf("expected name 'Product 1', got '%s'", response.Products[0].Name)
	}

	if response.Total != nil {
		t.Errorf("expected nil total (no pagination), got %v", *response.Total)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetProducts_WithCategoryFilter(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	categoryID := "cat-1"
	filter := model.ProductFilter{
		CategoryID: &categoryID,
	}

	now := time.Now()
	attributes := map[string]interface{}{}
	modifiers := []interface{}{}
	images := []string{}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesJSON, _ := json.Marshal(images)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at",
	}).
		AddRow(
			"prod-1", "cat-1", "Category 1", "Product 1", "product-1", nil,
			99.99, nil, nil, imagesJSON, 10, true,
			false, false, nil, "kg", "ext-1",
			10, 1, nil, nil,
			nil, attributesJSON, modifiersJSON, false, true,
			nil, 100, now, now,
		)

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c (.+) AND p.category_id = (.+)").
		WithArgs(categoryID).
		WillReturnRows(rows)

	ctx := context.Background()
	response, err := service.GetProducts(ctx, filter)
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if len(response.Products) != 1 {
		t.Errorf("expected 1 product, got %d", len(response.Products))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetProducts_WithPagination(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	page := 1
	limit := 10
	filter := model.ProductFilter{
		Page:  &page,
		Limit: &limit,
	}

	// Mock count query
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(25)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM products p WHERE 1=1").
		WillReturnRows(countRows)

	// Mock products query
	now := time.Now()
	attributes := map[string]interface{}{}
	modifiers := []interface{}{}
	images := []string{}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesJSON, _ := json.Marshal(images)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at",
	}).
		AddRow(
			"prod-1", nil, nil, "Product 1", "product-1", nil,
			99.99, nil, nil, imagesJSON, 10, true,
			false, false, nil, "kg", "ext-1",
			10, 1, nil, nil,
			nil, attributesJSON, modifiersJSON, false, true,
			nil, 100, now, now,
		)

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c (.+) LIMIT (.+) OFFSET (.+)").
		WithArgs(limit, 0).
		WillReturnRows(rows)

	ctx := context.Background()
	response, err := service.GetProducts(ctx, filter)
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if response.Total == nil || *response.Total != 25 {
		t.Errorf("expected total 25, got %v", response.Total)
	}

	if response.Page == nil || *response.Page != 1 {
		t.Errorf("expected page 1, got %v", response.Page)
	}

	if response.Pages == nil || *response.Pages != 3 {
		t.Errorf("expected 3 pages, got %v", response.Pages)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetProducts_WithSearchFilter(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	search := "pizza"
	filter := model.ProductFilter{
		Search: &search,
	}

	now := time.Now()
	attributes := map[string]interface{}{}
	modifiers := []interface{}{}
	images := []string{}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesJSON, _ := json.Marshal(images)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at",
	}).
		AddRow(
			"prod-1", nil, nil, "Pizza Margherita", "pizza-margherita", nil,
			99.99, nil, nil, imagesJSON, 10, true,
			false, false, nil, "kg", "ext-1",
			10, 1, nil, nil,
			nil, attributesJSON, modifiersJSON, false, true,
			nil, 100, now, now,
		)

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c (.+) AND \\(p.name ILIKE (.+) OR p.description ILIKE (.+)\\)").
		WithArgs("%pizza%").
		WillReturnRows(rows)

	ctx := context.Background()
	response, err := service.GetProducts(ctx, filter)
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if len(response.Products) != 1 {
		t.Errorf("expected 1 product, got %d", len(response.Products))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetPopularProducts_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	now := time.Now()
	attributes := map[string]interface{}{}
	modifiers := []interface{}{}
	images := []string{"/img1.jpg"}

	attributesJSON, _ := json.Marshal(attributes)
	modifiersJSON, _ := json.Marshal(modifiers)
	imagesJSON, _ := json.Marshal(images)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at", "order_count",
	}).
		AddRow(
			"prod-1", "cat-1", "Category 1", "Popular Product", "popular-product", nil,
			99.99, nil, "/img1.jpg", imagesJSON, 10, true,
			true, true, nil, "kg", "ext-1",
			10, 1, nil, nil,
			nil, attributesJSON, modifiersJSON, false, true,
			nil, 100, now, now, 42,
		)

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c (.+) LEFT JOIN order_items oi (.+) WHERE p.is_popular = true OR p.is_featured = true").
		WithArgs(8).
		WillReturnRows(rows)

	ctx := context.Background()
	products, err := service.GetPopularProducts(ctx, 8)
	if err != nil {
		t.Fatalf("GetPopularProducts failed: %v", err)
	}

	if len(products) != 1 {
		t.Errorf("expected 1 product, got %d", len(products))
	}

	if products[0].Name != "Popular Product" {
		t.Errorf("expected name 'Popular Product', got '%s'", products[0].Name)
	}

	if products[0].OrderCount != 42 {
		t.Errorf("expected order count 42, got %d", products[0].OrderCount)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetPopularProducts_Empty(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	rows := sqlmock.NewRows([]string{
		"id", "category_id", "category_name", "name", "slug", "description",
		"price", "discount_price", "image_url", "images", "stock", "is_available",
		"is_featured", "is_popular", "weight", "unit", "external_id",
		"hierarchical_id", "hierarchical_parent", "article", "nom_number",
		"index_number", "attributes", "modifiers", "is_kit", "is_published",
		"short_code", "sort", "created_at", "updated_at", "order_count",
	})

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c (.+) LEFT JOIN order_items oi (.+) WHERE p.is_popular = true OR p.is_featured = true").
		WithArgs(8).
		WillReturnRows(rows)

	ctx := context.Background()
	products, err := service.GetPopularProducts(ctx, 8)
	if err != nil {
		t.Fatalf("GetPopularProducts failed: %v", err)
	}

	if len(products) != 0 {
		t.Errorf("expected 0 products, got %d", len(products))
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetCategories_DatabaseError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	mock.ExpectQuery("SELECT (.+) FROM categories WHERE is_active = true ORDER BY name ASC").
		WillReturnError(sql.ErrConnDone)

	ctx := context.Background()
	_, err = service.GetCategories(ctx)
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

func TestGetProducts_DatabaseError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create mock: %v", err)
	}
	defer db.Close()

	service := NewCatalogService(db, nil)

	filter := model.ProductFilter{}

	mock.ExpectQuery("SELECT (.+) FROM products p LEFT JOIN categories c").
		WillReturnError(sql.ErrConnDone)

	ctx := context.Background()
	_, err = service.GetProducts(ctx, filter)
	if err == nil {
		t.Error("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}
