package docker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type Monitor struct {
	client *client.Client
}

type ContainerInfo struct {
	ID           string
	Name         string
	State        string
	RestartCount int64
}

type ContainerStats struct {
	CPUPercent    float64
	MemoryPercent float64
	MemoryUsage   uint64
	MemoryLimit   uint64
}

func NewMonitor() (*Monitor, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}

	return &Monitor{client: cli}, nil
}

func (m *Monitor) GetContainer(ctx context.Context, serviceName string) (*ContainerInfo, error) {
	containers, err := m.client.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return nil, err
	}

	for _, c := range containers {
		// Проверяем по имени контейнера или по compose service
		for _, name := range c.Names {
			if name == "/"+serviceName || name == serviceName {
				return &ContainerInfo{
					ID:           c.ID,
					Name:         name,
					State:        c.State,
					RestartCount: 0, // RestartCount не доступен в новой версии API
				}, nil
			}
		}

		// Проверяем по label от docker-compose
		if c.Labels["com.docker.compose.service"] == serviceName {
			return &ContainerInfo{
				ID:           c.ID,
				Name:         serviceName,
				State:        c.State,
				RestartCount: 0, // RestartCount не доступен в новой версии API
			}, nil
		}
	}

	return nil, fmt.Errorf("container not found: %s", serviceName)
}

func (m *Monitor) GetStats(ctx context.Context, containerID string) (*ContainerStats, error) {
	// Первый замер
	stats1, err := m.client.ContainerStats(ctx, containerID, false)
	if err != nil {
		return nil, err
	}

	var v1 types.StatsJSON
	if err := json.NewDecoder(stats1.Body).Decode(&v1); err != nil {
		stats1.Body.Close()
		return nil, err
	}
	stats1.Body.Close()

	// Небольшая пауза для точного расчета CPU
	time.Sleep(500 * time.Millisecond)

	// Второй замер
	stats2, err := m.client.ContainerStats(ctx, containerID, false)
	if err != nil {
		return nil, err
	}
	defer stats2.Body.Close()

	var v2 types.StatsJSON
	if err := json.NewDecoder(stats2.Body).Decode(&v2); err != nil {
		return nil, err
	}

	// Расчет CPU между двумя замерами
	cpuDelta := float64(v2.CPUStats.CPUUsage.TotalUsage - v1.CPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(v2.CPUStats.SystemUsage - v1.CPUStats.SystemUsage)
	cpuPercent := 0.0

	numCPU := len(v2.CPUStats.CPUUsage.PercpuUsage)
	if numCPU == 0 {
		numCPU = 1
	}

	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * float64(numCPU) * 100.0
	}

	// Расчет Memory
	memUsage := v2.MemoryStats.Usage
	memLimit := v2.MemoryStats.Limit
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = float64(memUsage) / float64(memLimit) * 100.0
	}

	return &ContainerStats{
		CPUPercent:    cpuPercent,
		MemoryPercent: memPercent,
		MemoryUsage:   memUsage,
		MemoryLimit:   memLimit,
	}, nil
}

func (m *Monitor) Close() {
	if m.client != nil {
		m.client.Close()
	}
}
