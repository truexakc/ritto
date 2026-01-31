package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	TelegramBotToken string
	TelegramChatID   string

	CheckInterval      time.Duration
	HealthCheckTimeout time.Duration

	MonitoredServices []string
	HealthEndpoints   map[string]string

	AlertOnRestart    bool
	AlertOnHealthFail bool
	AlertOnHighCPU    bool
	CPUThreshold      float64
	MemoryThreshold   float64
}

func Load() (*Config, error) {
	cfg := &Config{
		TelegramBotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
		HealthEndpoints:  make(map[string]string),
	}

	if cfg.TelegramBotToken == "" {
		return nil, fmt.Errorf("TELEGRAM_BOT_TOKEN is required")
	}
	if cfg.TelegramChatID == "" {
		return nil, fmt.Errorf("TELEGRAM_CHAT_ID is required")
	}

	cfg.CheckInterval = parseDuration("CHECK_INTERVAL", 60)
	cfg.HealthCheckTimeout = parseDuration("HEALTH_CHECK_TIMEOUT", 10)

	servicesStr := os.Getenv("MONITORED_SERVICES")
	if servicesStr != "" {
		cfg.MonitoredServices = strings.Split(servicesStr, ",")
		for i := range cfg.MonitoredServices {
			cfg.MonitoredServices[i] = strings.TrimSpace(cfg.MonitoredServices[i])
		}
	}

	endpointsStr := os.Getenv("HEALTH_ENDPOINTS")
	if endpointsStr != "" {
		pairs := strings.Split(endpointsStr, ",")
		for _, pair := range pairs {
			kv := strings.Split(pair, "=")
			if len(kv) == 2 {
				cfg.HealthEndpoints[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
			}
		}
	}

	cfg.AlertOnRestart = parseBool("ALERT_ON_CONTAINER_RESTART", true)
	cfg.AlertOnHealthFail = parseBool("ALERT_ON_HEALTH_CHECK_FAIL", true)
	cfg.AlertOnHighCPU = parseBool("ALERT_ON_HIGH_CPU", true)
	cfg.CPUThreshold = parseFloat("CPU_THRESHOLD", 80)
	cfg.MemoryThreshold = parseFloat("MEMORY_THRESHOLD", 80)

	return cfg, nil
}

func parseDuration(key string, defaultVal int) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return time.Duration(defaultVal) * time.Second
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return time.Duration(defaultVal) * time.Second
	}
	return time.Duration(i) * time.Second
}

func parseBool(key string, defaultVal bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return b
}

func parseFloat(key string, defaultVal float64) float64 {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	f, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return defaultVal
	}
	return f
}
