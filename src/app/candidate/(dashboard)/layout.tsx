import { TimezoneSync } from "@/components/common/TimezoneSync";
import { CandidateInvitationRealtimeBridge } from "@/components/realtime/InvitationRealtimeBridge";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <TimezoneSync />
            <CandidateInvitationRealtimeBridge />
            {children}
        </>
    );
}
