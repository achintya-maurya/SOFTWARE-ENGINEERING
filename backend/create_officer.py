
from getpass import getpass

from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import User, Department
from auth import hash_password


# Officer account details
OFFICER_NAME = "Electrical Officer"
OFFICER_EMAIL = "officer.electrical@example.com"
DEPARTMENT_ID = 2


db = SessionLocal()

try:
    # Check whether this email already exists.
    existing_user = (
        db.query(User)
        .filter(User.email == OFFICER_EMAIL)
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
            print("Department not found. Officer account not created.")

        else:
            # Ask for password without displaying it.
            password = getpass("Enter Officer password: ")
            confirm_password = getpass("Confirm Officer password: ")

            if len(password) < 8:
                print("Password must contain at least 8 characters.")

            elif password != confirm_password:
                print("Passwords do not match.")

            else:
                # Hash the password before saving.
                new_officer = User(
                    name=OFFICER_NAME,
                    email=OFFICER_EMAIL,
                    password_hash=hash_password(password),
                    role="Officer",
                    department_id=DEPARTMENT_ID,
                )

                db.add(new_officer)
                db.commit()
                db.refresh(new_officer)

                print("\nOfficer account created successfully!")
                print("User ID:", new_officer.user_id)
                print("Name:", new_officer.name)
                print("Email:", new_officer.email)
                print("Role:", new_officer.role)
                print("Department:", department.department_name)

except IntegrityError:
    db.rollback()
    print("Database error: Officer account could not be created.")

finally:
    db.close()
