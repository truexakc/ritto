package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"saby-service/internal/client"
	"saby-service/internal/config"
	"saby-service/internal/handler"
	"saby-service/internal/middleware"
	"saby-service/internal/scheduler"
	"saby-service/internal/service"
)

const version = "1.0.0"

func main() {
	// Load configuration using config.LoadConfig()
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Log startup information (port, environment, version)
	logStartup(cfg)

	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// Initialize database connection
	db, err := sql.Open("postgres", cfg.DBConnectionString)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	logger.Info("database connection established")

	// Initialize SABY client with config values
	sabyClient := client.NewSabyClient(cfg.SabyAPIURL, cfg.SabyAPIKey)

	// Initialize SABY service with client
	sabyService := service.NewSabyService(sabyClient)

	// Initialize handler with service
	h := handler.NewHandler(sabyService)

	// Initialize SBIS client for import
	sbisClient := client.NewSBISClient(
		"https://api.sbis.ru",
		cfg.SBISAccessToken,
		cfg.MaxPaginationPages,
	)

	// Initialize import service components
	classifier := service.NewNomenclatureClassifier()
	imageDownloader := service.NewImageDownloader(service.ImageDownloaderConfig{
		StoragePath: cfg.ImageStoragePath,
		Logger:      logger,
	})
	slugGenerator := service.NewSlugGenerator(db)
	dbPersister := service.NewDBPersister(db)

	// Initialize import service
	importService := service.NewImportService(service.ImportServiceConfig{
		SBISClient:      sbisClient,
		Classifier:      classifier,
		ImageDownloader: imageDownloader,
		SlugGenerator:   slugGenerator,
		DBPersister:     dbPersister,
		Logger:          logger,
	})

	// Initialize import lock (shared between scheduler and manual trigger)
	importLock := service.NewImportLock()

	// Initialize import parameters
	importParams := service.ImportParams{
		PointID:     cfg.SBISPointID,
		PriceListID: cfg.SBISPriceListID,
		PageSize:    cfg.ImportPageSize,
	}

	// Initialize import scheduler
	importScheduler := scheduler.NewImportScheduler(scheduler.ImportSchedulerConfig{
		ImportService:   importService,
		ImportLock:      importLock,
		Schedule:        cfg.ImportSchedule,
		ImportTimeout:   cfg.ImportTimeout,
		ImportParams:    importParams,
		EnableScheduler: cfg.EnableScheduler,
		Logger:          logger,
	})

	// Initialize import handler
	importHandler := handler.NewImportHandler(handler.ImportHandlerConfig{
		ImportService: importService,
		ImportLock:    importLock,
		Logger:        logger,
		ImportParams:  importParams,
	})

	// Create Gin router using gin.New() for explicit control
	router := gin.New()

	// Add Recovery middleware
	router.Use(gin.Recovery())

	// Add custom RequestID middleware
	router.Use(middleware.RequestID())

	// Add custom Logger middleware
	router.Use(middleware.Logger())

	// Register /health endpoint with HealthCheck handler
	router.GET("/health", h.HealthCheck)

	// Create /api/v1 route group
	v1 := router.Group("/api/v1")
	{
		// Register POST /api/v1/orders endpoint with CreateOrder handler
		v1.POST("/orders", h.CreateOrder)
	}

	// Create /api/catalog route group for import endpoints
	catalogAPI := router.Group("/api/catalog")
	{
		// Register POST /api/catalog/import endpoint
		catalogAPI.POST("/import", importHandler.TriggerImport)
		// Register GET /api/catalog/import/status endpoint
		catalogAPI.GET("/import/status", importHandler.GetImportStatus)
	}

	// Start HTTP server on configured port
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Start scheduler if enabled
	if cfg.EnableScheduler {
		if err := importScheduler.Start(context.Background()); err != nil {
			log.Fatalf("Failed to start import scheduler: %v", err)
		}
		logger.Info("import scheduler started")
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting HTTP server on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Implement graceful shutdown on interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Stop scheduler gracefully
	if cfg.EnableScheduler {
		if err := importScheduler.Stop(); err != nil {
			logger.Error("failed to stop scheduler", "error", err)
		}
	}

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// logStartup logs startup information in structured JSON format
func logStartup(cfg *config.Config) {
	startupInfo := map[string]interface{}{
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
		"level":       "INFO",
		"message":     "Starting SABY service",
		"service":     "saby-service",
		"version":     version,
		"port":        cfg.Port,
		"environment": cfg.Environment,
		"saby_api":    cfg.SabyAPIURL,
	}

	encoder := json.NewEncoder(os.Stdout)
	if err := encoder.Encode(startupInfo); err != nil {
		// Fallback to simple log if JSON encoding fails
		fmt.Printf("Starting SABY service v%s on port %s (env: %s)\n", version, cfg.Port, cfg.Environment)
	}
}
