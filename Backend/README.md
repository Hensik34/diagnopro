## Lab Management System - Backend Setup

### 📋 Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- Postman (for API testing)

### 🚀 Quick Start

#### 1. **Setup PostgreSQL Database**

```bash
# Create database (run in PostgreSQL)
createdb lab_management_db
```

#### 2. **Install Dependencies**

```bash
cd Backend
npm install
```

#### 3. **Configure Environment Variables**

Edit `.env` file with your database credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lab_management_db
DB_PASS=your_password

JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
PORT=5000
```

#### 4. **Start Server**

Run database scripts manually (not on server startup):

```bash
# Run final schema migration only
npm run db:migrate

# Run tests + test_fields seed migration only
npm run db:seed

# Run both schema + seed
npm run db:setup
```

Then start API server:

```bash
npm start
```

**Expected Output:**
```
✅ Server running on http://localhost:5000
📚 API Base URL: http://localhost:5000/api
🏥 Lab Management System Backend
```

---

### 🧪 API Testing with Postman

#### **Import Collection**

1. Open Postman
2. Click **"Import"** → **"Upload Files"**
3. Select `postman_collection.json`
4. Tests will auto-save tokens to environment

#### **Available Endpoints**

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/profile` | ✅ | Get user details |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| GET | `/api/patients` | ✅ | List patients |
| POST | `/api/patients` | ✅ | Create patient |
| GET | `/api/samples` | ✅ | List samples |
| GET | `/api/reports` | ✅ | List reports |
| GET | `/api/tests` | ✅ | List tests |
| GET | `/api/branches` | ✅ | List branches |
| GET | `/api/health` | ❌ | Health check |

---

### 🗄️ Database Schema

#### **Core Tables**

- **users** - User accounts (firstname, lastname, email, password_hash, phone, role)
- **branches** - Lab locations/branches
- **user_branches** - User-Branch relationship (many-to-many)
- **patients** - Patient records
- **doctors** - Doctor information
- **samples** - Lab samples
- **tests** - Available lab tests
- **sample_tests** - Sample-Test relationship
- **reports** - Lab reports

---

### 📝 User Registration Flow

1. **User registers** → POST `/auth/register`
   ```json
   {
     "firstname": "John",
     "lastname": "Doe",
     "email": "john@lab.com",
     "password": "SecurePassword123!",
     "phone": "+1234567890",
     "role": "staff"
   }
   ```

2. **Server returns** token (valid for 7 days)
   ```json
   {
     "message": "User registered successfully",
     "user": {
       "id": "uuid",
       "firstname": "John",
       "lastname": "Doe",
       "email": "john@lab.com",
       "role": "staff",
       "created_at": "2024-03-23T10:00:00Z"
     },
     "token": "eyJhbGciOiJIUzI1NiIs..."
   }
   ```

3. **User adds branches** (next phase) → Assign user to branch via user_branches table

---

### 🔐 Authentication

**Headers for protected endpoints:**
```
Authorization: Bearer <token>
```

**Token expires in:** 7 days

---

### ✅ Testing Checklist

- [ ] PostgreSQL is running
- [ ] `.env` file is configured
- [ ] `npm install` completed
- [ ] Server starts without errors
- [ ] `GET /api/health` returns 200
- [ ] `POST /api/auth/register` creates user
- [ ] `POST /api/auth/login` returns token
- [ ] `GET /api/auth/profile` with token returns user
- [ ] Protected routes reject requests without token

---

### 🐛 Troubleshooting

**Error: "psql: error: connection to server at "localhost"**
- PostgreSQL not running
- Solution: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)

**Error: "Cannot find module 'postgres'**
- Dependencies not installed
- Solution: `npm install`

**Error: "EADDRINUSE: address already in use :::5000"**
- Port 5000 already in use
- Solution: `kill -9 $(lsof -t -i:5000)` or change PORT in `.env`

---

### 📚 Next Steps

1. ✅ Create patient controller & full CRUD endpoints
2. ✅ Create doctor controller & endpoints
3. ✅ Create sample collection controller
4. ✅ Create branch management endpoints
5. ✅ Create report endpoints
6. ✅ Connect frontend to backend APIs
7. ✅ Implement user branch assignment

---

**Created:** March 23, 2024
**Version:** 1.0.0
