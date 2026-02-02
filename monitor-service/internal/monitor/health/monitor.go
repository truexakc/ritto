package health

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

type Monitor struct {
	client  *http.Client
	timeout time.Duration
}

func NewMonitor(timeout time.Duration) *Monitor {
	return &Monitor{
		client: &http.Client{
			Timeout: timeout,
		},
		timeout: timeout,
	}
}

func (m *Monitor) Check(ctx context.Context, endpoint string) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return false, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := m.client.Do(req)
	if err != nil {
		return false, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return true, nil
	}

	return false, fmt.Errorf("unhealthy status code: %d", resp.StatusCode)
}
