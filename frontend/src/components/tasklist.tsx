import { useState } from "react";
import type { EventApi } from "@fullcalendar/core";
import { formatDate } from "@fullcalendar/core";

type Props = {
  events: EventApi[];
};

function CheckedBox() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
        fill="#78502C"
      />
    </svg>
  );
}

function UncheckedBox() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
        fill="#78502C"
      />
    </svg>
  );
}

export default function TaskList({ events = [] }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const sorted = [...events].sort(
    (a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0),
  );

  function toggleChecked(id: string) {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="task-list font-inter font-light">
      <h2 className="text-xl">List</h2>
      <ul className="w-full">
        {sorted.map((event) => (
          <li key={event.id} className="py-0.5">
            <div className="flex m-h-8 w-full gap-1">
              <div className="mr-1 ml-0.5 flex items-center justify-center">
                <div
                  className="hover:cursor-pointer"
                  onClick={() => toggleChecked(event.id)}
                >
                  {checked[event.id] ? <CheckedBox /> : <UncheckedBox />}
                </div>
              </div>
              <div className=" flex-1 flex flex-col">
                <div className=" flex-2 text-[14px] leading-tight ">
                  {event.title}
                </div>

                <div className=" flex-1 text-[10px] text-black/50 leading-tight">
                  {event.start
                    ? event.allDay
                      ? formatDate(event.start, {
                          month: "numeric",
                          day: "numeric",
                        }) + " (All Day)"
                      : formatDate(event.start, {
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                    : ""}
                </div>
              </div>
            </div>
            <div className="h-px bg-[#78502C]/70" />
          </li>
        ))}
      </ul>
    </div>
  );
}
