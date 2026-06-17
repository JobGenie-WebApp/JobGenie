import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
    if (!_resend) {
        const key = process.env.RESEND_API_KEY;
        if (!key) throw new Error("RESEND_API_KEY is not set");
        _resend = new Resend(key);
    }
    return _resend;
}

/** @deprecated Use getResend() instead */
export const resend = new Proxy({} as Resend, {
    get(_target, prop) {
        return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
    },
});

/** Transactional sender: verification, password resets, account notifications */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@jobgenie.biz";

/** Jobs sender: applications, job alerts, interview invitations, employer notifications */
export const EMAIL_JOBS_FROM = process.env.EMAIL_JOBS_FROM ?? "jobs@jobgenie.biz";
