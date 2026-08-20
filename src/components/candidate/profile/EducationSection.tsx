"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Education } from "@/types/profile-types";
import { GraduationCap, Award as AwardIcon, Pencil, Trash2, Plus } from "lucide-react";
import { EducationDialog } from "./dialogs/EducationDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { deleteEducation } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { sortEducations } from "@/lib/utils";

interface EducationSectionProps {
    educations: Education[];
}

export function EducationSection({ educations }: EducationSectionProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
    const [educationType, setEducationType] = useState<"academic" | "professional">("academic");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eduToDelete, setEduToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (educations.length === 0) {
        return null;
    }

    const formatStatus = (status: string) => {
        return status.split("_").map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
    };

    const getStatusColor = (status: string) => {
        if (status === "first_class") {
            return "border-border/70 bg-muted text-foreground";
        }
        if (status.includes("second_class")) {
            return "border-border/70 bg-muted text-foreground";
        }
        return "border-border/70 bg-muted text-muted-foreground";
    };

    const handleEdit = (edu: Education) => {
        setSelectedEducation(edu);
        setEducationType(edu.education_type as "academic" | "professional");
        setDialogOpen(true);
    };

    const handleAdd = (type: "academic" | "professional") => {
        setSelectedEducation(null);
        setEducationType(type);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setEduToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!eduToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteEducation(eduToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Education deleted successfully",
                });
                setDeleteDialogOpen(false);
                setEduToDelete(null);
                router.refresh(); // Refresh to show updated data immediately
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete education",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const academic = sortEducations(educations.filter(e => e.education_type === "academic"));
    const professional = sortEducations(educations.filter(e => e.education_type === "professional"));

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="academic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="academic">Academic</TabsTrigger>
                            <TabsTrigger value="professional">Professional</TabsTrigger>
                        </TabsList>

                        <TabsContent value="academic" className="space-y-4 mt-4">
                            <div className="flex justify-end mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAdd("academic")}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Academic Education
                                </Button>
                            </div>
                            {academic.length > 0 ? academic.map((edu, index) => (
                                <div key={edu.id}>
                                    {index > 0 && <Separator className="my-4" />}
                                    <div className="group relative flex gap-4">
                                        <div className="flex-shrink-0 hidden md:flex">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                                <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        </div>

                                        {/* Edit/Delete buttons */}
                                        <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEdit(edu)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(edu.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 pr-16 md:pr-0">
                                            <h3 className="font-semibold">{edu.degree_diploma}</h3>
                                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                            <Badge variant="outline" className={`mt-2 text-xs ${getStatusColor(edu.status)}`}>
                                                {formatStatus(edu.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No academic education added</p>
                            )}
                        </TabsContent>

                        <TabsContent value="professional" className="space-y-4 mt-4">
                            <div className="flex justify-end mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAdd("professional")}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Professional Qualification
                                </Button>
                            </div>
                            {professional.length > 0 ? professional.map((edu, index) => (
                                <div key={edu.id}>
                                    {index > 0 && <Separator className="my-4" />}
                                    <div className="group relative flex gap-4">
                                        <div className="flex-shrink-0 hidden md:flex">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                                <AwardIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        </div>

                                        {/* Edit/Delete buttons */}
                                        <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEdit(edu)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(edu.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 pr-16 md:pr-0">
                                            {/* Older rows only carry degree_diploma, so fall back to it. */}
                                            <h3 className="font-semibold">{edu.professional_qualification || edu.degree_diploma}</h3>
                                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                            <Badge variant="outline" className={`mt-2 text-xs ${getStatusColor(edu.status)}`}>
                                                {formatStatus(edu.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No professional qualifications added</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <EducationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                education={selectedEducation}
                educationType={educationType}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Education"
                description="Are you sure you want to delete this education entry? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
}
