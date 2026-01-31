package validator

// Example usage documentation for custom validators
//
// To use the custom validators in your Gin application:
//
// 1. Import the validator package in your main.go:
//    import "saby-service/pkg/validator"
//
// 2. Register the custom validators before starting the server:
//    if err := validator.RegisterCustomValidators(); err != nil {
//        log.Fatalf("Failed to register custom validators: %v", err)
//    }
//
// 3. Use the validators in your struct tags:
//    type Customer struct {
//        Phone    string `json:"phone" binding:"required,e164"`
//        Datetime string `json:"datetime" binding:"required,rfc3339"`
//    }
//
// 4. Gin will automatically validate the fields when binding JSON:
//    var customer Customer
//    if err := c.ShouldBindJSON(&customer); err != nil {
//        // Handle validation error
//        c.JSON(400, gin.H{"error": err.Error()})
//        return
//    }
