import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployerLayout } from "@/components/employer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Briefcase, Building2, MapPin, User } from "lucide-react";
import { getEmployerProfile } from "@/app/actions/employer-profiles";
import { formatPhoneNumber } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Employer Profile | JobGenie",
    description: "View and manage your employer profile",
};

export default async function EmployerProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const employerProfile = await getEmployerProfile(user.id);

    if (!employerProfile) {
        redirect("/employer/dashboard");
    }

    const fullName = `${employerProfile.first_name} ${employerProfile.last_name}`;
    const initials = `${employerProfile.first_name[0]}${employerProfile.last_name[0]}`.toUpperCase();

    return (
        <EmployerLayout
            pageTitle="Employer Profile"
            pageDescription="View and manage your personal information"
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        <Card variant="glass" className="overflow-hidden border-primary/15">
                            <CardContent className="relative pt-8">
                                <div
                                    className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/25 via-accent/15 to-transparent"
                                    aria-hidden
                                />
                                <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
                                        <AvatarFallback className="bg-primary/15 text-2xl font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight text-foreground">{fullName}</h2>
                                            {employerProfile.job_title ? (
                                                <p className="text-muted-foreground">{employerProfile.job_title}</p>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {employerProfile.department ? (
                                                <Badge className="border-primary/25 bg-primary/10 text-primary">
                                                    <Building2 className="mr-1 h-3 w-3" />
                                                    {employerProfile.department}
                                                </Badge>
                                            ) : null}
                                            {employerProfile.designation ? (
                                                <Badge variant="outline" className="border-border/80">
                                                    <User className="mr-1 h-3 w-3" />
                                                    {employerProfile.designation}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass" className="border-primary/10">
                            <CardHeader>
                                <CardTitle>Contact information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email address</p>
                                        <p className="font-medium">{employerProfile.email}</p>
                                    </div>
                                </div>

                                {employerProfile.phone ? (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
                                                <Phone className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Phone number</p>
                                                <p className="font-medium">{formatPhoneNumber(employerProfile.phone)}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                <Separator />
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium">{employerProfile.address}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {(employerProfile.job_title || employerProfile.department || employerProfile.designation) && (
                            <Card variant="glass" className="border-primary/10">
                                <CardHeader>
                                    <CardTitle>Professional details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {employerProfile.job_title ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
                                                <Briefcase className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Job title</p>
                                                <p className="font-medium">{employerProfile.job_title}</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {employerProfile.department ? (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Department</p>
                                                    <p className="font-medium">{employerProfile.department}</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : null}

                                    {employerProfile.designation ? (
                                        <>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Designation</p>
                                                    <p className="font-medium">{employerProfile.designation}</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card variant="glass" className="h-fit border-primary/15 lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle className="text-base">At a glance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                Need to rotate legal contacts or update billing details? Super admins can adjust those
                                from <span className="font-medium text-foreground">Company Profile</span>.
                            </p>
                            <Separator />
                            <p>
                                Invitations and calendar alerts use the email and phone listed here—double-check before
                                scheduling cross-timezone panels.
                            </p>
                        </CardContent>
                    </Card>
                </div>
        </EmployerLayout>
    );
}
