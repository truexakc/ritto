package model

// ErrorCode represents the type of error
type ErrorCode string

const (
	ErrorCodeValidation ErrorCode = "VALIDATION_ERROR"
	ErrorCodeInternal   ErrorCode = "INTERNAL_ERROR"
	ErrorCodeTimeout    ErrorCode = "TIMEOUT_ERROR"
	ErrorCodeDependency ErrorCode = "DEPENDENCY_ERROR"
	ErrorCodeNotFound   ErrorCode = "NOT_FOUND"
)

// ErrorResponse represents the standardized error response format
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains detailed error information
type ErrorDetail struct {
	Code    ErrorCode    `json:"code"`
	Message string       `json:"message"`
	Details []FieldError `json:"details,omitempty"`
}

// FieldError represents a field-level validation error
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
