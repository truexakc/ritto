FROM golang:1.24-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./

# Скачиваем зависимости
RUN go mod download
RUN go mod verify

# Копируем весь исходный код
COPY . .

# Проверяем и синхронизируем зависимости
RUN go mod tidy

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
