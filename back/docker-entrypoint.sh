#!/bin/sh
set -e

# Создаем директорию для загрузок если не существует
# (работает даже если volume маппится, так как mkdir -p безопасен)
mkdir -p /app/public/uploads/products

# Запускаем приложение
exec "$@"

