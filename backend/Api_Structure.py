from __future__ import annotations

from typing import Optional, List, Literal, Dict, Tuple, Set
from uuid import UUID, uuid4
from datetime import datetime
from .models import PushSubscription

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer

# NEW: SQLAlchemy imports for queries + session typing
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from .Api_Pydantic import (
    # users/auth
    LoginRequest, UserCreate, UserRead, UserUpdate,
    # calendars
    CalendarCreate, CalendarUpdate, CalendarRead,
    CalendarShareCreate, CalendarShareRead,
    CalendarSubscriptionUpdate,
    # events
    Reminder, EventCreate, EventUpdate, EventRead,
    EventShareCreate, EventShareRead,
    # misc
    APIError, BrowserPushSubscription,
)

# NEW: DB engine/session and ORM models
from .db import lifespan, get_session
from .models import User, Calendar, CalendarShare, CalendarSubscription, Event, EventShare



# CHANGE: add lifespan=lifespan so the DB engine/session lifecycle is managed
app = FastAPI(title="Calendar API", version="0.1.0", lifespan=lifespan)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ------
#in the works
# IN-MEMORY STORES (demo only) — this will not be perminent. the data stored will be gone once the server restarts.
# --------


def _now():
    return datetime.now().astimezone()

"""
# --- DB-backed helpers (replace the old in-memory demo bits) ---
from uuid import UUID  

def _now():
    # keep helper consistent with existing code
    return datetime.now().astimezone()
"""

DEMO_EMAIL = "demo@example.com"

async def ensure_demo_user(session: AsyncSession) -> "User":
    result = await session.execute(select(User).where(User.email == DEMO_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(
        email=DEMO_EMAIL,
        full_name="Demo User",
        role="user",
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
"""
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
        )
    user = await ensure_demo_user(session)
    return UserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
"""
# --------------------------------------------------------------------
# Auth helpers
# --------------------------------------------------------------------
"""
async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserRead:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    _bootstrap_demo()
    user = USERS.get(DEMO_USER_ID)
    return UserRead(**user)  # type: ignore[arg-type]
"""

async def get_current_user(token: str = Depends(oauth2_scheme),
                           session: AsyncSession = Depends(get_session)) -> UserRead:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    user = await ensure_demo_user(session)
    return UserRead(
        id=user.id, email=user.email, full_name=user.full_name, avatar_url=user.avatar_url,
        is_active=user.is_active, role=user.role, created_at=user.created_at, updated_at=user.updated_at
    )

# --------------------------------------------------------------------
# Auth (login/logout)
# --------------------------------------------------------------------
@app.post("/login")
async def login(payload: LoginRequest):
    if payload.email and payload.password:
        return {"access_token": "demo-token", "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/logout", status_code=204)
async def logout(current_user: UserRead = Depends(get_current_user)):
    return None

# --------------------------------------------------------------------
# Users (basic + admin stubs)
# --------------------------------------------------------------------
@app.post("/users", status_code=201)
async def create_user(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    exists = (await session.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if exists:
        raise HTTPException(409, "Email already exists")
    user = User(email=payload.email, full_name=payload.full_name, avatar_url=payload.avatar_url)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRead(
        id=user.id, email=user.email, full_name=user.full_name, avatar_url=user.avatar_url,
        is_active=user.is_active, role=user.role, created_at=user.created_at, updated_at=user.updated_at
    )


@app.get("/users/{id}")
async def get_user(id: UUID, session: AsyncSession = Depends(get_session), current_user: UserRead = Depends(get_current_user)):
    user = (await session.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "id": user.id, "email": user.email, "full_name": user.full_name, "avatar_url": user.avatar_url,
        "is_active": user.is_active, "role": user.role, "created_at": user.created_at, "updated_at": user.updated_at
    }


@app.put("/users/{id}")
async def update_user(id: UUID, payload: UserUpdate, session: AsyncSession = Depends(get_session),
                      current_user: UserRead = Depends(get_current_user)):
    user = (await session.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    await session.commit()
    await session.refresh(user)
    return {
        "id": user.id, "email": user.email, "full_name": user.full_name, "avatar_url": user.avatar_url,
        "is_active": user.is_active, "role": user.role, "created_at": user.created_at, "updated_at": user.updated_at
    }


@app.put("/admin/users/{id}/deactivate")
async def admin_deactivate_user(
    id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    user = (await session.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = False
    await session.commit()
    return {"id": str(id), "is_active": False}

@app.put("/admin/users/{id}/role")
async def admin_set_role(
    id: UUID,
    role: Literal["user", "admin"],
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    user = (await session.execute(select(User).where(User.id == id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = role
    await session.commit()
    return {"id": str(id), "role": role}
# --------------------------------------------------------------------
# Calendars Features (create, visibility, share, follow/hide)
# --------------------------------------------------------------------
@app.post("/calendars", status_code=201)
async def create_calendar(payload: CalendarCreate, session: AsyncSession = Depends(get_session),
                          current_user: UserRead = Depends(get_current_user)):
    cal = Calendar(owner_user_id=current_user.id, name=payload.name, visibility=payload.visibility)
    session.add(cal)
    await session.commit()
    await session.refresh(cal)
    return {
        "id": cal.id, "owner_user_id": cal.owner_user_id, "name": cal.name, "visibility": cal.visibility,
        "created_at": cal.created_at, "updated_at": cal.updated_at
    }

@app.get("/calendars/{calendar_id}")
async def get_calendar(calendar_id: UUID, session: AsyncSession = Depends(get_session),
                       current_user: UserRead = Depends(get_current_user)):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    is_owner = cal.owner_user_id == current_user.id
    is_public = cal.visibility == "public"
    is_shared = (
        await session.execute(
            select(CalendarShare).where(
                CalendarShare.calendar_id == calendar_id,
                CalendarShare.user_id == current_user.id
            )
        )
    ).scalar_one_or_none() is not None
    if not (is_owner or is_public or is_shared):
        raise HTTPException(403, "Not allowed to view this calendar")
    return {
        "id": cal.id, "owner_user_id": cal.owner_user_id, "name": cal.name, "visibility": cal.visibility,
        "created_at": cal.created_at, "updated_at": cal.updated_at
    }

    

@app.patch("/calendars/{calendar_id}")
async def update_calendar(
    calendar_id: UUID,
    payload: CalendarUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    if cal.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can update calendar")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(cal, k, v)
    await session.commit()
    await session.refresh(cal)
    return {
        "id": cal.id, "owner_user_id": cal.owner_user_id, "name": cal.name, "visibility": cal.visibility,
        "created_at": cal.created_at, "updated_at": cal.updated_at
    }

@app.delete("/calendars/{calendar_id}", status_code=204)
async def delete_calendar(
    calendar_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    if cal.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can delete calendar")

    await session.delete(cal)
    await session.commit()
    return None


@app.post("/calendars/{calendar_id}/share", status_code=201)
async def share_calendar(
    calendar_id: UUID,
    payload: CalendarShareCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    if cal.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can share calendar")

    exists = (await session.execute(
        select(CalendarShare).where(
            CalendarShare.calendar_id == calendar_id,
            CalendarShare.user_id == payload.user_id
        )
    )).scalar_one_or_none()
    if not exists:
        session.add(CalendarShare(calendar_id=calendar_id, user_id=payload.user_id))
        await session.commit()
    return {"calendar_id": str(calendar_id), "user_id": str(payload.user_id), "permission": "view"}


@app.delete("/calendars/{calendar_id}/share/{user_id}", status_code=204)
async def unshare_calendar(
    calendar_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    if cal.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can unshare calendar")

    row = (await session.execute(
        select(CalendarShare).where(
            CalendarShare.calendar_id == calendar_id,
            CalendarShare.user_id == user_id
        )
    )).scalar_one_or_none()
    if row:
        await session.delete(row)
        await session.commit()
    return None


@app.post("/calendars/{calendar_id}/subscribe", status_code=201)
async def subscribe_calendar(
    calendar_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")

    existing = (await session.execute(
        select(CalendarSubscription).where(
            CalendarSubscription.subscriber_user_id == current_user.id,
            CalendarSubscription.calendar_id == calendar_id
        )
    )).scalar_one_or_none()
    if not existing:
        session.add(CalendarSubscription(subscriber_user_id=current_user.id, calendar_id=calendar_id, is_hidden=False))
        await session.commit()
    return {"calendar_id": str(calendar_id), "subscriber_user_id": str(current_user.id), "is_hidden": False}


@app.patch("/calendars/{calendar_id}/subscription")
async def update_subscription(
    calendar_id: UUID,
    payload: CalendarSubscriptionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    sub = (await session.execute(
        select(CalendarSubscription).where(
            CalendarSubscription.subscriber_user_id == current_user.id,
            CalendarSubscription.calendar_id == calendar_id
        )
    )).scalar_one_or_none()
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub.is_hidden = payload.is_hidden
    await session.commit()
    return {"calendar_id": str(calendar_id), "subscriber_user_id": str(current_user.id), "is_hidden": payload.is_hidden}



@app.delete("/calendars/{calendar_id}/subscription", status_code=204)
async def unsubscribe_calendar(
    calendar_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    sub = (await session.execute(
        select(CalendarSubscription).where(
            CalendarSubscription.subscriber_user_id == current_user.id,
            CalendarSubscription.calendar_id == calendar_id
        )
    )).scalar_one_or_none()
    if sub:
        await session.delete(sub)
        await session.commit()
    return None


# -------------
# Events (CRUD, share, copy, reminders/rrule)
# ------------

@app.get("/calendars/{calendar_id}/events")
async def list_events(
    calendar_id: UUID,
    q: Optional[str] = Query(None),
    start_from: Optional[datetime] = None,
    start_to: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")

    # permission: owner, public, or shared
    is_owner = cal.owner_user_id == current_user.id
    is_public = cal.visibility == "public"
    is_shared = (await session.execute(
        select(CalendarShare).where(
            CalendarShare.calendar_id == calendar_id,
            CalendarShare.user_id == current_user.id
        )
    )).scalar_one_or_none() is not None
    if not (is_owner or is_public or is_shared):
        raise HTTPException(403, "Not allowed to view this calendar")

    stmt = select(Event).where(Event.calendar_id == calendar_id)
    if start_from:
        stmt = stmt.where(Event.start_at >= start_from)
    if start_to:
        stmt = stmt.where(Event.start_at <= start_to)
    if q:
        # simple icontains on title/description
        ilike = f"%{q}%"
        from sqlalchemy import or_
        stmt = stmt.where(or_(Event.title.ilike(ilike), Event.description.ilike(ilike)))

    rows = (await session.execute(stmt.order_by(Event.start_at.asc()))).scalars().all()
    
    def redact(ev: Event) -> Dict:
        if ev.visibility == "busy" and ev.owner_user_id != current_user.id:
            return {
                "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
                "title": "Busy", "description": None, "location": None,
                "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
                "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
                "created_at": ev.created_at, "updated_at": ev.updated_at,
            }
        return {
            "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
            "title": ev.title, "description": ev.description, "location": ev.location,
            "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
            "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
            "created_at": ev.created_at, "updated_at": ev.updated_at,
        }

    return [redact(ev) for ev in rows]

@app.get("/events/{event_id}")
async def get_event(
    event_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    ev = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Event not found")

    # need to check calendar visibility/share if not owner
    cal = (await session.execute(select(Calendar).where(Calendar.id == ev.calendar_id))).scalar_one_or_none()
    is_owner = ev.owner_user_id == current_user.id
    is_public = cal and cal.visibility == "public"
    is_shared = (await session.execute(
        select(CalendarShare).where(
            CalendarShare.calendar_id == ev.calendar_id,
            CalendarShare.user_id == current_user.id
        )
    )).scalar_one_or_none() is not None
    if not (is_owner or is_public or is_shared):
        raise HTTPException(403, "Not allowed to view this event")

    if ev.visibility == "busy" and not is_owner:
        return {
            "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
            "title": "Busy", "description": None, "location": None,
            "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
            "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
            "created_at": ev.created_at, "updated_at": ev.updated_at,
        }
    return {
        "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
        "title": ev.title, "description": ev.description, "location": ev.location,
        "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
        "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
        "created_at": ev.created_at, "updated_at": ev.updated_at,
    }

@app.post("/calendars/{calendar_id}/events", status_code=201)
async def create_event(calendar_id: UUID, payload: EventCreate, session: AsyncSession = Depends(get_session),
                       current_user: UserRead = Depends(get_current_user)):
    cal = (await session.execute(select(Calendar).where(Calendar.id == calendar_id))).scalar_one_or_none()
    if not cal:
        raise HTTPException(404, "Calendar not found")
    ev = Event(
        calendar_id=calendar_id, owner_user_id=current_user.id,
        title=payload.title, description=payload.description, location=payload.location,
        start_at=payload.start_at, end_at=payload.end_at, timezone=payload.timezone,
        all_day=payload.all_day, visibility=payload.visibility, rrule=payload.rrule
    )
    session.add(ev)
    await session.commit()
    await session.refresh(ev)
    return {
        "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
        "title": ev.title, "description": ev.description, "location": ev.location,
        "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
        "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
        "created_at": ev.created_at, "updated_at": ev.updated_at
    }

@app.put("/events/{event_id}")
async def update_event(
    event_id: UUID,
    payload: EventUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    ev = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Event not found")
    if ev.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can update event")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ev, k, v)
    await session.commit()
    await session.refresh(ev)
    return {
        "id": ev.id, "calendar_id": ev.calendar_id, "owner_user_id": ev.owner_user_id,
        "title": ev.title, "description": ev.description, "location": ev.location,
        "start_at": ev.start_at, "end_at": ev.end_at, "timezone": ev.timezone,
        "all_day": ev.all_day, "visibility": ev.visibility, "rrule": ev.rrule,
        "created_at": ev.created_at, "updated_at": ev.updated_at,
    }

@app.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    ev = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Event not found")
    if ev.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can delete event")

    await session.delete(ev)
    await session.commit()
    return None


@app.post("/events/{event_id}/share", status_code=201)
async def share_event(
    event_id: UUID,
    payload: EventShareCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    ev = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Event not found")
    if ev.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can share event")

    exists = (await session.execute(
        select(EventShare).where(
            EventShare.event_id == event_id,
            EventShare.user_id == payload.user_id
        )
    )).scalar_one_or_none()
    if not exists:
        session.add(EventShare(event_id=event_id, user_id=payload.user_id))
        await session.commit()
    return {"event_id": str(event_id), "user_id": str(payload.user_id), "permission": "view"}

@app.delete("/events/{event_id}/share/{user_id}", status_code=204)
async def unshare_event(
    event_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    ev = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(404, "Event not found")
    if ev.owner_user_id != current_user.id:
        raise HTTPException(403, "Only owner can unshare event")

    row = (await session.execute(
        select(EventShare).where(EventShare.event_id == event_id, EventShare.user_id == user_id)
    )).scalar_one_or_none()
    if row:
        await session.delete(row)
        await session.commit()
    return None


@app.post("/events/{event_id}/copy", status_code=201)
async def copy_event(
    event_id: UUID,
    target_calendar_id: Optional[UUID] = None,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    src = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not src:
        raise HTTPException(404, "Event not found")

    # default target: any calendar the current user owns
    dest_cal = target_calendar_id
    if not dest_cal:
        owned_cal = (await session.execute(
            select(Calendar.id).where(Calendar.owner_user_id == current_user.id)
        )).scalars().first()
        if not owned_cal:
            raise HTTPException(400, "You don't own a destination calendar")
        dest_cal = owned_cal

    new_ev = Event(
        calendar_id=dest_cal,
        owner_user_id=current_user.id,
        title=src.title,
        description=src.description,
        location=src.location,
        start_at=src.start_at,
        end_at=src.end_at,
        timezone=src.timezone,
        all_day=src.all_day,
        visibility=src.visibility,
        rrule=src.rrule,
    )
    session.add(new_ev)
    await session.commit()
    await session.refresh(new_ev)
    return {
        "source_event_id": str(event_id),
        "new_event_id": str(new_ev.id),
        "target_calendar_id": str(dest_cal),
        "status": "copied",
    }


# -------------
# Notifications (browser pop-up registration)
# -----------------
@app.post("/notifications/register", status_code=201)
async def register_browser_push(
    sub: BrowserPushSubscription,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
):
    existing = (await session.execute(
        select(PushSubscription).where(PushSubscription.endpoint == sub.endpoint)
    )).scalar_one_or_none()

    if existing:
        existing.user_id = current_user.id
        existing.p256dh = sub.keys.get("p256dh")
        existing.auth   = sub.keys.get("auth")
        await session.commit()
        await session.refresh(existing)
        return {"status": "updated", "endpoint": sub.endpoint}

    row = PushSubscription(
        user_id=current_user.id,
        endpoint=sub.endpoint,
        p256dh=sub.keys.get("p256dh"),
        auth=sub.keys.get("auth"),
    )
    session.add(row)
    await session.commit()
    return {"status": "registered", "endpoint": sub.endpoint}
