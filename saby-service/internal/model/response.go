package model

import "time"

// OrderResponse represents the response after creating an order
type OrderResponse struct {
	OrderID    string    `json:"orderId"`
	ExternalID string    `json:"externalId"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	Message    string    `json:"message"`
}
