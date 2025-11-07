# Отладка проблемы 404 для API запросов

## Проблема
Запросы из браузера на `http://83.166.246.163/api/products/category` возвращают 404.

## Шаги для отладки

### 1. Проверьте, что nginx конфигурация обновлена

```bash
# Проверка синтаксиса
docker-compose exec nginx nginx -t

# Проверка содержимого конфигурации
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 10 "location.*api"
```

### 2. Перезагрузите nginx

```bash
# Полная перезагрузка
docker-compose restart nginx

# Или перезагрузка конфигурации
docker-compose exec nginx nginx -s reload
```

### 3. Проверьте логи nginx

```bash
# Логи доступа
docker-compose logs nginx | grep "/api"

# Последние 50 строк
docker-compose logs --tail=50 nginx

# В реальном времени
docker-compose logs -f nginx
```

### 4. Проверьте, что запрос доходит до nginx

Сделайте запрос и сразу проверьте логи:
```bash
curl -v http://83.166.246.163/api/products/category
docker-compose logs --tail=10 nginx
```

### 5. Проверьте, что nginx видит backend

```bash
# Ping
docker-compose exec nginx ping -c 3 backend

# Проверка порта
docker-compose exec nginx nc -zv backend 5001

# Прямой запрос из nginx контейнера
docker-compose exec nginx wget -O- http://backend:5001/api/products/category
```

### 6. Проверьте заголовки ответа

В браузере откройте DevTools → Network → выберите запрос → Headers
Должны быть заголовки:
- `X-Debug-Backend: backend:5001`
- `X-Debug-Request-Uri: /api/products/category`

### 7. Проверьте, что volume правильно маппится

```bash
# Проверка на хосте
cat nginx.conf | grep -A 5 "location.*api"

# Проверка в контейнере
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 5 "location.*api"
```

Они должны совпадать!

### 8. Если ничего не помогает - полная пересборка

```bash
docker-compose down
docker-compose build --no-cache nginx
docker-compose up -d
```

### 9. Альтернативное решение - проверка через curl

```bash
# С хоста
curl -v http://localhost/api/products/category

# Из nginx контейнера
docker-compose exec nginx wget -O- http://localhost/api/products/category
```

### 10. Проверка backend напрямую

```bash
# Из nginx контейнера
docker-compose exec nginx wget -O- http://backend:5001/api/products/category

# Должно вернуть данные
```

