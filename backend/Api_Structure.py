from __future__ import annotations

from typing import Optional, Literal, Dict, List
from uuid import UUID, uuid4
from datetime import datetime
import base64
import json

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer

from Api_Pydantic import (
    LoginRequest, UserCreate, UserRead, UserUpdate,
    CalendarCreate, CalendarUpdate,
    CalendarShareCreate,
    CalendarSubscriptionUpdate,
    Reminder, EventCreate, EventUpdate,
    EventShareCreate,
    APIError, BrowserPushSubscription,
)

# ------
# Supabase setup 
# --------
from supabase import create_client, Client

DB_URL = "https://qeapgivkqgadofeqdjjn.supabase.co/"
DB_KEY = "[anon key]"  # Supabase anon key is necessary

sb: Client = create_client(DB_URL, DB_KEY)

# -------------------------
# FastAPI app & authentication 
# ----------
app = FastAPI(title="Calendar API", version="0.1.0")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def time_stamp() -> str:
    return datetime.now().astimezone().isoformat()


# --------
# Token helpers
# -------------------------
def encode_token(user_id: str) -> str:
    payload = {"user_id": user_id}
    raw = json.dumps(payload).encode("utf-8")
    return base64.b64encode(raw).decode("utf-8")


def decode_token(token: str) -> str:
    try:
        raw = base64.b64decode(token.encode("utf-8")).decode("utf-8")
        payload = json.loads(raw)
        user_id = payload["user_id"]
        if not user_id:
            raise ValueError("no user_id")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or malformed token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserRead:
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth token")

    user_id = decode_token(token)

    resp = sb.table("users").select("*").eq("id", user_id).single().execute()
    user_row = resp.data
    if user_row is None:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    try:
        return UserRead(**user_row)
    except Exception:
        raise HTTPException(500, "User row in DB does not match expected schema")


# -------
# Logins
# --------
@app.post("/login")
async def login(payload: LoginRequest):
    # Look up user by email
    resp = sb.table("users").select("*").eq("email", payload.email).single().execute()
    user_row = resp.data
    if user_row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # stretch goal: verify password once you store hashes 

    token_b64 = encode_token(user_row["id"])
    return {"access_token": token_b64, "token_type": "bearer"}


@app.post("/logout", status_code=204)
async def logout(current_user: UserRead = Depends(get_current_user)):
    return None


# -------
# Users
# ----------
@app.post("/users", status_code=201)
async def create_user(payload: UserCreate):
    user_id = str(uuid4())
    now = time_stamp()

    insert_row = {
        "id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "avatar_url": payload.avatar_url,
        "is_active": True,
        "role": "user",
        "created_at": now,
        "updated_at": now,
        # TODO: save password hash in production
    }

    resp = sb.table("users").insert(insert_row).execute()
    return resp.data[0]


@app.get("/users/{id}")
async def get_user(id: UUID, current_user: UserRead = Depends(get_current_user)):
    resp = sb.table("users").select("*").eq("id", str(id)).single().execute()
    if resp.data is None:
        raise HTTPException(404, "User not found")
    return resp.data


@app.put("/users/{id}")
async def update_user(id: UUID, payload: UserUpdate, current_user: UserRead = Depends(get_current_user)):
    if str(current_user.id) != str(id) and current_user.role != "admin":
        raise HTTPException(403, "Not allowed to update this user")

    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = time_stamp()

    resp = sb.table("users").update(update_data).eq("id", str(id)).execute()

    if not resp.data:
        raise HTTPException(404, "User not found")

    return resp.data[0]


@app.put("/admin/users/{id}/deactivate")
async def admin_deactivate_user(id: UUID, current_user: UserRead = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    resp = (
        sb.table("users")
        .update({"is_active": False, "updated_at": time_stamp()})
        .eq("id", str(id))
        .execute()
    )

    if not resp.data:
        raise HTTPException(404, "User not found")

    return {"id": str(id), "is_active": False}


@app.put("/admin/users/{id}/role")
async def admin_set_role(id: UUID, role: Literal["user", "admin"], current_user: UserRead = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    resp = (
        sb.table("users")
        .update({"role": role, "updated_at": time_stamp()})
        .eq("id", str(id))
        .execute()
    )

    if not resp.data:
        raise HTTPException(404, "User not found")

    return {"id": str(id), "role": role}


# -------------------------
# Calendars
# -------------------------
@app.post("/calendars", status_code=201)
async def create_calendar(payload: CalendarCreate, current_user: UserRead = Depends(get_current_user)):
    cal_id = str(uuid4())
    now = time_stamp()

    insert_row = {
        "id": cal_id,
        "owner_user_id": str(current_user.id),
        "name": payload.name,
        "visibility": payload.visibility,
        "created_at": now,
        "updated_at": now,
    }

    resp = sb.table("calendars").insert(insert_row).execute()
    return resp.data[0]


@app.get("/calendars/{calendar_id}")
async def get_calendar(calendar_id: UUID, current_user: UserRead = Depends(get_current_user)):
    cal_resp = sb.table("calendars").select("*").eq("id", str(calendar_id)).single().execute()
    cal = cal_resp.data
    if cal is None:
        raise HTTPException(404, "Calendar not found")

    is_owner = cal["owner_user_id"] == str(current_user.id)
    is_public = cal["visibility"] == "public"

    share_resp = (
        sb.table("calendar _shares")
        .select("calendar_id,user_id")
        .eq("calendar_id", str(calendar_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )
    is_shared = len(share_resp.data or []) > 0

    if not (is_owner or is_public or is_shared):
        raise HTTPException(403, "Not allowed to view this calendar")

    return cal


@app.patch("/calendars/{calendar_id}")
async def update_calendar(calendar_id: UUID, payload: CalendarUpdate, current_user: UserRead = Depends(get_current_user)):
    owner_check = (
        sb.table("calendars")
        .select("owner_user_id")
        .eq("id", str(calendar_id))
        .single()
        .execute()
    )
    cal_info = owner_check.data
    if cal_info is None:
        raise HTTPException(404, "Calendar not found")
    if cal_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can update calendar")

    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = time_stamp()

    resp = sb.table("calendars").update(update_data).eq("id", str(calendar_id)).execute()
    return resp.data[0]


@app.delete("/calendars/{calendar_id}", status_code=204)
async def delete_calendar(calendar_id: UUID, current_user: UserRead = Depends(get_current_user)):
    owner_check = (
        sb.table("calendars")
        .select("owner_user_id")
        .eq("id", str(calendar_id))
        .single()
        .execute()
    )
    cal_info = owner_check.data
    if cal_info is None:
        raise HTTPException(404, "Calendar not found")
    if cal_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can delete calendar")

    sb.table("events").delete().eq("calendar_id", str(calendar_id)).execute()
    sb.table("calendar _shares").delete().eq("calendar_id", str(calendar_id)).execute()
    sb.table("calendar_ subscriptions").delete().eq("calendar_id", str(calendar_id)).execute()
    sb.table("calendars").delete().eq("id", str(calendar_id)).execute()
    return None


@app.post("/calendars/{calendar_id}/share", status_code=201)
async def share_calendar(calendar_id: UUID, payload: CalendarShareCreate, current_user: UserRead = Depends(get_current_user)):
    owner_check = (
        sb.table("calendars")
        .select("owner_user_id")
        .eq("id", str(calendar_id))
        .single()
        .execute()
    )
    cal_info = owner_check.data
    if cal_info is None:
        raise HTTPException(404, "Calendar not found")
    if cal_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can share calendar")

    share_row = {
        "calendar_id": str(calendar_id),
        "user_id": str(payload.user_id),
        # schema has no 'permission' column for calendar shares
    }

    resp = sb.table("calendar _shares").insert(share_row).execute()
    return resp.data[0]


@app.delete("/calendars/{calendar_id}/share/{user_id}", status_code=204)
async def unshare_calendar(calendar_id: UUID, user_id: UUID, current_user: UserRead = Depends(get_current_user)):
    owner_check = (
        sb.table("calendars")
        .select("owner_user_id")
        .eq("id", str(calendar_id))
        .single()
        .execute()
    )
    cal_info = owner_check.data
    if cal_info is None:
        raise HTTPException(404, "Calendar not found")
    if cal_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can unshare calendar")

    sb.table("calendar _shares").delete() \
        .eq("calendar_id", str(calendar_id)) \
        .eq("user_id", str(user_id)) \
        .execute()
    return None


@app.post("/calendars/{calendar_id}/subscribe", status_code=201)
async def subscribe_calendar(calendar_id: UUID, current_user: UserRead = Depends(get_current_user)):
    cal_resp = sb.table("calendars").select("id").eq("id", str(calendar_id)).single().execute()
    if cal_resp.data is None:
        raise HTTPException(404, "Calendar not found")

    sub_row = {
        "calendar_id": str(calendar_id),
        "subscriber_user_id": str(current_user.id),
        "is_hidden": False,
    }

    resp = sb.table("calendar_ subscriptions").insert(sub_row).execute()
    return resp.data[0]


@app.patch("/calendars/{calendar_id}/subscription")
async def update_subscription(calendar_id: UUID, payload: CalendarSubscriptionUpdate, current_user: UserRead = Depends(get_current_user)):
    resp = (
        sb.table("calendar_ subscriptions")
        .update({"is_hidden": payload.is_hidden})
        .eq("calendar_id", str(calendar_id))
        .eq("subscriber_user_id", str(current_user.id))
        .execute()
    )

    if not resp.data:
        sub_row = {
            "calendar_id": str(calendar_id),
            "subscriber_user_id": str(current_user.id),
            "is_hidden": payload.is_hidden,
        }
        create_resp = sb.table("calendar_ subscriptions").insert(sub_row).execute()
        return create_resp.data[0]

    return resp.data[0]


@app.delete("/calendars/{calendar_id}/subscription", status_code=204)
async def unsubscribe_calendar(calendar_id: UUID, current_user: UserRead = Depends(get_current_user)):
    sb.table("calendar_ subscriptions") \
        .delete() \
        .eq("calendar_id", str(calendar_id)) \
        .eq("subscriber_user_id", str(current_user.id)) \
        .execute()
    return None


# -------------------------
# Events
# -------------------------
@app.get("/calendars/{calendar_id}/events")
async def list_events(
    calendar_id: UUID,
    q: Optional[str] = Query(None),
    start_from: Optional[datetime] = None,
    start_to: Optional[datetime] = None,
    current_user: UserRead = Depends(get_current_user),
):
    cal_resp = sb.table("calendars").select("*").eq("id", str(calendar_id)).single().execute()
    cal = cal_resp.data
    if cal is None:
        raise HTTPException(404, "Calendar not found")

    is_owner = cal["owner_user_id"] == str(current_user.id)
    is_public = cal["visibility"] == "public"

    share_resp = (
        sb.table("calendar _shares")
        .select("calendar_id,user_id")
        .eq("calendar_id", str(calendar_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )
    is_shared = len(share_resp.data or []) > 0

    if not (is_owner or is_public or is_shared):
        raise HTTPException(403, "Not allowed to view events in this calendar")

    query = (
        sb.table("events")
        .select("*")
        .eq("calendar_id", str(calendar_id))
    )

    if start_from:
        query = query.gte("start_at", start_from.isoformat())
    if start_to:
        query = query.lte("start_at", start_to.isoformat())

    resp = query.execute()
    rows = resp.data or []

    if q:
        ql = q.lower()
        rows = [
            ev for ev in rows
            if ql in (ev.get("title") or "").lower()
            or ql in (ev.get("description") or "").lower()
        ]

    def allowed(ev: Dict) -> Dict:
        is_ev_owner = (ev["owner_user_id"] == str(current_user.id))
        if ev["visiblity"] == "busy" and not is_ev_owner:
            redacted = dict(ev)
            redacted["title"] = "Busy"
            redacted["description"] = None
            redacted["location"] = None
            return redacted
        return ev

    return [allowed(ev) for ev in rows]


@app.get("/events/{event_id}")
async def get_event(event_id: UUID, current_user: UserRead = Depends(get_current_user)):
    resp = sb.table("events").select("*").eq("id", str(event_id)).single().execute()
    ev = resp.data
    if ev is None:
        raise HTTPException(404, "Event not found")

    cal_resp = sb.table("calendars").select("*").eq("id", ev["calendar_id"]).single().execute()
    cal = cal_resp.data
    if cal is None:
        raise HTTPException(404, "Parent calendar not found")

    is_owner = ev["owner_user_id"] == str(current_user.id)
    cal_owner = cal["owner_user_id"] == str(current_user.id)
    cal_public = cal["visibility"] == "public"
    cal_shared_resp = (
        sb.table("calendar _shares")
        .select("calendar_id,user_id")
        .eq("calendar_id", cal["id"])
        .eq("user_id", str(current_user.id))
        .execute()
    )
    cal_shared = len(cal_shared_resp.data or []) > 0

    if not (is_owner or cal_owner or cal_public or cal_shared):
        raise HTTPException(403, "Not allowed to view this event")

    if ev["visiblity"] == "busy" and not is_owner:
        redacted = dict(ev)
        redacted["title"] = "Busy"
        redacted["description"] = None
        redacted["location"] = None
        return redacted

    return ev


@app.post("/calendars/{calendar_id}/events", status_code=201)
async def create_event(calendar_id: UUID, payload: EventCreate, current_user: UserRead = Depends(get_current_user)):
    cal_resp = sb.table("calendars").select("owner_user_id").eq("id", str(calendar_id)).single().execute()
    cal = cal_resp.data
    if cal is None:
        raise HTTPException(404, "Calendar not found")
    if cal["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can create events on this calendar")

    event_id = str(uuid4())
    now = time_stamp()

    insert_row = {
        "id": event_id,
        "calendar_id": str(calendar_id),
        "owner_user_id": str(current_user.id),
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "start_at": payload.start_at.isoformat(),
        "end_at": payload.end_at.isoformat(),
        "timezone": payload.timezone,
        "all_day": payload.all_day,
        "visiblity": payload.visibility,   # schema uses 'visiblity'
        "rrule": payload.rrule,
        # schema has no 'reminders'
        "created_at": now,
        "update_at": now,                  # schema uses 'update_at'
    }

    resp = sb.table("events").insert(insert_row).execute()
    return resp.data[0]


@app.put("/events/{event_id}")
async def update_event(event_id: UUID, payload: EventUpdate, current_user: UserRead = Depends(get_current_user)):
    owner_resp = sb.table("events").select("owner_user_id").eq("id", str(event_id)).single().execute()
    ev_info = owner_resp.data
    if ev_info is None:
        raise HTTPException(404, "Event not found")
    if ev_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can update event")

    update_data = payload.model_dump(exclude_unset=True)

    if "start_at" in update_data and update_data["start_at"] is not None:
        update_data["start_at"] = update_data["start_at"].isoformat()
    if "end_at" in update_data and update_data["end_at"] is not None:
        update_data["end_at"] = update_data["end_at"].isoformat()

    # map visibility -> visiblity if present in payload
    if "visibility" in update_data:
        update_data["visiblity"] = update_data.pop("visibility")

    update_data["update_at"] = time_stamp()

    resp = sb.table("events").update(update_data).eq("id", str(event_id)).execute()

    if not resp.data:
        raise HTTPException(404, "Event not found")

    return resp.data[0]


@app.delete("/events/{event_id}", status_code=204)
async def delete_event(event_id: UUID, current_user: UserRead = Depends(get_current_user)):
    owner_resp = sb.table("events").select("owner_user_id").eq("id", str(event_id)).single().execute()
    ev_info = owner_resp.data
    if ev_info is None:
        raise HTTPException(404, "Event not found")
    if ev_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can delete event")

    sb.table("event shares").delete().eq("event_id", str(event_id)).execute()
    sb.table("events").delete().eq("id", str(event_id)).execute()

    return None


@app.post("/events/{event_id}/share", status_code=201)
async def share_event(event_id: UUID, payload: EventShareCreate, current_user: UserRead = Depends(get_current_user)):
    owner_resp = sb.table("events").select("owner_user_id").eq("id", str(event_id)).single().execute()
    ev_info = owner_resp.data
    if ev_info is None:
        raise HTTPException(404, "Event not found")
    if ev_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can share event")

    share_row = {
        "event_id": str(event_id),
        "user_ id": str(payload.user_id),   # schema column name (with space)
        # schema has no 'permission'
    }

    resp = sb.table("event shares").insert(share_row).execute()
    return resp.data[0]


@app.delete("/events/{event_id}/share/{user_id}", status_code=204)
async def unshare_event(event_id: UUID, user_id: UUID, current_user: UserRead = Depends(get_current_user)):
    owner_resp = sb.table("events").select("owner_user_id").eq("id", str(event_id)).single().execute()
    ev_info = owner_resp.data
    if ev_info is None:
        raise HTTPException(404, "Event not found")
    if ev_info["owner_user_id"] != str(current_user.id):
        raise HTTPException(403, "Only owner can unshare event")

    sb.table("event shares").delete() \
        .eq("event_id", str(event_id)) \
        .eq("user_ id", str(user_id)) \
        .execute()
    return None


@app.post("/events/{event_id}/copy", status_code=201)
async def copy_event(
    event_id: UUID,
    target_calendar_id: Optional[UUID] = None,
    current_user: UserRead = Depends(get_current_user),
):
    src_resp = sb.table("events").select("*").eq("id", str(event_id)).single().execute()
    src = src_resp.data
    if src is None:
        raise HTTPException(404, "Event not found")

    if target_calendar_id is None:
        cal_query = sb.table("calendars").select("id").eq("owner_user_id", str(current_user.id)).execute()
        owned_cals = [row["id"] for row in (cal_query.data or [])]
        if not owned_cals:
            raise HTTPException(400, "No target calendar available for copy")
        dest_cal_id = owned_cals[0]
    else:
        dest_cal_id = str(target_calendar_id)

    new_id = str(uuid4())
    now = time_stamp()

    insert_row = {
        "id": new_id,
        "calendar_id": dest_cal_id,
        "owner_user_id": str(current_user.id),
        "title": src.get("title"),
        "description": src.get("description"),
        "location": src.get("location"),
        "start_at": src.get("start_at"),
        "end_at": src.get("end_at"),
        "timezone": src.get("timezone"),
        "all_day": src.get("all_day"),
        "visiblity": src.get("visiblity"),
        "rrule": src.get("rrule"),
        # no 'reminders'
        "created_at": now,
        "update_at": now,
    }

    sb.table("events").insert(insert_row).execute()

    return {
        "source_event_id": str(event_id),
        "new_event_id": new_id,
        "target_calendar_id": dest_cal_id,
        "status": "copied",
    }


# -------------------------
# Notifications
# -------------------------
@app.post("/notifications/register", status_code=201)
async def register_browser_push(sub: BrowserPushSubscription, current_user: UserRead = Depends(get_current_user)):
    row = {
        "user_id": str(current_user.id),
        "endpoint": sub.endpoint,
        "created_at": time_stamp(),
    }

    sb.table("notif_subs").insert(row).execute()
    return {"status": "registered", "endpoint": sub.endpoint}
