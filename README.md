# 🦷 Dental AI Receptionist & Clinic Management System

A production-ready **AI Receptionist and Management Platform** designed for dental clinics. Built with **FastAPI**, **MongoDB Atlas**, **Groq AI**, and **React + Vite**.

---

## 🌟 Key Features

### 1. 🤖 24/7 AI Receptionist
- Powered by **Groq AI** (`openai/gpt-oss-20b`) with dynamic knowledge base injection.
- Answers patient questions on prices, services, doctor specialties, and office hours.
- Strict guardrails: No medical diagnosis, no hallucinated fees, clean conversational tone.
- Floating helper launcher with real-time status, welcome balloon, and 1-click suggested prompts.

### 2. 📅 Intelligent Appointment Scheduling & Collision Prevention
- **Doctor Selection**: Patients can choose specific dentists (Dr. Sarah Jenkins, Dr. Michael Chen, Dr. Emily Rodriguez) or select *Any Available Doctor*.
- **Dedicated Treatment Durations**: Automatically calculates slot lengths (Checkups: 30m, Cleanings: 45m, Fillings: 60m, Root Canals: 90m).
- **Double-Booking Prevention**: Real-time slot availability check (`/api/appointments/available-slots`) locks booked slots and protects against race conditions with `HTTP 409 Conflict`.
- **Strict Date Validation**: Rejects past dates and limits advance booking to 90 days.

### 3. 🔐 Secure Authentication & Self-Serve Password Reset
- Role-based JWT access (`admin`, `patient`, `staff`).
- Password hashing with **Bcrypt**.
- Automated **Forgot Password** flow with 15-minute 6-digit email verification codes.

### 4. 📊 Comprehensive Admin Dashboard
- **Appointment Requests Management**:
  - Filter by `All`, `Pending`, `Confirmed`, `Completed`, or `Cancelled`.
  - Search by patient name, email, or phone.
  - One-click **Accept / Confirm** (triggers patient confirmation email), **Decline**, and **Complete Visit**.
- **Live Dynamic Pricing**:
  - Edit service prices inline; changes immediately sync to MongoDB and the AI receptionist in real time without server restarts.
- **Staff Management**: Add clinic staff accounts directly from the dashboard.

### 5. 📧 Automated SMTP Email Alerts
- **Admin Alerts**: Instant notification email sent whenever a patient requests a visit.
- **Patient Confirmation**: Automated confirmation with appointment details, assigned dentist, and preparation reminders.
- **Cancellation Notices**: Automated patient notifications upon visit status changes.

---

## 🏗️ Project Architecture

```
Dental/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & lifespan
│   ├── models/
│   │   ├── appointment_models.py   # Schemas, slot validator, service durations
│   │   ├── clinic_models.py        # Service & clinic configuration models
│   │   └── user_models.py          # User auth, register, forgot/reset password
│   ├── routers/
│   │   ├── appointments.py         # Booking, slots, status update endpoints
│   │   ├── auth.py                 # Login, register, forgot/reset password
│   │   └── clinic.py               # Dynamic pricing and clinic configuration
│   ├── services/
│   │   ├── ai_service.py           # Groq AI integration with dynamic prompt
│   │   ├── appointment_service.py  # Collision prevention & MongoDB CRUD
│   │   ├── auth_service.py         # JWT tokens & bcrypt password hashing
│   │   ├── database.py             # MongoDB connection manager (with certifi)
│   │   ├── email_service.py        # SMTP email alerts (Admin & Patient)
│   │   ├── knowledge_service.py    # Clinic knowledge synchronization
│   │   └── user_service.py         # User account CRUD & password reset
│   └── knowledge_base/
│       └── bright_smile_dental/    # Seed data (profile, services, policies, FAQs)
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AppointmentModal.jsx # Doctor select, slot picker, collision guard
    │   │   ├── ChatWidget.jsx       # 24/7 AI Helper launcher & chat interface
    │   │   ├── Navbar.jsx           # Responsive nav with Ask AI shortcut
    │   │   └── AddStaffModal.jsx    # Staff creation modal
    │   ├── pages/
    │   │   ├── HomePage.jsx         # Landing page with AI showcase
    │   │   ├── AdminDashboard.jsx   # Appointment management & dynamic pricing
    │   │   ├── PatientDashboard.jsx # Patient appointment portal
    │   │   ├── LoginPage.jsx        # Login page with forgot password link
    │   │   ├── RegisterPage.jsx     # Registration page
    │   │   └── ForgotPasswordPage.jsx # Password reset with 6-digit code
    │   ├── services/
    │   │   └── api.js               # Axios API client
    │   ├── context/
    │   │   └── AuthContext.jsx      # Global authentication provider
    │   └── styles/
    │       └── bright-smile.css     # Global theme & typography
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **MongoDB Atlas** account (or local MongoDB)
- **Groq API Key** (for AI responses)

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/ahtishamu414-crypto/Dental.git
cd Dental

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirment.txt
pip install certifi

# Configure environment variables
cp .env.example .env
# Edit .env with your GROQ_API_KEY, MONGODB_URI, and SMTP credentials

# Run FastAPI backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Default Credentials (Demo)

- **Admin Account**: `admin@brightsmiledental.demo` / `adminpassword123`
- Can also be reset using `python debug_reset_admin.py` or via the **Forgot password?** link on the login page.

---

## 📄 License
MIT License. Created for modern dental clinics.
