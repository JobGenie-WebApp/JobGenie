"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Globe, MapPin, Phone, FileText, Users, MapPinned, Pencil, Briefcase } from "lucide-react";
import { CompanyProfile } from "@/app/actions/employer-profiles";
import { CompanyInfoDialog } from "@/components/employer/dialogs/CompanyInfoDialog";
import { formatIndustry } from "@/lib/utils";

interface CompanyProfileClientProps {
    company: CompanyProfile;
    isSuperAdmin: boolean;
}

export function CompanyProfileClient({ company, isSuperAdmin }: CompanyProfileClientProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const companyInitials = company.company_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <>
            <div className="w-full">
                <Card variant="glass" className="mb-6 overflow-hidden border-primary/15">
                    {/* Cover Photo Area */}
                    <div
                        className="relative h-28 overflow-hidden bg-gradient-to-r from-primary/35 via-accent/25 to-primary/10"
                        aria-hidden
                    />

                    {/* Company Info Section */}
                    <CardContent className="px-6 pb-4">
                        <div className="flex items-start gap-6 -mt-12 mb-4">
                            {/* Company Logo - Overlapping cover */}
                            <Avatar className="h-32 w-32 border-4 border-background shadow-lg bg-background rounded-full">
                                <AvatarImage
                                    src={company.logo_url || undefined}
                                    alt={company.company_name}
                                    className="object-cover rounded-full"
                                />
                                <AvatarFallback className="text-3xl bg-primary text-primary-foreground rounded-full">
                                    {companyInitials}
                                </AvatarFallback>
                            </Avatar>

                            {/* Edit Button - Top Right (Only for Super Admin) */}
                            {isSuperAdmin && (
                                <div className="ml-auto relative z-10">
                                    <Button
                                        variant="outline"
                                        size="default"
                                        onClick={() => setEditDialogOpen(true)}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Company Name & Bio */}
                        <div className="mb-4">
                            <h1 className="text-2xl font-bold mb-1">{company.company_name}</h1>
                            {company.bio && (
                                <p className="text-base text-muted-foreground">{company.bio}</p>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {company.company_size && (
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-4 w-4" />
                                    <span>{company.company_size} employees</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span>{formatIndustry(company.industry)}</span>
                            </div>
                            {company.website && (
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-primary hover:underline"
                                >
                                    <Globe className="h-4 w-4" />
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* LinkedIn-Style Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Content - Left Side (2/3) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Tabs */}
                        {!isMounted ? (
                            // Loading skeleton to prevent layout shift
                            <Card>
                                <div className="h-12 border-b" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                                </div>
                            </Card>
                        ) : (
                            <Tabs defaultValue="about" className="w-full">
                                <Card>
                                    <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 px-2">
                                        <TabsTrigger
                                            value="about"
                                            className="rounded-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                                        >
                                            About
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="jobs"
                                            className="rounded-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                                        >
                                            Jobs
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* About Tab */}
                                    <TabsContent value="about" className="p-6 space-y-6 mt-0">
                                        {/* About Section */}
                                        {company.description && (
                                            <div>
                                                <h2 className="text-lg font-semibold mb-3">Overview</h2>
                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {company.description}
                                                </p>
                                            </div>
                                        )}

                                        <Separator />

                                        {/* Specialities */}
                                        {company.specialities && company.specialities.length > 0 && (
                                            <div>
                                                <h2 className="text-lg font-semibold mb-3">Specialities</h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {company.specialities.map((speciality, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="font-normal px-3 py-1"
                                                        >
                                                            {speciality}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Map */}
                                        {company.map_link && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h2 className="text-lg font-semibold">Location</h2>
                                                        <a
                                                            href={company.map_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-sm font-medium"
                                                        >
                                                            View larger map
                                                        </a>
                                                    </div>
                                                    <div className="w-full h-[350px] rounded-lg overflow-hidden border">
                                                        <iframe
                                                            src={company.map_link}
                                                            width="100%"
                                                            height="100%"
                                                            style={{ border: 0 }}
                                                            allowFullScreen
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer-when-downgrade"
                                                            title="Company Location Map"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>

                                    {/* Jobs Tab */}
                                    <TabsContent value="jobs" className="p-6 mt-0">
                                        <div className="text-center py-12">
                                            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                            <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
                                            <p className="text-muted-foreground">
                                                Check back later for new opportunities
                                            </p>
                                        </div>
                                    </TabsContent>
                                </Card>
                            </Tabs>
                        )}
                    </div>

                    {/* Sidebar - Right Side (1/3) */}
                    <div className="space-y-4">
                        {/* Contact Info Card */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold mb-4">Contact info</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Phone</p>
                                            <p className="text-sm text-muted-foreground">{company.phone}</p>
                                        </div>
                                    </div>

                                    {company.website && (
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">Website</p>
                                                <a
                                                    href={company.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary hover:underline truncate block"
                                                >
                                                    {company.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Details Card */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold mb-4">Company details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium mb-1">Industry</p>
                                        <p className="text-sm text-muted-foreground">{formatIndustry(company.industry)}</p>
                                    </div>

                                    {company.company_size && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Company size</p>
                                            <p className="text-sm text-muted-foreground">{company.company_size} employees</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium mb-1">Registration number</p>
                                        <p className="text-sm text-muted-foreground font-mono">{company.business_registration_no}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium mb-1">Status</p>
                                        <Badge
                                            variant={
                                                company.approval_status === "approved"
                                                    ? "default"
                                                    : company.approval_status === "pending"
                                                        ? "outline"
                                                        : "destructive"
                                            }
                                            className="text-xs"
                                        >
                                            {company.approval_status.charAt(0).toUpperCase() + company.approval_status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Locations Card */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold mb-4">Locations</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPinned className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium mb-1">Registered address</p>
                                            <p className="text-sm text-muted-foreground">{company.business_registered_address}</p>
                                        </div>
                                    </div>

                                    {company.headoffice_location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium mb-1">Head office</p>
                                                <p className="text-sm text-muted-foreground">{company.headoffice_location}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <CompanyInfoDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                company={company}
            />
        </>
    );
}
