package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
)

// mockCatalogService is a mock implementation of CatalogService for testing
type mockCatalogService struct {
	getCategoriesFunc      func(ctx context.Context) ([]model.CategoryResponse, error)
	getProductsFunc        func(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error)
	getPopularProductsFunc func(ctx context.Context, limit int) ([]model.PopularProductResponse, error)
}

func (m *mockCatalogService) GetCategories(ctx context.Context) ([]model.CategoryResponse, error) {
	if m.getCategoriesFunc != nil {
		return m.getCategoriesFunc(ctx)
	}
	return nil, nil
}

func (m *mockCatalogService) GetProducts(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
	if m.getProductsFunc != nil {
		return m.getProductsFunc(ctx, filter)
	}
	return nil, nil
}

func (m *mockCatalogService) GetPopularProducts(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
	if m.getPopularProductsFunc != nil {
		return m.getPopularProductsFunc(ctx, limit)
	}
	return nil, nil
}

// TestGetCategories_Success tests successful category retrieval
// **Validates: Requirements 1.1**
func TestGetCategories_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns categories
	mockService := &mockCatalogService{
		getCategoriesFunc: func(ctx context.Context) ([]model.CategoryResponse, error) {
			return []model.CategoryResponse{
				{
					ID:             "cat-1",
					Name:           "Category 1",
					Slug:           "category-1",
					IsActive:       true,
					ExternalID:     "ext-1",
					HierarchicalID: 1,
					IsParent:       false,
					CreatedAt:      "2024-01-01T00:00:00Z",
					UpdatedAt:      "2024-01-01T00:00:00Z",
				},
				{
					ID:             "cat-2",
					Name:           "Category 2",
					Slug:           "category-2",
					IsActive:       true,
					ExternalID:     "ext-2",
					HierarchicalID: 2,
					IsParent:       true,
					CreatedAt:      "2024-01-01T00:00:00Z",
					UpdatedAt:      "2024-01-01T00:00:00Z",
				},
			}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/categories", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetCategories(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body
	var categories []model.CategoryResponse
	if err := json.Unmarshal(w.Body.Bytes(), &categories); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response contains 2 categories
	if len(categories) != 2 {
		t.Errorf("Expected 2 categories, got %d", len(categories))
	}

	// Verify first category
	if categories[0].ID != "cat-1" {
		t.Errorf("Expected category ID 'cat-1', got %s", categories[0].ID)
	}

	if categories[0].Name != "Category 1" {
		t.Errorf("Expected category name 'Category 1', got %s", categories[0].Name)
	}
}

// TestGetCategories_ServiceError tests error handling when service fails
// **Validates: Requirements 4.1, 4.2**
func TestGetCategories_ServiceError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns an error
	mockService := &mockCatalogService{
		getCategoriesFunc: func(ctx context.Context) ([]model.CategoryResponse, error) {
			return nil, errors.New("database connection failed")
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/categories", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetCategories(c)

	// Verify response status is 500 Internal Server Error
	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}

	// Parse error response
	var errorResponse model.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
		t.Fatalf("Failed to unmarshal error response: %v", err)
	}

	// Verify error code and message
	if errorResponse.Error.Code != "DATABASE_ERROR" {
		t.Errorf("Expected error code 'DATABASE_ERROR', got %s", errorResponse.Error.Code)
	}

	if errorResponse.Error.Message != "Failed to retrieve categories" {
		t.Errorf("Expected message 'Failed to retrieve categories', got %s", errorResponse.Error.Message)
	}
}

// TestGetProducts_Success_NoPagination tests successful product retrieval without pagination
// **Validates: Requirements 2.1**
func TestGetProducts_Success_NoPagination(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns products
	mockService := &mockCatalogService{
		getProductsFunc: func(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
			products := []model.ProductResponse{
				{
					ID:                 "prod-1",
					Name:               "Product 1",
					Slug:               "product-1",
					Price:              100.50,
					Stock:              10,
					IsAvailable:        true,
					Unit:               "шт",
					ExternalID:         "ext-1",
					HierarchicalID:     1,
					HierarchicalParent: 0,
					Sort:               100,
					CreatedAt:          "2024-01-01T00:00:00Z",
					UpdatedAt:          "2024-01-01T00:00:00Z",
					Images:             []string{},
					Attributes:         make(map[string]interface{}),
					Modifiers:          []interface{}{},
				},
			}
			return &model.ProductListResponse{
				Products: products,
			}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body as array (no pagination)
	var products []model.ProductResponse
	if err := json.Unmarshal(w.Body.Bytes(), &products); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response contains 1 product
	if len(products) != 1 {
		t.Errorf("Expected 1 product, got %d", len(products))
	}

	// Verify product details
	if products[0].ID != "prod-1" {
		t.Errorf("Expected product ID 'prod-1', got %s", products[0].ID)
	}
}

// TestGetProducts_Success_WithPagination tests successful product retrieval with pagination
// **Validates: Requirements 2.1, 2.5, 2.8**
func TestGetProducts_Success_WithPagination(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns paginated products
	mockService := &mockCatalogService{
		getProductsFunc: func(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
			products := []model.ProductResponse{
				{
					ID:                 "prod-1",
					Name:               "Product 1",
					Slug:               "product-1",
					Price:              100.50,
					Stock:              10,
					IsAvailable:        true,
					Unit:               "шт",
					ExternalID:         "ext-1",
					HierarchicalID:     1,
					HierarchicalParent: 0,
					Sort:               100,
					CreatedAt:          "2024-01-01T00:00:00Z",
					UpdatedAt:          "2024-01-01T00:00:00Z",
					Images:             []string{},
					Attributes:         make(map[string]interface{}),
					Modifiers:          []interface{}{},
				},
			}
			total := 50
			page := 1
			pages := 5
			return &model.ProductListResponse{
				Products: products,
				Total:    &total,
				Page:     &page,
				Pages:    &pages,
			}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request with pagination
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products?page=1&limit=10", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body as object (with pagination)
	var response model.ProductListResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify pagination metadata
	if response.Total == nil || *response.Total != 50 {
		t.Errorf("Expected total 50, got %v", response.Total)
	}

	if response.Page == nil || *response.Page != 1 {
		t.Errorf("Expected page 1, got %v", response.Page)
	}

	if response.Pages == nil || *response.Pages != 5 {
		t.Errorf("Expected pages 5, got %v", response.Pages)
	}

	// Verify products
	if len(response.Products) != 1 {
		t.Errorf("Expected 1 product, got %d", len(response.Products))
	}
}

// TestGetProducts_WithFilters tests product retrieval with filters
// **Validates: Requirements 2.2, 2.3, 2.4**
func TestGetProducts_WithFilters(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var capturedFilter model.ProductFilter

	// Create mock service that captures the filter
	mockService := &mockCatalogService{
		getProductsFunc: func(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
			capturedFilter = filter
			return &model.ProductListResponse{
				Products: []model.ProductResponse{},
			}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request with filters
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products?category=cat-123&hierarchical_parent=5&search=pizza", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify filters were passed correctly
	if capturedFilter.CategoryID == nil || *capturedFilter.CategoryID != "cat-123" {
		t.Errorf("Expected category filter 'cat-123', got %v", capturedFilter.CategoryID)
	}

	if capturedFilter.HierarchicalParent == nil || *capturedFilter.HierarchicalParent != 5 {
		t.Errorf("Expected hierarchical_parent filter 5, got %v", capturedFilter.HierarchicalParent)
	}

	if capturedFilter.Search == nil || *capturedFilter.Search != "pizza" {
		t.Errorf("Expected search filter 'pizza', got %v", capturedFilter.Search)
	}
}

// TestGetProducts_InvalidPageParameter tests validation of page parameter
// **Validates: Requirements 2.10, 4.3**
func TestGetProducts_InvalidPageParameter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := &mockCatalogService{}
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	testCases := []struct {
		name     string
		pageVal  string
		limitVal string
	}{
		{"invalid page format", "abc", "10"},
		{"zero page", "0", "10"},
		{"negative page", "-1", "10"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/catalog/products?page="+tc.pageVal+"&limit="+tc.limitVal, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.GetProducts(c)

			// Verify response status is 400 Bad Request
			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400, got %d", w.Code)
			}

			// Parse error response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Fatalf("Failed to unmarshal error response: %v", err)
			}

			// Verify error code
			if errorResponse.Error.Code != "INVALID_PARAMETER" {
				t.Errorf("Expected error code 'INVALID_PARAMETER', got %s", errorResponse.Error.Code)
			}
		})
	}
}

// TestGetProducts_InvalidLimitParameter tests validation of limit parameter
// **Validates: Requirements 2.10, 4.3**
func TestGetProducts_InvalidLimitParameter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := &mockCatalogService{}
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	testCases := []struct {
		name     string
		pageVal  string
		limitVal string
	}{
		{"invalid limit format", "1", "abc"},
		{"zero limit", "1", "0"},
		{"negative limit", "1", "-1"},
		{"limit too large", "1", "101"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/catalog/products?page="+tc.pageVal+"&limit="+tc.limitVal, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.GetProducts(c)

			// Verify response status is 400 Bad Request
			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400, got %d", w.Code)
			}

			// Parse error response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Fatalf("Failed to unmarshal error response: %v", err)
			}

			// Verify error code
			if errorResponse.Error.Code != "INVALID_PARAMETER" {
				t.Errorf("Expected error code 'INVALID_PARAMETER', got %s", errorResponse.Error.Code)
			}
		})
	}
}

// TestGetProducts_IncompletePagination tests validation when only page or limit is provided
// **Validates: Requirements 2.10, 4.3**
func TestGetProducts_IncompletePagination(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := &mockCatalogService{}
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	testCases := []struct {
		name  string
		query string
	}{
		{"only page", "?page=1"},
		{"only limit", "?limit=10"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/catalog/products"+tc.query, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.GetProducts(c)

			// Verify response status is 400 Bad Request
			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400, got %d", w.Code)
			}

			// Parse error response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Fatalf("Failed to unmarshal error response: %v", err)
			}

			// Verify error message
			if errorResponse.Error.Message != "both page and limit must be provided for pagination" {
				t.Errorf("Unexpected error message: %s", errorResponse.Error.Message)
			}
		})
	}
}

// TestGetProducts_ServiceError tests error handling when service fails
// **Validates: Requirements 4.1, 4.2**
func TestGetProducts_ServiceError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns an error
	mockService := &mockCatalogService{
		getProductsFunc: func(ctx context.Context, filter model.ProductFilter) (*model.ProductListResponse, error) {
			return nil, errors.New("database query failed")
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetProducts(c)

	// Verify response status is 500 Internal Server Error
	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}

	// Parse error response
	var errorResponse model.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
		t.Fatalf("Failed to unmarshal error response: %v", err)
	}

	// Verify error code
	if errorResponse.Error.Code != "DATABASE_ERROR" {
		t.Errorf("Expected error code 'DATABASE_ERROR', got %s", errorResponse.Error.Code)
	}
}

// TestGetPopularProducts_Success tests successful popular products retrieval
// **Validates: Requirements 3.1**
func TestGetPopularProducts_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns popular products
	mockService := &mockCatalogService{
		getPopularProductsFunc: func(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
			return []model.PopularProductResponse{
				{
					ProductResponse: model.ProductResponse{
						ID:                 "prod-1",
						Name:               "Popular Product 1",
						Slug:               "popular-product-1",
						Price:              150.00,
						Stock:              20,
						IsAvailable:        true,
						IsPopular:          true,
						Unit:               "шт",
						ExternalID:         "ext-1",
						HierarchicalID:     1,
						HierarchicalParent: 0,
						Sort:               100,
						CreatedAt:          "2024-01-01T00:00:00Z",
						UpdatedAt:          "2024-01-01T00:00:00Z",
						Images:             []string{},
						Attributes:         make(map[string]interface{}),
						Modifiers:          []interface{}{},
					},
					OrderCount: 42,
				},
			}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products/popular", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetPopularProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body
	var products []model.PopularProductResponse
	if err := json.Unmarshal(w.Body.Bytes(), &products); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response contains 1 product
	if len(products) != 1 {
		t.Errorf("Expected 1 product, got %d", len(products))
	}

	// Verify product details
	if products[0].ID != "prod-1" {
		t.Errorf("Expected product ID 'prod-1', got %s", products[0].ID)
	}

	if products[0].OrderCount != 42 {
		t.Errorf("Expected order count 42, got %d", products[0].OrderCount)
	}
}

// TestGetPopularProducts_WithLimit tests popular products with custom limit
// **Validates: Requirements 3.2, 3.6**
func TestGetPopularProducts_WithLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var capturedLimit int

	// Create mock service that captures the limit
	mockService := &mockCatalogService{
		getPopularProductsFunc: func(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
			capturedLimit = limit
			return []model.PopularProductResponse{}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request with custom limit
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products/popular?limit=20", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetPopularProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify limit was passed correctly
	if capturedLimit != 20 {
		t.Errorf("Expected limit 20, got %d", capturedLimit)
	}
}

// TestGetPopularProducts_DefaultLimit tests popular products with default limit
// **Validates: Requirements 3.2**
func TestGetPopularProducts_DefaultLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var capturedLimit int

	// Create mock service that captures the limit
	mockService := &mockCatalogService{
		getPopularProductsFunc: func(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
			capturedLimit = limit
			return []model.PopularProductResponse{}, nil
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request without limit (should use default)
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products/popular", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetPopularProducts(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Verify default limit of 8 was used
	if capturedLimit != 8 {
		t.Errorf("Expected default limit 8, got %d", capturedLimit)
	}
}

// TestGetPopularProducts_InvalidLimit tests validation of limit parameter
// **Validates: Requirements 3.6, 4.3**
func TestGetPopularProducts_InvalidLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockService := &mockCatalogService{}
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	testCases := []struct {
		name     string
		limitVal string
	}{
		{"invalid format", "abc"},
		{"zero", "0"},
		{"negative", "-1"},
		{"too large", "101"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/catalog/products/popular?limit="+tc.limitVal, nil)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.GetPopularProducts(c)

			// Verify response status is 400 Bad Request
			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400, got %d", w.Code)
			}

			// Parse error response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Fatalf("Failed to unmarshal error response: %v", err)
			}

			// Verify error code
			if errorResponse.Error.Code != "INVALID_PARAMETER" {
				t.Errorf("Expected error code 'INVALID_PARAMETER', got %s", errorResponse.Error.Code)
			}
		})
	}
}

// TestGetPopularProducts_ServiceError tests error handling when service fails
// **Validates: Requirements 4.1, 4.2**
func TestGetPopularProducts_ServiceError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service that returns an error
	mockService := &mockCatalogService{
		getPopularProductsFunc: func(ctx context.Context, limit int) ([]model.PopularProductResponse, error) {
			return nil, errors.New("database connection lost")
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewCatalogHandler(mockService, logger)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/products/popular", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetPopularProducts(c)

	// Verify response status is 500 Internal Server Error
	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}

	// Parse error response
	var errorResponse model.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
		t.Fatalf("Failed to unmarshal error response: %v", err)
	}

	// Verify error code
	if errorResponse.Error.Code != "DATABASE_ERROR" {
		t.Errorf("Expected error code 'DATABASE_ERROR', got %s", errorResponse.Error.Code)
	}
}
