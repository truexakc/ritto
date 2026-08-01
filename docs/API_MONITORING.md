# API Monitoring Endpoint

## Эндпоинты для мониторинга состояния backend сервиса

Доступны три эндпоинта для различных сценариев мониторинга:

| Эндпоинт | Формат | Детализация | Использование |
|----------|--------|-------------|---------------|
| `/ping` | text/plain | Минимальная | Быстрая проверка доступности |
| `/health` | JSON (simple) | Базовая | Kubernetes liveness/readiness probes |
| `/api/status` | JSON (detailed) | Полная | Внешние системы мониторинга, дашборды |

---

## 1. GET `/ping`

Самый простой эндпоинт для проверки доступности сервиса.

**URL:**
- Production: `https://sushiritto.ru/ping`
- Local: `http://localhost:5001/ping`

**Ответ (HTTP 200):**
```
pong
```

**Использование:**
```bash
curl https://sushiritto.ru/ping
# Ответ: pong
```

---

## 2. GET `/health`

Базовый health check с минимальной информацией.

**URL:**
- Production: `https://sushiritto.ru/health`
- Local: `http://localhost:5001/health`

**Ответ (HTTP 200):**
```json
{
  "status": "ok",
  "timestamp": "2026-08-01T12:34:56.789Z",
  "uptime": 3600
}
```

**Использование:**
```bash
curl https://sushiritto.ru/health
```

---

## 3. GET `/api/status`

Возвращает детальную информацию о состоянии сервиса в формате JSON.

**Доступность:** Публичный эндпоинт, доступен из внешней сети

**URL:**
- Production: `https://sushiritto.ru/api/status`
- Local: `http://localhost:5001/api/status`

---

## Формат ответа

### Успешный ответ (HTTP 200)

```json
{
  "service": "ritto-backend",
  "status": "healthy",
  "timestamp": "2026-08-01T12:34:56.789Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 5,
      "message": "Database connection OK"
    },
    "memory": {
      "status": "healthy",
      "rss": "150MB",
      "heapUsed": "80MB",
      "heapTotal": "120MB"
    },
    "cpu": {
      "status": "healthy",
      "user": "1234ms",
      "system": "567ms"
    }
  }
}
```

### Ответ при проблемах (HTTP 503)

```json
{
  "service": "ritto-backend",
  "status": "unhealthy",
  "timestamp": "2026-08-01T12:34:56.789Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Connection timeout",
      "message": "Database connection failed"
    },
    "memory": {
      "status": "healthy",
      "rss": "150MB",
      "heapUsed": "80MB",
      "heapTotal": "120MB"
    },
    "cpu": {
      "status": "healthy",
      "user": "1234ms",
      "system": "567ms"
    }
  }
}
```

---

## Поля ответа

| Поле | Тип | Описание |
|------|-----|----------|
| `service` | string | Имя сервиса |
| `status` | string | Общий статус: `healthy` или `unhealthy` |
| `timestamp` | string (ISO 8601) | Время запроса в UTC |
| `uptime` | number | Время работы сервера в секундах |
| `environment` | string | Окружение: `production`, `development`, `test` |
| `version` | string | Версия приложения из package.json |
| `checks` | object | Детальные проверки компонентов |

### Checks - Database

| Поле | Тип | Описание |
|------|-----|----------|
| `status` | string | `healthy` или `unhealthy` |
| `responseTime` | number | Время ответа БД в миллисекундах (только если healthy) |
| `message` | string | Описание статуса |
| `error` | string | Сообщение об ошибке (только если unhealthy) |

### Checks - Memory

| Поле | Тип | Описание |
|------|-----|----------|
| `status` | string | Всегда `healthy` (информационное) |
| `rss` | string | Resident Set Size - общая память процесса |
| `heapUsed` | string | Использованная heap память |
| `heapTotal` | string | Общая heap память |

### Checks - CPU

| Поле | Тип | Описание |
|------|-----|----------|
| `status` | string | Всегда `healthy` (информационное) |
| `user` | string | CPU время в user mode |
| `system` | string | CPU время в system mode |

---

## HTTP коды ответа

- **200 OK** - Сервис работает нормально, все проверки успешны
- **503 Service Unavailable** - Сервис работает, но есть проблемы (например, с БД)

---

## Использование для мониторинга

### Bash скрипт (включен в проект)

```bash
# Запуск из корня проекта
./check-status.sh ping              # Быстрая проверка
./check-status.sh health            # Базовая проверка
./check-status.sh status            # Детальная проверка (по умолчанию)

# На продакшене
./check-status.sh ping https://sushiritto.ru
./check-status.sh status https://sushiritto.ru
```

### curl

```bash
# Проверка статуса
curl https://sushiritto.ru/api/status

# Проверка только HTTP кода
curl -s -o /dev/null -w "%{http_code}" https://sushiritto.ru/api/status

# Быстрая проверка доступности
curl https://sushiritto.ru/ping

# Проверка с базовой информацией
curl https://sushiritto.ru/health
```

### Prometheus / Grafana

```yaml
scrape_configs:
  - job_name: 'ritto-backend'
    scrape_interval: 30s
    metrics_path: '/api/status'
    static_configs:
      - targets: ['sushiritto.ru:443']
    scheme: https
```

### Uptime Kuma / Better Uptime

- **Type:** HTTP(s) - JSON Query
- **URL:** `https://sushiritto.ru/api/status`
- **Expected Status:** 200
- **JSON Path:** `$.status`
- **Expected Value:** `healthy`

### Простой скрипт мониторинга

```bash
#!/bin/bash
STATUS=$(curl -s https://sushiritto.ru/api/status | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
    echo "⚠️ Backend is $STATUS"
    # Отправить алерт
else
    echo "✅ Backend is healthy"
fi
```

---

## Сравнение эндпоинтов

| Критерий | /ping | /health | /api/status |
|----------|-------|---------|-------------|
| **Формат** | text/plain | JSON | JSON |
| **Размер ответа** | ~4 bytes | ~100 bytes | ~500 bytes |
| **Скорость** | <1ms | <5ms | 5-50ms |
| **Проверка БД** | ❌ | ❌ | ✅ |
| **Метрики памяти** | ❌ | ❌ | ✅ |
| **Метрики CPU** | ❌ | ❌ | ✅ |
| **Uptime** | ❌ | ✅ | ✅ |
| **Версия** | ❌ | ❌ | ✅ |

### Когда использовать каждый эндпоинт:

**`/ping`** - Используйте когда:
- Нужна максимальная скорость проверки
- Мониторинг простой доступности сети
- Высокая частота проверок (каждые несколько секунд)
- Минимальная нагрузка на сервер

**`/health`** - Используйте когда:
- Kubernetes liveness/readiness probes
- Docker health checks
- Нужна базовая информация в JSON формате
- Средняя частота проверок (каждые 10-30 секунд)

**`/api/status`** - Используйте когда:
- Нужна детальная диагностика
- Мониторинг состояния всех компонентов
- Отображение на дашбордах
- Низкая частота проверок (каждые 1-5 минут)
- Требуется информация о проблемах

---

## Разница между /health и /api/status

| Эндпоинт | Назначение | Детализация | Использование |
|----------|-----------|-------------|---------------|
| `/health` | Простая проверка доступности | Минимальная | Kubernetes liveness/readiness probes |
| `/api/status` | Детальный мониторинг | Полная | Внешние системы мониторинга, дашборды |

---

## Примечания

- Эндпоинт не требует авторизации
- Доступен через HTTPS с Let's Encrypt сертификатом
- Проверяет реальное подключение к PostgreSQL
- Не блокирует основной функционал при недоступности компонентов
- Быстрый ответ (обычно < 100ms)

