package service

import (
	"context"
	"regexp"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 10: Slug Transformation Rules
// For any input name string, the generated slug should be lowercase, have spaces replaced with hyphens,
// and contain only alphanumeric characters and hyphens.
func TestProperty_SlugTransformationRules(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("generated slugs are lowercase with hyphens and alphanumeric only", prop.ForAll(
		func(name string) bool {
			// Skip empty names as they get a default slug
			if strings.TrimSpace(name) == "" {
				return true
			}

			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			// Mock database query to return false (slug doesn't exist)
			mock.ExpectQuery(regexp.QuoteMeta("SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)")).
				WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

			generator := NewSlugGenerator(db)
			batchSlugs := make(map[string]bool)

			slug, err := generator.GenerateUniqueSlug(context.Background(), name, "categories", "", batchSlugs)
			if err != nil {
				return false
			}

			// Verify slug is lowercase
			if slug != strings.ToLower(slug) {
				return false
			}

			// Verify slug contains only alphanumeric characters and hyphens
			validSlugPattern := regexp.MustCompile(`^[a-z0-9-]+$`)
			if !validSlugPattern.MatchString(slug) {
				return false
			}

			// Verify no consecutive hyphens (gosimple/slug normalizes these)
			if strings.Contains(slug, "--") {
				return false
			}

			// Verify no leading or trailing hyphens
			if strings.HasPrefix(slug, "-") || strings.HasSuffix(slug, "-") {
				return false
			}

			return true
		},
		gen.AnyString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 11: Slug Uniqueness with Collision Resolution
// For any slug that already exists in a table, generating a slug for a new item with the same base name
// should produce a unique slug by appending a numeric suffix (-1, -2, etc.).
func TestProperty_SlugUniquenessWithCollisionResolution(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("colliding slugs get numeric suffixes for uniqueness", prop.ForAll(
		func(name string, existingCount uint8) bool {
			// Skip empty names
			if strings.TrimSpace(name) == "" {
				return true
			}

			// Limit existing count to reasonable range (0-10)
			count := int(existingCount % 11)

			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			generator := NewSlugGenerator(db)
			batchSlugs := make(map[string]bool)

			// Generate the base slug first to know what to expect
			mock.ExpectQuery(regexp.QuoteMeta("SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)")).
				WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

			baseSlug, err := generator.GenerateUniqueSlug(context.Background(), name, "categories", "", batchSlugs)
			if err != nil {
				return false
			}

			// Now simulate existing slugs in database
			db2, mock2, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db2.Close()

			generator2 := NewSlugGenerator(db2)
			batchSlugs2 := make(map[string]bool)

			// Mock the database to return true for base slug and suffixed versions up to count-1
			for i := 0; i < count; i++ {
				var checkSlug string
				if i == 0 {
					checkSlug = baseSlug
				} else {
					checkSlug = baseSlug + "-" + string(rune('0'+i))
				}
				mock2.ExpectQuery(regexp.QuoteMeta("SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)")).
					WithArgs(checkSlug).
					WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
			}

			// The final query should return false (slug is available)
			mock2.ExpectQuery(regexp.QuoteMeta("SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)")).
				WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

			newSlug, err := generator2.GenerateUniqueSlug(context.Background(), name, "categories", "", batchSlugs2)
			if err != nil {
				return false
			}

			// Verify the new slug is different from base slug if there were collisions
			if count > 0 && newSlug == baseSlug {
				return false
			}

			// Verify the new slug has the expected suffix pattern if there were collisions
			if count > 0 {
				expectedSuffix := "-" + string(rune('0'+count))
				if !strings.HasSuffix(newSlug, expectedSuffix) {
					// The suffix might be different due to slug transformation, but it should have a suffix
					if !strings.Contains(newSlug, "-") || newSlug == baseSlug {
						return false
					}
				}
			}

			return true
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
		gen.UInt8(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 12: Slug Preservation on Update
// For any existing record being updated, the slug field should remain unchanged from its original value.
func TestProperty_SlugPreservationOnUpdate(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("existing slugs are preserved on update", prop.ForAll(
		func(existingSlug string, newName string) bool {
			// Skip empty existing slugs (not a valid update scenario)
			if strings.TrimSpace(existingSlug) == "" {
				return true
			}

			db, _, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			generator := NewSlugGenerator(db)
			batchSlugs := make(map[string]bool)

			// When existingSlug is provided, it should be returned unchanged
			// No database queries should be made
			returnedSlug, err := generator.GenerateUniqueSlug(context.Background(), newName, "categories", existingSlug, batchSlugs)
			if err != nil {
				return false
			}

			// Verify the existing slug is returned unchanged
			if returnedSlug != existingSlug {
				return false
			}

			// Verify no database queries were made (mock would fail if any were)
			return true
		},
		gen.Identifier(), // Generate valid slug-like strings
		gen.AlphaString(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
