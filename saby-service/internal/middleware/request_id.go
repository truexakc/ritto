package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const RequestIDKey = "request_id"

// RequestID is a middleware that generates a unique request ID for each request
// and adds it to the Gin context and response headers
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate a new UUID for this request
		requestID := uuid.New().String()

		// Add request ID to Gin context for use in handlers and other middleware
		c.Set(RequestIDKey, requestID)

		// Add X-Request-ID header to response
		c.Header("X-Request-ID", requestID)

		// Continue processing the request
		c.Next()
	}
}

// GetRequestID retrieves the request ID from the Gin context
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(RequestIDKey); exists {
		if id, ok := requestID.(string); ok {
			return id
		}
	}
	return ""
}
