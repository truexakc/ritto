FROM golang:1.23-alpine AS builder

WORKDIR /app

# Копируем весь исходный код сразу
COPY . .

# Создаем go.sum и скачиваем зависимости
RUN go mod tidy && go mod download

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
