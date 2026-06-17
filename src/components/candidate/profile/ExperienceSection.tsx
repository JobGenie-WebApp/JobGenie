"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkExperience } from "@/types/profile-types";
import { Briefcase, MapPin, Calendar, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from "lucide-react";
import { ExperienceDialog } from "./dialogs/ExperienceDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { deleteExperience } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { formatUTCDate } from "@/lib/date-utils";

interface ExperienceSectionProps {
    experiences: WorkExperience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [showAll, setShowAll] = useState(false);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!experiences || experiences.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Experience
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedExperience(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No work experience added yet. Click &quot;Add Experience&quot; to get started.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Group experiences by company
    const groupedByCompany = experiences.reduce((acc, exp) => {
        const company = exp.company || "Unknown Company";
        if (!acc[company]) {
            acc[company] = [];
        }
        acc[company].push(exp);
        return acc;
    }, {} as Record<string, WorkExperience[]>);

    // Sort each company's experiences by start date (newest first)
    Object.keys(groupedByCompany).forEach(company => {
        groupedByCompany[company].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
        });
    });

    const companies = Object.keys(groupedByCompany).sort((a, b) => {
        const topA = groupedByCompany[a][0];
        const topB = groupedByCompany[b][0];
        const dateA = topA?.start_date ? new Date(topA.start_date).getTime() : 0;
        const dateB = topB?.start_date ? new Date(topB.start_date).getTime() : 0;
        return dateB - dateA;
    });

    const displayedCompanies = showAll ? companies : companies.slice(0, 3);
    const hasMore = companies.length > 3;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return formatUTCDate(dateString, "MMM yyyy");
    };

    const formatEmploymentType = (type: string | null) => {
        if (!type) return null;
        return type.split("_").map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
    };

    const formatLocationType = (type: string | null) => {
        if (!type) return null;
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const toggleDescription = (id: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const isTruncated = (text: string) => {
        const lines = text.split('\n');
        return lines.length > 2 || text.length > 200;
    };

    const getTruncatedText = (text: string) => {
        const lines = text.split('\n');
        if (lines.length > 2) {
            return lines.slice(0, 2).join('\n');
        }
        if (text.length > 200) {
            return text.substring(0, 200) + '...';
        }
        return text;
    };

    const handleEdit = (experience: WorkExperience) => {
        setSelectedExperience(experience);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setExperienceToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!experienceToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteExperience(experienceToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Experience deleted successfully",
                });
                setDeleteDialogOpen(false);
                setExperienceToDelete(null);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete experience",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Experience
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedExperience(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Experience
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {displayedCompanies.map((company, companyIndex) => (
                            <div key={company}>
                                {companyIndex > 0 && <Separator className="my-8" />}

                                {/* Company Header */}
                                <div className="mb-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 hidden md:flex">
                                            <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Briefcase className="h-7 w-7 text-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">{company}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {groupedByCompany[company].length} {groupedByCompany[company].length === 1 ? 'position' : 'positions'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Positions at this company */}
                                <div className="space-y-6 md:ml-[72px]">
                                    {groupedByCompany[company].map((exp, posIndex) => (
                                        <div key={exp.id}>
                                            {posIndex > 0 && <Separator className="my-6" />}

                                            <div className="group relative">
                                                {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
                                                <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleEdit(exp)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteClick(exp.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <h4 className="font-semibold text-lg pr-16 md:pr-0">
                                                    {exp.job_title || "Position"}
                                                </h4>

                                                {/* Date and Type Info */}
                                                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>
                                                            {formatDate(exp.start_date)} - {" "}
                                                            {exp.is_current ? (
                                                                <span className="text-primary font-medium">Present</span>
                                                            ) : (
                                                                formatDate(exp.end_date)
                                                            )}
                                                        </span>
                                                    </div>

                                                    {exp.employment_type && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatEmploymentType(exp.employment_type)}
                                                        </Badge>
                                                    )}

                                                    {exp.location_type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {formatLocationType(exp.location_type)}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {exp.location && (
                                                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span>{exp.location}</span>
                                                    </div>
                                                )}

                                                {/* Description with Read More */}
                                                {exp.description && (
                                                    <div className="mt-3">
                                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                            {expandedDescriptions[exp.id]
                                                                ? exp.description
                                                                : getTruncatedText(exp.description)
                                                            }
                                                        </p>
                                                        {isTruncated(exp.description) && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                onClick={() => toggleDescription(exp.id)}
                                                                className="px-0 h-auto mt-1 text-xs"
                                                            >
                                                                {expandedDescriptions[exp.id] ? (
                                                                    <>
                                                                        Read Less
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Read More
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View All Button */}
                    {hasMore && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowAll(!showAll)}
                                className="w-full md:w-auto"
                            >
                                {showAll ? (
                                    <>
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        View All Companies ({companies.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ExperienceDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                experience={selectedExperience}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Experience"
                description="Are you sure you want to delete this experience? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
}
