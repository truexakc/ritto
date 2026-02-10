package client

import (
	"context"
	"os"
	"strings"
	"testing"

	"saby-service/internal/model"
)

// TestStubMode verifies that stub mode works correctly
func TestStubMode(t *testing.T) {
	// Save original env var
	originalStubMode := os.Getenv("SABY_STUB_MODE")
	defer os.Setenv("SABY_STUB_MODE", originalStubMode)

	t.Run("stub mode enabled with 'true'", func(t *testing.T) {
		os.Setenv("SABY_STUB_MODE", "true")

		client := NewSabyClient("https://api.sbis.ru", "test-key")

		req := &model.OrderRequest{
			Product: "delivery",
			PointID: 1,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: "2024-02-10 15:30:00",
			Nomenclatures: []model.Nomenclature{
				{
					NomNumber:   "00001",
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    false,
				PaymentType: model.PaymentCard,
			},
		}

		resp, err := client.CreateOrder(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error in stub mode, got: %v", err)
		}

		if !strings.HasPrefix(resp.OrderID, "STUB-") {
			t.Errorf("Expected order ID to start with 'STUB-', got: %s", resp.OrderID)
		}

		if resp.Status != "stub_mode" {
			t.Errorf("Expected status 'stub_mode', got: %s", resp.Status)
		}

		if resp.Message != "Stub mode active, order not sent to Saby" {
			t.Errorf("Expected stub mode message, got: %s", resp.Message)
		}
	})

	t.Run("stub mode enabled with '1'", func(t *testing.T) {
		os.Setenv("SABY_STUB_MODE", "1")

		client := NewSabyClient("https://api.sbis.ru", "test-key")

		req := &model.OrderRequest{
			Product: "delivery",
			PointID: 1,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: "2024-02-10 15:30:00",
			Nomenclatures: []model.Nomenclature{
				{
					NomNumber:   "00001",
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    true,
				PaymentType: model.PaymentCard,
			},
		}

		resp, err := client.CreateOrder(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error in stub mode, got: %v", err)
		}

		if !strings.HasPrefix(resp.OrderID, "STUB-") {
			t.Errorf("Expected order ID to start with 'STUB-', got: %s", resp.OrderID)
		}
	})

	t.Run("stub mode disabled", func(t *testing.T) {
		os.Setenv("SABY_STUB_MODE", "false")

		client := NewSabyClient("https://api.sbis.ru", "test-key")

		req := &model.OrderRequest{
			Product: "delivery",
			PointID: 1,
			Customer: model.Customer{
				Name:  "Test User",
				Phone: "+79991234567",
			},
			Datetime: "2024-02-10 15:30:00",
			Nomenclatures: []model.Nomenclature{
				{
					NomNumber:   "00001",
					Count:       1,
					PriceListID: 1,
				},
			},
			Delivery: model.Delivery{
				IsPickup:    true,
				PaymentType: model.PaymentCard,
			},
		}

		// In non-stub mode, this will try to make a real HTTP request
		// which will fail since we're using a test API key
		// This is expected behavior - we just verify it doesn't return a stub response
		resp, err := client.CreateOrder(context.Background(), req)

		// Either error or non-stub response is acceptable
		if err == nil && strings.HasPrefix(resp.OrderID, "STUB-") {
			t.Error("Expected real API call (not stub) when stub mode is disabled")
		}
	})
}
