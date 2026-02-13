# Secure API Gateway

A production-grade, **stateless, multi-tenant API gateway** built with NestJS that provides robust security, observability, and traffic management capabilities.

## Overview

The Secure API Gateway acts as a reverse proxy and security layer for your microservices architecture. It enforces authentication, authorization, rate limiting, and comprehensive observability across multiple tenants within a single deployment.

**Key Characteristics:**
-  **Stateless Architecture** - Horizontally scalable, designed for cloud-native deployments
-  **Redis-backed State** - All tenant and rate-limit data externalized to Redis for consistency across replicas
-  **Multi-tenant Isolation** - Complete tenant segregation at API and routing levels
-  **Zero-trust Security** - Multiple layers of authentication and authorization
-  **Production-ready Observability** - Structured logging and Prometheus metrics

---

##  Security Features

### 1. **API Key Authentication**
- Mandatory API key validation via `X-API-Key` header
- Tenant identification and routing based on API key
- API keys are hashed with SHA-256 before storage in Redis
- Automatic tenant configuration retrieval

### 2. **JWT Validation with JWKS**
- Remote JWKS endpoint support for token validation
- Per-tenant Identity Provider (IdP) configuration
- Transparent JWT verification with issuer and audience validation
- Optional JWT enforcement per-route or per-tenant
- Cached JWKS sets for optimal performance
- Support for token expiration and signature validation

### 3. **Route-Based Access Control**
- Tenant-specific allowed routes configuration
- Path-based access policies with nested route support
- Per-route authentication overrides
- Prevents unauthorized access to upstream services
- Granular routing policies per tenant

### 4. **Rate Limiting**
- Token-bucket algorithm via Redis
- Per-tenant customizable rate limit windows and thresholds
- Configurable request quotas per time window
- Automatic expiration of rate-limit counters
- Default: 100 requests per 60 seconds

### 5. **Admin Token Protection**
- `X-Admin-Token` header authentication
- Protects control plane operations and observability endpoints
- Metrics and management endpoints restricted to authorized admins

### 6. **CORS Support**
- Configurable CORS with request origin reflection
- Support for safe headers: `Content-Type`, `Authorization`, `X-API-Key`, `X-Admin-Token`
- Credentials handling and OPTIONS request support

---

##  Architecture

### **Stateless Design**
- Excellent horizontal scalability
- No in-memory state persisted across requests
- All session and configuration data in Redis
- Perfect for Kubernetes and containerized environments

### **Multi-plane Architecture**

#### **Data Plane**
- Handles API request routing and proxying
- Enforces security guardrails via middleware stack
- Connects upstream services via HTTP proxy
- Per-request tenant and route validation

#### **Control Plane**
- Administrative operations and configuration management
- Health check endpoints
- Routing configuration management
- Metrics and observability

---

##  Observability

### **Structured Logging (Pino)**
- JSON-formatted, machine-readable logs
- Multi-category logging:
  - **Auth Events** - API key and JWT validation results
  - **Policy Events** - Route access decisions
  - **Request Tracking** - Method, path, status, duration
  - **Admin Operations** - Control plane activities
- Configurable log levels via `LOG_LEVEL` environment variable
- Request context included (IP, method, path, status, duration)

### **Prometheus Metrics**
- Real-time gateway performance and security metrics
- Accessible at `/metrics` endpoint (requires admin token)

#### **Gateway Metrics:**
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `gateway_requests_total` | Counter | `tenantId`, `status` | Total requests through gateway |
| `gateway_auth_failures_total` | Counter | `tenantId`, `reason` | Authentication failures (missing JWT, invalid JWT, invalid API key) |
| `gateway_route_denials_total` | Counter | `tenantId` | Route access policy denials |
| `gateway_rate_limited_total` | Counter | `tenantId` | Rate-limited requests |
| `gateway_upstream_errors_total` | Counter | `tenantId` | Upstream service errors (5xx responses, transport errors) |
| `gateway_internal_errors_total` | Counter | `type` | Internal gateway errors |
| `gateway_latency_ms` | Histogram | `tenantId`, `status` | End-to-end request latency (50-3000ms buckets) |
| `gateway_upstream_latency_ms` | Histogram | `tenantId`, `upstream` | Upstream service latency |
| `gateway_inflight_requests` | Gauge | - | Current in-flight requests |

#### **Control Plane Metrics:**
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `control_requests_total` | Counter | `endpoint`, `status` | Control plane API requests |
| `control_mutations_total` | Counter | `action` | Configuration mutations (tenant updates, route changes) |
| `control_errors_total` | Counter | - | Control plane errors |
| `control_latency_ms` | Histogram | `endpoint` | Control plane operation latency |

#### **Process Metrics:**
- Node.js standard metrics (memory, CPU, file handles, etc.)
- Cross-cutting observability for infrastructure monitoring

---

##  Core Features

### **Multi-Tenant Routing**
```typescript
// Tenant Configuration Structure
{
  id: "tenant-123",
  name: "ACME Corp",
  upstreamBaseUrl: "https://api.acme.internal",
  allowedRoutes: [
    { path: "/v1/users", auth: { jwt: true } },
    { path: "/v1/products", auth: { jwt: false } }
  ],
  rateLimit: { windowSeconds: 60, maxRequests: 1000 },
  idp: {
    issuer: "https://auth.acme.com",
    jwksUri: "https://auth.acme.com/.well-known/jwks.json",
    audience: "api.acme.com"
  }
}
```

### **Request Flow**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client Request (with X-API-Key & Authorization headers)  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. API Key Guard - Tenant Identification                    │
│    └─ Fetch tenant from Redis by hashed API key             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. Route Guard - Route Authorization                        │
│    └─ Verify path in tenant's allowedRoutes                 │
│    └─ Validate route-level auth policies                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. JWT Guard - Token Validation (if required)               │
│    └─ Extract Bearer token from Authorization header        │
│    └─ Verify signature against tenant's JWKS endpoint       │
│    └─ Validate issuer and audience                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. Rate Limit Guard - Traffic Shaping                       │
│    └─ Check Redis rate limit counter for tenant             │
│    └─ Enforce max requests per time window                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 6. Request Metrics & Logging Middleware                     │
│    └─ Record start time and increment inflight counter      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 7. HTTP Proxy to Upstream Service                           │
│    └─ Forward request with path normalization               │
│    └─ Handle transport and application-level errors         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 8. Response & Observability                                 │
│    └─ Record latency histogram                              │
│    └─ Increment request counter with status                 │
│    └─ Log full request/response cycle                       │
└─────────────────────────────────────────────────────────────┘
```

### **Redis Externalization**
Gateway state is entirely managed via Redis for consistency across distributed deployments:

- **Tenant Data**: `tenant:{tenantId}` - Full tenant configuration
- **API Key Mapping**: `tenant:byApiKey:{hashedApiKey}` - API key to tenant ID lookup
- **Rate Limit Counters**: `rl:{tenantId}:{timeWindow}` - Per-tenant request counters with TTL
- **JWKS Caching**: In-memory cache with per-tenant JWKS endpoints

**Configuration:**
```env
# Direct connection
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secure-password

# Or connection string
REDIS_URL=redis://user:password@redis.example.com:6379

# TLS support
REDIS_TLS=true
REDIS_TLS_REJECT_UNAUTHORIZED=true
```

---

##  Dependencies

### Core Framework
- **NestJS 11.x** - Enterprise-grade Node.js framework
- **Express** - HTTP server platform

### Authentication & Authorization
- **jose** - JWT verification with JWKS support

### State Management
- **ioredis** - Redis client for distributed state

### Logging & Monitoring
- **pino** - High-performance JSON logger
- **prom-client** - Prometheus metrics integration

### HTTP Proxying
- **http-proxy** - Reverse proxy implementation

---

##  Getting Started

### **Prerequisites**
- Node.js 18+ 
- Redis 6+
- Identity Provider with JWKS endpoint (e.g., Auth0, Keycloak, Google, Azure AD)

### **Installation**
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

### **Configuration**

Create a `.env` file:
```env
# Server
PORT=3000

# Redis
REDIS_URL=redis://localhost:6379
# OR individual settings:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info

# Admin Protection (for metrics and control endpoints)
ADMIN_TOKEN=your-secure-admin-token-here
```

### **Development**
```bash
# Start development server with hot reload
npm run start:dev

# Run linter
npm run lint

# Run tests
npm run test
npm run test:e2e
npm run test:cov
```

### **Production**
```bash
# Build
npm run build

# Start
npm run start:prod
```

---

##  API Endpoints

### **Data Plane (API Routing)**
```
POST|GET|PUT|DELETE /api/*
```
- **Headers Required:**
  - `X-API-Key: {api-key}` - Tenant identification
  - `Authorization: Bearer {jwt-token}` - If JWT required by tenant/route
  
- **Response:**
  - Proxied response from upstream service
  - 401 Unauthorized - Missing/invalid API key or JWT
  - 403 Forbidden - Route not allowed or JWT validation failed
  - 429 Too Many Requests - Rate limit exceeded
  - 502 Bad Gateway - Upstream service error

### **Control Plane**

#### **Health Check**
```
GET /admin/health
Headers: X-Admin-Token: {admin-token}

Response: { status: "ok", plane: "control" }
```

#### **Routing Configuration**
```
GET /admin/routes
Headers: X-Admin-Token: {admin-token}

Response: { message: "Routing config will live here (stub)" }
```

#### **Metrics**
```
GET /metrics
Headers: X-Admin-Token: {admin-token}

Response: Prometheus metrics in text/plain format
```

#### **Tenant Management**
```
GET /tenant
Headers: X-Admin-Token: {admin-token}

Response: Lists or manages tenant configurations (implementation pending)
```

---

##  Testing

### **Unit Tests**
```bash
npm run test
npm run test:watch
npm run test:cov
```

### **E2E Tests**
```bash
npm run test:e2e
```

Tests cover:
- JWT validation and JWKS integration
- API key authentication
- Route access control
- Rate limiting enforcement
- Gateway proxying

---

##  Monitoring & Debugging

### **View Logs**
```bash
# Development
npm run start:dev 2>&1 | grep -E '"category"|"decision"'

# Production - JSON logs are piped to your log aggregation system
```

### **Query Metrics**
```bash
# Get all metrics
curl -H "X-Admin-Token: your-admin-token" http://localhost:3000/metrics

# Filter specific metrics
curl -H "X-Admin-Token: your-admin-token" http://localhost:3000/metrics | grep gateway_requests_total
```

### **Debug Mode**
```bash
npm run start:debug
# VSCode debugger will be available on localhost:9229
```

---

##  Tenant Configuration Example

To add a new tenant, store the following in Redis:

```json
{
  "id": "tenant-acme",
  "name": "ACME Corporation",
  "upstreamBaseUrl": "https://internal-api.acme.com",
  "allowedRoutes": [
    {
      "path": "/v1/users",
      "auth": { "jwt": true }
    },
    {
      "path": "/v1/products",
      "auth": { "jwt": false }
    },
    {
      "path": "/v2/admin"
    }
  ],
  "rateLimit": {
    "windowSeconds": 60,
    "maxRequests": 5000
  },
  "idp": {
    "issuer": "https://auth.acme.com",
    "jwksUri": "https://auth.acme.com/.well-known/jwks.json",
    "audience": "api-gateway"
  }
}
```

Store in Redis:
```bash
# Store tenant configuration
redis-cli SET tenant:acme-123 '{ ... json above ... }'

# Store API key mapping (SHA-256 hash of actual API key)
redis-cli SET tenant:byApiKey:a1b2c3d4e5f6... acme-123
```

---

##  Project Structure

```
secure-api-gateway/
├── src/
│   ├── main.ts                 # Application bootstrap
│   ├── app.module.ts           # Main app module
│   ├── app.controller.ts       # Health endpoint
│   │
│   ├── common/                 # Shared functionality
│   │   ├── guards/             # Authentication & authorization
│   │   │   ├── api-key/        # API Key validation
│   │   │   ├── jwt/            # JWT verification with JWKS
│   │   │   ├── rate-limit/     # Redis-backed rate limiting
│   │   │   ├── route/          # Route access control
│   │   │   └── admin.guard.ts  # Admin token protection
│   │   │
│   │   ├── logger/             # Structured logging
│   │   │   ├── logger.ts       # Pino logger configuration
│   │   │   ├── logger.middleware.ts    # Request logging
│   │   │   └── guardlogger.ts  # Security event logging
│   │   │
│   │   ├── metrics/            # Prometheus integration
│   │   │   ├── metrics.ts      # Metric definitions
│   │   │   └── metrics.middleware.ts   # Request tracking
│   │   │
│   │   ├── redis/              # Redis client
│   │   │   └── redis.client.ts # Configured Redis instance
│   │   │
│   │   ├── tenant/             # Multi-tenancy
│   │   │   ├── tenant.model.ts # Tenant interface
│   │   │   ├── tenant.service.ts # Tenant data access
│   │   │   └── tenant.module.ts # Tenant module
│   │   │
│   │   └── keys/               # Key management
│   │       └── public.key.ts   # Public key storage
│   │
│   ├── data-plane/             # Request proxying & routing
│   │   ├── data-plane.module.ts
│   │   └── gateway/            # Main proxy controller
│   │       └── gateway.controller.ts
│   │
│   ├── control-plane/          # Administrative operations
│   │   ├── control-plane.module.ts
│   │   ├── control-plane.controller.ts
│   │   └── admin/              # Admin endpoints
│   │       └── admin.controller.ts
│   │
│   ├── metrics/                # Metrics endpoint
│   │   └── metrics.controller.ts
│   │
│   └── tenant/                 # Tenant management endpoints
│       └── tenant.controller.ts
│
├── test/                       # End-to-end tests
│   ├── control-plane.e2e-spec.ts
│   ├── gateway.e2e-spec.ts
│   └── jest-e2e.json
│
├── jest.config.js              # Jest test configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

##  Security Best Practices

1. **Admin Token** - Store `ADMIN_TOKEN` in secure vault, rotate regularly
2. **API Keys** - Implement secure key generation and rotation policies
3. **JWT Issuer** - Verify JWKS endpoint URL matches your IdP configuration
4. **Redis** - Enable TLS for production Redis connections
5. **CORS** - Review CORS configuration for your frontend origin
6. **Rate Limits** - Adjust based on your upstream service capacity
7. **Logging** - Ensure logs are sent to secure aggregation service




##  Support

For issues or questions, please open an issue in the project repository.

---

##  Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [jose - JWT & JWKS](https://github.com/panva/jose)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Pino Logger](https://getpino.io/)
- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/)
