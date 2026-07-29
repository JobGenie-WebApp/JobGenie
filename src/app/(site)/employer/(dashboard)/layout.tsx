import { TimezoneSync } from "@/components/common/TimezoneSync";
import { EmployerInvitationRealtimeBridge } from "@/components/realtime/InvitationRealtimeBridge";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <TimezoneSync />
            <EmployerInvitationRealtimeBridge />
            {children}
        </>
    );
}
