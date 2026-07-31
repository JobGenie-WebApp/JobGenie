import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    PanelsTopLeft,
    Briefcase,
    FileText,
    User,
    Settings,
    Mail,
    CalendarDays,
    Building2,
    Users,
    UserCog,
    CreditCard,
    UserSquare,
    Shield,
    BarChart3,
    Calendar,
    SlidersHorizontal,
    Bell,
    AlertTriangle,
    Eye,
    Bookmark,
} from "lucide-react";

/** A sub-section entry rendered inside a collapsible parent item. The page it
 *  links to switches its active panel from the `?section=` query param. */
export interface NavSubItem {
    title: string;
    /** Full href including the `?section=` query param. */
    href: string;
    /** The `section` query value this sub-item maps to (for active matching). */
    section: string;
    icon: LucideIcon;
    /** Only shown to company super-admins (filtered by the sidebar). */
    superAdminOnly?: boolean;
}

/** A single navigation entry. `requiresApproval`/`visibilityKey`/`badge` are
 *  only honoured by the portals whose sidebars implement that logic. */
export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    requiresApproval?: boolean;
    visibilityKey?: string;
    /** Drives which count badge (if any) is shown next to the item. */
    badge?: "invitations" | "payments";
    /** When present, the item renders as a collapsible group of sub-sections. */
    children?: NavSubItem[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

/* ── Candidate ──────────────────────────────────────────────────────────── */
export const candidateNav: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { title: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard, requiresApproval: false, visibilityKey: "dashboard" },
        ],
    },
    {
        label: "Job Search",
        items: [
            {
                title: "Browse Jobs", href: "/candidate/jobs", icon: Briefcase, requiresApproval: true, visibilityKey: "browse-jobs",
                children: [
                    { title: "All Jobs", section: "browse", href: "/candidate/jobs", icon: Briefcase },
                    { title: "Applied Jobs", section: "applied", href: "/candidate/jobs?section=applied", icon: FileText },
                    { title: "Saved Jobs", section: "saved", href: "/candidate/jobs?section=saved", icon: Bookmark },
                ],
            },
            { title: "Invitations", href: "/candidate/invitations", icon: Mail, requiresApproval: true, visibilityKey: "invitations", badge: "invitations" },
            { title: "Calendar", href: "/candidate/calendar", icon: CalendarDays, requiresApproval: true, visibilityKey: "calendar" },
        ],
    },
    {
        label: "Profile",
        items: [
            { title: "My Profile", href: "/candidate/profile", icon: User, requiresApproval: false, visibilityKey: "my-profile" },
            { title: "My Resumes", href: "/candidate/resumes", icon: FileText, requiresApproval: false, visibilityKey: "my-resumes" },
        ],
    },
    {
        label: "Account",
        items: [
            {
                title: "Settings", href: "/candidate/settings", icon: Settings, requiresApproval: true, visibilityKey: "settings",
                children: [
                    { title: "Account & Security", section: "account",         href: "/candidate/settings?section=account",         icon: Shield },
                    { title: "Preferences",        section: "preferences",     href: "/candidate/settings?section=preferences",     icon: SlidersHorizontal },
                    { title: "Notifications",      section: "notifications",    href: "/candidate/settings?section=notifications",    icon: Bell },
                    { title: "Job Preferences",    section: "job-preferences",  href: "/candidate/settings?section=job-preferences", icon: Briefcase },
                    { title: "Danger Zone",        section: "danger",           href: "/candidate/settings?section=danger",          icon: AlertTriangle },
                ],
            },
        ],
    },
];

/* ── Employer ───────────────────────────────────────────────────────────── */
export const employerNav: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { title: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard, requiresApproval: false, visibilityKey: "dashboard" },
        ],
    },
    {
        label: "Hiring",
        items: [
            { title: "Job Postings", href: "/employer/jobs", icon: Briefcase, requiresApproval: true, visibilityKey: "job-postings" },
            { title: "Candidates", href: "/employer/candidates", icon: Users, requiresApproval: true, visibilityKey: "candidates" },
            { title: "Applicants", href: "/employer/invitations", icon: FileText, requiresApproval: true, visibilityKey: "invitations", badge: "invitations" },
            { title: "Calendar", href: "/employer/calendar", icon: CalendarDays, requiresApproval: true, visibilityKey: "calendar" },
        ],
    },
    {
        label: "Billing",
        items: [
            { title: "Payments", href: "/employer/payments", icon: CreditCard, requiresApproval: true, visibilityKey: "payments", badge: "payments" },
        ],
    },
    {
        label: "Company",
        items: [
            { title: "Company Profile", href: "/employer/company", icon: Building2, requiresApproval: false, visibilityKey: "company-profile" },
            { title: "Company Admins", href: "/employer/admins", icon: UserCog, requiresApproval: true, visibilityKey: "company-admins" },
        ],
    },
    {
        label: "Account",
        items: [
            {
                title: "Settings", href: "/employer/settings", icon: Settings, requiresApproval: true, visibilityKey: "settings",
                // Privacy & Visibility and Team & Access are super-admin only; the
                // sidebar filters them out for regular employers.
                children: [
                    { title: "Account & Security", section: "account",       href: "/employer/settings?section=account",       icon: Shield },
                    { title: "Preferences",        section: "preferences",   href: "/employer/settings?section=preferences",   icon: SlidersHorizontal },
                    { title: "Notifications",      section: "notifications",  href: "/employer/settings?section=notifications",  icon: Bell },
                    { title: "Hiring Preferences", section: "hiring",         href: "/employer/settings?section=hiring",         icon: Briefcase },
                    { title: "Privacy & Visibility", section: "privacy",      href: "/employer/settings?section=privacy",        icon: Eye,   superAdminOnly: true },
                    { title: "Team & Access",        section: "team",         href: "/employer/settings?section=team",           icon: Users, superAdminOnly: true },
                    { title: "Danger Zone",        section: "danger",         href: "/employer/settings?section=danger",         icon: AlertTriangle },
                ],
            },
        ],
    },
];

/* ── MIS ────────────────────────────────────────────────────────────────── */
export const misNav: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { title: "Dashboard", href: "/mis/dashboard", icon: LayoutDashboard },
            {
                title: "Reports & Analytics", href: "/mis/reports", icon: BarChart3,
                children: [
                    { title: "Overview",     section: "all",          href: "/mis/reports?section=all",          icon: BarChart3 },
                    { title: "Candidates",   section: "candidates",   href: "/mis/reports?section=candidates",   icon: Users },
                    { title: "Employers",    section: "employers",    href: "/mis/reports?section=employers",    icon: Building2 },
                    { title: "Companies",    section: "companies",    href: "/mis/reports?section=companies",     icon: Building2 },
                    { title: "Jobs",         section: "jobs",         href: "/mis/reports?section=jobs",          icon: Briefcase },
                    { title: "Applications", section: "applications", href: "/mis/reports?section=applications",  icon: Calendar },
                ],
            },
        ],
    },
    {
        label: "Users & Access",
        items: [
            { title: "MIS User Management", href: "/mis/users", icon: Users },
            { title: "Roles & Permissions", href: "/mis/roles", icon: Shield },
        ],
    },
    {
        label: "Operations",
        items: [
            { title: "Candidates", href: "/mis/candidates", icon: UserSquare },
            { title: "Employers", href: "/mis/employers", icon: Building2 },
            { title: "Jobs", href: "/mis/jobs", icon: Briefcase },
            { title: "Interviews", href: "/mis/interviews", icon: Calendar },
            { title: "Payments", href: "/mis/payments", icon: CreditCard },
        ],
    },
    {
        label: "System",
        items: [
            { title: "Site Settings", href: "/mis/content", icon: PanelsTopLeft },
            { title: "Audit Logs", href: "/mis/audit", icon: FileText },
            {
                title: "Master Data", href: "/mis/settings", icon: Settings,
                children: [
                    { title: "Industries",          section: "industries",        href: "/mis/settings?section=industries",        icon: Building2 },
                    { title: "Job Designations",    section: "designations",      href: "/mis/settings?section=designations",      icon: Briefcase },
                    { title: "Seniority Levels",    section: "seniority",         href: "/mis/settings?section=seniority",         icon: BarChart3 },
                    { title: "Interview Reminders", section: "reminders",         href: "/mis/settings?section=reminders",         icon: Bell },
                    { title: "Sidebar Visibility",  section: "sidebar-visibility", href: "/mis/settings?section=sidebar-visibility", icon: Eye },
                ],
            },
        ],
    },
];

/** href → title map across all portals, used to resolve breadcrumb labels. */
export const NAV_LABELS: Record<string, string> = [
    ...candidateNav,
    ...employerNav,
    ...misNav,
].reduce<Record<string, string>>((acc, group) => {
    for (const item of group.items) acc[item.href] = item.title;
    return acc;
}, {});

/** Static labels for leaf/segment paths that aren't top-level nav items. */
export const SEGMENT_LABELS: Record<string, string> = {
    new: "New",
    add: "Add",
    edit: "Edit",
    create: "Create",
    permissions: "Permissions",
};
