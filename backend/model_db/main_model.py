from sqlalchemy import Column,Index, Integer, BigInteger, String, Boolean, ForeignKey, DateTime, UniqueConstraint, Time
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
    grids = relationship("PriceGrid",
                            back_populates="court",
                            cascade="all, delete-orphan",
                            order_by="PriceGrid.time_start"  
                        )

class PriceGrid(Base):
    __tablename__ ="price_grid"
    id = Column(Integer, primary_key=True, autoincrement=True)
    time_start = Column(Time, nullable=False)
    time_end = Column(Time, nullable=False)
    price = Column(Integer, nullable=False)
    price_trainer = Column(Integer, nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id", ondelete="CASCADE"),nullable=False)
    court = relationship("Court",back_populates="grids" ) 

    __table_args__ = (
        UniqueConstraint("court_id", "time_start", "time_end", name="uq_pricegrid_court_slot"),
        Index("ix_pricegrid_court_id", "court_id")
    )

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

class ChatToPublic(Base):
    __tablename__ = "postingchats"
    chat_id=Column(BigInteger, primary_key=True, nullable=False, autoincrement=False)
    editing_msg_id=Column(BigInteger, nullable=True)
    post_scheduler=Column(Boolean, default=False)
    can_send = Column(Boolean, nullable=False)
    name_chat = Column(String, nullable=False)
              