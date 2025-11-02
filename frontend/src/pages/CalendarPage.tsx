import React from "react";
// import MiniCalendar from "../components/MiniCalendar";
import Calendar from "../components/Calendar";
import TaskList from "../components/tasklist";
import type { EventApi } from "@fullcalendar/core";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [events, setEvents] = React.useState<EventApi[]>([]);

  return (
    <div className="grid grid-cols-[15%_60%] grid-rows-5 gap-y-6 gap-x-8 h-screen p-4">
      <div className="col-start-2 col-end-6 row-start-1 row-end-6 bg-red-300 p-4">
        <Calendar
          onEventsChange={(event) => setEvents(event)}
          onMonthChange={(date) => setCurrentDate(date)}
        />
      </div>

      <div className="col-start-1 col-end-2 row-start-1 row-end-6 flex flex-col gap-6">
        <div className=" bg-gray-400 flex items-center justify-center flex-[0.3]">
          List of Calendars (div3)
        </div>
        <div className="bg-gray-500 p-4 overflow-auto flex-[0.7]">
          <TaskList events={events} />
        </div>
      </div>
    </div>
  );
}
