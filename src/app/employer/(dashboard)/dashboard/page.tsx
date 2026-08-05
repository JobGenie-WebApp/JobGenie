import { Metadata } from "next";
import { EmployerLayout } from "@/components/employer";
import { Briefcase, FileText, Users, TrendingUp, Loader2, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RestrictionToastListener } from "@/components/employer/RestrictionToastListener";
import { StatCardContainer } from "@/components/shared/StatCardContainer";
import { EmployerStatsCard } from "@/components/employer/EmployerStatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalSectionTitle } from "@/components/shared/PortalSectionTitle";
import { EmployerApprovalStatusNotification } from "@/components/employer/EmployerApprovalStatusNotification";

export const metadata: Metadata = {
    title: "Dashboard | JobGenie",
    description: "Employer dashboard overview",
};

export default async function EmployerDashboardPage() {
    // Fetch company approval status
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let isPending = false;
    let showApprovalNotification = false;
    let approvalStatus: "approved" | "rejected" | null = null;
    let rejectionReason: string | null = null;
    let companyName = "Your company";

    const { data: employerData } = await supabase
        .from('employers')
        .select(`
            id,
            companies!inner (
                company_name,
                approval_status,
                approval_status_message_seen,
                rejection_reason
            )
        `)
        .eq('user_id', user.id)
        .single();

    // Type assertion for nested company data
    const company = (employerData as Record<string, unknown>)?.companies as {
        company_name?: string;
        approval_status?: string;
        approval_status_message_seen?: boolean;
        rejection_reason?: string | null;
    } | null;

    companyName = company?.company_name || companyName;

    // Check if company is pending approval
    if (company?.approval_status === 'pending') {
        isPending = true;
    }

    if (
        company?.approval_status_message_seen === false &&
        (company.approval_status === "approved" || company.approval_status === "rejected")
    ) {
        showApprovalNotification = true;
        approvalStatus = company.approval_status;
        rejectionReason = company.rejection_reason ?? null;
    }

    // TODO: Fetch real stats from database
    const stats = {
        activeJobs: 0,
        totalApplications: 0,
        shortlisted: 0,
        newApplications: 0,
    };

    return (
        <EmployerLayout
            pageTitle="Dashboard"
            pageDescription="Welcome back! Here's an overview of your recruitment activities."
        >
            <RestrictionToastListener />

            {showApprovalNotification && approvalStatus && (
                <EmployerApprovalStatusNotification
                    approvalStatus={approvalStatus}
                    companyName={companyName}
                    rejectionReason={rejectionReason}
                />
            )}

            {/* Pending Status Alert */}
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
                            <p className="text-base font-semibold text-foreground">
                                Company profile in review
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                MIS is verifying your organization. You will be notified when you are cleared to post jobs and run full hiring workflows. You can still refine your company profile while you wait.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-8 md:space-y-10">
                <div>
                    <PortalSectionTitle
                        tone="employer"
                        eyebrow="Recruiting"
                        title="Operations snapshot"
                        description="Headline metrics for postings and inbound talent. Wire these to live data when ready."
                    />
                    <StatCardContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <EmployerStatsCard
                        title="Active Job Postings"
                        value={stats.activeJobs}
                        description="Jobs currently open"
                        colorScheme="green"
                        icon={<Briefcase className="h-4 w-4" />}
                    />
                    <EmployerStatsCard
                        title="Total Applications"
                        value={stats.totalApplications}
                        description="All time applications"
                        colorScheme="cyan"
                        icon={<FileText className="h-4 w-4" />}
                    />
                    <EmployerStatsCard
                        title="Shortlisted"
                        value={stats.shortlisted}
                        description="Candidates under review"
                        colorScheme="green"
                        icon={<Users className="h-4 w-4" />}
                    />
                    <EmployerStatsCard
                        title="New Applications"
                        value={stats.newApplications}
                        description="In the last 7 days"
                        colorScheme="cyan"
                        icon={<TrendingUp className="h-4 w-4" />}
                    />
                </StatCardContainer>
                </div>

                <Card variant="glass" className="overflow-hidden border-border/70 shadow-sm">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 dark:bg-muted/10">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/20 ring-1 ring-primary/20">
                                <Activity className="h-4 w-4 text-primary" />
                            </span>
                            <CardTitle className="text-lg">Recent activity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center dark:bg-muted/5">
                            <p className="text-sm font-medium text-foreground">No activity yet</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Once candidates apply and your team moves stages, a live feed will appear here.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EmployerLayout>
    );
}
