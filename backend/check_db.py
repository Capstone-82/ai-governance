
from sqlmodel import Session, select
from app.core.db import engine
from app.models.telemetry import GovernanceTelemetry

try:
    with Session(engine) as session:
        statement = select(GovernanceTelemetry).limit(1)
        result = session.exec(statement).first()
        print("Successfully connected and read from DB.")
except Exception as e:
    print(f"Error reading DB: {e}")
