"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Award } from "@/types/profile-types";
import { Trophy, Pencil, Trash2, Plus } from "lucide-react";
import { AwardDialog } from "./dialogs/AwardDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { deleteAward } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";

interface AwardsSectionProps {
    awards: Award[];
}

export function AwardsSection({ awards }: AwardsSectionProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [showAll, setShowAll] = useState(false);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAward, setSelectedAward] = useState<Award | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [awardToDelete, setAwardToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const sortedAwards = [...(awards || [])].reverse();
    const displayedAwards = showAll ? sortedAwards : sortedAwards.slice(0, 3);
    const hasMore = sortedAwards && sortedAwards.length > 3;
    const isEmpty = !sortedAwards || sortedAwards.length === 0;

    const toggleDescription = (id: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleEdit = (award: Award) => {
        setSelectedAward(award);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setAwardToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!awardToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteAward(awardToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Award deleted successfully",
                });
                setDeleteDialogOpen(false);
                setAwardToDelete(null);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete award",
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
                        <Trophy className="h-5 w-5" />
                        Awards & Achievements
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedAward(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Award
                    </Button>
                </CardHeader>
                <CardContent>
                    {isEmpty ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No awards added yet. Click &quot;Add Award&quot; to get started.
                        </p>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {displayedAwards.map((award, index) => (
                                    <div key={award.id}>
                                        {index > 0 && <Separator className="my-6" />}
                                        <div className="group relative flex gap-4">
                                            {/* Icon - hidden on mobile */}
                                            <div className="flex-shrink-0 hidden md:flex">
                                                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                    <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                                </div>
                                            </div>

                                            {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
                                            <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEdit(award)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(award.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 min-w-0 pr-16 md:pr-0">
                                                <h3 className="font-semibold text-lg">
                                                    {award.nature_of_award || "Award"}
                                                </h3>
                                                {award.offered_by && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {award.offered_by}
                                                    </p>
                                                )}
                                                {award.description && (
                                                    <div className="mt-2">
                                                        <p
                                                            className={`text-sm text-muted-foreground leading-relaxed ${!expandedDescriptions[award.id] ? 'line-clamp-2' : ''
                                                                }`}
                                                        >
                                                            {award.description}
                                                        </p>
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => toggleDescription(award.id)}
                                                            className="px-0 h-auto mt-1 text-xs"
                                                        >
                                                            {expandedDescriptions[award.id] ? "Read Less" : "Read More"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
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
                                        {showAll ? "Show Less" : `View All Awards (${awards.length})`}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AwardDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                award={selectedAward}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Award"
                description="Are you sure you want to delete this award? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
}
