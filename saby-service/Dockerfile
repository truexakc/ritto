# Builder stage
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all source code
COPY . .

# Create go.sum and download dependencies
RUN go mod tidy && go mod download

# Build binary with static linking and explicit module mode
RUN GO111MODULE=on CGO_ENABLED=0 GOOS=linux go build -o saby-service ./cmd/app

# Runtime stage
FROM alpine:latest

# Install ca-certificates and tzdata
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user appuser with UID 1000
RUN adduser -D -u 1000 appuser

# Set working directory
WORKDIR /home/appuser

# Copy binary from builder stage
COPY --from=builder /app/saby-service .

# Change ownership to appuser
RUN chown appuser:appuser saby-service

# Switch to appuser
USER appuser

# Expose port 8080
EXPOSE 8080

# Set CMD to run binary
CMD ["./saby-service"]
