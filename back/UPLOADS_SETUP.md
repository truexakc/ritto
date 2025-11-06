# Настройка папки для загрузок изображений

## Проблема
При импорте товаров возникает ошибка: `EACCES: permission denied, mkdir '/app/public/uploads/products'`

## Решение 1: Использование Named Volume (рекомендуется)

В `docker-compose.yml` уже настроен named volume `uploads_data`, который автоматически решает проблемы с правами доступа.

**Преимущества:**
- Автоматическое управление правами Docker
- Не зависит от прав на хосте
- Работает "из коробки"

**Недостатки:**
- Файлы хранятся в Docker volume, не видны напрямую на хосте
- Для доступа к файлам нужно использовать `docker cp` или Portainer

## Решение 2: Использование Bind Mount (если нужен доступ к файлам на хосте)

Если нужно видеть загруженные файлы на хосте, используйте bind mount:

1. **Создайте папку на хосте:**
```bash
mkdir -p ./back/public/uploads/products
chmod -R 755 ./back/public/uploads
```

2. **Или используйте скрипт:**
```bash
chmod +x ./back/init-uploads.sh
./back/init-uploads.sh
```

3. **Измените docker-compose.yml:**
```yaml
volumes:
  - ./back/public/uploads:/app/public/uploads
```

**Важно:** Убедитесь, что UID пользователя на хосте совпадает с UID пользователя в контейнере (1001).

## Проверка прав

После настройки проверьте права:
```bash
# В контейнере
docker exec -it ritto-backend ls -la /app/public/uploads

# На хосте (если используете bind mount)
ls -la ./back/public/uploads
```

## Пересборка контейнера

После изменений пересоберите контейнер:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

