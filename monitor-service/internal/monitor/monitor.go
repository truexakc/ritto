package monitor

import (
	"context"
	"fmt"
	"log"
	"time"

	"monitor-service/internal/config"
	"monitor-service/internal/monitor/docker"
	"monitor-service/internal/monitor/health"
	"monitor-service/internal/notifier"
)

type Monitor struct {
	cfg             *config.Config
	notifier        *notifier.Telegram
	dockerMonitor   *docker.Monitor
	healthMonitor   *health.Monitor
	containerStates map[string]int64 // service -> restart count
}

func New(cfg *config.Config, notifier *notifier.Telegram) (*Monitor, error) {
	dockerMon, err := docker.NewMonitor()
	if err != nil {
		return nil, err
	}

	healthMon := health.NewMonitor(cfg.HealthCheckTimeout)

	return &Monitor{
		cfg:             cfg,
		notifier:        notifier,
		dockerMonitor:   dockerMon,
		healthMonitor:   healthMon,
		containerStates: make(map[string]int64),
	}, nil
}

func (m *Monitor) Start(ctx context.Context) {
	ticker := time.NewTicker(m.cfg.CheckInterval)
	defer ticker.Stop()

	log.Println("Monitor started")

	// Первая проверка сразу
	m.check(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Monitor stopped")
			return
		case <-ticker.C:
			m.check(ctx)
		}
	}
}

func (m *Monitor) check(ctx context.Context) {
	log.Println("Running checks...")

	// Проверка Docker контейнеров
	if len(m.cfg.MonitoredServices) > 0 {
		m.checkDockerContainers(ctx)
	}

	// Проверка health endpoints
	if len(m.cfg.HealthEndpoints) > 0 {
		m.checkHealthEndpoints(ctx)
	}
}

func (m *Monitor) checkDockerContainers(ctx context.Context) {
	for _, serviceName := range m.cfg.MonitoredServices {
		container, err := m.dockerMonitor.GetContainer(ctx, serviceName)
		if err != nil {
			log.Printf("Error getting container %s: %v", serviceName, err)
			if m.cfg.AlertOnRestart {
				m.notifier.SendAlert("critical", serviceName, "Container not found or error")
			}
			continue
		}

		// Проверка на рестарты
		if m.cfg.AlertOnRestart {
			prevRestarts, exists := m.containerStates[serviceName]
			currentRestarts := container.RestartCount

			if exists && currentRestarts > prevRestarts {
				msg := fmt.Sprintf("Container restarted (count: %d)", currentRestarts)
				m.notifier.SendAlert("warning", serviceName, msg)
			}

			m.containerStates[serviceName] = currentRestarts
		}

		// Проверка статуса
		if container.State != "running" {
			m.notifier.SendAlert("critical", serviceName,
				fmt.Sprintf("Container is %s", container.State))
		}

		// Проверка CPU/Memory
		if m.cfg.AlertOnHighCPU {
			stats, err := m.dockerMonitor.GetStats(ctx, container.ID)
			if err == nil {
				if stats.CPUPercent > m.cfg.CPUThreshold {
					msg := fmt.Sprintf("High CPU usage: %.2f%%", stats.CPUPercent)
					m.notifier.SendAlert("warning", serviceName, msg)
				}
				if stats.MemoryPercent > m.cfg.MemoryThreshold {
					msg := fmt.Sprintf("High Memory usage: %.2f%%", stats.MemoryPercent)
					m.notifier.SendAlert("warning", serviceName, msg)
				}
			}
		}
	}
}

func (m *Monitor) checkHealthEndpoints(ctx context.Context) {
	for serviceName, endpoint := range m.cfg.HealthEndpoints {
		healthy, err := m.healthMonitor.Check(ctx, endpoint)

		if err != nil || !healthy {
			if m.cfg.AlertOnHealthFail {
				msg := "Health check failed"
				if err != nil {
					msg = fmt.Sprintf("Health check failed: %v", err)
				}
				m.notifier.SendAlert("critical", serviceName, msg)
			}
		}
	}
}

func (m *Monitor) Close() {
	if m.dockerMonitor != nil {
		m.dockerMonitor.Close()
	}
}

func (m *Monitor) GetDockerMonitor() *docker.Monitor {
	return m.dockerMonitor
}
