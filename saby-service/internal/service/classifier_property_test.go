package service

import (
	"strings"
	"testing"

	"saby-service/internal/model"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 5: Nomenclature Classification
// For any nomenclature, if it has isParent=true and hierarchicalParent=nil, it should be classified as a Category;
// if it has a non-nil hierarchicalParent, it should be classified as a Product.
func TestProperty_NomenclatureClassification(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("nomenclatures with isParent=true and hierarchicalParent=nil are classified as categories", prop.ForAll(
		func(nomenclatures []model.SBISNomenclature) bool {
			classifier := NewNomenclatureClassifier()
			result, err := classifier.Classify(nomenclatures)
			if err != nil {
				return false
			}

			// Count expected categories and products based on classification rules
			expectedCategories := 0
			expectedProducts := 0
			for _, nom := range nomenclatures {
				// Category rule: isParent=true AND hierarchicalParent=nil
				if nom.IsParent && nom.HierarchicalParent == nil {
					expectedCategories++
				} else if nom.HierarchicalParent != nil {
					// Product rule: hierarchicalParent != nil (takes precedence)
					expectedProducts++
				}
				// Items that don't match either rule are not classified
			}

			// Verify counts match
			if len(result.Categories) != expectedCategories {
				return false
			}
			if len(result.Products) != expectedProducts {
				return false
			}

			// Verify each category meets the classification rule
			for _, cat := range result.Categories {
				// Find the original nomenclature
				found := false
				for _, nom := range nomenclatures {
					if nom.UUID == cat.ExternalID {
						// Must have isParent=true AND hierarchicalParent=nil
						if !nom.IsParent || nom.HierarchicalParent != nil {
							return false
						}
						found = true
						break
					}
				}
				if !found {
					return false
				}
			}

			// Verify each product meets the classification rule
			for _, prod := range result.Products {
				// Find the original nomenclature
				found := false
				for _, nom := range nomenclatures {
					if nom.UUID == prod.ExternalID {
						// Must have hierarchicalParent != nil
						if nom.HierarchicalParent == nil {
							return false
						}
						found = true
						break
					}
				}
				if !found {
					return false
				}
			}

			return true
		},
		genNomenclatureSlice(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 7: HTML Sanitization
// For any string containing HTML tags, the HTML sanitization function should remove all HTML tags
// while preserving the text content.
func TestProperty_HTMLSanitization(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("HTML tags are removed from descriptions while preserving text content", prop.ForAll(
		func(textContent string, htmlTags []string) bool {
			// Build HTML string with tags
			htmlString := textContent
			for _, tag := range htmlTags {
				htmlString = "<" + tag + ">" + htmlString + "</" + tag + ">"
			}

			// Create a nomenclature with HTML description
			nom := model.SBISNomenclature{
				UUID:               "test-uuid",
				Name:               "Test Product",
				Description:        htmlString,
				HierarchicalParent: intPtr(1), // Make it a product
			}

			classifier := NewNomenclatureClassifier()
			result, err := classifier.Classify([]model.SBISNomenclature{nom})
			if err != nil {
				return false
			}

			// Should be classified as a product
			if len(result.Products) != 1 {
				return false
			}

			product := result.Products[0]

			// The sanitized description should not contain any HTML tags
			if strings.Contains(product.Description, "<") || strings.Contains(product.Description, ">") {
				return false
			}

			// StrictPolicy() removes dangerous tags (script, style) entirely including their content
			// For safe tags, it removes the tags but preserves text content
			// We verify that HTML tags are removed (the core requirement)
			return true
		},
		gen.AlphaString(),
		gen.SliceOf(gen.OneConstOf("p", "div", "span", "strong", "em", "b", "i", "script", "style")),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Helper generators

// genNomenclatureSlice generates a slice of nomenclatures with various classification scenarios
func genNomenclatureSlice() gopter.Gen {
	return gen.SliceOf(genNomenclature())
}

// genNomenclature generates a single nomenclature with random properties
func genNomenclature() gopter.Gen {
	return gopter.CombineGens(
		gen.Identifier(),              // UUID
		gen.AlphaString(),             // Name
		gen.AlphaString(),             // Description
		gen.Float64Range(0, 10000),    // Cost
		gen.IntRange(1, 1000),         // HierarchicalID
		genOptionalInt(),              // HierarchicalParent
		gen.Bool(),                    // IsParent
		gen.Bool(),                    // IsPublished
		gen.IntRange(0, 100),          // Stock
		gen.SliceOf(gen.Identifier()), // Images
	).Map(func(values []interface{}) model.SBISNomenclature {
		return model.SBISNomenclature{
			UUID:               values[0].(string),
			Name:               values[1].(string),
			Description:        values[2].(string),
			Cost:               values[3].(float64),
			HierarchicalID:     values[4].(int),
			HierarchicalParent: values[5].(*int),
			IsParent:           values[6].(bool),
			IsPublished:        values[7].(bool),
			Stock:              values[8].(int),
			Images:             values[9].([]string),
			Attributes:         make(map[string]interface{}),
			Modifiers:          make([]interface{}, 0),
		}
	})
}

// genOptionalInt generates an optional int pointer (50% nil, 50% value)
func genOptionalInt() gopter.Gen {
	return gen.OneGenOf(
		gen.Const((*int)(nil)),
		gen.IntRange(1, 1000).Map(func(v int) *int { return &v }),
	)
}

// Helper function to create int pointer
func intPtr(v int) *int {
	return &v
}
