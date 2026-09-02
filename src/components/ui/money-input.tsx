"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * `<input type="number">` can never show thousand separators, so money fields render as
 * a text input that groups the digits while you type and reports the plain number back.
 */

/** "1234567.5" -> "1,234,567.5". Leaves a trailing "." alone so it can still be typed. */
export function groupDigits(raw: string) {
    const [int, ...rest] = raw.split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return rest.length ? `${grouped}.${rest.join("")}` : grouped;
}

/** Strips everything but digits and a single decimal point. */
export function parseMoneyInput(text: string) {
    return text.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

type MoneyInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
    value: number | string | null | undefined;
    /** Raw digits — "" when cleared. Parse to a number at the call site as before. */
    onChange: (value: string) => void;
};

export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
    const incoming = value === null || value === undefined || value === "" ? "" : String(value);
    const [raw, setRaw] = React.useState(incoming);

    // Adopt outside changes (form reset, async load) without fighting what is being typed:
    // "1000." and "1000" are the same number, so leave the in-progress text alone.
    React.useEffect(() => {
        setRaw((current) =>
            incoming !== current && Number(incoming) !== Number(current) ? incoming : current
        );
    }, [incoming]);

    return (
        <Input
            {...props}
            type="text"
            inputMode="decimal"
            value={groupDigits(raw)}
            onChange={(e) => {
                const next = parseMoneyInput(e.target.value);
                setRaw(next);
                onChange(next);
            }}
        />
    );
}
