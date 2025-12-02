import FullCalendar from "@fullcalendar/react";
import { useCallback, useMemo, useRef, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "../event-utils";
import "../styles/calendar.css";
import API from "./client";
import { toFullCalendar, fromSelection, toUpdatePayload } from "../utils/eventMapper";
import EventDialog from "./EventDialog";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventApi,
  EventSourceInput,
  EventSourceFunc,
  EventChangeArg,
  EventMountArg,
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
  const calendarRef = useRef<FullCalendar | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selection, setSelection] = useState<DateSelectArg | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventApi | null>(null);

  function handleDateSelect(selectInfo: DateSelectArg) {
    selectInfo.view.calendar.unselect();
    setSelection(selectInfo);
    setDialogOpen(true);
  }

  function handleEventClick(clickInfo: EventClickArg) {
    // Left click: open dialog to edit
    setEditingEvent(clickInfo.event);
    setDialogOpen(true);
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

  const handleEventChange = useCallback(
    async (changeInfo: EventChangeArg) => {
      if (!calendarId) return;
      const payload = toUpdatePayload(changeInfo.event);
      try {
        await API.put(`/events/${changeInfo.event.id}`, payload);
      } catch (err) {
        console.error("Failed to update event", err);
        window.alert("Could not update event. Reverting change.");
        changeInfo.revert();
      }
    },
    [calendarId],
  );

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

  const handleCreate = async (form: {
    title: string;
    description: string | null;
    start: Date;
    end: Date | null;
    allDay: boolean;
  }) => {
    if (!selection) return;
    const api = calendarRef.current?.getApi();
    const payload = {
      ...fromSelection(form.title, selection, form.description),
      start_at: form.start.toISOString(),
      end_at: (form.end ?? new Date(form.start.getTime() + 60 * 60 * 1000)).toISOString(),
      all_day: form.allDay,
    };

    if (!calendarId) {
      api?.addEvent({
        id: createEventId(),
        title: form.title,
        start: payload.start_at,
        end: payload.end_at,
        allDay: form.allDay,
        extendedProps: { description: form.description },
      });
      setDialogOpen(false);
      return;
    }

    try {
      const res = await API.post(`/calendars/${calendarId}/events`, payload);
      api?.addEvent(toFullCalendar(res.data as ApiEvent));
      setDialogOpen(false);
      setSelection(null);
    } catch (err) {
      console.error("Failed to create event", err);
      window.alert("Could not create event. Please try again.");
    }
  };

  const handleUpdate = async (form: {
    title: string;
    description: string | null;
    start: Date;
    end: Date | null;
    allDay: boolean;
  }) => {
    if (!editingEvent) return;
    const payload = {
      title: form.title,
      description: form.description,
      start_at: form.start.toISOString(),
      end_at: (form.end ?? new Date(form.start.getTime() + 60 * 60 * 1000)).toISOString(),
      all_day: form.allDay,
    };

    if (!calendarId) {
      // Local update only
      editingEvent.setProp("title", form.title);
      editingEvent.setExtendedProp("description", form.description);
      editingEvent.setAllDay(form.allDay);
      editingEvent.setDates(payload.start_at, payload.end_at);
      setDialogOpen(false);
      setEditingEvent(null);
      return;
    }

    try {
      await API.put(`/events/${editingEvent.id}`, payload);
      editingEvent.setProp("title", form.title);
      editingEvent.setExtendedProp("description", form.description);
      editingEvent.setAllDay(form.allDay);
      editingEvent.setDates(payload.start_at, payload.end_at);
      setDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Failed to update event", err);
      window.alert("Could not update event. Please try again.");
    }
  };

  const handleDelete = useCallback(
    async (event: EventApi) => {
      const id = event.id;
      if (!calendarId) {
        event.remove();
        return;
      }
      try {
        await API.delete(`/events/${id}`);
        event.remove();
      } catch (err) {
        console.error("Failed to delete event", err);
        window.alert("Could not delete event. Please try again.");
      }
    },
    [calendarId],
  );

  const handleEventMount = useCallback(
    (arg: EventMountArg) => {
      const handler = (e: MouseEvent) => {
        e.preventDefault();
        handleDelete(arg.event);
      };
      arg.el.addEventListener("contextmenu", handler);
    },
    [handleDelete],
  );

  return (
    <>
      <FullCalendar
        ref={calendarRef}
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
        eventChange={handleEventChange}
        eventDidMount={handleEventMount}
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
      {selection && !editingEvent && (
        <EventDialog
          isOpen={dialogOpen}
          initialStart={selection.start}
          initialEnd={selection.end ?? null}
          initialAllDay={selection.allDay}
          onSubmit={handleCreate}
          onClose={() => {
            setDialogOpen(false);
            setSelection(null);
          }}
          submitLabel="Create"
        />
      )}
      {editingEvent && (
        <EventDialog
          isOpen={dialogOpen}
          initialTitle={editingEvent.title}
          initialDescription={(editingEvent.extendedProps?.description as string | null) ?? ""}
          initialStart={editingEvent.start ?? new Date()}
          initialEnd={editingEvent.end ?? null}
          initialAllDay={editingEvent.allDay}
          onSubmit={handleUpdate}
          onClose={() => {
            setDialogOpen(false);
            setEditingEvent(null);
          }}
          submitLabel="Update"
        />
      )}
    </>
  );
}
