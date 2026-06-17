"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const MdxEditor = dynamic(
    () => import("@/components/employer/MdxEditor").then((m) => m.MdxEditor),
    { ssr: false, loading: () => <div className="border rounded-md h-48 bg-muted animate-pulse" /> }
);

interface FormData {
    job_title: string; location: string; industry: string; job_type: string;
    description: string; deadline: string; salary_min: string; salary_max: string;
    salary_currency: string; experience_level: string; positions_available: string;
    validity_days: string; advertisement_link: string;
}

const JOB_TYPES = [
    { value: "full_time", label: "Full Time" }, { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" }, { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

export function MisJobEditClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [form, setForm] = useState<FormData>({
        job_title: "", location: "", industry: "", job_type: "full_time",
        description: "", deadline: "", salary_min: "", salary_max: "",
        salary_currency: "LKR", experience_level: "", positions_available: "1",
        validity_days: "30", advertisement_link: "",
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`/api/mis/jobs/${jobId}`)
            .then((r) => r.json())
            .then(({ job }) => {
                if (job) {
                    setForm({
                        job_title: job.job_title ?? "",
                        location: job.location ?? "",
                        industry: job.industry ?? "",
                        job_type: job.job_type ?? "full_time",
                        description: job.description ?? "",
                        deadline: job.deadline ? job.deadline.split("T")[0] : "",
                        salary_min: job.salary_min?.toString() ?? "",
                        salary_max: job.salary_max?.toString() ?? "",
                        salary_currency: job.salary_currency ?? "LKR",
                        experience_level: job.experience_level ?? "",
                        positions_available: job.positions_available?.toString() ?? "1",
                        validity_days: job.validity_days?.toString() ?? "30",
                        advertisement_link: job.advertisement_link ?? "",
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [jobId]);

    function set(field: keyof FormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.job_title.trim()) { toast.error("Job title is required"); return; }
        setSubmitting(true);
        try {
            const payload = {
                job_title: form.job_title,
                location: form.location || null,
                industry: form.industry || null,
                job_type: form.job_type,
                description: form.description || null,
                deadline: form.deadline || null,
                salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
                salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
                salary_currency: form.salary_currency,
                experience_level: form.experience_level || null,
                positions_available: parseInt(form.positions_available) || 1,
                validity_days: parseInt(form.validity_days) || 30,
                advertisement_link: form.advertisement_link || null,
            };
            const res = await fetch(`/api/mis/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Failed to save"); return; }
            toast.success("Job updated");
            router.push(`/mis/jobs/${jobId}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/mis/jobs/${jobId}`)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h1 className="text-xl font-bold">Edit Job (Admin)</h1>
            </div>

            <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Job Title *</Label>
                        <Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
                        <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => set("industry", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Job Type</Label>
                            <Select value={form.job_type} onValueChange={(v) => set("job_type", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>Experience Level</Label><Input value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Positions Available</Label><Input type="number" min="1" value={form.positions_available} onChange={(e) => set("positions_available", e.target.value)} /></div>
                        <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Salary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                        <Label>Currency</Label>
                        <Select value={form.salary_currency} onValueChange={(v) => set("salary_currency", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {["LKR", "USD", "EUR", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div><Label>Min</Label><Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} /></div>
                    <div><Label>Max</Label><Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                <CardContent>
                    <MdxEditor value={form.description} onChange={(v) => set("description", v)} placeholder="Job description..." className="min-h-[250px]" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Ad Settings</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Validity Days</Label>
                        <Select value={form.validity_days} onValueChange={(v) => set("validity_days", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="60">60 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div><Label>External Link</Label><Input value={form.advertisement_link} onChange={(e) => set("advertisement_link", e.target.value)} placeholder="https://..." /></div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-8">
                <Button type="button" variant="outline" onClick={() => router.push(`/mis/jobs/${jobId}`)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
