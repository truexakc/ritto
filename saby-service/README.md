# SABY Go Microservice

A Go-based microservice for integrating with the SABY (SBIS) Retail API. This service provides a clean REST API for creating delivery orders and will be integrated with the existing Node.js backend.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Docker Deployment](#docker-deployment)
- [Integration with Node.js Backend](#integration-with-nodejs-backend)
- [Project Structure](#project-structure)
- [TODO: Future Enhancements](#todo-future-enhancements)

## Overview

This microservice acts as an intermediary between the Node.js backend and the SABY API, providing:

- Type-safe order processing with Go's strong typing
- Comprehensive input validation
- Standardized error handling
- Request tracing and structured logging
- Production-ready security practices

**Current Status:** This is a placeholder implementation with all structures and validation in place, but without actual SABY API calls. The service returns mock responses for testing and development purposes.

## Architecture

```
┌─────────────────────┐         HTTP REST          ┌──────────────────────┐
│   Node.js Backend   │ ─────────────────────────> │  Go Microservice     │
│   (Port 5001)       │ <───────────────────────── │  (Port 8080)         │
└─────────────────────┘                             └──────────────────────┘
         │                                                    │
         │                                                    │
         ▼                                                    ▼
   ┌──────────┐                                        ┌──────────┐
   │PostgreSQL│                                        │ SABY API │
   └──────────┘                                        │(Placeholder)│
                                                       └──────────┘
```

### Communication Flow

1. Node.js backend receives order creation request
2. Node.js validates and saves order to PostgreSQL
3. Node.js sends HTTP POST to Go microservice
4. Go microservice validates data and returns response
5. **TODO:** Go microservice will forward request to real SABY API

## Features

✅ **Implemented:**
- RESTful API with Gin framework
- Comprehensive input validation (E.164 phone, RFC3339 datetime, enum validation)
- Standardized error responses with field-level details
- Request ID generation and tracing
- Structured JSON logging
- Context-aware request handling with timeout support
- Non-root Docker container execution
- Health check endpoint
- Property-based testing with gopter

🚧 **Placeholder:**
- SABY API integration (returns mock responses)

## Prerequisites

- Go 1.21 or higher
- Docker and Docker Compose (for containerized deployment)
- Access to SABY API credentials (for future real integration)

## Installation

### Local Development

1. Clone the repository and navigate to the service directory:
```bash
cd saby-service
```

2. Install dependencies:
```bash
go mod download
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```bash
SABY_API_URL=https://api.sbis.ru
SABY_API_KEY=your_api_key_here
PORT=8080
```

5. Run the service:
```bash
go run cmd/app/main.go
```

The service will start on `http://localhost:8080`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SABY_API_URL` | Base URL for SABY API | `https://api.sbis.ru` | Yes |
| `SABY_API_KEY` | API key for SABY authentication | - | Yes |
| `PORT` | HTTP server port | `8080` | No |

### Configuration Loading

The service loads configuration from environment variables on startup. Missing required variables will cause the service to fail with a clear error message.

## API Documentation

### Base URL

```
http://localhost:8080/api/v1
```

### Endpoints

#### 1. Create Order

**POST** `/api/v1/orders`

Creates a new delivery order in the SABY system.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "product": "delivery",
  "pointId": 123,
  "comment": "Please ring the doorbell",
  "customer": {
    "externalId": "customer-123",
    "name": "Иван",
    "lastname": "Иванов",
    "patronymic": "Иванович",
    "email": "ivan@example.com",
    "phone": "+79991234567"
  },
  "datetime": "2024-01-31T15:04:05Z",
  "promocode": "DISCOUNT10",
  "nomenclatures": [
    {
      "externalId": "prod-456",
      "count": 2,
      "cost": 500.00,
      "name": "Суши сет",
      "priceListId": 1
    }
  ],
  "delivery": {
    "isPickup": false,
    "addressFull": "Москва, ул. Ленина, д. 10, кв. 5",
    "persons": 2,
    "paymentType": "card"
  }
}
```

**Success Response (201 Created):**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "externalId": "SABY-12345",
  "status": "created",
  "createdAt": "2024-01-31T15:04:05Z",
  "message": "Order created successfully (placeholder)"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "customer.phone",
        "message": "phone must be in E.164 format"
      },
      {
        "field": "delivery.paymentType",
        "message": "paymentType must be one of: card, online, cash"
      }
    ]
  }
}
```

**Validation Rules:**

- **Required fields:** `product`, `pointId`, `customer`, `datetime`, `nomenclatures`, `delivery`
- **Phone format:** Must be E.164 format (e.g., `+79991234567`)
- **Datetime format:** Must be RFC3339 format (e.g., `2024-01-31T15:04:05Z`)
- **Payment type:** Must be one of: `card`, `online`, `cash`
- **Nomenclatures:** Must contain at least one item
- **Address:** Required when `isPickup` is `false`

#### 2. Health Check

**GET** `/health`

Returns the service health status.

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "service": "saby-service",
  "version": "1.0.0",
  "timestamp": "2024-01-31T15:04:05Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data or failed validation |
| `TIMEOUT_ERROR` | 408 | Request timeout or context deadline exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected internal server error |
| `DEPENDENCY_ERROR` | 503 | External dependency unavailable |

### Request Tracing

Every request receives a unique request ID that is:
- Generated as a UUID v4
- Included in response headers as `X-Request-ID`
- Logged with all request-related log entries

Use this ID for debugging and tracing requests across services.

## Development

### Running Locally

```bash
# Run the service
go run cmd/app/main.go

# Run with custom port
PORT=9000 go run cmd/app/main.go
```

### Code Structure

The project follows standard Go project layout:

```
saby-service/
├── cmd/app/              # Application entry point
├── internal/             # Private application code
│   ├── handler/          # HTTP handlers
│   ├── service/          # Business logic
│   ├── client/           # External API clients
│   ├── model/            # Data models
│   ├── middleware/       # HTTP middleware
│   └── config/           # Configuration
└── pkg/                  # Public libraries
    └── validator/        # Custom validators
```

### Adding New Endpoints

1. Define models in `internal/model/`
2. Add business logic in `internal/service/`
3. Create handler in `internal/handler/`
4. Register route in `cmd/app/main.go`

## Testing

### Running Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with verbose output
go test -v ./...

# Run specific package tests
go test ./internal/handler/...
```

### Test Types

**Unit Tests:**
- Configuration loading
- Model validation
- Handler logic
- Service layer

**Property-Based Tests:**
- Input validation across random inputs
- Error response format consistency
- Context cancellation handling
- Request ID generation

Property-based tests use [gopter](https://github.com/leanovate/gopter) and run 100 iterations per property.

### Example Test Run

```bash
$ go test ./...
?       saby-service/cmd/app    [no test files]
ok      saby-service/internal/client    0.123s
ok      saby-service/internal/config    0.089s
ok      saby-service/internal/handler   0.234s
ok      saby-service/internal/middleware        0.156s
ok      saby-service/internal/model     0.098s
ok      saby-service/internal/service   0.187s
ok      saby-service/pkg/validator      0.145s
```

## Docker Deployment

### Building the Image

```bash
# Build the Docker image
docker build -t saby-service:latest .

# Run the container
docker run -p 8080:8080 \
  -e SABY_API_URL=https://api.sbis.ru \
  -e SABY_API_KEY=your_key \
  saby-service:latest
```

### Docker Compose

The service is integrated into the main `docker-compose.yml`:

```yaml
saby-service:
  build: ./saby-service
  ports:
    - "8080:8080"
  environment:
    - SABY_API_URL=${SABY_API_URL}
    - SABY_API_KEY=${SABY_API_KEY}
    - PORT=8080
  networks:
    - ritto-network
  restart: unless-stopped
```

Start with Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f saby-service

# Stop services
docker-compose down
```

### Security Features

- **Non-root execution:** Container runs as `appuser` (UID 1000)
- **Minimal image:** Alpine-based final image (~20MB)
- **Static binary:** No runtime dependencies
- **Security scanning:** Compatible with container security tools

## Integration with Node.js Backend

### Service Client Example

Create a service client in your Node.js backend:

```javascript
// back/services/sabyService.js
const axios = require('axios');

const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';

class SabyService {
    constructor() {
        this.client = axios.create({
            baseURL: `${SABY_SERVICE_URL}/api/v1`,
            timeout: 35000,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async createOrder(orderData) {
        try {
            const response = await this.client.post('/orders', {
                product: 'delivery',
                pointId: orderData.point_id,
                customer: {
                    name: orderData.customer_name,
                    phone: orderData.customer_phone,
                    email: orderData.customer_email,
                },
                datetime: new Date().toISOString(),
                nomenclatures: orderData.items.map(item => ({
                    count: item.quantity,
                    cost: parseFloat(item.unit_price),
                    name: item.product_name,
                    priceListId: 1,
                })),
                delivery: {
                    isPickup: orderData.is_pickup || false,
                    addressFull: orderData.delivery_address,
                    paymentType: orderData.payment_method,
                },
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`SABY error: ${error.response.data.error?.message}`);
            }
            throw new Error(`SABY unavailable: ${error.message}`);
        }
    }

    async healthCheck() {
        try {
            const response = await axios.get(`${SABY_SERVICE_URL}/health`, {
                timeout: 5000
            });
            return response.data.status === 'ok';
        } catch (error) {
            return false;
        }
    }
}

module.exports = new SabyService();
```

### Usage in Controllers

```javascript
const sabyService = require('../services/sabyService');

exports.createOrder = async (req, res) => {
    try {
        // Create order in database
        const order = await Order.create(req.body);

        // Send to SABY (non-blocking)
        sabyService.createOrder(order)
            .then(sabyResponse => {
                console.log('✅ Order synced with SABY:', sabyResponse);
                order.update({
                    saby_order_id: sabyResponse.externalId,
                    saby_status: sabyResponse.status,
                });
            })
            .catch(error => {
                console.error('⚠️ SABY sync failed:', error.message);
            });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

## Project Structure

```
saby-service/
├── cmd/
│   └── app/
│       └── main.go                      # Application entry point
├── internal/
│   ├── client/
│   │   ├── saby_client.go              # SABY API client interface
│   │   └── saby_client_test.go         # Client tests
│   ├── config/
│   │   ├── config.go                   # Configuration management
│   │   └── config_test.go              # Config tests
│   ├── handler/
│   │   ├── order_handler.go            # HTTP request handlers
│   │   └── order_handler_test.go       # Handler tests
│   ├── middleware/
│   │   ├── logger.go                   # Logging middleware
│   │   ├── logger_test.go              # Logger tests
│   │   ├── request_id.go               # Request ID middleware
│   │   └── request_id_test.go          # Request ID tests
│   ├── model/
│   │   ├── error.go                    # Error models
│   │   ├── order.go                    # Order models
│   │   ├── order_test.go               # Model tests
│   │   └── response.go                 # Response models
│   └── service/
│       ├── saby_service.go             # Business logic
│       └── saby_service_test.go        # Service tests
├── pkg/
│   └── validator/
│       ├── validator.go                # Custom validators
│       ├── validator_test.go           # Validator tests
│       └── example_usage.go            # Usage examples
├── .dockerignore                        # Docker ignore patterns
├── .env.example                         # Example environment variables
├── .gitignore                           # Git ignore patterns
├── Dockerfile                           # Multi-stage Docker build
├── go.mod                               # Go module definition
├── go.sum                               # Go module checksums
└── README.md                            # This file
```

## TODO: Future Enhancements

### Phase 1: Real SABY API Integration (High Priority)

- [ ] Implement actual HTTP calls to SABY API in `internal/client/saby_client.go`
- [ ] Handle SABY API authentication and authorization
- [ ] Parse and map SABY API responses to internal models
- [ ] Handle SABY-specific error codes and messages
- [ ] Add retry logic for transient failures
- [ ] Implement request/response logging for SABY calls

**Location to update:** `internal/client/saby_client.go` - Look for `// TODO: Implement real SABY API call` comment

### Phase 2: Additional SABY Operations

- [ ] Get order status endpoint (`GET /api/v1/orders/:id`)
- [ ] Update order endpoint (`PUT /api/v1/orders/:id`)
- [ ] Cancel order endpoint (`DELETE /api/v1/orders/:id`)
- [ ] List orders endpoint (`GET /api/v1/orders`)
- [ ] Product synchronization from SABY
- [ ] Webhook handling for SABY callbacks

### Phase 3: Reliability & Performance

- [ ] Circuit breaker pattern for SABY API calls
- [ ] Request rate limiting
- [ ] Response caching for product data
- [ ] Message queue integration (Redis/RabbitMQ) for async processing
- [ ] Bulk order operations
- [ ] Database for order state tracking

### Phase 4: Observability

- [ ] Prometheus metrics endpoint
- [ ] Distributed tracing with OpenTelemetry
- [ ] Grafana dashboards
- [ ] Alert rules for error rates and latency
- [ ] Performance profiling endpoints

### Phase 5: Advanced Features

- [ ] Multi-tenant support
- [ ] API versioning (v2)
- [ ] GraphQL API option
- [ ] Webhook retry mechanism
- [ ] Order status synchronization job
- [ ] Admin API for service management

## Contributing

1. Follow Go best practices and idioms
2. Write tests for new functionality
3. Update documentation for API changes
4. Use structured logging with request IDs
5. Handle errors gracefully with proper error types
6. Validate all inputs thoroughly

## License

[Your License Here]

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f saby-service`
- Verify health: `curl http://localhost:8080/health`
- Review validation errors in API responses
- Check environment variables are set correctly

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Placeholder Implementation (Ready for SABY API Integration)
