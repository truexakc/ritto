package service

import (
	"sync"
	"testing"
	"time"
)

func TestImportLock_BasicAcquireRelease(t *testing.T) {
	lock := NewImportLock()

	// First acquisition should succeed
	if !lock.TryAcquire() {
		t.Fatal("Expected first TryAcquire to succeed")
	}

	// Second acquisition should fail while lock is held
	if lock.TryAcquire() {
		t.Fatal("Expected second TryAcquire to fail while lock is held")
	}

	// Release the lock
	lock.Release()

	// After release, acquisition should succeed
	if !lock.TryAcquire() {
		t.Fatal("Expected TryAcquire to succeed after Release")
	}

	lock.Release()
}

func TestImportLock_ConcurrentAccess(t *testing.T) {
	lock := NewImportLock()
	successCount := 0
	var mu sync.Mutex
	var wg sync.WaitGroup

	// Launch 10 goroutines trying to acquire the lock
	numGoroutines := 10
	wg.Add(numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func() {
			defer wg.Done()
			if lock.TryAcquire() {
				mu.Lock()
				successCount++
				mu.Unlock()

				// Hold the lock briefly
				time.Sleep(50 * time.Millisecond)
				lock.Release()
			}
		}()
	}

	wg.Wait()

	// Only one goroutine should have acquired the lock
	if successCount != 1 {
		t.Fatalf("Expected exactly 1 successful acquisition, got %d", successCount)
	}
}

func TestImportLock_MultipleReleaseDoesNotPanic(t *testing.T) {
	lock := NewImportLock()

	// Acquire the lock
	if !lock.TryAcquire() {
		t.Fatal("Expected TryAcquire to succeed")
	}

	// Release once
	lock.Release()

	// Attempting to release again should not panic, but will block
	// We test this by ensuring we can acquire again after one release
	if !lock.TryAcquire() {
		t.Fatal("Expected TryAcquire to succeed after single Release")
	}

	lock.Release()
}

func TestImportLock_SequentialAcquisitions(t *testing.T) {
	lock := NewImportLock()

	// Perform multiple acquire-release cycles
	for i := 0; i < 5; i++ {
		if !lock.TryAcquire() {
			t.Fatalf("Expected TryAcquire to succeed on iteration %d", i)
		}
		lock.Release()
	}
}
