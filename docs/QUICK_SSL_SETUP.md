# Быстрая установка SSL - Шпаргалка

## За 5 минут до HTTPS 🚀

### 1️⃣ Проверьте DNS
```bash
nslookup sushiritto.ru
# Должен показать: 80.78.248.230
```

### 2️⃣ Откройте порты (если еще не открыты)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3️⃣ Укажите email в скрипте
```bash
nano init-letsencrypt.sh
# Замените: email="your-email@example.com"
# На: email="ваш-реальный-email@example.com"
```

### 4️⃣ Запустите установку
```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

### 5️⃣ Готово! 🎉
Откройте: https://sushiritto.ru

---

## Что изменилось в проекте

✅ **docker-compose.yml** - добавлены:
- Порт 443 для HTTPS
- Volumes для сертификатов
- Контейнер certbot для автообновления

✅ **nginx.conf** - добавлены:
- Редирект HTTP → HTTPS
- SSL-конфигурация
- Заголовки безопасности

✅ **init-letsencrypt.sh** - скрипт для получения сертификата

---

## Проблемы?

**Ошибка при получении сертификата:**
```bash
# Используйте тестовый режим
nano init-letsencrypt.sh
# Измените: staging=0 на staging=1
./init-letsencrypt.sh
```

**Нужно обновить сертификат вручную:**
```bash
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

**Проверить статус:**
```bash
docker-compose ps
docker-compose logs nginx
docker-compose logs certbot
```

---

## После установки

1. Проверьте сайт: https://sushiritto.ru
2. Проверьте качество SSL: https://www.ssllabs.com/ssltest/
3. Раскомментируйте HSTS в nginx.conf (опционально)

Сертификат обновляется автоматически каждые 12 часов! ✨
