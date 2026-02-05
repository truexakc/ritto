package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"testing"
	"time"

	"saby-service/internal/client"
	"saby-service/internal/model"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 6: Processing Order Guarantee
// For any import execution, all Category persistence operations should complete before any Product persistence operations begin.
func TestProperty_ProcessingOrderGuarantee(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("categories are processed before products", prop.ForAll(
		func(nomenclatures []model.SBISNomenclature) bool {
			// Create mock components that track operation order
			orderTracker := &operationOrderTracker{
				operations: make([]string, 0),
			}

			mockClient := &mockSBISClientForOrder{
				nomenclatures: nomenclatures,
			}

			mockPersister := &mockDBPersisterForOrder{
				tracker: orderTracker,
			}

			service := &importServiceImpl{
				sbisClient:      mockClient,
				classifier:      NewNomenclatureClassifier(),
				imageDownloader: &mockImageDownloaderForOrder{},
				slugGenerator:   &mockSlugGeneratorForOrder{},
				dbPersister:     mockPersister,
				logger:          slog.Default(),
			}

			ctx := context.Background()
			params := ImportParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    100,
			}

			_, err := service.StartImport(ctx, params)
			if err != nil {
				// Errors are acceptable, we're testing order not success
				return true
			}

			// Verify that all category operations come before all product operations
			lastCategoryIndex := -1
			firstProductIndex := -1

			for i, op := range orderTracker.operations {
				if op == "categories" {
					lastCategoryIndex = i
				} else if op == "products" && firstProductIndex == -1 {
					firstProductIndex = i
				}
			}

			// If both categories and products were processed, verify order
			if lastCategoryIndex >= 0 && firstProductIndex >= 0 {
				return lastCategoryIndex < firstProductIndex
			}

			// If only one type was processed, order is trivially correct
			return true
		},
		genNomenclatureSliceForImport(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 17: Import Status Persistence
// For any completed import (successful or failed), the import status should be stored with all statistics fields
// and be retrievable via the status API.
func TestProperty_ImportStatusPersistence(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("import status is persisted and retrievable", prop.ForAll(
		func(nomenclatures []model.SBISNomenclature, shouldFail bool) bool {
			mockClient := &mockSBISClientForStatus{
				nomenclatures: nomenclatures,
			}

			mockPersister := &mockDBPersisterForStatus{
				shouldFail: shouldFail,
			}

			service := &importServiceImpl{
				sbisClient:      mockClient,
				classifier:      NewNomenclatureClassifier(),
				imageDownloader: &mockImageDownloaderForStatus{},
				slugGenerator:   &mockSlugGeneratorForStatus{},
				dbPersister:     mockPersister,
				logger:          slog.Default(),
			}

			ctx := context.Background()
			params := ImportParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    100,
			}

			// Execute import
			stats, err := service.StartImport(ctx, params)

			// Get status
			status := service.GetStatus()

			// Status should never be nil after an import attempt
			if status == nil {
				return false
			}

			// Verify status fields are set
			if status.StartedAt.IsZero() {
				return false
			}

			if shouldFail {
				// For failed imports
				if err == nil {
					return false
				}
				if status.Status != model.ImportStatusFailed {
					return false
				}
				if status.Error == nil {
					return false
				}
				if status.CompletedAt == nil {
					return false
				}
			} else {
				// For successful imports
				if err != nil {
					return false
				}
				if status.Status != model.ImportStatusCompleted {
					return false
				}
				if status.Error != nil {
					return false
				}
				if status.CompletedAt == nil {
					return false
				}

				// Verify statistics match
				if stats == nil {
					return false
				}
				if status.CategoriesCreated != stats.CategoriesCreated {
					return false
				}
				if status.CategoriesUpdated != stats.CategoriesUpdated {
					return false
				}
				if status.ProductsCreated != stats.ProductsCreated {
					return false
				}
				if status.ProductsUpdated != stats.ProductsUpdated {
					return false
				}
			}

			return true
		},
		genNomenclatureSliceForImport(),
		gen.Bool(),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Feature: scheduled-catalog-import, Property 21: Idempotent Import - Statistics
// For any import executed twice with identical data, the second execution should return statistics with
// zero created counts and non-zero updated counts equal to the first execution's created counts.
func TestProperty_IdempotentImportStatistics(t *testing.T) {
	properties := gopter.NewProperties(nil)

	properties.Property("second import with same data shows zero created and non-zero updated", prop.ForAll(
		func(nomenclatures []model.SBISNomenclature) bool {
			// Skip empty nomenclatures
			if len(nomenclatures) == 0 {
				return true
			}

			mockClient := &mockSBISClientForIdempotency{
				nomenclatures: nomenclatures,
			}

			mockPersister := &mockDBPersisterForIdempotency{
				existingRecords: make(map[string]bool),
			}

			service := &importServiceImpl{
				sbisClient:      mockClient,
				classifier:      NewNomenclatureClassifier(),
				imageDownloader: &mockImageDownloaderForIdempotency{},
				slugGenerator:   &mockSlugGeneratorForIdempotency{},
				dbPersister:     mockPersister,
				logger:          slog.Default(),
			}

			ctx := context.Background()
			params := ImportParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    100,
			}

			// First import
			stats1, err := service.StartImport(ctx, params)
			if err != nil {
				return false
			}

			// Second import with same data
			stats2, err := service.StartImport(ctx, params)
			if err != nil {
				return false
			}

			// Second import should have zero created
			if stats2.CategoriesCreated != 0 {
				return false
			}
			if stats2.ProductsCreated != 0 {
				return false
			}

			// Second import's updated counts should equal first import's created counts
			if stats2.CategoriesUpdated != stats1.CategoriesCreated {
				return false
			}
			if stats2.ProductsUpdated != stats1.ProductsCreated {
				return false
			}

			return true
		},
		genNomenclatureSliceForImport().SuchThat(func(v interface{}) bool {
			noms := v.([]model.SBISNomenclature)
			return len(noms) > 0
		}),
	))

	properties.TestingRun(t, gopter.ConsoleReporter(false))
}

// Mock implementations for Property 6: Processing Order Guarantee

type operationOrderTracker struct {
	operations []string
}

type mockSBISClientForOrder struct {
	nomenclatures []model.SBISNomenclature
}

func (m *mockSBISClientForOrder) FetchNomenclature(ctx context.Context, params client.FetchParams) (*client.NomenclatureResponse, error) {
	return &client.NomenclatureResponse{
		Nomenclatures: m.nomenclatures,
		HasMore:       false,
		Total:         len(m.nomenclatures),
	}, nil
}

type mockImageDownloaderForOrder struct{}

func (m *mockImageDownloaderForOrder) DownloadImages(ctx context.Context, urls []string) ([]string, error) {
	return urls, nil
}

type mockSlugGeneratorForOrder struct{}

func (m *mockSlugGeneratorForOrder) GenerateUniqueSlug(ctx context.Context, name string, table string, existingSlug string, batchSlugs map[string]bool) (string, error) {
	return "test-slug", nil
}

type mockDBPersisterForOrder struct {
	tracker *operationOrderTracker
}

func (m *mockDBPersisterForOrder) PersistCategories(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	m.tracker.operations = append(m.tracker.operations, "categories")
	return &PersistStats{Created: len(categories), Updated: 0}, nil
}

func (m *mockDBPersisterForOrder) PersistProducts(ctx context.Context, products []model.Product) (*PersistStats, error) {
	m.tracker.operations = append(m.tracker.operations, "products")
	return &PersistStats{Created: len(products), Updated: 0}, nil
}

// Mock implementations for Property 17: Import Status Persistence

type mockSBISClientForStatus struct {
	nomenclatures []model.SBISNomenclature
}

func (m *mockSBISClientForStatus) FetchNomenclature(ctx context.Context, params client.FetchParams) (*client.NomenclatureResponse, error) {
	return &client.NomenclatureResponse{
		Nomenclatures: m.nomenclatures,
		HasMore:       false,
		Total:         len(m.nomenclatures),
	}, nil
}

type mockImageDownloaderForStatus struct{}

func (m *mockImageDownloaderForStatus) DownloadImages(ctx context.Context, urls []string) ([]string, error) {
	return urls, nil
}

type mockSlugGeneratorForStatus struct{}

func (m *mockSlugGeneratorForStatus) GenerateUniqueSlug(ctx context.Context, name string, table string, existingSlug string, batchSlugs map[string]bool) (string, error) {
	return "test-slug", nil
}

type mockDBPersisterForStatus struct {
	shouldFail bool
}

func (m *mockDBPersisterForStatus) PersistCategories(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("mock persistence error")
	}
	return &PersistStats{Created: len(categories), Updated: 0}, nil
}

func (m *mockDBPersisterForStatus) PersistProducts(ctx context.Context, products []model.Product) (*PersistStats, error) {
	if m.shouldFail {
		return nil, fmt.Errorf("mock persistence error")
	}
	return &PersistStats{Created: len(products), Updated: 0}, nil
}

// Mock implementations for Property 21: Idempotent Import Statistics

type mockSBISClientForIdempotency struct {
	nomenclatures []model.SBISNomenclature
}

func (m *mockSBISClientForIdempotency) FetchNomenclature(ctx context.Context, params client.FetchParams) (*client.NomenclatureResponse, error) {
	return &client.NomenclatureResponse{
		Nomenclatures: m.nomenclatures,
		HasMore:       false,
		Total:         len(m.nomenclatures),
	}, nil
}

type mockImageDownloaderForIdempotency struct{}

func (m *mockImageDownloaderForIdempotency) DownloadImages(ctx context.Context, urls []string) ([]string, error) {
	return urls, nil
}

type mockSlugGeneratorForIdempotency struct{}

func (m *mockSlugGeneratorForIdempotency) GenerateUniqueSlug(ctx context.Context, name string, table string, existingSlug string, batchSlugs map[string]bool) (string, error) {
	return "test-slug", nil
}

type mockDBPersisterForIdempotency struct {
	existingRecords map[string]bool
}

func (m *mockDBPersisterForIdempotency) PersistCategories(ctx context.Context, categories []model.Category) (*PersistStats, error) {
	created := 0
	updated := 0

	for _, cat := range categories {
		if m.existingRecords[cat.ExternalID] {
			updated++
		} else {
			created++
			m.existingRecords[cat.ExternalID] = true
		}
	}

	return &PersistStats{Created: created, Updated: updated}, nil
}

func (m *mockDBPersisterForIdempotency) PersistProducts(ctx context.Context, products []model.Product) (*PersistStats, error) {
	created := 0
	updated := 0

	for _, prod := range products {
		if m.existingRecords[prod.ExternalID] {
			updated++
		} else {
			created++
			m.existingRecords[prod.ExternalID] = true
		}
	}

	return &PersistStats{Created: created, Updated: updated}, nil
}

// Helper generators

// genNomenclatureSliceForImport generates a slice of nomenclatures for import testing
func genNomenclatureSliceForImport() gopter.Gen {
	return gen.SliceOfN(10, genNomenclatureForImport())
}

// genNomenclatureForImport generates a single nomenclature with random properties
func genNomenclatureForImport() gopter.Gen {
	return gopter.CombineGens(
		genUniqueUUID(),               // UUID - use custom generator for uniqueness
		gen.AlphaString(),             // Name
		gen.AlphaString(),             // Description
		gen.Float64Range(0, 10000),    // Cost
		gen.IntRange(1, 1000),         // HierarchicalID
		genOptionalIntForImport(),     // HierarchicalParent
		gen.Bool(),                    // IsParent
		gen.Bool(),                    // IsPublished
		gen.IntRange(0, 100),          // Stock
		gen.SliceOf(gen.Identifier()), // Images
	).Map(func(values []interface{}) model.SBISNomenclature {
		return model.SBISNomenclature{
			UUID:               values[0].(string),
			Name:               values[1].(string),
			Description:        values[2].(string),
			Cost:               values[3].(float64),
			HierarchicalID:     values[4].(int),
			HierarchicalParent: values[5].(*int),
			IsParent:           values[6].(bool),
			IsPublished:        values[7].(bool),
			Stock:              values[8].(int),
			Images:             values[9].([]string),
			Attributes:         make(map[string]interface{}),
			Modifiers:          make([]interface{}, 0),
		}
	})
}

// genUniqueUUID generates a unique UUID-like string
func genUniqueUUID() gopter.Gen {
	return gen.Identifier().Map(func(id string) string {
		// Append a timestamp-based suffix to ensure uniqueness
		return fmt.Sprintf("%s-%d", id, time.Now().UnixNano())
	})
}

// genOptionalIntForImport generates an optional int pointer (50% nil, 50% value)
func genOptionalIntForImport() gopter.Gen {
	return gen.OneGenOf(
		gen.Const((*int)(nil)),
		gen.IntRange(1, 1000).Map(func(v int) *int { return &v }),
	)
}

// Mock DB for testing (not used in property tests but needed for compilation)
type mockDB struct{}

func (m *mockDB) QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row {
	return nil
}

func (m *mockDB) BeginTx(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) Close() error {
	return nil
}

func (m *mockDB) Ping() error {
	return nil
}

func (m *mockDB) PingContext(ctx context.Context) error {
	return nil
}

func (m *mockDB) Prepare(query string) (*sql.Stmt, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) PrepareContext(ctx context.Context, query string) (*sql.Stmt, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) Exec(query string, args ...interface{}) (sql.Result, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) Query(query string, args ...interface{}) (*sql.Rows, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) QueryRow(query string, args ...interface{}) *sql.Row {
	return nil
}

func (m *mockDB) Begin() (*sql.Tx, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) Driver() interface{} {
	return nil
}

func (m *mockDB) Conn(ctx context.Context) (*sql.Conn, error) {
	return nil, fmt.Errorf("mock db")
}

func (m *mockDB) SetMaxIdleConns(n int) {}

func (m *mockDB) SetMaxOpenConns(n int) {}

func (m *mockDB) SetConnMaxLifetime(d time.Duration) {}

func (m *mockDB) SetConnMaxIdleTime(d time.Duration) {}

func (m *mockDB) Stats() sql.DBStats {
	return sql.DBStats{}
}
