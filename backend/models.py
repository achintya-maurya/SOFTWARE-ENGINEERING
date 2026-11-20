from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# -------------------- DEPARTMENT MODEL --------------------

class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)


# -------------------- USER MODEL --------------------

class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('Citizen', 'Officer', 'Worker', 'Admin')",
            name="users_role_check",
        ),
        CheckConstraint(
            "role NOT IN ('Officer', 'Worker') OR department_id IS NOT NULL",
            name="officer_worker_department_required",
        ),
    )

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)

    department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )


# -------------------- CATEGORY MODEL --------------------

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)


# -------------------- COMPLAINT MODEL --------------------

class Complaint(Base):
    __tablename__ = "complaints"

    __table_args__ = (
        CheckConstraint(
            """status IN (
                'Pending Verification',
                'Verified',
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Resolved',
                'Rejected',
                'Reopened'
            )""",
            name="complaints_status_check",
        ),
    )

    complaint_id = Column(Integer, primary_key=True, autoincrement=True)

    citizen_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.category_id"),
        nullable=False,
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.department_id"),
        nullable=False,
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(Text, nullable=False)

    status = Column(
        String(30),
        nullable=False,
        server_default="Pending Verification",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )


# -------------------- ASSIGNMENT MODEL --------------------

class Assignment(Base):
    __tablename__ = "assignments"

    __table_args__ = (
        CheckConstraint(
            """assignment_status IN (
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Cancelled'
            )""",
            name="assignments_status_check",
        ),

        CheckConstraint(
            "progress BETWEEN 0 AND 100",
            name="assignments_progress_check",
        ),
    )

    assignment_id = Column(Integer, primary_key=True, autoincrement=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
    )

    worker_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    assigned_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    assigned_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )

    accepted_at = Column(DateTime, nullable=True)

    completed_at = Column(DateTime, nullable=True)

    assignment_status = Column(
        String(20),
        nullable=False,
        server_default="Assigned",
    )

    # New field: Work progress from 0 to 100.
    progress = Column(
        Integer,
        nullable=False,
        server_default="0",
    )

    # New field: Work notes added by the worker.
    work_notes = Column(Text, nullable=True)


# -------------------- STATUS HISTORY MODEL --------------------

class StatusHistory(Base):
    __tablename__ = "status_history"

    __table_args__ = (
        CheckConstraint(
            """new_status IN (
                'Pending Verification',
                'Verified',
                'Assigned',
                'Accepted',
                'In Progress',
                'Completed',
                'Resolved',
                'Rejected',
                'Reopened'
            )""",
            name="status_history_new_status_check",
        ),
    )

    history_id = Column(Integer, primary_key=True, autoincrement=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    remarks = Column(Text, nullable=True)

    changed_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )


# -------------------- COMPLAINT EVIDENCE MODEL --------------------

class ComplaintEvidence(Base):
    __tablename__ = "complaint_evidence"

    evidence_id = Column(Integer, primary_key=True, autoincrement=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    evidence_type = Column(String(30), nullable=False)
    file_path = Column(Text, nullable=False)

    uploaded_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )


# -------------------- SLA ESCALATION MODEL --------------------

class SLAEscalation(Base):
    __tablename__ = "sla_escalations"

    escalation_id = Column(Integer, primary_key=True, autoincrement=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
    )

    escalation_level = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)

    escalated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )

    status = Column(
        String(20),
        nullable=False,
        server_default="Pending",
    )


# -------------------- NOTIFICATION MODEL --------------------

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=True,
    )

    message = Column(Text, nullable=False)

    is_read = Column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )


# -------------------- FEEDBACK MODEL --------------------

class Feedback(Base):
    __tablename__ = "feedback"

    __table_args__ = (
        CheckConstraint(
            "rating BETWEEN 1 AND 5",
            name="feedback_rating_check",
        ),

        UniqueConstraint(
            "complaint_id",
            "resolution_cycle",
            name="feedback_complaint_cycle_unique",
        ),
    )

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)

    complaint_id = Column(
        Integer,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
    )

    citizen_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    resolution_cycle = Column(
        Integer,
        nullable=False,
        server_default="1",
    )

    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)

    submitted_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )