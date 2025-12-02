import type { EventInput } from "@fullcalendar/core";
import type { DateSelectArg } from "@fullcalendar/core";

export type ApiEvent = {
  id: string;
  calendar_id: string;
  owner_user_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  timezone?: string | null;
  all_day: boolean;
  visibility: "public" | "private" | "busy";
  rrule?: string | null;
};

export type CreateEventPayload = {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  timezone?: string | null;
  all_day: boolean;
  visibility: "public" | "private" | "busy";
  rrule?: string | null;
};

export const toFullCalendar = (ev: ApiEvent): EventInput => ({
  id: ev.id,
  title: ev.title ?? "Busy",
  start: ev.start_at,
  end: ev.end_at,
  allDay: ev.all_day,
  extendedProps: {
    calendarId: ev.calendar_id,
    visibility: ev.visibility,
    description: ev.description,
    location: ev.location,
    timezone: ev.timezone,
    ownerUserId: ev.owner_user_id,
    rrule: ev.rrule,
  },
});

export const fromSelection = (
  title: string,
  selectInfo: DateSelectArg,
): CreateEventPayload => ({
  title,
  description: null,
  location: null,
  start_at: selectInfo.start.toISOString(),
  end_at: (() => {
    const start = selectInfo.start;
    // Prefer FC-provided end; otherwise set a sensible default.
    const rawEnd = selectInfo.end
      ? selectInfo.end
      : selectInfo.allDay
        ? new Date(start.getTime() + 24 * 60 * 60 * 1000) // +1 day for all-day
        : new Date(start.getTime() + 60 * 60 * 1000); // +1 hour for timed
    // Ensure end is strictly after start to satisfy backend validator.
    if (rawEnd <= start) {
      return new Date(start.getTime() + 60 * 60 * 1000).toISOString();
    }
    return rawEnd.toISOString();
  })(),
  timezone: null,
  all_day: selectInfo.allDay,
  visibility: "private",
  rrule: null,
});
