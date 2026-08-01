# 📜 Scripts Directory

Все утилитарные скрипты для управления проектом Ritto собраны в этой папке.

---

## 📊 Мониторинг и проверки

### `check-status.sh`
Проверка состояния backend сервиса через эндпоинты мониторинга.

**Использование:**
```bash
# Детальная проверка статуса (по умолчанию)
./scripts/check-status.sh

# Быстрая проверка доступности
./scripts/check-status.sh ping

# Базовая проверка здоровья
./scripts/check-status.sh health

# Проверка на продакшене
./scripts/check-status.sh status https://sushiritto.ru
./scripts/check-status.sh ping https://sushiritto.ru
```

**Режимы:**
- `ping` - Минимальная проверка (< 1ms)
- `health` - Базовая информация (uptime, status)
- `status` - Детальная проверка (БД, память, CPU)

---

### `check-resources.sh`
Проверка использования ресурсов сервера (RAM, CPU, Disk, Docker контейнеры).

**Использование:**
```bash
./scripts/check-resources.sh
```

**Показывает:**
- 💾 Использование памяти (RAM)
- 💱 SWAP статус
- 💿 Использование диска
- 🐳 Docker контейнеры и их ресурсы
- ⚙️ CPU load average
- 📋 Рекомендации (можно ли установить Uptime Kuma)

---

## 🚀 Деплой и обновления

### `safe-deploy.sh`
Безопасный полный деплой с пошаговыми проверками.

**Использование:**
```bash
./scripts/safe-deploy.sh
```

**Что делает:**
- Проверяет наличие изменений в git
- Останавливает контейнеры по одному
- Пересобирает образы
- Запускает контейнеры
- Проверяет их здоровье
- Создает backup перед началом

**⚠️ Внимание:** Не используйте `docker compose up -d --build` на продакшене! Это может перегрузить сервер.

---

### `quick-update.sh`
Быстрое обновление одного или всех сервисов.

**Использование:**
```bash
# Обновить backend
./scripts/quick-update.sh backend

# Обновить frontend
./scripts/quick-update.sh frontend

# Обновить все сервисы
./scripts/quick-update.sh all
```

**Доступные сервисы:**
- `backend` - Node.js API
- `frontend` - React приложение
- `saby-service` - Go микросервис
- `all` - Все сервисы по очереди

---

### `rollback.sh`
Откат последнего деплоя.

**Использование:**
```bash
./scripts/rollback.sh
```

**Что делает:**
- Останавливает текущие контейнеры
- Возвращается к предыдущей версии образов
- Запускает старые образы

---

### `rebuild-go-services.sh`
Пересборка Go сервисов (saby-service).

**Использование:**
```bash
./scripts/rebuild-go-services.sh
```

**Когда использовать:**
- После изменений в Go коде
- При проблемах с модулями Go
- После обновления зависимостей

---

### `build-frontend-only.sh` ⭐
Безопасная сборка ТОЛЬКО frontend с защитой от перегрузки сервера.

**Использование:**
```bash
./scripts/build-frontend-only.sh
```

**Что делает:**
- Проверяет доступную память (требуется минимум 400 MB)
- Останавливает frontend и тяжелые сервисы (portainer, adminer)
- Очищает кэш Docker
- Собирает с ограничениями: `nice -n 19`, `--memory=700m`
- Использует `NODE_OPTIONS=--max-old-space-size=512`
- Автоматически восстанавливает остановленные сервисы

**Когда использовать:**
- На серверах с 1GB RAM
- Когда `npm run build` убивает сервер (OOM)
- После изменений только в frontend коде
- Вместо полного `safe-deploy.sh` для экономии времени

**Время сборки:** 5-15 минут (зависит от ресурсов)

---

## 🔐 SSL сертификаты (Let's Encrypt)

### `init-letsencrypt.sh`
Первоначальная установка SSL сертификатов через Let's Encrypt с nginx.

**Использование:**
```bash
./scripts/init-letsencrypt.sh
```

**Когда использовать:**
- Первая установка SSL
- Когда nginx уже запущен

---

### `init-letsencrypt-standalone.sh`
Установка SSL сертификатов через Let's Encrypt в standalone режиме (без nginx).

**Использование:**
```bash
./scripts/init-letsencrypt-standalone.sh
```

**Когда использовать:**
- Nginx еще не запущен
- Проблемы с первым вариантом

---

### `renew-cert.sh`
Ручное обновление SSL сертификатов.

**Использование:**
```bash
./scripts/renew-cert.sh
```

**Примечание:** Certbot автоматически обновляет сертификаты каждые 12 часов через docker-compose.

---

### `force-renew-cert.sh`
Принудительное обновление SSL сертификатов (даже если срок не истек).

**Использование:**
```bash
./scripts/force-renew-cert.sh
```

**Когда использовать:**
- Тестирование процесса обновления
- Проблемы с текущим сертификатом

---

## 🔧 Обслуживание

### `update-backend-deps.sh`
Обновление зависимостей backend (npm packages).

**Использование:**
```bash
./scripts/update-backend-deps.sh
```

**Что делает:**
- Обновляет `package.json`
- Запускает `npm update`
- Проверяет уязвимости через `npm audit`

---

### `fix-go-modules.sh`
Исправление проблем с Go модулями.

**Использование:**
```bash
./scripts/fix-go-modules.sh
```

**Когда использовать:**
- Ошибки "package not in std"
- Проблемы с go.mod/go.sum
- После изменения зависимостей Go

---

## 📋 Быстрая справка

### Частые задачи

```bash
# Проверить статус сервиса
./scripts/check-status.sh ping https://sushiritto.ru

# Проверить ресурсы сервера
./scripts/check-resources.sh

# Обновить backend после изменений
./scripts/quick-update.sh backend

# Полный безопасный деплой
./scripts/safe-deploy.sh

# Откат в случае проблем
./scripts/rollback.sh

# Обновить SSL сертификат
./scripts/renew-cert.sh
```

---

## 🔗 Связанная документация

- [Quick Start Guide](../docs/guides/QUICK_START.md)
- [Deployment Guide](../docs/setup/DEPLOY.md)
- [API Monitoring](../docs/API_MONITORING.md)
- [Monitoring Options](../docs/MONITORING_OPTIONS.md)

---

## ⚠️ Важные заметки

### Безопасность
- Все скрипты должны быть исполняемыми: `chmod +x scripts/*.sh`
- Проверяйте скрипты перед запуском: `cat scripts/script-name.sh`
- Храните резервные копии перед деплоем

### Продакшн
- **НЕ используйте** `docker compose up -d --build` на продакшене
- Всегда используйте `safe-deploy.sh` или `quick-update.sh`
- Проверяйте логи после деплоя: `docker compose logs -f`

### Логирование
Большинство скриптов выводят цветной вывод:
- 🟢 Зеленый - успешно
- 🟡 Желтый - предупреждение
- 🔴 Красный - ошибка

---

## 🆘 Troubleshooting

### Скрипт не запускается
```bash
# Проверьте права
ls -la scripts/script-name.sh

# Сделайте исполняемым
chmod +x scripts/script-name.sh
```

### Permission denied
```bash
# Возможно нужны sudo права (не рекомендуется для продакшена)
sudo ./scripts/script-name.sh

# Или добавьте пользователя в группу docker
sudo usermod -aG docker $USER
```

### Скрипт не найден
```bash
# Запускайте из корня проекта
cd /path/to/ritto
./scripts/script-name.sh

# Или используйте полный путь
/path/to/ritto/scripts/script-name.sh
```

---

## 📚 Создание своих скриптов

При создании новых скриптов:

1. Сохраняйте в папку `scripts/`
2. Добавьте shebang: `#!/bin/bash`
3. Сделайте исполняемым: `chmod +x`
4. Добавьте описание в этот README
5. Используйте цветной вывод для удобства
6. Добавьте проверки ошибок

**Шаблон:**
```bash
#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}✅ Успешно${NC}"
echo -e "${YELLOW}⚠️ Предупреждение${NC}"
echo -e "${RED}❌ Ошибка${NC}"

# Проверка ошибок
set -e  # Остановка при ошибке

# Ваш код здесь
```

