#!/bin/bash
set -e

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎨 БЕЗОПАСНАЯ СБОРКА FRONTEND${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Сборка займет 5-15 минут${NC}"
echo -e "${YELLOW}   Frontend (React + TypeScript + Vite) требует много ресурсов${NC}"
echo ""

# Проверка свободных ресурсов
echo -e "${BLUE}📊 Проверка доступных ресурсов...${NC}"
FREE_MEM=$(free -m | awk 'NR==2{print $7}')
echo "   Доступно памяти: ${FREE_MEM} MB"

if [ "$FREE_MEM" -lt 400 ]; then
    echo -e "${RED}❌ Недостаточно свободной памяти (< 400 MB)${NC}"
    echo -e "${YELLOW}💡 Рекомендации:${NC}"
    echo "   1. Остановите ненужные сервисы: docker compose stop portainer adminer"
    echo "   2. Очистите кэш: docker system prune -f"
    echo "   3. Или соберите frontend локально и скопируйте dist/"
    echo ""
    read -p "Продолжить сборку? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🛑 Останавливаем frontend...${NC}"
docker compose stop frontend 2>/dev/null || true
docker compose rm -f frontend 2>/dev/null || true

echo ""
echo -e "${BLUE}💾 Освобождаем ресурсы...${NC}"
# Временно останавливаем тяжелые сервисы
docker compose stop portainer adminer 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true  # Очистка кэша (требует root)

sleep 3

echo ""
echo -e "${BLUE}🔨 Запуск сборки frontend...${NC}"
echo -e "${YELLOW}   Используется:${NC}"
echo "   - nice -n 19 (низкий приоритет CPU)"
echo "   - --memory=700m (ограничение памяти)"
echo "   - NODE_OPTIONS=--max-old-space-size=512"
echo ""

# Экспорт переменных для BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Сборка с низким приоритетом и ограничением ресурсов
echo -e "${YELLOW}⏳ Сборка началась... (не прерывайте процесс)${NC}"
START_TIME=$(date +%s)

# Используем nice для снижения приоритета + ограничение памяти
if nice -n 19 docker compose build --memory=700m --no-cache frontend; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    echo ""
    echo -e "${GREEN}✅ Frontend успешно собран!${NC}"
    echo -e "${GREEN}   Время сборки: ${MINUTES}м ${SECONDS}с${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка сборки frontend${NC}"
    echo -e "${YELLOW}💡 Возможные причины:${NC}"
    echo "   - Нехватка памяти (OOM Killer)"
    echo "   - Ошибки в TypeScript коде"
    echo "   - Проблемы с зависимостями"
    echo ""
    echo -e "${BLUE}📝 Проверьте логи сборки выше${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Запуск нового frontend...${NC}"
docker compose up -d frontend

sleep 5

# Проверка запуска
if docker compose ps frontend | grep -q "Up"; then
    echo -e "${GREEN}✅ Frontend запущен и работает${NC}"
else
    echo -e "${RED}❌ Frontend не запустился${NC}"
    echo "Проверьте логи: docker compose logs frontend"
    exit 1
fi

echo ""
echo -e "${BLUE}🔄 Восстанавливаем остановленные сервисы...${NC}"
docker compose up -d portainer adminer 2>/dev/null || true

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ СБОРКА ЗАВЕРШЕНА УСПЕШНО${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Статус контейнеров:${NC}"
docker compose ps | grep -E "frontend|nginx"
echo ""
echo -e "${BLUE}🌐 Проверьте frontend:${NC}"
echo "   http://localhost:3000"
echo ""
echo -e "${BLUE}📝 Полезные команды:${NC}"
echo "   docker compose logs -f frontend    # Логи"
echo "   docker compose restart frontend    # Перезапуск"
echo ""
