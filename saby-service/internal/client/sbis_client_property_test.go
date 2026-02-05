package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"saby-service/internal/model"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// Feature: scheduled-catalog-import, Property 1: API Request Structure
// For any set of import parameters (pointId, priceListId, pageSize, page),
// when the SBIS Client constructs a request, the request should include all
// parameters as query parameters and the X-SBISAccessToken header.
func TestProperty_APIRequestStructure(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 20

	properties := gopter.NewProperties(parameters)

	properties.Property("API request includes all parameters and auth header", prop.ForAll(
		func(pointID, priceListID, pageSize, page int) bool {
			// Track request details
			var capturedRequest *http.Request

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				capturedRequest = r
				response := NomenclatureResponse{
					Nomenclatures: []model.SBISNomenclature{},
					HasMore:       false,
					Total:         0,
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}))
			defer server.Close()

			client := NewSBISClient(server.URL, "test-token-123", 1000)

			ctx := context.Background()
			params := FetchParams{
				PointID:     pointID,
				PriceListID: priceListID,
				PageSize:    pageSize,
				Page:        page,
			}

			_, err := client.FetchNomenclature(ctx, params)
			if err != nil {
				return false
			}

			// Verify request was captured
			if capturedRequest == nil {
				return false
			}

			// Verify HTTP method
			if capturedRequest.Method != http.MethodGet {
				return false
			}

			// Verify authentication header
			if capturedRequest.Header.Get("X-SBISAccessToken") != "test-token-123" {
				return false
			}

			// Verify query parameters
			query := capturedRequest.URL.Query()
			if query.Get("pointId") != strconv.Itoa(pointID) {
				return false
			}
			if query.Get("priceListId") != strconv.Itoa(priceListID) {
				return false
			}
			if query.Get("pageSize") != strconv.Itoa(pageSize) {
				return false
			}
			if query.Get("page") != strconv.Itoa(page) {
				return false
			}

			return true
		},
		gen.IntRange(1, 1000), // pointID
		gen.IntRange(1, 1000), // priceListID
		gen.IntRange(1, 100),  // pageSize
		gen.IntRange(0, 10),   // page
	))

	properties.TestingRun(t)
}

// Feature: scheduled-catalog-import, Property 2: Pagination Completeness
// For any sequence of paginated API responses, when hasMore is true,
// the client should continue requesting subsequent pages with incrementing
// page numbers until hasMore becomes false.
func TestProperty_PaginationCompleteness(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 20

	properties := gopter.NewProperties(parameters)

	properties.Property("client fetches all pages until hasMore is false", prop.ForAll(
		func(numPages int) bool {
			if numPages < 1 {
				numPages = 1
			}
			if numPages > 20 {
				numPages = 20
			}

			requestedPages := []int{}

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				pageStr := r.URL.Query().Get("page")
				page, _ := strconv.Atoi(pageStr)
				requestedPages = append(requestedPages, page)

				hasMore := page < (numPages - 1)
				response := NomenclatureResponse{
					Nomenclatures: []model.SBISNomenclature{
						{UUID: fmt.Sprintf("item-%d", page), HierarchicalID: page},
					},
					HasMore: hasMore,
					Total:   numPages,
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}))
			defer server.Close()

			client := NewSBISClient(server.URL, "test-token", 1000)

			ctx := context.Background()
			params := FetchParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    1,
				Page:        0,
			}

			result, err := client.FetchNomenclature(ctx, params)
			if err != nil {
				return false
			}

			// Verify all pages were requested
			if len(requestedPages) != numPages {
				return false
			}

			// Verify pages were requested in order starting from 0
			for i := 0; i < numPages; i++ {
				if requestedPages[i] != i {
					return false
				}
			}

			// Verify all items were collected
			if len(result.Nomenclatures) != numPages {
				return false
			}

			// Verify final hasMore is false
			if result.HasMore {
				return false
			}

			return true
		},
		gen.IntRange(1, 20), // numPages
	))

	properties.TestingRun(t)
}

// Feature: scheduled-catalog-import, Property 3: JSON Parsing Preservation
// For any valid SBIS API JSON response containing nomenclatures,
// parsing the response should extract all nomenclature objects with all fields preserved.
func TestProperty_JSONParsingPreservation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 20

	properties := gopter.NewProperties(parameters)

	properties.Property("JSON parsing preserves all nomenclature fields", prop.ForAll(
		func(uuid, id, name, description, article string, cost float64, hierarchicalID, stock int, isParent, isKit, isPublished bool) bool {
			// Create a nomenclature with all fields
			originalNomenclature := model.SBISNomenclature{
				UUID:           uuid,
				ID:             id,
				Name:           name,
				Description:    description,
				Cost:           cost,
				HierarchicalID: hierarchicalID,
				IsParent:       isParent,
				Article:        article,
				IsKit:          isKit,
				IsPublished:    isPublished,
				Stock:          stock,
				Images:         []string{"image1.jpg", "image2.jpg"},
			}

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				response := NomenclatureResponse{
					Nomenclatures: []model.SBISNomenclature{originalNomenclature},
					HasMore:       false,
					Total:         1,
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}))
			defer server.Close()

			client := NewSBISClient(server.URL, "test-token", 1000)

			ctx := context.Background()
			params := FetchParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    10,
				Page:        0,
			}

			result, err := client.FetchNomenclature(ctx, params)
			if err != nil {
				return false
			}

			if len(result.Nomenclatures) != 1 {
				return false
			}

			parsed := result.Nomenclatures[0]

			// Verify all fields are preserved
			return parsed.UUID == originalNomenclature.UUID &&
				parsed.ID == originalNomenclature.ID &&
				parsed.Name == originalNomenclature.Name &&
				parsed.Description == originalNomenclature.Description &&
				parsed.Cost == originalNomenclature.Cost &&
				parsed.HierarchicalID == originalNomenclature.HierarchicalID &&
				parsed.IsParent == originalNomenclature.IsParent &&
				parsed.Article == originalNomenclature.Article &&
				parsed.IsKit == originalNomenclature.IsKit &&
				parsed.IsPublished == originalNomenclature.IsPublished &&
				parsed.Stock == originalNomenclature.Stock &&
				len(parsed.Images) == len(originalNomenclature.Images)
		},
		gen.Identifier(),           // uuid
		gen.Identifier(),           // id
		gen.AlphaString(),          // name
		gen.AlphaString(),          // description
		gen.AlphaString(),          // article
		gen.Float64Range(0, 10000), // cost
		gen.IntRange(1, 10000),     // hierarchicalID
		gen.IntRange(0, 1000),      // stock
		gen.Bool(),                 // isParent
		gen.Bool(),                 // isKit
		gen.Bool(),                 // isPublished
	))

	properties.TestingRun(t)
}

// Feature: scheduled-catalog-import, Property 4: Retry Logic Bounds
// For any network error or timeout, the SBIS Client should retry the request
// exactly 3 times with exponential backoff before failing.
func TestProperty_RetryLogicBounds(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 2

	properties := gopter.NewProperties(parameters)

	properties.Property("client retries exactly 3 times for network errors", prop.ForAll(
		func(statusCode int) bool {
			// Use error status codes (not 200 or 401)
			if statusCode == 200 || statusCode == 401 {
				statusCode = 500
			}
			if statusCode < 400 || statusCode > 599 {
				statusCode = 500
			}

			requestCount := 0

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requestCount++
				w.WriteHeader(statusCode)
				w.Write([]byte(`{"error": "server error"}`))
			}))
			defer server.Close()

			client := NewSBISClient(server.URL, "test-token", 1000)

			ctx := context.Background()
			params := FetchParams{
				PointID:     1,
				PriceListID: 1,
				PageSize:    10,
				Page:        0,
			}

			_, err := client.FetchNomenclature(ctx, params)

			// Should return an error
			if err == nil {
				return false
			}

			// Should make exactly 4 requests (1 initial + 3 retries)
			return requestCount == 4
		},
		gen.IntRange(400, 599), // statusCode (error codes)
	))

	properties.TestingRun(t)
}
