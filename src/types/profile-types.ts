// Type definitions for candidate profile data

export interface WorkExperience {
    id: string;
    job_title: string | null;
    company: string | null;
    employment_type: string | null;
    location: string | null;
    location_type: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    is_current: boolean | null;
}

export interface Education {
    id: string;
    education_type: string;
    degree_diploma: string | null;
    professional_qualification: string | null;
    institution: string | null;
    status: string;
}

export interface Award {
    id: string;
    nature_of_award: string | null;
    offered_by: string | null;
    description: string | null;
}

export interface Project {
    id: string;
    project_name: string | null;
    description: string | null;
    demo_url: string | null;
    is_current: boolean;
}

export interface Certificate {
    id: string;
    certificate_name: string | null;
    issuing_authority: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    credential_id: string | null;
    credential_url: string | null;
    description: string | null;
}

export interface FinanceAcademicEducation {
    id: string;
    degree_diploma: string;
    institution: string;
    status: string;
}

export interface FinanceProfessionalEducation {
    id: string;
    professional_qualification: string;
    institution: string;
    status: string;
}

export interface BankingAcademicEducation {
    id: string;
    degree_diploma: string;
    institution: string;
    status: string;
}

export interface BankingProfessionalEducation {
    id: string;
    professional_qualification: string;
    institution: string;
    status: string;
}

export interface BankingSpecializedTraining {
    id: string;
    certificate_name: string;
    issuing_authority: string;
    certificate_issue_month: string | null;
    status: string;
}

export interface IndustrySpecialization {
    id: string;
    industry: string;
    specialization: string;
    description: string | null;
    years_experience: number | null;
}

export interface CandidateProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    alternative_phone: string | null;
    contact_no: string;
    address: string;
    country: string | null;
    nicPassport: string;
    dob: string;
    gender: string;
    industry: string;
    current_position: string;
    years_of_experience: number | null;
    experience_level: string | null;
    qualifications: string[];
    highest_qualification: string | null;
    expected_monthly_salary: number | null;
    availability_status: string | null;
    notice_period: string | null;
    employment_type: string | null;
    professional_summary: string | null;
    profile_image_url: string | null;
    membership_no: string | null;
    approval_status: string;
    resume_url: string | null;
    expected_positions: string[];

    // Relations
    work_experiences: WorkExperience[];
    educations: Education[];
    awards: Award[];
    projects: Project[];
    certificates: Certificate[];
    finance_academic_education: FinanceAcademicEducation[];
    finance_professional_education: FinanceProfessionalEducation[];
    banking_academic_education: BankingAcademicEducation[];
    banking_professional_education: BankingProfessionalEducation[];
    banking_specialized_training: BankingSpecializedTraining[];
    industry_specializations: IndustrySpecialization[];
}

export interface ProfileApiResponse {
    success: boolean;
    data?: CandidateProfile;
    error?: string;
}
