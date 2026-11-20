from database import engine
from models import Base

if __name__ == "__main__":
    with engine.connect() as connection:
        print("PostgreSQL connection: OK")

    print("SQLAlchemy models:", len(Base.metadata.tables))
    print("Tables:", ", ".join(Base.metadata.tables.keys()))