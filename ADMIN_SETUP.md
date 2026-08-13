# Admin User Setup

## Automatic Admin Creation

**The admin user is automatically created when the application starts!**

Default admin credentials:
- **Email**: `admin@rish.com`
- **Password**: `password`

Simply start the application and login with these credentials to access the admin panel.

---

## Manual Setup (Alternative Methods)

If you need to create additional admin users or the automatic creation didn't work, use one of these methods:

## Option 1: Using H2 Console

1. Start the application
2. Access H2 Console: http://localhost:8080/api/h2-console
3. Connect with:
   - JDBC URL: `jdbc:h2:mem:bulkby`
   - Username: `sa`
   - Password: (leave empty)
4. Run this SQL to update an existing user to ADMIN:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Or create a new admin user:

```sql
INSERT INTO users (email, password_hash, name, role, enabled, created_at)
VALUES (
  'admin@bulkby.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: admin123
  'Admin User',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP
);
```

## Option 2: Using Swagger API

1. Register a new user via `/api/auth/register`
2. Access H2 Console and update the role:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-registered-email@example.com';
```

## Option 3: Programmatic Setup (for development)

You can add a data initialization script or update the AuthService to create an admin user on startup.

## Default Admin Credentials (if using SQL above)

- Email: `admin@bulkby.com`
- Password: `admin123`

**Note**: The password hash above is for "admin123". Change it in production!

## Access Admin Panel

Once you have an admin user:
1. Login with admin credentials
2. Click "Admin Panel" link in the navigation (highlighted in yellow)
3. Or navigate to: http://localhost:3000/admin
