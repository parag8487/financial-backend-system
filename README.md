# 💰 Financial Records & RBAC Backend

A professional, industrial-grade NestJS backend for financial data processing. This system implements hierarchical Role-Based Access Control (RBAC), comprehensive CRUD operations, and advanced dashboard analytics.

---

## 🚀 Standout Industrial Features

- **💎 Budgeting Engine**: Set and track category-wise monthly spending goals.
- **📊 Interactive Dashboard**: Real-time **Utilization %** and **Remaining Balance** analytics.
- **🛡️ Hierarchical RBAC**: Granular permission system (`ADMIN > ANALYST > VIEWER`) with ownership enforcement.
- **🔍 Advanced Search**: Full-text searching across financial categories and descriptions.
- **🧪 100% Verified**: Exhaustive test suite with **34 Unit Tests** and **10 E2E Integration Tests**.
- **🐳 Dockerized**: Production-ready multi-stage Docker builds and orchestration with `docker-compose`.
- **💓 Health Monitoring**: Real-time `/health` endpoint for database and memory status.
- **✅ Strict Environment**: Joi-based schema validation prevents crashes from misconfiguration.
- **📚 Platinum API Specs**: 100% field coverage with exhaustive metadata at `/api/docs`.

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | NestJS 11 | Industrial standard for scalable Node.js apps. |
| **Language** | TypeScript 5 | Strict typing for end-to-end reliability. |
| **ORM** | Prisma 7 | Type-safe database access with Driver Adapters. |
| **Database** | SQLite | Zero-config local development (Prod-ready for Postgres). |
| **Auth** | Passport JWT | Industry-standard secure stateless authentication. |
| **Integrity** | Joi | Fail-fast environment variable validation. |
| **Observability**| Terminus | Standardized health checks. |

---

### 🚦 Quick Start

#### 📥 Downloading from GitHub
If you have just cloned or downloaded this repository, follow these steps to run the application locally:

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Setup Environment:**
   ```bash
   cp .env.example .env
   # Ensure DATABASE_URL="file:./dev.db" in .env
   ```
3. **Database Sync & Seed:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed  # Pre-populates 60 records & 3 users
   ```
4. **Start Application:**
   ```bash
   npm run start:dev
   ```

#### 🐳 Run with Docker (Alternative)
```bash
cp .env.example .env
docker-compose up --build
```


### 🧪 Default Credentials (Seed Data)
| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@finance.com` | `password123` |
| **Analyst** | `analyst@finance.com` | `password123` |
| **Viewer** | `viewer@finance.com` | `password123` |
- **API**: `http://localhost:3000`
- **Docs**: `http://localhost:3000/api/docs`
- **Health**: `http://localhost:3000/health`

---

## 🔑 Access Control Model

| Role | Access Level | Description |
|------|--------------|-------------|
| **`VIEWER`** | Read-Only | Dashboard summaries and record listing. |
| **`ANALYST`**| Author | Viewer + Create/Update **own** records. |
| **`ADMIN`**  | Full Control | Global user management and soft-deletion of any record. |

---

## 📖 API Architecture

The system follows a modular architecture with a clear separation of concerns:
- **`Auth`**: JWT issued via `/auth/login`.
- **`Users`**: Admin-only management of system access.
- **`Records`**: Filterable financial data. Supports `?search=`, `?page=`, and `?limit=`.
- **`Dashboard`**: Aggregated analytics including monthly trends and category totals.

---

## 🧪 Testing Excellence
Run the comprehensive test suit:
```bash
npm test            # Unit Tests (Business logic)
npm run test:e2e    # E2E Tests (Full API flow)
```
