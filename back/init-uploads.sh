#!/bin/bash
# Скрипт для создания папки uploads на хосте с правильными правами
# Запускать на хосте перед docker-compose up

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
UPLOADS_DIR="$SCRIPT_DIR/public/uploads/products"

# Создаем директорию если не существует
mkdir -p "$UPLOADS_DIR"

# Устанавливаем права (755 - владелец может читать/писать, остальные только читать)
chmod -R 755 "$SCRIPT_DIR/public/uploads"

echo "Директория uploads создана: $UPLOADS_DIR"
echo "Права установлены: 755"

