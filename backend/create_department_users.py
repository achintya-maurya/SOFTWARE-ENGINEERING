
from database import SessionLocal
from models import User, Department
from auth import hash_password


# Temporary password for all newly created accounts
DEFAULT_PASSWORD = "SmartCity@2026"


# Accounts to create
accounts = [
    {
        "name": "Road Officer",
        "email": "officer.road@example.com",
        "role": "Officer",
        "department": "Road Maintenance",
    },
    {
        "name": "Road Worker",
        "email": "worker.road@example.com",
        "role": "Worker",
        "department": "Road Maintenance",
    },
    {
        "name": "Sanitation Officer",
        "email": "officer.sanitation@example.com",
        "role": "Officer",
        "department": "Sanitation Department",
    },
    {
        "name": "Sanitation Worker",
        "email": "worker.sanitation@example.com",
        "role": "Worker",
        "department": "Sanitation Department",
    },
    {
        "name": "Water Supply Officer",
        "email": "officer.water@example.com",
        "role": "Officer",
        "department": "Water Supply Department",
    },
    {
        "name": "Water Supply Worker",
        "email": "worker.water@example.com",
        "role": "Worker",
        "department": "Water Supply Department",
    },
    {
        "name": "Drainage Officer",
        "email": "officer.drainage@example.com",
        "role": "Officer",
        "department": "Drainage Department",
    },
    {
        "name": "Drainage Worker",
        "email": "worker.drainage@example.com",
        "role": "Worker",
        "department": "Drainage Department",
    },
]


def create_accounts():
    db = SessionLocal()

    try:
        created = 0
        skipped = 0

        for account in accounts:

            # Find the department
            department = (
                db.query(Department)
                .filter(
                    Department.department_name == account["department"]
                )
                .first()
            )

            if not department:
                raise ValueError(
                    f"Department not found: {account['department']}"
                )

            # Check whether email already exists
            existing_user = (
                db.query(User)
                .filter(User.email == account["email"])
                .first()
            )

            if existing_user:
                # Do not silently accept an incorrectly configured account
                if (
                    existing_user.role != account["role"]
                    or existing_user.department_id != department.department_id
                ):
                    raise ValueError(
                        f"Email already exists with different details: "
                        f"{account['email']}"
                    )

                print(f"Already exists: {account['email']}")
                skipped += 1
                continue

            # Create account with a securely hashed password
            new_user = User(
                name=account["name"],
                email=account["email"],
                password_hash=hash_password(DEFAULT_PASSWORD),
                role=account["role"],
                department_id=department.department_id,
            )

            db.add(new_user)
            created += 1

        db.commit()

        print("\nAccount creation completed.")
        print(f"Created: {created}")
        print(f"Skipped: {skipped}")
        print(f"Temporary password: {DEFAULT_PASSWORD}")

    except Exception as error:
        db.rollback()
        print(f"\nError: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    create_accounts()
