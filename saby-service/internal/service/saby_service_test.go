package service

import (
	"context"
	"testing"
	"time"

	"saby-service/internal/model"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Mock client for testing
type mockSabyClient struct {
	createOrderFunc func(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error)
}

func (m *mockSabyClient) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
	if m.createOrderFunc != nil {
		return m.createOrderFunc(ctx, req)
	}
	return &model.OrderResponse{
		OrderID:   "test-order-id",
		Status:    "created",
		CreatedAt: time.Now(),
	}, nil
}

// **Feature: saby-go-microservice, Property 1: Required field validation**
// **Validates: Requirements 2.2**
//
// Property: For any order request, if any required field (product, pointId, customer,
// datetime, nomenclatures, delivery) is missing, then the system should return HTTP 400
// with VALIDATION_ERROR
func TestRequiredFieldValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Create a mock client
	mockClient := &mockSabyClient{}
	service := NewSabyService(mockClient)

	// Helper to create a valid order request
	createValidOrder := func() *model.OrderRequest {
		return &model.OrderRequest{
			Product: "delivery",
			PointID: 123,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: time.Now(),
			Nomenclatures: []model.Nomenclature{
				{
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    true,
				PaymentType: model.PaymentCard,
			},
		}
	}

	// Property 1: Missing product should fail validation
	properties.Property("missing product field fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Product = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 2: Missing pointId should fail validation
	properties.Property("missing pointId field fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.PointID = 0

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 3: Missing customer name should fail validation
	properties.Property("missing customer name fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Customer.Name = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 4: Missing customer phone should fail validation
	properties.Property("missing customer phone fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Customer.Phone = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 5: Missing datetime should fail validation
	properties.Property("missing datetime field fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Datetime = time.Time{} // Zero time

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 6: Valid request with all required fields should pass validation
	properties.Property("valid request with all required fields passes validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.Const(true),
	))

	properties.TestingRun(t)
}

// **Feature: saby-go-microservice, Property 4: Nomenclatures array validation**
// **Validates: Requirements 2.6**
//
// Property: For any order request, if the nomenclatures array is empty or missing
// required fields in any item, then the system should reject the request with HTTP 400
func TestNomenclaturesArrayValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Create a mock client
	mockClient := &mockSabyClient{}
	service := NewSabyService(mockClient)

	// Helper to create a valid order request
	createValidOrder := func() *model.OrderRequest {
		return &model.OrderRequest{
			Product: "delivery",
			PointID: 123,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: time.Now(),
			Nomenclatures: []model.Nomenclature{
				{
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    true,
				PaymentType: model.PaymentCard,
			},
		}
	}

	// Property 1: Empty nomenclatures array should fail validation
	properties.Property("empty nomenclatures array fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Nomenclatures = []model.Nomenclature{}

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 2: Nil nomenclatures array should fail validation
	properties.Property("nil nomenclatures array fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Nomenclatures = nil

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 3: Non-empty nomenclatures array should pass validation
	properties.Property("non-empty nomenclatures array passes validation", prop.ForAll(
		func(count int) bool {
			// Generate 1 to 10 nomenclatures
			if count < 1 {
				count = 1
			}
			if count > 10 {
				count = 10
			}

			req := createValidOrder()
			req.Nomenclatures = make([]model.Nomenclature, count)
			for i := 0; i < count; i++ {
				req.Nomenclatures[i] = model.Nomenclature{
					Count:       float64(i + 1),
					PriceListID: 1,
				}
			}

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.IntRange(1, 10),
	))

	properties.TestingRun(t)
}

// **Feature: saby-go-microservice, Property 6: Conditional address validation**
// **Validates: Requirements 2.9**
//
// Property: For any order request where isPickup is false, if neither addressJSON
// nor addressFull is provided, then the system should reject the request with HTTP 400
func TestConditionalAddressValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Create a mock client
	mockClient := &mockSabyClient{}
	service := NewSabyService(mockClient)

	// Helper to create a valid order request
	createValidOrder := func() *model.OrderRequest {
		return &model.OrderRequest{
			Product: "delivery",
			PointID: 123,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: time.Now(),
			Nomenclatures: []model.Nomenclature{
				{
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    false,
				AddressFull: "Test Address",
				PaymentType: model.PaymentCard,
			},
		}
	}

	// Property 1: isPickup=false without address should fail validation
	properties.Property("isPickup false without address fails validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Delivery.IsPickup = false
			req.Delivery.AddressJSON = ""
			req.Delivery.AddressFull = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err != nil
		},
		gen.Const(true),
	))

	// Property 2: isPickup=false with addressFull should pass validation
	properties.Property("isPickup false with addressFull passes validation", prop.ForAll(
		func(address string) bool {
			// Ensure address is not empty
			if address == "" {
				address = "Test Address"
			}

			req := createValidOrder()
			req.Delivery.IsPickup = false
			req.Delivery.AddressFull = address
			req.Delivery.AddressJSON = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	// Property 3: isPickup=false with addressJSON should pass validation
	properties.Property("isPickup false with addressJSON passes validation", prop.ForAll(
		func(address string) bool {
			// Ensure address is not empty
			if address == "" {
				address = "{\"street\": \"Test\"}"
			}

			req := createValidOrder()
			req.Delivery.IsPickup = false
			req.Delivery.AddressJSON = address
			req.Delivery.AddressFull = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	// Property 4: isPickup=false with both addresses should pass validation
	properties.Property("isPickup false with both addresses passes validation", prop.ForAll(
		func(addressFull, addressJSON string) bool {
			// Ensure addresses are not empty
			if addressFull == "" {
				addressFull = "Test Address"
			}
			if addressJSON == "" {
				addressJSON = "{\"street\": \"Test\"}"
			}

			req := createValidOrder()
			req.Delivery.IsPickup = false
			req.Delivery.AddressFull = addressFull
			req.Delivery.AddressJSON = addressJSON

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	// Property 5: isPickup=true without address should pass validation
	properties.Property("isPickup true without address passes validation", prop.ForAll(
		func(_ bool) bool {
			req := createValidOrder()
			req.Delivery.IsPickup = true
			req.Delivery.AddressJSON = ""
			req.Delivery.AddressFull = ""

			_, err := service.CreateOrder(context.Background(), req)
			return err == nil
		},
		gen.Const(true),
	))

	properties.TestingRun(t)
}
