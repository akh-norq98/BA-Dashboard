import os
from datetime import date

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test_deliveryhub_auth.db"
os.environ["DELIVERY_HUB_JWT_SECRET"] = "test-only-secret-that-is-not-the-default"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import ActionItem, Bug, Client, User
from app.security import hash_password


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        db = SessionLocal()
        finkomm = db.query(Client).filter(Client.name == "Finkomm").one()
        hhp = db.query(Client).filter(Client.name == "HHP").one()
        db.add_all([
            User(name="Finkomm viewer", email="finkomm@example.test", password_hash=hash_password("password"), organization_id=finkomm.id, role="viewer"),
            User(name="HHP editor", email="hhp@example.test", password_hash=hash_password("password"), organization_id=hhp.id, role="editor"),
            User(name="NorQ admin", email="admin@example.test", password_hash=hash_password("password"), organization_id=None, role="admin"),
            Bug(client_id=finkomm.id, title="Finkomm bug", module="Portal", severity="Low", assigned_developer="", qa_owner=""),
            Bug(client_id=hhp.id, title="HHP bug", module="Portal", severity="Low", assigned_developer="", qa_owner=""),
            ActionItem(client_id=hhp.id, title="HHP action", owner="Delivery", due_date=date.today(), priority="Medium", status="Open"),
        ])
        db.commit(); db.close()
        yield test_client
    Base.metadata.drop_all(engine)


def token_for(client, email):
    response = client.post("/api/auth/login", json={"email": email, "password": "password"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_self_registration_cannot_select_a_client(client):
    response = client.post("/api/auth/register", json={"name": "Attacker", "email": "attacker@example.test", "password": "password", "organization_id": 1, "role": "admin"})
    assert response.status_code == 403


def test_finkomm_user_only_sees_finkomm_legacy_data(client):
    headers = token_for(client, "finkomm@example.test")
    template = client.get("/api/bugs/import-template", headers=headers)
    assert template.status_code == 200
    assert template.headers["content-type"].startswith("text/csv")
    assert template.text.strip() == "client_id,title,module,severity,assigned_developer,qa_owner,status,target_fix_date"
    response = client.get("/api/bugs", headers=headers)
    assert response.status_code == 200
    assert [bug["title"] for bug in response.json()] == ["Finkomm bug"]

    hhp = client.get("/api/clients", headers=headers)
    assert [item["name"] for item in hhp.json()] == ["Finkomm"]


def test_finkomm_user_cannot_read_or_write_hhp_records(client):
    headers = token_for(client, "finkomm@example.test")
    db = SessionLocal(); hhp_bug = db.query(Bug).filter(Bug.title == "HHP bug").one(); hhp_id = hhp_bug.id; db.close()

    assert client.get("/api/bugs?client_id=2", headers=headers).status_code == 403
    assert client.get("/api/dashboard?client_id=2", headers=headers).status_code == 403
    response = client.patch(f"/api/bugs/{hhp_id}", headers=headers, json={"title": "Stolen"})
    assert response.status_code == 403


def test_admin_can_update_action_item_across_client_organizations(client):
    headers = token_for(client, "admin@example.test")
    db = SessionLocal(); action = db.query(ActionItem).filter(ActionItem.title == "HHP action").one(); action_id = action.id; db.close()
    response = client.patch(f"/api/action-items/{action_id}", headers=headers, json={"title": "HHP action updated", "owner": "Delivery", "priority": "High", "status": "In Progress"})
    assert response.status_code == 200
    assert response.json()["title"] == "HHP action updated"


def test_admin_can_create_user_with_client_and_role(client):
    headers = token_for(client, "admin@example.test")
    clients = client.get("/api/clients", headers=headers).json()
    roles = client.get("/api/roles", headers=headers).json()
    hhp_id = next(item["id"] for item in clients if item["name"] == "HHP")
    viewer_role_id = next(item["id"] for item in roles if item["name"] == "viewer")
    response = client.post("/api/users", headers=headers, json={"name": "New HHP User", "email": "new-hhp@example.test", "password": "password", "password_confirmation": "password", "organization_id": hhp_id, "role_id": viewer_role_id})
    assert response.status_code == 201
    assert response.json()["organization_id"] == hhp_id
    assert response.json()["role"] == "viewer"
