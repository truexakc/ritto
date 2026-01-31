package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
)

// mockSabyService is a mock implementation of SabyService for testing
type mockSabyService struct {
	createOrderFunc func(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error)
}

func (m *mockSabyService) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
	if m.createOrderFunc != nil {
		return m.createOrderFunc(ctx, req)
	}
	return nil, errors.New("not implemented")
}

// **Feature: saby-go-microservice, Property 7: Error response format consistency**
func TestProperty_ErrorResponseFormatConsistency(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Generator for various error types
	errorTypeGen := gen.OneConstOf(
		"validation",
		"timeout",
		"dependency",
		"internal",
	)

	properties.Property("all error responses follow standardized format", prop.ForAll(
		func(errorType string) bool {
			gin.SetMode(gin.TestMode)

			// Create mock service that returns different error types
			var mockErr error
			switch errorType {
			case "validation":
				mockErr = errors.New("required field is missing")
			case "timeout":
				mockErr = context.DeadlineExceeded
			case "dependency":
				mockErr = errors.New("service unavailable")
			case "internal":
				mockErr = errors.New("unexpected error")
			}

			mockService := &mockSabyService{
				createOrderFunc: func(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
					return nil, mockErr
				},
			}

			handler := NewHandler(mockService)

			// Create test request
			validOrder := model.OrderRequest{
				Product: "delivery",
				PointID: 123,
				Customer: model.Customer{
					Name:  "Test User",
					Phone: "+79991234567",
				},
				Datetime: time.Now(),
				Nomenclatures: []model.Nomenclature{
					{
						Count:       1,
						PriceListID: 1,
					},
				},
				Delivery: model.Delivery{
					IsPickup:    true,
					PaymentType: model.PaymentCard,
				},
			}

			body, _ := json.Marshal(validOrder)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.CreateOrder(c)

			// Parse response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Logf("Failed to unmarshal error response: %v", err)
				return false
			}

			// Verify standardized format: must have error.code, error.message
			if errorResponse.Error.Code == "" {
				t.Logf("Error response missing code field")
				return false
			}

			if errorResponse.Error.Message == "" {
				t.Logf("Error response missing message field")
				return false
			}

			// Verify error code is one of the defined types
			validCodes := map[model.ErrorCode]bool{
				model.ErrorCodeValidation: true,
				model.ErrorCodeInternal:   true,
				model.ErrorCodeTimeout:    true,
				model.ErrorCodeDependency: true,
				model.ErrorCodeNotFound:   true,
			}

			if !validCodes[errorResponse.Error.Code] {
				t.Logf("Invalid error code: %s", errorResponse.Error.Code)
				return false
			}

			return true
		},
		errorTypeGen,
	))

	properties.TestingRun(t)
}

// Test binding errors also follow standardized format
func TestProperty_BindingErrorResponseFormat(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Generator for invalid JSON payloads
	invalidJSONGen := gen.OneConstOf(
		`{"invalid": json}`,
		`{`,
		`null`,
		`[]`,
		`"string"`,
	)

	properties.Property("binding errors follow standardized format", prop.ForAll(
		func(invalidJSON string) bool {
			gin.SetMode(gin.TestMode)

			mockService := &mockSabyService{}
			handler := NewHandler(mockService)

			req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBufferString(invalidJSON))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.CreateOrder(c)

			// Should return 400
			if w.Code != http.StatusBadRequest {
				t.Logf("Expected status 400, got %d", w.Code)
				return false
			}

			// Parse response
			var errorResponse model.ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &errorResponse); err != nil {
				t.Logf("Failed to unmarshal error response: %v", err)
				return false
			}

			// Verify standardized format
			if errorResponse.Error.Code != model.ErrorCodeValidation {
				t.Logf("Expected VALIDATION_ERROR, got %s", errorResponse.Error.Code)
				return false
			}

			if errorResponse.Error.Message == "" {
				t.Logf("Error response missing message field")
				return false
			}

			// Should have details array (even if empty)
			if errorResponse.Error.Details == nil {
				t.Logf("Error response missing details field")
				return false
			}

			return true
		},
		invalidJSONGen,
	))

	properties.TestingRun(t)
}

// **Feature: saby-go-microservice, Property 8: Success response format**
func TestProperty_SuccessResponseFormat(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Generator for random order IDs and external IDs
	orderIDGen := gen.Identifier()
	externalIDGen := gen.Identifier()
	statusGen := gen.OneConstOf("created", "pending", "confirmed")

	properties.Property("all success responses contain required fields", prop.ForAll(
		func(orderID, externalID, status string) bool {
			gin.SetMode(gin.TestMode)

			// Create mock service that returns success
			mockService := &mockSabyService{
				createOrderFunc: func(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
					return &model.OrderResponse{
						OrderID:    orderID,
						ExternalID: externalID,
						Status:     status,
						CreatedAt:  time.Now(),
						Message:    "Order created successfully",
					}, nil
				},
			}

			handler := NewHandler(mockService)

			// Create valid order request
			validOrder := model.OrderRequest{
				Product: "delivery",
				PointID: 123,
				Customer: model.Customer{
					Name:  "Test User",
					Phone: "+79991234567",
				},
				Datetime: time.Now(),
				Nomenclatures: []model.Nomenclature{
					{
						Count:       1,
						PriceListID: 1,
					},
				},
				Delivery: model.Delivery{
					IsPickup:    true,
					PaymentType: model.PaymentCard,
				},
			}

			body, _ := json.Marshal(validOrder)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set(middleware.RequestIDKey, "test-request-id")

			handler.CreateOrder(c)

			// Should return 201
			if w.Code != http.StatusCreated {
				t.Logf("Expected status 201, got %d", w.Code)
				return false
			}

			// Parse response
			var response model.OrderResponse
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Logf("Failed to unmarshal response: %v", err)
				return false
			}

			// Verify required fields are present
			if response.OrderID == "" {
				t.Logf("Response missing orderId field")
				return false
			}

			if response.Status == "" {
				t.Logf("Response missing status field")
				return false
			}

			if response.CreatedAt.IsZero() {
				t.Logf("Response missing or invalid createdAt field")
				return false
			}

			// Verify the values match what we returned
			if response.OrderID != orderID {
				t.Logf("OrderID mismatch: expected %s, got %s", orderID, response.OrderID)
				return false
			}

			if response.ExternalID != externalID {
				t.Logf("ExternalID mismatch: expected %s, got %s", externalID, response.ExternalID)
				return false
			}

			if response.Status != status {
				t.Logf("Status mismatch: expected %s, got %s", status, response.Status)
				return false
			}

			return true
		},
		orderIDGen,
		externalIDGen,
		statusGen,
	))

	properties.TestingRun(t)
}

// Unit test for error logging
// **Validates: Requirements 9.4**
func TestErrorLogging(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a buffer to capture log output
	var logBuffer bytes.Buffer
	log.SetOutput(&logBuffer)
	defer log.SetOutput(nil) // Reset after test

	// Create mock service that returns an error
	mockService := &mockSabyService{
		createOrderFunc: func(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
			return nil, errors.New("test error message")
		},
	}

	handler := NewHandler(mockService)

	// Create valid order request
	validOrder := model.OrderRequest{
		Product: "delivery",
		PointID: 123,
		Customer: model.Customer{
			Name:  "Test User",
			Phone: "+79991234567",
		},
		Datetime: time.Now(),
		Nomenclatures: []model.Nomenclature{
			{
				Count:       1,
				PriceListID: 1,
			},
		},
		Delivery: model.Delivery{
			IsPickup:    true,
			PaymentType: model.PaymentCard,
		},
	}

	body, _ := json.Marshal(validOrder)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-123")

	handler.CreateOrder(c)

	// Verify log output
	logOutput := logBuffer.String()

	// Verify error logs include error message
	if !bytes.Contains(logBuffer.Bytes(), []byte("test error message")) {
		t.Errorf("Log output should contain error message, got: %s", logOutput)
	}

	// Verify error logs include request ID
	if !bytes.Contains(logBuffer.Bytes(), []byte("test-request-123")) {
		t.Errorf("Log output should contain request ID, got: %s", logOutput)
	}

	// Verify error logs include "Service error" context
	if !bytes.Contains(logBuffer.Bytes(), []byte("Service error")) {
		t.Errorf("Log output should contain 'Service error' context, got: %s", logOutput)
	}
}

// Unit test for binding error logging
func TestBindingErrorLogging(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a buffer to capture log output
	var logBuffer bytes.Buffer
	log.SetOutput(&logBuffer)
	defer log.SetOutput(nil) // Reset after test

	mockService := &mockSabyService{}
	handler := NewHandler(mockService)

	// Send invalid JSON
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBufferString(`{"invalid": json}`))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set(middleware.RequestIDKey, "test-request-456")

	handler.CreateOrder(c)

	// Verify log output
	logOutput := logBuffer.String()

	// Verify error logs include request ID
	if !bytes.Contains(logBuffer.Bytes(), []byte("test-request-456")) {
		t.Errorf("Log output should contain request ID, got: %s", logOutput)
	}

	// Verify error logs include "Binding error" context
	if !bytes.Contains(logBuffer.Bytes(), []byte("Binding error")) {
		t.Errorf("Log output should contain 'Binding error' context, got: %s", logOutput)
	}
}
