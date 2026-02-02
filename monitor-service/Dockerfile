FROM golang:1.24-alpine AS builder

# Явно включаем режим модулей
ENV GO111MODULE=on
ENV GOFLAGS=-mod=mod

WORKDIR /app

# Копируем весь исходный код сразу
COPY . .

# Показываем версию Go и содержимое go.mod для отладки
RUN go version && echo "=== go.mod ===" && cat go.mod && echo "=== end go.mod ==="

# Создаем go.sum и скачиваем зависимости
RUN go mod tidy && go mod download

# Проверяем что go.sum создался
RUN echo "=== Files ===" && ls -la go.* && echo "=== Module info ===" && go list -m

# Проверяем структуру internal
RUN echo "=== Checking internal structure ===" && \
    ls -la internal/ && \
    ls -la internal/monitor/ && \
    ls -la internal/monitor/docker/ && \
    find internal -name "*.go" -type f

# Собираем приложение с verbose
RUN CGO_ENABLED=0 GOOS=linux go build -v -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
