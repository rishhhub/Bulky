# Configuration reference

This document lists configuration keys and environment variables used by the BulkBy application. Values are read from `bulkby-app/src/main/resources/application.yml` and can be overridden by environment variables or profile-specific files.

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `bulkby` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `12345678` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (optional) | (empty) |
| `JWT_SECRET` | Secret for JWT signing; must be 256-bit in production | (see application.yml) |
| `AWS_ACCESS_KEY_ID` | Used when file storage is S3 | (empty) |
| `AWS_SECRET_ACCESS_KEY` | Used when file storage is S3 | (empty) |

## Application configuration keys

| Key | Description | Default |
|-----|-------------|---------|
| `server.port` | HTTP server port | `8080` |
| `server.servlet.context-path` | API context path | `/api` |
| `spring.datasource.*` | JDBC URL, username, password, Hikari pool settings | (see application.yml) |
| `spring.jpa.hibernate.ddl-auto` | Schema update strategy | `update` |
| `spring.data.redis.*` | Redis connection and Lettuce pool | (see application.yml) |
| `jwt.secret` | JWT signing secret | (see application.yml) |
| `jwt.expiration` | JWT validity in milliseconds | `86400000` (24h) |
| `payment.gateway.enabled` | Enable payment gateway | `false` |
| `payment.gateway.provider` | Provider: `mock`, `stripe`, `paypal`, etc. | `mock` |
| `logistics.weight-multiplier` | Cost per kg for delivery calculation | `2.5` |
| `file.storage-type` | `local` or `s3` | `local` |
| `file.upload-dir` | Local upload directory (when storage-type=local) | `uploads` |
| `file.s3.*` | S3 bucket, region, endpoint-override, access-key, secret-key, public-base-url | (see application.yml comments) |
| `app.cors.allowed-origins` | CORS allowed origins (comma-separated) | localhost origins |
| `app.security.hsts-enabled` | Enable HSTS | `false` |
| `springdoc.api-docs.path` | OpenAPI docs path | `/v3/api-docs` |
| `springdoc.swagger-ui.path` | Swagger UI path | `/swagger-ui.html` |

## Module-specific notes

- **bulkby-auth**: Uses `jwt.*` and Redis for rate limiting/sessions.
- **bulkby-order**: Uses datasource and Redis; no separate config block.
- **bulkby-app**: Aggregates config; file storage (`file.*`), CORS (`app.cors`), and security (`app.security`) are applied here.

When adding new environment variables or feature flags, update this file and `application.yml` (including comments) so they are easy to discover.
