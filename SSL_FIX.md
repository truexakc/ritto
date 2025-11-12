# Исправление ошибки SSL

## Проблема
1. DNS-запись для `www.sushiritto.ru` не существует
2. Nginx не может запуститься без сертификата

## Решение

### Вариант 1: Без www (быстрое решение)

Обновленный скрипт теперь:
- Работает только с `sushiritto.ru` (без www)
- Сначала запускает nginx в HTTP-режиме
- Получает сертификат
- Переключается на HTTPS

**Запустите:**
```bash
git pull
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

## Если все еще ошибка

```bash
# Остановите все контейнеры
docker-compose down

# Очистите старые сертификаты
rm -rf ./certbot/conf/live
rm -rf ./certbot/conf/archive
rm -rf ./certbot/conf/renewal

# Запустите снова
./init-letsencrypt.sh
```

## Проверка DNS

```bash
# Должен показать ваш IP
nslookup sushiritto.ru

# Если нужен www, должен показать тот же IP
nslookup www.sushiritto.ru
```
