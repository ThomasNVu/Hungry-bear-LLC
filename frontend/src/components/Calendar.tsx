// src/components/Calendar.jsx
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
// optional extras:
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { INITIAL_EVENTS, createEventId } from "../event-utils";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core/index.js";

const Calendar = () => {
  function handleDateSelect(selectInfo: DateSelectArg) {
    const title = prompt("Please enter a new title for your event");
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

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
    if (
      confirm(
        `Are you sure you want to delete the event '${clickInfo.event.title}'`,
      )
    ) {
      clickInfo.event.remove();
    }
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      customButtons={{
        shareLink: {
          text: "Share",
          click: function () {
            alert("Hello World!");
          },
        },
      }}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "shareLink dayGridMonth,timeGridWeek,timeGridDay",
      }}
      initialView="dayGridMonth"
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
