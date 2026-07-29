"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Shield, Briefcase, Phone, Building } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPhoneNumber } from "@/lib/utils";
import { formatTimestamp, formatUTCDate } from "@/lib/date-utils";

interface CompanyAdmin {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    designation?: string;
    job_title?: string;
    department?: string;
    phone?: string;
    is_super_admin: boolean;
    profile_image_url?: string;
    created_at: string;
}

interface AdminProfilesClientProps {
    admins: CompanyAdmin[];
}

export function AdminProfilesClient({ admins }: AdminProfilesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

    // Initialize with first admin or from URL
    useEffect(() => {
        const adminIdFromUrl = searchParams.get("adminId");
        if (adminIdFromUrl && admins.find(a => a.id === adminIdFromUrl)) {
            setSelectedAdminId(adminIdFromUrl);
        } else if (admins.length > 0 && !selectedAdminId) {
            setSelectedAdminId(admins[0].id);
        }
    }, [admins, searchParams, selectedAdminId]);

    const handleAdminSelect = (adminId: string) => {
        setSelectedAdminId(adminId);
        router.push(`/employer/admins?adminId=${adminId}`, { scroll: false });
    };

    const selectedAdmin = admins.find(admin => admin.id === selectedAdminId);

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'A';
    };

    const formatDate = (dateString: string) => {
        const hasTimePart = typeof dateString === "string" && dateString.includes("T");
        return hasTimePart
            ? formatTimestamp(dateString, "MMMM d, yyyy")
            : formatUTCDate(dateString, "MMMM d, yyyy");
    };

    if (admins.length === 0) {
        return (
            <Card variant="glass" className="flex min-h-[420px] items-center justify-center border-dashed border-primary/20">
                <div className="px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/20">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No admins found</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        There are currently no administrators in your company.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-12rem)]">
            {/* Left Panel - Admin Cards List */}
            <div className="w-full lg:w-2/5 xl:w-1/3">
                <div className="lg:hidden mb-4">
                    {/* Mobile: Simple scrollable list without fixed height */}
                    <div className="space-y-2">
                        {admins.map((admin) => {
                            const isSelected = selectedAdminId === admin.id;
                            const fullName = `${admin.first_name} ${admin.last_name}`;
                            const initials = getInitials(admin.first_name, admin.last_name);

                            return (
                                <Card
                                    key={admin.id}
                                    className={`p-3 cursor-pointer ${isSelected
                                        ? 'border-primary shadow-sm bg-primary/5 dark:bg-primary/10'
                                        : 'border-border hover:bg-accent/50'
                                        }`}
                                    onClick={() => handleAdminSelect(admin.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12 border-2 border-border">
                                            <AvatarImage src={admin.profile_image_url || undefined} alt={fullName} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {fullName}
                                                </h3>
                                                <Badge
                                                    variant={admin.is_super_admin ? "default" : "secondary"}
                                                    className="shrink-0 text-xs"
                                                >
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {admin.is_super_admin ? "Super Admin" : "Admin"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {admin.designation || admin.job_title || admin.email}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Desktop: Scrollable area with fixed height */}
                <ScrollArea className="hidden lg:block h-full">
                    <div className="space-y-3 pr-1">
                        {admins.map((admin) => {
                            const isSelected = selectedAdminId === admin.id;
                            const fullName = `${admin.first_name} ${admin.last_name}`;
                            const initials = getInitials(admin.first_name, admin.last_name);

                            return (
                                <Card
                                    key={admin.id}
                                    className={`p-4 cursor-pointer ${isSelected
                                        ? 'border-primary shadow-sm bg-primary/5 dark:bg-primary/10'
                                        : 'border-border hover:bg-accent/50'
                                        }`}
                                    onClick={() => handleAdminSelect(admin.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-14 w-14 border-2 border-border">
                                            <AvatarImage src={admin.profile_image_url || undefined} alt={fullName} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-base truncate">
                                                    {fullName}
                                                </h3>
                                                <Badge
                                                    variant={admin.is_super_admin ? "default" : "secondary"}
                                                    className="shrink-0 text-xs"
                                                >
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {admin.is_super_admin ? "Super Admin" : "Admin"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {admin.designation || admin.job_title || admin.email}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Panel - Admin Details */}
            <div className="w-full lg:flex-1">
                {selectedAdmin ? (
                    <Card className="h-auto lg:h-full overflow-hidden">
                        <ScrollArea className="h-auto lg:h-full max-h-[500px] lg:max-h-none">
                            <div className="p-4 lg:p-6">
                                {/* Hero Section */}
                                <div className="flex flex-col items-center text-center mb-4 lg:mb-6 pb-4 lg:pb-6 border-b">
                                    <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-2 border-border mb-2 lg:mb-3">
                                        <AvatarImage src={selectedAdmin.profile_image_url || undefined} alt={`${selectedAdmin.first_name} ${selectedAdmin.last_name}`} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl lg:text-3xl">
                                            {getInitials(selectedAdmin.first_name, selectedAdmin.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h1 className="text-xl lg:text-2xl font-bold mb-2">
                                        {selectedAdmin.first_name} {selectedAdmin.last_name}
                                    </h1>
                                    <Badge variant={selectedAdmin.is_super_admin ? "default" : "outline"}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {selectedAdmin.is_super_admin ? "Super Administrator" : "Company Administrator"}
                                    </Badge>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-3 lg:space-y-4">
                                    <h2 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3">Contact Information</h2>
                                    <div className="space-y-2 lg:space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="font-medium text-sm truncate">{selectedAdmin.email}</p>
                                            </div>
                                        </div>
                                        {selectedAdmin.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Phone</p>
                                                    <p className="font-medium text-sm">{formatPhoneNumber(selectedAdmin.phone)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedAdmin.designation && (
                                            <div className="flex items-center gap-3">
                                                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Designation</p>
                                                    <p className="font-medium text-sm">{selectedAdmin.designation}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedAdmin.department && (
                                            <div className="flex items-center gap-3">
                                                <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Department</p>
                                                    <p className="font-medium text-sm">{selectedAdmin.department}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Member Since</p>
                                                <p className="font-medium text-sm">{formatDate(selectedAdmin.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </Card>
                ) : (
                    <Card className="h-auto lg:h-full flex items-center justify-center py-16 lg:py-0">
                        <div className="text-center text-muted-foreground">
                            <Shield className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-3 lg:mb-4 opacity-50" />
                            <p className="text-base lg:text-lg">Select an admin to view details</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
