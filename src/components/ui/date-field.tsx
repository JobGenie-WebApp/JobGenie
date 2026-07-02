"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";

import { cn } from "@/lib/utils";
import type { Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// ── Consistent, locale-independent date field ─────────────────────────────────
// Renders the SAME UI + display format on every browser/OS/device, unlike the
// native <input type="date"> whose displayed format follows the user's locale.
//
// - `value` / `onChange` speak ISO `yyyy-MM-dd` (unchanged data contract). A
//   hidden <input name={name}> carries that same ISO value so a surrounding
//   <form> submits exactly what the native input used to.
// - The visible trigger always shows the fixed `dd MMM yyyy` format (e.g.
//   "25 Nov 1995") regardless of the visitor's locale.

const DISPLAY_FORMAT = "dd MMM yyyy";
const ISO_FORMAT = "yyyy-MM-dd";

function parseIso(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const d = parse(value, ISO_FORMAT, new Date());
    return isValid(d) ? d : undefined;
}

export function DateField({
    id,
    name,
    value,
    onChange,
    onBlur,
    placeholder = "Select date",
    error = false,
    disabled = false,
    disableFuture = false,
    disablePast = false,
    minDate,
    maxDate,
    clearable = false,
    fromYear = 1940,
    toYear = new Date().getFullYear() + 10,
    className,
    triggerClassName,
    align = "start",
}: {
    id?: string;
    name?: string;
    value: string; // ISO yyyy-MM-dd
    onChange: (isoValue: string) => void;
    onBlur?: (isoValue: string) => void;
    placeholder?: string;
    error?: boolean;
    disabled?: boolean;
    disableFuture?: boolean;
    disablePast?: boolean;
    minDate?: string; // ISO yyyy-MM-dd — days before this are disabled
    maxDate?: string; // ISO yyyy-MM-dd — days after this are disabled
    clearable?: boolean;
    fromYear?: number;
    toYear?: number;
    className?: string;
    triggerClassName?: string;
    align?: "start" | "center" | "end";
}) {
    const [open, setOpen] = React.useState(false);
    const selected = parseIso(value);
    const today = React.useMemo(() => new Date(), []);

    const commit = (iso: string) => {
        onChange(iso);
        onBlur?.(iso);
    };

    const handleSelect = (date: Date | undefined) => {
        commit(date ? format(date, ISO_FORMAT) : "");
        setOpen(false);
    };

    const minBound = parseIso(minDate);
    const maxBound = parseIso(maxDate);
    const disabledMatchers = [
        disableFuture ? { after: today } : null,
        disablePast ? { before: today } : null,
        minBound ? { before: minBound } : null,
        maxBound ? { after: maxBound } : null,
    ].filter(Boolean) as Matcher[];

    return (
        <div className={cn("relative w-full", className)}>
            {/* Hidden field keeps the native form-submit contract (ISO value). */}
            {name && <input type="hidden" name={name} value={value} />}
            <Popover
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (!o) onBlur?.(value);
                }}
            >
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={id}
                        disabled={disabled}
                        className={cn(
                            // mirrors <Input /> so it drops in identically
                            "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                            selected ? "text-foreground" : "text-muted-foreground/50",
                            error && "border-destructive ring-destructive/20 dark:ring-destructive/40",
                            triggerClassName,
                        )}
                    >
                        <span className="truncate">
                            {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
                        </span>
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align={align}>
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={handleSelect}
                        defaultMonth={selected ?? (disableFuture ? new Date(2000, 0) : today)}
                        captionLayout="dropdown"
                        startMonth={new Date(fromYear, 0)}
                        endMonth={new Date(toYear, 11)}
                        disabled={disabledMatchers.length ? disabledMatchers : undefined}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
            {clearable && selected && !disabled && (
                <button
                    type="button"
                    aria-label="Clear date"
                    onClick={() => commit("")}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
