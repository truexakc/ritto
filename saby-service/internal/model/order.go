package model

import "time"

// PaymentType represents the payment method for an order
type PaymentType string

const (
	PaymentCard   PaymentType = "card"
	PaymentOnline PaymentType = "online"
	PaymentCash   PaymentType = "cash"
)

// Note: New payment types must be backward-compatible and validated centrally.
// When adding new payment types, update validation logic and API documentation.

// OrderRequest represents the request payload for creating an order
type OrderRequest struct {
	Product       string         `json:"product" binding:"required"`
	PointID       int            `json:"pointId" binding:"required"`
	Comment       string         `json:"comment"`
	Customer      Customer       `json:"customer" binding:"required"`
	Datetime      time.Time      `json:"datetime" binding:"required"`
	Promocode     string         `json:"promocode"`
	PromocodeV2   string         `json:"promocodeV2"`
	Nomenclatures []Nomenclature `json:"nomenclatures" binding:"required,min=1"`
	Delivery      Delivery       `json:"delivery" binding:"required"`
}

// Customer represents customer information in an order
type Customer struct {
	ExternalID string `json:"externalId"`
	Name       string `json:"name" binding:"required"`
	Lastname   string `json:"lastname"`
	Patronymic string `json:"patronymic"`
	Email      string `json:"email" binding:"omitempty,email"`
	Phone      string `json:"phone" binding:"required,e164"`
}

// Nomenclature represents a product item in an order
type Nomenclature struct {
	ExternalID     string     `json:"externalId"`
	ID             int        `json:"id"`
	NomNumber      string     `json:"nomNumber"`
	Count          float64    `json:"count" binding:"required,gt=0"`
	Cost           float64    `json:"cost"`
	Name           string     `json:"name"`
	Modifiers      []Modifier `json:"modifiers"`
	PriceListID    int        `json:"priceListId" binding:"required"`
	HierarchicalID int        `json:"hierarchicalId"`
	SerialNumbers  []string   `json:"serialNumbers"`
}

// Modifier represents a product modifier in an order
type Modifier struct {
	ID             int     `json:"id" binding:"required"`
	HierarchicalID int     `json:"hierarchicalId" binding:"required"`
	Count          int     `json:"count" binding:"required,gt=0"`
	Cost           float64 `json:"cost"`
	Name           string  `json:"name"`
}

// Delivery represents delivery information for an order
type Delivery struct {
	IsPickup     bool        `json:"isPickup" binding:"required"`
	AddressJSON  string      `json:"addressJSON"`
	AddressFull  string      `json:"addressFull"`
	Persons      int         `json:"persons"`
	District     int         `json:"district"`
	ChangeAmount float64     `json:"changeAmount"`
	PaymentType  PaymentType `json:"paymentType" binding:"required,oneof=card online cash"`
	ShopURL      string      `json:"shopURL"`
	SuccessURL   string      `json:"successURL"`
	ErrorURL     string      `json:"errorURL"`
}
