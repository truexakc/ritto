package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/robfig/cron/v3"
)

// Config holds the application configuration
type Config struct {
	Port        string
	SabyAPIURL  string
	SabyAPIKey  string
	Environment string

	// Import configuration
	SBISAccessToken    string
	SBISPointID        int
	SBISPriceListID    int
	ImportPageSize     int
	ImportSchedule     string
	ImportTimeout      time.Duration
	MaxPaginationPages int
	DBConnectionString string
	ImageStoragePath   string
	EnableScheduler    bool
}

// LoadConfig loads configuration from environment variables
// Returns an error if required configuration is missing
func LoadConfig() (*Config, error) {
	config := &Config{
		SabyAPIURL:  os.Getenv("SABY_API_URL"),
		SabyAPIKey:  os.Getenv("SABY_API_KEY"),
		Port:        getPortWithDefault(),
		Environment: getEnvironmentWithDefault(),

		// Import configuration
		SBISAccessToken:    os.Getenv("SBIS_ACCESS_TOKEN"),
		SBISPointID:        getIntEnv("SBIS_POINT_ID", 0),
		SBISPriceListID:    getIntEnv("SBIS_PRICE_LIST_ID", 0),
		ImportPageSize:     getIntEnv("IMPORT_PAGE_SIZE", 100),
		ImportSchedule:     getStringEnv("IMPORT_SCHEDULE", "0 3 * * *"),
		ImportTimeout:      getDurationEnv("IMPORT_TIMEOUT", 30*time.Minute),
		MaxPaginationPages: getIntEnv("MAX_PAGINATION_PAGES", 1000),
		DBConnectionString: os.Getenv("DB_CONNECTION_STRING"),
		ImageStoragePath:   getStringEnv("IMAGE_STORAGE_PATH", "./images"),
		EnableScheduler:    getBoolEnv("ENABLE_SCHEDULER", true),
	}

	// Validate required configuration fields
	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}

// getPortWithDefault returns the PORT environment variable or default "8080"
func getPortWithDefault() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8080"
	}

	// Validate that port is a valid number
	if _, err := strconv.Atoi(port); err != nil {
		return "8080"
	}

	return port
}

// getEnvironmentWithDefault returns the ENVIRONMENT variable or default "development"
func getEnvironmentWithDefault() string {
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		return "development"
	}
	return env
}

// getIntEnv returns an integer environment variable or a default value
func getIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	return intValue
}

// getStringEnv returns a string environment variable or a default value
func getStringEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getDurationEnv returns a duration environment variable or a default value
func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return defaultValue
	}

	return duration
}

// getBoolEnv returns a boolean environment variable or a default value
func getBoolEnv(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return defaultValue
	}

	return boolValue
}

// Validate checks that all required configuration fields are set
func (c *Config) Validate() error {
	if c.SabyAPIURL == "" {
		return errors.New("SABY_API_URL environment variable is required")
	}

	if c.SabyAPIKey == "" {
		return errors.New("SABY_API_KEY environment variable is required")
	}

	if c.Port == "" {
		return errors.New("PORT configuration is invalid")
	}

	// Validate import configuration
	if c.SBISAccessToken == "" {
		return errors.New("SBIS_ACCESS_TOKEN environment variable is required")
	}

	if c.SBISPointID == 0 {
		return errors.New("SBIS_POINT_ID environment variable is required")
	}

	if c.SBISPriceListID == 0 {
		return errors.New("SBIS_PRICE_LIST_ID environment variable is required")
	}

	if c.DBConnectionString == "" {
		return errors.New("DB_CONNECTION_STRING environment variable is required")
	}

	// Validate page size range (1-1000)
	if c.ImportPageSize < 1 || c.ImportPageSize > 1000 {
		return fmt.Errorf("IMPORT_PAGE_SIZE must be between 1 and 1000, got: %d", c.ImportPageSize)
	}

	// Validate cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	if _, err := parser.Parse(c.ImportSchedule); err != nil {
		return fmt.Errorf("IMPORT_SCHEDULE is not a valid cron expression: %w", err)
	}

	return nil
}
