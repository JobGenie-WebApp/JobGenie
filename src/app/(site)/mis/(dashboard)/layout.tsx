import { TimezoneSync } from "@/components/common/TimezoneSync";

export default function MISDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <TimezoneSync />
            {children}
        </>
    );
}
