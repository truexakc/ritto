package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// **Validates: Requirements 9.1**
// Unit test to verify log contains request method, path, timestamp, and request ID
func TestLoggerMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Capture stdout to verify log output
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create a test router with both RequestID and Logger middleware
	router := gin.New()
	router.Use(RequestID())
	router.Use(Logger())

	// Add a test handler
	router.GET("/test/path", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create and serve a test request
	req := httptest.NewRequest("GET", "/test/path", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Close the writer and restore stdout
	w.Close()
	os.Stdout = oldStdout

	// Read captured output
	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	// Split output into lines (should have 2 log entries: incoming request and response)
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) < 2 {
		t.Fatalf("Expected at least 2 log entries, got %d", len(lines))
	}

	// Parse the first log entry (incoming request)
	var incomingLog LogEntry
	if err := json.Unmarshal([]byte(lines[0]), &incomingLog); err != nil {
		t.Fatalf("Failed to parse incoming log entry: %v", err)
	}

	// Parse the second log entry (response)
	var responseLog LogEntry
	if err := json.Unmarshal([]byte(lines[1]), &responseLog); err != nil {
		t.Fatalf("Failed to parse response log entry: %v", err)
	}

	// Verify incoming request log
	t.Run("Incoming request log", func(t *testing.T) {
		if incomingLog.Method != "GET" {
			t.Errorf("Expected method 'GET', got '%s'", incomingLog.Method)
		}

		if incomingLog.Path != "/test/path" {
			t.Errorf("Expected path '/test/path', got '%s'", incomingLog.Path)
		}

		if incomingLog.Timestamp == "" {
			t.Error("Expected timestamp to be present")
		}

		if incomingLog.RequestID == "" {
			t.Error("Expected request ID to be present")
		}

		if incomingLog.Level != "INFO" {
			t.Errorf("Expected level 'INFO', got '%s'", incomingLog.Level)
		}

		if incomingLog.Message != "Incoming request" {
			t.Errorf("Expected message 'Incoming request', got '%s'", incomingLog.Message)
		}
	})

	// Verify response log
	t.Run("Response log", func(t *testing.T) {
		if responseLog.Method != "GET" {
			t.Errorf("Expected method 'GET', got '%s'", responseLog.Method)
		}

		if responseLog.Path != "/test/path" {
			t.Errorf("Expected path '/test/path', got '%s'", responseLog.Path)
		}

		if responseLog.Timestamp == "" {
			t.Error("Expected timestamp to be present")
		}

		if responseLog.RequestID == "" {
			t.Error("Expected request ID to be present")
		}

		if responseLog.Status != http.StatusOK {
			t.Errorf("Expected status %d, got %d", http.StatusOK, responseLog.Status)
		}

		if responseLog.DurationMs < 0 {
			t.Errorf("Expected non-negative duration, got %d", responseLog.DurationMs)
		}

		if responseLog.Level != "INFO" {
			t.Errorf("Expected level 'INFO', got '%s'", responseLog.Level)
		}

		if responseLog.Message != "Request completed" {
			t.Errorf("Expected message 'Request completed', got '%s'", responseLog.Message)
		}
	})

	// Verify request IDs match between incoming and response logs
	t.Run("Request ID consistency", func(t *testing.T) {
		if incomingLog.RequestID != responseLog.RequestID {
			t.Errorf("Request IDs don't match: incoming=%s, response=%s",
				incomingLog.RequestID, responseLog.RequestID)
		}
	})
}

// Test that error responses are logged with ERROR level
func TestLoggerMiddlewareErrorLevel(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create router with middleware
	router := gin.New()
	router.Use(RequestID())
	router.Use(Logger())

	// Add handler that returns 500 error
	router.GET("/error", func(c *gin.Context) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
	})

	// Make request
	req := httptest.NewRequest("GET", "/error", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read output
	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	// Parse the response log (second line)
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) < 2 {
		t.Fatalf("Expected at least 2 log entries, got %d", len(lines))
	}

	var responseLog LogEntry
	if err := json.Unmarshal([]byte(lines[1]), &responseLog); err != nil {
		t.Fatalf("Failed to parse response log entry: %v", err)
	}

	// Verify error level for 5xx status
	if responseLog.Level != "ERROR" {
		t.Errorf("Expected level 'ERROR' for 500 status, got '%s'", responseLog.Level)
	}

	if responseLog.Status != http.StatusInternalServerError {
		t.Errorf("Expected status %d, got %d", http.StatusInternalServerError, responseLog.Status)
	}
}

// Test that 4xx responses are logged with WARN level
func TestLoggerMiddlewareWarnLevel(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Capture stdout
	oldStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Create router with middleware
	router := gin.New()
	router.Use(RequestID())
	router.Use(Logger())

	// Add handler that returns 400 error
	router.GET("/bad-request", func(c *gin.Context) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
	})

	// Make request
	req := httptest.NewRequest("GET", "/bad-request", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// Restore stdout and read output
	w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	io.Copy(&buf, r)
	output := buf.String()

	// Parse the response log (second line)
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) < 2 {
		t.Fatalf("Expected at least 2 log entries, got %d", len(lines))
	}

	var responseLog LogEntry
	if err := json.Unmarshal([]byte(lines[1]), &responseLog); err != nil {
		t.Fatalf("Failed to parse response log entry: %v", err)
	}

	// Verify warn level for 4xx status
	if responseLog.Level != "WARN" {
		t.Errorf("Expected level 'WARN' for 400 status, got '%s'", responseLog.Level)
	}

	if responseLog.Status != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, responseLog.Status)
	}
}
