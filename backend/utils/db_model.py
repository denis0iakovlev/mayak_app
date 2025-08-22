from sqlalchemy import Column, Integer, BigInteger, String, Boolean, ForeignKey, DateTime, UniqueConstraint, Time
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    telegram_id = Column(BigInteger, primary_key=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    phone_number = Column(String)
    username = Column(String)
    role = Column(Integer, default=0)  # 0 - обычный пользователь, 1 - админ
    is_trainer = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=datetime.now)
    

    bookings = relationship("Booking", back_populates="user")

class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="Теннисный корт")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    reactivate_at = Column(DateTime, nullable=True)
    bookings = relationship("Booking", back_populates="court")

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("date", "start_time","end_time","court_id", name="uq_booking_slot_per_court2"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)         # формата YYYY-MM-DD
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    status = Column(Integer, default=0, nullable=False)           # 0 - Забронировано, 1 - Оплачено, 2 - не оплачени , 3 - отменен
    signCancel= Column(Integer, nullable=True) # Признак того кто отменил бронирования
    fee = Column(Integer,default=0) #стоимость бронирования 

    user_id = Column(Integer, ForeignKey("users.telegram_id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)


    user = relationship("User", back_populates="bookings")
    court = relationship("Court", back_populates="bookings")
