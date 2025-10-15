# Test Self-Registration for Students and Teachers

## 🎯 Updated createdBy Rules

**Now `createdBy` is required ONLY for:**

- ❌ `admin`
- ❌ `tenant_admin`
- ❌ `manager`

**`createdBy` is NOT required for:**

- ✅ `student` (can self-register)
- ✅ `teacher` (can self-register)
- ✅ `parent` (can self-register)
- ✅ `super_admin` (system level)

## 🧪 Test Student Registration

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Student",
    "email": "john.student@demo-school.com",
    "password": "password123",
    "role": "student",
    "tenant": "demo-school"
  }'
```

## 🧪 Test Teacher Registration

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Teacher",
    "email": "jane.teacher@demo-school.com",
    "password": "password123",
    "role": "teacher",
    "tenant": "demo-school"
  }'
```

## 🧪 Test Parent Registration

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Parent",
    "email": "bob.parent@demo-school.com",
    "password": "password123",
    "role": "parent",
    "tenant": "demo-school"
  }'
```

## ❌ Test Admin Registration (Should Fail)

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test.admin@demo-school.com",
    "password": "password123",
    "role": "admin",
    "tenant": "demo-school"
  }'
```

**Expected Result:** Should fail with "createdBy is required" error.

## 🔐 Test Login After Registration

After successful registration, test login:

```bash
curl -X POST https://multi-tenancy-school-management-sys.vercel.app/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.student@demo-school.com",
    "password": "password123"
  }'
```

## 📋 Expected Results

### ✅ Successful Self-Registration

- Students, teachers, and parents can register without admin approval
- No `createdBy` field required
- Automatic role assignment
- Immediate login capability

### ❌ Admin Registration Blocked

- Admin roles still require `createdBy` field
- Must be created by existing admin/super_admin
- Maintains security hierarchy

## 🎯 Use Cases

### **Student Self-Registration**

- Students can sign up for school portal
- Choose courses, view grades
- No admin intervention needed

### **Teacher Self-Registration**

- Teachers can join school system
- Access teaching tools
- Admin can approve/activate later

### **Parent Self-Registration**

- Parents can create accounts
- View child's progress
- Communicate with teachers

### **Admin Creation (Controlled)**

- Only existing admins can create new admins
- Maintains security and hierarchy
- Audit trail preserved

This approach balances **ease of use** for regular users with **security controls** for administrative roles! 🎓✨
