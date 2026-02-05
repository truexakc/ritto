package model

import "time"

// Product represents a product in the database
type Product struct {
	ID                 int                    `db:"id"`
	CategoryID         int                    `db:"category_id"`
	Name               string                 `db:"name"`
	Slug               string                 `db:"slug"`
	Description        string                 `db:"description"`
	Price              float64                `db:"price"`
	ExternalID         string                 `db:"external_id"`
	HierarchicalID     int                    `db:"hierarchical_id"`
	HierarchicalParent int                    `db:"hierarchical_parent"`
	Article            *string                `db:"article"`
	NomNumber          *string                `db:"nom_number"`
	IndexNumber        *string                `db:"index_number"`
	Attributes         map[string]interface{} `db:"attributes"`
	Modifiers          []interface{}          `db:"modifiers"`
	IsKit              bool                   `db:"is_kit"`
	IsPublished        bool                   `db:"is_published"`
	IsAvailable        bool                   `db:"is_available"`
	ShortCode          *string                `db:"short_code"`
	Stock              int                    `db:"stock"`
	Images             []string               `db:"images"`
	ImageURL           *string                `db:"image_url"`
	CreatedAt          time.Time              `db:"created_at"`
	UpdatedAt          time.Time              `db:"updated_at"`
}
