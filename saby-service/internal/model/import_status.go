package model

import "time"

// ImportStatusType represents the status of an import operation
type ImportStatusType string

const (
	ImportStatusRunning   ImportStatusType = "running"
	ImportStatusCompleted ImportStatusType = "completed"
	ImportStatusFailed    ImportStatusType = "failed"
)

// ImportStatus represents the current status of a catalog import operation
type ImportStatus struct {
	Status            ImportStatusType `json:"status"`
	CategoriesCreated int              `json:"categoriesCreated"`
	CategoriesUpdated int              `json:"categoriesUpdated"`
	ProductsCreated   int              `json:"productsCreated"`
	ProductsUpdated   int              `json:"productsUpdated"`
	StartedAt         time.Time        `json:"startedAt"`
	CompletedAt       *time.Time       `json:"completedAt,omitempty"`
	Error             *string          `json:"error,omitempty"`
}

// ImportStats represents the statistics of a completed import operation
type ImportStats struct {
	CategoriesCreated int
	CategoriesUpdated int
	ProductsCreated   int
	ProductsUpdated   int
}
