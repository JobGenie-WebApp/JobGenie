import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import {
    Briefcase, Users, CalendarDays, Building2, CreditCard, Video, MapPin,
    UserPlus, Zap, ArrowRight, CheckCircle2, Clock4, Inbox, FileText, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard, EmptyState, Avatar } from "./DashboardCard";
import type {
    EmployerDashboardData, UpcomingInterview, RecentApplicant, JobSummary, ProfileChecklistItem,
} from "@/app/actions/employer-dashboard-data";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(iso: string, pattern = "MMM d"): string {
    const d = parseISO(iso);
    return isValid(d) ? format(d, pattern) : "";
}

function fmtTime(raw: string): string {
    const m = raw?.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return raw ?? "";
    let h = parseInt(m[1], 10);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m[2]} ${ap}`;
}

function relativeDay(date: string): string | null {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(new Date(Date.now() + 864e5), "yyyy-MM-dd");
    if (date === today) return "Today";
    if (date === tomorrow) return "Tomorrow";
    return null;
}

const APPLICANT_STATUS: Record<string, { label: string; className: string }> = {
    pending: { label: "New", className: "bg-primary/10 text-primary" },
    reviewed: { label: "Reviewed", className: "bg-muted text-muted-foreground" },
    shortlisted: { label: "Shortlisted", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    rejected: { label: "Rejected", className: "bg-muted text-muted-foreground" },
    hired: { label: "Hired", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground" },
};

/* ── Hiring funnel ───────────────────────────────────────────────────────── */

/** Applicants → shortlisted → interviewing → offers → hired, as proportional
 *  bars against the widest stage so drop-off is readable at a glance. */
export function HiringFunnelWidget({ data }: { data: EmployerDashboardData }) {
    const stages = [
        { label: "Applicants", value: data.totalApplicants, href: "/employer/invitations" },
        { label: "Shortlisted", value: data.shortlisted, href: "/employer/invitations" },
        { label: "Interviewing", value: data.interviewing, href: "/employer/calendar" },
        { label: "Offers extended", value: data.offersExtended, href: "/employer/invitations" },
        { label: "Hired", value: data.hired, href: "/employer/invitations" },
    ];
    const max = Math.max(...stages.map((s) => s.value), 1);
    const isEmpty = stages.every((s) => s.value === 0);

    return (
        <DashboardCard
            icon={Zap}
            title="Hiring funnel"
            subtitle="Where your candidates are right now"
            footerHref="/employer/invitations"
            footerLabel="Open hiring board"
        >
            {isEmpty ? (
                <EmptyState
                    icon={Inbox}
                    title="No candidates yet"
                    hint="Publish a job or invite candidates directly — the funnel fills in as people move through your pipeline."
                />
            ) : (
                <div className="flex flex-col gap-3.5 px-5 py-5">
                    {stages.map((s) => (
                        <Link key={s.label} href={s.href} className="group block">
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                                    {s.label}
                                </span>
                                <span className="text-sm font-bold tabular-nums text-foreground">{s.value}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </DashboardCard>
    );
}

/* ── Company profile completeness ────────────────────────────────────────── */

function CircularProgress({ percent }: { percent: number }) {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
                <circle
                    cx="30" cy="30" r={radius} fill="none"
                    stroke="var(--color-primary, #00cc44)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (percent / 100) * circumference}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <span className="relative z-10 text-sm font-bold tabular-nums text-foreground">{percent}%</span>
        </div>
    );
}

export function CompanyProfileWidget({ data }: { data: EmployerDashboardData }) {
    const todo: ProfileChecklistItem[] = data.profileChecklist.filter((i) => !i.done);

    return (
        <DashboardCard
            icon={Building2}
            title="Company profile"
            subtitle={data.companyName}
            badge={
                <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                    data.isApproved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                )}>
                    {data.approvalStatus}
                </span>
            }
        >
            <div className="px-5 py-5">
                <div className="mb-4 flex items-center gap-4">
                    <CircularProgress percent={data.profileCompletionPercent} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            {data.profileCompletionPercent >= 100
                                ? "Profile complete"
                                : data.profileCompletionPercent >= 60 ? "Looking good" : "Needs attention"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {todo.length === 0
                                ? "Every section is filled in."
                                : `${todo.length} item${todo.length === 1 ? "" : "s"} left — a fuller profile attracts more candidates.`}
                        </p>
                    </div>
                </div>

                {todo.length > 0 && (
                    <ul className="mb-4 flex flex-col gap-1.5">
                        {todo.slice(0, 4).map((item) => (
                            <li key={item.label}>
                                <Link href={item.href} className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                                    <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-primary/40">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                    <ArrowRight className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 text-center">
                    <div>
                        <p className="text-lg font-bold tabular-nums text-foreground">{data.teamMembers}</p>
                        <p className="text-[11px] text-muted-foreground">Team members</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold tabular-nums text-foreground">{fmtDate(data.memberSince, "MMM yyyy")}</p>
                        <p className="text-[11px] text-muted-foreground">Member since</p>
                    </div>
                </div>

                <Link
                    href="/employer/company"
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    {todo.length > 0 ? "Complete profile" : "View company profile"}
                </Link>
            </div>
        </DashboardCard>
    );
}

/* ── Upcoming interviews ─────────────────────────────────────────────────── */

export function UpcomingInterviewsWidget({ interviews, total }: { interviews: UpcomingInterview[]; total: number }) {
    return (
        <DashboardCard
            icon={CalendarDays}
            title="Upcoming interviews"
            subtitle={total === 0 ? "Nothing scheduled" : `${total} scheduled`}
            footerHref="/employer/calendar"
            footerLabel="Open calendar"
        >
            {interviews.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title="No interviews scheduled"
                    hint="Once you confirm a time slot with a candidate it will appear here."
                />
            ) : (
                <ul className="divide-y divide-border/60">
                    {interviews.map((iv) => {
                        const rel = relativeDay(iv.date);
                        return (
                            <li key={iv.id}>
                                {/* The employer invitations page selects via ?id=, it has no /[id] route. */}
                                <Link href={`/employer/invitations?id=${iv.invitationId}`} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                                    <Avatar src={iv.candidateImage} name={iv.candidateName} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{iv.candidateName}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {iv.jobDesignation}{iv.roundLabel ? ` · ${iv.roundLabel}` : ""}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                rel ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                                            )}>
                                                {rel ?? fmtDate(iv.date)} · {fmtTime(iv.time)}
                                            </span>
                                            {iv.interviewMode && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    {iv.interviewMode === "online" ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                                                    {iv.interviewMode === "online" ? "Online" : "In-person"}
                                                </span>
                                            )}
                                            <span className={cn(
                                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                iv.isConfirmed
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                            )}>
                                                {iv.isConfirmed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock4 className="h-2.5 w-2.5" />}
                                                {iv.isConfirmed ? "Confirmed" : "Awaiting"}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </DashboardCard>
    );
}

/* ── Recent applicants ───────────────────────────────────────────────────── */

export function RecentApplicantsWidget({ applicants, total }: { applicants: RecentApplicant[]; total: number }) {
    return (
        <DashboardCard
            icon={Users}
            title="Recent applicants"
            subtitle={total === 0 ? "No applications yet" : `${total} total`}
            footerHref="/employer/invitations"
            footerLabel="Review all applicants"
        >
            {applicants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No applications yet"
                    hint="Applications land here as soon as candidates apply to your published jobs."
                />
            ) : (
                <ul className="divide-y divide-border/60">
                    {applicants.map((a) => {
                        const badge = APPLICANT_STATUS[a.status] ?? APPLICANT_STATUS.pending;
                        return (
                            <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                                <Avatar src={a.candidateImage} name={a.candidateName} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="truncate text-sm font-semibold text-foreground">{a.candidateName}</p>
                                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.className)}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {a.currentPosition ? `${a.currentPosition} · ` : ""}{a.jobTitle}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[11px] text-muted-foreground">Applied {fmtDate(a.appliedAt)}</span>
                                        {a.atsScore != null && (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                {Math.round(a.atsScore)}% match
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </DashboardCard>
    );
}

/* ── Active job postings ─────────────────────────────────────────────────── */

export function ActiveJobsWidget({ jobs, activeCount }: { jobs: JobSummary[]; activeCount: number }) {
    return (
        <DashboardCard
            icon={Briefcase}
            title="Active job postings"
            subtitle={activeCount === 0 ? "Nothing published" : `${activeCount} live`}
            footerHref="/employer/jobs"
            footerLabel="Manage job postings"
        >
            {jobs.length === 0 ? (
                <EmptyState
                    icon={Briefcase}
                    title="No published jobs"
                    hint="Publish your first job posting to start receiving applications."
                />
            ) : (
                <ul className="divide-y divide-border/60">
                    {jobs.map((j) => (
                        <li key={j.id}>
                            <Link href={`/employer/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">{j.jobTitle}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {[j.location, j.jobType?.replace(/_/g, " ")].filter(Boolean).join(" · ") || "No location set"}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-bold tabular-nums text-foreground">{j.applicantCount}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        applicant{j.applicantCount === 1 ? "" : "s"}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </DashboardCard>
    );
}

/* ── Billing summary ─────────────────────────────────────────────────────── */

export function BillingWidget({ data }: { data: EmployerDashboardData }) {
    const clear = data.paymentsOutstanding === 0 && data.paymentsUnderReview === 0;
    return (
        <DashboardCard
            icon={CreditCard}
            title="Billing"
            subtitle={clear ? "Nothing outstanding" : "Action may be needed"}
            footerHref="/employer/payments"
            footerLabel="View payments"
        >
            <div className="grid grid-cols-2 divide-x divide-border/60">
                <div className="px-5 py-4">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{data.paymentsOutstanding}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Awaiting payment</p>
                    {data.amountOutstanding > 0 && (
                        <p className="mt-1 text-xs font-semibold text-primary">
                            LKR {data.amountOutstanding.toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="px-5 py-4">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{data.paymentsUnderReview}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Under review</p>
                </div>
            </div>
        </DashboardCard>
    );
}

/* ── Shortcuts ───────────────────────────────────────────────────────────── */

export function QuickActionsWidget({ data }: { data: EmployerDashboardData }) {
    const actions = [
        {
            title: "Post a job", subtitle: "Create a new opening", href: "/employer/jobs/new",
            icon: Briefcase, requiresApproval: true,
        },
        {
            title: "Find candidates", subtitle: "Search the talent pool", href: "/employer/candidates",
            icon: UserPlus, requiresApproval: true,
        },
        {
            title: "Applicants", subtitle: "Review your pipeline", href: "/employer/invitations",
            icon: FileText, requiresApproval: true,
            badge: data.pendingInvitations > 0 ? `${data.pendingInvitations} pending` : undefined,
        },
        {
            title: "Calendar", subtitle: "Interview schedule", href: "/employer/calendar",
            icon: CalendarDays, requiresApproval: true,
            badge: data.upcomingInterviewCount > 0 ? `${data.upcomingInterviewCount} upcoming` : undefined,
        },
        {
            title: "Company profile", subtitle: "Branding & details", href: "/employer/company",
            icon: Building2, requiresApproval: false,
        },
        {
            title: "Settings", subtitle: "Team & preferences", href: "/employer/settings",
            icon: Settings, requiresApproval: true,
        },
    ];

    return (
        <DashboardCard icon={Zap} title="Quick actions" subtitle="Jump straight to what you need">
            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-3">
                {actions.map((a) => {
                    const Icon = a.icon;
                    const locked = a.requiresApproval && !data.isApproved;

                    if (locked) {
                        return (
                            <div
                                key={a.href}
                                className="flex cursor-not-allowed flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 opacity-50"
                                title="Available once your company is approved"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold leading-tight text-foreground">{a.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">Awaiting approval</p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={a.href}
                            href={a.href}
                            className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/20"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold leading-tight text-foreground">{a.title}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{a.subtitle}</p>
                            </div>
                            {a.badge && (
                                <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    {a.badge}
                                </span>
                            )}
                            <ArrowRight className="absolute top-3.5 right-3.5 h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50" />
                        </Link>
                    );
                })}
            </div>
        </DashboardCard>
    );
}
