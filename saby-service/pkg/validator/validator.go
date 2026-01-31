package validator

import (
	"regexp"
	"time"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var (
	// E.164 phone format: starts with + and contains 10-15 digits
	e164Regex = regexp.MustCompile(`^\+[1-9]\d{9,14}$`)
)

// RegisterCustomValidators registers custom validation functions with Gin binding
func RegisterCustomValidators() error {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		// Register E.164 phone format validator
		if err := v.RegisterValidation("e164", validateE164Phone); err != nil {
			return err
		}

		// Register RFC3339 datetime validator
		if err := v.RegisterValidation("rfc3339", validateRFC3339Datetime); err != nil {
			return err
		}
	}
	return nil
}

// validateE164Phone validates that a phone number matches E.164 format
// E.164 format: starts with + followed by country code and number (10-15 digits total)
func validateE164Phone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	return e164Regex.MatchString(phone)
}

// validateRFC3339Datetime validates that a datetime string follows RFC3339 format
func validateRFC3339Datetime(fl validator.FieldLevel) bool {
	datetime := fl.Field().String()
	_, err := time.Parse(time.RFC3339, datetime)
	return err == nil
}
