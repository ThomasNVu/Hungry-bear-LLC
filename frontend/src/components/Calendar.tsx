import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "../event-utils";
import "../styles/calendar.css";
import API from "./client";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventApi,
  EventSourceInput,
} from "@fullcalendar/core";

type Props = {
  onEventsChange?: (events: EventApi[]) => void;
  onMonthChange?: (date: Date) => void;
  calendarId?: string;
};

type ApiEvent = {
  id: string;
  title?: string | null;
  start_at: string;
  end_at: string;
  all_day?: boolean;
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

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  }

  function handleEventClick(clickInfo: EventClickArg) {
    if (window.confirm(`Delete '${clickInfo.event.title}'?`)) {
      clickInfo.event.remove();
    }
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

  const eventSource: EventSourceInput = calendarId
    ? async (info, success, failure) => {
        try {
          const res = await API.get(`/calendars/${calendarId}/events`, {
            params: {
              start_from: info.startStr,
              start_to: info.endStr,
            },
          });
          success(
            (res.data as ApiEvent[]).map((ev) => ({
              id: ev.id,
              title: ev.title ?? "Busy",
              start: ev.start_at,
              end: ev.end_at,
              allDay: ev.all_day,
            })),
          );
        } catch (err) {
          console.error("events fetch failed", err);
          failure(err as Error);
        }
      }
    : INITIAL_EVENTS;

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
