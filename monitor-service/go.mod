module monitor-service

// Go 1.23 required for Docker SDK v27+
// Local development may use Go 1.22, but Docker build uses Go 1.23
go 1.23

require (
	github.com/docker/docker v27.4.1+incompatible
	github.com/go-telegram-bot-api/telegram-bot-api/v5 v5.5.1
)
