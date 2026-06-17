/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { projectSchema, type ProjectFormData } from "@/lib/validations/profile";
import { addProject, updateProject } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types/profile-types";

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!project;

    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            project_name: "",
            description: "",
            demo_url: "",
            is_current: false,
        },
    });

    // Reset form when dialog opens with project data
    useEffect(() => {
        if (open && project) {
            form.reset({
                project_name: project.project_name || "",
                description: project.description || "",
                demo_url: project.demo_url || "",
                is_current: project.is_current || false,
            });
        } else if (open && !project) {
            // Reset to empty when adding new
            form.reset({
                project_name: "",
                description: "",
                demo_url: "",
                is_current: false,
            });
        }
    }, [open, project, form]);

    const isCurrent = form.watch("is_current");

    async function onSubmit(data: ProjectFormData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields - convert empty strings to undefined
            const formattedData = {
                ...data,
                description: data.description && data.description.trim() !== ""
                    ? data.description
                    : undefined,
                demo_url: data.demo_url && data.demo_url.trim() !== ""
                    ? data.demo_url
                    : undefined,
            };

            const result = isEditing
                ? await updateProject(project.id, formattedData)
                : await addProject(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Project ${isEditing ? "updated" : "added"} successfully`,
                });
                onOpenChange(false);
                form.reset();
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Something went wrong",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(`Error ${isEditing ? "updating" : "adding"} project:`, error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Project" : "Add Project"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your project details" : "Add a new project to your profile"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="project_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Job Portal Application" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your project, technologies used, and key achievements..."
                                            rows={5}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="demo_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Demo URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_current"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Currently working on this project</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
