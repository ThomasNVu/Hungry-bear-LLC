# backend/models.py
from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


# --- Users ---
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)

    full_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    role: Mapped[str] = mapped_column(String(10), default="user", server_default="user")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    calendars: Mapped[list["Calendar"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


# --- Calendars ---
class Calendar(Base):
    __tablename__ = "calendars"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(100))

    visibility: Mapped[str] = mapped_column(
        String(10), default="private", server_default="private"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship(back_populates="calendars")
    events: Mapped[list["Event"]] = relationship(
        back_populates="calendar", cascade="all, delete-orphan"
    )
    shares: Mapped[list["CalendarShare"]] = relationship(
        back_populates="calendar", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["CalendarSubscription"]] = relationship(
        back_populates="calendar", cascade="all, delete-orphan"
    )


# --- Calendar shares (view permission only) ---
class CalendarShare(Base):
    __tablename__ = "calendar_shares"
    __table_args__ = (
        UniqueConstraint("calendar_id", "user_id", name="uq_calendar_share"),
    )

    calendar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("calendars.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    calendar: Mapped["Calendar"] = relationship(back_populates="shares")
    user: Mapped["User"] = relationship()


# --- Calendar subscriptions (with hidden flag) ---
class CalendarSubscription(Base):
    __tablename__ = "calendar_subscriptions"
    __table_args__ = (
        UniqueConstraint("subscriber_user_id", "calendar_id", name="uq_calendar_sub"),
    )

    subscriber_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    calendar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("calendars.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_hidden: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    calendar: Mapped["Calendar"] = relationship(back_populates="subscriptions")
    subscriber: Mapped["User"] = relationship()


# --- Events ---
class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    calendar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("calendars.id", ondelete="CASCADE")
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    timezone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    visibility: Mapped[str] = mapped_column(
        String(10), default="private", server_default="private"
    )
    rrule: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    calendar: Mapped["Calendar"] = relationship(back_populates="events")
    owner: Mapped["User"] = relationship(back_populates="events")


# --- Event shares ---
class EventShare(Base):
    __tablename__ = "event_shares"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_share"),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    event: Mapped["Event"] = relationship()
    user: Mapped["User"] = relationship()
