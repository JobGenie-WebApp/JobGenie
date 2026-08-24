# JobGenie Company Email Templates

This file is the copy deck for emails sent to company administrators and employers. Keep placeholders in `{{double_braces}}` unchanged when editing.

Standard sign-off for every template:

> Need help? Contact us at support@jobgenie.biz.  
> This is an automated message from JobGenie. Please do not reply.

## 1. Email verification

**Subject:** Verify your JobGenie employer email address

Hi {{first_name}},

Thank you for creating a JobGenie employer account. Enter the verification code below to confirm your email address:

**{{verification_code}}**

This code expires in 10 minutes. For your security, do not share it with anyone.

If you did not create this account, you can safely ignore this email.

## 2. Employer team invitation

**Subject:** You have been invited to a JobGenie employer account

Hi {{first_name}},

You have been invited to join your company's JobGenie employer account as an administrator.

Use the temporary password below when opening the secure setup link. You will then be asked to create a new password.

**Temporary password:** {{temporary_password}}

**CTA:** Accept invitation — {{setup_url}}

This invitation expires in {{expiry_days}} days. If you were not expecting it, please contact your company administrator or JobGenie Support.

## 3. Company profile approved

**Subject:** {{company_name}} has been approved on JobGenie

Hi {{first_name}},

The company profile for **{{company_name}}** has been reviewed and approved.

Your team can now publish job advertisements, review applications, manage interviews, and administer recruitment access.

**CTA:** Open employer dashboard — {{login_url}}

We look forward to supporting your recruitment goals.

## 4. Company profile requires updates

**Subject:** Action required: Update the {{company_name}} profile

Hi {{first_name}},

We reviewed the company profile for **{{company_name}}**. Before it can be approved, a few details need to be updated.

**Feedback from the JobGenie review team**  
{{rejection_reason}}

Please update the company profile using the feedback above. Once it is resubmitted, our team will review it again.

**CTA:** Update company profile — {{login_url}}

## 5. Password reset

**Subject:** Reset your JobGenie password

Hi {{first_name}},

We received a request to reset the password for your JobGenie account.

**CTA:** Reset password — {{reset_url}}

This link expires in one hour and can be used only once. If you did not request a password reset, no action is required and your account remains secure.

## 6. Job advertisement published

**Subject:** Your job advertisement is live: {{job_title}}

Hi {{first_name}},

Your payment has been verified, and the advertisement for **{{job_title}}** is now live and visible to candidates.

The advertisement will remain active until **{{expiry_date}}**. You can extend it from the employer dashboard before it expires.

**CTA:** View job advertisement — {{job_url}}

## 7. Job advertisement payment rejected

**Subject:** Action required: Payment proof for {{job_title}}

Hi {{first_name}},

We could not approve the payment proof submitted for the **{{job_title}}** advertisement.

**Reason (when provided)**  
{{reason}}

Please open the Payments section in the Employer Portal and upload a clear, valid payment proof. The advertisement can be published once the payment is verified.

**CTA:** Review payment — {{payments_url}}

## 8. Job advertisement expired

**Subject:** Your job advertisement has expired: {{job_title}}

Hi {{first_name}},

The advertisement for **{{job_title}}** has expired and is no longer visible to candidates.

If you would like to continue receiving applications, extend the advertisement from your employer dashboard.

**CTA:** Extend advertisement — {{extend_url}}

## 9. New application received

**Subject:** New application for {{job_title}}: {{candidate_name}}

Hi {{employer_name}},

**{{candidate_name}}** has applied for the **{{job_title}}** position.

Review the candidate's application and profile from your employer dashboard.

**CTA:** Review application — {{application_url}}

## 10. Interview canceled by candidate

**Subject:** Interview canceled by {{candidate_name}}: {{job_designation}}

Hi {{employer_name}},

**{{candidate_name}}** has canceled the interview scheduled for the **{{job_designation}}** position.

- Date: {{interview_date}}
- Time: {{interview_time}}
- Reason: {{cancellation_reason}}

If appropriate, you can review the invitation and coordinate the next step with the JobGenie team.

**CTA:** View invitations — {{invitations_url}}

## 11. Interview rescheduled by JobGenie

**Subject:** Interview rescheduled with {{candidate_name}}

Hi {{employer_name}},

The interview with **{{candidate_name}}** for the **{{job_designation}}** position has been rescheduled by the JobGenie team.

- New date: {{new_date}}
- New time: {{new_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}
- Additional notes: {{notes}}

The candidate has also been notified of the updated schedule.

**CTA:** View updated details — {{invitation_url}}

## 12. Interview round canceled by candidate

**Subject:** {{round_label}} canceled by {{candidate_name}}

Hi {{employer_name}},

**{{candidate_name}}** has canceled the **{{round_label}}** for the **{{job_designation}}** position.

- Date: {{interview_date}}
- Time: {{interview_time}}
- Reason: {{cancellation_reason}}

If appropriate, you can review the invitation and coordinate the next step with the JobGenie team.

**CTA:** View invitations — {{invitations_url}}

## 13. Interview round rescheduled by JobGenie

**Subject:** {{round_label}} rescheduled with {{candidate_name}}

Hi {{employer_name}},

The **{{round_label}}** with **{{candidate_name}}** for the **{{job_designation}}** position has been rescheduled by the JobGenie team.

- New date: {{new_date}}
- New time: {{new_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}
- Additional notes: {{notes}}

The candidate has also been notified of the updated schedule.

**CTA:** View updated details — {{invitation_url}}
