package service

import (
	"testing"

	"saby-service/internal/model"
)

func TestClassifier_Categories(t *testing.T) {
	classifier := NewNomenclatureClassifier()

	// Create test nomenclatures
	nomenclatures := []model.SBISNomenclature{
		{
			UUID:               "cat-1",
			Name:               "Beverages",
			IsParent:           true,
			HierarchicalParent: nil,
			HierarchicalID:     1,
			IsPublished:        true,
		},
		{
			UUID:               "cat-2",
			Name:               "Food",
			IsParent:           true,
			HierarchicalParent: nil,
			HierarchicalID:     2,
			IsPublished:        true,
		},
	}

	result, err := classifier.Classify(nomenclatures)
	if err != nil {
		t.Fatalf("Classify failed: %v", err)
	}

	if len(result.Categories) != 2 {
		t.Errorf("Expected 2 categories, got %d", len(result.Categories))
	}

	if len(result.Products) != 0 {
		t.Errorf("Expected 0 products, got %d", len(result.Products))
	}

	// Verify category fields
	if result.Categories[0].Name != "Beverages" {
		t.Errorf("Expected category name 'Beverages', got '%s'", result.Categories[0].Name)
	}
	if result.Categories[0].ExternalID != "cat-1" {
		t.Errorf("Expected external_id 'cat-1', got '%s'", result.Categories[0].ExternalID)
	}
	if !result.Categories[0].IsActive {
		t.Error("Expected category to be active")
	}
}

func TestClassifier_Products(t *testing.T) {
	classifier := NewNomenclatureClassifier()

	hierarchicalParent := 1

	// Create test nomenclatures
	nomenclatures := []model.SBISNomenclature{
		{
			UUID:               "prod-1",
			Name:               "Coffee",
			Description:        "Fresh coffee",
			Cost:               5.99,
			IsParent:           false,
			HierarchicalParent: &hierarchicalParent,
			HierarchicalID:     10,
			IsPublished:        true,
			Stock:              50,
		},
		{
			UUID:               "prod-2",
			Name:               "Tea",
			Description:        "Green tea",
			Cost:               3.99,
			IsParent:           false,
			HierarchicalParent: &hierarchicalParent,
			HierarchicalID:     11,
			IsPublished:        true,
			Stock:              0,
		},
	}

	result, err := classifier.Classify(nomenclatures)
	if err != nil {
		t.Fatalf("Classify failed: %v", err)
	}

	if len(result.Categories) != 0 {
		t.Errorf("Expected 0 categories, got %d", len(result.Categories))
	}

	if len(result.Products) != 2 {
		t.Errorf("Expected 2 products, got %d", len(result.Products))
	}

	// Verify product fields
	if result.Products[0].Name != "Coffee" {
		t.Errorf("Expected product name 'Coffee', got '%s'", result.Products[0].Name)
	}
	if result.Products[0].Price != 5.99 {
		t.Errorf("Expected price 5.99, got %f", result.Products[0].Price)
	}
	if !result.Products[0].IsAvailable {
		t.Error("Expected product with stock > 0 to be available")
	}
	if result.Products[1].IsAvailable {
		t.Error("Expected product with stock = 0 to be unavailable")
	}
}

func TestClassifier_HTMLSanitization(t *testing.T) {
	classifier := NewNomenclatureClassifier()

	hierarchicalParent := 1

	// Create test nomenclature with HTML in description
	nomenclatures := []model.SBISNomenclature{
		{
			UUID:               "prod-1",
			Name:               "Coffee",
			Description:        "<p>Fresh <strong>coffee</strong> with <script>alert('xss')</script></p>",
			Cost:               5.99,
			HierarchicalParent: &hierarchicalParent,
			HierarchicalID:     10,
		},
	}

	result, err := classifier.Classify(nomenclatures)
	if err != nil {
		t.Fatalf("Classify failed: %v", err)
	}

	if len(result.Products) != 1 {
		t.Fatalf("Expected 1 product, got %d", len(result.Products))
	}

	// Verify HTML tags are removed
	description := result.Products[0].Description
	if description == "" {
		t.Error("Expected non-empty description after sanitization")
	}

	// Should not contain any HTML tags
	if containsHTMLTags(description) {
		t.Errorf("Description still contains HTML tags: %s", description)
	}
}

func TestClassifier_Mixed(t *testing.T) {
	classifier := NewNomenclatureClassifier()

	hierarchicalParent := 1

	// Create mixed nomenclatures
	nomenclatures := []model.SBISNomenclature{
		{
			UUID:               "cat-1",
			Name:               "Beverages",
			IsParent:           true,
			HierarchicalParent: nil,
			HierarchicalID:     1,
		},
		{
			UUID:               "prod-1",
			Name:               "Coffee",
			Cost:               5.99,
			HierarchicalParent: &hierarchicalParent,
			HierarchicalID:     10,
		},
		{
			UUID:               "cat-2",
			Name:               "Food",
			IsParent:           true,
			HierarchicalParent: nil,
			HierarchicalID:     2,
		},
		{
			UUID:               "prod-2",
			Name:               "Sandwich",
			Cost:               7.99,
			HierarchicalParent: &hierarchicalParent,
			HierarchicalID:     20,
		},
	}

	result, err := classifier.Classify(nomenclatures)
	if err != nil {
		t.Fatalf("Classify failed: %v", err)
	}

	if len(result.Categories) != 2 {
		t.Errorf("Expected 2 categories, got %d", len(result.Categories))
	}

	if len(result.Products) != 2 {
		t.Errorf("Expected 2 products, got %d", len(result.Products))
	}
}

func TestClassifier_EmptyInput(t *testing.T) {
	classifier := NewNomenclatureClassifier()

	result, err := classifier.Classify([]model.SBISNomenclature{})
	if err != nil {
		t.Fatalf("Classify failed: %v", err)
	}

	if len(result.Categories) != 0 {
		t.Errorf("Expected 0 categories, got %d", len(result.Categories))
	}

	if len(result.Products) != 0 {
		t.Errorf("Expected 0 products, got %d", len(result.Products))
	}
}

// Helper function to check if string contains HTML tags
func containsHTMLTags(s string) bool {
	return len(s) > 0 && (s[0] == '<' || s[len(s)-1] == '>')
}
