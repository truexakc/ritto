# Варианты мониторинга для VPS (1 vCPU / 1GB RAM / 10GB Disk)

## 📊 Текущая ситуация

**Ваш сервер:**
- vCPU: 1 ядро
- RAM: 1 ГБ
- Disk: 10 ГБ

**Текущие сервисы:**
- PostgreSQL
- Backend (Node.js)
- Frontend (Nginx)
- Saby-service (Go)
- Nginx
- Certbot
- Adminer
- Portainer

---

## ✅ Вариант 1: Uptime Kuma (МОЖНО, но с оговорками)

### Требования Uptime Kuma
- **Минимум:** 256-512 MB RAM
- **Рекомендуется:** 512 MB - 1 GB RAM
- **Диск:** ~200-500 MB (SQLite база)
- **CPU:** Минимальная нагрузка

**Источник:** [SSD Nodes](https://www.ssdnodes.com/learn/uptime-kuma-status-monitoring) и [Railway](https://railway.com/deploy/uptime-kuma-monitoring) указывают, что 512 MB RAM комфортно справляется с 50-100 мониторами при интервале 60 секунд.

### ⚠️ Проблема: У вас уже работает много сервисов

Давайте проверим текущее потребление памяти:

```bash
# Проверка использования памяти
docker stats --no-stream

# Свободная память на сервере
free -h
```

### Оценка памяти (примерная):
```
PostgreSQL:     ~100-150 MB
Backend:        ~100-150 MB
Frontend:       ~50-100 MB
Saby-service:   ~50-100 MB
Nginx:          ~10-20 MB
Portainer:      ~100-150 MB
Adminer:        ~30-50 MB
─────────────────────────────
Итого:          ~440-720 MB
Свободно:       ~280-560 MB
```

**Вердикт:** Uptime Kuma займет еще **~200-300 MB**, что оставит вам всего ~0-260 MB свободной памяти.

### ⚠️ РИСКИ:
1. **OOM Killer** может начать убивать процессы при пиковых нагрузках
2. **Swap** будет активно использоваться → медленная работа
3. При импорте товаров в Saby могут быть проблемы
4. Portainer уже занимает много памяти

---

## ✅ Вариант 2: Внешние облачные сервисы (РЕКОМЕНДУЮ)

### 2.1. UptimeRobot (FREE план)
**Бесплатно:**
- ✅ 50 мониторов
- ✅ 5-минутный интервал проверки
- ✅ Email/SMS/Slack/Webhook алерты
- ✅ Public status page
- ✅ Не нагружает ваш сервер

**URL:** https://uptimerobot.com

**Плюсы:**
- Никакой нагрузки на ваш VPS
- Проверка идет из разных локаций
- Стабильный сервис с SLA
- Email алерты бесплатно

**Минусы:**
- Интервал 5 минут (не 60 секунд)
- Нет детального контроля
- Данные хранятся у них

---

### 2.2. Better Uptime (FREE план)
**Бесплатно:**
- ✅ 10 мониторов
- ✅ 3-минутный интервал
- ✅ Unlimited team members
- ✅ Phone call alerts
- ✅ Status page

**URL:** https://betteruptime.com

**Плюсы:**
- Telephone call alerts (!)
- Красивый интерфейс
- Incident management

**Минусы:**
- Только 10 мониторов бесплатно

---

### 2.3. Pingdom (FREE plan)
**Бесплатно:**
- ✅ 1 монитор (ограничение)
- ✅ 1-минутный интервал

**URL:** https://www.pingdom.com

**Плюсы:**
- Очень быстрые проверки
- От компании SolarWinds

**Минусы:**
- Только 1 монитор бесплатно

---

### 2.4. Freshping by Freshworks (FREE план)
**Бесплатно:**
- ✅ 50 checks
- ✅ 1-минутный интервал
- ✅ Unlimited users
- ✅ Global checks from 10 locations
- ✅ Status pages

**URL:** https://www.freshworks.com/website-monitoring/

**Плюсы:**
- Очень щедрый бесплатный план
- Проверки из 10 локаций
- Красивые status pages

---

### 2.5. StatusCake (FREE план)
**Бесплатно:**
- ✅ 10 uptime monitors
- ✅ 5-минутный интервал
- ✅ Unlimited contacts

**URL:** https://www.statuscake.com

---

## ✅ Вариант 3: Минимальный локальный скрипт (ЛЕГКОВЕСНО)

Простой bash скрипт с cron, который проверяет эндпоинты и отправляет алерты.

### Файл: `/root/monitor.sh`

```bash
#!/bin/bash

# Список сервисов для мониторинга
SERVICES=(
  "https://sushiritto.ru/ping|Backend"
  "https://sushiritto.ru|Frontend"
  "http://localhost:8080/health|Saby"
)

# Telegram для алертов (опционально, можно использовать email)
TELEGRAM_BOT_TOKEN="YOUR_TOKEN"
TELEGRAM_CHAT_ID="YOUR_CHAT_ID"

send_alert() {
  local message="$1"
  # Отправка в Telegram (или можно использовать email)
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="⚠️ ALERT: ${message}"
}

for service in "${SERVICES[@]}"; do
  URL=$(echo $service | cut -d'|' -f1)
  NAME=$(echo $service | cut -d'|' -f2)
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL")
  
  if [ "$HTTP_CODE" != "200" ]; then
    send_alert "${NAME} is DOWN (HTTP ${HTTP_CODE})"
    logger "Monitor: ${NAME} is DOWN (HTTP ${HTTP_CODE})"
  fi
done
```

### Добавить в crontab:
```bash
# Проверка каждые 5 минут
*/5 * * * * /root/monitor.sh
```

**Потребление ресурсов:**
- RAM: < 1 MB
- CPU: < 0.1%
- Disk: < 1 MB

---

## ✅ Вариант 4: Оптимизация текущих сервисов + Uptime Kuma

### Шаг 1: Удалить Portainer (экономим ~150 MB)

Portainer удобен, но занимает много памяти. Вместо него можно использовать:
```bash
# Прямые команды Docker
docker ps
docker stats
docker logs -f <container>
```

### Шаг 2: Удалить Adminer (экономим ~50 MB)

Вместо Adminer можно использовать:
```bash
# Подключение напрямую через psql
docker exec -it ritto-postgres psql -U postgres -d ritto_db
```

### Шаг 3: После освобождения памяти установить Uptime Kuma

```yaml
# Добавить в docker-compose.yml
uptime-kuma:
  image: louislam/uptime-kuma:1
  container_name: ritto-uptime-kuma
  ports:
    - "3001:3001"
  volumes:
    - uptime-kuma:/app/data
  networks:
    - ritto-network
  restart: unless-stopped
  security_opt:
    - no-new-privileges:true
```

---

## 📊 Сравнительная таблица

| Вариант | RAM | Стоимость | Удобство | Риски | Рекомендация |
|---------|-----|-----------|----------|-------|--------------|
| **Uptime Kuma (как есть)** | +300 MB | $0 | ⭐⭐⭐⭐⭐ | ⚠️⚠️⚠️ HIGH | ❌ НЕ рекомендую |
| **UptimeRobot** | 0 MB | $0 | ⭐⭐⭐⭐ | ✅ LOW | ✅ **ЛУЧШИЙ выбор** |
| **Better Uptime** | 0 MB | $0 | ⭐⭐⭐⭐⭐ | ✅ LOW | ✅ Отлично |
| **Freshping** | 0 MB | $0 | ⭐⭐⭐⭐ | ✅ LOW | ✅ Хороший |
| **Bash скрипт** | <1 MB | $0 | ⭐⭐ | ✅ LOW | ✅ Минимализм |
| **Uptime Kuma (без Portainer/Adminer)** | +300 MB | $0 | ⭐⭐⭐⭐⭐ | ⚠️ MEDIUM | ⚙️ Возможно |

---

## 🎯 МОЯ РЕКОМЕНДАЦИЯ

### Для вашей конфигурации (1GB RAM):

**Вариант A (Рекомендую):**
1. Используйте **UptimeRobot** или **Freshping** для внешнего мониторинга
2. Оставьте текущие эндпоинты `/ping`, `/health`, `/api/status` для интеграции
3. Никакой нагрузки на VPS
4. Бесплатно и надежно

**Вариант B (Если очень хочется self-hosted):**
1. Удалите Portainer и Adminer (освободите ~200 MB)
2. Установите Uptime Kuma
3. Мониторьте потребление памяти: `docker stats`
4. Настройте swap на случай проблем

**Вариант C (Минимализм):**
1. Используйте простой bash скрипт с cron
2. Алерты через email или Telegram
3. Минимальное потребление ресурсов

---

## 📝 Проверка текущего состояния

Выполните на сервере:

```bash
# Общая память
free -h

# Использование памяти контейнерами
docker stats --no-stream

# Использование диска
df -h

# Swap
swapon --show
```

После этого примите решение на основе реальных цифр.

---

## 🔗 Полезные ссылки

- [Uptime Kuma Demo](https://demo.uptime.kuma.pet/) - попробуйте интерфейс
- [UptimeRobot](https://uptimerobot.com)
- [Better Uptime](https://betteruptime.com)
- [Freshping](https://www.freshworks.com/website-monitoring/)

