FROM node:18-alpine

WORKDIR /app

# Копируем package.json отдельно для кэширования
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 5001

CMD ["node", "server.js"]