# VK Mini App Docker Setup

## Overview

The VK Mini App is containerized using Docker and integrated into the existing Ritto infrastructure via docker-compose.

## Architecture

- **Build Stage**: Uses Node.js 20 Alpine to build the production bundle with Vite
- **Production Stage**: Uses Nginx Alpine to serve static files
- **Port**: Exposed on port 3001 (mapped to container port 80)
- **Nginx Path**: Accessible at `https://sushiritto.ru/vk`

## Environment Variables

Add these variables to your `.env` file:

```bash
# VK App ID (from VK Developers)
VK_APP_ID=your_vk_app_id_here

# VK App Secret (for Launch Params validation in backend)
VK_APP_SECRET=your_vk_app_secret_here

# VK Mini App URLs (for CORS and API endpoints)
VK_BACKEND_API_URL=https://sushiritto.ru
VK_SABY_SERVICE_URL=https://sushiritto.ru
```

## Building and Running

### Build the VK Mini App container:
```bash
docker-compose build vk-mini-app
```

### Start all services including VK Mini App:
```bash
docker-compose up -d
```

### Start only VK Mini App:
```bash
docker-compose up -d vk-mini-app
```

### View logs:
```bash
docker-compose logs -f vk-mini-app
```

### Rebuild and restart:
```bash
docker-compose up -d --build vk-mini-app
```

## Development Mode

For development with hot reload, you can mount the source directories as volumes (already configured in docker-compose.yml):

```yaml
volumes:
  - ./vk-mini-app/src:/app/src
  - ./vk-mini-app/public:/app/public
```

Note: Hot reload requires running `npm run dev` inside the container or running the dev server locally.

## Nginx Configuration

The VK Mini App is served through the main Nginx reverse proxy at `/vk` path:

- **URL**: `https://sushiritto.ru/vk`
- **CORS**: Configured to allow requests from `https://vk.com`
- **Headers**: Includes necessary headers for VK platform integration

## Health Check

The container includes a health check that verifies Nginx is serving content:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

Check health status:
```bash
docker ps | grep vk-mini-app
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs vk-mini-app

# Check if port 3001 is already in use
lsof -i :3001
```

### Build fails
```bash
# Clean build cache
docker-compose build --no-cache vk-mini-app

# Check if node_modules is causing issues
rm -rf vk-mini-app/node_modules
docker-compose build vk-mini-app
```

### Can't access via Nginx
```bash
# Verify Nginx configuration
docker-compose exec nginx nginx -t

# Reload Nginx
docker-compose exec nginx nginx -s reload

# Check Nginx logs
docker-compose logs nginx
```

## Production Deployment

1. Ensure all environment variables are set in `.env`
2. Build all services: `docker-compose build`
3. Start services: `docker-compose up -d`
4. Verify VK Mini App is accessible: `curl https://sushiritto.ru/vk`
5. Configure VK Developers console to point to `https://sushiritto.ru/vk`

## Security Considerations

- Container runs with `no-new-privileges:true` security option
- Nginx serves only static files (no code execution)
- CORS is restricted to VK platform domains
- All API requests go through the backend with proper authentication
