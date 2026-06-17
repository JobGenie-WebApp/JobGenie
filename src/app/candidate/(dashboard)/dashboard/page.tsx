import { FileText, Users, Gift, Bookmark, AlertTriangle } from 'lucide-react';
import { CandidateLayout } from '@/components/candidate';
import { ApprovalStatusNotification } from '@/components/candidate/ApprovalStatusNotification';
import { RestrictionToastListener } from '@/components/candidate/RestrictionToastListener';
import { getCandidateDashboardData } from '@/app/actions/candidate-dashboard-data';
import { DashboardStatsCard } from '@/components/candidate/dashboard/DashboardStatsCard';
import { StatCardContainer } from '@/components/candidate/dashboard/StatCardContainer';
import { RecommendedJobsWidget } from '@/components/candidate/dashboard/RecommendedJobsWidget';
import { ProfileStrengthWidget } from '@/components/candidate/dashboard/ProfileStrengthWidget';
import { UpgradeProCard } from '@/components/candidate/dashboard/UpgradeProCard';
import { InterviewCalendarWidget } from '@/components/candidate/dashboard/InterviewCalendarWidget';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PortalSectionTitle } from '@/components/shared/PortalSectionTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function CandidateDashboardPage() {
    // Fetch approval notification state (for the modal)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let showNotification = false;
    let approvalStatus: 'approved' | 'rejected' | null = null;
    let rejectionReason: string | null = null;

    if (user) {
        const { data: candidateData } = await supabase
            .from('candidates')
            .select('approval_status, approval_status_message_seen, rejection_reason')
            .eq('user_id', user.id)
            .single();

        if (candidateData && !candidateData.approval_status_message_seen) {
            if (
                candidateData.approval_status === 'approved' ||
                candidateData.approval_status === 'rejected'
            ) {
                showNotification = true;
                approvalStatus = candidateData.approval_status as 'approved' | 'rejected';
                rejectionReason = candidateData.rejection_reason;
            }
        }
    }

    // Fetch all dashboard data
    const data = await getCandidateDashboardData();

    const isPending = data?.approvalStatus === 'pending';

    return (
        <CandidateLayout
            pageTitle="Overview"
            pageDescription={data ? `Welcome back, ${data.firstName}!` : 'Welcome back!'}
        >
            <RestrictionToastListener />

            {/* Approval notification modal */}
            {showNotification && approvalStatus && (
                <ApprovalStatusNotification
                    approvalStatus={approvalStatus}
                    rejectionReason={rejectionReason}
                />
            )}

            {/* ─── Approve Pending Banner ──────────────────────────────────── */}
            {isPending && (
                <Card
                    variant="glass"
                    className="mb-6 flex items-start gap-4 border-primary/25 bg-gradient-to-br from-primary/[0.08] to-card/90 p-4 shadow-md dark:from-primary/15 dark:to-card/40"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
                        <AlertTriangle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Approval pending</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Your profile is under review. You can browse jobs, but applications stay paused until MIS approves you — typically within 24 hours.
                        </p>
                    </div>
                    <Button variant="gradient" size="sm" className="shrink-0" asChild>
                        <Link href="/candidate/profile">Check status</Link>
                    </Button>
                </Card>
            )}

            {!data ? (
                <Card variant="glass" className="p-10 text-center">
                    <p className="text-muted-foreground">Unable to load dashboard data. Please refresh.</p>
                </Card>
            ) : (
                <div className="space-y-8 md:space-y-10">

                    <div>
                        <PortalSectionTitle
                            tone="candidate"
                            eyebrow="Pipeline"
                            title="Application pulse"
                            description="Live counts for where you are in the hiring journey."
                        />
                        <StatCardContainer className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <DashboardStatsCard
                                title="Under Review"
                                value={data.underReviewApplications}
                                icon={<FileText className="h-5 w-5" />}
                                colorScheme="green"
                            />
                            <DashboardStatsCard
                                title="Interviews"
                                value={data.interviews}
                                icon={<Users className="h-5 w-5" />}
                                colorScheme="cyan"
                            />
                            <DashboardStatsCard
                                title="Offers Received"
                                value={data.offersReceived}
                                icon={<Gift className="h-5 w-5" />}
                                colorScheme="green"
                            />
                            <DashboardStatsCard
                                title="Saved Jobs"
                                value={data.savedJobs}
                                icon={<Bookmark className="h-5 w-5" />}
                                colorScheme="cyan"
                            />
                        </StatCardContainer>
                    </div>

                    {/* ─── Row 2: Main two-column layout ──────────────────────── */}
                    <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">

                        {/* ── Left column (3/5): Recommended Jobs ─────────────── */}
                        <div className="lg:col-span-3 flex flex-col gap-5">
                            <RecommendedJobsWidget jobs={data.recommendedJobs} />
                        </div>

                        {/* ── Right column (2/5): Calendar + Profile Strength + Upgrade card ─ */}
                        <div className="lg:col-span-2 flex flex-col gap-5">
                            <InterviewCalendarWidget events={data.interviewEvents} />
                            <ProfileStrengthWidget data={data} />
                            <UpgradeProCard />
                        </div>
                    </div>


                </div>
            )}
        </CandidateLayout>
    );
}
