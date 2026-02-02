module monitor-service

// Go 1.23 required for Docker SDK v27+
// Local development may use Go 1.22, but Docker build uses Go 1.23
go 1.23

require (
	github.com/docker/docker v27.4.1+incompatible
	github.com/go-telegram-bot-api/telegram-bot-api/v5 v5.5.1
)

require (
	github.com/Microsoft/go-winio v0.6.1 // indirect
	github.com/distribution/reference v0.6.0 // indirect
	github.com/docker/go-connections v0.5.0 // indirect
	github.com/docker/go-units v0.5.0 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/moby/docker-image-spec v1.3.1 // indirect
	github.com/moby/term v0.5.0 // indirect
	github.com/morikuni/aec v1.0.0 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.0.2 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/net v0.25.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	golang.org/x/time v0.5.0 // indirect
	golang.org/x/tools v0.21.0 // indirect
	gotest.tools/v3 v3.5.1 // indirect
)
