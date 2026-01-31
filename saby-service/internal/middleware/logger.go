package middleware

import (
	"encoding/json"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// LogEntry represents a structured log entry in JSON format
type LogEntry struct {
	Timestamp  string `json:"timestamp"`
	Level      string `json:"level"`
	RequestID  string `json:"request_id,omitempty"`
	Method     string `json:"method,omitempty"`
	Path       string `json:"path,omitempty"`
	Status     int    `json:"status,omitempty"`
	DurationMs int64  `json:"duration_ms,omitempty"`
	Message    string `json:"message"`
}

// Logger is a middleware that logs HTTP requests in structured JSON format
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Record start time
		startTime := time.Now()

		// Get request ID from context
		requestID := GetRequestID(c)

		// Log incoming request
		logRequest(requestID, c.Request.Method, c.Request.URL.Path)

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(startTime)

		// Log response
		logResponse(requestID, c.Request.Method, c.Request.URL.Path, c.Writer.Status(), duration.Milliseconds())
	}
}

// logRequest logs an incoming HTTP request
func logRequest(requestID, method, path string) {
	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     "INFO",
		RequestID: requestID,
		Method:    method,
		Path:      path,
		Message:   "Incoming request",
	}
	writeLog(entry)
}

// logResponse logs an HTTP response
func logResponse(requestID, method, path string, status int, durationMs int64) {
	level := "INFO"
	if status >= 500 {
		level = "ERROR"
	} else if status >= 400 {
		level = "WARN"
	}

	entry := LogEntry{
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Level:      level,
		RequestID:  requestID,
		Method:     method,
		Path:       path,
		Status:     status,
		DurationMs: durationMs,
		Message:    "Request completed",
	}
	writeLog(entry)
}

// writeLog writes a log entry to stdout in JSON format
func writeLog(entry LogEntry) {
	encoder := json.NewEncoder(os.Stdout)
	_ = encoder.Encode(entry)
}
