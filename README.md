# BulkBy - Bulk Order Platform

A full-stack platform for bulk ordering where users can express interest in products and collectively reach minimum order quantities.

## Tech Stack

- **Backend**: Spring Boot 3.2, Java 21, Spring Security, JPA, H2 Database
- **Frontend**: React 18, Vite, React Router
- **API Documentation**: Swagger/OpenAPI (SpringDoc)

## Prerequisites

- **Java 21+** - Download from [adoptium.net](https://adoptium.net/)
- **Maven 3.8+** - Usually comes with IDE or download from [maven.apache.org](https://maven.apache.org/)
- **Node.js 18+ and npm 9+** - Download from [nodejs.org](https://nodejs.org/) (for frontend)

## Quick Start

### Backend Setup

1. **Start the Spring Boot application:**

```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies (first time only):**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Access Points

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **H2 Console**: http://localhost:8080/api/h2-console
  - JDBC URL: `jdbc:h2:mem:bulkby`
  - Username: `sa`
  - Password: (leave empty)

## Features

- User registration and authentication (JWT)
- Product listing and management
- Express interest with 10% deposit
- Logistics options (Delivery/Pickup)
- Period expiration and extension
- Auto-refund after 24 hours of no response
- Threshold monitoring for order groups
- Payment collection workflow
- Admin dashboard

## Development

### Backend
- Main application: `src/main/java/org/bulkby/BulkByApplication.java`
- API endpoints are RESTful and documented in Swagger

### Frontend
- Entry point: `frontend/src/main.jsx`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- Services: `frontend/src/services/`

## Database

Currently using H2 in-memory database. Data persists only while the application is running.

To switch to PostgreSQL:
1. Update `pom.xml` to use PostgreSQL driver
2. Update `application.yml` with PostgreSQL connection details
3. Create database `bulkby`

## API Documentation

Once the backend is running, access Swagger UI at:
http://localhost:8080/api/swagger-ui.html

You can test all endpoints directly from Swagger UI. Use the "Authorize" button to add your JWT token for authenticated endpoints.

## Default Configuration

- JWT Secret: Set via `JWT_SECRET` environment variable or use default
- Database: H2 in-memory
- Ports: Backend 8080, Frontend 3000
