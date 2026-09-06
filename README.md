# Vaultivo

**Vaultivo** is a secure cloud-based file storage and sharing platform designed for individuals, students, and small teams.

It provides a Google Drive–style experience for uploading, organizing, managing, sharing, and downloading files, with a dedicated administration console for managing users, storage, security, and platform activity.

---

## Overview

Vaultivo consists of two major applications:

* **Vaultivo Frontend** — React + Vite web application
* **Vaultivo Backend** — Spring Boot REST API

The platform uses:

* PostgreSQL for application data
* MinIO for S3-compatible object storage
* JWT-based authentication
* Google OAuth2 support
* React Query for server-state management
* Docker for local infrastructure
* Nginx for production reverse proxy
* HTTPS/SSL for secure production access

---

# Features

## User Features

### Authentication

* User registration
* Email/password login
* Google OAuth2 login
* JWT authentication
* Current-user session management
* Protected application routes

### File Management

Users can:

* Upload files
* Download files
* Delete files
* Organize files
* Create folders
* Navigate through folders
* Search files
* Star files
* Move files to trash
* Restore deleted files

### Sharing

Vaultivo supports sharing files through public links.

A public user can access a shared resource through a link without requiring a Vaultivo account.

Example:

```text
/shared-link/{token}
```

---

# User Roles & Permissions

Vaultivo follows a role-based access model.

## Owner

The owner has complete control over their own files and resources.

Permissions:

* Upload
* View
* Download
* Modify
* Delete
* Organize
* Share

---

## Editor

Editors can modify shared resources where they have been granted editing permission.

Permissions:

* View
* Download
* Upload
* Modify
* Delete

---

## Viewer

Viewers have read-only access.

Permissions:

* View
* Download

They cannot:

* Modify files
* Delete files
* Change permissions

---

## Public User

A public user accesses a file through a shared link.

Permissions depend on the shared link configuration.

Typical access:

* View
* Download

No Vaultivo account is required.

---

# Platform Administration

Vaultivo also contains a separate **Admin Console** for platform administrators.

The Admin Console is separate from the normal Drive interface.

## Admin Role

The platform administrator has access to platform-level management.

Admin capabilities include:

* View platform statistics
* Manage users
* Manage user plans
* Manage storage quotas
* Enable/disable users
* Grant/remove administrator privileges
* Delete user accounts
* Monitor storage usage
* Review activity logs
* Review security-related activity

---

# Admin Dashboard

The Admin Dashboard provides a high-level overview of the Vaultivo platform.

The dashboard contains exactly six primary sections.

## 1. Total Users

Displays the total number of registered Vaultivo users.

---

## 2. Active Users

Displays the number of currently active user accounts.

---

## 3. Total Storage

Displays total storage usage across the platform.

Example:

```text
Total Storage
12.4 GB
```

---

## 4. Total Files

Displays the total number of files stored across user accounts.

---

## 5. Recent Users

Displays the latest registered users.

Information can include:

* Avatar
* Display name
* Email
* Registration date

---

## 6. Recent Activity

Displays recent platform activity.

Examples:

```text
LOGIN
UPLOAD
DOWNLOAD
DELETE
CREATE_FOLDER
SHARE
ADMIN_ACTION
```

---

# Admin Navigation

The Admin Console uses its own dedicated sidebar.

```text
Admin Console

Dashboard
Users
Storage
Activity Logs
Security

----------------

Back to Drive
```

The normal Drive sidebar is not used inside the Admin Console.

---

# Application Structure

The high-level architecture is:

```text
                    ┌──────────────────────┐
                    │       User           │
                    │   Web Browser        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Vaultivo Frontend  │
                    │    React + Vite      │
                    └──────────┬───────────┘
                               │
                         REST API / JWT
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Vaultivo Backend   │
                    │    Spring Boot       │
                    └───────┬───────┬──────┘
                            │       │
                  ┌─────────┘       └─────────┐
                  ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │   PostgreSQL     │        │      MinIO       │
        │ Application Data │        │   Object Storage │
        └──────────────────┘        └──────────────────┘
```

---

# Frontend

The frontend is built with:

* React
* Vite
* React Router
* TanStack React Query
* Axios
* Tailwind CSS

## Frontend Structure

```text
frontend/
│
├── src/
│   │
│   ├── components/
│   │   ├── AdminLayout.jsx
│   │   ├── DriveLayout.jsx
│   │   └── ...
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DrivePage.jsx
│   │   ├── SharedPage.jsx
│   │   ├── StarredPage.jsx
│   │   ├── TrashPage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── ActivityPage.jsx
│   │   ├── TagsPage.jsx
│   │   ├── PublicLinkPage.jsx
│   │   └── AdminPage.jsx
│   │
│   ├── services/
│   │   ├── apiClient.js
│   │   ├── adminApi.js
│   │   ├── plansApi.js
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── format.js
│   │   └── ...
│   │
│   └── App.jsx
│
├── package.json
└── vite.config.js
```

---

# Backend

The backend is built using:

* Java
* Spring Boot
* Spring Security
* Spring Data JPA
* PostgreSQL
* Flyway
* AWS SDK / S3 API
* JWT
* OAuth2

## Backend Structure

```text
backend/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── vaultivo/
│       │           ├── auth/
│       │           ├── admin/
│       │           ├── storage/
│       │           ├── file/
│       │           ├── folder/
│       │           ├── sharing/
│       │           ├── plan/
│       │           └── ...
│       │
│       └── resources/
│           ├── application.yml
│           └── db/
│               └── migration/
│
├── pom.xml
└── ...
```

---

# Authentication Architecture

Vaultivo uses Spring Security.

Authenticated requests use a JWT.

The frontend sends the authentication token with API requests.

Example:

```text
Browser
   │
   │ JWT
   ▼
Spring Security
   │
   ├── Valid User
   │       │
   │       ▼
   │    Controller
   │
   └── Invalid User
           │
           ▼
          401
```

---

# Admin Authorization

Admin APIs are protected separately.

Admin endpoints use:

```text
/api/admin/**
```

Spring Security requires the `ADMIN` role.

Example:

```java
.requestMatchers("/api/admin/**")
    .hasRole("ADMIN")
```

The authenticated user receives:

```text
ROLE_USER
```

or, for administrators:

```text
ROLE_USER
ROLE_ADMIN
```

This prevents normal users from accessing the Admin Console APIs.

---

# Admin API

## Platform Statistics

```http
GET /api/admin/stats
```

Returns platform statistics such as:

* Total users
* Active users
* Total storage
* Total files

---

## Users

```http
GET /api/admin/users
```

Optional search:

```http
GET /api/admin/users?q=test
```

---

## Top Storage Users

```http
GET /api/admin/users/top-storage
```

Optional limit:

```http
GET /api/admin/users/top-storage?limit=10
```

---

## Update User

```http
PATCH /api/admin/users/{id}
```

Possible administrative changes include:

* Storage quota
* Plan
* Active status
* Admin status

---

## Delete User

```http
DELETE /api/admin/users/{id}
```

---

## Activity

```http
GET /api/admin/activity
```

---

## Failed Uploads

```http
GET /api/admin/uploads/failed
```

---

# Storage Architecture

Vaultivo uses an S3-compatible storage architecture.

MinIO is used during local development.

```text
Vaultivo Backend
       │
       │ S3 API
       ▼
     MinIO
       │
       ▼
 vaultivo-dev
```

The backend generates presigned upload URLs.

The general upload flow is:

```text
User
 │
 │ 1. Select file
 ▼
Frontend
 │
 │ 2. Request upload URL
 ▼
Backend
 │
 │ 3. Generate presigned URL
 ▼
Frontend
 │
 │ 4. Upload file
 ▼
MinIO / S3
 │
 │ 5. Store object
 ▼
Storage
```

This avoids sending the entire file through the application server.

---

# Database

Vaultivo uses PostgreSQL for persistent application data.

Database responsibilities include:

* Users
* Authentication information
* Plans
* File metadata
* Folder metadata
* Sharing information
* Activity records
* Storage information

Database migrations are managed using **Flyway**.

---

# Local Development

## Requirements

Install:

* Java 17+
* Maven
* Node.js
* npm
* Docker Desktop
* Git

---

# Start Infrastructure

Start PostgreSQL and MinIO using Docker Compose.

```powershell
docker compose up -d
```

Check containers:

```powershell
docker ps
```

Expected services include:

```text
PostgreSQL
MinIO
```

---

# Start Backend

Open PowerShell:

```powershell
cd D:\Coding\vaultivo\backend
```

Set MinIO credentials:

```powershell
$env:AWS_ACCESS_KEY_ID="minioadmin"
$env:AWS_SECRET_ACCESS_KEY="minioadmin"
```

Start Spring Boot:

```powershell
mvn spring-boot:run
```

Backend:

```text
http://localhost:8080
```

Health endpoint:

```text
http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "UP"
}
```

---

# Start Frontend

Open another PowerShell window:

```powershell
cd D:\Coding\vaultivo\frontend
```

Install dependencies:

```powershell
npm install
```

Start Vite:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Main Routes

## Public Routes

```text
/login
/register
/oauth2/callback
/shared-link/:token
```

---

## User Application

```text
/drive
/drive/:folderId
/shared
/starred
/tags
/trash
/search
/activity
```

---

## Admin Application

```text
/admin
/admin/users
/admin/storage
/admin/activity
/admin/security
```

---

# Route Architecture

Vaultivo separates the normal user application from the Admin Console.

```text
                 Vaultivo
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
      Drive App           Admin App
          │                   │
          ▼                   ▼
    DriveLayout          AdminLayout
          │                   │
          │                   ├── Dashboard
          │                   ├── Users
          │                   ├── Storage
          │                   ├── Activity
          │                   └── Security
          │
          ├── My Drive
          ├── Shared
          ├── Starred
          ├── Tags
          ├── Trash
          ├── Search
          └── Activity
```

This separation is important because Admin navigation should never accidentally send the administrator back to the normal Drive application.

---

# Admin Dashboard Data Flow

The Admin Dashboard obtains its data from three primary API calls.

```text
AdminPage.jsx
     │
     ├── adminApi.stats()
     │       │
     │       ▼
     │   /api/admin/stats
     │
     ├── adminApi.listUsers()
     │       │
     │       ▼
     │   /api/admin/users
     │
     └── adminApi.recentActivity()
             │
             ▼
         /api/admin/activity
```

The dashboard then displays:

```text
Statistics
   │
   ├── Total Users
   ├── Active Users
   ├── Total Storage
   └── Total Files

Data
   │
   ├── Recent Users
   └── Recent Activity
```

---

# Plans & Storage Quotas

Vaultivo supports storage plans.

A plan can define:

* Plan name
* Storage quota
* Other platform limits

Administrators can assign plans to users and manage their storage allocation.

Storage values are represented in bytes internally.

Example:

```text
5 GB
```

is represented as:

```text
5368709120 bytes
```

---

# Security

Security considerations include:

* JWT authentication
* Spring Security authorization
* Admin-only API endpoints
* Protected application routes
* Public-link-specific access
* Presigned storage URLs
* Password authentication
* Google OAuth2
* HTTPS in production
* Role-based authorization

Sensitive credentials should never be committed to Git.

---

# Environment Variables

Local development may require:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Example:

```powershell
$env:AWS_ACCESS_KEY_ID="minioadmin"
$env:AWS_SECRET_ACCESS_KEY="minioadmin"
```

Production credentials should be stored securely and should not use development credentials.

---

# Docker Services

The local environment uses:

```text
PostgreSQL
MinIO
```

Typical architecture:

```text
Docker
│
├── PostgreSQL
│   └── Port 5432
│
└── MinIO
    ├── S3 API → Port 9000
    └── Console → Port 9001
```

---

# Production Deployment

A typical production deployment is:

```text
Internet
   │
   ▼
Domain
   │
   ▼
Nginx
   │
   ├── Frontend
   │
   └── API
          │
          ▼
     Spring Boot
          │
          ├── PostgreSQL
          │
          └── S3 / MinIO
```

Nginx handles:

* Domain routing
* HTTPS
* Reverse proxying
* Frontend delivery
* API forwarding

---

# Production Domains

The deployment can use separate domains/subdomains such as:

```text
example.com
api.example.com
admin.example.com
partner.example.com
```

The exact production domain configuration depends on the deployment environment.

---

# Health Check

Backend health can be verified with:

```powershell
Invoke-WebRequest http://localhost:8080/api/health -UseBasicParsing
```

Expected:

```text
StatusCode: 200
```

and:

```json
{
  "status": "UP"
}
```

---

# Troubleshooting

## Backend does not start

Check Java:

```powershell
java -version
```

Check Maven:

```powershell
mvn -version
```

---

## Frontend does not start

Run:

```powershell
npm install
npm run dev
```

---

## PostgreSQL unavailable

Check:

```powershell
docker ps
```

If necessary:

```powershell
docker compose up -d
```

---

## MinIO unavailable

Check:

```powershell
docker ps
```

MinIO should expose:

```text
9000
9001
```

---

## Upload fails with credentials error

Make sure the backend process has the required credentials:

```powershell
$env:AWS_ACCESS_KEY_ID="minioadmin"
$env:AWS_SECRET_ACCESS_KEY="minioadmin"
```

Then restart:

```powershell
mvn spring-boot:run
```

---

## Admin Dashboard does not load

First verify that the logged-in account is an administrator.

The `/api/auth/me` response should contain:

```json
{
  "isAdmin": true
}
```

Then check:

```text
GET /api/admin/stats
```

The endpoint requires:

```text
ROLE_ADMIN
```

---

# Development URLs

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Frontend      | `http://localhost:5173`            |
| Backend       | `http://localhost:8080`            |
| API Health    | `http://localhost:8080/api/health` |
| MinIO API     | `http://localhost:9000`            |
| MinIO Console | `http://localhost:9001`            |

---

# Technology Stack

| Layer            | Technology           |
| ---------------- | -------------------- |
| Frontend         | React                |
| Build Tool       | Vite                 |
| Styling          | Tailwind CSS         |
| Routing          | React Router         |
| Server State     | TanStack React Query |
| HTTP Client      | Axios                |
| Backend          | Spring Boot          |
| Language         | Java                 |
| Security         | Spring Security      |
| Authentication   | JWT + OAuth2         |
| Database         | PostgreSQL           |
| Migrations       | Flyway               |
| Object Storage   | MinIO / S3           |
| Containerization | Docker               |
| Web Server       | Nginx                |
| SSL              | Let's Encrypt        |

---

# Project Goals

Vaultivo is designed to provide a simple and secure cloud storage experience while maintaining a clear separation between:

```text
End Users
    ↓
File Management

Administrators
    ↓
Platform Management
```

The architecture is designed to remain scalable as additional functionality is added.

---

# Future Improvements

Potential future features include:

* File versioning
* Advanced sharing permissions
* Team workspaces
* Storage analytics
* Subscription billing
* Email notifications
* Two-factor authentication
* Advanced audit logs
* Automated backups
* S3-compatible production storage
* Admin analytics
* API rate limiting
* File preview generation
* Background processing
* Malware scanning

---

# Project Status

Vaultivo is currently under active development.

Core platform areas include:

* Authentication
* File storage
* Folder management
* Sharing
* User management
* Plans
* Storage quotas
* Admin Console
* Activity tracking

---

# License

This project is currently a private development project.

License terms can be added when the project is prepared for public distribution.

---

# Author

**Vaultivo**

Cloud storage and file-sharing platform.
