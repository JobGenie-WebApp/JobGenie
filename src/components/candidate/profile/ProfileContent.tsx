"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CandidateProfile } from "@/types/profile-types";
import { ProfileHeader } from "./ProfileHeader";
import { AboutSection } from "./AboutSection";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { AwardsSection } from "./AwardsSection";
import { IT_INDUSTRIES } from "@/lib/validations/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <Card variant="glass" className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="px-6 pb-6">
                    <Skeleton className="h-32 w-32 rounded-full -mt-16 mb-4 border-4 border-background" />
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64 mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </Card>

            {/* Other Sections Skeletons */}
            {[1, 2, 3].map((i) => (
                <Card variant="glass" key={i}>
                    <div className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <Card variant="glass" className="border-destructive/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-destructive/10 mb-4">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Unable to Load Profile</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    {message}
                </p>
            </CardContent>
        </Card>
    );
}

export function ProfileContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    const refreshProfile = () => setRefreshIndex((prev) => prev + 1);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setIsLoading(true);
                const response = await fetch("/api/candidate/profile", {
                    cache: "no-store" // Prevent caching to always get fresh data
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch profile");
                }

                if (data.success && data.data) {
                    setProfile(data.data);
                } else {
                    throw new Error(data.error || "Invalid response format");
                }
            } catch (err: unknown) {
                console.error("Error fetching profile:", err);
                setError(err instanceof Error ? err.message : "An unexpected error occurred");
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, [pathname, searchParams, refreshIndex]); // Refetch when route changes or a refresh is requested

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (error || !profile) {
        return <ErrorState message={error || "Profile data not found"} />;
    }

    return (
        <div className="w-full space-y-6">
            {/* Profile Header */}
            <ProfileHeader profile={profile} onProfileUpdated={refreshProfile} />

            {/* About Section */}
            <AboutSection profile={profile} />

            {/* Experience Section */}
            <ExperienceSection experiences={profile.work_experiences || []} />

            {/* Education Section */}
            <EducationSection
                educations={profile.educations || []}
                financeAcademic={profile.finance_academic_education || []}
                financeProfessional={profile.finance_professional_education || []}
                bankingAcademic={profile.banking_academic_education || []}
                bankingProfessional={profile.banking_professional_education || []}
                bankingTraining={profile.banking_specialized_training || []}
                industry={profile.industry}
            />

            {/* Projects Section - IT Industry Only */}
            {profile.industry && IT_INDUSTRIES.includes(profile.industry as typeof IT_INDUSTRIES[number]) && (
                <ProjectsSection projects={profile.projects || []} />
            )}

            {/* Certifications Section - IT Industry Only */}
            {profile.industry && IT_INDUSTRIES.includes(profile.industry as typeof IT_INDUSTRIES[number]) && (
                <CertificationsSection certificates={profile.certificates || []} />
            )}

            {/* Awards Section */}
            <AwardsSection awards={profile.awards || []} />
        </div>
    );
}
