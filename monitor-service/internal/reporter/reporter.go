package reporter

import (
	"context"
	"fmt"
	"strings"
	"time"

	"monitor-service/internal/monitor/docker"
	"monitor-service/internal/notifier"
)

type Reporter struct {
	dockerMonitor *docker.Monitor
	notifier      *notifier.Telegram
}

func New(dockerMonitor *docker.Monitor, notifier *notifier.Telegram) *Reporter {
	return &Reporter{
		dockerMonitor: dockerMonitor,
		notifier:      notifier,
	}
}

func (r *Reporter) SendStatusReport(ctx context.Context, services []string) error {
	var report strings.Builder

	report.WriteString("📊 <b>Docker Environment Status Report</b>\n")
	report.WriteString(fmt.Sprintf("🕐 <i>%s</i>\n\n", time.Now().Format("2006-01-02 15:04:05")))

	healthyCount := 0
	unhealthyCount := 0
	stoppedCount := 0

	for _, serviceName := range services {
		container, err := r.dockerMonitor.GetContainer(ctx, serviceName)
		if err != nil {
			report.WriteString(fmt.Sprintf("❌ <b>%s</b>: Not found\n", serviceName))
			unhealthyCount++
			continue
		}

		var statusEmoji string
		switch container.State {
		case "running":
			statusEmoji = "✅"
			healthyCount++
		case "exited", "dead":
			statusEmoji = "🔴"
			stoppedCount++
		case "restarting":
			statusEmoji = "🔄"
			unhealthyCount++
		case "paused":
			statusEmoji = "⏸️"
			unhealthyCount++
		default:
			statusEmoji = "⚠️"
			unhealthyCount++
		}

		report.WriteString(fmt.Sprintf("%s <b>%s</b>: %s\n", statusEmoji, serviceName, container.State))

		// Получаем статистику если контейнер запущен
		if container.State == "running" {
			stats, err := r.dockerMonitor.GetStats(ctx, container.ID)
			if err == nil {
				report.WriteString(fmt.Sprintf("   CPU: %.1f%% | Memory: %.1f%% (%.0fMB)\n",
					stats.CPUPercent,
					stats.MemoryPercent,
					float64(stats.MemoryUsage)/(1024*1024)))
			}
		}
	}

	report.WriteString(fmt.Sprintf("\n📈 <b>Summary:</b>\n"))
	report.WriteString(fmt.Sprintf("✅ Running: %d\n", healthyCount))
	report.WriteString(fmt.Sprintf("❌ Issues: %d\n", unhealthyCount))
	report.WriteString(fmt.Sprintf("🔴 Stopped: %d\n", stoppedCount))

	return r.notifier.SendMessage(report.String())
}

func (r *Reporter) SendDetailedStats(ctx context.Context, serviceName string) error {
	container, err := r.dockerMonitor.GetContainer(ctx, serviceName)
	if err != nil {
		return r.notifier.SendMessage(fmt.Sprintf("❌ Service <b>%s</b> not found", serviceName))
	}

	var report strings.Builder
	report.WriteString(fmt.Sprintf("📊 <b>%s</b> Details\n\n", serviceName))
	report.WriteString(fmt.Sprintf("🆔 ID: <code>%s</code>\n", container.ID[:12]))
	report.WriteString(fmt.Sprintf("📍 State: <b>%s</b>\n", container.State))

	if container.State == "running" {
		stats, err := r.dockerMonitor.GetStats(ctx, container.ID)
		if err == nil {
			report.WriteString(fmt.Sprintf("\n💻 <b>Resources:</b>\n"))
			report.WriteString(fmt.Sprintf("CPU: %.2f%%\n", stats.CPUPercent))
			report.WriteString(fmt.Sprintf("Memory: %.2f%% (%.0f MB / %.0f MB)\n",
				stats.MemoryPercent,
				float64(stats.MemoryUsage)/(1024*1024),
				float64(stats.MemoryLimit)/(1024*1024)))
		}
	}

	return r.notifier.SendMessage(report.String())
}
