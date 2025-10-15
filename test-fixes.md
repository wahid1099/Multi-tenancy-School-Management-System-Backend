# Testing the Fixes

## 1. Test Swagger Documentation

### Local Testing

```bash
npm run dev
open http://localhost:5000/api-docs
```

### Production Testing

```bash
open https://multi-tenancy-school-management-sys.vercel.app/api-docs
```

**Expected Result:**

- Clean, embedded documentation page loads without MIME type errors
- No external asset loading issues
- All endpoints are documented

## 2. Test ObjectId Fix

### Create Demo Tenant

```bash
# Set your MongoDB URI
export MONGODB_URI="your-mongodb-connection-string"

# Run seeding script
npm run seed:demo
```

### Test Registration with Demo Tenant

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@demo.com",
    "password": "password123",
    "tenant": "demo-school"
  }'
```

**Expected Result:**

- No ObjectId casting error
- User registration succeeds
- Returns user data and JWT token

### Test Login with Demo Tenant

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@demo.com",
    "password": "password123",
    "tenant": "demo-school"
  }'
```

**Expected Result:**

- No ObjectId casting error
- Login succeeds
- Returns user data and JWT token

## 3. Test API Endpoints

### Health Check

```bash
curl https://multi-tenancy-school-management-sys.vercel.app/health
```

### API Info

```bash
curl https://multi-tenancy-school-management-sys.vercel.app/
```

### OpenAPI Spec

```bash
curl https://multi-tenancy-school-management-sys.vercel.app/api-docs.json
```

## 4. Frontend Integration Test

### Update Frontend Environment

Make sure your frontend `.env` has:

```
VITE_API_URL=https://multi-tenancy-school-management-sys.vercel.app
```

### Test Registration Flow

1. Go to signup page
2. Fill in user details
3. Submit form (uses "demo-school" as default tenant)
4. Should succeed without ObjectId errors

### Test Login Flow

1. Go to login page
2. Enter credentials
3. Submit form
4. Should succeed and redirect to dashboard

## 5. Verification Checklist

- [ ] Swagger documentation loads without MIME type errors
- [ ] Demo tenant exists in database
- [ ] Registration with "demo-school" works
- [ ] Login with "demo-school" works
- [ ] No ObjectId casting errors in logs
- [ ] Frontend can register/login successfully
- [ ] All API endpoints respond correctly

## 6. Common Issues and Solutions

### If Swagger still has issues:

- Clear browser cache
- Check browser console for any remaining errors
- Verify the embedded HTML is loading correctly

### If ObjectId errors persist:

- Ensure demo tenant was created: `db.tenants.findOne({subdomain: "demo-school"})`
- Check MongoDB connection
- Verify the tenant validation logic is working

### If database connection errors occur:

- Check MongoDB URI in environment variables
- Verify network connectivity to MongoDB
- Check Vercel function logs for connection timeouts
- The system now has automatic retry logic and connection pooling
- Health check endpoint shows database status: `/health`

### If frontend can't connect:

- Check CORS settings
- Verify API URL in frontend environment
- Check network tab for failed requests

## 7. Database Verification

### Check Demo Tenant

```javascript
// In MongoDB Compass or CLI
db.tenants.findOne({ subdomain: "demo-school" });
```

### Check Users

```javascript
// Find users in demo tenant
db.users.find({ tenant: "TENANT_ID_FROM_ABOVE" });
```

This comprehensive testing guide ensures all fixes are working correctly!
