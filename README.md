# 🏥 HealthDesk — AI-Powered Healthcare Management Platform

HealthDesk is a full-stack healthcare management platform designed to connect patients, doctors, and administrators in one secure and user-friendly system.

The platform provides patient management, doctor discovery, appointments, medical records, prescriptions, notifications, payments, doctor verification, and AI-powered preliminary symptom assessment.

> ⚠️ **Medical Disclaimer:**  
> HealthDesk's AI features provide general, preliminary health information only. They are NOT intended to diagnose diseases, prescribe medication, or replace professional medical advice.

---

## 🚀 Live Demo

### 🌐 Frontend
https://helthymee.netlify.app

### ⚙️ Backend API
https://healthdesk-yiv5.onrender.com

### ❤️ API Health Check
https://healthdesk-yiv5.onrender.com/api/v1/health

---

## ✨ Key Features

### 👤 Patient

- Patient registration and login
- Google authentication
- JWT-based authentication
- Patient profile management
- Profile image upload
- Medical history
- Medical record upload and management
- Symptom entry and tracking
- AI-powered preliminary symptom assessment
- Doctor search
- Search doctors by name, specialty, and location
- Appointment requests
- Appointment status tracking
- Appointment rescheduling and cancellation
- Prescription history
- Prescription download
- Notifications
- Online payment integration

---

### 👨‍⚕️ Doctor

- Doctor registration
- Doctor profile management
- Profile image upload
- Specialty and professional information
- Doctor availability management
- Appointment management
- Accept/reject appointment requests
- Reschedule appointments
- Patient management
- Patient medical history
- Prescription creation
- Prescription upload/download
- UPI/payment information management
- Doctor verification workflow

---

### 🛡️ Admin

- Admin dashboard
- User management
- Patient management
- Doctor management
- Doctor verification
- Approve/reject doctor verification requests
- Block/unblock users
- Suspend doctors
- Appointment monitoring
- Payment monitoring
- Audit log management

---

## 🤖 AI-Powered Health Assessment

HealthDesk includes an AI service for preliminary symptom analysis.

The AI analyzes the symptoms provided by a patient and generates:

- Possible health conditions
- Preliminary severity assessment
- Recommended next steps
- Guidance on whether professional medical attention may be required

The AI service is implemented as an abstraction layer so that the underlying AI provider can be replaced without changing the application's business logic.

### AI Provider

Currently using:

**Groq API**

The application uses the OpenAI-compatible API interface provided by Groq.

Example architecture:

```text
Patient Symptoms
       ↓
HealthDesk Backend
       ↓
AI Service
       ↓
Groq API
       ↓
AI Response
       ↓
Preliminary Health Assessment
---
##🏗️ System Architecture

                    ┌──────────────────────┐
                    │      React + Vite    │
                    │      Frontend        │
                    │      Netlify         │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │      Backend         │
                    │       Render         │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └─────────────┐
                 ▼                                ▼
        ┌─────────────────┐              ┌─────────────────┐
        │      MySQL      │              │    Groq AI      │
        │     Railway     │              │   AI Service    │
        └─────────────────┘              └─────────────────┘

---
##🛠️ Tech Stack
Frontend
React.js
Vite
JavaScript
Bootstrap
Bootstrap Icons
Axios
React Router
React Toastify
Backend
Node.js
Express.js
REST API
JWT Authentication
bcryptjs
Express Validator
Multer
Helmet
CORS
Compression
Morgan
Winston
Express Rate Limit
Database
MySQL
mysql2
AI
Groq API
OpenAI-compatible API interface
Payments
Razorpay
Authentication
JWT
Google OAuth integration support
Deployment
Netlify — Frontend
Render — Backend
Railway — MySQL Database


---

##📂 Project Structure

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

🔐 Authentication & Security

HealthDesk implements several security mechanisms:

JWT access tokens
JWT refresh tokens
Password hashing with bcrypt
Role-based authorization
Protected API routes
Authentication middleware
CORS configuration
Helmet security middleware
Request rate limiting
Input validation
Secure API communication
Environment variables for sensitive configuration

Sensitive credentials are not included in the repository.

🔌 API Overview

The backend exposes REST API endpoints under:

/api/v1

Main API modules include:

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
Health Check
GET /api/v1/health

Production API:

https://healthdesk-yiv5.onrender.com/api/v1/health

🗄️ Database

HealthDesk uses MySQL as its relational database.

The database stores information related to:

Users
Patients
Doctors
Appointments
Medical records
Symptoms
Prescriptions
Payments
Notifications
Doctor verification
Audit logs

The production database is hosted using Railway MySQL.


⚙️ Environment Variables

Create a .env file in the backend project.

Example:

NODE_ENV=development
PORT=5000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=healthdesk

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=healthdesk-files

GROQ_API_KEY=
GROQ_MODEL=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

CLIENT_URL=http://localhost:5173

MAX_FILE_SIZE=10485760

ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,application/pdf

🚀 Local Installation
1. Clone the repository
git clone YOUR_GITHUB_REPOSITORY_URL

Move into the project:

cd HealthDesk

📦 Backend Setup

Install backend dependencies:

npm install

Create the backend .env file:

.env

Add the required environment variables.

Run database migration if available:

npm run db:migrate

Seed initial data if required:

npm run db:seed

Start backend in development:

npm run dev

Backend will run on:

http://localhost:5000
💻 Frontend Setup

Open a new terminal:

cd client

Install dependencies:

npm install

Create:

.env

Add:

VITE_API_BASE_URL=http://localhost:5000/api/v1

Start the frontend:

npm run dev

Frontend will normally run on:

http://localhost:5173


##🌐 Production Deployment

###🔄 Production Request Flow
User
  │
  ▼
Netlify
React Frontend
  │
  │ HTTPS API Request
  ▼
Render
Node.js + Express Backend
  │
  ├──────────────► Railway MySQL
  │
  ├──────────────► Groq AI
  │
  └──────────────► Razorpay



📸 Screenshots


