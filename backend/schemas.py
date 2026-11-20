from pydantic import BaseModel, EmailStr, Field


# -------------------- CITIZEN SCHEMAS --------------------

class CitizenRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class CitizenLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# -------------------- OFFICER SCHEMAS --------------------

class OfficerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OfficerComplaintDecision(BaseModel):
    remarks: str = Field(min_length=3, max_length=500)


class WorkerAssignmentCreate(BaseModel):
    worker_id: int = Field(gt=0)
    remarks: str = Field(
        default="Complaint assigned to worker.",
        min_length=3,
        max_length=500,
    )


# -------------------- COMPLAINT SCHEMAS --------------------

class ComplaintCreate(BaseModel):
    category_id: int = Field(gt=0)
    department_id: int = Field(gt=0)
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)
    location: str = Field(min_length=3)
