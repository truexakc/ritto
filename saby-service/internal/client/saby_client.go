package client

import (
	"context"
	"net/http"
	"time"

	"saby-service/internal/model"

	"github.com/google/uuid"
)

// SabyClient defines the interface for interacting with SABY API
type SabyClient interface {
	CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error)
}

// sabyClientImpl implements the SabyClient interface
type sabyClientImpl struct {
	httpClient *http.Client
	baseURL    string
	apiKey     string
}

// NewSabyClient creates a new SABY client with the given configuration
func NewSabyClient(baseURL, apiKey string) SabyClient {
	return &sabyClientImpl{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: baseURL,
		apiKey:  apiKey,
	}
}

// CreateOrder creates a new order in the SABY system
// Currently returns a placeholder response without making actual HTTP call
func (c *sabyClientImpl) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
	// Handle context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// TODO: Implement real API call to SABY
	// Example implementation:
	// 1. Marshal req to JSON
	// 2. Create HTTP POST request to c.baseURL + "/retail/order/create"
	// 3. Add Authorization header with c.apiKey
	// 4. Set Content-Type: application/json
	// 5. Execute request with c.httpClient.Do(req.WithContext(ctx))
	// 6. Parse response and map to OrderResponse
	// 7. Handle errors appropriately

	// Return placeholder response for now
	response := &model.OrderResponse{
		OrderID:    uuid.New().String(),
		ExternalID: "SABY-PLACEHOLDER-" + uuid.New().String()[:8],
		Status:     "created",
		CreatedAt:  time.Now(),
		Message:    "Order created successfully (placeholder)",
	}

	return response, nil
}
