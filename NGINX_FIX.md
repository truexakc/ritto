# Исправление проблемы 404 для API запросов

## Проблема
Запросы к API через nginx возвращают 404, хотя прямой доступ к backend работает.

## Решение

### 1. Убедитесь, что конфигурация nginx обновлена

Проверьте, что файл `nginx.conf` содержит правильную конфигурацию:
```nginx
location /api {
    proxy_pass http://backend;
    ...
}
```

### 2. Перезагрузите nginx контейнер

```bash
# Проверка конфигурации
docker-compose exec nginx nginx -t

# Перезагрузка nginx
docker-compose restart nginx

# Или перезагрузка конфигурации без остановки
docker-compose exec nginx nginx -s reload
```

### 3. Проверьте, что volume правильно маппится

Убедитесь, что в `docker-compose.yml`:
```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
```

### 4. Проверьте логи

```bash
# Логи nginx
docker-compose logs nginx

# Логи backend
docker-compose logs backend

# Тест запроса из nginx контейнера
docker-compose exec nginx wget -O- http://backend:5001/api/products/category
```

### 5. Проверьте сеть

```bash
# Ping backend из nginx
docker-compose exec nginx ping -c 3 backend

# Проверка доступности порта
docker-compose exec nginx nc -zv backend 5001
```

### 6. Если проблема сохраняется

Попробуйте полностью пересоздать nginx контейнер:
```bash
docker-compose stop nginx
docker-compose rm -f nginx
docker-compose up -d nginx
```

### 7. Альтернативное решение (если ничего не помогает)

Если проблема все еще есть, попробуйте использовать более явную конфигурацию:

```nginx
location ~ ^/api/(.*)$ {
    proxy_pass http://backend/api/$1;
    ...
}
```

Но это должно работать и с текущей конфигурацией, так как `proxy_pass http://backend;` без URI передает весь путь как есть.

