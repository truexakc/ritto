package service

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/gosimple/slug"
)

// SlugGenerator generates unique URL-friendly slugs for categories and products
type SlugGenerator interface {
	GenerateUniqueSlug(ctx context.Context, name string, table string, existingSlug string, batchSlugs map[string]bool) (string, error)
}

// slugGeneratorImpl implements the SlugGenerator interface
type slugGeneratorImpl struct {
	db *sql.DB
}

// NewSlugGenerator creates a new slug generator
func NewSlugGenerator(db *sql.DB) SlugGenerator {
	return &slugGeneratorImpl{
		db: db,
	}
}

// GenerateUniqueSlug generates a unique slug from a name
// If existingSlug is provided (update operation), it returns it unchanged
// Otherwise, it generates a new slug and ensures uniqueness by checking:
// 1. The batchSlugs map (for intra-batch collision detection)
// 2. The database table
// If a collision is found, it appends a numeric suffix (-1, -2, etc.)
func (g *slugGeneratorImpl) GenerateUniqueSlug(ctx context.Context, name string, table string, existingSlug string, batchSlugs map[string]bool) (string, error) {
	// Preserve existing slug on updates
	if existingSlug != "" {
		return existingSlug, nil
	}

	// Generate base slug using gosimple/slug library
	// This handles transliteration, lowercase conversion, and special character removal
	baseSlug := slug.Make(name)

	// If base slug is empty (e.g., name was all special characters), use a default
	if baseSlug == "" {
		baseSlug = "item"
	}

	// Check uniqueness and add suffix if needed
	candidateSlug := baseSlug
	suffix := 0

	for {
		// Check if slug exists in batch map first (intra-batch collision)
		if batchSlugs[candidateSlug] {
			suffix++
			candidateSlug = fmt.Sprintf("%s-%d", baseSlug, suffix)
			continue
		}

		// Check if slug exists in database
		exists, err := g.slugExistsInDB(ctx, candidateSlug, table)
		if err != nil {
			return "", fmt.Errorf("failed to check slug uniqueness: %w", err)
		}

		if !exists {
			// Slug is unique, add it to batch map and return
			batchSlugs[candidateSlug] = true
			return candidateSlug, nil
		}

		// Slug exists in DB, try with suffix
		suffix++
		candidateSlug = fmt.Sprintf("%s-%d", baseSlug, suffix)
	}
}

// slugExistsInDB checks if a slug already exists in the specified table
func (g *slugGeneratorImpl) slugExistsInDB(ctx context.Context, slug string, table string) (bool, error) {
	// Validate table name to prevent SQL injection
	if table != "categories" && table != "products" {
		return false, fmt.Errorf("invalid table name: %s", table)
	}

	query := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM %s WHERE slug = $1)", table)

	var exists bool
	err := g.db.QueryRowContext(ctx, query, slug).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
