
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import User, Department
from auth import hash_password


# Worker account details
WORKER_NAME = "Electrical Worker"
WORKER_EMAIL = "worker.electrical@example.com"
DEPARTMENT_ID = 2


db = SessionLocal()

try:
    # Check whether this email already exists.
    existing_user = (
        db.query(User)
        .filter(User.email == WORKER_EMAIL)
        .first()
    )

    if existing_user:
        print("An account with this email already exists.")
        print("User ID:", existing_user.user_id)
        print("Role:", existing_user.role)
        print("Department ID:", existing_user.department_id)

    else:
        # Verify that the department exists.
        department = (
            db.query(Department)
            .filter(Department.department_id == DEPARTMENT_ID)
            .first()
        )

        if not department:
            print("Department not found. Worker account not created.")

        else:
            # Ask for password without displaying it.
            password = getpass("Enter Worker password: ")
            confirm_password = getpass("Confirm Worker password: ")

            if len(password) < 8:
                print("Password must contain at least 8 characters.")

            elif password != confirm_password:
                print("Passwords do not match.")

            else:
                # Hash the password before saving.
                new_worker = User(
                    name=WORKER_NAME,
                    email=WORKER_EMAIL,
                    password_hash=hash_password(password),
                    role="Worker",
                    department_id=DEPARTMENT_ID,
                )

                db.add(new_worker)
                db.commit()
                db.refresh(new_worker)

                print("\nWorker account created successfully!")
                print("User ID:", new_worker.user_id)
                print("Name:", new_worker.name)
                print("Email:", new_worker.email)
                print("Role:", new_worker.role)
                print("Department:", department.department_name)

except IntegrityError:
    db.rollback()
    print("Database error: Worker account could not be created.")

finally:
    db.close()
