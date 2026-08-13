# BulkBy Project Overview

BulkBy is a bulk-ordering marketplace platform designed to help communities and buyers collectively meet minimum purchase thresholds for products. The platform supports buyer interest capture, seller fulfillment, payments, logistics coordination, and admin oversight from a modular Spring Boot backend and multi-app React frontend.

## Business Goal

The platform allows users to:

- discover products and categories
- express interest in bulk purchases before a threshold is reached
- confirm or cancel participation based on order lifecycle events
- track payment, delivery, and fulfillment status
- manage inventories and seller operations through role-based portals

## Core Features

### Buyer Experience
- product discovery and category browsing
- wishlist and interest tracking
- bulk threshold monitoring
- fulfillment and delivery selection
- order tracking and payment status visibility

### Seller Experience
- seller product management
- product approval and catalog management
- order fulfillment and shipment coordination
- performance and transaction visibility

### Admin Experience
- admin dashboard and moderation tools
- category and product management
- seller management
- warehouse and logistics controls
- financial monitoring and order oversight

### Platform Operations
- JWT-authenticated access control
- files upload handling
- notification workflow support
- modular service architecture for catalog, logistics, orders, and payments

## Architecture

The application is built as a modular monolith with a shared database and multiple Java modules.

```text
bulkby-parent
├── bulkby-app
│   ├── application bootstrap and configuration
│   └── shared API layer / controllers
├── bulkby-auth
│   └── authentication, users, roles, profiles
├── bulkby-catalog
│   └── products, reviews, categories
├── bulkby-order
│   └── interests, order groups, tracking, wishlist
├── bulkby-logistics
│   └── warehouses, addresses, delivery logic
├── bulkby-payment
│   └── payment status and payment orchestration
├── bulkby-notification
│   └── notifications and messaging
├── bulkby-common
│   └── shared exceptions, utilities, security helpers
└── frontend/
    ├── user-app
    ├── admin-app
    ├── seller-app
    └── shared
```

## Technology Stack

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
- Monorepo workspace packaging

## Default Runtime Configuration

The application is configured to run with:

- backend on port 8080
- API context path: /api
- frontend dev ports: 3000, 3001, and 3002 depending on app
- PostgreSQL by default, with local config values provided in application.yml

## Main User Roles

- Buyer
- Seller
- Admin
- Support / operations staff (depending on implementation and permissions)

## Project Status

This repository is set up as a working multi-module Java and React codebase with role-based frontends and modular backend services. It is suitable for local development, demos, and GitHub hosting.

## Related Documentation

- [README.md](../README.md)
- [SETUP.md](SETUP.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [ADMIN_SETUP.md](../ADMIN_SETUP.md)
- [CONFIG.md](../CONFIG.md)
