FROM golang:1.24-alpine AS builder

# Явно включаем режим модулей
ENV GO111MODULE=on
ENV GOFLAGS=-mod=mod

WORKDIR /app

# Копируем весь исходный код сразу
COPY . .

# Показываем версию Go для отладки
RUN go version

# Создаем go.sum и скачиваем зависимости
RUN go mod tidy && go mod download

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
