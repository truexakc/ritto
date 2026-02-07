package model

import (
	"database/sql"
	"encoding/json"
	"time"
)

// CategoryResponse represents a category in API responses
type CategoryResponse struct {
	ID                   string  `json:"id"`
	Name                 string  `json:"name"`
	Slug                 string  `json:"slug"`
	Description          *string `json:"description,omitempty"`
	ImageURL             *string `json:"image_url,omitempty"`
	IsActive             bool    `json:"is_active"`
	ExternalID           string  `json:"external_id"`
	HierarchicalID       int     `json:"hierarchical_id"`
	ParentHierarchicalID *int    `json:"parent_hierarchical_id,omitempty"`
	IsParent             bool    `json:"is_parent"`
	CreatedAt            string  `json:"created_at"`
	UpdatedAt            string  `json:"updated_at"`
}

// ProductResponse represents a product in API responses
type ProductResponse struct {
	ID                 string                 `json:"id"`
	CategoryID         *string                `json:"category_id,omitempty"`
	CategoryName       *string                `json:"category_name,omitempty"`
	Name               string                 `json:"name"`
	Slug               string                 `json:"slug"`
	Description        *string                `json:"description,omitempty"`
	Price              float64                `json:"price"`
	DiscountPrice      *float64               `json:"discount_price,omitempty"`
	ImageURL           *string                `json:"image_url,omitempty"`
	Images             []string               `json:"images"`
	Stock              int                    `json:"stock"`
	IsAvailable        bool                   `json:"is_available"`
	IsFeatured         bool                   `json:"is_featured"`
	IsPopular          bool                   `json:"is_popular"`
	Weight             *float64               `json:"weight,omitempty"`
	Unit               string                 `json:"unit"`
	ExternalID         string                 `json:"external_id"`
	HierarchicalID     int                    `json:"hierarchical_id"`
	HierarchicalParent int                    `json:"hierarchical_parent"`
	Article            *string                `json:"article,omitempty"`
	NomNumber          *string                `json:"nom_number,omitempty"`
	IndexNumber        *int                   `json:"index_number,omitempty"`
	Attributes         map[string]interface{} `json:"attributes"`
	Modifiers          []interface{}          `json:"modifiers"`
	IsKit              bool                   `json:"is_kit"`
	IsPublished        bool                   `json:"is_published"`
	ShortCode          *string                `json:"short_code,omitempty"`
	Sort               int                    `json:"sort"`
	CreatedAt          string                 `json:"created_at"`
	UpdatedAt          string                 `json:"updated_at"`
}

// PopularProductResponse represents a popular product with order count
type PopularProductResponse struct {
	ProductResponse
	OrderCount int `json:"order_count"`
}

// ProductFilter represents filtering parameters for product queries
type ProductFilter struct {
	CategoryID         *string
	HierarchicalParent *int
	Search             *string
	Page               *int
	Limit              *int
}

// ProductListResponse represents a paginated list of products
type ProductListResponse struct {
	Products []ProductResponse `json:"products,omitempty"`
	Total    *int              `json:"total,omitempty"`
	Page     *int              `json:"page,omitempty"`
	Pages    *int              `json:"pages,omitempty"`
}

// Helper methods for converting from database models to response models

// NewCategoryResponseFromDB creates a CategoryResponse from database row scan
func NewCategoryResponseFromDB(
	id string,
	name string,
	slug string,
	description sql.NullString,
	imageURL sql.NullString,
	isActive bool,
	externalID string,
	hierarchicalID int,
	parentHierarchicalID sql.NullInt64,
	isParent bool,
	createdAt time.Time,
	updatedAt time.Time,
) CategoryResponse {
	resp := CategoryResponse{
		ID:             id,
		Name:           name,
		Slug:           slug,
		IsActive:       isActive,
		ExternalID:     externalID,
		HierarchicalID: hierarchicalID,
		IsParent:       isParent,
		CreatedAt:      createdAt.Format(time.RFC3339),
		UpdatedAt:      updatedAt.Format(time.RFC3339),
	}

	if description.Valid {
		resp.Description = &description.String
	}

	if imageURL.Valid {
		resp.ImageURL = &imageURL.String
	}

	if parentHierarchicalID.Valid {
		parentID := int(parentHierarchicalID.Int64)
		resp.ParentHierarchicalID = &parentID
	}

	return resp
}

// NewProductResponseFromDB creates a ProductResponse from database row scan
func NewProductResponseFromDB(
	id string,
	categoryID sql.NullString,
	categoryName sql.NullString,
	name string,
	slug string,
	description sql.NullString,
	price float64,
	discountPrice sql.NullFloat64,
	imageURL sql.NullString,
	imagesJSON []byte,
	stock int,
	isAvailable bool,
	isFeatured bool,
	isPopular bool,
	weight sql.NullFloat64,
	unit string,
	externalID string,
	hierarchicalID int,
	hierarchicalParent int,
	article sql.NullString,
	nomNumber sql.NullString,
	indexNumber sql.NullInt64,
	attributesJSON []byte,
	modifiersJSON []byte,
	isKit bool,
	isPublished bool,
	shortCode sql.NullString,
	sort int,
	createdAt time.Time,
	updatedAt time.Time,
) (ProductResponse, error) {
	resp := ProductResponse{
		ID:                 id,
		Name:               name,
		Slug:               slug,
		Price:              price,
		Stock:              stock,
		IsAvailable:        isAvailable,
		IsFeatured:         isFeatured,
		IsPopular:          isPopular,
		Unit:               unit,
		ExternalID:         externalID,
		HierarchicalID:     hierarchicalID,
		HierarchicalParent: hierarchicalParent,
		IsKit:              isKit,
		IsPublished:        isPublished,
		Sort:               sort,
		CreatedAt:          createdAt.Format(time.RFC3339),
		UpdatedAt:          updatedAt.Format(time.RFC3339),
		Images:             []string{},
		Attributes:         make(map[string]interface{}),
		Modifiers:          []interface{}{},
	}

	// Handle nullable string fields
	if categoryID.Valid {
		resp.CategoryID = &categoryID.String
	}

	if categoryName.Valid {
		resp.CategoryName = &categoryName.String
	}

	if description.Valid {
		resp.Description = &description.String
	}

	if discountPrice.Valid {
		resp.DiscountPrice = &discountPrice.Float64
	}

	if imageURL.Valid {
		resp.ImageURL = &imageURL.String
	}

	if weight.Valid {
		resp.Weight = &weight.Float64
	}

	if article.Valid {
		resp.Article = &article.String
	}

	if nomNumber.Valid {
		resp.NomNumber = &nomNumber.String
	}

	if indexNumber.Valid {
		idx := int(indexNumber.Int64)
		resp.IndexNumber = &idx
	}

	if shortCode.Valid {
		resp.ShortCode = &shortCode.String
	}

	// Parse JSONB fields
	if len(imagesJSON) > 0 {
		var images []string
		if err := json.Unmarshal(imagesJSON, &images); err != nil {
			return resp, err
		}
		resp.Images = images
	}

	if len(attributesJSON) > 0 {
		var attributes map[string]interface{}
		if err := json.Unmarshal(attributesJSON, &attributes); err != nil {
			return resp, err
		}
		resp.Attributes = attributes
	}

	if len(modifiersJSON) > 0 {
		var modifiers []interface{}
		if err := json.Unmarshal(modifiersJSON, &modifiers); err != nil {
			return resp, err
		}
		resp.Modifiers = modifiers
	}

	return resp, nil
}

// NewPopularProductResponseFromDB creates a PopularProductResponse from database row scan
func NewPopularProductResponseFromDB(
	productResp ProductResponse,
	orderCount int,
) PopularProductResponse {
	return PopularProductResponse{
		ProductResponse: productResp,
		OrderCount:      orderCount,
	}
}

// NewProductListResponse creates a ProductListResponse with or without pagination
func NewProductListResponse(products []ProductResponse, total *int, page *int, limit *int) ProductListResponse {
	resp := ProductListResponse{
		Products: products,
	}

	// If pagination parameters are provided, include pagination metadata
	if total != nil && page != nil && limit != nil && *limit > 0 {
		resp.Total = total
		resp.Page = page

		// Calculate total pages
		pages := (*total + *limit - 1) / *limit
		resp.Pages = &pages
	}

	return resp
}
