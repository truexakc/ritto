FROM golang:1.23-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum (если есть)
COPY go.mod ./
COPY go.su[m] ./

# Скачиваем зависимости и создаем go.sum
RUN go mod download && go mod tidy

# Копируем весь исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
