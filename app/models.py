from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # operator | admin | supervisor
    function: Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    login: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    equipment_type: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    internal_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String, default="available")
    hourmeter_current: Mapped[float] = mapped_column(Float, default=0)
    maintenance_limit: Mapped[float] = mapped_column(Float, default=250)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plate: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="available")
    mileage_current: Mapped[float] = mapped_column(Float, default=0)


class Journey(Base):
    __tablename__ = "journeys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    operator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(Date, nullable=False)
    garage_out_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    garage_return_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lunch_break_minutes: Mapped[int] = mapped_column(Integer, default=0)
    overtime_minutes: Mapped[int] = mapped_column(Integer, default=0)

    operator = relationship("User")


class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    operator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    machine_id: Mapped[int | None] = mapped_column(ForeignKey("machines.id"), nullable=True)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"), nullable=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open")
    hourmeter_initial: Mapped[float | None] = mapped_column(Float, nullable=True)
    hourmeter_final: Mapped[float | None] = mapped_column(Float, nullable=True)
    mileage_initial: Mapped[float | None] = mapped_column(Float, nullable=True)
    mileage_final: Mapped[float | None] = mapped_column(Float, nullable=True)


class PhotoRecord(Base):
    __tablename__ = "photo_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("service_orders.id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Maintenance(Base):
    __tablename__ = "maintenances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id"), nullable=False)
    maintenance_type: Mapped[str] = mapped_column(String, nullable=False)
    scheduled_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    accumulated_hours: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class SyncEvent(Base):
    __tablename__ = "sync_events"
    __table_args__ = (UniqueConstraint("client_event_id", name="uq_client_event"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_event_id: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=True)
    processed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
