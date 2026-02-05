package service

// ImportLock provides a mechanism to prevent concurrent import execution.
// It uses a channel-based lock to ensure only one import can run at a time.
type ImportLock interface {
	// TryAcquire attempts to acquire the lock without blocking.
	// Returns true if the lock was acquired, false if it's already held.
	TryAcquire() bool

	// Release releases the lock, allowing another import to acquire it.
	Release()
}

// importLockImpl implements ImportLock using a buffered channel.
type importLockImpl struct {
	ch chan struct{}
}

// NewImportLock creates a new ImportLock instance.
func NewImportLock() ImportLock {
	return &importLockImpl{
		ch: make(chan struct{}, 1),
	}
}

// TryAcquire attempts to acquire the lock without blocking.
// It uses a non-blocking send to the channel.
func (l *importLockImpl) TryAcquire() bool {
	select {
	case l.ch <- struct{}{}:
		return true
	default:
		return false
	}
}

// Release releases the lock by receiving from the channel.
func (l *importLockImpl) Release() {
	<-l.ch
}
