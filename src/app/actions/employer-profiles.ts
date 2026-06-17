"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmployerProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    department: string | null;
    designation: string | null;
    address: string;
    profile_completed: boolean;
}

export interface CompanyProfile {
    id: string;
    company_name: string;
    business_registration_no: string;
    industry: string;
    bio: string | null;
    description: string | null;
    company_size: string | null;
    website: string | null;
    headoffice_location: string | null;
    business_registered_address: string;
    phone: string;
    logo_url: string | null;
    approval_status: string;
    profile_completed: boolean;
    specialities: string[];
    map_link: string | null;
}

/**
 * Get employer's personal profile
 * Optimized: Single query with specific fields
 */
export async function getEmployerProfile(userId: string): Promise<EmployerProfile | null> {
    try {
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("employers")
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone,
                job_title,
                department,
                designation,
                address,
                profile_completed
            `)
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error("Error fetching employer profile:", error);
            return null;
        }

        return data as EmployerProfile;
    } catch (error) {
        console.error("Error in getEmployerProfile:", error);
        return null;
    }
}

/**
 * Get company profile for employer's company
 * Optimized: Single query with specific fields
 */
export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
    try {
        const adminClient = createAdminClient();

        // First get employer's company_id
        const { data: employerData, error: employerError } = await adminClient
            .from("employers")
            .select("company_id")
            .eq("user_id", userId)
            .single();

        if (employerError || !employerData) {
            console.error("Error fetching employer:", employerError);
            return null;
        }

        // Then get company details
        const { data: companyData, error: companyError } = await adminClient
            .from("companies")
            .select(`
                id,
                company_name,
                business_registration_no,
                industry,
                bio,
                description,
                company_size,
                website,
                headoffice_location,
                business_registered_address,
                phone,
                logo_url,
                approval_status,
                profile_completed,
                specialities,
                map_link
            `)
            .eq("id", employerData.company_id)
            .single();

        if (companyError) {
            console.error("Error fetching company:", companyError);
            return null;
        }

        return companyData as CompanyProfile;
    } catch (error) {
        console.error("Error in getCompanyProfile:", error);
        return null;
    }
}

/**
 * Get both employer and company profiles in a single optimized query
 * Most efficient for pages that need both
 */
export async function getEmployerAndCompanyProfiles(userId: string): Promise<{
    employer: EmployerProfile | null;
    company: CompanyProfile | null;
} | null> {
    try {
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("employers")
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone,
                job_title,
                department,
                designation,
                address,
                profile_completed,
                companies!inner (
                    id,
                    company_name,
                    business_registration_no,
                    industry,
                    bio,
                    description,
                    company_size,
                    website,
                    headoffice_location,
                    business_registered_address,
                    phone,
                    logo_url,
                    approval_status,
                    profile_completed,
                    specialities,
                    map_link
                )
            `)
            .eq("user_id", userId)
            .single();

        if (error || !data) {
            console.error("Error fetching profiles:", error);
            return null;
        }

        const company = (data as Record<string, unknown>).companies;

        return {
            employer: {
                id: data.id,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                job_title: data.job_title,
                department: data.department,
                designation: data.designation,
                address: data.address,
                profile_completed: data.profile_completed,
            } as EmployerProfile,
            company: company as CompanyProfile,
        };
    } catch (error) {
        console.error("Error in getEmployerAndCompanyProfiles:", error);
        return null;
    }
}
