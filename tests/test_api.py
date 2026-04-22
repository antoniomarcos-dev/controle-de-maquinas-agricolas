from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def login_admin_token() -> str:
    resp = client.post("/auth/login", json={"login": "admin", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_basic_operational_flow():
    token = login_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    op_resp = client.post(
        "/users",
        headers=headers,
        json={
            "name": "Operador 1",
            "role": "operator",
            "function": "Tratorista",
            "login": "op1",
            "password": "senha123",
        },
    )
    assert op_resp.status_code == 200
    operator_id = op_resp.json()["id"]

    machine_resp = client.post(
        "/machines",
        headers=headers,
        json={
            "name": "Trator A",
            "equipment_type": "trator",
            "model": "T-90",
            "internal_number": "TR-001",
            "maintenance_limit": 100,
        },
    )
    assert machine_resp.status_code == 200
    machine_id = machine_resp.json()["id"]

    journey_resp = client.post("/journeys/start", headers=headers, json={"operator_id": operator_id})
    assert journey_resp.status_code == 200

    service_start = client.post(
        "/services/start",
        headers=headers,
        json={
            "operator_id": operator_id,
            "machine_id": machine_id,
            "location": "Talhão 5",
            "hourmeter_initial": 10,
        },
    )
    assert service_start.status_code == 200
    service_id = service_start.json()["id"]

    service_finish = client.post(
        f"/services/{service_id}/finish",
        headers=headers,
        json={"hourmeter_final": 20, "notes": "Serviço concluído"},
    )
    assert service_finish.status_code == 200

    alerts = client.get("/maintenance/alerts", headers=headers)
    assert alerts.status_code == 200
    assert len(alerts.json()) >= 1
