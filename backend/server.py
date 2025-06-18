from fastapi import FastAPI, Depends
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .db_model.models import Base, Booking

DATABASE_URL = "sqlite:///./data.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

# Create database tables on startup
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/occupied")
def get_occupied_slots(date: str | None = None, db: Session = Depends(get_db)):
    """Return booked slots for the given date."""
    if date is None:
        raise HTTPException(status_code=400, detail="date query parameter is required")

    bookings = db.query(Booking).filter(Booking.date == date).all()

    return [
        {
            "id": booking.id,
            "date": booking.date,
            "time_slot": booking.time_slot,
            "user_id": booking.user_id,
            "court_id": booking.court_id,
        }
        for booking in bookings
    ]
