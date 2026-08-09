# 🏥 HealthDesk — AI-Powered Healthcare Management Platform

HealthDesk is a full-stack healthcare management platform designed to connect **patients, doctors, and administrators** in one secure and user-friendly system.

The platform provides:

- Patient management
- Doctor discovery
- Appointment management
- Medical records
- Prescriptions
- Notifications
- Payments
- Doctor verification
- AI-powered preliminary symptom assessment

> ⚠️ **Medical Disclaimer:**  
> HealthDesk's AI features provide general, preliminary health information only. They are **NOT intended to diagnose diseases, prescribe medication, or replace professional medical advice**.

---

## 🚀 Live Demo

### 🌐 Frontend

**Live Application:**  
https://helthymee.netlify.app

### ⚙️ Backend API

**Backend:**  
https://healthdesk-yiv5.onrender.com

### ❤️ API Health Check

**Health Check:**  
https://healthdesk-yiv5.onrender.com/api/v1/health

---

# ✨ Key Features

## 👤 Patient Features

- Patient registration and login
- Google authentication
- JWT-based authentication
- Patient profile management
- Profile image upload and update
- Medical history
- Medical record upload and management
- Symptom entry and tracking
- AI-powered preliminary symptom assessment
- Doctor search
- Search doctors by:
  - Name
  - Specialty
  - Location
- Appointment requests
- Appointment status tracking
- Appointment rescheduling
- Appointment cancellation
- Prescription history
- Prescription download
- Notifications
- Online payment integration

---

## 👨‍⚕️ Doctor Features

- Doctor registration
- Doctor profile management
- Profile image upload and update
- Specialty and professional information
- Doctor availability management
- Appointment management
- Accept appointment requests
- Reject appointment requests
- Reschedule appointments
- Patient management
- Patient medical history
- Prescription creation
- Prescription upload and download
- UPI/payment information management
- Doctor verification workflow
- Verification document submission
- Verification status tracking

---

## 🛡️ Admin Features

- Admin dashboard
- User management
- Patient management
- Doctor management
- Doctor verification
- Review doctor verification requests
- Approve doctor verification requests
- Reject doctor verification requests
- Block/unblock users
- Suspend/reactivate doctors
- Appointment monitoring
- Payment monitoring
- Audit log management
- Platform management

---

# 🤖 AI-Powered Health Assessment

HealthDesk includes an AI service for **preliminary symptom analysis**.

The AI analyzes symptoms provided by a patient and generates:

- Possible health conditions
- Preliminary severity assessment
- Recommended next steps
- Guidance on whether professional medical attention may be required

The AI service is implemented as an **abstraction layer**, allowing the underlying AI provider to be replaced without changing the application's main business logic.

## AI Provider

Currently using:

**Groq API**

The application uses the **OpenAI-compatible API interface provided by Groq**.

### AI Flow

```text
Patient Symptoms
       │
       ▼
HealthDesk Backend
       │
       ▼
AI Service
       │
       ▼
Groq API
       │
       ▼
AI Response
       │
       ▼
Preliminary Health Assessment
```

### AI Safety

The AI service is designed as a preliminary health information system.

It does **not**:

- Provide a medical diagnosis
- Prescribe medication
- Replace a doctor
- Replace emergency medical care

If symptoms may indicate an emergency, users are advised to seek professional medical attention.

---

# 🏗️ System Architecture

HealthDesk follows a separated frontend-backend architecture with cloud-hosted services.

```text
                         ┌─────────────────────────┐
                         │        USER             │
                         │ Patient / Doctor / Admin│
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      React + Vite       │
                         │       Frontend          │
                         │        Netlify          │
                         └────────────┬────────────┘
                                      │
                                      │ HTTPS REST API
                                      ▼
                         ┌─────────────────────────┐
                         │    Node.js + Express    │
                         │        Backend          │
                         │         Render          │
                         └──────┬────────┬─────────┘
                                │        │
                 ┌──────────────┘        └──────────────┐
                 │                                      │
                 ▼                                      ▼
        ┌──────────────────┐                  ┌──────────────────┐
        │   Railway MySQL  │                  │     Groq AI      │
        │     Database     │                  │   AI Service     │
        └──────────────────┘                  └──────────────────┘
                 │
                 │
                 ▼
        ┌──────────────────┐
        │     Application  │
        │       Data       │
        └──────────────────┘

                         ┌──────────────────┐
                         │     Razorpay     │
                         │ Payment Service  │
                         └──────────────────┘
```

---

# 🔄 Production Request Flow

```text
User
 │
 ▼
Netlify
 │
 │ React Application
 │
 ▼
Render
 │
 │ REST API
 │
 ├──────────────► Railway MySQL
 │
 ├──────────────► Groq AI
 │
 └──────────────► Razorpay
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Vite
- JavaScript
- Bootstrap
- Bootstrap Icons
- Axios
- React Router
- React Toastify

## Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs
- Express Validator
- Multer
- Helmet
- CORS
- Compression
- Morgan
- Winston
- Express Rate Limit

## Database

- MySQL
- mysql2

## AI

- Groq API
- OpenAI-compatible API interface

## Payments

- Razorpay

## Authentication

- JWT
- Google OAuth integration support

## Deployment

- **Netlify** — Frontend
- **Render** — Backend
- **Railway** — MySQL Database

---

# 📂 Project Structure

```text
HealthDesk/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── src/
│   ├── config/
│   ├── middleware/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── prescriptions/
│   │   ├── payments/
│   │   ├── medical-records/
│   │   ├── verification/
│   │   ├── admin/
│   │   ├── symptoms/
│   │   └── notifications/
│   │
│   ├── services/
│   ├── utils/
│   └── database/
│
├── uploads/
├── server.js
├── package.json
├── .env
├── .gitignore
└── README.md
```

---

# 🔐 Authentication & Security

HealthDesk implements multiple security mechanisms to protect application data and API access.

### Authentication

- JWT access tokens
- JWT refresh tokens
- Password hashing with bcrypt
- Role-based authorization
- Protected API routes
- Authentication middleware

### API Security

- CORS configuration
- Helmet security middleware
- Request rate limiting
- Input validation
- Secure API communication
- Environment-based configuration
- Protected backend routes

### Sensitive Configuration

Sensitive credentials are stored using environment variables and are **not included in the repository**.

Examples include:

- Database credentials
- JWT secrets
- AI API keys
- Payment credentials
- OAuth credentials

> Never commit real API keys, passwords, database credentials, or other secrets to GitHub.

---

# 🔌 API Overview

The backend exposes REST API endpoints under:

```text
/api/v1
```

## Main API Modules

```text
/api/v1/auth
/api/v1/users
/api/v1/doctors
/api/v1/patients
/api/v1/appointments
/api/v1/prescriptions
/api/v1/payments
/api/v1/medical-records
/api/v1/verification
/api/v1/admin
/api/v1/symptoms
/api/v1/notifications
```

---

## ❤️ Health Check

### Endpoint

```http
GET /api/v1/health
```

### Production

```text
https://healthdesk-yiv5.onrender.com/api/v1/health
```

### Expected Response

```json
{
  "success": true,
  "message": "HealthDesk API is running"
}
```

---

# 📡 API Modules

The backend is organized into modular REST APIs.

| Module | Endpoint |
|---|---|
| Authentication | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Doctors | `/api/v1/doctors` |
| Patients | `/api/v1/patients` |
| Appointments | `/api/v1/appointments` |
| Prescriptions | `/api/v1/prescriptions` |
| Payments | `/api/v1/payments` |
| Medical Records | `/api/v1/medical-records` |
| Verification | `/api/v1/verification` |
| Admin | `/api/v1/admin` |
| Symptoms | `/api/v1/symptoms` |
| Notifications | `/api/v1/notifications` |

This modular architecture makes the backend easier to maintain, test, debug, and extend.

---

# 🗄️ Database

HealthDesk uses **MySQL** as its relational database.

The database stores information related to:

- Users
- Patients
- Doctors
- Appointments
- Medical records
- Symptoms
- Prescriptions
- Payments
- Notifications
- Doctor verification
- Audit logs

## Production Database

The production MySQL database is hosted using:

**Railway MySQL**

The backend connects to the production database using environment variables configured on the backend hosting platform.

---

# ⚙️ Environment Variables

Create a `.env` file in the backend project.

Example:

```env
# Server
NODE_ENV=development
PORT=5000

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=healthdesk

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=healthdesk-files

# Groq AI
GROQ_API_KEY=
GROQ_MODEL=

# Email
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

# Frontend URL
CLIENT_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760

ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,application/pdf
```

> ⚠️ The values above are placeholders only. Do not put real credentials in this README.

---

# 🚀 Local Installation

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Move into the project:

```bash
cd HealthDesk
```

---

# 📦 Backend Setup

Install backend dependencies:

```bash
npm install
```

Create the backend environment file:

```text
.env
```

Add the required environment variables.

### Run Database Migration

```bash
npm run db:migrate
```

### Seed Initial Data

```bash
npm run db:seed
```

### Start Backend

Development mode:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

---

# 💻 Frontend Setup

Open a new terminal.

Move into the frontend:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

---

# 🌐 Production Deployment

HealthDesk uses a separate frontend and backend deployment architecture.

## Frontend

The React frontend is deployed on:

**Netlify**

Live application:

https://helthymee.netlify.app

The production frontend communicates with the Render backend using:

```env
VITE_API_BASE_URL=https://healthdesk-yiv5.onrender.com/api/v1
```

---

## Backend

The Node.js + Express backend is deployed on:

**Render**

Production backend:

https://healthdesk-yiv5.onrender.com

Health check:

https://healthdesk-yiv5.onrender.com/api/v1/health

---

## Database

The production MySQL database is hosted on:

**Railway**

The backend uses Railway's MySQL credentials through environment variables configured on the backend deployment.

---

# ☁️ Deployment Architecture

```text
                    ┌────────────────────────┐
                    │         GitHub         │
                    │     Source Code        │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
             ┌─────────────┐         ┌─────────────┐
             │   Netlify   │         │   Render    │
             │  Frontend   │         │   Backend   │
             └──────┬──────┘         └──────┬──────┘
                    │                       │
                    │                       │
                    │                 ┌─────┴─────┐
                    │                 │           │
                    │                 ▼           ▼
                    │          ┌────────────┐ ┌──────────┐
                    │          │  Railway   │ │  Groq AI │
                    │          │   MySQL    │ │  Service │
                    │          └────────────┘ └──────────┘
                    │
                    └──────── HTTPS API ────────►
```

---

# 🧪 API Health Check

After deployment, the backend health endpoint can be used to verify that the API is running correctly.

```text
https://healthdesk-yiv5.onrender.com/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "HealthDesk API is running",
  "environment": "production"
}
```

---

# 📸 Screenshots

Screenshots of the application will be added here.

Suggested screenshots include:

- Patient Dashboard
- Doctor Dashboard
- Admin Dashboard
- Doctor Search
- Appointment Management
- Medical Records
- AI Health Assessment
- Doctor Verification
- Profile Management
- Payment Interface

---

# 🎯 Project Goals

HealthDesk was developed to demonstrate how a modern full-stack application can combine:

- Full-stack web development
- REST API architecture
- Authentication and authorization
- Role-based application workflows
- Relational database design
- File upload functionality
- Healthcare management workflows
- AI integration
- Payment integration
- Cloud deployment
- Production environment configuration
- Secure API communication
- Modular backend architecture

---

# 📚 Key Learning Outcomes

Through this project, I worked with:

- React application architecture
- Vite
- Node.js
- Express.js
- REST API development
- JWT authentication
- Refresh token handling
- Role-based authorization
- MySQL database integration
- SQL queries
- File uploads
- API validation
- CORS configuration
- Security middleware
- Rate limiting
- AI API integration
- Payment API integration
- Environment variables
- Production debugging
- Cloud deployment
- Netlify
- Render
- Railway
- Git and GitHub

---

# 🔮 Future Improvements

Possible future improvements include:

- Video consultation
- Real-time doctor-patient chat
- More advanced AI health insights
- Medical document analysis
- Appointment reminders
- Email notifications
- SMS notifications
- Advanced analytics dashboard
- Cloud-based medical file storage
- Improved AI safety and response validation
- Enhanced real-time notification system

---

# ⚠️ Medical Disclaimer

HealthDesk is a full-stack software project and its AI functionality is intended only for preliminary health information.

The AI-generated responses:

- Are not medical diagnoses
- Should not be used to prescribe medication
- Should not replace a qualified healthcare professional
- Should not be relied upon for emergency medical decisions

For serious or emergency symptoms, users should seek immediate professional medical assistance.

---

# 👨‍💻 Developer

## Pranjal Mishra

**MERN Stack Developer**

### Skills

- MERN Stack
- JavaScript
- React.js
- Node.js
- Express.js
- MySQL
- Azure Fundamentals
- Power BI
- AI API Integration
- REST APIs
- Git & GitHub
- Cloud Deployment

---

# ⭐ Project

If you find this project useful or interesting, consider giving the repository a ⭐.

**HealthDesk — AI-Powered Healthcare Management Platform**

Built to bring patients, doctors, administrators, AI assistance, and healthcare management workflows together in one platform.
