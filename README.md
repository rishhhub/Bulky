# BulkBy

BulkBy is a full-stack bulk-ordering platform that helps buyers, sellers, and admins coordinate collective purchasing, threshold-based orders, payments, and logistics from a single system.

## Overview

The project combines:

- a modular Java backend built with Spring Boot
- a React monorepo frontend with user, seller, and admin apps
- role-based workflows for buyers, sellers, and administrators
- order grouping, product catalog, authentication, payments, and logistics support

## Architecture

```text
BulkBy/
├── bulkby-app/                 # Spring Boot application bootstrap and API layer
├── bulkby-auth/                # Auth, users, security, profiles
├── bulkby-catalog/             # Products, categories, reviews
├── bulkby-order/               # Interests, orders, order groups, tracking
├── bulkby-logistics/           # Warehouses, logistics, addresses
├── bulkby-payment/             # Payments and transaction handling
├── bulkby-notification/        # Notifications and messaging support
├── bulkby-common/              # Shared utilities and common exception handling
├── frontend/                   # React workspace with multiple apps
├── docs/                       # Project docs and guides
├── README.md                   # Project landing documentation
├── CONFIG.md                   # Configuration reference
├── ADMIN_SETUP.md              # Admin setup instructions
├── MIGRATION_GUIDE.md          # Migration notes
├── pom.xml                     # Parent Maven configuration
└── project-showcase.html       # Git-friendly HTML project presentation
```

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2
- Spring Security
- Spring Data JPA
- PostgreSQL-ready configuration
- Redis support
- SpringDoc OpenAPI / Swagger

### Frontend
- React 18
- Vite
- React Router
- Monorepo app structure

## Core Features

- buyer product discovery and bulk demand capture
- seller catalog and fulfillment management
- admin oversight of products, sellers, logistics, and orders
- interest tracking with thresholds and order lifecycle flows
- payment, financial tracking, and transaction support
- notification, file upload, and role-based access infrastructure

## Prerequisites

Install the following before running the project:

- Java 17 or newer
- Maven 3.8+
- Node.js 18+
- npm 9+
- PostgreSQL and Redis for full local runtime parity

## Quick Start

### 1) Build backend

```bash
mvn clean install
```

### 2) Run backend

```bash
cd bulkby-app
mvn spring-boot:run
```

The API will run at:

- http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html

### 3) Run frontend apps

```bash
cd frontend
npm install
npm run dev:user
```

Optional app commands:

```bash
npm run dev:admin
npm run dev:seller
```

Frontend URLs:

- User app: http://localhost:3000
- Admin app: http://localhost:3001
- Seller app: http://localhost:3002

## Environment and Configuration

The project configuration lives in:

- [CONFIG.md](CONFIG.md)
- [bulkby-app/src/main/resources/application.yml](bulkby-app/src/main/resources/application.yml)

Common environment variables include:

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

## Admin Setup

Default or bootstrap admin setup is documented here:

- [ADMIN_SETUP.md](ADMIN_SETUP.md)

## Documentation

- [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)
- [docs/SETUP.md](docs/SETUP.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- [CONFIG.md](CONFIG.md)

## GitHub Presentation

A simple HTML showcase page is included for previewing the project on GitHub or in a browser:

- [project-showcase.html](project-showcase.html)

## Project Status

This repository is a working modular monolith codebase intended for local development, demos, and GitHub hosting. It includes backend services, frontend apps, and supporting documentation to make the project easier to understand and present externally.

## License

This project does not specify a license file yet. Add a license before public production release if you plan to distribute it externally.
