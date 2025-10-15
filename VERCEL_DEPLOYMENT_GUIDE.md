# Vercel Deployment Guide

## 🚀 Backend Deployment (Vercel)

### 1. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```bash
NODE_ENV=
PORT=
API_VERSION=v1

# Database
MONGODB_URI=
DB_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# CORS - Update with your actual frontend URLs
CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Swagger
SWAGGER_TITLE=School Management API
SWAGGER_DESCRIPTION=Multi-tenant school management system API
SWAGGER_VERSION=1.0.0
```

### 2. Deployment Commands

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### 3. API Endpoints Available

#### Authentication

- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

#### Role Management (NEW)

- `GET /api/v1/users/available-roles` - Get roles user can create
- `POST /api/v1/users` - Create user with role validation
- `PATCH /api/v1/users/:id/role` - Update user role
- `POST /api/v1/users/bulk-create` - Bulk create users
- `GET /api/v1/users/role-hierarchy` - Get role hierarchy info

#### Audit System (NEW)

- `GET /api/v1/audit/logs` - Get audit logs
- `GET /api/v1/audit/stats` - Get audit statistics
- `GET /api/v1/audit/export` - Export audit logs to CSV
- `GET /api/v1/audit/critical` - Get critical security events

#### Documentation

- `GET /api-docs` - Swagger API documentation
- `GET /health` - Health check endpoint

### 4. Testing the Deployment

#### Check Health

```bash
curl https://your-backend-url.vercel.app/health
```

#### Check API Documentation

Visit: `https://your-backend-url.vercel.app/api-docs`

#### Test CORS

```bash
curl -H "Origin: https://your-frontend-url.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-backend-url.vercel.app/api/v1/health
```

### 5. Troubleshooting

#### Swagger Not Loading

- Check CSP headers in browser console
- Verify `/api-docs` route is accessible
- Check Vercel function logs

#### CORS Issues

- Verify CORS_ORIGIN environment variable includes your frontend URL
- Check browser network tab for preflight requests
- Ensure credentials are set correctly

#### Database Connection

- Verify MongoDB URI is correct
- Check Vercel function logs for connection errors
- Ensure IP whitelist includes Vercel IPs (0.0.0.0/0 for all)

### 6. Role Hierarchy System

#### Default Role Levels

```
Super Admin (5) → Can create: Manager, Admin, Tenant Admin, Teacher, Student, Parent
Manager (4) → Can create: Admin, Tenant Admin, Teacher, Student, Parent
Admin (2) → Can create: Teacher, Student, Parent
Tenant Admin (3) → Can create: Admin, Teacher, Student, Parent (within tenant)
Teacher (1) → Cannot create users
Student/Parent (0) → Cannot create users
```

#### Creating Initial Super Admin

```bash
# Use MongoDB Compass or CLI to create first super admin
db.users.insertOne({
  tenant: "system",
  firstName: "Super",
  lastName: "Admin",
  email: "admin@system.com",
  password: "$2a$12$hashedpassword", // Use bcrypt to hash
  role: "super_admin",
  roleLevel: 5,
  roleScope: "global",
  managedTenants: [],
  permissions: [],
  isActive: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🎯 Frontend Deployment (Vercel)

### 1. Environment Variables

```bash
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api/v1
VITE_APP_NAME=School Management System
VITE_NODE_ENV=production
VITE_ENABLE_DEMO_MODE=true
```

### 2. Build Configuration

Update `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

## 🔧 Local Development Setup

### Backend

```bash
cd Multi-tenancy-School-Management-System-Backend-main
npm install
npm run dev
```

### Frontend

```bash
cd Multi-tenancy-School-Management-System-Frontend-test
npm install
npm run dev
```

## 📊 System Status

✅ **Backend Features Complete:**

- Hierarchical role management system
- Comprehensive audit logging
- Enhanced JWT tokens with role data
- Permission-based middleware
- CORS configured for production and development
- Swagger documentation with proper CSP headers

✅ **Frontend Features Complete:**

- Role-based component rendering
- User management interface
- Audit dashboard
- Dynamic navigation based on permissions
- Role hierarchy utilities

✅ **Security Features:**

- Multi-level role hierarchy
- Tenant isolation
- Audit trail for all administrative actions
- Permission validation at API level
- Real-time security monitoring

The system is now production-ready with enterprise-level security and comprehensive role management!
