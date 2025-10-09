from __future__ import annotations

from typing import List, Optional, Literal
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict, model_validator

# -------
# Auth / Users
# -------

class LoginRequest(BaseModel):
    email: str
    password: str

class UserBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# -------
# 2 Roles Admin or User
# -------
class UserRead(UserBase):
    id: UUID
    is_active: bool = True
    role: Literal["user", "admin"] = "user"
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

# ---------------------------
# Calendars/Sharing
# ---------------------------

class CalendarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    visibility: Literal["public", "private"] = "private"

class CalendarUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    visibility: Optional[Literal["public", "private"]] = None

class CalendarRead(BaseModel):
    id: UUID
    owner_user_id: UUID
    name: str
    visibility: Literal["public", "private"]
    created_at: datetime
    updated_at: datetime

class CalendarShareCreate(BaseModel):
    user_id: UUID
    permission: Literal["view"] = "view"

class CalendarShareRead(BaseModel):
    calendar_id: UUID
    user_id: UUID
    permission: Literal["view"] = "view"

# ---------
# Hidden Feature
# ---------

class CalendarSubscriptionUpdate(BaseModel):
    is_hidden: bool

# ---------------------------
# Events, Recurrence, Reminders & Event Sharing/Copy
# ---------------------------

class Reminder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    minutes_before_start: int = Field(..., ge=0, le=10080)
    method: Literal["popup"] = "popup"

class EventBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    location: Optional[str] = Field(None, max_length=500)
    start_at: datetime
    end_at: datetime
    timezone: Optional[str] = Field(None, description="IANA tz like 'America/New_York'")
    all_day: bool = False
    visibility: Literal["public", "private", "busy"] = "private"
    rrule: Optional[str] = None
    reminders: List[Reminder] = []

    @model_validator(mode="after")
    def validate_times(self) -> "EventBase":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    location: Optional[str] = Field(None, max_length=500)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    timezone: Optional[str] = None
    all_day: Optional[bool] = None
    visibility: Optional[Literal["public", "private", "busy"]] = None
    rrule: Optional[str] = None
    reminders: Optional[List[Reminder]] = None

    @model_validator(mode="after")
    def validate_times(self) -> "EventUpdate":
        if self.start_at and self.end_at and self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self

class EventRead(EventBase):
    id: UUID
    calendar_id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime

class EventShareCreate(BaseModel):
    user_id: UUID
    permission: Literal["view"] = "view"

class EventShareRead(BaseModel):
    event_id: UUID
    user_id: UUID
    permission: Literal["view"] = "view"

# ---------------------------
# Errors / Notifications
# ---------------------------

class APIError(BaseModel):
    message: str = Field(...)
    code: str = Field(...)

class BrowserPushSubscription(BaseModel):
    endpoint: str
