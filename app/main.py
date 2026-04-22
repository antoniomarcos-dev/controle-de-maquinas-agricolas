from datetime import date, datetime

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Controle Operacional de Máquinas", version="1.0.0")


@app.on_event("startup")
def seed_admin():
    db = next(get_db())
    try:
        exists = db.query(models.User).filter(models.User.login == "admin").first()
        if not exists:
            db.add(
                models.User(
                    name="Administrador",
                    role="admin",
                    function="Gestão",
                    login="admin",
                    password_hash=auth.get_password_hash("admin123"),
                    status="active",
                )
            )
            db.commit()
    finally:
        db.close()


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.login == payload.login).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Login ou senha inválidos")

    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.Token(access_token=token)


@app.post("/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin")),
):
    if db.query(models.User).filter(models.User.login == payload.login).first():
        raise HTTPException(status_code=400, detail="Login já utilizado")

    user = models.User(
        name=payload.name,
        role=payload.role,
        function=payload.function,
        photo_url=payload.photo_url,
        login=payload.login,
        password_hash=auth.get_password_hash(payload.password),
        status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin", "supervisor")),
):
    return db.query(models.User).all()


@app.post("/machines")
def create_machine(
    payload: schemas.MachineCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin")),
):
    machine = models.Machine(**payload.model_dump())
    db.add(machine)
    db.commit()
    db.refresh(machine)
    return machine


@app.get("/machines")
def list_machines(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Machine).all()


@app.post("/vehicles")
def create_vehicle(
    payload: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin")),
):
    vehicle = models.Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@app.get("/vehicles")
def list_vehicles(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Vehicle).all()


@app.post("/journeys/start")
def start_journey(
    payload: schemas.JourneyStart,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    operator = db.get(models.User, payload.operator_id)
    if not operator:
        raise HTTPException(status_code=404, detail="Operador não encontrado")

    journey = models.Journey(operator_id=payload.operator_id, date=date.today())
    db.add(journey)
    db.commit()
    db.refresh(journey)
    return journey


@app.post("/journeys/{journey_id}/finish")
def finish_journey(
    journey_id: int,
    payload: schemas.JourneyFinish,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    journey = db.get(models.Journey, journey_id)
    if not journey:
        raise HTTPException(status_code=404, detail="Jornada não encontrada")

    journey.garage_return_at = datetime.utcnow()
    journey.lunch_break_minutes = payload.lunch_break_minutes

    total_minutes = int((journey.garage_return_at - journey.garage_out_at).total_seconds() / 60)
    overtime = max(0, total_minutes - 8 * 60 - payload.lunch_break_minutes)
    journey.overtime_minutes = overtime

    db.commit()
    db.refresh(journey)
    return journey


@app.post("/services/start")
def start_service(
    payload: schemas.ServiceStart,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    if not payload.machine_id and not payload.vehicle_id:
        raise HTTPException(status_code=400, detail="Informe máquina ou veículo")

    service = models.ServiceOrder(
        operator_id=payload.operator_id,
        machine_id=payload.machine_id,
        vehicle_id=payload.vehicle_id,
        date=date.today(),
        location=payload.location,
        notes=payload.notes,
        hourmeter_initial=payload.hourmeter_initial,
        mileage_initial=payload.mileage_initial,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@app.post("/services/{service_id}/finish")
def finish_service(
    service_id: int,
    payload: schemas.ServiceFinish,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    service = db.get(models.ServiceOrder, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    service.status = "finished"
    service.finished_at = datetime.utcnow()
    service.notes = payload.notes or service.notes
    service.hourmeter_final = payload.hourmeter_final
    service.mileage_final = payload.mileage_final

    if service.machine_id and payload.hourmeter_final is not None:
        machine = db.get(models.Machine, service.machine_id)
        if machine:
            machine.hourmeter_current = payload.hourmeter_final

    if service.vehicle_id and payload.mileage_final is not None:
        vehicle = db.get(models.Vehicle, service.vehicle_id)
        if vehicle:
            vehicle.mileage_current = payload.mileage_final

    db.commit()
    db.refresh(service)
    return service


@app.post("/services/{service_id}/photos")
def register_photo(
    service_id: int,
    payload: schemas.PhotoCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    if not db.get(models.ServiceOrder, service_id):
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    photo = models.PhotoRecord(service_id=service_id, **payload.model_dump())
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@app.post("/sync/offline-events")
def sync_offline_events(
    payload: schemas.SyncPayload,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    accepted = 0
    duplicates = 0
    for event in payload.events:
        exists = (
            db.query(models.SyncEvent)
            .filter(models.SyncEvent.client_event_id == event.client_event_id)
            .first()
        )
        if exists:
            duplicates += 1
            continue

        db.add(models.SyncEvent(client_event_id=event.client_event_id, event_type=event.event_type))
        accepted += 1

    db.commit()
    return {"accepted": accepted, "duplicates": duplicates}


@app.get("/reports/daily", response_model=schemas.DailyReportOut)
def daily_report(
    report_date: date,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin", "supervisor")),
):
    operators_active = (
        db.query(func.count(func.distinct(models.Journey.operator_id)))
        .filter(models.Journey.date == report_date)
        .scalar()
    )
    services_open = (
        db.query(func.count(models.ServiceOrder.id))
        .filter(models.ServiceOrder.date == report_date, models.ServiceOrder.status == "open")
        .scalar()
    )
    services_finished = (
        db.query(func.count(models.ServiceOrder.id))
        .filter(models.ServiceOrder.date == report_date, models.ServiceOrder.status == "finished")
        .scalar()
    )
    return schemas.DailyReportOut(
        date=report_date,
        operators_active=operators_active or 0,
        services_open=services_open or 0,
        services_finished=services_finished or 0,
    )


@app.get("/maintenance/alerts", response_model=list[schemas.MaintenanceAlertOut])
def maintenance_alerts(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_roles("admin", "supervisor")),
):
    machines = db.query(models.Machine).all()
    alerts = []
    for machine in machines:
        alerts.append(
            schemas.MaintenanceAlertOut(
                machine_id=machine.id,
                machine_name=machine.name,
                hourmeter_current=machine.hourmeter_current,
                maintenance_limit=machine.maintenance_limit,
                needs_maintenance=machine.hourmeter_current >= machine.maintenance_limit,
            )
        )
    return alerts
