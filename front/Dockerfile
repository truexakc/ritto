FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Use npm ci when lockfile is in sync, otherwise fallback to npm install
RUN npm ci || npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix file permissions
RUN chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

EXPOSE 3000
