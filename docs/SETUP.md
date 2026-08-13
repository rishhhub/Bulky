# BulkBy Setup Guide

This guide explains how to set up the BulkBy project locally for development and testing.

## Prerequisites

Before running the app, make sure you have:

- Java 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- PostgreSQL 14+ or a configured local database environment
- Redis (optional but recommended for full runtime parity)

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd BulkBy
```

## 2. Backend Setup

### Install Java dependencies

```bash
mvn clean install
```

### Run the backend

```bash
cd bulkby-app
mvn spring-boot:run
```

The backend will start with the API context path at:

- http://localhost:8080/api

Swagger UI is available at:

- http://localhost:8080/api/swagger-ui.html

## 3. Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

Run each app separately:

```bash
npm run dev:user
```

```bash
npm run dev:admin
```

```bash
npm run dev:seller
```

You can also run the default user app:

```bash
npm run dev
```

## 4. Environment Variables

The application reads environment variables from the runtime shell or environment configuration. Common variables include:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=bulkby
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345678
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
```

See [CONFIG.md](../CONFIG.md) for the full configuration reference.

## 5. Default Admin Access

The project includes admin bootstrapping guidance. For local development, you can log in using the default admin credentials described in [ADMIN_SETUP.md](../ADMIN_SETUP.md).

## 6. Common Issues

### Maven dependency resolution issues

```bash
mvn -U clean install
```

### Frontend workspace install fails

```bash
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues

- confirm PostgreSQL is running
- check database name and credentials in application.yml
- ensure the user has privileges to create/update schema if ddl-auto is enabled

## 7. Useful URLs

- Frontend user app: http://localhost:3000
- Frontend admin app: http://localhost:3001
- Frontend seller app: http://localhost:3002
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html

## 8. Next Step

After setup, review the project overview and deployment guidance in the docs folder.
