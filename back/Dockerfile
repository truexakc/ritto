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

# Создаем директорию для загрузок и даем права пользователю
RUN mkdir -p /app/public/uploads/products && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chmod -R 755 /app/public/uploads

# Копируем и настраиваем entrypoint скрипт
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown nextjs:nodejs /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 5001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]