# Smart City Civic Complaint and Management System

A web-based platform for reporting, tracking, assigning, and resolving civic complaints efficiently.

## Project Overview

The system provides a centralized platform where citizens can report issues such as road damage, garbage accumulation, broken streetlights, water supply problems, and drainage issues.

It connects citizens, department officers, and field workers through a structured complaint management workflow.

## Key Features

- **Citizen:** Register, login, submit complaints, upload photos, track status, verify completed work, and provide feedback.
- **Officer:** Review complaints, verify or reject them, and assign them to department workers.
- **Worker:** View assigned tasks, accept work, update progress, upload completion photos, and mark tasks as completed.
- **Complaint Tracking:** Maintain complaint status history and track progress.
- **Photo Evidence:** Store and display citizen-submitted and worker-uploaded photographs.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL 18 |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Password Security | Argon2 |
| API Documentation | Swagger UI |
| Styling | CSS |

## Complaint Workflow

```text
Citizen Submits Complaint
          |
          v
   Pending Verification
          |
          v
     Officer Verifies
          |
          v
    Assigns to Worker
          |
          v
     Worker Accepts
          |
          v
      In Progress
          |
          v
       Completed
          |
          v
 Citizen Verifies Work
          |
          v
        Resolved
```

## System Architecture

```text
React Frontend
      |
      v
   REST APIs
      |
      v
 FastAPI Backend
      |
      v
 SQLAlchemy ORM
      |
      v
 PostgreSQL Database
```

## Database Modules

The database includes the following major entities:

- Users
- Departments
- Categories
- Complaints
- Assignments
- Status History
- Complaint Evidence
- Feedback
- Notifications
- SLA Escalations

## Running the Project

**Prerequisites:** Python, Node.js, npm, and PostgreSQL.

### 1. Start Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000

Swagger API Documentation: http://127.0.0.1:8000/docs

### 2. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

Ensure PostgreSQL is running and database configuration is set before starting the backend.

## Software Engineering Concepts

- Modular architecture
- Client-server communication
- REST API development
- Database management
- Authentication and authorization
- Role-based access control
- Functional and integration testing

## Future Enhancements

- Real-time notifications
- Automatic complaint escalation
- Duplicate complaint detection
- AI-based complaint classification
- Complaint hotspot analysis

## Project Information

**Project Name:** Smart City Civic Complaint and Management System

**Domain:** Software Engineering / Web Development

**Frontend:** React.js

**Backend:** FastAPI

**Database:** PostgreSQL
