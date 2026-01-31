package notifier

import (
	"fmt"
	"log"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Telegram struct {
	bot    *tgbotapi.BotAPI
	chatID string
}

func NewTelegram(token, chatID string) (*Telegram, error) {
	bot, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}

	log.Printf("Authorized on account %s", bot.Self.UserName)

	return &Telegram{
		bot:    bot,
		chatID: chatID,
	}, nil
}

func (t *Telegram) GetBot() *tgbotapi.BotAPI {
	return t.bot
}

func (t *Telegram) SendMessage(text string) error {
	msg := tgbotapi.NewMessageToChannel(t.chatID, text)
	msg.ParseMode = "HTML"

	_, err := t.bot.Send(msg)
	if err != nil {
		log.Printf("Failed to send message: %v", err)
		return err
	}

	return nil
}

func (t *Telegram) SendAlert(level, service, message string) error {
	emoji := "⚠️"
	switch level {
	case "critical":
		emoji = "🔴"
	case "warning":
		emoji = "🟡"
	case "info":
		emoji = "🔵"
	}

	text := fmt.Sprintf("%s <b>%s</b>\n<b>Service:</b> %s\n<b>Message:</b> %s",
		emoji, level, service, message)

	return t.SendMessage(text)
}
