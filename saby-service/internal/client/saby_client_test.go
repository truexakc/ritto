package client

import (
	"context"
	"testing"
	"time"

	"saby-service/internal/model"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Feature: saby-go-microservice, Property 9: Context cancellation handling**
// **Validates: Requirements 4.7**
func TestProperty_ContextCancellation(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("cancelled context should return error", prop.ForAll(
		func(product string, pointID int, name string, phone string) bool {
			// Create a cancelled context
			ctx, cancel := context.WithCancel(context.Background())
			cancel() // Cancel immediately

			// Create a minimal valid order request
			req := &model.OrderRequest{
				Product: product,
				PointID: pointID,
				Customer: model.Customer{
					Name:  name,
					Phone: phone,
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

			// Create client
			client := NewSabyClient("https://api.sbis.ru", "test-key")

			// Call CreateOrder with cancelled context
			_, err := client.CreateOrder(ctx, req)

			// Should return an error (context.Canceled)
			return err != nil && err == context.Canceled
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.IntRange(1, 1000),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.Property("timeout context should return error", prop.ForAll(
		func(product string, pointID int, name string, phone string) bool {
			// Create a context with immediate timeout
			ctx, cancel := context.WithTimeout(context.Background(), 1*time.Nanosecond)
			defer cancel()

			// Wait for timeout
			time.Sleep(10 * time.Millisecond)

			// Create a minimal valid order request
			req := &model.OrderRequest{
				Product: product,
				PointID: pointID,
				Customer: model.Customer{
					Name:  name,
					Phone: phone,
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

			// Create client
			client := NewSabyClient("https://api.sbis.ru", "test-key")

			// Call CreateOrder with timed-out context
			_, err := client.CreateOrder(ctx, req)

			// Should return an error (context.DeadlineExceeded)
			return err != nil && err == context.DeadlineExceeded
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.IntRange(1, 1000),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.Property("valid context should not return context error", prop.ForAll(
		func(product string, pointID int, name string, phone string) bool {
			// Create a valid context
			ctx := context.Background()

			// Create a minimal valid order request
			req := &model.OrderRequest{
				Product: product,
				PointID: pointID,
				Customer: model.Customer{
					Name:  name,
					Phone: phone,
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

			// Create client
			client := NewSabyClient("https://api.sbis.ru", "test-key")

			// Call CreateOrder with valid context
			_, err := client.CreateOrder(ctx, req)

			// Should not return a context error (may return nil or other errors, but not context errors)
			return err != context.Canceled && err != context.DeadlineExceeded
		},
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.IntRange(1, 1000),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
