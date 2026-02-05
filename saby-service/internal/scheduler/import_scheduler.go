package scheduler

import (
	"context"
	"log/slog"
	"time"

	"github.com/robfig/cron/v3"

	"saby-service/internal/service"
)

// ImportScheduler manages scheduled execution of catalog import using cron expressions
type ImportScheduler interface {
	// Start initializes and starts the cron scheduler
	Start(ctx context.Context) error
	// Stop gracefully stops the scheduler
	Stop() error
}

// importSchedulerImpl implements the ImportScheduler interface
type importSchedulerImpl struct {
	cron            *cron.Cron
	importService   service.ImportService
	importLock      service.ImportLock
	schedule        string
	importTimeout   time.Duration
	importParams    service.ImportParams
	enableScheduler bool
	logger          *slog.Logger
}

// ImportSchedulerConfig holds configuration for the import scheduler
type ImportSchedulerConfig struct {
	ImportService   service.ImportService
	ImportLock      service.ImportLock
	Schedule        string
	ImportTimeout   time.Duration
	ImportParams    service.ImportParams
	EnableScheduler bool
	Logger          *slog.Logger
}

// NewImportScheduler creates a new import scheduler with the given configuration
func NewImportScheduler(config ImportSchedulerConfig) ImportScheduler {
	logger := config.Logger
	if logger == nil {
		logger = slog.Default()
	}

	return &importSchedulerImpl{
		cron:            cron.New(),
		importService:   config.ImportService,
		importLock:      config.ImportLock,
		schedule:        config.Schedule,
		importTimeout:   config.ImportTimeout,
		importParams:    config.ImportParams,
		enableScheduler: config.EnableScheduler,
		logger:          logger,
	}
}

// Start initializes the cron scheduler with the configured schedule
func (s *importSchedulerImpl) Start(ctx context.Context) error {
	// Check if scheduler is enabled
	if !s.enableScheduler {
		s.logger.Info("import scheduler is disabled, skipping initialization")
		return nil
	}

	// Add the scheduled import job
	_, err := s.cron.AddFunc(s.schedule, s.runScheduledImport)
	if err != nil {
		return err
	}

	// Start the cron scheduler
	s.cron.Start()

	s.logger.Info("import scheduler started",
		"schedule", s.schedule,
		"importTimeout", s.importTimeout)

	return nil
}

// Stop gracefully stops the scheduler
func (s *importSchedulerImpl) Stop() error {
	if s.cron != nil {
		ctx := s.cron.Stop()
		<-ctx.Done()
		s.logger.Info("import scheduler stopped")
	}
	return nil
}

// runScheduledImport attempts to acquire the lock and run the import
func (s *importSchedulerImpl) runScheduledImport() {
	startTime := time.Now()

	s.logger.Info("scheduled import triggered", "startTime", startTime)

	// Try to acquire the import lock
	if !s.importLock.TryAcquire() {
		s.logger.Warn("scheduled import skipped: import already in progress")
		return
	}

	// Ensure lock is released after import completes
	defer s.importLock.Release()

	// Create background context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), s.importTimeout)
	defer cancel()

	// Execute the import
	stats, err := s.importService.StartImport(ctx, s.importParams)
	completedAt := time.Now()
	duration := completedAt.Sub(startTime)

	if err != nil {
		s.logger.Error("scheduled import failed",
			"error", err,
			"duration", duration,
			"completedAt", completedAt)
		return
	}

	s.logger.Info("scheduled import completed",
		"categoriesCreated", stats.CategoriesCreated,
		"categoriesUpdated", stats.CategoriesUpdated,
		"productsCreated", stats.ProductsCreated,
		"productsUpdated", stats.ProductsUpdated,
		"duration", duration,
		"completedAt", completedAt)
}
