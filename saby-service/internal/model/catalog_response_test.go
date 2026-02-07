package model

import (
	"database/sql"
	"encoding/json"
	"testing"
	"time"
)

func TestNewCategoryResponseFromDB(t *testing.T) {
	createdAt := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	updatedAt := time.Date(2024, 1, 2, 12, 0, 0, 0, time.UTC)

	t.Run("with all fields", func(t *testing.T) {
		description := sql.NullString{String: "Test description", Valid: true}
		imageURL := sql.NullString{String: "http://example.com/image.jpg", Valid: true}
		parentID := sql.NullInt64{Int64: 5, Valid: true}

		resp := NewCategoryResponseFromDB(
			"uuid-123",
			"Test Category",
			"test-category",
			description,
			imageURL,
			true,
			"ext-123",
			10,
			parentID,
			false,
			createdAt,
			updatedAt,
		)

		if resp.ID != "uuid-123" {
			t.Errorf("expected ID 'uuid-123', got '%s'", resp.ID)
		}
		if resp.Name != "Test Category" {
			t.Errorf("expected Name 'Test Category', got '%s'", resp.Name)
		}
		if resp.Description == nil || *resp.Description != "Test description" {
			t.Error("expected Description to be set")
		}
		if resp.ImageURL == nil || *resp.ImageURL != "http://example.com/image.jpg" {
			t.Error("expected ImageURL to be set")
		}
		if resp.ParentHierarchicalID == nil || *resp.ParentHierarchicalID != 5 {
			t.Error("expected ParentHierarchicalID to be 5")
		}
	})

	t.Run("with null fields", func(t *testing.T) {
		description := sql.NullString{Valid: false}
		imageURL := sql.NullString{Valid: false}
		parentID := sql.NullInt64{Valid: false}

		resp := NewCategoryResponseFromDB(
			"uuid-456",
			"Another Category",
			"another-category",
			description,
			imageURL,
			true,
			"ext-456",
			20,
			parentID,
			true,
			createdAt,
			updatedAt,
		)

		if resp.Description != nil {
			t.Error("expected Description to be nil")
		}
		if resp.ImageURL != nil {
			t.Error("expected ImageURL to be nil")
		}
		if resp.ParentHierarchicalID != nil {
			t.Error("expected ParentHierarchicalID to be nil")
		}
	})
}

func TestNewProductResponseFromDB(t *testing.T) {
	createdAt := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	updatedAt := time.Date(2024, 1, 2, 12, 0, 0, 0, time.UTC)

	t.Run("with all fields", func(t *testing.T) {
		categoryID := sql.NullString{String: "cat-uuid-123", Valid: true}
		categoryName := sql.NullString{String: "Test Category", Valid: true}
		description := sql.NullString{String: "Product description", Valid: true}
		discountPrice := sql.NullFloat64{Float64: 99.99, Valid: true}
		imageURL := sql.NullString{String: "http://example.com/product.jpg", Valid: true}
		weight := sql.NullFloat64{Float64: 1.5, Valid: true}
		article := sql.NullString{String: "ART-123", Valid: true}
		nomNumber := sql.NullString{String: "NOM-456", Valid: true}
		indexNumber := sql.NullInt64{Int64: 10, Valid: true}
		shortCode := sql.NullString{String: "SC-789", Valid: true}

		imagesJSON := []byte(`["image1.jpg", "image2.jpg"]`)
		attributesJSON := []byte(`{"color": "red", "size": "large"}`)
		modifiersJSON := []byte(`[{"name": "extra cheese", "price": 2.5}]`)

		resp, err := NewProductResponseFromDB(
			"prod-uuid-123",
			categoryID,
			categoryName,
			"Test Product",
			"test-product",
			description,
			149.99,
			discountPrice,
			imageURL,
			imagesJSON,
			100,
			true,
			true,
			false,
			weight,
			"kg",
			"ext-prod-123",
			30,
			20,
			article,
			nomNumber,
			indexNumber,
			attributesJSON,
			modifiersJSON,
			false,
			true,
			shortCode,
			5,
			createdAt,
			updatedAt,
		)

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if resp.ID != "prod-uuid-123" {
			t.Errorf("expected ID 'prod-uuid-123', got '%s'", resp.ID)
		}
		if resp.Name != "Test Product" {
			t.Errorf("expected Name 'Test Product', got '%s'", resp.Name)
		}
		if resp.CategoryID == nil || *resp.CategoryID != "cat-uuid-123" {
			t.Error("expected CategoryID to be set")
		}
		if resp.CategoryName == nil || *resp.CategoryName != "Test Category" {
			t.Error("expected CategoryName to be set")
		}
		if resp.DiscountPrice == nil || *resp.DiscountPrice != 99.99 {
			t.Error("expected DiscountPrice to be 99.99")
		}
		if len(resp.Images) != 2 {
			t.Errorf("expected 2 images, got %d", len(resp.Images))
		}
		if len(resp.Attributes) != 2 {
			t.Errorf("expected 2 attributes, got %d", len(resp.Attributes))
		}
		if len(resp.Modifiers) != 1 {
			t.Errorf("expected 1 modifier, got %d", len(resp.Modifiers))
		}
	})

	t.Run("with null fields and empty JSON", func(t *testing.T) {
		categoryID := sql.NullString{Valid: false}
		categoryName := sql.NullString{Valid: false}
		description := sql.NullString{Valid: false}
		discountPrice := sql.NullFloat64{Valid: false}
		imageURL := sql.NullString{Valid: false}
		weight := sql.NullFloat64{Valid: false}
		article := sql.NullString{Valid: false}
		nomNumber := sql.NullString{Valid: false}
		indexNumber := sql.NullInt64{Valid: false}
		shortCode := sql.NullString{Valid: false}

		resp, err := NewProductResponseFromDB(
			"prod-uuid-456",
			categoryID,
			categoryName,
			"Simple Product",
			"simple-product",
			description,
			49.99,
			discountPrice,
			imageURL,
			nil,
			50,
			true,
			false,
			false,
			weight,
			"pcs",
			"ext-prod-456",
			40,
			30,
			article,
			nomNumber,
			indexNumber,
			nil,
			nil,
			false,
			true,
			shortCode,
			3,
			createdAt,
			updatedAt,
		)

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if resp.CategoryID != nil {
			t.Error("expected CategoryID to be nil")
		}
		if resp.CategoryName != nil {
			t.Error("expected CategoryName to be nil")
		}
		if resp.Description != nil {
			t.Error("expected Description to be nil")
		}
		if resp.DiscountPrice != nil {
			t.Error("expected DiscountPrice to be nil")
		}
		if len(resp.Images) != 0 {
			t.Errorf("expected 0 images, got %d", len(resp.Images))
		}
		if len(resp.Attributes) != 0 {
			t.Errorf("expected 0 attributes, got %d", len(resp.Attributes))
		}
		if len(resp.Modifiers) != 0 {
			t.Errorf("expected 0 modifiers, got %d", len(resp.Modifiers))
		}
	})

	t.Run("with invalid JSON", func(t *testing.T) {
		invalidJSON := []byte(`{invalid json}`)

		_, err := NewProductResponseFromDB(
			"prod-uuid-789",
			sql.NullString{Valid: false},
			sql.NullString{Valid: false},
			"Product",
			"product",
			sql.NullString{Valid: false},
			29.99,
			sql.NullFloat64{Valid: false},
			sql.NullString{Valid: false},
			nil,
			10,
			true,
			false,
			false,
			sql.NullFloat64{Valid: false},
			"pcs",
			"ext-789",
			50,
			40,
			sql.NullString{Valid: false},
			sql.NullString{Valid: false},
			sql.NullInt64{Valid: false},
			invalidJSON,
			nil,
			false,
			true,
			sql.NullString{Valid: false},
			1,
			createdAt,
			updatedAt,
		)

		if err == nil {
			t.Error("expected error for invalid JSON, got nil")
		}
	})
}

func TestNewPopularProductResponseFromDB(t *testing.T) {
	productResp := ProductResponse{
		ID:    "prod-123",
		Name:  "Popular Product",
		Price: 99.99,
	}

	popularResp := NewPopularProductResponseFromDB(productResp, 42)

	if popularResp.ID != "prod-123" {
		t.Errorf("expected ID 'prod-123', got '%s'", popularResp.ID)
	}
	if popularResp.OrderCount != 42 {
		t.Errorf("expected OrderCount 42, got %d", popularResp.OrderCount)
	}
}

func TestNewProductListResponse(t *testing.T) {
	products := []ProductResponse{
		{ID: "prod-1", Name: "Product 1"},
		{ID: "prod-2", Name: "Product 2"},
	}

	t.Run("without pagination", func(t *testing.T) {
		resp := NewProductListResponse(products, nil, nil, nil)

		if len(resp.Products) != 2 {
			t.Errorf("expected 2 products, got %d", len(resp.Products))
		}
		if resp.Total != nil {
			t.Error("expected Total to be nil")
		}
		if resp.Page != nil {
			t.Error("expected Page to be nil")
		}
		if resp.Pages != nil {
			t.Error("expected Pages to be nil")
		}
	})

	t.Run("with pagination", func(t *testing.T) {
		total := 100
		page := 2
		limit := 10

		resp := NewProductListResponse(products, &total, &page, &limit)

		if len(resp.Products) != 2 {
			t.Errorf("expected 2 products, got %d", len(resp.Products))
		}
		if resp.Total == nil || *resp.Total != 100 {
			t.Error("expected Total to be 100")
		}
		if resp.Page == nil || *resp.Page != 2 {
			t.Error("expected Page to be 2")
		}
		if resp.Pages == nil || *resp.Pages != 10 {
			t.Error("expected Pages to be 10")
		}
	})

	t.Run("pagination with remainder", func(t *testing.T) {
		total := 95
		page := 1
		limit := 10

		resp := NewProductListResponse(products, &total, &page, &limit)

		// 95 / 10 = 9.5, should round up to 10 pages
		if resp.Pages == nil || *resp.Pages != 10 {
			t.Errorf("expected Pages to be 10, got %d", *resp.Pages)
		}
	})
}

func TestProductResponseJSONSerialization(t *testing.T) {
	resp := ProductResponse{
		ID:                 "prod-123",
		Name:               "Test Product",
		Price:              99.99,
		Images:             []string{"img1.jpg", "img2.jpg"},
		Attributes:         map[string]interface{}{"color": "blue"},
		Modifiers:          []interface{}{map[string]interface{}{"name": "extra"}},
		IsAvailable:        true,
		Unit:               "kg",
		ExternalID:         "ext-123",
		HierarchicalID:     10,
		HierarchicalParent: 5,
		IsKit:              false,
		IsPublished:        true,
		Sort:               1,
		CreatedAt:          "2024-01-01T12:00:00Z",
		UpdatedAt:          "2024-01-02T12:00:00Z",
	}

	jsonData, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("failed to marshal ProductResponse: %v", err)
	}

	var unmarshaled ProductResponse
	if err := json.Unmarshal(jsonData, &unmarshaled); err != nil {
		t.Fatalf("failed to unmarshal ProductResponse: %v", err)
	}

	if unmarshaled.ID != resp.ID {
		t.Errorf("expected ID '%s', got '%s'", resp.ID, unmarshaled.ID)
	}
	if len(unmarshaled.Images) != len(resp.Images) {
		t.Errorf("expected %d images, got %d", len(resp.Images), len(unmarshaled.Images))
	}
}
