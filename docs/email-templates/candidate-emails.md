# JobGenie Candidate Email Templates

This file is the copy deck for emails sent to candidates. Keep placeholders in `{{double_braces}}` unchanged when editing.

Standard sign-off for every template:

> Need help? Contact us at support@jobgenie.biz.  
> This is an automated message from JobGenie. Please do not reply.

## 1. Email verification

**Subject:** Verify your JobGenie email address

Hi {{first_name}},

Thank you for creating your JobGenie account. Enter the verification code below to confirm your email address:

**{{verification_code}}**

This code expires in 10 minutes. For your security, do not share it with anyone.

If you did not create a JobGenie account, you can safely ignore this email.

## 2. Candidate profile approved

**Subject:** Your JobGenie profile has been approved

Hi {{first_name}},

Your JobGenie profile has been reviewed and approved. You now have full access to browse opportunities, submit applications, and manage your recruitment activity.

**CTA:** Sign in to JobGenie — {{login_url}}

We wish you every success in your job search.

## 3. Candidate profile requires updates

**Subject:** Action required: Update your JobGenie profile

Hi {{first_name}},

Thank you for submitting your JobGenie profile. Before we can approve it, a few details need to be updated.

**Feedback from the JobGenie review team**  
{{rejection_reason}}

Please update your profile using the feedback above. Once you resubmit it, our team will review it again.

**CTA:** Update your profile — {{login_url}}

## 4. Password reset

**Subject:** Reset your JobGenie password

Hi {{first_name}},

We received a request to reset the password for your JobGenie account.

**CTA:** Reset password — {{reset_url}}

This link expires in one hour and can be used only once. If you did not request a password reset, no action is required and your account remains secure.

## 5. Application submitted

**Subject:** Application submitted: {{job_title}}

Hi {{candidate_name}},

Your application for **{{job_title}}** at **{{company_name}}** has been submitted successfully.

We will notify you when there is an update from the employer. You can track the status of this and your other applications from your JobGenie account.

**CTA:** View your applications — {{applications_url}}

## 6. Application status update

**Subject:** Update on your application for {{job_title}}

Hi {{candidate_name}},

Thank you for your interest in the **{{job_title}}** position at **{{company_name}}**. After reviewing your application, the employer has decided not to progress it further at this time.

**Note from the employer (when provided)**  
{{reason}}

We appreciate the time you invested in applying and encourage you to explore other opportunities that match your experience.

**CTA:** Browse available jobs — {{jobs_url}}

## 7. Interview or assessment invitation

**Interview subject:** Interview invitation from {{company_name}}

**Assessment subject:** Assessment invitation from {{company_name}}

Hi {{candidate_name}},

{{company_name}} would like to invite you to the next stage of the selection process for the **{{job_designation}}** position.

### Interview details

Please review the proposed time slots below and select the option that works best for you:

{{time_slots}}

### Assessment details

- Delivery method: {{delivery_mode}}
- Start: {{start_at}}
- End: {{end_at}}
- Submission deadline: {{deadline}}
- Assessment link: {{assessment_link}}
- Attachment: {{attachment_name}}
- Venue: {{address}}
- Map: {{map_link}}

Only the relevant section and available fields should be shown.

**CTA:** Review invitation — {{invitation_url}}

## 8. Interview confirmed

**Subject:** Interview confirmed with {{company_name}}

Hi {{candidate_name}},

Your interview with **{{company_name}}** for the **{{job_designation}}** position has been confirmed.

- Date: {{interview_date}}
- Time: {{interview_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}

Please add the interview to your calendar, join or arrive a few minutes early, and prepare any questions you would like to ask.

**CTA:** View interview details — {{invitation_url}}

## 9. Interview reminder

**Subject:** Reminder: Interview with {{company_name}}

Hi {{candidate_name}},

This is a reminder that your interview with **{{company_name}}** for the **{{job_designation}}** position begins in approximately **{{offset_label}}**.

- Round: {{round_label}}
- Date: {{interview_date}}
- Time: {{interview_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}

**CTA:** View interview details — {{invitation_url}}

## 10. Interview canceled by employer

**Subject:** Interview canceled: {{job_designation}} at {{company_name}}

Hi {{candidate_name}},

We are writing to let you know that **{{company_name}}** has canceled the interview scheduled for the **{{job_designation}}** position.

- Date: {{interview_date}}
- Time: {{interview_time}}
- Reason: {{cancellation_reason}}

We understand that schedule changes can be disappointing. If a new interview is arranged, you will receive another notification.

**CTA:** View your invitations — {{invitations_url}}

## 11. Interview rescheduled by JobGenie

**Subject:** Interview rescheduled: {{company_name}}

Hi {{candidate_name}},

Your interview with **{{company_name}}** for the **{{job_designation}}** position has been rescheduled by the JobGenie team.

- New date: {{new_date}}
- New time: {{new_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}
- Additional notes: {{notes}}

Please review the updated schedule and plan accordingly.

**CTA:** View updated details — {{invitation_url}}

## 12. Interview round canceled by employer

**Subject:** {{round_label}} canceled: {{job_designation}} at {{company_name}}

Hi {{candidate_name}},

We are writing to let you know that **{{company_name}}** has canceled the **{{round_label}}** for the **{{job_designation}}** position.

- Date: {{interview_date}}
- Time: {{interview_time}}
- Reason: {{cancellation_reason}}

If a replacement round is arranged, you will receive a new notification.

**CTA:** View your invitations — {{invitations_url}}

## 13. Interview round rescheduled by JobGenie

**Subject:** {{round_label}} rescheduled: {{company_name}}

Hi {{candidate_name}},

The **{{round_label}}** with **{{company_name}}** for the **{{job_designation}}** position has been rescheduled by the JobGenie team.

- New date: {{new_date}}
- New time: {{new_time}}
- Format: {{interview_mode}}
- Meeting link or venue: {{meeting_link_or_address}}
- Additional notes: {{notes}}

Please review the updated details and prepare accordingly.

**CTA:** View updated details — {{invitation_url}}
