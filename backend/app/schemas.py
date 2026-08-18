from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, field_validator


class RegisterRequest(BaseModel):
    name: str; email: str; password: str; organization_id: int | None = None; role: str = "viewer"


class LoginRequest(BaseModel):
    email: str; password: str


class AdminUserCreate(BaseModel):
    name: str; email: str; password: str; password_confirmation: str; organization_id: int; role_id: int


class AuthUser(BaseModel):
    id: int; name: str; email: str; role: str; organization_id: int | None


class TokenResponse(BaseModel):
    access_token: str; token_type: str = "bearer"; user: AuthUser


class ClientOut(BaseModel):
    id: int; name: str; location: str
    model_config = ConfigDict(from_attributes=True)


class MeetingCreate(BaseModel):
    client_id: int; title: str; scheduled_for: datetime; agenda: str = ""; attendees: str = ""; notes: str = ""


class MeetingOut(MeetingCreate):
    id: int; created_at: datetime | None = None; mom: str | None = None
    model_config = ConfigDict(from_attributes=True)


class MeetingUpdate(BaseModel):
    title: str; scheduled_for: datetime; agenda: str = ""; attendees: str = ""; notes: str = ""


class DiscussionPointCreate(BaseModel):
    title: str; content: str = ""; status: str = "Open"


class DiscussionPointUpdate(BaseModel):
    title: str; content: str = ""; status: str = "Open"


class DiscussionPointOut(DiscussionPointCreate):
    id: int; meeting_id: int; client_id: int; linked_action_item_id: int | None = None; created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ActionCreate(BaseModel):
    client_id: int; title: str; owner: str; due_date: date | None = None; priority: str = "Medium"; status: str = "Open"; meeting_id: int | None = None; project_id: int | None = None; module_id: int | None = None; assigned_to: int | None = None; created_by: int | None = None; eda: date | None = None; ada: date | None = None; depends_on: int | None = None; tags: list[str] = []

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value):
        return value or []


class ActionOut(ActionCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ActionUpdate(BaseModel):
    title: str; owner: str; due_date: date | None = None; priority: str; status: str; meeting_id: int | None = None; project_id: int | None = None; module_id: int | None = None; assigned_to: int | None = None; eda: date | None = None; ada: date | None = None; depends_on: int | None = None; tags: list[str] = []


class FeatureOut(BaseModel):
    id: int; client_id: int; name: str; developer: str; sprint: str; progress: int; target_date: date; dependency: str | None
    model_config = ConfigDict(from_attributes=True)


class FeatureCreate(BaseModel):
    client_id: int; name: str; developer: str; sprint: str; progress: int = 0; target_date: date; dependency: str | None = None


class FeatureUpdate(BaseModel):
    client_id: int; name: str; developer: str; sprint: str; progress: int = 0; target_date: date; dependency: str | None = None


class BugOut(BaseModel):
    id: int; client_id: int; title: str; module: str; severity: str; assigned_developer: str; qa_owner: str; status: str; target_fix_date: date | None
    model_config = ConfigDict(from_attributes=True)


class BugCreate(BaseModel):
    client_id: int; title: str; module: str; severity: str; assigned_developer: str; qa_owner: str; status: str = "Open"; target_fix_date: date | None = None


class QASummaryCreate(BaseModel):
    total_bugs: int = 0; done: int = 0; in_progress: int = 0; to_do: int = 0; assignee: str = ""; owner: str = ""


class QASummaryOut(QASummaryCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class RequirementCreate(BaseModel):
    client_id: int; title: str; source: str = ""; requirement_type: str = "Functional"; business_objective: str = ""; description: str = ""; acceptance_criteria: str = ""; priority: str = "Medium"; status: str = "Draft"; owner: str = ""; target_date: date | None = None; dependencies: str = ""; notes: str = ""


class RequirementOut(RequirementCreate):
    id: int; created_at: datetime; updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RequirementUpdate(RequirementCreate):
    pass
