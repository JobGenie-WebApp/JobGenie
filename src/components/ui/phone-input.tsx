"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { CountryOption } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * Split a stored international number into the country whose dial code it carries and the
 * local part. Longest calling code wins so "+1868" (Trinidad) is not read as "+1".
 */
export function splitPhone(countries: CountryOption[], value: string, picked = "", defaultCountry = "LK") {
    const dialCountries = countries.filter(c => c.calling_code);
    const digits = value.replace(/[^\d+]/g, "");
    const matched = dialCountries
        .filter(c => digits.startsWith(c.calling_code!))
        .sort((a, b) => b.calling_code!.length - a.calling_code!.length)[0];
    // `picked` only breaks ties between countries sharing a calling code (+1 US/CA).
    const selected =
        dialCountries.find(c => c.code === picked && (!matched || c.calling_code === matched.calling_code)) ??
        matched ??
        dialCountries.find(c => c.code === defaultCountry);
    const dial = selected?.calling_code ?? "";
    return {
        selected,
        dial,
        local: dial && digits.startsWith(dial) ? digits.slice(dial.length) : digits.replace(/^\+/, ""),
    };
}

/**
 * Dial-code picker (flag + calling code, searchable by country name) beside the local number,
 * the same pairing the candidate signup form uses. The value handed back is the composed
 * international number ("+94771234567"), so callers keep storing a single phone string.
 */
export function PhoneInput({
    id,
    countries,
    value,
    onChange,
    placeholder = "771234567",
    disabled = false,
    hasError = false,
    className,
    defaultCountry = "LK",
}: {
    id?: string;
    countries: CountryOption[];
    value: string;
    onChange: (phone: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    className?: string;
    defaultCountry?: string;
}) {
    const dialCountries = useMemo(() => countries.filter(c => c.calling_code), [countries]);
    const options = useMemo(
        () => dialCountries.map(c => ({ value: c.code, label: `${c.flag_emoji} ${c.calling_code}`, keywords: c.name })),
        [dialCountries],
    );

    // Only used to disambiguate countries sharing a calling code (+1 US/CA) — otherwise the
    // selection is derived from the value so a restored draft shows the right flag.
    const [picked, setPicked] = useState("");
    const { selected, dial, local } = splitPhone(countries, value, picked, defaultCountry);

    const emit = (nextDial: string, nextLocal: string) => onChange(nextLocal ? nextDial + nextLocal : "");

    return (
        <div className="flex gap-2">
            <Combobox
                options={options}
                value={selected?.code ?? ""}
                onValueChange={code => {
                    setPicked(code);
                    emit(dialCountries.find(c => c.code === code)?.calling_code ?? "", local);
                }}
                placeholder="Code"
                searchPlaceholder="Country or code..."
                emptyMessage="No country found."
                disabled={disabled}
                className={cn("h-12 w-32 shrink-0 px-3", hasError && "border-destructive")}
            />
            <Input
                id={id}
                type="tel"
                inputMode="tel"
                maxLength={14}
                placeholder={placeholder}
                value={local}
                disabled={disabled}
                onChange={e => emit(dial, e.target.value.replace(/\D/g, ""))}
                className={cn("h-12 flex-1", hasError && "border-destructive", className)}
            />
        </div>
    );
}
