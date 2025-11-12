# Исправление ошибки SSL

## Проблема
1. DNS-запись для `www.sushiritto.ru` не существует ✅ Исправлено
2. Nginx не может запуститься без сертификата ✅ Исправлено
3. Connection refused при получении сертификата ⚠️ Новая проблема

## Решение

### Вариант 1: Standalone режим (РЕКОМЕНДУЕТСЯ)

Самый простой и надежный способ:

```bash
git pull
chmod +x init-letsencrypt-standalone.sh
./init-letsencrypt-standalone.sh
```

Этот скрипт:
- Временно останавливает nginx
- Получает сертификат напрямую (certbot слушает порт 80)
- Запускает nginx обратно с SSL

### Вариант 2: Webroot режим (если нужна отладка)

Сначала протестируйте webroot:

```bash
git pull
chmod +x test-certbot-webroot.sh
./test-certbot-webroot.sh
```

Если тест пройден, используйте:
```bash
./init-letsencrypt.sh
```

### Вариант 2: С www (если нужен)

1. Добавьте DNS A-запись для `www.sushiritto.ru` → `83.166.246.163`

2. Проверьте DNS:
```bash
nslookup www.sushiritto.ru
```

3. Измените в `init-letsencrypt.sh`:
```bash
domains=(sushiritto.ru www.sushiritto.ru)
```

4. Запустите:
```bash
./init-letsencrypt.sh
```

## Что изменилось

✅ **nginx.conf** - исправлен синтаксис `http2`
✅ **nginx-http-only.conf** - временная конфигурация без SSL
✅ **init-letsencrypt.sh** - улучшенная логика:
  - Сначала HTTP-режим
  - Получение сертификата
  - Переключение на HTTPS
  - Проверка ошибок

## Диагностика проблем

### Connection refused

Это означает, что nginx не может отдать файлы для проверки домена.

**Решение:**
```bash
# Используйте standalone режим
./init-letsencrypt-standalone.sh
```

### Если все еще ошибка

```bash
# Остановите все контейнеры
docker-compose down

# Очистите старые сертификаты
rm -rf ./certbot/conf/live
rm -rf ./certbot/conf/archive
rm -rf ./certbot/conf/renewal

# Проверьте, что порт 80 свободен
sudo netstat -tlnp | grep :80

# Запустите standalone режим
./init-letsencrypt-standalone.sh
```

### Проверка после установки

```bash
# Проверьте сертификат
docker-compose run --rm certbot certificates

# Проверьте nginx
docker-compose exec nginx nginx -t

# Проверьте логи
docker-compose logs nginx
docker-compose logs certbot
```

## Проверка DNS

```bash
# Должен показать ваш IP
nslookup sushiritto.ru

# Если нужен www, должен показать тот же IP
nslookup www.sushiritto.ru
```
