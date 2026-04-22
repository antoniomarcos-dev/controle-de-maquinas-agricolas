from datetime import date, datetime

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    login: str
    password: str


class UserCreate(BaseModel):
    name: str
    role: str
    function: str | None = None
    photo_url: str | None = None
    login: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    role: str
    function: str | None = None
    photo_url: str | None = None
    login: str
    status: str

    class Config:
        from_attributes = True


class MachineCreate(BaseModel):
    name: str
    equipment_type: str
    model: str
    color: str | None = None
    internal_number: str
    maintenance_limit: float = 250


class VehicleCreate(BaseModel):
    plate: str
    vehicle_type: str
    model: str


class JourneyStart(BaseModel):
    operator_id: int


class JourneyFinish(BaseModel):
    lunch_break_minutes: int = 0


class ServiceStart(BaseModel):
    operator_id: int
    machine_id: int | None = None
    vehicle_id: int | None = None
    location: str | None = None
    notes: str | None = None
    hourmeter_initial: float | None = None
    mileage_initial: float | None = None


class ServiceFinish(BaseModel):
    notes: str | None = None
    hourmeter_final: float | None = None
    mileage_final: float | None = None


class PhotoCreate(BaseModel):
    image_url: str
    latitude: float | None = None
    longitude: float | None = None


class SyncEventIn(BaseModel):
    client_event_id: str
    event_type: str


class SyncPayload(BaseModel):
    events: list[SyncEventIn] = Field(default_factory=list)


class DailyReportOut(BaseModel):
    date: date
    operators_active: int
    services_open: int
    services_finished: int


class MaintenanceAlertOut(BaseModel):
    machine_id: int
    machine_name: str
    hourmeter_current: float
    maintenance_limit: float
    needs_maintenance: bool
