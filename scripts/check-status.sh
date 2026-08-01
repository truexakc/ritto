#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Режим проверки (можно передать как первый аргумент: ping, health, status)
MODE="${1:-status}"
# URL для проверки (можно передать как второй аргумент)
BASE_URL="${2:-http://localhost:5001}"

echo "🔍 Проверка статуса backend сервиса..."
echo "📍 Базовый URL: $BASE_URL"
echo "🎯 Режим: $MODE"
echo ""

case $MODE in
    "ping")
        URL="$BASE_URL/ping"
        echo "📡 Быстрая проверка доступности..."
        RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" -eq 200 ] && [ "$BODY" == "pong" ]; then
            echo -e "${GREEN}✅ Сервис доступен (${HTTP_CODE})${NC}"
            echo "Ответ: $BODY"
            exit 0
        else
            echo -e "${RED}❌ Сервис недоступен (${HTTP_CODE})${NC}"
            exit 1
        fi
        ;;
        
    "health")
        URL="$BASE_URL/health"
        echo "💚 Базовая проверка здоровья..."
        RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        JSON=$(echo "$RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            echo -e "${GREEN}✅ HTTP Status: $HTTP_CODE (OK)${NC}"
        else
            echo -e "${RED}❌ HTTP Status: $HTTP_CODE (Error)${NC}"
            exit 1
        fi
        
        echo ""
        echo "📊 Health check:"
        echo "$JSON" | jq .
        
        STATUS=$(echo "$JSON" | jq -r '.status')
        UPTIME=$(echo "$JSON" | jq -r '.uptime')
        
        HOURS=$((UPTIME / 3600))
        MINUTES=$(((UPTIME % 3600) / 60))
        SECONDS=$((UPTIME % 60))
        
        echo ""
        echo -e "Статус: ${GREEN}$STATUS${NC}"
        echo "Время работы: ${HOURS}ч ${MINUTES}м ${SECONDS}с"
        exit 0
        ;;
        
    "status")
        URL="$BASE_URL/api/status"
        echo "📊 Детальная проверка статуса..."
        ;;
        
    *)
        echo -e "${RED}❌ Неизвестный режим: $MODE${NC}"
        echo "Доступные режимы: ping, health, status"
        exit 1
        ;;
esac

# Выполняем запрос
RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
JSON=$(echo "$RESPONSE" | head -n-1)

# Проверяем HTTP код
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ HTTP Status: $HTTP_CODE (OK)${NC}"
elif [ "$HTTP_CODE" -eq 503 ]; then
    echo -e "${YELLOW}⚠️  HTTP Status: $HTTP_CODE (Service Unavailable)${NC}"
else
    echo -e "${RED}❌ HTTP Status: $HTTP_CODE (Error)${NC}"
    exit 1
fi

# Проверяем, что получили JSON
if ! echo "$JSON" | jq empty 2>/dev/null; then
    echo -e "${RED}❌ Ответ не является валидным JSON${NC}"
    echo "$JSON"
    exit 1
fi

# Красиво выводим JSON
echo ""
echo "📊 Детали статуса:"
echo "$JSON" | jq .

# Извлекаем ключевые метрики
STATUS=$(echo "$JSON" | jq -r '.status')
UPTIME=$(echo "$JSON" | jq -r '.uptime')
DB_STATUS=$(echo "$JSON" | jq -r '.checks.database.status')
MEMORY=$(echo "$JSON" | jq -r '.checks.memory.heapUsed')

echo ""
echo "📈 Краткая сводка:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$STATUS" == "healthy" ]; then
    echo -e "Общий статус: ${GREEN}$STATUS${NC}"
else
    echo -e "Общий статус: ${RED}$STATUS${NC}"
fi

# Конвертируем uptime в читаемый формат
HOURS=$((UPTIME / 3600))
MINUTES=$(((UPTIME % 3600) / 60))
SECONDS=$((UPTIME % 60))
echo "Время работы: ${HOURS}ч ${MINUTES}м ${SECONDS}с"

if [ "$DB_STATUS" == "healthy" ]; then
    echo -e "База данных: ${GREEN}$DB_STATUS${NC}"
else
    echo -e "База данных: ${RED}$DB_STATUS${NC}"
fi

echo "Память (heap): $MEMORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Итоговый результат
if [ "$STATUS" == "healthy" ] && [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "\n${GREEN}✅ Все проверки пройдены успешно${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Обнаружены проблемы${NC}"
    exit 1
fi
