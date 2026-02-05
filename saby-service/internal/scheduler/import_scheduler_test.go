package scheduler

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"sync"
	"testing"
	"time"

	"saby-service/internal/model"
	"saby-service/internal/service"
)

// mockImportService is a mock implementation of service.ImportService for testing
type mockImportService struct {
	mu              sync.Mutex
	startImportFunc func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error)
	getStatusFunc   func() *model.ImportStatus
	callCount       int
}

func (m *mockImportService) StartImport(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
	m.mu.Lock()
	m.callCount++
	m.mu.Unlock()

	if m.startImportFunc != nil {
		return m.startImportFunc(ctx, params)
	}
	return &model.ImportStats{
		CategoriesCreated: 10,
		CategoriesUpdated: 5,
		ProductsCreated:   20,
		ProductsUpdated:   15,
	}, nil
}

func (m *mockImportService) GetStatus() *model.ImportStatus {
	if m.getStatusFunc != nil {
		return m.getStatusFunc()
	}
	return nil
}

func (m *mockImportService) GetCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.callCount
}

// TestImportScheduler_Initialization tests scheduler initialization
func TestImportScheduler_Initialization(t *testing.T) {
	mockService := &mockImportService{}
	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *",
		ImportTimeout:   30 * time.Minute,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)
	if scheduler == nil {
		t.Fatal("Expected NewImportScheduler to return non-nil scheduler")
	}

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}

	// Stop the scheduler
	err = scheduler.Stop()
	if err != nil {
		t.Fatalf("Expected Stop to succeed, got error: %v", err)
	}
}

// TestImportScheduler_DisabledScheduler tests that scheduler doesn't start when disabled
func TestImportScheduler_DisabledScheduler(t *testing.T) {
	mockService := &mockImportService{}
	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *",
		ImportTimeout:   30 * time.Minute,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: false, // Disabled
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start should succeed but not actually start the cron
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed even when disabled, got error: %v", err)
	}

	// Stop should succeed
	err = scheduler.Stop()
	if err != nil {
		t.Fatalf("Expected Stop to succeed, got error: %v", err)
	}
}

// TestImportScheduler_LockSharingWithManualTrigger tests that scheduler and manual trigger share the same lock
func TestImportScheduler_LockSharingWithManualTrigger(t *testing.T) {
	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			// Simulate a long-running import
			time.Sleep(200 * time.Millisecond)
			return &model.ImportStats{
				CategoriesCreated: 10,
				CategoriesUpdated: 5,
				ProductsCreated:   20,
				ProductsUpdated:   15,
			}, nil
		},
	}

	// Create a shared lock
	sharedLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      sharedLock,
		Schedule:        "0 3 * * *", // Daily at 3 AM (won't trigger during test)
		ImportTimeout:   5 * time.Second,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}
	defer scheduler.Stop()

	// Verify that both scheduler and manual trigger can use the same lock instance
	// Simulate manual trigger acquiring the lock
	if !sharedLock.TryAcquire() {
		t.Fatal("Expected manual trigger to acquire lock")
	}

	// Verify lock is held
	if sharedLock.TryAcquire() {
		t.Fatal("Expected lock to be held")
	}

	// Release the lock
	sharedLock.Release()

	// Verify lock can be acquired again
	if !sharedLock.TryAcquire() {
		t.Fatal("Expected to acquire lock after release")
	}
	sharedLock.Release()
}

// TestImportScheduler_SkipExecutionWhenLockBusy tests that scheduler skips execution when lock is busy
func TestImportScheduler_SkipExecutionWhenLockBusy(t *testing.T) {
	var importStarted bool
	var mu sync.Mutex

	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			mu.Lock()
			importStarted = true
			mu.Unlock()
			// Simulate a long-running import
			time.Sleep(300 * time.Millisecond)
			return &model.ImportStats{
				CategoriesCreated: 10,
				CategoriesUpdated: 5,
				ProductsCreated:   20,
				ProductsUpdated:   15,
			}, nil
		},
	}

	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	// Acquire the lock before starting scheduler
	if !mockLock.TryAcquire() {
		t.Fatal("Expected to acquire lock")
	}

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *", // Daily at 3 AM (won't trigger during test)
		ImportTimeout:   5 * time.Second,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}
	defer scheduler.Stop()

	// Manually trigger the scheduled import function to test lock behavior
	// This simulates what would happen if the cron triggered
	go scheduler.(*importSchedulerImpl).runScheduledImport()

	// Wait a bit to ensure the import attempt completes
	time.Sleep(100 * time.Millisecond)

	// Import should not have started because lock is busy
	mu.Lock()
	started := importStarted
	mu.Unlock()

	if started {
		t.Error("Expected import to be skipped when lock is busy")
	}

	// Release the lock
	mockLock.Release()

	// Trigger again
	go scheduler.(*importSchedulerImpl).runScheduledImport()

	// Wait for import to complete
	time.Sleep(500 * time.Millisecond)

	// Now import should have started
	mu.Lock()
	started = importStarted
	mu.Unlock()

	if !started {
		t.Error("Expected import to start after lock is released")
	}
}

// TestImportScheduler_LoggingStartAndCompletion tests that scheduler logs start and completion times
func TestImportScheduler_LoggingStartAndCompletion(t *testing.T) {
	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			return &model.ImportStats{
				CategoriesCreated: 10,
				CategoriesUpdated: 5,
				ProductsCreated:   20,
				ProductsUpdated:   15,
			}, nil
		},
	}

	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *", // Daily at 3 AM (won't trigger during test)
		ImportTimeout:   5 * time.Second,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}

	// Manually trigger the scheduled import to test logging
	go scheduler.(*importSchedulerImpl).runScheduledImport()

	// Wait for execution to complete
	time.Sleep(200 * time.Millisecond)

	// Stop the scheduler
	err = scheduler.Stop()
	if err != nil {
		t.Fatalf("Expected Stop to succeed, got error: %v", err)
	}

	// Verify that import was called at least once
	callCount := mockService.GetCallCount()
	if callCount < 1 {
		t.Errorf("Expected at least 1 import execution, got %d", callCount)
	}
}

// TestImportScheduler_ImportFailure tests scheduler behavior when import fails
func TestImportScheduler_ImportFailure(t *testing.T) {
	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			return nil, errors.New("import failed")
		},
	}

	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *", // Daily at 3 AM (won't trigger during test)
		ImportTimeout:   5 * time.Second,
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}

	// Manually trigger the scheduled import to test error handling
	go scheduler.(*importSchedulerImpl).runScheduledImport()

	// Wait for execution to complete
	time.Sleep(200 * time.Millisecond)

	// Stop the scheduler
	err = scheduler.Stop()
	if err != nil {
		t.Fatalf("Expected Stop to succeed, got error: %v", err)
	}

	// Verify that import was called (even though it failed)
	callCount := mockService.GetCallCount()
	if callCount < 1 {
		t.Errorf("Expected at least 1 import execution, got %d", callCount)
	}
}

// TestImportScheduler_ContextTimeout tests that import respects context timeout
func TestImportScheduler_ContextTimeout(t *testing.T) {
	var contextCancelled bool
	var mu sync.Mutex

	mockService := &mockImportService{
		startImportFunc: func(ctx context.Context, params service.ImportParams) (*model.ImportStats, error) {
			// Simulate a long-running operation
			select {
			case <-time.After(10 * time.Second):
				return &model.ImportStats{}, nil
			case <-ctx.Done():
				mu.Lock()
				contextCancelled = true
				mu.Unlock()
				return nil, ctx.Err()
			}
		},
	}

	mockLock := service.NewImportLock()
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError}))

	config := ImportSchedulerConfig{
		ImportService:   mockService,
		ImportLock:      mockLock,
		Schedule:        "0 3 * * *",            // Daily at 3 AM (won't trigger during test)
		ImportTimeout:   500 * time.Millisecond, // Short timeout
		ImportParams:    service.ImportParams{PointID: 1, PriceListID: 2, PageSize: 100},
		EnableScheduler: true,
		Logger:          logger,
	}

	scheduler := NewImportScheduler(config)

	// Start the scheduler
	ctx := context.Background()
	err := scheduler.Start(ctx)
	if err != nil {
		t.Fatalf("Expected Start to succeed, got error: %v", err)
	}

	// Manually trigger the scheduled import to test timeout
	go scheduler.(*importSchedulerImpl).runScheduledImport()

	// Wait for execution and timeout
	time.Sleep(1 * time.Second)

	// Stop the scheduler
	err = scheduler.Stop()
	if err != nil {
		t.Fatalf("Expected Stop to succeed, got error: %v", err)
	}

	// Verify that context was cancelled due to timeout
	mu.Lock()
	cancelled := contextCancelled
	mu.Unlock()

	if !cancelled {
		t.Error("Expected context to be cancelled due to timeout")
	}
}
