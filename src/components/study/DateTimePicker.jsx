import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Value contract: a local datetime string "YYYY-MM-DDTHH:mm" (same shape the
// event form / API already use). null/"" means unset.
function pad(n) { return String(n).padStart(2, "0"); }

function parseValue(value) {
  if (!value) return null;
  const [datePart, timePart] = String(value).split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = (timePart || "00:00").split(":").map(Number);
  if (!y || !mo || !d) return null;
  const date = new Date(y, mo - 1, d, h || 0, mi || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

export default function DateTimePicker({ value, onChange, showTime = true, placeholder = "Pick a date" }) {
  const [open, setOpen] = useState(false);
  const date = parseValue(value);

  const emit = (next) => onChange(toValue(next));

  const handleDate = (picked) => {
    if (!picked) return;
    const base = date || new Date(new Date().setHours(9, 0, 0, 0));
    const next = new Date(picked);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    emit(next);
    if (!showTime) setOpen(false);
  };

  const setTime = ({ hour12, minute, meridiem }) => {
    const base = date || new Date(new Date().setHours(9, 0, 0, 0));
    const next = new Date(base);
    const h12 = hour12 ?? ((base.getHours() % 12) || 12);
    const mer = meridiem ?? (base.getHours() >= 12 ? "PM" : "AM");
    let h24 = h12 % 12;
    if (mer === "PM") h24 += 12;
    next.setHours(h24, minute ?? base.getMinutes(), 0, 0);
    emit(next);
  };

  const hour12 = date ? ((date.getHours() % 12) || 12) : 9;
  const minute = date ? date.getMinutes() : 0;
  const meridiem = date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start gap-2 font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="h-4 w-4 opacity-70" />
          {date ? format(date, showTime ? "EEE, MMM d · h:mm a" : "EEE, MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date || undefined} onSelect={handleDate} defaultMonth={date || undefined} autoFocus />
        {showTime && (
          <div className="flex items-center gap-2 border-t p-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={String(hour12)} onValueChange={(v) => setTime({ hour12: Number(v) })}>
              <SelectTrigger className="h-9 w-16"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-56">
                {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={String(minute)} onValueChange={(v) => setTime({ minute: Number(v) })}>
              <SelectTrigger className="h-9 w-16"><SelectValue>{pad(minute)}</SelectValue></SelectTrigger>
              <SelectContent className="max-h-56">
                {MINUTES.map((mm) => <SelectItem key={mm} value={String(mm)}>{pad(mm)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={meridiem} onValueChange={(v) => setTime({ meridiem: v })}>
              <SelectTrigger className="h-9 w-18"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
