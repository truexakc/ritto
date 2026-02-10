package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
	"saby-service/internal/service"
)

// Handler handles HTTP requests for the SABY service
type Handler struct {
	service service.SabyService
}

// NewHandler creates a new Handler with the given SabyService
func NewHandler(service service.SabyService) *Handler {
	return &Handler{
		service: service,
	}
}

// CreateOrder handles POST /api/v1/orders requests
func (h *Handler) CreateOrder(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	// Read raw JSON without any validation
	var req model.OrderRequest
	body, err := c.GetRawData()
	if err != nil {
		log.Printf("[%s] Failed to read body: %v", requestID, err)
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    model.ErrorCodeValidation,
				Message: "Failed to read request body",
			},
		})
		return
	}

	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("[%s] JSON unmarshal error: %v", requestID, err)
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    model.ErrorCodeValidation,
				Message: "Invalid request payload",
				Details: []model.FieldError{
					{
						Field:   "request",
						Message: err.Error(),
					},
				},
			},
		})
		return
	}

	log.Printf("[%s] Processing order creation request", requestID)

	// Use request context for downstream calls
	ctx := c.Request.Context()

	// Call service layer CreateOrder with context
	response, err := h.service.CreateOrder(ctx, &req)
	if err != nil {
		h.handleServiceError(c, requestID, err)
		return
	}

	// Return success response on success (HTTP 201)
	log.Printf("[%s] Order created successfully: %s", requestID, response.OrderID)
	c.JSON(http.StatusCreated, response)
}

// handleServiceError maps service errors to appropriate HTTP responses
func (h *Handler) handleServiceError(c *gin.Context, requestID string, err error) {
	log.Printf("[%s] Service error: %v", requestID, err)

	// Map timeout errors to HTTP 408
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		c.JSON(http.StatusRequestTimeout, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    model.ErrorCodeTimeout,
				Message: "Request timeout",
			},
		})
		return
	}

	// Check if it's a validation error (contains common validation keywords)
	errMsg := err.Error()
	if containsValidationKeywords(errMsg) {
		// Map validation errors from service to HTTP 400
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    model.ErrorCodeValidation,
				Message: errMsg,
			},
		})
		return
	}

	// Map dependency errors to HTTP 503
	// This would be used when SABY API is unavailable
	if containsDependencyKeywords(errMsg) {
		c.JSON(http.StatusServiceUnavailable, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    model.ErrorCodeDependency,
				Message: "External service unavailable",
			},
		})
		return
	}

	// Return standardized error response on internal service error (HTTP 500)
	c.JSON(http.StatusInternalServerError, model.ErrorResponse{
		Error: model.ErrorDetail{
			Code:    model.ErrorCodeInternal,
			Message: "Internal server error",
		},
	})
}

// containsValidationKeywords checks if error message contains validation-related keywords
func containsValidationKeywords(msg string) bool {
	keywords := []string{"required", "invalid", "must", "cannot", "validation"}
	for _, keyword := range keywords {
		if contains(msg, keyword) {
			return true
		}
	}
	return false
}

// containsDependencyKeywords checks if error message contains dependency-related keywords
func containsDependencyKeywords(msg string) bool {
	keywords := []string{"unavailable", "connection", "timeout", "unreachable"}
	for _, keyword := range keywords {
		if contains(msg, keyword) {
			return true
		}
	}
	return false
}

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		len(s) > len(substr) && (s[:len(substr)] == substr ||
			s[len(s)-len(substr):] == substr ||
			containsMiddle(s, substr)))
}

func containsMiddle(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// HealthCheck handles GET /health requests
func (h *Handler) HealthCheck(c *gin.Context) {
	// Return service status, version (1.0.0), and timestamp in health response
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"service":   "saby-service",
		"version":   "1.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
