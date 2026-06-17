import { z } from "zod";

export const jobCreateSchema = z.object({
    job_title: z.string().min(3).max(200),
    location: z.string().max(200).optional().nullable(),
    industry: z.string().max(100).optional().nullable(),
    job_type: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).default("full_time"),
    description: z.string().optional().nullable(), // MDX content
    deadline: z.string().optional().nullable(), // ISO date string YYYY-MM-DD
    salary_min: z.number().positive().optional().nullable(),
    salary_max: z.number().positive().optional().nullable(),
    salary_currency: z.string().max(10).default("LKR"),
    experience_level: z.string().max(50).optional().nullable(),
    positions_available: z.number().int().min(1).default(1),
    validity_days: z.number().int().min(1).default(30),
    custom_start_date: z.string().optional().nullable(), // ISO date YYYY-MM-DD
    custom_end_date: z.string().optional().nullable(),   // ISO date YYYY-MM-DD
    advertisement_link: z.union([z.string().url().max(500), z.literal(""), z.null()]).optional().nullable().transform(v => v === "" ? null : v),
});

export const jobUpdateSchema = jobCreateSchema.partial();

export const jobApplySchema = z.object({
    cover_letter: z.string().max(5000).optional().nullable(),
    resume_url: z.string().url().max(500).optional().nullable(),
});

export const applicationStatusUpdateSchema = z.object({
    status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired", "withdrawn"]),
    notes: z.string().max(2000).optional().nullable(),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>;
export type JobApplyInput = z.infer<typeof jobApplySchema>;
export type ApplicationStatusUpdateInput = z.infer<typeof applicationStatusUpdateSchema>;
