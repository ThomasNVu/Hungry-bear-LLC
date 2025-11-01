import type { EventApi } from "@fullcalendar/core";
import { formatDate } from "@fullcalendar/core";

type Props = {
  events: EventApi[];
};

type EventLike = EventApi | { start: Date; startStr?: string; endStr?: string };

function getStartDate(event: EventLike): Date | null {
  const raw = event.start ?? event.startStr ?? null;
  if (!raw) return null;
  return raw instanceof Date ? raw : new Date(raw);
}

function ymdKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskList({ events = [] }: Props) {
  // Group events by local day
  const groups = events.reduce(
    (dayGroup, event) => {
      const date = getStartDate(event);
      if (!date) return dayGroup; // skip events without a start
      const key = ymdKey(date);

      if (!dayGroup[key]) {
        dayGroup[key] = {
          label: formatDate(date, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          items: [] as EventApi[],
          sortTime: date.getTime(),
        };
      }
      dayGroup[key].items.push(event);
      return dayGroup;
    },
    {} as Record<
      string,
      { label: string; items: EventApi[]; sortTime: number }
    >,
  );

  // Sort days, then (optionally) sort events within each day by start time
  const orderedDays = Object.entries(groups)
    .sort(([, a], [, b]) => a.sortTime - b.sortTime)
    .map(([key, data]) => ({ key, ...data }));

  orderedDays.forEach((day) =>
    day.items.sort((a, b) => {
      const da = getStartDate(a)?.getTime() ?? 0;
      const db = getStartDate(b)?.getTime() ?? 0;
      return da - db;
    }),
  );

  return (
    <div className="task-list">
      <h2>All Events ({events.length})</h2>
      <ul>
        {orderedDays.map((day) => (
          <li key={day.key} className="mb-4">
            <b>{day.label}</b>
            <ul className="ml-4 list-disc">
              {day.items.map((event) => {
                const date = getStartDate(event);
                const timeLabel =
                  date &&
                  formatDate(date, {
                    hour: "numeric",
                    minute: "2-digit",
                    meridiem: "short",
                  });
                return (
                  <li key={event.id} className="mt-1">
                    <i>{event.title}</i>
                    {date && !event.allDay && (
                      <span className="ml-2 text-sm opacity-70">
                        ({timeLabel})
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
