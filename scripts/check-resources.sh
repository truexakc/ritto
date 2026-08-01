#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 ПРОВЕРКА РЕСУРСОВ СЕРВЕРА${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверка памяти
echo -e "${BLUE}💾 ПАМЯТЬ:${NC}"
free -h
echo ""

# Общее использование памяти
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
USED_MEM=$(free -m | awk 'NR==2{print $3}')
FREE_MEM=$(free -m | awk 'NR==2{print $4}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')

MEM_PERCENT=$(echo "scale=1; $USED_MEM * 100 / $TOTAL_MEM" | bc)

echo -e "Всего RAM: ${TOTAL_MEM} MB"
echo -e "Использовано: ${USED_MEM} MB (${MEM_PERCENT}%)"
echo -e "Доступно: ${AVAILABLE_MEM} MB"

if [ "$AVAILABLE_MEM" -lt 300 ]; then
    echo -e "${RED}⚠️  КРИТИЧНО: Мало доступной памяти!${NC}"
elif [ "$AVAILABLE_MEM" -lt 500 ]; then
    echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Памяти остается мало${NC}"
else
    echo -e "${GREEN}✅ Достаточно памяти${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка SWAP
echo -e "${BLUE}💱 SWAP:${NC}"
if swapon --show | grep -q "/"; then
    swapon --show
    SWAP_USED=$(free -m | awk 'NR==3{print $3}')
    if [ "$SWAP_USED" -gt 100 ]; then
        echo -e "${YELLOW}⚠️  Swap активно используется ($SWAP_USED MB)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Swap не настроен${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка дисков
echo -e "${BLUE}💿 ДИСК:${NC}"
df -h | grep -E "Filesystem|/$|/dev/vda"
echo ""

DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${RED}⚠️  КРИТИЧНО: Диск заполнен на ${DISK_USAGE}%!${NC}"
elif [ "$DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Диск заполнен на ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✅ Достаточно места на диске (${DISK_USAGE}% использовано)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка Docker контейнеров
echo -e "${BLUE}🐳 DOCKER КОНТЕЙНЕРЫ:${NC}"
if command -v docker &> /dev/null; then
    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}" | head -20
    echo ""
    echo -e "${BLUE}📊 Использование ресурсов контейнерами:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -20
    
    # Подсчет общего использования памяти контейнерами
    echo ""
    TOTAL_CONTAINER_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" | awk '{print $1}' | sed 's/MiB//g' | awk '{sum+=$1} END {print int(sum)}')
    echo -e "Всего используется контейнерами: ~${TOTAL_CONTAINER_MEM} MB"
    
    FREE_FOR_UPTIME=$((AVAILABLE_MEM - 100))
    echo -e "Доступно для Uptime Kuma: ~${FREE_FOR_UPTIME} MB"
    
    if [ "$FREE_FOR_UPTIME" -lt 200 ]; then
        echo -e "${RED}❌ НЕ рекомендуется устанавливать Uptime Kuma${NC}"
        echo -e "${YELLOW}   Рассмотрите облачные варианты (UptimeRobot, Freshping)${NC}"
    elif [ "$FREE_FOR_UPTIME" -lt 300 ]; then
        echo -e "${YELLOW}⚠️  Uptime Kuma может работать, но будет tight${NC}"
        echo -e "${YELLOW}   Рекомендуется удалить Portainer и Adminer сначала${NC}"
    else
        echo -e "${GREEN}✅ Можно установить Uptime Kuma${NC}"
    fi
else
    echo -e "${YELLOW}Docker не установлен или не запущен${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка CPU
echo -e "${BLUE}⚙️  CPU:${NC}"
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | xargs)
echo "Load Average: $LOAD_AVG"
echo ""

# Топ процессы по памяти
echo -e "${BLUE}🔝 TOP 5 процессов по памяти:${NC}"
ps aux --sort=-%mem | head -6

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 РЕКОМЕНДАЦИИ:${NC}"
echo ""

if [ "$AVAILABLE_MEM" -lt 300 ]; then
    echo -e "${RED}1. ❌ НЕ устанавливайте Uptime Kuma сейчас${NC}"
    echo -e "${YELLOW}2. 💡 Используйте облачный мониторинг (UptimeRobot/Freshping)${NC}"
    echo -e "${YELLOW}3. 🗑️  Рассмотрите удаление Portainer (-150 MB) и Adminer (-50 MB)${NC}"
elif [ "$AVAILABLE_MEM" -lt 500 ]; then
    echo -e "${YELLOW}1. ⚠️  Uptime Kuma можно установить, но будет tight${NC}"
    echo -e "${YELLOW}2. 🗑️  Рекомендуется удалить Portainer и Adminer сначала${NC}"
    echo -e "${GREEN}3. ✅ Или используйте облачный вариант (безопаснее)${NC}"
else
    echo -e "${GREEN}1. ✅ Можно установить Uptime Kuma${NC}"
    echo -e "${GREEN}2. 📊 Но продолжайте мониторить использование памяти${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📚 Подробнее: docs/MONITORING_OPTIONS.md${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
