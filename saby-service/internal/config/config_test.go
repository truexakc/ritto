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
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

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
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

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
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

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
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

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
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

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
		SabyAPIURL:         "https://api.sbis.ru",
		SabyAPIKey:         "test-api-key",
		Port:               "8080",
		SBISAccessToken:    "test-access-token",
		SBISPointID:        123,
		SBISPriceListID:    456,
		ImportPageSize:     100,
		ImportSchedule:     "0 3 * * *",
		DBConnectionString: "postgres://user:pass@localhost/db",
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

// Test import configuration validation

func TestLoadConfig_WithImportConfig(t *testing.T) {
	// Set up all required environment variables
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	os.Setenv("IMPORT_PAGE_SIZE", "50")
	os.Setenv("IMPORT_SCHEDULE", "0 3 * * *")
	os.Setenv("IMAGE_STORAGE_PATH", "/tmp/images")
	os.Setenv("ENABLE_SCHEDULER", "true")
	defer cleanupImportEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.SBISAccessToken != "test-access-token" {
		t.Errorf("Expected SBISAccessToken to be 'test-access-token', got: %s", config.SBISAccessToken)
	}

	if config.SBISPointID != 123 {
		t.Errorf("Expected SBISPointID to be 123, got: %d", config.SBISPointID)
	}

	if config.SBISPriceListID != 456 {
		t.Errorf("Expected SBISPriceListID to be 456, got: %d", config.SBISPriceListID)
	}

	if config.ImportPageSize != 50 {
		t.Errorf("Expected ImportPageSize to be 50, got: %d", config.ImportPageSize)
	}

	if config.ImportSchedule != "0 3 * * *" {
		t.Errorf("Expected ImportSchedule to be '0 3 * * *', got: %s", config.ImportSchedule)
	}

	if config.DBConnectionString != "postgres://user:pass@localhost/db" {
		t.Errorf("Expected DBConnectionString to be 'postgres://user:pass@localhost/db', got: %s", config.DBConnectionString)
	}

	if config.ImageStoragePath != "/tmp/images" {
		t.Errorf("Expected ImageStoragePath to be '/tmp/images', got: %s", config.ImageStoragePath)
	}

	if !config.EnableScheduler {
		t.Errorf("Expected EnableScheduler to be true, got: %v", config.EnableScheduler)
	}
}

func TestLoadConfig_MissingSBISAccessToken(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Unsetenv("SBIS_ACCESS_TOKEN")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing SBIS_ACCESS_TOKEN, got nil")
	}

	expectedError := "SBIS_ACCESS_TOKEN environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_MissingSBISPointID(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Unsetenv("SBIS_POINT_ID")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing SBIS_POINT_ID, got nil")
	}

	expectedError := "SBIS_POINT_ID environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_MissingSBISPriceListID(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Unsetenv("SBIS_PRICE_LIST_ID")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing SBIS_PRICE_LIST_ID, got nil")
	}

	expectedError := "SBIS_PRICE_LIST_ID environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_MissingDBConnectionString(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Unsetenv("DB_CONNECTION_STRING")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for missing DB_CONNECTION_STRING, got nil")
	}

	expectedError := "DB_CONNECTION_STRING environment variable is required"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_InvalidCronExpression(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	os.Setenv("IMPORT_SCHEDULE", "invalid cron")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for invalid cron expression, got nil")
	}

	if !contains(err.Error(), "IMPORT_SCHEDULE is not a valid cron expression") {
		t.Errorf("Expected error message to contain 'IMPORT_SCHEDULE is not a valid cron expression', got: %s", err.Error())
	}
}

func TestLoadConfig_PageSizeTooSmall(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	os.Setenv("IMPORT_PAGE_SIZE", "0")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for page size too small, got nil")
	}

	expectedError := "IMPORT_PAGE_SIZE must be between 1 and 1000, got: 0"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_PageSizeTooLarge(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	os.Setenv("IMPORT_PAGE_SIZE", "1001")
	defer cleanupImportEnv()

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("Expected error for page size too large, got nil")
	}

	expectedError := "IMPORT_PAGE_SIZE must be between 1 and 1000, got: 1001"
	if err.Error() != expectedError {
		t.Errorf("Expected error message '%s', got: %s", expectedError, err.Error())
	}
}

func TestLoadConfig_DefaultValues(t *testing.T) {
	os.Setenv("SABY_API_URL", "https://api.sbis.ru")
	os.Setenv("SABY_API_KEY", "test-api-key")
	os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
	os.Setenv("SBIS_POINT_ID", "123")
	os.Setenv("SBIS_PRICE_LIST_ID", "456")
	os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
	// Don't set optional variables
	os.Unsetenv("IMPORT_PAGE_SIZE")
	os.Unsetenv("IMPORT_SCHEDULE")
	os.Unsetenv("IMAGE_STORAGE_PATH")
	os.Unsetenv("ENABLE_SCHEDULER")
	defer cleanupImportEnv()

	config, err := LoadConfig()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if config.ImportPageSize != 100 {
		t.Errorf("Expected default ImportPageSize to be 100, got: %d", config.ImportPageSize)
	}

	if config.ImportSchedule != "0 3 * * *" {
		t.Errorf("Expected default ImportSchedule to be '0 3 * * *', got: %s", config.ImportSchedule)
	}

	if config.ImageStoragePath != "./images" {
		t.Errorf("Expected default ImageStoragePath to be './images', got: %s", config.ImageStoragePath)
	}

	if !config.EnableScheduler {
		t.Errorf("Expected default EnableScheduler to be true, got: %v", config.EnableScheduler)
	}
}

// cleanupImportEnv cleans up all environment variables including import config
func cleanupImportEnv() {
	cleanupEnv()
	os.Unsetenv("SBIS_ACCESS_TOKEN")
	os.Unsetenv("SBIS_POINT_ID")
	os.Unsetenv("SBIS_PRICE_LIST_ID")
	os.Unsetenv("IMPORT_PAGE_SIZE")
	os.Unsetenv("IMPORT_SCHEDULE")
	os.Unsetenv("IMPORT_TIMEOUT")
	os.Unsetenv("MAX_PAGINATION_PAGES")
	os.Unsetenv("DB_CONNECTION_STRING")
	os.Unsetenv("IMAGE_STORAGE_PATH")
	os.Unsetenv("ENABLE_SCHEDULER")
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
