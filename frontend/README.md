# BulkBy Frontend

This is a monorepo structure for the BulkBy frontend application, containing a shared package and two separate applications: user-app and admin-app.

## Structure

```
frontend/
├── packages/
│   ├── shared/              # Shared code between apps
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Shared styles
│   ├── user-app/            # Main user-facing application
│   └── admin-app/           # Admin application (separate deployable)
├── package.json             # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

Install dependencies for all packages:

```bash
npm install
```

### Development

#### Run User App (Port 3000)

```bash
cd packages/user-app
npm run dev
```

#### Run Admin App (Port 3001)

```bash
cd packages/admin-app
npm run dev
```

#### Run Both Apps Concurrently

From the root directory:

```bash
npm run dev
```

## Building

### Build User App

```bash
cd packages/user-app
npm run build
```

### Build Admin App

```bash
cd packages/admin-app
npm run build
```

### Build Both Apps

From the root directory:

```bash
npm run build
```

## Package Structure

### Shared Package (`packages/shared`)

Contains reusable components, hooks, services, and utilities used by both applications:

- **Components**: UI components (Button, Card, Modal, etc.), form components, and feature components
- **Hooks**: Custom React hooks (useNotifications, useTracking, useForm, useApi)
- **Services**: API service modules (auth, products, orders, notifications, etc.)
- **Utils**: Formatters, validators, and constants
- **Styles**: Shared CSS variables and mixins

### User App (`packages/user-app`)

Main user-facing application with:
- Product browsing and search
- User dashboard with interests
- Order tracking
- Authentication

### Admin App (`packages/admin-app`)

Admin application with:
- Product management
- Order group management
- Warehouse management
- Category management
- Inventory tracking

## Accessing Admin Features

1. Log in as a user with `ADMIN` role
2. Click the "Admin Panel" link in the navigation (visible to admin users)
3. Or navigate to `http://localhost:3001/admin` directly

Make sure the admin app is running on port 3001.

## Development Notes

- Both apps share code from the `packages/shared` package
- Use path alias `@shared` to import from the shared package
- Each app has its own Vite configuration and build output
- The admin app can be deployed independently from the user app

## Migration Status

✅ All components have been migrated to the new structure
✅ Shared package is fully set up
✅ Both apps are functional and using shared components
✅ Old `frontend/src` structure can be removed
