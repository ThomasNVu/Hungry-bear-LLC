import React from "react";
// import MiniCalendar from "../components/MiniCalendar";
import Calendar from "../components/Calendar";
import TaskList from "../components/tasklist";
import Navbar from "../components/Navbar";
import type { EventApi } from "@fullcalendar/core";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [events, setEvents] = React.useState<EventApi[]>([]);

  const toLocalMonthAnchor = (date: Date) =>
    new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);

  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(toLocalMonthAnchor(currentDate));

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-grow grid grid-cols-5 grid-rows-5 gap-y-6 gap-x-8 p-2 h-[80%]">
        <div className="col-start-2 col-end-6 row-start-1 row-end-6 p-4">
          <Calendar
            onEventsChange={(event) => setEvents(event)}
            onMonthChange={(date) => setCurrentDate(date)}
          />
        </div>
        <div className="col-start-1 col-end-2 row-start-1 row-end-6 flex flex-col gap-6">
          <div className="flex-[0.1]">
            <h1 className="text-2xl flex flex-col justify-center h-full ">
              <span className="text-left text-lg sm:text-2xl lg:text-3xl font-poppins">
                {label}
              </span>
            </h1>
          </div>
          <div className=" bg-gray-400 flex items-center justify-center flex-[0.2]">
            List of Calendars (div3)
          </div>
          <div className="overflow-auto flex-[0.7]">
            <TaskList events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
