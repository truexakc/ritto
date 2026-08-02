package service

import (
	"fmt"
	"saby-service/internal/model"

	"github.com/microcosm-cc/bluemonday"
)

// NomenclatureClassifier separates nomenclatures into categories and products
type NomenclatureClassifier interface {
	Classify(nomenclatures []model.SBISNomenclature) (*ClassifiedNomenclature, error)
}

// ClassifiedNomenclature holds the separated categories and products
type ClassifiedNomenclature struct {
	Categories []model.Category
	Products   []model.Product
}

// nomenclatureClassifierImpl implements the NomenclatureClassifier interface
type nomenclatureClassifierImpl struct {
	htmlPolicy *bluemonday.Policy
}

// NewNomenclatureClassifier creates a new nomenclature classifier
func NewNomenclatureClassifier() NomenclatureClassifier {
	return &nomenclatureClassifierImpl{
		htmlPolicy: bluemonday.StrictPolicy(),
	}
}

// Classify separates nomenclatures into categories and products based on classification rules
// Category rule: isParent=true AND hierarchicalParent=nil
// Product rule: hierarchicalParent != nil
func (c *nomenclatureClassifierImpl) Classify(nomenclatures []model.SBISNomenclature) (*ClassifiedNomenclature, error) {
	result := &ClassifiedNomenclature{
		Categories: make([]model.Category, 0),
		Products:   make([]model.Product, 0),
	}

	for _, nom := range nomenclatures {
		// Category rule: isParent=true AND hierarchicalParent=nil
		if nom.IsParent && nom.HierarchicalParent == nil {
			category := c.nomenclatureToCategory(nom)
			result.Categories = append(result.Categories, category)
		} else if nom.HierarchicalParent != nil {
			// Product rule: hierarchicalParent != nil
			product := c.nomenclatureToProduct(nom)
			result.Products = append(result.Products, product)
		}
	}

	return result, nil
}

// nomenclatureToCategory converts a nomenclature to a category
func (c *nomenclatureClassifierImpl) nomenclatureToCategory(nom model.SBISNomenclature) model.Category {
	// Sanitize HTML from description (though categories typically don't have descriptions)
	sanitizedDescription := c.htmlPolicy.Sanitize(nom.Description)
	_ = sanitizedDescription // Not used for categories, but sanitized for consistency

	var imageURL *string
	if len(nom.Images) > 0 {
		imageURL = &nom.Images[0]
	}

	return model.Category{
		Name:                 nom.Name,
		ExternalID:           nom.UUID,
		HierarchicalID:       nom.HierarchicalID,
		ParentHierarchicalID: nom.HierarchicalParent,
		IsParent:             nom.IsParent,
		IsActive:             true, // Categories are always active by default
		ImageURL:             imageURL,
	}
}

// nomenclatureToProduct converts a nomenclature to a product
func (c *nomenclatureClassifierImpl) nomenclatureToProduct(nom model.SBISNomenclature) model.Product {
	// Sanitize HTML from description
	sanitizedDescription := c.htmlPolicy.Sanitize(nom.Description)

	var imageURL *string
	if len(nom.Images) > 0 {
		imageURL = &nom.Images[0]
	}

	var article, nomNumber, indexNumber, shortCode *string
	if nom.Article != "" {
		article = &nom.Article
	}
	if nom.NomNumber != "" {
		nomNumber = &nom.NomNumber
	}
	if nom.IndexNumber != nil {
		// Convert IndexNumber to string (it can be string or number from API)
		switch v := nom.IndexNumber.(type) {
		case string:
			if v != "" {
				indexNumber = &v
			}
		case float64:
			s := fmt.Sprintf("%.0f", v)
			indexNumber = &s
		case int:
			s := fmt.Sprintf("%d", v)
			indexNumber = &s
		}
	}
	if nom.ShortCode != "" {
		shortCode = &nom.ShortCode
	}

	return model.Product{
		Name:               nom.Name,
		Description:        sanitizedDescription,
		Price:              nom.Cost,
		ExternalID:         nom.UUID,
		HierarchicalID:     nom.HierarchicalID,
		HierarchicalParent: *nom.HierarchicalParent,
		Article:            article,
		NomNumber:          nomNumber,
		IndexNumber:        indexNumber,
		Attributes:         nom.Attributes,
		Modifiers:          nom.Modifiers,
		IsKit:              nom.IsKit,
		IsPublished:        nom.IsPublished,
		IsAvailable:        nom.Stock > 0,
		ShortCode:          shortCode,
		Stock:              nom.Stock,
		Images:             nom.Images,
		ImageURL:           imageURL,
	}
}
