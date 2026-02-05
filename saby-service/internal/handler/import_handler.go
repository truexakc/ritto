package handler

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
	"saby-service/internal/service"
)

// ImportHandler handles HTTP requests for catalog import operations
type ImportHandler struct {
	importService service.ImportService
	importLock    service.ImportLock
	logger        *slog.Logger
	importParams  service.ImportParams
}

// ImportHandlerConfig holds configuration for the import handler
type ImportHandlerConfig struct {
	ImportService service.ImportService
	ImportLock    service.ImportLock
	Logger        *slog.Logger
	ImportParams  service.ImportParams
}

// NewImportHandler creates a new ImportHandler with the given dependencies
func NewImportHandler(config ImportHandlerConfig) *ImportHandler {
	logger := config.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &ImportHandler{
		importService: config.ImportService,
		importLock:    config.ImportLock,
		logger:        logger,
		importParams:  config.ImportParams,
	}
}

// TriggerImport handles POST /api/catalog/import requests
// It attempts to start a catalog import asynchronously
func (h *ImportHandler) TriggerImport(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	h.logger.Info("manual import trigger requested", "requestId", requestID)

	// Try to acquire the import lock
	if !h.importLock.TryAcquire() {
		// Lock is busy - another import is already running
		h.logger.Warn("import already in progress", "requestId", requestID)

		c.JSON(http.StatusConflict, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "IMPORT_IN_PROGRESS",
				Message: "An import is already in progress",
			},
		})
		return
	}

	// Lock acquired - start import asynchronously
	h.logger.Info("import lock acquired, starting import", "requestId", requestID)

	// Start import in a goroutine
	go func() {
		defer h.importLock.Release()

		// Create a background context with timeout for the import
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()

		h.logger.Info("starting asynchronous import", "requestId", requestID)

		_, err := h.importService.StartImport(ctx, h.importParams)
		if err != nil {
			h.logger.Error("import failed", "error", err, "requestId", requestID)
		} else {
			h.logger.Info("import completed successfully", "requestId", requestID)
		}
	}()

	// Return 202 Accepted immediately
	c.JSON(http.StatusAccepted, gin.H{
		"status":  "started",
		"message": "Import started",
	})
}

// GetImportStatus handles GET /api/catalog/import/status requests
// It returns the current status of the import operation
func (h *ImportHandler) GetImportStatus(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	h.logger.Info("import status requested", "requestId", requestID)

	// Get current status from import service
	status := h.importService.GetStatus()

	// Handle case when no import has run yet
	if status == nil {
		h.logger.Info("no import data available", "requestId", requestID)

		c.JSON(http.StatusOK, gin.H{
			"status":  "no_data",
			"message": "No import has been executed yet",
		})
		return
	}

	// Return the import status
	h.logger.Info("returning import status",
		"requestId", requestID,
		"status", status.Status)

	c.JSON(http.StatusOK, status)
}
