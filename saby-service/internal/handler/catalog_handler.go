package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"saby-service/internal/middleware"
	"saby-service/internal/model"
	"saby-service/internal/service"
)

// CatalogHandler handles HTTP requests for catalog operations
type CatalogHandler struct {
	catalogService service.CatalogService
	logger         *slog.Logger
}

// NewCatalogHandler creates a new CatalogHandler with the given dependencies
func NewCatalogHandler(catalogService service.CatalogService, logger *slog.Logger) *CatalogHandler {
	if logger == nil {
		logger = slog.Default()
	}

	return &CatalogHandler{
		catalogService: catalogService,
		logger:         logger,
	}
}

// GetCategories handles GET /api/catalog/categories requests
// It retrieves all active categories sorted by name
func (h *CatalogHandler) GetCategories(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	h.logger.Info("fetching categories", "requestId", requestID)

	// Call service to get categories
	categories, err := h.catalogService.GetCategories(c.Request.Context())
	if err != nil {
		h.logger.Error("failed to get categories", "error", err, "requestId", requestID)

		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve categories",
			},
		})
		return
	}

	h.logger.Info("categories retrieved successfully", "count", len(categories), "requestId", requestID)

	// Return categories as JSON
	c.JSON(http.StatusOK, categories)
}

// GetProducts handles GET /api/catalog/products requests
// It retrieves products with optional filtering and pagination
func (h *CatalogHandler) GetProducts(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	h.logger.Info("fetching products", "requestId", requestID)

	// Build filter from query parameters
	filter := model.ProductFilter{}

	// Extract category filter
	if categoryID := c.Query("category"); categoryID != "" {
		filter.CategoryID = &categoryID
	}

	// Extract hierarchical_parent filter
	if hierarchicalParentStr := c.Query("hierarchical_parent"); hierarchicalParentStr != "" {
		hierarchicalParent, err := strconv.Atoi(hierarchicalParentStr)
		if err != nil {
			h.logger.Warn("invalid hierarchical_parent parameter", "value", hierarchicalParentStr, "requestId", requestID)

			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "INVALID_PARAMETER",
					Message: "hierarchical_parent must be a valid integer",
				},
			})
			return
		}
		filter.HierarchicalParent = &hierarchicalParent
	}

	// Extract search filter
	if search := c.Query("search"); search != "" {
		filter.Search = &search
	}

	// Extract pagination parameters
	if pageStr := c.Query("page"); pageStr != "" {
		page, err := strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			h.logger.Warn("invalid page parameter", "value", pageStr, "requestId", requestID)

			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "INVALID_PARAMETER",
					Message: "page must be a positive integer",
				},
			})
			return
		}
		filter.Page = &page
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 1 || limit > 100 {
			h.logger.Warn("invalid limit parameter", "value", limitStr, "requestId", requestID)

			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "INVALID_PARAMETER",
					Message: "limit must be between 1 and 100",
				},
			})
			return
		}
		filter.Limit = &limit
	}

	// Validate pagination: both page and limit must be provided together
	if (filter.Page != nil && filter.Limit == nil) || (filter.Page == nil && filter.Limit != nil) {
		h.logger.Warn("incomplete pagination parameters", "requestId", requestID)

		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "INVALID_PARAMETER",
				Message: "both page and limit must be provided for pagination",
			},
		})
		return
	}

	h.logger.Info("product filter applied",
		"categoryId", filter.CategoryID,
		"hierarchicalParent", filter.HierarchicalParent,
		"search", filter.Search,
		"page", filter.Page,
		"limit", filter.Limit,
		"requestId", requestID)

	// Call service to get products
	response, err := h.catalogService.GetProducts(c.Request.Context(), filter)
	if err != nil {
		h.logger.Error("failed to get products", "error", err, "requestId", requestID)

		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve products",
			},
		})
		return
	}

	h.logger.Info("products retrieved successfully", "count", len(response.Products), "requestId", requestID)

	// Return response based on pagination
	if response.Total != nil {
		// With pagination - return full response object
		c.JSON(http.StatusOK, response)
	} else {
		// Without pagination - return just the products array
		c.JSON(http.StatusOK, response.Products)
	}
}

// GetPopularProducts handles GET /api/catalog/products/popular requests
// It retrieves popular/featured products sorted by order count
func (h *CatalogHandler) GetPopularProducts(c *gin.Context) {
	requestID := middleware.GetRequestID(c)

	h.logger.Info("fetching popular products", "requestId", requestID)

	// Extract and validate limit parameter (default: 8, range: 1-100)
	limit := 8
	if limitStr := c.Query("limit"); limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err != nil || parsedLimit < 1 || parsedLimit > 100 {
			h.logger.Warn("invalid limit parameter", "value", limitStr, "requestId", requestID)

			c.JSON(http.StatusBadRequest, model.ErrorResponse{
				Error: model.ErrorDetail{
					Code:    "INVALID_PARAMETER",
					Message: "limit must be between 1 and 100",
				},
			})
			return
		}
		limit = parsedLimit
	}

	h.logger.Info("popular products limit applied", "limit", limit, "requestId", requestID)

	// Call service to get popular products
	products, err := h.catalogService.GetPopularProducts(c.Request.Context(), limit)
	if err != nil {
		h.logger.Error("failed to get popular products", "error", err, "requestId", requestID)

		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error: model.ErrorDetail{
				Code:    "DATABASE_ERROR",
				Message: "Failed to retrieve popular products",
			},
		})
		return
	}

	h.logger.Info("popular products retrieved successfully", "count", len(products), "requestId", requestID)

	// Return popular products as JSON
	c.JSON(http.StatusOK, products)
}
