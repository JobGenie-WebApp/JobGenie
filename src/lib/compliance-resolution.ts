/** Reopen a rejected resubmission so the employer can upload another document. */
export function reopenComplianceFlag(notes: string) {
    return {
        status: "paused" as const,
        employer_doc_url: null,
        employer_doc_path: null,
        employer_doc_name: null,
        employer_doc_type: null,
        employer_note: null,
        resubmitted_at: null,
        resolved_by_mis_user_id: null,
        resolved_at: null,
        resolution_notes: notes,
    };
}
