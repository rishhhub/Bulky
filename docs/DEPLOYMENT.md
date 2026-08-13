# BulkBy Deployment Guide

This document outlines the deployment expectations for the BulkBy project and provides a practical path for running it in a staging or production environment.

## Deployment Overview

BulkBy is structured as a multi-module backend and multi-app frontend. The deployment process is therefore split into:

1. Java backend modules packaged as a Spring Boot application
2. frontend workspace packages built and served as static assets or hosting apps
3. PostgreSQL and Redis infrastructure for runtime data

## Recommended Production Architecture

```text
Internet
  ├── User frontend (React build)
  ├── Admin frontend (React build)
  ├── Seller frontend (React build)
  └── Backend API (Spring Boot)
        ├── PostgreSQL
        ├── Redis
        └── object storage / uploads
```

## Backend Deployment

### Build the backend

```bash
mvn clean package -DskipTests
```

### Run the packaged application

```bash
java -jar bulkby-app/target/bulkby-app-*.jar
```

### Production config recommendations

- use environment variables instead of hard-coded secrets
- set strong JWT secret values
- disable mock payment flows in production
- configure CORS to allow only approved domains
- use PostgreSQL service credentials that match the target environment

## Frontend Deployment

From the frontend directory:

```bash
npm install
npm run build
```

This creates production assets for the workspace apps. Hosting choices include:

- Vercel
- Netlify
- Nginx + static hosting
- CDN-backed deployment

## Environment Variables for Deployment

Use the following configuration pattern when deploying:

```bash
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_DB=bulkby
POSTGRES_USER=bulkby_user
POSTGRES_PASSWORD=strong-password
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=replace-with-strong-random-value
```

See [CONFIG.md](../CONFIG.md) for the full list.

## Domain and Security Notes

- set `app.cors.allowed-origins` to specific production URLs only
- enable HTTPS with a valid certificate
- configure secure cookies and token storage for browser clients when using production auth
- protect upload directories and file storage buckets

## CI/CD Suggestion

A simple GitHub Actions flow can include:

1. checkout repository
2. install Java + Node toolchains
3. run Maven tests and frontend build
4. package backend
5. deploy to container orchestration or static hosting

## Docker / Container Option

If desired, the project can later be containerized with separate services for:

- backend
- frontend
- PostgreSQL
- Redis

This is a natural next step if the monolith is later split into independent services.

## Checklist Before Going Live

- confirm database credentials and schema migration settings
- enable production-safe JWT secret
- configure payment gateway integration if needed
- verify upload storage path or S3 configuration
- validate admin role creation and login flow
- test CORS, security headers, and API routes

## Related Docs

- [SETUP.md](SETUP.md)
- [CONFIG.md](../CONFIG.md)
- [ADMIN_SETUP.md](../ADMIN_SETUP.md)
