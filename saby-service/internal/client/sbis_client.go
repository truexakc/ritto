package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"saby-service/internal/model"
)

// SBISClient defines the interface for interacting with SBIS API
type SBISClient interface {
	FetchNomenclature(ctx context.Context, params FetchParams) (*NomenclatureResponse, error)
}

// FetchParams contains parameters for fetching nomenclature from SBIS API
type FetchParams struct {
	PointID     int
	PriceListID int
	PageSize    int
	Page        int
}

// NomenclatureResponse represents the response from SBIS API
type NomenclatureResponse struct {
	Nomenclatures []model.SBISNomenclature `json:"nomenclatures"`
	HasMore       bool                     `json:"hasMore"`
	Total         int                      `json:"total"`
}

// sbisClientImpl implements the SBISClient interface
type sbisClientImpl struct {
	httpClient  *http.Client
	baseURL     string
	accessToken string
	maxPages    int
}

// NewSBISClient creates a new SBIS client with the given configuration
func NewSBISClient(baseURL, accessToken string, maxPages int) SBISClient {
	return &sbisClientImpl{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL:     baseURL,
		accessToken: accessToken,
		maxPages:    maxPages,
	}
}

// FetchNomenclature fetches nomenclature data from SBIS API with pagination support
func (c *sbisClientImpl) FetchNomenclature(ctx context.Context, params FetchParams) (*NomenclatureResponse, error) {
	var allNomenclatures []model.SBISNomenclature
	page := params.Page
	totalCount := 0
	pagesProcessed := 0

	for {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		// Check max pages protection
		if pagesProcessed >= c.maxPages {
			break
		}

		// Fetch single page
		response, err := c.fetchSinglePage(ctx, params.PointID, params.PriceListID, params.PageSize, page)
		if err != nil {
			return nil, err
		}

		// Accumulate nomenclatures
		allNomenclatures = append(allNomenclatures, response.Nomenclatures...)
		totalCount = response.Total
		pagesProcessed++

		// Check if there are more pages
		if !response.HasMore {
			break
		}

		page++
	}

	return &NomenclatureResponse{
		Nomenclatures: allNomenclatures,
		HasMore:       false,
		Total:         totalCount,
	}, nil
}

// fetchSinglePage fetches a single page of nomenclature data with retry logic
func (c *sbisClientImpl) fetchSinglePage(ctx context.Context, pointID, priceListID, pageSize, page int) (*NomenclatureResponse, error) {
	maxRetries := 3
	retryDelays := []time.Duration{1 * time.Second, 2 * time.Second, 4 * time.Second}

	var lastErr error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		// Check context cancellation before each attempt
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		// Make the HTTP request
		response, err := c.makeRequest(ctx, pointID, priceListID, pageSize, page)
		if err != nil {
			// Check if it's an authentication error (401)
			if isAuthError(err) {
				// Don't retry authentication errors
				return nil, err
			}

			lastErr = err

			// If this is not the last attempt, wait before retrying
			if attempt < maxRetries {
				delay := retryDelays[attempt]
				select {
				case <-time.After(delay):
					continue
				case <-ctx.Done():
					return nil, ctx.Err()
				}
			}
			continue
		}

		return response, nil
	}

	return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}

// makeRequest makes a single HTTP request to SBIS API
func (c *sbisClientImpl) makeRequest(ctx context.Context, pointID, priceListID, pageSize, page int) (*NomenclatureResponse, error) {
	// Build URL with query parameters
	apiURL := fmt.Sprintf("%s/retail/v2/nomenclature/list", c.baseURL)
	u, err := url.Parse(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %w", err)
	}

	q := u.Query()
	q.Set("pointId", strconv.Itoa(pointID))
	q.Set("priceListId", strconv.Itoa(priceListID))
	q.Set("pageSize", strconv.Itoa(pageSize))
	q.Set("page", strconv.Itoa(page))
	u.RawQuery = q.Encode()

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authentication header
	req.Header.Set("X-SBISAccessToken", c.accessToken)

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Check for authentication error
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, &AuthError{StatusCode: resp.StatusCode}
	}

	// Check for other HTTP errors
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	// Parse response body
	var response NomenclatureResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &response, nil
}

// AuthError represents an authentication error from SBIS API
type AuthError struct {
	StatusCode int
}

func (e *AuthError) Error() string {
	return fmt.Sprintf("authentication failed with status code %d", e.StatusCode)
}

// isAuthError checks if an error is an authentication error
func isAuthError(err error) bool {
	_, ok := err.(*AuthError)
	return ok
}
