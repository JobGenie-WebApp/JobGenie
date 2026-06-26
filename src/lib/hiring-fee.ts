// Hiring fee = a configurable percentage of the offered *monthly* salary.
// Offers store a salary amount plus a period (hourly/daily/monthly/annual), so we
// first normalise the amount to a monthly figure using standard working-time
// assumptions, then apply the MIS-configured percentage.

export const DEFAULT_HIRING_FEE_PERCENTAGE = 50;

// Assumptions for converting non-monthly salaries to a monthly equivalent.
const HOURS_PER_MONTH = 160; // ~40h/week × 4 weeks
const DAYS_PER_MONTH = 22; // typical working days per month

export type SalaryPeriod = "hourly" | "daily" | "monthly" | "annual";

/** Normalise a salary amount for the given period into a monthly equivalent. */
export function toMonthlySalary(amount: number, period: SalaryPeriod): number {
  switch (period) {
    case "hourly":
      return amount * HOURS_PER_MONTH;
    case "daily":
      return amount * DAYS_PER_MONTH;
    case "annual":
      return amount / 12;
    case "monthly":
    default:
      return amount;
  }
}

/**
 * Compute the hiring fee as `percentage`% of the monthly-equivalent salary.
 * Returns null when no usable salary amount is available, so callers can fall
 * back to configured pricing. `percentage` defaults to 50 if not provided.
 */
export function computeHiringFee(
  amount: number | null | undefined,
  period: SalaryPeriod | null | undefined,
  percentage: number = DEFAULT_HIRING_FEE_PERCENTAGE
): number | null {
  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return null;
  }
  const pct = Number.isFinite(percentage) && percentage >= 0 ? percentage : DEFAULT_HIRING_FEE_PERCENTAGE;
  const monthly = toMonthlySalary(Number(amount), (period ?? "monthly") as SalaryPeriod);
  // Round to 2 decimals to match the Decimal(12,2) column.
  return Math.round(monthly * (pct / 100) * 100) / 100;
}
