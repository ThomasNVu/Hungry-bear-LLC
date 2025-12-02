import FullCalendar from "@fullcalendar/react";
import { useCallback, useMemo } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "../event-utils";
import "../styles/calendar.css";
import API from "./client";
import { toFullCalendar, fromSelection } from "../utils/eventMapper";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventApi,
  EventSourceInput,
  EventSourceFunc,
} from "@fullcalendar/core";
import type { ApiEvent } from "../utils/eventMapper";

type Props = {
  onEventsChange?: (events: EventApi[]) => void;
  onMonthChange?: (date: Date) => void;
  calendarId?: string;
};

export default function Calendar({
  onEventsChange,
  onMonthChange,
  calendarId,
}: Props) {
  function handleDateSelect(selectInfo: DateSelectArg) {
    const title =
      window.prompt("Please enter a new title for your event")?.trim() ?? "";
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (!title) return;

    // If we don't have a calendarId, fall back to local-only add.
    if (!calendarId) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
      return;
    }

    // Create on backend, then add to calendar using the response.
    (async () => {
      try {
        const payload = fromSelection(title, selectInfo);
        const res = await API.post(`/calendars/${calendarId}/events`, payload);
        calendarApi.addEvent(toFullCalendar(res.data as ApiEvent));
      } catch (err) {
        console.error("Failed to create event", err);
        window.alert("Could not create event. Please try again.");
      }
    })();
  }

  function handleEventClick(clickInfo: EventClickArg) {
    if (!window.confirm(`Delete '${clickInfo.event.title}'?`)) return;

    const id = clickInfo.event.id;
    // If we have no calendarId, just remove locally.
    if (!calendarId) {
      clickInfo.event.remove();
      return;
    }

    (async () => {
      try {
        await API.delete(`/events/${id}`);
        clickInfo.event.remove();
      } catch (err) {
        console.error("Failed to delete event", err);
        window.alert("Could not delete event. Please try again.");
      }
    })();
  }

  // function handleEvents(events : ) {
  //   setCurrentEvents(events);
  // }

  function renderEventContent(eventInfo: EventContentArg) {
    return (
      <>
        {eventInfo.timeText && <b className="mr-1">{eventInfo.timeText}</b>}
        <span>{eventInfo.event.title}</span>
      </>
    );
  }

  const fetchEvents = useCallback<EventSourceFunc>(async (info, success, failure) => {
    if (!calendarId) return;
    try {
      const res = await API.get(`/calendars/${calendarId}/events`, {
        params: {
          start_from: info.startStr,
          start_to: info.endStr,
        },
      });
      success((res.data as ApiEvent[]).map((ev) => toFullCalendar(ev)));
    } catch (err) {
      console.error("events fetch failed", err);
      failure(err as Error);
    }
  }, [calendarId]);

  const eventSource: EventSourceInput = useMemo(
    () => (calendarId ? fetchEvents : INITIAL_EVENTS),
    [calendarId, fetchEvents],
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: "", right: "prev,next today shareLink" }}
      customButtons={{
        shareLink: {
          text: "Share",
          click: () => window.alert("Hello World!"),
        },
      }}
      timeZone="local"
      height="100%"
      expandRows={true}
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      dayMaxEventRows={true}
      events={eventSource}
      select={handleDateSelect}
      eventClick={handleEventClick}
      eventContent={renderEventContent}
      // NEW: bubble up events and month changes
      eventsSet={(events) => onEventsChange?.(events)}
      datesSet={(info) => onMonthChange?.(info.view.currentStart)}
      eventClassNames={(arg) => {
        // optional: drive color by a type
        const type = arg.event.extendedProps.type; // e.g., "meeting" | "deadline"
        return ["fc-pill", type ? `pill-${type}` : ""];
      }}
      dayCellContent={(arg) => {
        const day = arg.date.getDate();
        const month = arg.date.toLocaleString("default", { month: "short" });
        if (day === 1) {
          return `${month} ${day < 10 ? `0${day}` : day}`;
        } else return day < 10 ? `0${day}` : `${day}`;
      }}
    />
  );
}
