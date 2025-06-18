from sqlalchemy import Column, Integer, BigInteger, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    username = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")


class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="court")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("date", "time_slot", "court_id", name="uq_booking_slot_per_court"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)         # формата YYYY-MM-DD
    time_slot = Column(String, nullable=False)    # например "10:00–11:00"
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)

    user = relationship("User", back_populates="bookings")
    court = relationship("Court", back_populates="bookings")
