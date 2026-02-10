package service

import (
	"context"
	"fmt"
	"time"

	"saby-service/internal/client"
	"saby-service/internal/model"
)

// SabyService defines the interface for SABY business logic
type SabyService interface {
	CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error)
}

// sabyServiceImpl implements the SabyService interface
type sabyServiceImpl struct {
	client client.SabyClient
}

// NewSabyService creates a new SABY service with the given client
func NewSabyService(client client.SabyClient) SabyService {
	return &sabyServiceImpl{
		client: client,
	}
}

// CreateOrder validates and creates a new order
func (s *sabyServiceImpl) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
	// Handle context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// Add datetime if not provided
	if req.Datetime == "" {
		now := time.Now()
		req.Datetime = fmt.Sprintf("%04d-%02d-%02d %02d:%02d:%02d",
			now.Year(), now.Month(), now.Day(),
			now.Hour(), now.Minute(), now.Second())
	}

	// Validate order request
	if err := validateOrderRequest(req); err != nil {
		return nil, err
	}

	// Pass context to client method
	return s.client.CreateOrder(ctx, req)
}

// validateOrderRequest performs business rule validation on the order request
func validateOrderRequest(req *model.OrderRequest) error {
	if req == nil {
		return fmt.Errorf("order request cannot be nil")
	}

	// Validate required fields
	if req.Product == "" {
		return fmt.Errorf("product is required")
	}

	if req.PointID == 0 {
		return fmt.Errorf("pointId is required")
	}

	// Validate customer
	if req.Customer.Name == "" {
		return fmt.Errorf("customer name is required")
	}

	if req.Customer.Phone == "" {
		return fmt.Errorf("customer phone is required")
	}

	// Validate datetime
	if req.Datetime == "" {
		return fmt.Errorf("datetime is required")
	}

	// Validate nomenclatures array has at least one item
	if len(req.Nomenclatures) == 0 {
		return fmt.Errorf("nomenclatures array must contain at least one item")
	}

	// Validate conditional address requirement (isPickup=false requires address)
	if !req.Delivery.IsPickup {
		if req.Delivery.AddressJSON == "" && req.Delivery.AddressFull == "" {
			return fmt.Errorf("address (addressJSON or addressFull) is required when isPickup is false")
		}
	}

	return nil
}
