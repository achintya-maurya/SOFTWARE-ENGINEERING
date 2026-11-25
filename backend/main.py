import jwt
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
)
from fastapi.responses import FileResponse
from database import SessionLocal
from models import (
    User,
    Complaint,
    Category,
    Department,
    StatusHistory,
    Assignment,
    ComplaintEvidence,
)
from schemas import (
    CitizenRegister, CitizenLogin, OfficerLogin,
    ComplaintCreate, OfficerComplaintDecision,
    WorkerAssignmentCreate,
)
from auth import hash_password, verify_password
from security import create_access_token, verify_access_token


app = FastAPI(title="Smart City Civic Complaint System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://smartcitycivic.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer_scheme = HTTPBearer()


# -------------------- DATABASE CONNECTION --------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- AUTHENTICATION --------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = verify_access_token(credentials.credentials)
        return {
            "user_id": int(payload["sub"]),
            "role": payload["role"],
        }
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# -------------------- HOME AND HEALTH --------------------

@app.get("/")
def home():
    return {
        "message": "Smart City Civic Complaint System Backend is running!"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# -------------------- CITIZEN REGISTRATION --------------------

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_citizen(
    citizen: CitizenRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == citizen.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    new_citizen = User(
        name=citizen.name,
        email=citizen.email,
        password_hash=hash_password(citizen.password),
        role="Citizen",
        department_id=None,
    )

    try:
        db.add(new_citizen)
        db.commit()
        db.refresh(new_citizen)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create account. Check whether the email already exists.",
        )

    return {
        "message": "Citizen registered successfully.",
        "user_id": new_citizen.user_id,
        "name": new_citizen.name,
        "email": new_citizen.email,
        "role": new_citizen.role,
    }


# -------------------- CITIZEN LOGIN --------------------

@app.post("/api/auth/login")
def login_citizen(
    credentials: CitizenLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == credentials.email)
        .first()
    )

    if not user or not verify_password(
        credentials.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.role != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for citizen login only.",
        )

    access_token = create_access_token(user.user_id, user.role)

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1800,
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


# -------------------- OFFICER LOGIN --------------------

@app.post("/api/officer/login")
def login_officer(
    credentials: OfficerLogin,
    db: Session = Depends(get_db),
):
    officer = (
        db.query(User)
        .filter(User.email == credentials.email)
        .first()
    )

    if not officer or not verify_password(
        credentials.password, officer.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if officer.role != "Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for officer login only.",
        )

    department = (
        db.query(Department)
        .filter(Department.department_id == officer.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer department is not configured.",
        )

    access_token = create_access_token(officer.user_id, officer.role)

    return {
        "message": "Officer login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1800,
        "user_id": officer.user_id,
        "name": officer.name,
        "email": officer.email,
        "role": officer.role,
        "department_id": department.department_id,
        "department_name": department.department_name,
    }


# -------------------- GENERAL USER PROFILE --------------------

@app.get("/api/auth/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


# -------------------- SUBMIT A COMPLAINT --------------------

@app.post("/api/complaints", status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can submit complaints.",
        )

    citizen = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not citizen or citizen.role != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Citizen account not found or no longer valid.",
        )

    category = (
        db.query(Category)
        .filter(Category.category_id == complaint_data.category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected complaint category does not exist.",
        )

    department = (
        db.query(Department)
        .filter(Department.department_id == complaint_data.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected department does not exist.",
        )

    new_complaint = Complaint(
        citizen_id=citizen.user_id,
        category_id=complaint_data.category_id,
        department_id=complaint_data.department_id,
        title=complaint_data.title.strip(),
        description=complaint_data.description.strip(),
        location=complaint_data.location.strip(),
        status="Pending Verification",
    )

    try:
        db.add(new_complaint)
        db.flush()

        db.add(StatusHistory(
            complaint_id=new_complaint.complaint_id,
            changed_by=citizen.user_id,
            old_status=None,
            new_status="Pending Verification",
            remarks="Complaint submitted by citizen.",
        ))

        db.commit()
        db.refresh(new_complaint)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not submit the complaint. Please verify the submitted data.",
        )

    return {
        "message": "Complaint submitted successfully.",
        "complaint": {
            "complaint_id": new_complaint.complaint_id,
            "citizen_id": new_complaint.citizen_id,
            "category_id": new_complaint.category_id,
            "department_id": new_complaint.department_id,
            "title": new_complaint.title,
            "description": new_complaint.description,
            "location": new_complaint.location,
            "status": new_complaint.status,
            "created_at": new_complaint.created_at,
        },
    }


# -------------------- GET MY COMPLAINTS --------------------

@app.get("/api/complaints/my")
def get_my_complaints(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can view their complaints.",
        )

    complaints = (
        db.query(
            Complaint,
            Category.category_name,
            Department.department_name,
        )
        .join(Category, Complaint.category_id == Category.category_id)
        .join(Department, Complaint.department_id == Department.department_id)
        .filter(Complaint.citizen_id == current_user["user_id"])
        .order_by(Complaint.created_at.desc())
        .all()
    )

    result = []

    for complaint, category_name, department_name in complaints:
        result.append({
            "complaint_id": complaint.complaint_id,
            "title": complaint.title,
            "description": complaint.description,
            "category_id": complaint.category_id,
            "category_name": category_name,
            "department_id": complaint.department_id,
            "department_name": department_name,
            "location": complaint.location,
            "status": complaint.status,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        })

    return {
        "total_complaints": len(result),
        "complaints": result,
    }


# -------------------- GET COMPLAINT DETAILS --------------------

@app.get("/api/complaints/{complaint_id}")
def get_complaint_details(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can access this endpoint.",
        )

    complaint = (
        db.query(
            Complaint,
            Category.category_name,
            Department.department_name,
        )
        .join(Category, Complaint.category_id == Category.category_id)
        .join(Department, Complaint.department_id == Department.department_id)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.citizen_id == current_user["user_id"],
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    record, category_name, department_name = complaint

    return {
        "complaint_id": record.complaint_id,
        "title": record.title,
        "description": record.description,
        "category_id": record.category_id,
        "category_name": category_name,
        "department_id": record.department_id,
        "department_name": department_name,
        "location": record.location,
        "status": record.status,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
# -------------------- GET COMPLAINT STATUS HISTORY --------------------

@app.get("/api/complaints/{complaint_id}/history")
def get_complaint_status_history(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can view complaint history.",
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.citizen_id == current_user["user_id"],
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    records = (
        db.query(StatusHistory)
        .filter(StatusHistory.complaint_id == complaint_id)
        .order_by(
            StatusHistory.changed_at.asc(),
            StatusHistory.history_id.asc(),
        )
        .all()
    )

    return {
        "complaint_id": complaint_id,
        "total_history_records": len(records),
        "history": [
            {
                "history_id": record.history_id,
                "old_status": record.old_status,
                "new_status": record.new_status,
                "remarks": record.remarks,
                "changed_by": record.changed_by,
                "changed_at": record.changed_at,
            }
            for record in records
        ],
    }


# -------------------- OFFICER: GET DEPARTMENT COMPLAINTS --------------------

@app.get("/api/officer/complaints")
def get_department_complaints(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only officers can access department complaints.",
        )

    officer = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not officer or officer.role != "Officer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer account not found or no longer valid.",
        )

    if officer.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No department is assigned to this officer.",
        )

    complaints = (
        db.query(
            Complaint,
            Category.category_name,
            Department.department_name,
            User.name.label("citizen_name"),
            User.email.label("citizen_email"),
        )
        .join(Category, Complaint.category_id == Category.category_id)
        .join(Department, Complaint.department_id == Department.department_id)
        .join(User, Complaint.citizen_id == User.user_id)
        .filter(Complaint.department_id == officer.department_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    result = []

    for complaint, category_name, department_name, citizen_name, citizen_email in complaints:
        result.append({
            "complaint_id": complaint.complaint_id,
            "citizen_id": complaint.citizen_id,
            "citizen_name": citizen_name,
            "citizen_email": citizen_email,
            "title": complaint.title,
            "description": complaint.description,
            "category_id": complaint.category_id,
            "category_name": category_name,
            "department_id": complaint.department_id,
            "department_name": department_name,
            "location": complaint.location,
            "status": complaint.status,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        })

    return {
        "officer_id": officer.user_id,
        "officer_name": officer.name,
        "department_id": officer.department_id,
        "total_complaints": len(result),
        "complaints": result,
    }


# -------------------- OFFICER: VERIFY OR REJECT COMPLAINT --------------------

def process_officer_decision(
    complaint_id: int,
    new_status: str,
    decision_data: OfficerComplaintDecision,
    current_user: dict,
    db: Session,
):
    if current_user["role"] != "Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only officers can verify or reject complaints.",
        )

    officer = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not officer or officer.role != "Officer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer account not found or no longer valid.",
        )

    if officer.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No department is assigned to this officer.",
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.department_id == officer.department_id,
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found in your department.",
        )

    if complaint.status != "Pending Verification":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot process complaint with status '{complaint.status}'.",
        )

    try:
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(officer.user_id)},
        )

        complaint.status = new_status
        db.flush()

        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint_id,
                StatusHistory.changed_by == officer.user_id,
                StatusHistory.new_status == new_status,
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = decision_data.remarks.strip()

        db.commit()
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update complaint status.",
        )

    return {
        "message": f"Complaint {new_status.lower()} successfully.",
        "complaint_id": complaint.complaint_id,
        "previous_status": "Pending Verification",
        "current_status": complaint.status,
        "remarks": decision_data.remarks.strip(),
        "officer_id": officer.user_id,
        "department_id": officer.department_id,
    }


# -------------------- OFFICER: VERIFY COMPLAINT --------------------

@app.patch("/api/officer/complaints/{complaint_id}/verify")
def verify_complaint(
    complaint_id: int,
    decision_data: OfficerComplaintDecision,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return process_officer_decision(
        complaint_id=complaint_id,
        new_status="Verified",
        decision_data=decision_data,
        current_user=current_user,
        db=db,
    )


# -------------------- OFFICER: REJECT COMPLAINT --------------------

@app.patch("/api/officer/complaints/{complaint_id}/reject")
def reject_complaint(
    complaint_id: int,
    decision_data: OfficerComplaintDecision,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return process_officer_decision(
        complaint_id=complaint_id,
        new_status="Rejected",
        decision_data=decision_data,
        current_user=current_user,
        db=db,
    )


# -------------------- OFFICER: ASSIGN COMPLAINT TO WORKER --------------------

@app.post("/api/officer/complaints/{complaint_id}/assign")
def assign_complaint_to_worker(
    complaint_id: int,
    assignment_data: WorkerAssignmentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only officers can assign complaints to workers.",
        )

    officer = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not officer or officer.role != "Officer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer account not found or no longer valid.",
        )

    if officer.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No department is assigned to this officer.",
        )

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.department_id == officer.department_id,
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found in your department.",
        )

    if complaint.status != "Verified":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only verified complaints can be assigned. Current status: '{complaint.status}'.",
        )

    worker = (
        db.query(User)
        .filter(
            User.user_id == assignment_data.worker_id,
            User.role == "Worker",
            User.department_id == officer.department_id,
        )
        .first()
    )

    if not worker:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected worker does not belong to your department.",
        )

    active_assignment = (
        db.query(Assignment)
        .filter(
            Assignment.complaint_id == complaint_id,
            Assignment.assignment_status.in_(
                ["Assigned", "Accepted", "In Progress"]
            ),
        )
        .first()
    )

    if active_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This complaint already has an active worker assignment.",
        )

    new_assignment = Assignment(
        complaint_id=complaint.complaint_id,
        worker_id=worker.user_id,
        assigned_by=officer.user_id,
        assignment_status="Assigned",
    )

    try:
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(officer.user_id)},
        )

        db.add(new_assignment)
        complaint.status = "Assigned"
        db.flush()

        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint_id,
                StatusHistory.changed_by == officer.user_id,
                StatusHistory.new_status == "Assigned",
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = assignment_data.remarks.strip()

        db.commit()
        db.refresh(new_assignment)
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment could not be created. The complaint may already have an active assignment.",
        )

    return {
        "message": "Complaint assigned successfully.",
        "complaint_id": complaint.complaint_id,
        "complaint_status": complaint.status,
        "assignment": {
            "assignment_id": new_assignment.assignment_id,
            "worker_id": worker.user_id,
            "worker_name": worker.name,
            "department_id": officer.department_id,
            "assigned_by": officer.user_id,
            "assignment_status": new_assignment.assignment_status,
            "assigned_at": new_assignment.assigned_at,
            "remarks": assignment_data.remarks.strip(),
        },
    }
# -------------------- WORKER LOGIN --------------------

@app.post("/api/worker/login")
def login_worker(
    credentials: OfficerLogin,
    db: Session = Depends(get_db),
):
    worker = (
        db.query(User)
        .filter(User.email == credentials.email)
        .first()
    )

    if not worker or not verify_password(
        credentials.password, worker.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for worker login only.",
        )

    if worker.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No department is assigned to this worker.",
        )

    department = (
        db.query(Department)
        .filter(Department.department_id == worker.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker department is not configured.",
        )

    access_token = create_access_token(
        user_id=worker.user_id,
        role=worker.role,
    )

    return {
        "message": "Worker login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1800,
        "user_id": worker.user_id,
        "name": worker.name,
        "email": worker.email,
        "role": worker.role,
        "department_id": department.department_id,
        "department_name": department.department_name,
    }


# -------------------- WORKER PROFILE --------------------

@app.get("/api/worker/me")
def get_worker_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can access this profile.",
        )

    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    department = (
        db.query(Department)
        .filter(Department.department_id == worker.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker department is not configured.",
        )

    return {
        "user_id": worker.user_id,
        "name": worker.name,
        "email": worker.email,
        "role": worker.role,
        "department_id": department.department_id,
        "department_name": department.department_name,
        "created_at": worker.created_at,
    }


# -------------------- WORKER: VIEW ASSIGNED COMPLAINTS --------------------

@app.get("/api/worker/complaints")
def get_worker_complaints(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can view assigned complaints.",
        )

    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    assignments = (
        db.query(
            Assignment,
            Complaint,
            Category.category_name,
            Department.department_name,
            User.name.label("citizen_name"),
        )
        .join(
            Complaint,
            Assignment.complaint_id == Complaint.complaint_id,
        )
        .join(
            Category,
            Complaint.category_id == Category.category_id,
        )
        .join(
            Department,
            Complaint.department_id == Department.department_id,
        )
        .join(
            User,
            Complaint.citizen_id == User.user_id,
        )
        .filter(Assignment.worker_id == worker.user_id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )

    result = []

    for (
        assignment,
        complaint,
        category_name,
        department_name,
        citizen_name,
    ) in assignments:
        result.append({
            "assignment_id": assignment.assignment_id,
            "assignment_status": assignment.assignment_status,
            "assigned_at": assignment.assigned_at,
            "accepted_at": assignment.accepted_at,
            "completed_at": assignment.completed_at,
            "progress": assignment.progress,
            "work_notes": assignment.work_notes,

            "complaint": {
                "complaint_id": complaint.complaint_id,
                "title": complaint.title,
                "description": complaint.description,
                "location": complaint.location,
                "status": complaint.status,
                "category_name": category_name,
                "department_name": department_name,
                "citizen_name": citizen_name,
                "created_at": complaint.created_at,
            },
        })

    return {
        "worker_id": worker.user_id,
        "worker_name": worker.name,
        "department_id": worker.department_id,
        "total_assignments": len(result),
        "assignments": result,
    }
# -------------------- WORKER: ACCEPT ASSIGNED TASK --------------------

@app.patch("/api/worker/assignments/{assignment_id}/accept")
def accept_worker_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only workers can accept assignments.
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can accept assignments.",
        )

    # 2. Verify worker account from the database.
    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    # 3. Find the assignment.
    # A worker can accept only their own assignment.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.assignment_id == assignment_id,
            Assignment.worker_id == worker.user_id,
        )
        .with_for_update()
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found for this worker.",
        )

    # 4. Assignment must currently be Assigned.
    if assignment.assignment_status != "Assigned":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This assignment cannot be accepted. "
                f"Current status: '{assignment.assignment_status}'."
            ),
        )

    # 5. Fetch the related complaint.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == assignment.complaint_id
        )
        .with_for_update()
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related complaint not found.",
        )

    # 6. Complaint must also be in Assigned status.
    if complaint.status != "Assigned":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Complaint status does not allow acceptance. "
                f"Current status: '{complaint.status}'."
            ),
        )

    try:
        # 7. Set worker ID for the PostgreSQL status-history trigger.
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(worker.user_id)},
        )

        # 8. Update assignment details.
        from datetime import datetime

        assignment.assignment_status = "Accepted"
        assignment.accepted_at = datetime.now()

        # 9. Update complaint status.
        # The existing database trigger creates status history.
        complaint.status = "Accepted"

        db.flush()

        # 10. Update remarks in the history row created by the trigger.
        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint.complaint_id,
                StatusHistory.changed_by == worker.user_id,
                StatusHistory.new_status == "Accepted",
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = (
                "Worker accepted the assigned task."
            )

        # 11. Save changes.
        db.commit()

        db.refresh(assignment)
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not accept this assignment.",
        )

    return {
        "message": "Assignment accepted successfully.",
        "assignment": {
            "assignment_id": assignment.assignment_id,
            "worker_id": worker.user_id,
            "assignment_status": assignment.assignment_status,
            "accepted_at": assignment.accepted_at,
        },
        "complaint": {
            "complaint_id": complaint.complaint_id,
            "complaint_status": complaint.status,
        },
    }
# -------------------- WORKER: START ASSIGNED TASK --------------------

@app.patch("/api/worker/assignments/{assignment_id}/start")
def start_worker_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only workers can start assignments.
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can start assignments.",
        )

    # 2. Verify worker account.
    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    # 3. Find this worker's assignment.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.assignment_id == assignment_id,
            Assignment.worker_id == worker.user_id,
        )
        .with_for_update()
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found for this worker.",
        )

    # 4. Only Accepted assignments can be started.
    if assignment.assignment_status != "Accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only accepted assignments can be started. "
                f"Current status: '{assignment.assignment_status}'."
            ),
        )

    # 5. Fetch the complaint.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == assignment.complaint_id
        )
        .with_for_update()
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related complaint not found.",
        )

    if complaint.status != "Accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Complaint must be Accepted before work can start. "
                f"Current status: '{complaint.status}'."
            ),
        )

    try:
        # 6. Set worker ID for the PostgreSQL history trigger.
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(worker.user_id)},
        )

        # 7. Update assignment status and initial progress.
        assignment.assignment_status = "In Progress"
        assignment.progress = 0

        # 8. Update complaint status.
        complaint.status = "In Progress"

        db.flush()

        # 9. Add remarks to the trigger-created history record.
        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint.complaint_id,
                StatusHistory.changed_by == worker.user_id,
                StatusHistory.new_status == "In Progress",
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = "Worker started the assigned task."

        # 10. Save changes.
        db.commit()

        db.refresh(assignment)
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not start this assignment.",
        )

    return {
        "message": "Work started successfully.",
        "assignment": {
            "assignment_id": assignment.assignment_id,
            "assignment_status": assignment.assignment_status,
            "progress": assignment.progress,
        },
        "complaint": {
            "complaint_id": complaint.complaint_id,
            "complaint_status": complaint.status,
        },
    }
# -------------------- WORKER: UPDATE TASK PROGRESS --------------------

@app.patch("/api/worker/assignments/{assignment_id}/progress")
def update_worker_progress(
    assignment_id: int,
    progress: int,
    work_notes: str = "",
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only workers can update task progress.
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can update task progress.",
        )

    # 2. Validate progress percentage.
    if progress < 0 or progress > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Progress must be between 0 and 100.",
        )

    # 3. Verify worker account.
    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    # 4. Find assignment belonging to this worker.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.assignment_id == assignment_id,
            Assignment.worker_id == worker.user_id,
        )
        .with_for_update()
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found for this worker.",
        )

    # 5. Progress can be updated only while work is in progress.
    if assignment.assignment_status != "In Progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Progress can only be updated for tasks in progress.",
        )

    # 6. Fetch related complaint.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == assignment.complaint_id
        )
        .first()
    )

    if not complaint or complaint.status != "In Progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complaint is not currently in progress.",
        )

    # 7. Update progress and work notes.
    assignment.progress = progress

    if work_notes.strip():
        assignment.work_notes = work_notes.strip()

    try:
        db.commit()
        db.refresh(assignment)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update task progress.",
        )

    return {
        "message": "Task progress updated successfully.",
        "assignment": {
            "assignment_id": assignment.assignment_id,
            "assignment_status": assignment.assignment_status,
            "progress": assignment.progress,
            "work_notes": assignment.work_notes,
        },
    }
# -------------------- WORKER: COMPLETE ASSIGNED TASK --------------------

@app.patch("/api/worker/assignments/{assignment_id}/complete")
def complete_worker_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only workers can complete assignments.
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can complete assignments.",
        )

    # 2. Verify worker account.
    worker = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not worker or worker.role != "Worker":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Worker account not found or no longer valid.",
        )

    # 3. Find assignment belonging to this worker.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.assignment_id == assignment_id,
            Assignment.worker_id == worker.user_id,
        )
        .with_for_update()
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found for this worker.",
        )

    # 4. Only tasks in progress can be completed.
    if assignment.assignment_status != "In Progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only tasks in progress can be completed.",
        )

    # 5. Fetch related complaint.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == assignment.complaint_id
        )
        .with_for_update()
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related complaint not found.",
        )

    if complaint.status != "In Progress":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complaint must be In Progress before completion.",
        )

    # 6. Require 100% progress before completion.
    if assignment.progress != 100:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Task progress must be 100% before completion. "
                f"Current progress: {assignment.progress}%."
            ),
        )

    try:
        # 7. Set worker ID for PostgreSQL history trigger.
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(worker.user_id)},
        )

        # 8. Update assignment status and completion timestamp.
        from datetime import datetime

        assignment.assignment_status = "Completed"
        assignment.completed_at = datetime.now()

        # 9. Update complaint status.
        complaint.status = "Completed"

        db.flush()

        # 10. Update remarks in trigger-created history record.
        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint.complaint_id,
                StatusHistory.changed_by == worker.user_id,
                StatusHistory.new_status == "Completed",
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = (
                "Worker completed the assigned task."
            )

        # 11. Save changes.
        db.commit()

        db.refresh(assignment)
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not complete this assignment.",
        )

    return {
        "message": "Task completed successfully.",
        "assignment": {
            "assignment_id": assignment.assignment_id,
            "assignment_status": assignment.assignment_status,
            "progress": assignment.progress,
            "completed_at": assignment.completed_at,
        },
        "complaint": {
            "complaint_id": complaint.complaint_id,
            "complaint_status": complaint.status,
        },
    }
# -------------------- CITIZEN: VERIFY COMPLETED WORK --------------------

@app.patch("/api/complaints/{complaint_id}/verify-completion")
def verify_completed_work(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only citizens can verify completed work.
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can verify completed work.",
        )

    # 2. Find the complaint submitted by this citizen.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.citizen_id == current_user["user_id"],
        )
        .with_for_update()
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found.",
        )

    # 3. Complaint must be completed by the worker.
    if complaint.status != "Completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only completed complaints can be verified. "
                f"Current status: '{complaint.status}'."
            ),
        )

    # 4. Confirm that the worker assignment is completed.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.complaint_id == complaint_id,
            Assignment.assignment_status == "Completed",
        )
        .order_by(Assignment.assignment_id.desc())
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No completed worker assignment was found.",
        )

    try:
        # 5. Set citizen ID for the PostgreSQL history trigger.
        db.execute(
            text(
                "SELECT set_config('app.current_user_id', :user_id, true)"
            ),
            {"user_id": str(current_user["user_id"])},
        )

        # 6. Citizen verifies the work.
        complaint.status = "Resolved"

        db.flush()

        # 7. Update remarks in the trigger-created history record.
        latest_history = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint_id,
                StatusHistory.changed_by == current_user["user_id"],
                StatusHistory.new_status == "Resolved",
            )
            .order_by(StatusHistory.history_id.desc())
            .first()
        )

        if latest_history:
            latest_history.remarks = (
                "Citizen verified the completed work."
            )

        db.commit()
        db.refresh(complaint)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not verify the completed work.",
        )

    return {
        "message": "Completed work verified successfully.",
        "complaint": {
            "complaint_id": complaint.complaint_id,
            "previous_status": "Completed",
            "current_status": complaint.status,
            "verified_by": current_user["user_id"],
        },
    }

# -------------------- CITIZEN: SUBMIT COMPLAINT FEEDBACK --------------------

@app.post("/api/complaints/{complaint_id}/feedback")
def submit_complaint_feedback(
    complaint_id: int,
    feedback_data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from models import Feedback

    # Only citizens can submit feedback.
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can submit feedback.",
        )

    # Validate rating.
    rating = feedback_data.get("rating")

    if isinstance(rating, bool) or not isinstance(rating, int):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rating must be an integer between 1 and 5.",
        )

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rating must be between 1 and 5.",
        )

    # Validate optional comments.
    comments = feedback_data.get("comments")

    if comments is not None and not isinstance(comments, str):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comments must be text.",
        )

    comments = comments.strip() if comments else None

    try:
        # Find the complaint belonging to this citizen.
        complaint = (
            db.query(Complaint)
            .filter(
                Complaint.complaint_id == complaint_id,
                Complaint.citizen_id == current_user["user_id"],
            )
            .with_for_update()
            .first()
        )

        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found.",
            )

        # Feedback is allowed only after citizen verification.
        if complaint.status != "Resolved":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Feedback can only be submitted after the complaint is resolved.",
            )

        # Count completed resolution cycles.
        resolution_cycle = (
            db.query(StatusHistory)
            .filter(
                StatusHistory.complaint_id == complaint_id,
                StatusHistory.new_status == "Resolved",
            )
            .count()
        )

        resolution_cycle = max(resolution_cycle, 1)

        # Prevent duplicate feedback for the current resolution cycle.
        existing_feedback = (
            db.query(Feedback)
            .filter(
                Feedback.complaint_id == complaint_id,
                Feedback.resolution_cycle == resolution_cycle,
            )
            .first()
        )

        if existing_feedback:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Feedback has already been submitted for this resolution cycle.",
            )

        # Create feedback.
        new_feedback = Feedback(
            complaint_id=complaint_id,
            citizen_id=current_user["user_id"],
            resolution_cycle=resolution_cycle,
            rating=rating,
            comments=comments,
        )

        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)

        return {
            "message": "Feedback submitted successfully.",
            "feedback": {
                "feedback_id": new_feedback.feedback_id,
                "complaint_id": new_feedback.complaint_id,
                "citizen_id": new_feedback.citizen_id,
                "resolution_cycle": new_feedback.resolution_cycle,
                "rating": new_feedback.rating,
                "comments": new_feedback.comments,
                "submitted_at": new_feedback.submitted_at,
            },
        }

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback already exists for this resolution cycle.",
        )
# -------------------- OFFICER: GET DEPARTMENT WORKERS --------------------

@app.get("/api/officer/workers")
def get_department_workers(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "Officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only officers can view department workers.",
        )

    officer = (
        db.query(User)
        .filter(User.user_id == current_user["user_id"])
        .first()
    )

    if not officer or officer.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer department not found.",
        )

    workers = (
        db.query(User)
        .filter(
            User.role == "Worker",
            User.department_id == officer.department_id,
        )
        .order_by(User.name.asc())
        .all()
    )

    return {
        "workers": [
            {
                "worker_id": worker.user_id,
                "name": worker.name,
                "email": worker.email,
            }
            for worker in workers
        ]
    }
# -------------------- CITIZEN: UPLOAD COMPLAINT PHOTOGRAPH --------------------

UPLOAD_DIR = os.path.join("uploads", "complaint_evidence")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@app.post("/api/complaints/{complaint_id}/evidence")
async def upload_complaint_evidence(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only citizens can upload complaint photographs.
    if current_user["role"] != "Citizen":
        raise HTTPException(
            status_code=403,
            detail="Only citizens can upload complaint photographs.",
        )

    # Check whether the uploaded file is an allowed image.
    extension = ALLOWED_IMAGE_TYPES.get(file.content_type)

    if not extension:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed.",
        )

    # Check whether the complaint belongs to this citizen.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id,
            Complaint.citizen_id == current_user["user_id"],
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    # Read the image and enforce the 5 MB size limit.
    image_data = await file.read(MAX_FILE_SIZE + 1)

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 5 MB.",
        )

    # Generate a unique filename.
    filename = f"{uuid.uuid4().hex}{extension}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # Save the image on the backend.
        with open(file_path, "wb") as image_file:
            image_file.write(image_data)

        # Save its details in the database.
        evidence = ComplaintEvidence(
            complaint_id=complaint_id,
            uploaded_by=current_user["user_id"],
            evidence_type=file.content_type,
            file_path=file_path,
        )

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

    except Exception:
        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Could not upload the photograph.",
        )

    finally:
        await file.close()

    return {
        "message": "Photograph uploaded successfully.",
        "evidence": {
            "evidence_id": evidence.evidence_id,
            "complaint_id": evidence.complaint_id,
            "file_name": filename,
            "evidence_type": evidence.evidence_type,
        },
    }
# -------------------- EVIDENCE ACCESS AUTHORIZATION --------------------

def check_evidence_access(complaint, current_user, db):
    """
    Check whether the logged-in user can access
    photographs belonging to this complaint.
    """

    user_id = current_user["user_id"]
    role = current_user["role"]

    # CITIZEN: Can access only their own complaints.
    if role == "Citizen":
        if complaint.citizen_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access this complaint's photographs."
            )

    # OFFICER: Can access complaints from their department.
    elif role == "Officer":
        officer = (
            db.query(User)
            .filter(
                User.user_id == user_id,
                User.role == "Officer"
            )
            .first()
        )

        if not officer or officer.department_id is None:
            raise HTTPException(
                status_code=403,
                detail="Officer department not found."
            )

        if complaint.department_id != officer.department_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access photographs from another department."
            )

    # WORKER: Can access only complaints assigned to them.
    elif role == "Worker":
        worker = (
            db.query(User)
            .filter(
                User.user_id == user_id,
                User.role == "Worker"
            )
            .first()
        )

        if not worker:
            raise HTTPException(
                status_code=401,
                detail="Worker account not found."
            )

        assignment = (
            db.query(Assignment)
            .filter(
                Assignment.complaint_id == complaint.complaint_id,
                Assignment.worker_id == worker.user_id
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="This complaint is not assigned to you."
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access photographs."
        )


# -------------------- GET COMPLAINT PHOTOGRAPHS --------------------

@app.get("/api/complaints/{complaint_id}/evidence")
def get_complaint_evidence(
    complaint_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find the complaint.
    complaint = (
        db.query(Complaint)
        .filter(Complaint.complaint_id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found."
        )

    # Verify role-based access.
    check_evidence_access(complaint, current_user, db)

    # Retrieve all photographs for this complaint.
    evidence_records = (
        db.query(ComplaintEvidence)
        .filter(
            ComplaintEvidence.complaint_id == complaint_id
        )
        .order_by(ComplaintEvidence.uploaded_at.asc())
        .all()
    )

    return {
        "complaint_id": complaint_id,
        "total_photographs": len(evidence_records),
        "photographs": [
            {
                "evidence_id": evidence.evidence_id,
                "evidence_type": evidence.evidence_type,
                "uploaded_at": evidence.uploaded_at,
                "file_url": (
                    f"/api/evidence/{evidence.evidence_id}/file"
                )
            }
            for evidence in evidence_records
        ]
    }


# -------------------- VIEW / DOWNLOAD COMPLAINT PHOTOGRAPH --------------------

@app.get("/api/evidence/{evidence_id}/file")
def get_evidence_file(
    evidence_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find the photograph record.
    evidence = (
        db.query(ComplaintEvidence)
        .filter(
            ComplaintEvidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Photograph not found."
        )

    # Find its related complaint.
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == evidence.complaint_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Related complaint not found."
        )

    # Verify role-based access before returning the file.
    check_evidence_access(complaint, current_user, db)

    # Check whether the photograph exists on the server.
    if not os.path.isfile(evidence.file_path):
        raise HTTPException(
            status_code=404,
            detail="Photograph file is missing from the server."
        )

    # Return the actual image.
    return FileResponse(
        path=evidence.file_path,
        media_type=evidence.evidence_type,
        filename=os.path.basename(evidence.file_path),
        content_disposition_type="inline"
    )

# -------------------- WORKER: UPLOAD COMPLETION PHOTOGRAPHS --------------------

@app.post("/api/worker/assignments/{assignment_id}/evidence")
async def upload_worker_completion_evidence(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Only workers can upload completion photographs.
    if current_user["role"] != "Worker":
        raise HTTPException(
            status_code=403,
            detail="Only workers can upload completion photographs.",
        )

    worker_id = current_user["user_id"]

    # 2. Find the assignment and verify ownership.
    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.assignment_id == assignment_id,
            Assignment.worker_id == worker_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found or not assigned to you.",
        )

    # 3. Photographs can only be uploaded after work has started.
    if assignment.assignment_status != "In Progress":
        raise HTTPException(
            status_code=400,
            detail="Start the task before uploading completion photographs.",
        )

    # 4. Validate image type.
    extension = ALLOWED_IMAGE_TYPES.get(file.content_type)

    if not extension:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed.",
        )

    # 5. Limit to three completion photographs per worker per complaint.
    existing_count = (
        db.query(ComplaintEvidence)
        .filter(
            ComplaintEvidence.complaint_id == assignment.complaint_id,
            ComplaintEvidence.uploaded_by == worker_id,
        )
        .count()
    )

    if existing_count >= 3:
        raise HTTPException(
            status_code=400,
            detail="You can upload a maximum of 3 photographs for this complaint.",
        )

    # 6. Read and validate file size.
    image_data = await file.read(MAX_FILE_SIZE + 1)

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 5 MB.",
        )

    # 7. Generate a unique filename.
    filename = f"{uuid.uuid4().hex}{extension}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # 8. Save photograph in backend storage.
        with open(file_path, "wb") as image_file:
            image_file.write(image_data)

        # 9. Save evidence record in PostgreSQL.
        evidence = ComplaintEvidence(
            complaint_id=assignment.complaint_id,
            uploaded_by=worker_id,
            evidence_type=file.content_type,
            file_path=file_path,
        )

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

    except Exception:
        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Could not upload completion photograph.",
        )

    finally:
        await file.close()

    return {
        "message": "Completion photograph uploaded successfully.",
        "evidence": {
            "evidence_id": evidence.evidence_id,
            "assignment_id": assignment_id,
            "complaint_id": assignment.complaint_id,
            "file_name": filename,
            "evidence_type": evidence.evidence_type,
        },
    }
