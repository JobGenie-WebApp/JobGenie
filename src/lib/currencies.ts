/**
 * ISO 4217 currencies straight out of `Intl` - the runtime already ships the full list,
 * so there is no dependency and no hand-maintained table to go stale.
 */

export type CurrencyOption = { code: string; symbol: string; name: string; flag: string };

export const DEFAULT_CURRENCY = "LKR";

const symbolOf = (code: string) =>
    new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? code;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * An ISO 4217 code starts with its country's ISO 3166 code, so the flag falls out of the first
 * two letters - except the supranational X** codes (XOF, XDR...), which get no flag.
 */
const flagOf = (code: string) => {
    const region = code.slice(0, 2);
    if (regionNames.of(region) === region) return "";
    return String.fromCodePoint(...[...region].map((ch) => ch.codePointAt(0)! + 127397));
};

let cached: CurrencyOption[] | null = null;

/** Built on first use - 160-odd `Intl.NumberFormat` constructions is not worth paying at import time. */
export function currencyOptions(): CurrencyOption[] {
    if (cached) return cached;
    const names = new Intl.DisplayNames(["en"], { type: "currency" });
    cached = Intl.supportedValuesOf("currency").map((code) => ({
        code,
        symbol: symbolOf(code),
        name: names.of(code) ?? code,
        flag: flagOf(code),
    }));
    return cached;
}

/** Combobox-ready: "🇱🇰 LKR Rs", searchable by the currency's full name. */
export const currencySelectOptions = () =>
    currencyOptions().map((c) => ({
        value: c.code,
        // Plenty of currencies have no distinct symbol - Intl hands back the code, so don't repeat it.
        label: `${c.flag} ${c.code}${c.symbol === c.code ? "" : ` ${c.symbol}`}`.trim(),
        keywords: c.name,
    }));

/** "LKR 150,000" - the code rather than a symbol, since one symbol serves a dozen currencies. */
export const formatSalary = (amount: number | string, currency?: string | null) =>
    `${currency || DEFAULT_CURRENCY} ${Number(amount).toLocaleString()}`;

/** "LKR 100,000 – 200,000" / "LKR 100,000+" / "Up to LKR 200,000" - null when neither bound is set. */
export function formatSalaryRange(
    min: number | null | undefined,
    max: number | null | undefined,
    currency?: string | null,
    suffix = ""
) {
    if (!min && !max) return null;
    const c = currency || DEFAULT_CURRENCY;
    const f = (v: number) => v.toLocaleString();
    if (min && max) return `${c} ${f(min)} – ${f(max)}${suffix}`;
    if (min) return `${c} ${f(min)}+${suffix}`;
    return `Up to ${c} ${f(max!)}${suffix}`;
}
