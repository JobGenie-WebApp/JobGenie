export interface MisInterviewStatusInput {
    pipeline_status?: string | null;
    invitation_canceled?: boolean;
    mis_rescheduled?: boolean;
    interview_confirmed?: boolean;
}

const PIPELINE_LABELS: Record<string, string> = {
    hired: "Hired",
    offered: "Offer Sent",
    rejected: "Rejected",
    withdrawn: "Offer Declined",
    expired: "Expired",
};

export function getMisInterviewStage(interview: MisInterviewStatusInput) {
    const pipelineLabel = interview.pipeline_status ? PIPELINE_LABELS[interview.pipeline_status] : undefined;
    if (pipelineLabel) return { key: interview.pipeline_status!, label: pipelineLabel };
    if (interview.mis_rescheduled) return { key: "rescheduled", label: "Rescheduled" };
    if (interview.invitation_canceled) return { key: "cancelled", label: "Cancelled" };
    if (interview.interview_confirmed) return { key: "confirmed", label: "Confirmed" };
    return { key: "pending", label: "Pending" };
}
