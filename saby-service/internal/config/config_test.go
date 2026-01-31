package config

import (
	"os"
	"testing"
)

func TestLoadConfig_Success(t *testing.T) {
	// Set up environment variables
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("PORT", "8080")
	os.Setenv("ENVIRONMENT", "test")
	defer cleanupEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.SabyAPIURL != "https://api.sbis.ru" {
		t.Errorf("Expected SabyAPIURL to be 'https://api.sbis.ru', got: %s", config.SabyAPIURL)
	}

	if config.SabyAPIKey != "test-api-key" {
		t.Errorf("Expected SabyAPIKey to be 'test-api-key', got: %s", config.SabyAPIKey)
	}

	if config.Port != "8080" {
		t.Errorf("Expected Port to be '8080', got: %s", config.Port)
	}

	if config.Environment != "test" {
		t.Errorf("Expected Environment to be 'test', got: %s", config.Environment)
	}
}

func TestLoadConfig_DefaultPort(t *testing.T) {
	// Set up environment variables without PORT
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Unsetenv("PORT")
	defer cleanupEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.Port != "8080" {
		t.Errorf("Expected default Port to be '8080', got: %s", config.Port)
	}
}

func TestLoadConfig_EmptyPort(t *testing.T) {
	// Set up environment variables with empty PORT
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("PORT", "")
	defer cleanupEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.Port != "8080" {
		t.Errorf("Expected default Port to be '8080' when empty, got: %s", config.Port)
	}
}

func TestLoadConfig_InvalidPort(t *testing.T) {
	// Set up environment variables with invalid PORT
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("PORT", "invalid")
	defer cleanupEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.Port != "8080" {
		t.Errorf("Expected default Port to be '8080' when invalid, got: %s", config.Port)
	}
}

func TestLoadConfig_MissingSabyAPIURL(t *testing.T) {
	// Set up environment variables without SABY_API_URL
	os.Unsetenv("SABY_API_URL")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("PORT", "8080")
	defer cleanupEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing SABY_API_URL, got nil")
	}

	expectedError := "SABY_API_URL environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_MissingSabyAPIKey(t *testing.T) {
	// Set up environment variables without SABY_API_KEY
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Unsetenv("SABY_API_KEY")
	os.Setenv("PORT", "8080")
	defer cleanupEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing SABY_API_KEY, got nil")
	}

	expectedError := "SABY_API_KEY environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_DefaultEnvironment(t *testing.T) {
	// Set up environment variables without ENVIRONMENT
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Unsetenv("ENVIRONMENT")
	defer cleanupEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.Environment != "development" {
		t.Errorf("Expected default Environment to be 'development', got: %s", config.Environment)
	}
}

func TestValidate_Success(t *testing.T) {
	config := &Config{
		SabyAPIURL: "https://api.sbis.ru",
		SabyAPIKey: "test-api-key",
		Port:       "8080",
	}

	err := config.Validate()
	if err != nil {
		t.Errorf("Expected no error, got: %v", err)
	}
}

func TestValidate_MissingURL(t *testing.T) {
	config := &Config{
		SabyAPIURL: "",
		SabyAPIKey: "test-api-key",
		Port:       "8080",
	}

	err := config.Validate()
	if err == nil {
		t.Fatal("Expected error for missing SabyAPIURL, got nil")
	}
}

func TestValidate_MissingKey(t *testing.T) {
	config := &Config{
		SabyAPIURL: "https://api.sbis.ru",
		SabyAPIKey: "",
		Port:       "8080",
	}

	err := config.Validate()
	if err == nil {
		t.Fatal("Expected error for missing SabyAPIKey, got nil")
	}
}

func TestValidate_MissingPort(t *testing.T) {
	config := &Config{
		SabyAPIURL: "https://api.sbis.ru",
		SabyAPIKey: "test-api-key",
		Port:       "",
	}

	err := config.Validate()
	if err == nil {
		t.Fatal("Expected error for missing Port, got nil")
	}
}

// cleanupEnv cleans up environment variables after tests
func cleanupEnv() {
	os.Unsetenv("SABY_API_URL")
	os.Unsetenv("SABY_API_KEY")
	os.Unsetenv("PORT")
	os.Unsetenv("ENVIRONMENT")
}
