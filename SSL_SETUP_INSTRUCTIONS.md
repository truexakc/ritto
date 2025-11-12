# Инструкция по установке SSL-сертификата Let's Encrypt

## Подготовка

### 1. Убедитесь, что домен настроен
Ваш домен `sushiritto.ru` и `www.sushiritto.ru` должны указывать на IP-адрес сервера (83.166.246.163).

Проверьте DNS-записи:
```bash
nslookup sushiritto.ru
nslookup www.sushiritto.ru
```

### 2. Откройте порты на сервере
Убедитесь, что порты 80 и 443 открыты в файрволе:
```bash
# Для Ubuntu/Debian с ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Для CentOS/RHEL с firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Установка SSL-сертификата

### Шаг 1: Настройте email в скрипте
Откройте файл `init-letsencrypt.sh` и замените:
```bash
email="your-email@example.com"
```
на ваш реальный email, например:
```bash
email="admin@sushiritto.ru"
```

### Шаг 2: Сделайте скрипт исполняемым
```bash
chmod +x init-letsencrypt.sh
```

### Шаг 3: Запустите скрипт
```bash
./init-letsencrypt.sh
```

Скрипт автоматически:
1. Создаст необходимые директории
2. Загрузит рекомендуемые параметры TLS
3. Создаст временный самоподписанный сертификат
4. Запустит nginx
5. Получит настоящий сертификат Let's Encrypt
6. Перезагрузит nginx

### Шаг 4: Проверьте работу
Откройте в браузере:
- https://sushiritto.ru
- https://www.sushiritto.ru

Проверьте, что:
- ✅ Сайт открывается по HTTPS
- ✅ HTTP автоматически редиректит на HTTPS
- ✅ Браузер показывает зеленый замок (сертификат валидный)

## Тестирование (опционально)

Если хотите сначала протестировать на staging-сертификате (чтобы не исчерпать лимиты Let's Encrypt):

1. Откройте `init-letsencrypt.sh`
2. Измените `staging=0` на `staging=1`
3. Запустите скрипт
4. После проверки верните `staging=0` и запустите снова

## Автоматическое обновление

Сертификат будет автоматически обновляться благодаря контейнеру `certbot`, который проверяет обновления каждые 12 часов.

Проверить статус:
```bash
docker-compose logs certbot
```

## Ручное обновление (если нужно)

```bash
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

## Включение HSTS (после проверки)

После того как убедитесь, что SSL работает корректно:

1. Откройте `nginx.conf`
2. Найдите строку с HSTS (в блоке `server` для порта 443)
3. Раскомментируйте её:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```
4. Перезагрузите nginx:
```bash
docker-compose exec nginx nginx -s reload
```

## Проверка SSL-сертификата

Проверьте качество настройки SSL:
- https://www.ssllabs.com/ssltest/analyze.html?d=sushiritto.ru

## Структура файлов

После установки у вас появятся:
```
.
├── certbot/
│   ├── conf/              # Сертификаты и конфигурация
│   │   ├── live/
│   │   │   └── sushiritto.ru/
│   │   │       ├── fullchain.pem
│   │   │       └── privkey.pem
│   │   ├── archive/
│   │   └── renewal/
│   └── www/               # Для ACME challenge
├── nginx.conf             # Обновленная конфигурация с SSL
├── docker-compose.yml     # Обновленный с certbot
└── init-letsencrypt.sh    # Скрипт установки
```

## Устранение проблем

### Ошибка: "Connection refused"
- Проверьте, что порты 80 и 443 открыты
- Проверьте, что nginx запущен: `docker-compose ps`

### Ошибка: "Domain not found"
- Проверьте DNS-записи домена
- Подождите распространения DNS (до 24 часов)

### Ошибка: "Rate limit exceeded"
- Используйте staging режим для тестирования
- Подождите неделю перед повторной попыткой

### Сертификат не обновляется автоматически
```bash
# Проверьте логи certbot
docker-compose logs certbot

# Попробуйте обновить вручную
docker-compose run --rm certbot renew --dry-run
```

## Полезные команды

```bash
# Просмотр логов nginx
docker-compose logs nginx

# Просмотр логов certbot
docker-compose logs certbot

# Перезапуск nginx
docker-compose restart nginx

# Проверка конфигурации nginx
docker-compose exec nginx nginx -t

# Перезагрузка конфигурации nginx без перезапуска
docker-compose exec nginx nginx -s reload

# Просмотр информации о сертификате
docker-compose run --rm certbot certificates
```

## Лимиты Let's Encrypt

- 50 сертификатов на домен в неделю
- 5 дубликатов сертификата в неделю
- Используйте staging для тестирования!

## Дополнительная информация

- Документация Let's Encrypt: https://letsencrypt.org/docs/
- Документация Certbot: https://certbot.eff.org/
- Инструкция Reg.ru: https://help.reg.ru/support/ssl-sertifikaty/3-etap-ustanovka-ssl-sertifikata/kak-nastroit-ssl-sertifikat-na-nginx
