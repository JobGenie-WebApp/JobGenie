"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface JobOfferDialogProps {
    roundId: string;
    candidateName: string;
    jobTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function JobOfferDialog({
    roundId,
    candidateName,
    jobTitle,
    isOpen,
    onClose,
    onSuccess
}: JobOfferDialogProps) {
    const [formData, setFormData] = useState({
        job_title: jobTitle,
        salary_amount: "",
        salary_currency: "LKR",
        salary_period: "monthly",
        start_date: "",
        expiry_date: "",
        offer_letter_url: "",
        description: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.job_title.trim()) {
            toast.error("Job title is required");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/employer/interview-rounds/${roundId}/offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_title: formData.job_title,
                    salary_amount: formData.salary_amount ? parseFloat(formData.salary_amount) : null,
                    salary_currency: formData.salary_currency,
                    salary_period: formData.salary_period,
                    start_date: formData.start_date || null,
                    expiry_date: formData.expiry_date || null,
                    offer_letter_url: formData.offer_letter_url.trim() || null,
                    description: formData.description.trim() || null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Job offer created successfully!");
                onSuccess();
                handleClose();
            } else {
                toast.error(data.error || "Failed to create job offer");
            }
        } catch (error) {
            console.error("Error creating job offer:", error);
            toast.error("An error occurred while creating job offer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            job_title: jobTitle,
            salary_amount: "",
            salary_currency: "LKR",
            salary_period: "monthly",
            start_date: "",
            expiry_date: "",
            offer_letter_url: "",
            description: ""
        });
        onClose();
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Job Offer</DialogTitle>
                    <DialogDescription>
                        Create a formal job offer for {candidateName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Job Title */}
                    <div className="space-y-2">
                        <Label htmlFor="job_title">Job Title *</Label>
                        <Input
                            id="job_title"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="e.g., Senior Software Engineer"
                            disabled={submitting}
                        />
                    </div>

                    {/* Salary Information */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3 sm:col-span-1 space-y-2">
                            <Label htmlFor="salary_amount">Salary Amount</Label>
                            <Input
                                id="salary_amount"
                                type="number"
                                value={formData.salary_amount}
                                onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value })}
                                placeholder="100000"
                                disabled={submitting}
                            />
                        </div>
                        <div className="col-span-3 sm:col-span-1 space-y-2">
                            <Label htmlFor="salary_currency">Currency</Label>
                            <Select
                                value={formData.salary_currency}
                                onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
                                disabled={submitting}
                            >
                                <SelectTrigger id="salary_currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LKR">LKR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 sm:col-span-1 space-y-2">
                            <Label htmlFor="salary_period">Period</Label>
                            <Select
                                value={formData.salary_period}
                                onValueChange={(value) => setFormData({ ...formData, salary_period: value })}
                                disabled={submitting}
                            >
                                <SelectTrigger id="salary_period">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="annual">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Proposed Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                min={today}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Offer Expiry Date</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                min={today}
                                disabled={submitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Deadline for candidate to accept
                            </p>
                        </div>
                    </div>

                    {/* Offer Letter URL */}
                    <div className="space-y-2">
                        <Label htmlFor="offer_letter_url">Offer Letter URL</Label>
                        <Input
                            id="offer_letter_url"
                            type="url"
                            value={formData.offer_letter_url}
                            onChange={(e) => setFormData({ ...formData, offer_letter_url: e.target.value })}
                            placeholder="https://drive.google.com/..."
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            Link to the formal offer letter document
                        </p>
                    </div>

                    {/* Description / Benefits */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Additional Details / Benefits</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Include benefits, perks, terms and conditions..."
                            rows={5}
                            maxLength={2000}
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {formData.description.length}/2000 characters
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                            The candidate will be notified about this job offer and can accept or decline it through their dashboard.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !formData.job_title.trim()}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Briefcase className="h-4 w-4 mr-2" />
                                Create Job Offer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
