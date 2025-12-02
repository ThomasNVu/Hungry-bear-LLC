import React, { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  initialTitle?: string;
  initialDescription?: string | null;
  initialStart: Date;
  initialEnd?: Date | null;
  initialAllDay?: boolean;
  onSubmit: (data: {
    title: string;
    description: string | null;
    start: Date;
    end: Date | null;
    allDay: boolean;
  }) => void;
  onClose: () => void;
  submitLabel?: string;
};

const toDateValue = (d: Date) => d.toISOString().slice(0, 10);
const toTimeParts12 = (d: Date) => {
  const h24 = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour: String(h12).padStart(2, "0"), minute: mins, ampm };
};

const hours12 = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const minutes = ["00", "15", "30", "45"];
const ampmOptions = ["AM", "PM"];

export default function EventDialog({
  isOpen,
  initialTitle = "",
  initialDescription = null,
  initialStart,
  initialEnd,
  initialAllDay = false,
  onSubmit,
  onClose,
  submitLabel = "Save",
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [allDay, setAllDay] = useState(initialAllDay);
  const [startDate, setStartDate] = useState(toDateValue(initialStart));
  const startParts = toTimeParts12(initialStart);
  const [startHour, setStartHour] = useState(startParts.hour);
  const [startMinute, setStartMinute] = useState(startParts.minute);
  const [startAmPm, setStartAmPm] = useState(startParts.ampm);
  const [endDate, setEndDate] = useState(
    toDateValue(
      initialEnd ?? new Date(initialStart.getTime() + 60 * 60 * 1000),
    ),
  );
  const endParts = toTimeParts12(
    initialEnd ?? new Date(initialStart.getTime() + 60 * 60 * 1000),
  );
  const [endHour, setEndHour] = useState(endParts.hour);
  const [endMinute, setEndMinute] = useState(endParts.minute);
  const [endAmPm, setEndAmPm] = useState(endParts.ampm);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription ?? "");
    setAllDay(initialAllDay);
    setStartDate(toDateValue(initialStart));
    const sp = toTimeParts12(initialStart);
    setStartHour(sp.hour);
    setStartMinute(sp.minute);
    setStartAmPm(sp.ampm);
    const endFallback =
      initialEnd ?? new Date(initialStart.getTime() + 60 * 60 * 1000);
    setEndDate(toDateValue(endFallback));
    const ep = toTimeParts12(endFallback);
    setEndHour(ep.hour);
    setEndMinute(ep.minute);
    setEndAmPm(ep.ampm);
  }, [
    initialTitle,
    initialDescription,
    initialStart,
    initialEnd,
    initialAllDay,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const to24 = (h: string, ap: string) => {
      const base = parseInt(h, 10) % 12;
      return ap === "PM" ? base + 12 : base === 12 ? 0 : base;
    };
    const startH24 = to24(startHour, startAmPm);
    const endH24 = to24(endHour, endAmPm);
    const start = new Date(
      `${startDate}T${String(startH24).padStart(2, "0")}:${startMinute}:00`,
    );
    const end = new Date(
      `${endDate}T${String(endH24).padStart(2, "0")}:${endMinute}:00`,
    );
    onSubmit({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      start,
      end: end > start ? end : new Date(start.getTime() + 60 * 60 * 1000),
      allDay,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
        <h2 className="text-lg font-semibold mb-3">New Event</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm">
            Title *
            <input
              className="w-full border rounded px-2 py-2 mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Description (optional)
            <textarea
              className="w-full border rounded px-2 py-2 mt-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>
          <div className="flex flex-col text-sm">
            <label className="block">
              Start
              <div className="mt-1 flex gap-1">
                <input
                  type="date"
                  className="w-full border rounded px-2 py-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                {!allDay && (
                  <>
                    <select
                      className="border rounded px-2 py-2"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                    >
                      {hours12.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-2"
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-2"
                      value={startAmPm}
                      onChange={(e) => setStartAmPm(e.target.value)}
                    >
                      {ampmOptions.map((ap) => (
                        <option key={ap} value={ap}>
                          {ap}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </label>
            <label className="block">
              End
              <div className="mt-1 flex gap-1">
                <input
                  type="date"
                  className="w-full border rounded px-2 py-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                {!allDay && (
                  <>
                    <select
                      className="border rounded px-2 py-2"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                    >
                      {hours12.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-2"
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-2"
                      value={endAmPm}
                      onChange={(e) => setEndAmPm(e.target.value)}
                    >
                      {ampmOptions.map((ap) => (
                        <option key={ap} value={ap}>
                          {ap}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded border"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded text-white"
              style={{ backgroundColor: "#78502C" }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
