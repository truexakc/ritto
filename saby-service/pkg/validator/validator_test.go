package validator

import (
	"fmt"
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Feature: saby-go-microservice, Property 2: Phone format validation**
// **Validates: Requirements 2.4**
func TestPhoneFormatValidation(t *testing.T) {
	properties := gopter.NewProperties(nil)

	// Create a validator instance
	v := validator.New()
	v.RegisterValidation("e164", validateE164Phone)

	// Property: Valid E.164 phone numbers should pass validation
	properties.Property("Valid E.164 phones pass validation", prop.ForAll(
		func(countryCode int, number string) bool {
			// Generate valid E.164 phone: + followed by 1-3 digit country code and remaining digits
			phone := "+" + string(rune('1'+countryCode%9)) + number

			// Create a test struct
			type TestStruct struct {
				Phone string `validate:"e164"`
			}
			test := TestStruct{Phone: phone}

			err := v.Struct(test)
			return err == nil
		},
		gen.IntRange(0, 8),              // Country code digit (1-9)
		gen.RegexMatch(`^[0-9]{9,13}$`), // 9-13 more digits (total 10-14 with country code)
	))

	// Property: Invalid phone formats should fail validation
	properties.Property("Invalid phone formats fail validation", prop.ForAll(
		func(phone string) bool {
			type TestStruct struct {
				Phone string `validate:"e164"`
			}
			test := TestStruct{Phone: phone}

			err := v.Struct(test)
			// Should fail validation
			return err != nil
		},
		gen.OneGenOf(
			gen.Const(""),                           // Empty string
			gen.Const("1234567890"),                 // No + prefix
			gen.Const("+0123456789"),                // Starts with 0
			gen.Const("+1"),                         // Too short
			gen.Const("+12345678901234567"),         // Too long (>15 digits)
			gen.RegexMatch(`^[0-9]{10,15}$`),        // No + prefix
			gen.RegexMatch(`^\+0[0-9]{9,14}$`),      // Starts with +0
			gen.RegexMatch(`^\+[1-9][0-9]{0,8}$`),   // Too short (<10 digits)
			gen.RegexMatch(`^\+[1-9][0-9]{15,20}$`), // Too long (>15 digits)
		),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// **Feature: saby-go-microservice, Property 3: Datetime format validation**
// **Validates: Requirements 2.5**
func TestDatetimeFormatValidation(t *testing.T) {
	properties := gopter.NewProperties(nil)

	// Create a validator instance
	v := validator.New()
	v.RegisterValidation("rfc3339", validateRFC3339Datetime)

	// Property: Valid RFC3339 datetime strings should pass validation
	properties.Property("Valid RFC3339 datetimes pass validation", prop.ForAll(
		func(year, month, day, hour, minute, second int) bool {
			// Generate valid RFC3339 datetime
			// Format: 2006-01-02T15:04:05Z
			datetime := ""

			// Ensure valid ranges
			if year < 2000 || year > 2099 {
				year = 2024
			}
			if month < 1 || month > 12 {
				month = 1
			}
			if day < 1 || day > 28 { // Use 28 to avoid month-specific logic
				day = 1
			}
			if hour < 0 || hour > 23 {
				hour = 0
			}
			if minute < 0 || minute > 59 {
				minute = 0
			}
			if second < 0 || second > 59 {
				second = 0
			}

			// Format as RFC3339
			datetime = fmt.Sprintf("%04d-%02d-%02dT%02d:%02d:%02dZ",
				year, month, day, hour, minute, second)

			type TestStruct struct {
				Datetime string `validate:"rfc3339"`
			}
			test := TestStruct{Datetime: datetime}

			err := v.Struct(test)
			return err == nil
		},
		gen.IntRange(2000, 2099),
		gen.IntRange(1, 12),
		gen.IntRange(1, 28),
		gen.IntRange(0, 23),
		gen.IntRange(0, 59),
		gen.IntRange(0, 59),
	))

	// Property: Invalid datetime formats should fail validation
	properties.Property("Invalid datetime formats fail validation", prop.ForAll(
		func(datetime string) bool {
			type TestStruct struct {
				Datetime string `validate:"rfc3339"`
			}
			test := TestStruct{Datetime: datetime}

			err := v.Struct(test)
			// Should fail validation
			return err != nil
		},
		gen.OneGenOf(
			gen.Const(""),                     // Empty string
			gen.Const("2024-01-31"),           // Date only, no time
			gen.Const("15:04:05"),             // Time only, no date
			gen.Const("2024/01/31T15:04:05Z"), // Wrong date separator
			gen.Const("2024-01-31 15:04:05"),  // Space instead of T
			gen.Const("31-01-2024T15:04:05Z"), // Wrong date order
			gen.Const("2024-13-01T15:04:05Z"), // Invalid month
			gen.Const("2024-01-32T15:04:05Z"), // Invalid day
			gen.Const("2024-01-31T25:04:05Z"), // Invalid hour
			gen.Const("2024-01-31T15:60:05Z"), // Invalid minute
			gen.Const("2024-01-31T15:04:60Z"), // Invalid second
			gen.Const("not a datetime"),       // Random string
		),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}
