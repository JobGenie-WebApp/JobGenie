# JobGenie System Questions and Answers

This document answers the content, structure, process, and technical questions raised for the JobGenie platform. It is written for sharing with stakeholders who need a clear understanding of how the system works and what content is required.

## 1. Website Structure

### 1.1 A breakdown of an ideal word count for each page for messaging priority purposes

The site should keep public pages clear and concise, while portal pages should use shorter functional copy because users are already logged in and trying to complete tasks.

| Page or area | Recommended word count | Messaging priority |
| --- | ---: | --- |
| Homepage hero | 40 to 70 words | Explain the core value quickly: verified candidates, trusted employers, transparent hiring. Primary CTAs should appear immediately. |
| Homepage features section | 250 to 450 words | Explain the main platform benefits: matching, pipeline management, verification, analytics, and auditability. |
| How it works section | 250 to 400 words | Give a simple step-by-step journey for candidates and employers. |
| Portal selector or sign-up choice area | 80 to 150 words | Help users choose Candidate or Employer without confusion. |
| Contact section | 80 to 150 words | Explain how to reach JobGenie and what information to include in an inquiry. |
| Footer | 40 to 80 words plus link labels | Keep footer copy functional: brand summary, product links, company links, resources, legal links, and status. |
| Universal login page | 60 to 120 words | Reassure returning users and show clear paths for candidate signup, employer signup, password reset, and MIS login where relevant. |
| Candidate signup page | 120 to 220 words | Explain that signup is free, email verification is required, and profile approval may be required before full access. |
| Employer signup page | 180 to 300 words | Explain company verification, BR certificate upload, admin profile setup, and MIS approval. |
| Verification email page | 60 to 100 words | Tell the user to check their email, enter the 6-digit code, and resend if needed. |
| Candidate dashboard | 80 to 160 words | Keep copy short: application pulse, recommended jobs, interviews, profile strength, invitations. |
| Candidate job board | 60 to 120 words | Focus on job discovery, filters, and applying. Job cards should carry most of the detail. |
| Candidate job detail page | 300 to 700 words per job | Depends on employer-supplied job description. Include role overview, responsibilities, requirements, salary, location, and company info. |
| Candidate applications page | 80 to 150 words | Explain application statuses and allow quick tracking. |
| Candidate invitations page | 120 to 220 words | Explain interview invitations, time slot selection, confirmation, rescheduling, and offers. |
| Candidate profile page | Field-driven | Use short labels and helper text. Profile summary can be up to 1,000 characters. |
| Employer dashboard | 80 to 160 words | Summarize active jobs, applications, shortlisted candidates, payments, and recent activity. |
| Employer job posting form | 150 to 300 words of helper copy | The form is functional; most content is the employer's job ad. |
| Employer candidate search page | 100 to 180 words | Explain how to search by industry and designation, then refine by salary, experience, and qualification. |
| Employer invitations/interviews pages | 120 to 250 words | Explain interview stages, confirmation, feedback, cancellation, rescheduling, and offers. |
| Employer payments page | 100 to 180 words | Explain payment requests, proof upload, review status, and rejected payment actions. |
| MIS dashboard | 80 to 150 words | Explain administrative oversight: users, roles, approvals, jobs, interviews, payments, reports, audit logs, and master data. |
| Reports and analytics | 150 to 300 words | Explain filters, date periods, export/report intent, and KPI definitions. |
| Help page | 800 to 1,500 words | Cover both candidate and employer workflows with FAQ-style sections. |
| FAQ page | 1,000 to 2,000 words | Use grouped questions for candidates, employers, verification, payments, interviews, privacy, and support. |
| Terms and Conditions | 2,000 to 4,000 words | Legal content should be reviewed by counsel. |
| Privacy Policy | 2,000 to 4,000 words | Must explain personal data collected, purpose, retention, sharing, user rights, and contact details. |

### 1.2 Explain how separate portals for job seekers and employers work on the site

JobGenie has separate role-based portals for Candidates, Employers, and MIS administrators. A universal login page is used for candidates and employers, while MIS has its own administrator login.

**Candidate portal**

Candidates register through `/candidate/signup`, verify their email with a 6-digit code, complete their profile, and then access the candidate dashboard. The candidate portal includes Dashboard, Browse Jobs, Applications, Invitations, Calendar, My Profile, My Resumes, and Settings. Some areas require MIS approval before the candidate can use them fully. For example, Browse Jobs, Applications, Invitations, Calendar, and Settings can be restricted until approval, while Profile and Resumes remain accessible so the candidate can complete or improve their information.

**Employer portal**

Employers register through `/employer/signup`. The registration flow collects company details, business registration information, industry, business address, BR certificate, and employer admin profile details. After email verification and profile completion, the company must be approved by MIS before full hiring workflows are available. The employer portal includes Dashboard, Job Postings, Applications, Candidates, Invitations, Calendar, Payments, Company Profile, Company Admins, and Settings. If the company is pending approval, restricted pages are disabled or redirected with an approval-pending message.

**MIS portal**

MIS is the operational administration area. It has a separate login route at `/mis/login`. MIS users manage platform users, roles, permissions, candidate approvals, employer approvals, jobs, interviews, payments, reports, audit logs, and master data such as industries and job designations. MIS acts as the trust and governance layer for the system.

### 1.3 What are the available search filters?

The available filters depend on the user area.

**Candidate job search**

Candidates can browse published and unexpired jobs. The current UI supports:

- Job title search.
- Job type filter: Full Time, Part Time, Contract, Internship, Freelance.
- Pagination.

The candidate jobs API also supports additional filter parameters that can be exposed in the UI:

- Industry.
- Location.

Recommended future candidate filters:

- Salary range.
- Experience level.
- Location type: remote, hybrid, onsite.
- Company name.
- Recently posted.
- Closing soon.
- Saved jobs.

**Employer candidate search**

Employer candidate search is more structured. Employers must first select:

- Industry.
- Job designation, with multi-select support.

Optional filters include:

- Maximum expected salary in LKR.
- Experience level: Entry, Junior, Mid, Senior, Lead, Principal.
- Highest qualification: Doctorate/PhD, Masters, Post Graduate, Bachelors, Professional Certification, Undergraduate, Diploma, Certificate, Vocational Training, No Formal Education.

Candidate results show name, years of experience, level, qualification, employment type, availability, invitation status, and a View Details action.

**Employer job posting dashboard filters**

Employers can filter their own job postings by:

- Search term across job title, location, and industry.
- Job status: All, Draft, Published, Paused, Expired.
- Application status inside a selected job: All, Pending, Reviewed, Shortlisted, Rejected, Hired, Withdrawn.

**MIS filters**

MIS pages include administrative filters such as:

- Candidate approval status: Pending, Approved, Rejected.
- Employer/company search by company name or BR number.
- Employer/company approval status: Pending, Approved, Rejected.
- Job search and job status: Draft, Published, Paused, Expired, Deleted.
- Reports filters: candidates, employers, companies, jobs, applications, period/date range.
- Report table search by name, email, company, industry, role, or designation depending on the report.

### 1.4 Is the hiring QS applicable at the moment?

If "hiring QS" means a structured hiring questionnaire, qualification screening form, or scoring questionnaire, it is not currently implemented as a standalone module.

The current system already supports several screening inputs:

- Candidate profile fields.
- Industry and expected positions.
- Experience level.
- Qualifications.
- Expected salary.
- Resume uploads.
- Employer candidate search filters.
- Job applications with optional cover letter.
- Interview invitations, rounds, feedback, outcomes, and job offers.

Recommended approach:

- Add a hiring questionnaire as a future enhancement.
- Allow employers to attach screening questions to a job posting.
- Store answers with each job application.
- Allow MIS/employers to score or review responses.
- Keep the first version simple: 3 to 8 questions per job, using short text, yes/no, multiple choice, expected salary, availability date, and file attachment where needed.

### 1.5 What are the other content requirements of the site?

The current system needs content across public pages, portal screens, email notifications, empty states, validation states, legal pages, and help content.

Recommended content requirements:

- Public homepage copy: headline, subheadline, feature descriptions, how-it-works steps, trust/verification explanation, portal CTAs, contact copy.
- Candidate onboarding copy: signup helper text, verification instructions, profile completion guidance, approval-pending explanation, profile strength guidance.
- Employer onboarding copy: company registration guidance, BR certificate upload guidance, profile completion text, MIS approval-pending copy.
- Job posting guidance: placeholder text for job descriptions, examples for responsibilities/requirements, salary guidance, validity period explanation.
- Application copy: apply confirmation, duplicate application warning, withdrawn application confirmation, application status definitions.
- Invitation and interview copy: invitation sent, candidate accepted/declined, employer confirmation, reschedule, cancellation, interview reminder, offer sent, offer accepted/declined.
- Payment copy: payment request created, proof upload guidance, under review, approved, rejected with reason, job published after payment approval.
- MIS approval copy: approve/reject candidate, approve/reject company, rejection reason prompts, audit log labels.
- Legal copy: Terms and Conditions, Privacy Policy, Cookie Policy, data consent clause, acceptable use, employer responsibility, candidate responsibility.
- Help content: candidate guide, employer guide, verification guide, payments guide, interview guide, support contact.
- FAQ content: grouped FAQ for candidates, employers, MIS/admin, privacy, payments, technical issues.

### 1.6 Could you explain the items on the footer?

The current footer contains the JobGenie brand block, link columns, social icons, copyright, product version text, and system status.

**Brand block**

Includes the JobGenie name and a short brand description: the platform is positioned as a recruitment operating system for clarity, speed, and accountability.

**Product links**

- Features: jumps to the features section.
- How It Works: should explain the candidate and employer workflows.
- Pricing: should explain job ad pricing, employer plans, or platform fees.
- Enterprise: should be used for larger organizations that need custom setup, reporting, or support.
- Changelog: should list product updates when available.

**Company links**

- About: company story and mission.
- Blog: hiring insights and platform updates.
- Careers: JobGenie's own hiring page if needed.
- Press: media or brand information.
- Partners: partner or integration information.

**Resources links**

- Documentation: user guides or platform documentation.
- API Reference: only needed if external API access is offered.
- Status: platform uptime or service availability.
- Community: user/community resources if available.

**Legal links**

- Privacy Policy: explains data collection, usage, sharing, retention, and user rights.
- Terms of Service: explains acceptable use, platform rules, responsibilities, and limitations.
- Cookie Policy: explains tracking and cookies.
- GDPR: privacy rights information for users subject to GDPR-style regulations.

**Social links**

Current footer has Twitter/X, LinkedIn, and GitHub icons. These should link to active official profiles or be removed until profiles exist.

**Bottom bar**

Shows copyright, version text such as `TALENT OS v1.0`, and an operational status indicator.

### 1.7 Verification email content when users do not receive the code

The system sends a 6-digit verification code that expires in 15 minutes. The verification page should include clear support and resend guidance.

Recommended verification email content:

**Subject:** Verify Your Email - JobGenie

**Body:**

Hi [First Name],

Thank you for registering with JobGenie. Use the verification code below to complete your account setup:

**[6-digit code]**

This code expires in 15 minutes. If it expires, return to the verification page and request a new code.

If you did not create a JobGenie account, you can ignore this email.

Need help? Contact support at support@jobgenie.biz.

This is an automated message from JobGenie. Please do not reply to this email.

**Recommended page copy for users who do not receive the code:**

Did not receive the code?

- Check your spam or junk folder.
- Confirm that the email address is spelled correctly.
- Wait a minute in case your email provider is delayed.
- Use "Resend Code" to receive a new code. Resend is available after the cooldown.
- If the issue continues, contact JobGenie support with the email address used during registration.

### 1.8 Are "Sign In" and "Get Started" both required?

Yes, both are useful because they serve different user intents.

**Sign In** is for returning users who already have an account. It should go to the universal login page for candidates and employers. MIS administrators should use the separate MIS login page.

**Get Started** is for new users. It should lead to account creation. Because JobGenie has two public account types, the best implementation is either:

- Send Get Started to a portal choice section with Candidate and Employer options.
- Or send it directly to Candidate signup if candidates are the primary acquisition audience, while keeping "Register Company" or "Start as Employer" visible in the hero.

Current site behavior:

- Header has Sign In and Get Started.
- Hero has Start as Candidate and Start as Employer/Register Company.
- Login page also gives Candidate and Employer signup options.

This is a good structure. The only improvement is to make the Get Started path explicit if stakeholders want equal priority for employers and candidates.

### 1.9 What other information could be used for the Active Job Listings dashboard?

The employer job dashboard already shows job status, job details, application counts, payment state, and applications for the selected job. More useful information can be added:

- Total active published jobs.
- Draft jobs waiting for completion.
- Jobs waiting for payment.
- Jobs under payment review.
- Jobs expiring in 3, 7, and 14 days.
- Expired jobs eligible for extension.
- Applications per job.
- New applications in the last 7 days.
- Application status breakdown: pending, reviewed, shortlisted, rejected, hired, withdrawn.
- Conversion rate from applications to shortlisted.
- Conversion rate from shortlisted to hired.
- Average time from posting to first application.
- Average time from application to review.
- Top performing job ads by application volume.
- Low-performing job ads with low views/applications.
- Candidate source or application channel if tracked later.
- Payment proof status per job.
- Ad validity period and expiry date.
- Quick actions: edit draft, publish, pause, resume, extend, delete, view payment, view applications.
- Alerts: payment rejected, job expiring soon, missing description, no applications after X days.
- Export option for job and application data.

## 2. Process and Navigation

### 2.1 How does the application process work?

The application process has two related paths: direct job applications and employer-initiated interview invitations.

**Direct job application flow**

1. Candidate creates an account.
2. Candidate verifies email using the 6-digit code.
3. Candidate completes profile and uploads resume information.
4. MIS reviews the candidate profile.
5. Once approved, the candidate can browse jobs and apply.
6. Candidate opens a published, unexpired job ad.
7. Candidate clicks Apply Now.
8. Candidate may add an optional cover letter.
9. The system submits the application with status `pending`.
10. The system prevents duplicate applications for the same job.
11. Candidate receives a confirmation notification/email.
12. Employer receives a new application notification/email.
13. Candidate can track the application in My Applications.
14. Candidate may withdraw the application while it is still pending or reviewed.
15. Application statuses can move through pending, reviewed, shortlisted, rejected, hired, or withdrawn.

**Employer invitation flow**

1. Employer creates an account and verifies email.
2. Employer completes company and admin profile.
3. MIS approves the company.
4. Employer searches candidates by industry and job designation.
5. Employer opens a candidate profile and sends an invitation.
6. Invitation can include interview time slots and interview context.
7. Candidate receives the invitation.
8. Candidate accepts, declines, or responds to the proposed interview options.
9. Employer confirms the interview with online or physical interview details.
10. Interview rounds and feedback can be managed.
11. Employer can move the candidate through rounds and issue an offer.
12. Candidate can accept or decline the offer.
13. MIS can oversee interviews and reschedule where permitted.

### 2.2 Pages of copy required for the employer portal

The employer portal needs functional microcopy and guidance for the following pages:

| Employer page | Copy required |
| --- | --- |
| Employer signup | Explain company registration, BR certificate upload, admin profile setup, email verification, and approval review. |
| Verify email | Explain 6-digit code, expiry, resend, and support. |
| Complete profile | Explain why company and admin details are needed. |
| Dashboard | Short overview of active jobs, applications, approvals, payments, and recent activity. |
| Job Postings | Empty state, job status definitions, publish/payment guidance, edit/pause/resume/extend/delete confirmations. |
| New/Edit Job | Field labels, placeholders, job description guidance, ad validity explanation, salary helper text, external link guidance. |
| Job Detail | Status labels, application panel copy, payment prompts, expiry and extension prompts. |
| Applications | Application status definitions, review guidance, empty states. |
| Candidates | Search guidance explaining industry plus designation filters and optional filters. |
| Candidate Detail | Profile review labels, invitation CTA, hired/unavailable status messaging. |
| Invitations | Invitation status labels, time slot guidance, cancel/reschedule guidance, offer guidance. |
| Calendar | Interview status labels and event detail copy. |
| Payments | Payment request explanation, proof upload instructions, under-review state, rejected proof guidance. |
| Company Profile | Profile completion prompts, edit labels, verification status explanation. |
| Company Admins | Add admin invitation copy, temporary password/setup guidance, role explanation. |
| Settings | Account, team, hiring preferences, privacy, notification, security, and danger-zone copy. |

### 2.3 How do employers post jobs and review applications?

**Posting jobs**

1. Employer signs in and opens Job Postings.
2. Employer clicks New.
3. Employer selects an industry.
4. Employer selects or searches for a job title/designation. The job title list is tied to the selected industry.
5. Employer enters location and job type.
6. Employer selects experience level and number of positions.
7. Employer enters salary range and currency.
8. Employer writes the job description. Markdown/MDX-style formatting is supported by the editor/viewer.
9. Employer selects advertisement validity: 30 days, 60 days, 90 days, or custom date range.
10. Employer can add an external application link if required.
11. The system saves the job as a draft.
12. Employer requests payment to publish the job.
13. Employer uploads payment proof in the Payments area.
14. MIS reviews the payment.
15. After payment approval, the job can be published and visible to candidates until expiry.

**Reviewing applications**

1. Employer opens Job Postings.
2. Employer selects a job from the left panel.
3. The middle panel shows job details.
4. The right panel shows applications for that job.
5. Employer can filter applications by status: all, pending, reviewed, shortlisted, rejected, hired, withdrawn.
6. Employer can see candidate name, current position, years of experience, application date, and status.
7. The current system displays applications to employers from the job detail panel. Permission-controlled application status updates are implemented through MIS routes. If employer-side status management is required, a dedicated employer application review workflow should be added.

## 3. Technicalities

### 3.1 Are there character limits for headings, buttons, or forms?

Yes. Some limits are enforced in validation schemas, while others should be applied as content/design guidelines.

**Current enforced limits**

| Field | Limit |
| --- | --- |
| Candidate first name | 2 to 50 characters |
| Candidate last name | 2 to 50 characters |
| Candidate address | 5 to 200 characters |
| Candidate phone | Max 15 characters; format `+947XXXXXXXX` |
| Candidate NIC | 9 digits plus V/v or 12 digits |
| Candidate password | Minimum 8 characters, with lowercase, uppercase, and number |
| Candidate professional summary | Max 1,000 characters |
| Candidate expected positions | 1 to 3 positions |
| Employer company name | 2 to 200 characters |
| Employer BR number | 3 to 50 characters |
| Employer business address | 2 to 255 characters |
| Employer first name | 2 to 100 characters |
| Employer last name | 2 to 100 characters |
| Employer job title/designation | 2 to 200 characters |
| Employer phone | Max 15 characters; format `+947XXXXXXXX` |
| Company bio | 10 to 255 characters |
| Company description | 50 to 2,000 characters |
| Head office location | 5 to 200 characters |
| Company specialities | Max 10 items |
| Job title | 3 to 200 characters |
| Job location | Max 200 characters |
| Job industry | Max 100 characters |
| Salary currency | Max 10 characters |
| Experience level | Max 50 characters |
| Advertisement link | Valid URL, max 500 characters |
| Application cover letter | Max 5,000 characters |
| Application resume URL | Valid URL, max 500 characters |
| Application review notes | Max 2,000 characters |

**Recommended UI copy limits**

- Main homepage headline: 5 to 10 words.
- Homepage subheadline: 20 to 35 words.
- Section headings: 4 to 8 words.
- Card headings: 2 to 6 words.
- Button labels: 1 to 4 words.
- Tooltip text: 6 to 16 words.
- Toast notification title: 2 to 6 words.
- Toast notification body: 8 to 20 words.
- Empty state title: 3 to 7 words.
- Empty state body: 18 to 35 words.
- Form helper text: 8 to 18 words.

### 3.2 What error messages, tooltips, and notifications need copy?

**Authentication and account errors**

- Email and password are required.
- Invalid email or password.
- Please verify your email before logging in.
- Please use the MIS admin login page.
- Your account is not active. Please contact support.
- User data not found.
- Invalid user role.
- Passwords do not match.
- Password must meet the required strength rules.
- Email already verified. You can log in.
- Invalid verification code. Please try again.
- Verification code has expired. Please request a new code.
- User not found. Please register again.

**Candidate errors and notifications**

- Profile saved successfully.
- Candidate profile not found.
- Your profile is under MIS review.
- Your profile has been approved.
- Your profile requires updates.
- Resume uploaded successfully.
- Resume deleted successfully.
- You have not applied to any jobs yet.
- Application submitted successfully.
- You have already applied to this job.
- This job is not accepting applications.
- This job advertisement has expired.
- Application withdrawn.
- Only pending or reviewed applications can be withdrawn.

**Employer errors and notifications**

- Company profile is pending MIS approval.
- You cannot access this page until MIS approves your company.
- Job created as draft.
- Job updated.
- Job title is required.
- Please select an industry.
- Please select both start and end dates.
- End date must be after start date.
- Payment request created.
- Payment proof uploaded successfully.
- Payment proof rejected. Please re-upload with the correct details.
- Only draft jobs can be edited.
- Only published jobs can be paused.
- Only paused jobs can be resumed.
- Only expired jobs can be extended.
- Delete this job? This cannot be undone.
- Job deleted.

**Invitation and interview messages**

- Invitation sent successfully.
- Candidate not found or not approved.
- Missing required fields.
- Interview address is required for physical interviews.
- Invalid time slots. Select 1 to 3 slots.
- You have already sent an active invitation to this candidate.
- An interview or offer process with this candidate is already in progress.
- Candidate has already accepted a job offer from another company.
- Interview confirmed.
- Please provide a meeting link.
- Please select an outcome.
- Interview feedback saved successfully.
- Cancellation reason is required.
- Interview round is already canceled.
- Interview rescheduled successfully.

**MIS messages**

- Candidate approved successfully.
- Candidate rejected successfully.
- Please provide a reason for rejection.
- Company approved successfully.
- Company rejected successfully.
- Insufficient permissions.
- Forbidden.
- Unauthorized.
- Validation failed.
- Internal server error.
- Audit log recorded.

**Tooltips needed**

- Restricted portal item: "Awaiting MIS approval".
- Sign out: "Sign out of your account".
- Theme toggle: "Switch theme".
- Upload BR certificate: "Upload official business registration document".
- Job validity: "How long the advertisement stays live after approval/payment".
- Expected salary: "Maximum salary expectation used for employer search filtering".
- Candidate invitation status: explain Pending, Accepted, Confirmed, Offered, Hired, Rejected, Withdrawn.
- Payment status: explain Pending Payment, Under Review, Approved, Rejected.

### 3.3 What are the FAQs? Should they have a section?

Yes. A dedicated FAQ section is recommended. It can be a public FAQ page plus short FAQ blocks inside Help.

Recommended FAQ groups:

**General**

- What is JobGenie?
- Who can use JobGenie?
- Is JobGenie for candidates, employers, or both?
- How does JobGenie verify users?
- How do I contact support?

**Candidate FAQs**

- How do I create a candidate account?
- Why do I need to verify my email?
- Why is my profile pending MIS approval?
- What can I do before approval?
- How do I upload or change my resume?
- How do I apply for a job?
- Can I withdraw an application?
- How do I respond to an interview invitation?
- How do I accept or decline an offer?

**Employer FAQs**

- How do I register my company?
- Why is the BR certificate required?
- How long does company approval take?
- How do I post a job?
- Why is a job saved as draft first?
- How does payment for job advertisements work?
- How do I search for candidates?
- How do I invite a candidate for an interview?
- Can I add company sub-admins?

**Payments**

- What payment types are supported?
- How do I upload payment proof?
- What happens if payment proof is rejected?
- When does the job ad go live?
- Can I extend an expired job ad?

**Privacy and data**

- What personal data does JobGenie collect?
- Who can see candidate profiles?
- Can candidates delete their account?
- Can employers delete their account?
- How is user data protected?

**Technical support**

- I did not receive my verification code. What should I do?
- I forgot my password. How do I reset it?
- Why is a page disabled?
- Why am I seeing an unauthorized or forbidden message?

### 3.4 Can we include a Terms and Conditions page as well?

Yes. A Terms and Conditions page should be included. The footer already includes a Terms of Service link, so the site should either implement `/terms` or confirm that page exists and is maintained.

Recommended Terms and Conditions sections:

- Introduction and acceptance of terms.
- Eligibility to use the platform.
- Candidate account responsibilities.
- Employer account responsibilities.
- MIS/admin authority and platform governance.
- Account verification and approval.
- Job posting rules.
- Candidate profile and resume accuracy.
- Application and interview process.
- Payment terms for job advertisements.
- Prohibited use.
- Content ownership and license to process submitted content.
- Data privacy reference to Privacy Policy.
- Account suspension or termination.
- Disclaimers: JobGenie facilitates hiring but does not guarantee employment or hiring outcomes.
- Limitation of liability.
- Changes to terms.
- Contact information.

Legal copy should be reviewed by a qualified legal professional before publication.

### 3.5 As this is personal data, can we have a condition/clause about the information users provide?

Yes. A clear personal data clause should be included in Terms and Conditions, Privacy Policy, signup consent text, and profile submission screens.

Recommended clause:

By creating an account or submitting information to JobGenie, you confirm that the information you provide is accurate, complete, current, and belongs to you or is provided with proper authority. You understand that JobGenie may process your personal data, profile details, resumes, company information, application records, interview details, payment records, and related communications for account creation, verification, recruitment, job matching, application management, interview coordination, compliance, fraud prevention, analytics, support, and platform security.

Candidates understand that approved employers and authorized JobGenie/MIS personnel may access relevant profile, resume, application, and interview information for recruitment purposes. Employers understand that company registration details, business registration documents, job postings, payment records, and hiring activity may be reviewed by authorized JobGenie/MIS personnel for verification, compliance, support, and platform operations.

Users must not submit false, misleading, unlawful, confidential third-party, or unauthorized information. JobGenie may reject, suspend, restrict, or remove accounts, profiles, job advertisements, applications, or content where information appears inaccurate, fraudulent, incomplete, unlawful, or in breach of platform rules.

This clause should be supported by:

- Consent checkbox during registration.
- Privacy Policy link near signup forms.
- Terms link near signup forms.
- Clear explanation of who can see profile/company data.
- Account deletion and data retention guidance.

### 3.6 A Help page would be ideal to give both parties an understanding about the service provided

Yes. A Help page is strongly recommended because JobGenie has multiple approval gates and role-based workflows.

Recommended Help page structure:

- Overview: what JobGenie does.
- Candidate guide:
  - Create account.
  - Verify email.
  - Complete profile.
  - Upload resumes.
  - Wait for MIS approval.
  - Browse jobs.
  - Apply.
  - Track applications.
  - Manage invitations and interviews.
  - Respond to offers.
- Employer guide:
  - Register company.
  - Upload BR certificate.
  - Verify email.
  - Complete profile.
  - Wait for MIS approval.
  - Post job.
  - Make payment/upload proof.
  - Search candidates.
  - Send invitations.
  - Manage interviews and offers.
- Verification and approval:
  - Why approval exists.
  - What MIS reviews.
  - What users can do while pending.
  - What happens if rejected.
- Payments:
  - When payment is needed.
  - How proof upload works.
  - What under review means.
  - What rejected means.
- Troubleshooting:
  - Verification code not received.
  - Forgot password.
  - Page disabled.
  - Unauthorized/forbidden messages.
- Contact support:
  - Email.
  - What details to include.

### 3.7 What are the CTA buttons?

CTA buttons should be grouped by audience and journey stage.

**Public website CTAs**

- Sign In.
- Get Started.
- Start as Candidate.
- Start as Employer.
- Register Company.
- Contact Us.
- Submit Inquiry.

**Authentication CTAs**

- Create Account.
- Sign In.
- Candidate.
- Employer.
- Forgot your password?
- Send Reset Link.
- Reset Password.
- Verify Email.
- Resend Code.
- Back to Sign Up.

**Candidate CTAs**

- Complete Profile.
- Upload Resume.
- Add Resume.
- Set as Primary.
- Browse Jobs.
- Apply Now.
- Submit Application.
- Withdraw.
- View Job.
- View Invitations.
- Accept Invitation.
- Decline Invitation.
- Request Reschedule.
- Confirm Interview Slot.
- Accept Offer.
- Decline Offer.
- Save Preferences.
- Change Password.
- Delete Account.

**Employer CTAs**

- Post New Job.
- Save Job.
- Publish.
- View Payment.
- Upload Payment Proof.
- Edit.
- Pause.
- Resume.
- Extend.
- Delete.
- Search Candidates.
- View Details.
- Invite Candidate.
- Cancel Invitation.
- Confirm Interview.
- Add Round.
- Save Feedback.
- Send Offer.
- Add Company Admin.
- Save Settings.

**MIS CTAs**

- Approve Profile.
- Reject Profile.
- Approve Company.
- Reject Company.
- Create Role.
- Save Permissions.
- Add MIS User.
- Reschedule Interview.
- Review Payment.
- Approve Payment.
- Reject Payment.
- Upload Master Data.
- Export Report.

## 4. Summary Recommendation

JobGenie already has a strong role-based structure: candidate portal, employer portal, and MIS portal. The next content priority should be to make the approval gates, verification steps, job posting/payment workflow, and application/interview statuses very clear to users. The most important missing supporting pages are Help, FAQ, Terms and Conditions, and Privacy Policy. These pages will reduce confusion, support trust, and give both candidates and employers a clear explanation of how the service works.
