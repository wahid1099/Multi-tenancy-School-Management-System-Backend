# 🎓 School Management System Backend

A comprehensive **multi-tenant school management system** built with Node.js, Express, TypeScript, and MongoDB. This production-ready backend provides complete academic, administrative, and financial management capabilities for educational institutions.

## 🌟 **Key Features**

### 🏢 **Multi-Tenant Architecture**

- **Complete Tenant Isolation**: Each school operates independently
- **Subdomain Support**: Access via custom subdomains (`school1.domain.com`)
- **Subscription Management**: Basic, Premium, Enterprise plans
- **Scalable Infrastructure**: Supports unlimited tenants

### 🔐 **Authentication & Security**

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: Admin, Tenant Admin, Teacher, Student, Parent roles
- **Account Security**: Login attempt limiting, account locking, password policies
- **Security Best Practices**: Helmet, CORS, rate limiting, input sanitization

### 📚 **Complete Academic Management**

- **Student Lifecycle**: Admission to graduation tracking
- **Class Management**: Sections, capacity, teacher assignments
- **Subject Organization**: Prerequisites, credits, categories
- **Attendance System**: Daily tracking, reports, analytics
- **Examination System**: Scheduling, question management, results
- **Grade Management**: Automated calculations, report cards
- **Timetable System**: Schedule creation with conflict detection

### 💰 **Financial Management**

- **Fee Structure**: Flexible fee components and terms
- **Payment Tracking**: Multiple payment methods support
- **Collection Reports**: Defaulter lists, collection analytics
- **Discount Management**: Student-specific discounts

### 📊 **Analytics & Reporting**

- **Role-Based Dashboards**: Customized views for each user type
- **Real-Time Statistics**: Live attendance, fee collection, academic metrics
- **Comprehensive Reports**: Academic performance, financial summaries
- **Activity Tracking**: System-wide activity monitoring

## 🚀 **Quick Start**

### **Option 1: Docker (Recommended)**

```bash
# Clone the repository
git clone https://github.com/your-username/school-management-backend.git
cd school-management-backend

# Start with Docker Compose
docker-compose up -d

# Access the system
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api-docs
```

### **Option 2: Local Development**

```bash
# Prerequisites: Node.js 18+, MongoDB 7.0+, Redis 7.0+

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start the application
npm run dev
```

## 📋 **Prerequisites**

- **Node.js** v18 or higher
- **MongoDB** v7.0 or higher
- **Redis** v7.0+ (optional but recommended)
- **Docker & Docker Compose** (for containerized deployment)

## 🏗️ **System Architecture**

### **Project Structure**

```
src/
├── app/                    # Express app configuration
├── config/                 # Environment & database config
├── docs/                   # Swagger API documentation
├── middlewares/            # Authentication, validation, error handling
├── modules/                # Feature modules (12 core modules)
│   ├── tenants/           # Multi-tenant management
│   ├── users/             # User authentication & management
│   ├── roles/             # Role & permission management
│   ├── subjects/          # Subject management
│   ├── classes/           # Class & section management
│   ├── students/          # Student records & profiles
│   ├── attendance/        # Attendance tracking
│   ├── exams/             # Examination system
│   ├── grades/            # Grade management
│   ├── timetables/        # Schedule management
│   ├── fees/              # Fee & payment management
│   └── dashboard/         # Analytics & dashboards
├── routes/                 # API route definitions
├── utils/                  # Utility functions & helpers
└── server.ts              # Application entry point
```

### **Module Structure** (Consistent across all modules)

```
module/
├── model.ts               # MongoDB schema with Mongoose
├── dto.ts                 # Joi validation schemas
├── service.ts             # Business logic layer
├── controller.ts          # HTTP request handlers
└── routes.ts              # Express route definitions
```

## 📚 **API Documentation**

### **Access Points**

- **Interactive API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/v1/health
- **API Base URL**: http://localhost:3000/api/v1

### **Authentication**

Include JWT token in requests:

```bash
Authorization: Bearer <your-jwt-token>
```

### **Multi-Tenant Access**

Specify tenant in one of these ways:

```bash
# Header
X-Tenant-ID: school-subdomain

# Query Parameter
?tenant=school-subdomain

# Subdomain (in production)
https://school-subdomain.yourdomain.com
```

## 🔗 **Complete API Endpoints**

### **🔐 Authentication & Users** (`/api/v1/users`)

```bash
POST   /register              # User registration
POST   /login                 # User authentication
POST   /logout                # User logout
GET    /me                    # Current user profile
PATCH  /me                    # Update profile
PATCH  /change-password       # Change password
POST   /forgot-password       # Request password reset
POST   /reset-password        # Reset password with token
GET    /stats                 # User statistics (Admin)
```

### **🏢 Multi-Tenant Management** (`/api/v1/tenants`)

```bash
POST   /                      # Create new tenant
GET    /                      # List all tenants (paginated)
GET    /:id                   # Get tenant details
PATCH  /:id                   # Update tenant
DELETE /:id                   # Delete tenant
PATCH  /:id/toggle-status     # Activate/deactivate tenant
GET    /stats                 # Tenant statistics
GET    /subdomain/:subdomain  # Get tenant by subdomain
```

### **🔑 Role Management** (`/api/v1/roles`)

```bash
POST   /                      # Create custom role
GET    /                      # List all roles
GET    /:id                   # Get role details
PATCH  /:id                   # Update role permissions
DELETE /:id                   # Delete role
PATCH  /:id/toggle-status     # Activate/deactivate role
```

### **📚 Academic Structure**

#### **Subjects** (`/api/v1/subjects`)

```bash
POST   /                      # Create subject
GET    /                      # List subjects (with filters)
GET    /:id                   # Get subject details
PATCH  /:id                   # Update subject
DELETE /:id                   # Delete subject
GET    /category/:category    # Get subjects by category
GET    /stats                 # Subject statistics
```

#### **Classes** (`/api/v1/classes`)

```bash
POST   /                      # Create class
GET    /                      # List classes
GET    /:id                   # Get class details
PATCH  /:id                   # Update class
DELETE /:id                   # Delete class
POST   /:id/students          # Add student to class
DELETE /:id/students          # Remove student from class
GET    /stats                 # Class statistics
```

#### **Students** (`/api/v1/students`)

```bash
POST   /                      # Register new student
GET    /                      # List students (with filters)
GET    /:id                   # Get student profile
PATCH  /:id                   # Update student
DELETE /:id                   # Delete student
PATCH  /:id/status            # Update student status
GET    /class/:classId        # Get students by class
GET    /stats                 # Student statistics
```

### **📊 Academic Operations**

#### **Attendance** (`/api/v1/attendance`)

```bash
POST   /                      # Record attendance
GET    /                      # List attendance records
GET    /:id                   # Get attendance details
PATCH  /:id                   # Update attendance
DELETE /:id                   # Delete attendance
PATCH  /:id/submit            # Submit attendance
GET    /report                # Generate attendance reports
GET    /stats                 # Attendance statistics
```

#### **Exams** (`/api/v1/exams`)

```bash
POST   /                      # Create exam
GET    /                      # List exams
GET    /:id                   # Get exam details
PATCH  /:id                   # Update exam
DELETE /:id                   # Delete exam
PATCH  /:id/publish           # Publish exam
GET    /upcoming              # Get upcoming exams
GET    /stats                 # Exam statistics
GET    /types                 # Exam statistics by type
```

#### **Grades** (`/api/v1/grades`)

```bash
POST   /                      # Record grades
GET    /                      # List grade records
GET    /:id                   # Get grade details
PATCH  /:id                   # Update grades
DELETE /:id                   # Delete grades
PATCH  /:id/publish           # Publish grades
GET    /student               # Get student grades
GET    /report                # Generate grade reports
GET    /stats                 # Grade statistics
```

#### **Timetables** (`/api/v1/timetables`)

```bash
POST   /                      # Create timetable
GET    /                      # List timetables
GET    /:id                   # Get timetable details
PATCH  /:id                   # Update timetable
DELETE /:id                   # Delete timetable
GET    /teacher               # Get teacher timetable
GET    /current/:classId      # Get current class timetable
GET    /stats                 # Timetable statistics
```

### **💰 Financial Management** (`/api/v1/fees`)

```bash
POST   /                      # Create fee structure
GET    /                      # List fee structures
GET    /:id                   # Get fee details
PATCH  /:id                   # Update fee structure
DELETE /:id                   # Delete fee structure
POST   /:id/payment           # Record payment
GET    /records               # List fee records
GET    /report                # Generate fee reports
GET    /stats                 # Fee statistics
```

### **📈 Analytics & Dashboard** (`/api/v1/dashboard`)

```bash
GET    /                      # Get role-based dashboard
GET    /admin                 # Admin dashboard
GET    /teacher               # Teacher dashboard
GET    /student               # Student dashboard
```

## 🔧 **Configuration**

### **Environment Variables**

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/school_management
DB_NAME=school_management

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional Services
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 **Deployment**

### **Docker Deployment (Recommended)**

```bash
# Production deployment
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up -d

# With Nginx reverse proxy
docker-compose --profile production up -d
```

### **Manual Deployment**

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start dist/server.js --name school-management-api
```

### **CI/CD Pipeline**

The project includes GitHub Actions workflow for:

- ✅ **Automated Testing**: Unit tests, integration tests, linting
- 🔒 **Security Scanning**: Vulnerability checks, dependency audits
- 🐳 **Docker Build**: Multi-platform image creation
- 🚀 **Deployment**: Automated staging and production deployment

## 📊 **System Capabilities**

### **Multi-Tenancy**

- Complete data isolation between tenants
- Tenant-specific configurations and branding
- Scalable architecture supporting unlimited tenants
- Subdomain-based access control

### **User Management**

- Role-based access control (5 user roles)
- Secure authentication with JWT tokens
- Account security features (lockout, password policies)
- User profile management and preferences

### **Academic Management**

- Complete student lifecycle tracking
- Class and section management
- Subject organization with prerequisites
- Attendance tracking with multiple status types
- Comprehensive examination system
- Automated grade calculations
- Schedule management with conflict detection

### **Financial Operations**

- Flexible fee structure creation
- Multiple payment method support
- Payment tracking and receipt generation
- Discount and penalty management
- Collection reports and defaulter tracking

### **Analytics & Reporting**

- Role-specific dashboards
- Real-time statistics and metrics
- Comprehensive academic reports
- Financial summaries and trends
- Activity monitoring and audit trails

## 🔒 **Security Features**

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive Joi schemas
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Cross-origin request handling
- **Helmet Security**: HTTP header protection
- **Password Security**: Bcrypt hashing with salt
- **Account Protection**: Login attempt limiting

## 🎯 **Production Checklist**

- [ ] Set strong JWT secrets
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB with authentication
- [ ] Configure Redis for caching
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up error tracking (Sentry)
- [ ] Configure email service (SMTP)
- [ ] Set up domain and DNS
- [ ] Configure firewall rules

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Complete API documentation at `/api-docs`
- **Issues**: Create an issue on GitHub
- **Email**: support@schoolmanagement.com
- **Community**: Join our Discord server

## 🙏 **Acknowledgments**

- Express.js team for the excellent web framework
- MongoDB team for the robust database solution
- TypeScript team for enhanced development experience
- Open source community for amazing tools and libraries

---

## 🎉 **Ready to Get Started?**

```bash
# Quick start with Docker
git clone https://github.com/your-username/school-management-backend.git
cd school-management-backend
docker-compose up -d

# Access your school management system
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api-docs
```

**Built with ❤️ for educational institutions worldwide** 🌍
