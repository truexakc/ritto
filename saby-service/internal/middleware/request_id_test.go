package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Feature: saby-go-microservice, Property 10: Request ID tracing**
// **Validates: Requirements 9.2, 9.3**
// For any incoming request, the system should generate a unique request ID
// and include it in the response headers as X-Request-ID
func TestRequestIDProperty(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("Request ID is generated and added to response headers", prop.ForAll(
		func(method string, path string) bool {
			// Set Gin to test mode
			gin.SetMode(gin.TestMode)

			// Create a test router with RequestID middleware
			router := gin.New()
			router.Use(RequestID())

			// Add a test handler that captures the request ID from context
			var contextRequestID string
			router.Handle(method, path, func(c *gin.Context) {
				contextRequestID = GetRequestID(c)
				c.Status(http.StatusOK)
			})

			// Create a test request
			req := httptest.NewRequest(method, path, nil)
			w := httptest.NewRecorder()

			// Serve the request
			router.ServeHTTP(w, req)

			// Property 1: Response should have X-Request-ID header
			headerRequestID := w.Header().Get("X-Request-ID")
			if headerRequestID == "" {
				return false
			}

			// Property 2: Request ID should be a valid UUID
			if _, err := uuid.Parse(headerRequestID); err != nil {
				return false
			}

			// Property 3: Request ID in context should match header
			if contextRequestID != headerRequestID {
				return false
			}

			// Property 4: Request ID should not be empty
			if contextRequestID == "" {
				return false
			}

			return true
		},
		gen.OneConstOf("GET", "POST", "PUT", "DELETE", "PATCH"),
		gen.OneConstOf("/test", "/api/v1/orders", "/health", "/api/test/path"),
	))

	properties.TestingRun(t)
}

// Test that multiple requests generate unique request IDs
func TestRequestIDUniqueness(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	properties.Property("Multiple requests generate unique request IDs", prop.ForAll(
		func(numRequests int) bool {
			gin.SetMode(gin.TestMode)

			// Create a test router with RequestID middleware
			router := gin.New()
			router.Use(RequestID())

			requestIDs := make(map[string]bool)

			router.GET("/test", func(c *gin.Context) {
				c.Status(http.StatusOK)
			})

			// Make multiple requests
			for i := 0; i < numRequests; i++ {
				req := httptest.NewRequest("GET", "/test", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				requestID := w.Header().Get("X-Request-ID")

				// Check if we've seen this request ID before
				if requestIDs[requestID] {
					return false // Duplicate found
				}
				requestIDs[requestID] = true
			}

			// All request IDs should be unique
			return len(requestIDs) == numRequests
		},
		gen.IntRange(2, 50), // Test with 2 to 50 requests
	))

	properties.TestingRun(t)
}
