package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"saby-service/internal/model"

	"github.com/google/uuid"
)

// SabyClient defines the interface for interacting with SABY API
type SabyClient interface {
	CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error)
}

// sabyClientImpl implements the SabyClient interface
type sabyClientImpl struct {
	httpClient *http.Client
	baseURL    string
	apiKey     string
	stubMode   bool
}

// NewSabyClient creates a new SABY client with the given configuration
func NewSabyClient(baseURL, apiKey string) SabyClient {
	// Read SABY_STUB_MODE environment variable
	stubModeEnv := os.Getenv("SABY_STUB_MODE")
	stubMode := stubModeEnv == "true" || stubModeEnv == "1"

	if stubMode {
		log.Printf("🚧 SABY_STUB_MODE is enabled - orders will NOT be sent to real SABY API")
	}

	return &sabyClientImpl{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL:  baseURL,
		apiKey:   apiKey,
		stubMode: stubMode,
	}
}

// SBISOrderResponse represents the response from SBIS API
type SBISOrderResponse struct {
	State    int                      `json:"state"`
	Payments []map[string]interface{} `json:"payments"`
}

// CreateOrder creates a new order in the SABY system via SBIS API
func (c *sabyClientImpl) CreateOrder(ctx context.Context, req *model.OrderRequest) (*model.OrderResponse, error) {
	// Handle context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// ========================================
	// Преобразование datetime из UTC в GMT+5
	// ========================================
	if req.Datetime != "" {
		// Парсим datetime из строки "гггг-мм-дд чч:мм:сс" как UTC
		parsedTime, err := time.Parse("2006-01-02 15:04:05", req.Datetime)
		if err != nil {
			log.Printf("⚠️  Failed to parse datetime '%s', using as is: %v", req.Datetime, err)
		} else {
			// Добавляем 5 часов для преобразования UTC → GMT+5
			parsedTime = parsedTime.Add(5 * time.Hour)

			// Форматируем обратно в строку
			req.Datetime = parsedTime.Format("2006-01-02 15:04:05")
			log.Printf("📅 Datetime преобразован из UTC в GMT+5: %s", req.Datetime)
		}
	}

	// Marshal request to JSON for logging
	jsonData, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	log.Printf("📋 Full payload for Saby API:\n%s", string(jsonData))

	// Check if stub mode is enabled
	if c.stubMode {
		log.Println("🚧 STUB MODE ACTIVE: Order NOT sent to Saby API")

		// Return mock response with stub order ID
		stubOrderID := fmt.Sprintf("STUB-%d", time.Now().Unix())
		response := &model.OrderResponse{
			OrderID:    stubOrderID,
			ExternalID: "stub-external-id",
			Status:     "stub_mode",
			CreatedAt:  time.Now(),
			Message:    "Stub mode active, order not sent to Saby",
		}

		log.Printf("✅ Stub order created: %s", stubOrderID)
		return response, nil
	}

	log.Printf("📤 Sending order to SBIS API: %s/retail/order/create", c.baseURL)

	// Marshal request to JSON
	jsonData, err = json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	log.Printf("📦 Original request payload: %s", string(jsonData))

	// Remove empty externalId fields from JSON
	var jsonMap map[string]interface{}
	if err := json.Unmarshal(jsonData, &jsonMap); err != nil {
		log.Printf("❌ Failed to unmarshal for cleanup: %v", err)
		return nil, fmt.Errorf("failed to unmarshal for cleanup: %w", err)
	}

	log.Printf("🔧 Cleaning up empty fields...")

	// Clean up customer.externalId if empty
	if customer, ok := jsonMap["customer"].(map[string]interface{}); ok {
		if externalID, exists := customer["externalId"]; exists {
			if externalID == "" {
				log.Printf("✂️  Removing empty customer.externalId")
				delete(customer, "externalId")
			}
		}
	}

	// Clean up delivery.addressJSON and delivery.addressFull if empty
	if delivery, ok := jsonMap["delivery"].(map[string]interface{}); ok {
		if addressJSON, exists := delivery["addressJSON"]; exists {
			if addressJSON == "" {
				log.Printf("✂️  Removing empty delivery.addressJSON")
				delete(delivery, "addressJSON")
			}
		}
		if addressFull, exists := delivery["addressFull"]; exists {
			if addressFull == "" {
				log.Printf("✂️  Removing empty delivery.addressFull")
				delete(delivery, "addressFull")
			}
		}
	}

	// Clean up nomenclatures[].externalId if empty
	if nomenclatures, ok := jsonMap["nomenclatures"].([]interface{}); ok {
		for _, nom := range nomenclatures {
			if nomMap, ok := nom.(map[string]interface{}); ok {
				if externalID, exists := nomMap["externalId"]; exists {
					if externalID == "" {
						delete(nomMap, "externalId")
					}
				}
			}
		}
	}

	// Re-marshal cleaned JSON
	jsonData, err = json.Marshal(jsonMap)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal cleaned request: %w", err)
	}

	log.Printf("📦 Cleaned request payload: %s", string(jsonData))

	// Create HTTP request
	apiURL := fmt.Sprintf("%s/retail/order/create", c.baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-SBISAccessToken", c.apiKey)

	// Execute request
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("📥 SBIS API response status: %d, body: %s", resp.StatusCode, string(body))

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var sbisResponse SBISOrderResponse
	if err := json.Unmarshal(body, &sbisResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Map SBIS response to OrderResponse
	response := &model.OrderResponse{
		OrderID:    uuid.New().String(),
		ExternalID: fmt.Sprintf("SBIS-%d", sbisResponse.State),
		Status:     mapSBISState(sbisResponse.State),
		CreatedAt:  time.Now(),
		Message:    "Order created successfully",
	}

	log.Printf("✅ Order created successfully: %s (SBIS state: %d)", response.OrderID, sbisResponse.State)

	return response, nil
}

// mapSBISState maps SBIS state code to human-readable status
func mapSBISState(state int) string {
	// SBIS state codes (примерные значения, нужно уточнить в документации)
	stateMap := map[int]string{
		0: "created",
		1: "accepted",
		2: "processing",
		3: "completed",
		4: "cancelled",
	}

	if status, ok := stateMap[state]; ok {
		return status
	}

	return fmt.Sprintf("unknown-%d", state)
}
