# 🚀 Deployment Guide

## Vercel Deployment

### Backend Deployment

1. **Connect to Vercel**

   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy Backend**

   ```bash
   cd Multi-tenancy-School-Management-System-Backend-main
   vercel --prod
   ```

3. **Environment Variables**
   Set these in Vercel Dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

### Frontend Deployment

1. **Deploy Frontend**

   ```bash
   cd Multi-tenancy-School-Management-System-Frontend-test
   vercel --prod
   ```

2. **Environment Variables**
   Set in Vercel Dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api/v1
   ```

## Alternative Deployment Options

### Docker Deployment

1. **Backend**

   ```bash
   cd Multi-tenancy-School-Management-System-Backend-main
   docker build -t school-backend .
   docker run -p 3000:3000 school-backend
   ```

2. **Frontend**
   ```bash
   cd Multi-tenancy-School-Management-System-Frontend-test
   docker build -t school-frontend .
   docker run -p 5173:5173 school-frontend
   ```

### Railway Deployment

1. Install Railway CLI
2. Connect your GitHub repo
3. Set environment variables
4. Deploy with one click

### Render Deployment

1. Connect GitHub repository
2. Set build and start commands
3. Configure environment variables
4. Deploy

## Database Setup

### MongoDB Atlas (Recommended)

1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Add to MONGODB_URI environment variable

### Local MongoDB

```bash
# Install MongoDB
# Windows: Download from mongodb.com
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod
```

## Environment Variables Reference

### Backend (.env)

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend (.env)

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_APP_NAME=School Management System
```

## Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Frontend loads correctly
- [ ] Database connection works
- [ ] Authentication flow works
- [ ] API documentation is available
- [ ] CORS is properly configured
- [ ] Environment variables are set
- [ ] SSL certificates are active
- [ ] Domain names are configured

## Monitoring & Maintenance

### Health Checks

- Backend: `GET /api/v1/health`
- Database: Monitor connection status
- Frontend: Check loading and navigation

### Logs

- Check Vercel function logs
- Monitor database performance
- Track API response times

### Updates

```bash
# Update backend
git push origin main

# Update frontend
git push origin main
```

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Update CORS_ORIGIN in backend environment
   - Ensure frontend domain is whitelisted

2. **Database Connection**

   - Check MongoDB Atlas IP whitelist
   - Verify connection string format

3. **Environment Variables**

   - Ensure all required variables are set
   - Check for typos in variable names

4. **Build Failures**
   - Check TypeScript compilation
   - Verify all dependencies are installed

### Support

- Check logs in Vercel dashboard
- Review environment variable configuration
- Test API endpoints individually
