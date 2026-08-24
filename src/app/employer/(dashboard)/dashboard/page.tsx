import { Metadata } from "next";
import Link from "next/link";
import { EmployerLayout } from "@/components/employer";
import { Briefcase, FileText, Users, CalendarDays, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RestrictionToastListener } from "@/components/employer/RestrictionToastListener";
import { StatCardContainer } from "@/components/shared/StatCardContainer";
import { EmployerStatsCard } from "@/components/employer/EmployerStatsCard";
import { Card } from "@/components/ui/card";
import { PortalSectionTitle } from "@/components/shared/PortalSectionTitle";
import { EmployerApprovalStatusNotification } from "@/components/employer/EmployerApprovalStatusNotification";
import { getEmployerDashboardData } from "@/app/actions/employer-dashboard-data";
import {
    HiringFunnelWidget,
    CompanyProfileWidget,
    UpcomingInterviewsWidget,
    RecentApplicantsWidget,
    ActiveJobsWidget,
    BillingWidget,
    QuickActionsWidget,
} from "@/components/employer/dashboard/EmployerDashboardWidgets";

export const metadata: Metadata = {
    title: "Dashboard | JobGenie",
    description: "Employer dashboard overview",
};

export default async function EmployerDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // The approval *notification* modal reads the seen-flag through the user
    // client so it stays subject to the same policies as the rest of the portal.
    const { data: employerData } = await supabase
        .from("employers")
        .select(`
            id,
            companies!inner (
                company_name,
                approval_status,
                approval_status_message_seen,
                rejection_reason
            )
        `)
        .eq("user_id", user.id)
        .single();

    const company = (employerData as Record<string, unknown>)?.companies as {
        company_name?: string;
        approval_status?: string;
        approval_status_message_seen?: boolean;
        rejection_reason?: string | null;
    } | null;

    const companyName = company?.company_name || "Your company";
    const showApprovalNotification =
        company?.approval_status_message_seen === false &&
        (company.approval_status === "approved" || company.approval_status === "rejected");

    const data = await getEmployerDashboardData();
    const isPending = data ? !data.isApproved && data.approvalStatus === "pending" : false;

    return (
        <EmployerLayout
            pageTitle="Dashboard"
            pageDescription={data ? `Welcome back, ${data.firstName} - here's how ${data.companyName} is hiring.` : "Welcome back!"}
        >
            <RestrictionToastListener />

            {showApprovalNotification && company?.approval_status && (
                <EmployerApprovalStatusNotification
                    approvalStatus={company.approval_status as "approved" | "rejected"}
                    companyName={companyName}
                    rejectionReason={company.rejection_reason ?? null}
                />
            )}

            {isPending && (
                <Card
                    variant="glass"
                    className="mb-6 border-primary/20 bg-gradient-to-br from-primary/8 via-card/90 to-accent/10 p-5 shadow-md dark:from-primary/15 dark:via-card/50 dark:to-accent/15"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 ring-1 ring-primary/20">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-foreground">Company profile in review</p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                MIS is verifying your organization. You will be notified when you are cleared to post jobs and run full hiring workflows. You can still refine your company profile while you wait.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {!data ? (
                <Card variant="glass" className="p-10 text-center">
                    <p className="text-muted-foreground">Unable to load dashboard data. Please refresh.</p>
                </Card>
            ) : (
                <div className="space-y-8 md:space-y-10">

                    {/* ─── Headline metrics ──────────────────────────────── */}
                    <div>
                        <PortalSectionTitle
                            tone="employer"
                            eyebrow="Recruiting"
                            title="Operations snapshot"
                            description="Live counts across your postings, applicants and interviews."
                        />
                        <StatCardContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <EmployerStatsCard
                                title="Active Job Postings"
                                value={data.activeJobs}
                                description={
                                    data.draftJobs > 0
                                        ? `${data.draftJobs} draft${data.draftJobs === 1 ? "" : "s"} not published`
                                        : "Jobs currently open"
                                }
                                colorScheme="green"
                                icon={<Briefcase className="h-4 w-4" />}
                            />
                            <EmployerStatsCard
                                title="Total Applicants"
                                value={data.totalApplicants}
                                description={
                                    data.newApplicants > 0
                                        ? `${data.newApplicants} new in the last 7 days`
                                        : "All time applications"
                                }
                                colorScheme="cyan"
                                icon={<FileText className="h-4 w-4" />}
                            />
                            <EmployerStatsCard
                                title="In Interview"
                                value={data.interviewing}
                                description={
                                    data.pendingInvitations > 0
                                        ? `${data.pendingInvitations} invitation${data.pendingInvitations === 1 ? "" : "s"} awaiting reply`
                                        : "Candidates in your pipeline"
                                }
                                colorScheme="green"
                                icon={<Users className="h-4 w-4" />}
                            />
                            <EmployerStatsCard
                                title="Upcoming Interviews"
                                value={data.upcomingInterviewCount}
                                description={
                                    data.offersPending > 0
                                        ? `${data.offersPending} offer${data.offersPending === 1 ? "" : "s"} awaiting response`
                                        : "Scheduled from today onward"
                                }
                                colorScheme="cyan"
                                icon={<CalendarDays className="h-4 w-4" />}
                            />
                        </StatCardContainer>
                    </div>

                    {/* ─── Attention strip ───────────────────────────────── */}
                    {(data.expiringSoon > 0 || data.paymentsOutstanding > 0) && (
                        <Card variant="glass" className="flex flex-wrap items-center gap-x-6 gap-y-3 border-amber-500/25 bg-amber-50/60 p-4 dark:bg-amber-950/15">
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Needs your attention
                            </span>
                            {data.expiringSoon > 0 && (
                                <Link href="/employer/jobs" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                    {data.expiringSoon} job posting{data.expiringSoon === 1 ? "" : "s"} expiring within 7 days
                                </Link>
                            )}
                            {data.paymentsOutstanding > 0 && (
                                <Link href="/employer/payments" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                    {data.paymentsOutstanding} payment{data.paymentsOutstanding === 1 ? "" : "s"} awaiting settlement
                                </Link>
                            )}
                        </Card>
                    )}

                    {/* ─── Shortcuts ─────────────────────────────────────── */}
                    <div>
                        <PortalSectionTitle
                            tone="employer"
                            eyebrow="Shortcuts"
                            title="Get things done"
                            description="The actions employers reach for most, one click away."
                        />
                        <QuickActionsWidget data={data} />
                    </div>

                    {/* ─── Pipeline + profile ────────────────────────────── */}
                    <div>
                        <PortalSectionTitle
                            tone="employer"
                            eyebrow="Pipeline"
                            title="Hiring at a glance"
                            description="Funnel health, your live postings and where your company profile stands."
                        />
                        <div className="grid gap-6 lg:grid-cols-3">
                            <HiringFunnelWidget data={data} />
                            <ActiveJobsWidget jobs={data.topJobs} activeCount={data.activeJobs} />
                            <CompanyProfileWidget data={data} />
                        </div>
                    </div>

                    {/* ─── People + billing ──────────────────────────────── */}
                    <div>
                        <PortalSectionTitle
                            tone="employer"
                            eyebrow="Activity"
                            title="People and billing"
                            description="Who just applied, what's on the calendar and anything outstanding."
                        />
                        <div className="grid gap-6 lg:grid-cols-3">
                            <RecentApplicantsWidget applicants={data.recentApplicants} total={data.totalApplicants} />
                            <UpcomingInterviewsWidget interviews={data.upcomingInterviews} total={data.upcomingInterviewCount} />
                            <BillingWidget data={data} />
                        </div>
                    </div>

                </div>
            )}
        </EmployerLayout>
    );
}
