package client

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"saby-service/internal/model"
)

// TestSBISClient_401AuthenticationError tests that 401 errors are not retried
func TestSBISClient_401AuthenticationError(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error": "unauthorized"}`))
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "invalid-token", 1000)

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
		t.Fatal("expected error for 401 response, got nil")
	}

	// Should be an AuthError
	if !isAuthError(err) {
		t.Errorf("expected AuthError, got %T: %v", err, err)
	}

	// Should only make 1 request (no retries for auth errors)
	if requestCount != 1 {
		t.Errorf("expected 1 request (no retries), got %d", requestCount)
	}
}

// TestSBISClient_EmptyNomenclatureArray tests handling of empty nomenclature response
func TestSBISClient_EmptyNomenclatureArray(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := NomenclatureResponse{
			Nomenclatures: []model.SBISNomenclature{},
			HasMore:       false,
			Total:         0,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "valid-token", 1000)

	ctx := context.Background()
	params := FetchParams{
		PointID:     1,
		PriceListID: 1,
		PageSize:    10,
		Page:        0,
	}

	result, err := client.FetchNomenclature(ctx, params)

	// Should not return an error
	if err != nil {
		t.Fatalf("expected no error for empty array, got: %v", err)
	}

	// Should return empty array
	if result == nil {
		t.Fatal("expected non-nil result")
	}

	if len(result.Nomenclatures) != 0 {
		t.Errorf("expected 0 nomenclatures, got %d", len(result.Nomenclatures))
	}

	if result.Total != 0 {
		t.Errorf("expected total 0, got %d", result.Total)
	}

	if result.HasMore {
		t.Error("expected HasMore to be false")
	}
}

// TestSBISClient_ContextCancellation tests that context cancellation is respected
func TestSBISClient_ContextCancellation(t *testing.T) {
	// Create a server that delays response
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		response := NomenclatureResponse{
			Nomenclatures: []model.SBISNomenclature{},
			HasMore:       false,
			Total:         0,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "valid-token", 1000)

	// Create a context that will be cancelled
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel the context immediately
	cancel()

	params := FetchParams{
		PointID:     1,
		PriceListID: 1,
		PageSize:    10,
		Page:        0,
	}

	_, err := client.FetchNomenclature(ctx, params)

	// Should return context error
	if err == nil {
		t.Fatal("expected error for cancelled context, got nil")
	}

	if err != context.Canceled {
		t.Errorf("expected context.Canceled error, got: %v", err)
	}
}

// TestSBISClient_ContextTimeout tests that context timeout is respected
func TestSBISClient_ContextTimeout(t *testing.T) {
	// Create a server that delays response longer than timeout
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
		response := NomenclatureResponse{
			Nomenclatures: []model.SBISNomenclature{},
			HasMore:       false,
			Total:         0,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "valid-token", 1000)

	// Create a context with very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	params := FetchParams{
		PointID:     1,
		PriceListID: 1,
		PageSize:    10,
		Page:        0,
	}

	_, err := client.FetchNomenclature(ctx, params)

	// Should return context deadline exceeded error
	if err == nil {
		t.Fatal("expected error for context timeout, got nil")
	}

	if err != context.DeadlineExceeded {
		t.Errorf("expected context.DeadlineExceeded error, got: %v", err)
	}
}

// TestSBISClient_NetworkErrorRetry tests that network errors are retried
func TestSBISClient_NetworkErrorRetry(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		// Return 500 error to simulate network/server error
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "internal server error"}`))
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "valid-token", 1000)

	ctx := context.Background()
	params := FetchParams{
		PointID:     1,
		PriceListID: 1,
		PageSize:    10,
		Page:        0,
	}

	_, err := client.FetchNomenclature(ctx, params)

	// Should return an error after retries
	if err == nil {
		t.Fatal("expected error after retries, got nil")
	}

	// Should make 4 requests (1 initial + 3 retries)
	if requestCount != 4 {
		t.Errorf("expected 4 requests (1 initial + 3 retries), got %d", requestCount)
	}
}

// TestSBISClient_SuccessfulRequest tests a successful request
func TestSBISClient_SuccessfulRequest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request structure
		if r.Method != http.MethodGet {
			t.Errorf("expected GET method, got %s", r.Method)
		}

		// Verify authentication header
		token := r.Header.Get("X-SBISAccessToken")
		if token != "test-token" {
			t.Errorf("expected X-SBISAccessToken header 'test-token', got '%s'", token)
		}

		// Verify query parameters
		query := r.URL.Query()
		if query.Get("pointId") != "123" {
			t.Errorf("expected pointId '123', got '%s'", query.Get("pointId"))
		}
		if query.Get("priceListId") != "456" {
			t.Errorf("expected priceListId '456', got '%s'", query.Get("priceListId"))
		}
		if query.Get("pageSize") != "50" {
			t.Errorf("expected pageSize '50', got '%s'", query.Get("pageSize"))
		}
		if query.Get("page") != "0" {
			t.Errorf("expected page '0', got '%s'", query.Get("page"))
		}

		// Return successful response
		response := NomenclatureResponse{
			Nomenclatures: []model.SBISNomenclature{
				{
					UUID:           "test-uuid-1",
					ID:             "test-id-1",
					Name:           "Test Product",
					HierarchicalID: 1,
				},
			},
			HasMore: false,
			Total:   1,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	client := NewSBISClient(server.URL, "test-token", 1000)

	ctx := context.Background()
	params := FetchParams{
		PointID:     123,
		PriceListID: 456,
		PageSize:    50,
		Page:        0,
	}

	result, err := client.FetchNomenclature(ctx, params)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if result == nil {
		t.Fatal("expected non-nil result")
	}

	if len(result.Nomenclatures) != 1 {
		t.Errorf("expected 1 nomenclature, got %d", len(result.Nomenclatures))
	}

	if result.Nomenclatures[0].Name != "Test Product" {
		t.Errorf("expected name 'Test Product', got '%s'", result.Nomenclatures[0].Name)
	}
}

// TestSBISClient_Pagination tests pagination handling
func TestSBISClient_Pagination(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		page := r.URL.Query().Get("page")
		requestCount++

		var response NomenclatureResponse
		if page == "0" {
			response = NomenclatureResponse{
				Nomenclatures: []model.SBISNomenclature{
					{UUID: "item-1", Name: "Item 1", HierarchicalID: 1},
					{UUID: "item-2", Name: "Item 2", HierarchicalID: 2},
				},
				HasMore: true,
				Total:   4,
			}
		} else if page == "1" {
			response = NomenclatureResponse{
				Nomenclatures: []model.SBISNomenclature{
					{UUID: "item-3", Name: "Item 3", HierarchicalID: 3},
					{UUID: "item-4", Name: "Item 4", HierarchicalID: 4},
				},
				HasMore: false,
				Total:   4,
			}
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
		PageSize:    2,
		Page:        0,
	}

	result, err := client.FetchNomenclature(ctx, params)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Should make 2 requests (page 0 and page 1)
	if requestCount != 2 {
		t.Errorf("expected 2 requests, got %d", requestCount)
	}

	// Should return all 4 items
	if len(result.Nomenclatures) != 4 {
		t.Errorf("expected 4 nomenclatures, got %d", len(result.Nomenclatures))
	}

	// Should have HasMore = false after pagination completes
	if result.HasMore {
		t.Error("expected HasMore to be false after pagination completes")
	}
}

// TestSBISClient_MaxPagesProtection tests that max pages limit is enforced
func TestSBISClient_MaxPagesProtection(t *testing.T) {
	requestCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		// Always return hasMore=true to simulate infinite pagination
		response := NomenclatureResponse{
			Nomenclatures: []model.SBISNomenclature{
				{UUID: "item", Name: "Item", HierarchicalID: 1},
			},
			HasMore: true,
			Total:   1000000,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// Set max pages to 5
	client := NewSBISClient(server.URL, "test-token", 5)

	ctx := context.Background()
	params := FetchParams{
		PointID:     1,
		PriceListID: 1,
		PageSize:    10,
		Page:        0,
	}

	result, err := client.FetchNomenclature(ctx, params)

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Should stop after 5 pages
	if requestCount != 5 {
		t.Errorf("expected 5 requests (max pages), got %d", requestCount)
	}

	// Should return 5 items (1 per page)
	if len(result.Nomenclatures) != 5 {
		t.Errorf("expected 5 nomenclatures, got %d", len(result.Nomenclatures))
	}
}
