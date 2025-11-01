// src/components/Calendar.jsx
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "../event-utils";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventApi,
  DatesSetArg,
} from "@fullcalendar/core";

type Props = {
  onEventsChange?: (events: EventApi[]) => void;
  onMonthChange?: (date: Date) => void;
};

export default function CalendarLarge({
  onEventsChange,
  onMonthChange,
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

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: "title", right: "prev,next today shareLink" }}
      customButtons={{
        shareLink: {
          text: "Share",
          click: function () {
            alert("Hello World!");
          },
        },
      }}
      height="100%"
      expandRows={true}
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      initialEvents={INITIAL_EVENTS}
      select={handleDateSelect}
      eventContent={renderEventContent}
      contentHeight={"auto"}
      eventClick={handleEventClick}
    />
  );
};

function renderEventContent(eventInfo: EventContentArg) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <i>{eventInfo.event.title}</i>
    </>
  );
}

export default Calendar;
