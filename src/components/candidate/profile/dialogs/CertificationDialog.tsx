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
import { certificationSchema, type CertificationFormData } from "@/lib/validations/profile";
import { addCertification, updateCertification } from "@/app/actions/profile-mutations";
import { useToast } from "@/hooks/use-toast";
import { Certificate } from "@/types/profile-types";

interface CertificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    certification?: Certificate | null;
}

export function CertificationDialog({ open, onOpenChange, certification }: CertificationDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!certification;

    const form = useForm<CertificationFormData>({
        resolver: zodResolver(certificationSchema),
        defaultValues: {
            certificate_name: "",
            issuing_authority: "",
            issue_date: "",
            expiry_date: "",
            credential_id: "",
            credential_url: "",
            description: "",
        },
    });

    // Helper to convert date from YYYY-MM-DD to YYYY-MM for month input
    const formatDateForMonthInput = (dateString: string | null) => {
        if (!dateString) return "";
        const parts = dateString.split("-");
        return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : dateString;
    };

    // Reset form when dialog opens with certification data
    useEffect(() => {
        if (open && certification) {
            form.reset({
                certificate_name: certification.certificate_name || "",
                issuing_authority: certification.issuing_authority || "",
                issue_date: formatDateForMonthInput(certification.issue_date),
                expiry_date: formatDateForMonthInput(certification.expiry_date),
                credential_id: certification.credential_id || "",
                credential_url: certification.credential_url || "",
                description: certification.description || "",
            });
        } else if (open && !certification) {
            form.reset({
                certificate_name: "",
                issuing_authority: "",
                issue_date: "",
                expiry_date: "",
                credential_id: "",
                credential_url: "",
                description: "",
            });
        }
    }, [open, certification, form]);

    async function onSubmit(data: CertificationFormData) {
        setIsSubmitting(true);
        try {
            // Convert YYYY-MM dates to YYYY-MM-01 for PostgreSQL date type
            // Handle empty strings by converting to undefined
            const formattedData = {
                ...data,
                issue_date: data.issue_date && data.issue_date.trim() !== ""
                    ? `${data.issue_date}-01`
                    : undefined,
                expiry_date: data.expiry_date && data.expiry_date.trim() !== ""
                    ? `${data.expiry_date}-01`
                    : undefined,
                credential_id: data.credential_id && data.credential_id.trim() !== ""
                    ? data.credential_id
                    : undefined,
                credential_url: data.credential_url && data.credential_url.trim() !== ""
                    ? data.credential_url
                    : undefined,
                description: data.description && data.description.trim() !== ""
                    ? data.description
                    : undefined,
            };

            const result = isEditing
                ? await updateCertification(certification.id, formattedData)
                : await addCertification(formattedData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Certification ${isEditing ? "updated" : "added"} successfully`,
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
            console.error(`Error ${isEditing ? "updating" : "adding"} certification:`, error);
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
                    <DialogTitle>{isEditing ? "Edit Certification" : "Add Certification"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update your certification details" : "Add a new certification to your profile"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="certificate_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Certificate Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="issuing_authority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Issuing Authority *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Amazon Web Services" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="issue_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Issue Date</FormLabel>
                                        <FormControl>
                                            <Input type="month" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expiry_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expiry Date</FormLabel>
                                        <FormControl>
                                            <Input type="month" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="credential_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Credential ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. ABC123456" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="credential_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Credential URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://example.com/verify"
                                            {...field}
                                        />
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
                                            placeholder="Add any relevant details about this certification..."
                                            rows={3}
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
