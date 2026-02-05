package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
	"saby-service/internal/service"
)

// mockImportService is a mock implementation of ImportService for testing
type mockImportService struct {
	startImportFunc func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error)
	getStatusFunc   func() *model.ImportStatus
}

func (m *mockImportService) StartImport(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
	if m.startImportFunc != nil {
		return m.startImportFunc(ctx, params)
	}
	return nil, nil
}

func (m *mockImportService) GetStatus() *model.ImportStatus {
	if m.getStatusFunc != nil {
		return m.getStatusFunc()
	}
	return nil
}

// mockImportLock is a mock implementation of ImportLock for testing
type mockImportLock struct {
	tryAcquireFunc func() bool
	releaseFunc    func()
}

func (m *mockImportLock) TryAcquire() bool {
	if m.tryAcquireFunc != nil {
		return m.tryAcquireFunc()
	}
	return true
}

func (m *mockImportLock) Release() {
	if m.releaseFunc != nil {
		m.releaseFunc()
	}
}

// Test 202 response on successful trigger
// **Validates: Requirements 7.3**
func TestTriggerImport_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service and lock
	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			return &model.ImportStats{
				CategoriesCreated: 10,
				CategoriesUpdated: 5,
				ProductsCreated:   50,
				ProductsUpdated:   20,
			}, nil
		},
	}

	lockAcquired := false
	lockReleased := false
	mockLock := &mockImportLock{
		tryAcquireFunc: func() bool {
			lockAcquired = true
			return true
		},
		releaseFunc: func() {
			lockReleased = true
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewImportHandler(ImportHandlerConfig{
		ImportService: mockService,
		ImportLock:    mockLock,
		Logger:        logger,
		ImportParams: service.ImportParams{
			PointID:     123,
			PriceListID: 456,
			PageSize:    100,
		},
	})

	// Create test request
	req := httptest.NewRequest(http.MethodPost, "/api/catalog/import", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.TriggerImport(c)

	// Verify response status is 202 Accepted
	if w.Code != http.StatusAccepted {
		t.Errorf("Expected status 202, got %d", w.Code)
	}

	// Parse response body
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response contains status and message
	if response["status"] != "started" {
		t.Errorf("Expected status 'started', got %v", response["status"])
	}

	if response["message"] != "Import started" {
		t.Errorf("Expected message 'Import started', got %v", response["message"])
	}

	// Verify lock was acquired
	if !lockAcquired {
		t.Error("Expected lock to be acquired")
	}

	// Wait a bit for goroutine to complete
	time.Sleep(100 * time.Millisecond)

	// Verify lock was released
	if !lockReleased {
		t.Error("Expected lock to be released after import")
	}
}

// Test 409 response when import is running
// **Validates: Requirements 7.6**
func TestTriggerImport_Conflict(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service and lock that fails to acquire
	mockService := &mockImportService{}

	mockLock := &mockImportLock{
		tryAcquireFunc: func() bool {
			return false // Lock is busy
		},
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewImportHandler(ImportHandlerConfig{
		ImportService: mockService,
		ImportLock:    mockLock,
		Logger:        logger,
		ImportParams: service.ImportParams{
			PointID:     123,
			PriceListID: 456,
			PageSize:    100,
		},
	})

	// Create test request
	req := httptest.NewRequest(http.MethodPost, "/api/catalog/import", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.TriggerImport(c)

	// Verify response status is 409 Conflict
	if w.Code != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", w.Code)
	}

	// Parse response body
	var errorResponse model.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
		t.Fatalf("Failed to unmarshal error response: %v", err)
	}

	// Verify error code and message
	if errorResponse.Error.Code != "IMPORT_IN_PROGRESS" {
		t.Errorf("Expected error code 'IMPORT_IN_PROGRESS', got %s", errorResponse.Error.Code)
	}

	if errorResponse.Error.Message != "An import is already in progress" {
		t.Errorf("Expected message 'An import is already in progress', got %s", errorResponse.Error.Message)
	}
}

// Test status API response structure
// **Validates: Requirements 7.5**
func TestGetImportStatus_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service with status data
	startedAt := time.Now().Add(-10 * time.Minute)
	completedAt := time.Now()
	mockService := &mockImportService{
		getStatusFunc: func() *model.ImportStatus {
			return &model.ImportStatus{
				Status:            model.ImportStatusCompleted,
				CategoriesCreated: 10,
				CategoriesUpdated: 5,
				ProductsCreated:   50,
				ProductsUpdated:   20,
				StartedAt:         startedAt,
				CompletedAt:       &completedAt,
			}
		},
	}

	mockLock := &mockImportLock{}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewImportHandler(ImportHandlerConfig{
		ImportService: mockService,
		ImportLock:    mockLock,
		Logger:        logger,
		ImportParams:  service.ImportParams{},
	})

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/import/status", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetImportStatus(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body
	var status model.ImportStatus
	if err := json.Unmarshal(w.Body.Bytes(), &status); err != nil {
		t.Fatalf("Failed to unmarshal status response: %v", err)
	}

	// Verify all required fields are present
	if status.Status != model.ImportStatusCompleted {
		t.Errorf("Expected status 'completed', got %s", status.Status)
	}

	if status.CategoriesCreated != 10 {
		t.Errorf("Expected categoriesCreated 10, got %d", status.CategoriesCreated)
	}

	if status.CategoriesUpdated != 5 {
		t.Errorf("Expected categoriesUpdated 5, got %d", status.CategoriesUpdated)
	}

	if status.ProductsCreated != 50 {
		t.Errorf("Expected productsCreated 50, got %d", status.ProductsCreated)
	}

	if status.ProductsUpdated != 20 {
		t.Errorf("Expected productsUpdated 20, got %d", status.ProductsUpdated)
	}

	if status.StartedAt.IsZero() {
		t.Error("Expected startedAt to be set")
	}

	if status.CompletedAt == nil {
		t.Error("Expected completedAt to be set")
	}
}

// Test status API when no import has run yet
// **Validates: Requirements 7.5**
func TestGetImportStatus_NoData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service with no status data
	mockService := &mockImportService{
		getStatusFunc: func() *model.ImportStatus {
			return nil // No import has run yet
		},
	}

	mockLock := &mockImportLock{}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewImportHandler(ImportHandlerConfig{
		ImportService: mockService,
		ImportLock:    mockLock,
		Logger:        logger,
		ImportParams:  service.ImportParams{},
	})

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/import/status", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetImportStatus(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// Verify response indicates no data
	if response["status"] != "no_data" {
		t.Errorf("Expected status 'no_data', got %v", response["status"])
	}

	if response["message"] != "No import has been executed yet" {
		t.Errorf("Expected message 'No import has been executed yet', got %v", response["message"])
	}
}

// Test status API with failed import
// **Validates: Requirements 7.5**
func TestGetImportStatus_Failed(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock service with failed status
	startedAt := time.Now().Add(-5 * time.Minute)
	completedAt := time.Now()
	errorMsg := "Failed to connect to SBIS API"
	mockService := &mockImportService{
		getStatusFunc: func() *model.ImportStatus {
			return &model.ImportStatus{
				Status:            model.ImportStatusFailed,
				CategoriesCreated: 0,
				CategoriesUpdated: 0,
				ProductsCreated:   0,
				ProductsUpdated:   0,
				StartedAt:         startedAt,
				CompletedAt:       &completedAt,
				Error:             &errorMsg,
			}
		},
	}

	mockLock := &mockImportLock{}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	handler := NewImportHandler(ImportHandlerConfig{
		ImportService: mockService,
		ImportLock:    mockLock,
		Logger:        logger,
		ImportParams:  service.ImportParams{},
	})

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/catalog/import/status", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-id")

	handler.GetImportStatus(c)

	// Verify response status is 200 OK
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response body
	var status model.ImportStatus
	if err := json.Unmarshal(w.Body.Bytes(), &status); err != nil {
		t.Fatalf("Failed to unmarshal status response: %v", err)
	}

	// Verify status is failed
	if status.Status != model.ImportStatusFailed {
		t.Errorf("Expected status 'failed', got %s", status.Status)
	}

	// Verify error message is present
	if status.Error == nil {
		t.Error("Expected error message to be set")
	} else if *status.Error != errorMsg {
		t.Errorf("Expected error message '%s', got '%s'", errorMsg, *status.Error)
	}
}
