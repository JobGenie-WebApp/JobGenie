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
import { awardSchema, type AwardFormData } from "@/lib/validations/profile";
import { addAward, updateAward } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { Award } from "@/types/profile-types";

interface AwardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    award?: Award | null;
}

export function AwardDialog({ open, onOpenChange, award }: AwardDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!award;

    const form = useForm<AwardFormData>({
        resolver: zodResolver(awardSchema),
        defaultValues: {
            nature_of_award: "",
            offered_by: "",
            description: "",
        },
    });

    // Reset form when dialog opens with award data
    useEffect(() => {
        if (open && award) {
            form.reset({
                nature_of_award: award.nature_of_award || "",
                offered_by: award.offered_by || "",
                description: award.description || "",
            });
        } else if (open && !award) {
            form.reset({
                nature_of_award: "",
                offered_by: "",
                description: "",
            });
        }
    }, [open, award, form]);

    async function onSubmit(data: AwardFormData) {
        setIsSubmitting(true);
        try {
            // Clean up optional fields - convert empty strings to undefined
            const formattedData = {
                ...data,
                offered_by: data.offered_by && data.offered_by.trim() !== ""
                    ? data.offered_by
                    : undefined,
                description: data.description && data.description.trim() !== ""
                    ? data.description
                    : undefined,
            };

            const result = isEditing
                ? await updateAward(award.id, formattedData)
                : await addAward(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Award ${isEditing ? "updated" : "added"} successfully`,
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
            console.error(`Error ${isEditing ? "updating" : "adding"} award:`, error);
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
                    <DialogTitle>{isEditing ? "Edit Award" : "Add Award"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your award details" : "Add a new award to your profile"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nature_of_award"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Award Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Employee of the Year" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="offered_by"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Offered By</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Company Name or Organization" {...field} />
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
                                            placeholder="Add details about this award and why you received it..."
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
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
