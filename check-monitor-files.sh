#!/bin/bash

echo "=== Проверка структуры monitor-service на сервере ==="
echo ""

cd monitor-service

echo "1. Структура internal:"
ls -la internal/

echo ""
echo "2. Содержимое internal/monitor (если есть):"
ls -la internal/monitor/ 2>/dev/null || echo "❌ internal/monitor/ НЕ СУЩЕСТВУЕТ!"

echo ""
echo "3. Все Go файлы в internal:"
find internal -name "*.go" -type f

echo ""
echo "4. Содержимое .dockerignore:"
cat .dockerignore

echo ""
echo "5. Проверка git status (возможно файлы не закоммичены):"
git status internal/ 2>/dev/null || echo "Не git репозиторий"
