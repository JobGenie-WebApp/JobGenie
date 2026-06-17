"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/types/profile-types";
import { FolderGit2, ExternalLink, Pencil, Trash2, Plus } from "lucide-react";
import { ProjectDialog } from "./dialogs/ProjectDialog";
import { DeleteConfirmDialog } from "./dialogs/DeleteConfirmDialog";
import { deleteProject } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";

interface ProjectsSectionProps {
    projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [showAll, setShowAll] = useState(false);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!projects || projects.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FolderGit2 className="h-5 w-5" />
                        Projects
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedProject(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No projects added yet. Click &quot;Add Project&quot; to get started.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const displayedProjects = showAll ? projects : projects.slice(0, 3);
    const hasMore = projects.length > 3;

    const toggleDescription = (id: string) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleEdit = (project: Project) => {
        setSelectedProject(project);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setProjectToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteProject(projectToDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Project deleted successfully",
                });
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete project",
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
                        <FolderGit2 className="h-5 w-5" />
                        Projects
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedProject(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {displayedProjects.map((project, index) => (
                            <div key={project.id}>
                                {index > 0 && <Separator className="my-6" />}
                                <div className="group relative space-y-3">
                                    {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
                                    <div className="absolute -right-2 -top-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEdit(project)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteClick(project.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-start justify-between gap-2 pr-16 md:pr-0">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg">
                                                {project.project_name || "Untitled Project"}
                                            </h3>
                                            {project.is_current && (
                                                <Badge variant="default" className="mt-1">
                                                    Currently Working
                                                </Badge>
                                            )}
                                        </div>

                                        {project.demo_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-shrink-0"
                                                asChild
                                            >
                                                <a
                                                    href={project.demo_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    View
                                                </a>
                                            </Button>
                                        )}
                                    </div>

                                    {project.description && (
                                        <div>
                                            <p
                                                className={`text-sm text-muted-foreground leading-relaxed ${!expandedDescriptions[project.id] ? 'line-clamp-2' : ''
                                                    }`}
                                            >
                                                {project.description}
                                            </p>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => toggleDescription(project.id)}
                                                className="px-0 h-auto mt-1 text-xs"
                                            >
                                                {expandedDescriptions[project.id] ? "Read Less" : "Read More"}
                                            </Button>
                                        </div>
                                    )}
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
                                {showAll ? "Show Less" : `View All Projects (${projects.length})`}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ProjectDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                project={selectedProject}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Project"
                description="Are you sure you want to delete this project? This action cannot be undone."
                isLoading={isDeleting}
            />
        </>
    );
}
