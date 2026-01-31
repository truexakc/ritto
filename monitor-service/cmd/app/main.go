package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"monitor-service/internal/config"
	"monitor-service/internal/monitor"
	"monitor-service/internal/notifier"
	"monitor-service/internal/reporter"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

func main() {
	log.Println("Starting Monitor Service...")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	telegramNotifier, err := notifier.NewTelegram(cfg.TelegramBotToken, cfg.TelegramChatID)
	if err != nil {
		log.Fatalf("Failed to create Telegram notifier: %v", err)
	}

	mon, err := monitor.New(cfg, telegramNotifier)
	if err != nil {
		log.Fatalf("Failed to create monitor: %v", err)
	}
	defer mon.Close()

	rep := reporter.New(mon.GetDockerMonitor(), telegramNotifier)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Запуск мониторинга
	go mon.Start(ctx)

	// Запуск обработчика команд Telegram
	go handleTelegramCommands(ctx, telegramNotifier, rep, cfg)

	// Отправка стартового сообщения
	telegramNotifier.SendMessage("🟢 Monitor Service started\n\nCommands:\n/status - Full status report\n/help - Show commands")

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down...")
	cancel()
	time.Sleep(2 * time.Second)
	telegramNotifier.SendMessage("🔴 Monitor Service stopped")
}

func handleTelegramCommands(ctx context.Context, notifier *notifier.Telegram, rep *reporter.Reporter, cfg *config.Config) {
	bot := notifier.GetBot()

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := bot.GetUpdatesChan(u)

	for {
		select {
		case <-ctx.Done():
			return
		case update := <-updates:
			if update.Message == nil {
				continue
			}

			if !update.Message.IsCommand() {
				continue
			}

			command := update.Message.Command()
			log.Printf("Received command: %s from user %d", command, update.Message.From.ID)

			switch command {
			case "status":
				rep.SendStatusReport(ctx, cfg.MonitoredServices)
			case "help":
				helpText := `📋 <b>Available Commands:</b>

/status - Full status report of all services
/help - Show this help message

<i>Monitoring runs automatically every %d seconds</i>`
				notifier.SendMessage(strings.Replace(helpText, "%d", fmt.Sprintf("%d", int(cfg.CheckInterval.Seconds())), 1))
			default:
				notifier.SendMessage(fmt.Sprintf("Unknown command: /%s\nUse /help to see available commands", command))
			}
		}
	}
}
