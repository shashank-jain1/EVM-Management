# 🗳️ EVM Lifecycle & Inventory Management System

A secure, production-grade **Electronic Voting Machine (EVM) Management System** built for the Government of India. The system models, tracks, and audits the entire lifecycle of EVM units (Control Units, Ballot Units, and VVPATs) from registration to dispatch, transit logistics, custody receipt, and operational deployments.

---

## 🏛️ Project Architecture

```
evm-management/
├── database/               # SQL Database Layer
│   ├── schema.sql          # MS SQL Server DDL definitions
│   └── seed.sql            # Master reference data (States, Districts, Admin User, sample EVMs)
├── server/                 # Backend REST API (.NET Core)
│   ├── Program.cs          # Pipeline and Dependency Injector
│   ├── Controllers/        # Domain controllers (Auth, Users, EVMs, Dispatches, Reports)
│   ├── Repositories/       # Dapper raw SQL parameterized queries
│   └── Services/           # Custody validations and transactional logic
└── client/                 # Frontend SPA (React 18 + Vite)
    ├── vite.config.js      # Aliases & API proxying
    ├── tailwind.config.js  # Theme variables (ECI Navy & Saffron)
    └── src/                # Modular React features and layout shells
```

*   **Security Principle**: No database ORM is used. All database transactions are executed via raw parameterized commands in repositories to enforce strict SQL injection protection and optimal indexing throughput.
*   **Auditability**: Actions modifying states (logins, logouts, user creation, registrations, dispatches, receipts) write immutable logs to a central `audit_logs` table recording changes in JSON format.

---

## 📋 Prerequisites

*   **Database**: Microsoft SQL Server (2019+ or Azure SQL)
*   **Backend**: .NET 8.0 SDK / Runtime
*   **Frontend**: Node.js (v18+) and npm

---

## 🚀 Installation & Setup

### 1. Database Initialization
Create a database named `evm_management` on your SQL Server instance and execute the schema and seed scripts:
```bash
# Using sqlcmd utility or execute via Azure Data Studio / SQL Server Management Studio
sqlcmd -S <YOUR_SERVER> -d master -Q "CREATE DATABASE evm_management"
sqlcmd -S <YOUR_SERVER> -d evm_management -i "database/schema.sql"
sqlcmd -S <YOUR_SERVER> -d evm_management -i "database/seed.sql"
```

### 2. Backend API Setup
1.  Navigate to the `server` directory.
2.  Configure your database connection credentials in `server/appsettings.Development.json`:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Server=localhost,1433;Database=evm_management;User Id=sa;Password=YourSecurePasswordHere;Encrypt=true;TrustServerCertificate=true;"
    }
    ```
3.  Launch the backend development server:
    ```bash
    cd server
    dotnet run
    ```
    *   The API server will launch at `http://localhost:5000` (Swagger dashboard available at `/swagger`).

### 3. Frontend Client Setup
1.  Navigate to the `client` directory.
2.  Install packages and launch Vite:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    *   The client hot-reload dev server runs at `http://localhost:5173`.

---

## 🔐 Default Credentials

Use these secure credentials to complete your first login. Change them immediately upon authentication:
*   **Default Admin login**: `ADMIN001`
*   **Default Password**: `Admin@123#Secure`

---

## 🛡️ Key Business Rules & Workflows

| Rule / constraint | System Implementation details |
| :--- | :--- |
| **Sender Auto-fill** | Dispatch source locations are auto-resolved from the dispatching user's state/district. |
| **No Duplicate Dispatch** | A unit in an `IN_TRANSIT` state cannot be dispatched again. |
| **Expiry of Temp Users** | Temporary accounts automatically fail token validation checks after the `valid_until` timestamp. |
| **Immutable History** | All transactions insert rows into `evm_movement_history`; updates or deletes are disabled on history tables. |
| **Session Expiry** | 30 minutes of inactivity automatically invalidates tokens in `sessionStorage` and triggers client logout. |

---

## 🔌 API Endpoint Reference

### Authentication
*   `POST /api/auth/login` - Authenticate officer credentials (returns JWT and refresh token).
*   `POST /api/auth/refresh` - Rotate tokens prior to token expiration.
*   `POST /api/auth/logout` - Revoke current refresh tokens.
*   `GET /api/auth/me` - Resolve logged-in officer identity claims.

### EVM Inventory Management
*   `GET /api/evm` - Retrieve paginated and filtered catalog list.
*   `GET /api/evm/{id}` - View lifecycle specifications.
*   `POST /api/evm` - Register a new device.
*   `GET /api/evm/{id}/history` - Retrieve vertical tracking timeline log.
*   `PATCH /api/evm/{id}/status` - Modify status indicators (Faulty, Decommissioned).
*   `GET /api/evm/lookup/{code}` - Query unit barcodes (scanners).

### Shipping & Dispatches
*   `GET /api/dispatch` - List history.
*   `GET /api/dispatch/{id}` - Fetch shipment details and Challan items.
*   `POST /api/dispatch` - Initiate multi-unit shipping batch.
*   `POST /api/dispatch/{id}/receive` - Acknowledge delivery conditions and update inventory custody.
*   `DELETE /api/dispatch/{id}` - Cancel batch delivery (reverts unit statuses).
*   `GET /api/dispatch/pending` - Fetch dispatches destined for the user's custody.

### Admin Controls
*   `GET /api/users` - List officer accounts.
*   `POST /api/users` - Create officer accounts.
*   `PUT /api/users/{id}` - Modify profiles.
*   `PATCH /api/users/{id}/toggle-status` - Deactivate/reactivate logins.

### Reports & Audits
*   `GET /api/reports/dashboard` - Fetch KPI counters and Recharts datasets.
*   `GET /api/reports/inventory-summary` - Group inventory by states/districts.
*   `GET /api/reports/dispatch-history` - Fetch dispatch records.
*   `GET /api/reports/movement-timeline` - Fetch movement transactions.
*   `GET /api/audit` - View log files.
*   `GET /api/search/global` - Perform unified database searches.
*   `GET /api/reference/states` - Fetch state lists.
*   `GET /api/reference/districts` - Fetch districts by state.
