import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/minicalendar.css";

type MiniCalendarProps = {
  date: Date; // month to show
  onDateClick?: (date: Date) => void;
  onMonthChange?: (date: Date) => void; // fires when user navs prev/next
};

export default function MiniCalendar({
  date,
  //   onDateClick,
  onMonthChange,
}: MiniCalendarProps) {
  return (
    <div className="mini-calendar w-full h-full">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={date}
        headerToolbar={{ left: "title", right: "prev,next" }}
        // keep it compact
        dayHeaderFormat={{ weekday: "narrow" }}
        height="100%"
        expandRows
        fixedWeekCount // always show 6 weeks like most mini-cal widge
        showNonCurrentDates // gray out days outside the month
        eventDisplay="none" // mini calendar = no event pills
        selectable={false}
        dayMaxEventRows={false}
        // contentHeight="auto"
        // clicking a day should notify parent
        // dateClick={(arg: DateClickArg) => onDateClick?.(arg.date)}
        // keep parent in sync when user navigates months
        datesSet={(arg) => onMonthChange?.(arg.start)}
        // strip time text & keep just day numbers
        dayCellContent={(arg) => ({ html: String(arg.date.getDate()) })}
      />

      {/* <style></style> */}
    </div>
  );
}
