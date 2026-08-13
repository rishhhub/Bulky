---
name: Frontend Refactor and Admin Module Separation
overview: Refactor frontend into monorepo structure with shared package, separate user-app and admin-app modules. Admin app will be independently deployable while sharing common components, hooks, services, and utilities.
todos:
  - id: shared-package-structure
    content: Create packages/shared directory structure with package.json and exports configuration
    status: completed
  - id: ui-components
    content: Extract UI components (Button, Card, Modal, Input, Select, LoadingSpinner, Badge, Tabs) to packages/shared/components/ui/
    status: completed
    dependencies:
      - shared-package-structure
  - id: form-components
    content: Extract form components (FormField, FormSelect, FormTextarea, FormCheckbox) to packages/shared/components/forms/
    status: completed
    dependencies:
      - ui-components
  - id: feature-components
    content: Extract feature components (NotificationPanel, TrackingDisplay, ProductCard, InterestCard, CategoryTree) to packages/shared/components/features/
    status: completed
    dependencies:
      - ui-components
  - id: custom-hooks
    content: Create custom hooks (useNotifications, useTracking, useForm, useApi) in packages/shared/hooks/
    status: completed
    dependencies:
      - shared-package-structure
  - id: organize-services
    content: Create new services (orders.js, notifications.js, warehouses.js, payments.js) and refactor existing services in packages/shared/services/
    status: completed
    dependencies:
      - shared-package-structure
  - id: create-utils
    content: Create utility files (formatters.js, validators.js, constants.js) in packages/shared/utils/
    status: completed
    dependencies:
      - shared-package-structure
  - id: extract-styles
    content: Extract shared styles (variables.css, mixins.css) to packages/shared/styles/
    status: completed
    dependencies:
      - shared-package-structure
  - id: user-app-structure
    content: Create packages/user-app structure with package.json and vite.config.js
    status: completed
    dependencies:
      - shared-package-structure
  - id: migrate-user-pages
    content: Move user pages (Dashboard, ProductList, ProductDetail, Login, Register) to packages/user-app/src/pages/
    status: completed
    dependencies:
      - user-app-structure
  - id: refactor-dashboard
    content: Refactor Dashboard.jsx to use shared components and hooks
    status: completed
    dependencies:
      - migrate-user-pages
      - feature-components
      - custom-hooks
  - id: refactor-product-list
    content: Refactor ProductList.jsx to use shared components
    status: completed
    dependencies:
      - migrate-user-pages
      - feature-components
      - form-components
  - id: refactor-product-detail
    content: Refactor ProductDetail.jsx to use shared components and hooks
    status: completed
    dependencies:
      - migrate-user-pages
      - feature-components
      - form-components
      - custom-hooks
  - id: refactor-auth-pages
    content: Refactor Login/Register pages to use shared form components and useForm hook
    status: completed
    dependencies:
      - migrate-user-pages
      - form-components
      - custom-hooks
  - id: admin-app-structure
    content: Create packages/admin-app structure with package.json and vite.config.js
    status: completed
    dependencies:
      - shared-package-structure
  - id: migrate-admin-pages
    content: Move admin pages (AdminDashboard, OrderDetail) to packages/admin-app/src/pages/
    status: completed
    dependencies:
      - admin-app-structure
  - id: admin-components
    content: Create admin-specific components (ProductForm, WarehouseForm, CategoryForm, OrderGroupCard, SellerOrderForm, InventoryView)
    status: completed
    dependencies:
      - migrate-admin-pages
      - form-components
      - ui-components
  - id: refactor-admin-dashboard
    content: Break AdminDashboard.jsx into tab components (ProductsTab, OrdersTab, PendingInterestsTab, WarehousesTab, CategoriesTab)
    status: completed
    dependencies:
      - migrate-admin-pages
      - admin-components
      - ui-components
      - custom-hooks
  - id: refactor-order-detail
    content: Break OrderDetail.jsx into view components (OrderOverview, OrderItemsView, WarehouseGroupsView, CityGroupsView, SellerOrderView, InventoryView)
    status: completed
    dependencies:
      - migrate-admin-pages
      - admin-components
      - ui-components
  - id: root-package-config
    content: Create root package.json with workspace configuration and build scripts
    status: completed
    dependencies:
      - user-app-structure
      - admin-app-structure
  - id: vite-configs
    content: Configure Vite for both apps with path aliases and separate build outputs
    status: completed
    dependencies:
      - root-package-config
  - id: update-routing
    content: Update routing for both apps with separate route configurations
    status: completed
    dependencies:
      - refactor-dashboard
      - refactor-admin-dashboard
  - id: testing-validation
    content: Test all user and admin flows, verify shared components work in both apps
    status: completed
    dependencies:
      - update-routing
      - refactor-order-detail
  - id: cleanup-old-structure
    content: Remove old frontend/src structure and update documentation
    status: completed
    dependencies:
      - testing-validation
---

# Frontend Refactor and Admin Module Separation

## Current Issues

- Large monolithic page components (AdminDashboard: 1738 lines, OrderDetail: 797 lines)
- Code duplication (notifications, forms, formatting utilities)
- No reusable UI components
- Inline styles scattered throughout
- Services not fully organized (missing orders, notifications, warehouses services)
- No custom hooks for common patterns
- Admin and user features mixed in same codebase

## Target Structure

```
frontend/
├── packages/
│   ├── shared/                    # Shared code between apps
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/              # Basic UI (Button, Card, Modal, Input, etc.)
│   │   │   ├── forms/           # Form components (FormField, FormSelect, etc.)
│   │   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   │   └── features/        # Feature-specific (NotificationPanel, TrackingDisplay, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useNotifications.js
│   │   │   ├── useTracking.js
│   │   │   ├── useForm.js
│   │   │   └── useApi.js
│   │   ├── services/            # API services
│   │   │   ├── api.js          # Base API client
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── orders.js       # NEW
│   │   │   ├── notifications.js # NEW
│   │   │   ├── warehouses.js   # NEW
│   │   │   └── payments.js     # NEW
│   │   ├── utils/               # Utility functions
│   │   │   ├── formatters.js  # formatCurrency, formatDate, etc.
│   │   │   ├── validators.js    # Form validation
│   │   │   └── constants.js    # Status enums, colors, etc.
│   │   └── styles/              # Shared styles
│   │       ├── variables.css
│   │       └── mixins.css
│   ├── user-app/                # Main user-facing application
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── ProductDetail.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── components/      # App-specific components
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   └── admin-app/               # Admin application (separate deployable)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── AdminDashboard.jsx
│       │   │   └── OrderDetail.jsx
│       │   ├── components/      # Admin-specific components
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── package.json
│       └── vite.config.js
├── package.json                 # Root package.json (workspace)
└── README.md
```

## Implementation Steps

### Phase 1: Create Shared Package Structure

1. **Create `packages/shared` directory structure**

   - Set up package.json for shared package
   - Configure exports for components, hooks, services, utils

2. **Extract UI Components** (`packages/shared/components/ui/`)

   - `Button.jsx` - Reusable button with variants
   - `Card.jsx` - Card container component
   - `Modal.jsx` - Modal/dialog component
   - `Input.jsx` - Text input with validation
   - `Select.jsx` - Dropdown select
   - `LoadingSpinner.jsx` - Loading indicator
   - `Badge.jsx` - Status badges
   - `Tabs.jsx` - Tab navigation component

3. **Extract Form Components** (`packages/shared/components/forms/`)

   - `FormField.jsx` - Label + Input wrapper
   - `FormSelect.jsx` - Label + Select wrapper
   - `FormTextarea.jsx` - Label + Textarea wrapper
   - `FormCheckbox.jsx` - Checkbox with label

4. **Extract Feature Components** (`packages/shared/components/features/`)

   - `NotificationPanel.jsx` - Notification dropdown/panel
   - `TrackingDisplay.jsx` - Order tracking timeline
   - `ProductCard.jsx` - Product display card
   - `InterestCard.jsx` - Interest display card
   - `CategoryTree.jsx` - Hierarchical category display

5. **Create Custom Hooks** (`packages/shared/hooks/`)

   - `useNotifications.js` - Notification state and polling
   - `useTracking.js` - Tracking data fetching
   - `useForm.js` - Form state management
   - `useApi.js` - API call wrapper with loading/error states

6. **Organize Services** (`packages/shared/services/`)

   - Create `orders.js` - Order/Interest API calls
   - Create `notifications.js` - Notification API calls
   - Create `warehouses.js` - Warehouse API calls
   - Create `payments.js` - Payment API calls
   - Refactor existing `products.js`, `auth.js`, `api.js`

7. **Create Utilities** (`packages/shared/utils/`)

   - `formatters.js` - formatCurrency, formatDate, formatDateTime
   - `validators.js` - email, required, min/max validators
   - `constants.js` - Status enums, interest statuses, order statuses, colors

8. **Extract Styles** (`packages/shared/styles/`)

   - CSS variables for colors, spacing, typography
   - Common mixins/utilities

### Phase 2: Refactor User App

1. **Update `packages/user-app` structure**

   - Move existing pages from `frontend/src/pages/` to `packages/user-app/src/pages/`
   - Create `package.json` with dependency on shared package
   - Create `vite.config.js` for user app

2. **Refactor Dashboard.jsx**

   - Extract InterestCard component
   - Use NotificationPanel component
   - Use TrackingDisplay component
   - Use useNotifications hook
   - Use useTracking hook
   - Replace inline styles with shared components

3. **Refactor ProductList.jsx**

   - Extract ProductCard component
   - Extract CategoryTree component
   - Extract SearchFilters component
   - Use shared form components

4. **Refactor ProductDetail.jsx**

   - Extract ProductImageGallery component
   - Extract ReviewList component
   - Extract OrderForm component
   - Use shared form components and hooks

5. **Refactor Login/Register**

   - Use shared form components
   - Use useForm hook
   - Extract AuthForm component

### Phase 3: Create Admin App Module

1. **Create `packages/admin-app` structure**

   - Create directory structure
   - Create `package.json` with dependency on shared package
   - Create `vite.config.js` for admin app
   - Create separate build configuration

2. **Move Admin Pages**

   - Move `AdminDashboard.jsx` to `packages/admin-app/src/pages/`
   - Move `OrderDetail.jsx` to `packages/admin-app/src/pages/`

3. **Create Admin-Specific Components** (`packages/admin-app/src/components/`)

   - `ProductForm.jsx` - Product create/edit form
   - `WarehouseForm.jsx` - Warehouse create/edit form
   - `CategoryForm.jsx` - Category create/edit form
   - `OrderGroupCard.jsx` - Order group display
   - `SellerOrderForm.jsx` - Seller order form
   - `InventoryView.jsx` - Inventory management view

4. **Refactor AdminDashboard.jsx**

   - Break into smaller components:
     - `ProductsTab.jsx`
     - `OrdersTab.jsx`
     - `PendingInterestsTab.jsx`
     - `WarehousesTab.jsx`
     - `CategoriesTab.jsx`
   - Use shared components (Card, Modal, Tabs, etc.)
   - Use shared hooks (useNotifications, useForm)
   - Extract form logic into separate components

5. **Refactor OrderDetail.jsx**

   - Extract `OrderOverview.jsx`
   - Extract `OrderItemsView.jsx`
   - Extract `WarehouseGroupsView.jsx`
   - Extract `CityGroupsView.jsx`
   - Extract `SellerOrderView.jsx`
   - Extract `InventoryView.jsx`
   - Use shared components and hooks

### Phase 4: Setup Monorepo and Build Configuration

1. **Root Package Configuration**

   - Create root `package.json` with workspace configuration
   - Add scripts for building both apps
   - Add scripts for development (concurrent dev servers)

2. **Vite Configuration**

   - Configure shared package as dependency
   - Setup path aliases for imports (`@shared`, `@user-app`, `@admin-app`)
   - Configure separate build outputs for user-app and admin-app
   - Setup proxy configuration for API calls

3. **Build & Deployment Configuration**

   - Create separate build scripts for each app
   - Configure environment variables for each app
   - Setup deployment configurations (Docker, CI/CD)
   - Create separate dist folders for each app

### Phase 5: Migration & Testing

1. **Gradual Migration Strategy**

   - Keep existing `frontend/` structure during migration
   - Migrate one component/page at a time
   - Test each migration step
   - Update imports incrementally

2. **Update Routing**

   - Separate routing for user-app and admin-app
   - Update route guards (PrivateRoute, AdminRoute)
   - Configure base paths for deployment

3. **Testing & Validation**

   - Test all user flows in user-app
   - Test all admin flows in admin-app
   - Verify shared components work in both apps
   - Test build and deployment processes

4. **Cleanup**

   - Remove old `frontend/src` structure after migration
   - Update documentation
   - Update README with new structure

## Key Files to Create/Modify

### Shared Package

- `packages/shared/package.json` - Package configuration
- `packages/shared/components/ui/*.jsx` - UI components
- `packages/shared/components/forms/*.jsx` - Form components
- `packages/shared/components/features/*.jsx` - Feature components
- `packages/shared/hooks/*.js` - Custom hooks
- `packages/shared/services/*.js` - API services
- `packages/shared/utils/*.js` - Utility functions
- `packages/shared/styles/*.css` - Shared styles

### User App

- `packages/user-app/package.json` - User app dependencies
- `packages/user-app/vite.config.js` - Vite config for user app
- `packages/user-app/src/App.jsx` - User app routing
- `packages/user-app/src/pages/*.jsx` - Refactored user pages

### Admin App

- `packages/admin-app/package.json` - Admin app dependencies
- `packages/admin-app/vite.config.js` - Vite config for admin app
- `packages/admin-app/src/App.jsx` - Admin app routing
- `packages/admin-app/src/pages/*.jsx` - Refactored admin pages
- `packages/admin-app/src/components/*.jsx` - Admin-specific components

### Root

- `frontend/package.json` - Workspace root configuration
- `frontend/README.md` - Updated documentation

## Benefits

1. **Code Reusability**: Shared components, hooks, and utilities reduce duplication
2. **Maintainability**: Smaller, focused components are easier to maintain
3. **Separation of Concerns**: Admin and user apps are independent
4. **Independent Deployment**: Admin app can be deployed separately
5. **Better Organization**: Clear structure with logical grouping
6. **Scalability**: Easy to add new features or apps
7. **Developer Experience**: Better code organization and reusability

## Migration Notes

- Start with Phase 1 (shared package) as it's the foundation
- Test shared components thoroughly before using in apps
- Migrate pages incrementally to avoid breaking changes
- Keep old structure until migration is complete
- Update imports gradually using find/replace