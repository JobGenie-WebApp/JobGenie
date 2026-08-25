"use client";

import { useState } from "react";
import { formatLabel } from "@/lib/utils";
import { formatSalary } from "@/lib/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandidateProfile } from "@/types/profile-types";
import { FileText, DollarSign, Clock, Briefcase, TrendingUp, Pencil, GraduationCap } from "lucide-react";
import { AboutDialog } from "./dialogs/AboutDialog";

interface AboutSectionProps {
    profile: CandidateProfile;
}

export function AboutSection({ profile }: AboutSectionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    if (!profile.professional_summary &&
        !profile.years_of_experience &&
        !profile.expected_monthly_salary &&
        !profile.notice_period &&
        !profile.employment_type) {
        return (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            About
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Add Information
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No about information added yet. Click &quot;Add Information&quot; to get started.
                        </p>
                    </CardContent>
                </Card>

                <AboutDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    profile={profile}
                />
            </>
        );
    }

    return (
        <>
            <Card className="group relative">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        About
                    </CardTitle>
                    {/* Edit Button - visible on hover on desktop, always visible on mobile */}
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {profile.professional_summary && (
                        <p className="text-muted-foreground text-justify leading-relaxed">
                            {profile.professional_summary}
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 py-2 gap-4">
                        {profile.highest_qualification && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Highest Qualification</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatLabel(profile.highest_qualification)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {profile.years_of_experience !== null && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Experience</p>
                                    <p className="text-sm text-muted-foreground">
                                        {profile.years_of_experience} years
                                        {profile.experience_level && (
                                            <Badge variant="secondary" className="ml-2">
                                                {formatLabel(profile.experience_level)}
                                            </Badge>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {profile.expected_monthly_salary && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Expected Salary</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatSalary(profile.expected_monthly_salary, profile.expected_salary_currency)}/month
                                    </p>
                                </div>
                            </div>
                        )}

                        {profile.notice_period && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Notice Period</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatLabel(profile.notice_period)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {profile.employment_type && (
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Employment Type</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatLabel(profile.employment_type)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <AboutDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                profile={profile}
            />
        </>
    );
}
