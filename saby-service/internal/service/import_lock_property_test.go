package service

import (
	"sync"
	"testing"
	"time"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 16: Lock Contention Handling
// For any attempt to start an import while another import is running, the lock acquisition should fail,
// and the operation should return an error or skip execution without starting a second import.
func TestProperty_LockContentionHandling(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("concurrent lock acquisition attempts should only allow one to succeed", prop.ForAll(
		func(numGoroutines int) bool {
			lock := NewImportLock()

			// Track successful acquisitions
			successCount := 0
			var mu sync.Mutex
			var wg sync.WaitGroup

			// Launch multiple goroutines trying to acquire the lock concurrently
			wg.Add(numGoroutines)
			for i := 0; i < numGoroutines; i++ {
				go func() {
					defer wg.Done()
					if lock.TryAcquire() {
						mu.Lock()
						successCount++
						mu.Unlock()
						// Hold the lock briefly to simulate work
						time.Sleep(10 * time.Millisecond)
						lock.Release()
					}
				}()
			}

			wg.Wait()

			// Exactly one goroutine should have acquired the lock
			return successCount == 1
		},
		gen.IntRange(2, 20), // Test with 2-20 concurrent goroutines
	))

	properties.Property("lock can be acquired after release", prop.ForAll(
		func(numCycles int) bool {
			lock := NewImportLock()

			// Perform multiple acquire-release cycles
			for i := 0; i < numCycles; i++ {
				// First acquisition should succeed
				if !lock.TryAcquire() {
					return false
				}

				// Second acquisition should fail while lock is held
				if lock.TryAcquire() {
					return false
				}

				// Release the lock
				lock.Release()

				// After release, acquisition should succeed again
				if !lock.TryAcquire() {
					return false
				}

				lock.Release()
			}

			return true
		},
		gen.IntRange(1, 10), // Test with 1-10 cycles
	))

	properties.Property("multiple sequential acquisitions after release should succeed", prop.ForAll(
		func(numAttempts int) bool {
			lock := NewImportLock()

			for i := 0; i < numAttempts; i++ {
				// Each acquisition should succeed
				if !lock.TryAcquire() {
					return false
				}
				// Release immediately
				lock.Release()
			}

			return true
		},
		gen.IntRange(1, 50), // Test with 1-50 sequential attempts
	))

	properties.Property("lock prevents concurrent execution", prop.ForAll(
		func(numGoroutines int) bool {
			lock := NewImportLock()

			// Track concurrent executions
			concurrentCount := 0
			maxConcurrent := 0
			var mu sync.Mutex
			var wg sync.WaitGroup

			wg.Add(numGoroutines)
			for i := 0; i < numGoroutines; i++ {
				go func() {
					defer wg.Done()
					if lock.TryAcquire() {
						// Increment concurrent count
						mu.Lock()
						concurrentCount++
						if concurrentCount > maxConcurrent {
							maxConcurrent = concurrentCount
						}
						mu.Unlock()

						// Simulate work
						time.Sleep(10 * time.Millisecond)

						// Decrement concurrent count
						mu.Lock()
						concurrentCount--
						mu.Unlock()

						lock.Release()
					}
				}()
			}

			wg.Wait()

			// Maximum concurrent executions should never exceed 1
			return maxConcurrent == 1
		},
		gen.IntRange(2, 20), // Test with 2-20 concurrent goroutines
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
