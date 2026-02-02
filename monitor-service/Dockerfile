FROM golang:1.23-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum (если есть)
COPY go.mod ./
COPY go.su[m] ./

# Скачиваем зависимости (создаст go.sum если его нет)
RUN go mod download

# Копируем весь исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o monitor ./cmd/app

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/monitor .

CMD ["./monitor"]
