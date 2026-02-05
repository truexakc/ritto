package config

import (
	"fmt"
	"os"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 18: Configuration Validation - Cron Expression
func TestProperty_ConfigValidation_CronExpression(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("invalid cron expressions should fail validation", prop.ForAll(
		func(invalidCron string) bool {
			// Set up all required environment variables
			os.Setenv("SABY_API_URL", "https://api.sbis.ru")
			os.Setenv("SABY_API_KEY", "test-api-key")
			os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
			os.Setenv("SBIS_POINT_ID", "123")
			os.Setenv("SBIS_PRICE_LIST_ID", "456")
			os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
			os.Setenv("IMPORT_SCHEDULE", invalidCron)
			defer cleanupImportEnv()

			_, err := LoadConfig()

			// Should return an error for invalid cron expression
			if err == nil {
				return false
			}

			// Error message should mention cron expression
			return contains(err.Error(), "IMPORT_SCHEDULE is not a valid cron expression")
		},
		genInvalidCronExpression(),
	))

	properties.Property("valid cron expressions should pass validation", prop.ForAll(
		func(validCron string) bool {
			// Set up all required environment variables
			os.Setenv("SABY_API_URL", "https://api.sbis.ru")
			os.Setenv("SABY_API_KEY", "test-api-key")
			os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
			os.Setenv("SBIS_POINT_ID", "123")
			os.Setenv("SBIS_PRICE_LIST_ID", "456")
			os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
			os.Setenv("IMPORT_SCHEDULE", validCron)
			defer cleanupImportEnv()

			config, err := LoadConfig()

			// Should not return an error for valid cron expression
			if err != nil {
				return false
			}

			// Config should have the cron expression set
			return config.ImportSchedule == validCron
		},
		genValidCronExpression(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 19: Configuration Validation - Page Size Range
func TestProperty_ConfigValidation_PageSizeRange(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("page size outside range [1, 1000] should fail validation", prop.ForAll(
		func(pageSize int) bool {
			// Set up all required environment variables
			os.Setenv("SABY_API_URL", "https://api.sbis.ru")
			os.Setenv("SABY_API_KEY", "test-api-key")
			os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
			os.Setenv("SBIS_POINT_ID", "123")
			os.Setenv("SBIS_PRICE_LIST_ID", "456")
			os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
			os.Setenv("IMPORT_PAGE_SIZE", fmt.Sprintf("%d", pageSize))
			defer cleanupImportEnv()

			_, err := LoadConfig()

			// Should return an error for out-of-range page size
			if err == nil {
				return false
			}

			// Error message should mention page size range
			return contains(err.Error(), "IMPORT_PAGE_SIZE must be between 1 and 1000")
		},
		genInvalidPageSize(),
	))

	properties.Property("page size within range [1, 1000] should pass validation", prop.ForAll(
		func(pageSize int) bool {
			// Set up all required environment variables
			os.Setenv("SABY_API_URL", "https://api.sbis.ru")
			os.Setenv("SABY_API_KEY", "test-api-key")
			os.Setenv("SBIS_ACCESS_TOKEN", "test-access-token")
			os.Setenv("SBIS_POINT_ID", "123")
			os.Setenv("SBIS_PRICE_LIST_ID", "456")
			os.Setenv("DB_CONNECTION_STRING", "postgres://user:pass@localhost/db")
			os.Setenv("IMPORT_PAGE_SIZE", fmt.Sprintf("%d", pageSize))
			defer cleanupImportEnv()

			config, err := LoadConfig()

			// Should not return an error for valid page size
			if err != nil {
				return false
			}

			// Config should have the page size set correctly
			return config.ImportPageSize == pageSize
		},
		genValidPageSize(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Generator for invalid cron expressions
func genInvalidCronExpression() gopter.Gen {
	return gen.OneConstOf(
		"invalid",       // Not a cron expression
		"* * * *",       // Missing field
		"60 * * * *",    // Invalid minute (>59)
		"* 25 * * *",    // Invalid hour (>23)
		"* * 32 * *",    // Invalid day (>31)
		"* * * 13 *",    // Invalid month (>12)
		"* * * * 8",     // Invalid day of week (>7)
		"a b c d e",     // Non-numeric
		"* * * * * *",   // Too many fields
		"@invalid",      // Invalid special string
		"0 0 0 0 0",     // All zeros (invalid)
		"*/0 * * * *",   // Division by zero
		"-1 * * * *",    // Negative value
		"* * * * * * *", // 7 fields (seconds not supported)
		"random text",   // Random text
		"0-60 * * * *",  // Invalid range
		"0,61 * * * *",  // Invalid list value
	)
}

// Generator for valid cron expressions
func genValidCronExpression() gopter.Gen {
	return gen.OneConstOf(
		"0 3 * * *",       // Daily at 3 AM
		"*/5 * * * *",     // Every 5 minutes
		"0 0 * * 0",       // Weekly on Sunday
		"0 0 1 * *",       // Monthly on 1st
		"0 0 1 1 *",       // Yearly on Jan 1st
		"30 2 * * 1-5",    // Weekdays at 2:30 AM
		"0 */2 * * *",     // Every 2 hours
		"15 14 1 * *",     // 14:15 on 1st of month
		"0 22 * * 1-5",    // Weekdays at 10 PM
		"23 0-20/2 * * *", // Every 2 hours from midnight to 8 PM, at 23 minutes
		"0 0,12 1 */2 *",  // 1st of every 2 months at midnight and noon
		"0 4 8-14 * *",    // 8th-14th of month at 4 AM
	)
}

// Generator for invalid page sizes (outside [1, 1000])
func genInvalidPageSize() gopter.Gen {
	return gen.OneGenOf(
		gen.IntRange(-1000, 0),    // Negative and zero
		gen.IntRange(1001, 10000), // Above maximum
	)
}

// Generator for valid page sizes (within [1, 1000])
func genValidPageSize() gopter.Gen {
	return gen.IntRange(1, 1000)
}
