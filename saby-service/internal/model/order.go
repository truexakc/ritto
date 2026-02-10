package model

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
	Product       string         `json:"product"`
	PointID       int            `json:"pointId"`
	Comment       string         `json:"comment,omitempty"`
	Customer      Customer       `json:"customer"`
	Datetime      string         `json:"datetime"`
	Promocode     string         `json:"promocode,omitempty"`
	PromocodeV2   string         `json:"promocodeV2,omitempty"`
	Nomenclatures []Nomenclature `json:"nomenclatures"`
	Delivery      Delivery       `json:"delivery"`
}

// Customer represents customer information in an order
type Customer struct {
	ExternalID *string `json:"externalId,omitempty"`
	Name       string  `json:"name"`
	Lastname   string  `json:"lastname,omitempty"`
	Patronymic string  `json:"patronymic,omitempty"`
	Email      string  `json:"email,omitempty"`
	Phone      string  `json:"phone"`
}

// Nomenclature represents a product item in an order
type Nomenclature struct {
	NomNumber     string     `json:"nomNumber"`
	Count         float64    `json:"count"`
	PriceListID   int        `json:"priceListId"`
	Cost          float64    `json:"cost,omitempty"`
	Name          string     `json:"name,omitempty"`
	Modifiers     []Modifier `json:"modifiers,omitempty"`
	SerialNumbers []string   `json:"serialNumbers,omitempty"`
}

// Modifier represents a product modifier in an order
type Modifier struct {
	ID             int     `json:"id"`
	HierarchicalID int     `json:"hierarchicalId"`
	Count          int     `json:"count"`
	Cost           float64 `json:"cost"`
	Name           string  `json:"name"`
}

// Delivery represents delivery information for an order
type Delivery struct {
	IsPickup     bool        `json:"isPickup"`
	AddressJSON  string      `json:"addressJSON,omitempty"`
	AddressFull  string      `json:"addressFull,omitempty"`
	Persons      int         `json:"persons,omitempty"`
	District     int         `json:"district,omitempty"`
	ChangeAmount float64     `json:"changeAmount,omitempty"`
	PaymentType  PaymentType `json:"paymentType"`
	ShopURL      string      `json:"shopURL,omitempty"`
	SuccessURL   string      `json:"successURL,omitempty"`
	ErrorURL     string      `json:"errorURL,omitempty"`
}
