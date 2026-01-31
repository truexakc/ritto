package config

import (
	"errors"
	"os"
	"strconv"
)

// Config holds the application configuration
type Config struct {
	Port        string
	SabyAPIURL  string
	SabyAPIKey  string
	Environment string
}

// LoadConfig loads configuration from environment variables
// Returns an error if required configuration is missing
func LoadConfig() (*Config, error) {
	config := &Config{
		SabyAPIURL:  os.Getenv("SABY_API_URL"),
		SabyAPIKey:  os.Getenv("SABY_API_KEY"),
		Port:        getPortWithDefault(),
		Environment: getEnvironmentWithDefault(),
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

	return nil
}
