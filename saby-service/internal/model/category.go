package model

import "time"

// Category represents a product category in the database
type Category struct {
	ID                   int       `db:"id"`
	Name                 string    `db:"name"`
	Slug                 string    `db:"slug"`
	ExternalID           string    `db:"external_id"`
	HierarchicalID       int       `db:"hierarchical_id"`
	ParentHierarchicalID *int      `db:"parent_hierarchical_id"`
	IsParent             bool      `db:"is_parent"`
	IsActive             bool      `db:"is_active"`
	ImageURL             *string   `db:"image_url"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}
