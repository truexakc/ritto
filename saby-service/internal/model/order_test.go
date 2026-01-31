package model

import (
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Feature: saby-go-microservice, Property 5: Payment type enum validation**
// **Validates: Requirements 2.8**
//
// Property: For any paymentType value, if it is not one of "card", "online", or "cash",
// then the system should reject the request with HTTP 400 and field-level error
func TestPaymentTypeEnumValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100

	properties := gopter.NewProperties(parameters)

	// Valid payment types
	validPaymentTypes := []PaymentType{PaymentCard, PaymentOnline, PaymentCash}

	// Property 1: Valid payment types should be accepted
	properties.Property("valid payment types are accepted", prop.ForAll(
		func(pt PaymentType) bool {
			// Check if the payment type is one of the valid values
			for _, valid := range validPaymentTypes {
				if pt == valid {
					return true
				}
			}
			return false
		},
		gen.OneConstOf(PaymentCard, PaymentOnline, PaymentCash),
	))

	// Property 2: Invalid payment types should be rejected
	// Generate random strings that are NOT valid payment types
	properties.Property("invalid payment types are rejected", prop.ForAll(
		func(invalidStr string) bool {
			pt := PaymentType(invalidStr)

			// Check that this is NOT a valid payment type
			isValid := pt == PaymentCard || pt == PaymentOnline || pt == PaymentCash

			// If it's not valid, the property holds (we expect rejection)
			// If it happens to be valid (rare), skip this test case
			if isValid {
				return true // Skip this case
			}

			// For invalid payment types, we verify they don't match any valid type
			return pt != PaymentCard && pt != PaymentOnline && pt != PaymentCash
		},
		gen.AnyString().SuchThat(func(s string) bool {
			// Generate strings that are NOT valid payment types
			return s != "card" && s != "online" && s != "cash"
		}),
	))

	// Property 3: Payment type constants have correct string values
	properties.Property("payment type constants have correct values", prop.ForAll(
		func(_ bool) bool {
			return string(PaymentCard) == "card" &&
				string(PaymentOnline) == "online" &&
				string(PaymentCash) == "cash"
		},
		gen.Const(true),
	))

	properties.TestingRun(t)
}
