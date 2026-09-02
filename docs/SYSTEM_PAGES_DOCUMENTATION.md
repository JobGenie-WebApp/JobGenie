# JobGenie System - Complete Pages Documentation

> **Complete documentation of all pages, components, buttons, modals, and UI elements in the JobGenie system**
> 
> Generated: May 23, 2026

---

## Table of Contents

1. [Landing & Public Pages](#1-landing--public-pages)
2. [Common Components](#2-common-components)
3. [Authentication Pages](#3-authentication-pages)
4. [Candidate Portal](#4-candidate-portal)
5. [Employer Portal](#5-employer-portal)
6. [MIS Portal](#6-mis-portal)

---

## 1. Landing & Public Pages

### 1.1 Landing Page (`/`)

**Layout Structure:**
- Header (sticky)
- Hero Section
- Features Section
- Contact Section
- Footer

#### Header Component
**Elements:**
- Logo (JobGenie) with image
- Navigation Menu (Desktop):
  - "Overview" (links to #about)
  - "Platform" (links to #features)
  - "Contact" (links to #contact)
- Theme Toggle Button (dark/light mode)
- "Sign in" Button (navigates to `/login`)
- Mobile Menu Button (hamburger icon)

**Mobile Menu (when opened):**
- Navigation links (same as desktop)
- "Sign in" Button
- Closes on link click

#### Hero Section
**Visual Elements:**
- Background with mesh gradient and animated blobs
- Noise texture overlay
- Watermark decorations

**Content:**
- Label: "TALENT OS" with sparkle icon
- Main Heading: "Hiring that stays **clear**, end to end."
- Description: "One place for verified employers and candidates — discovery, screening, and scheduling without juggling five tools."
- Buttons:
  - "Join as candidate" (gradient button with arrow icon, navigates to `/candidate/signup`)
  - "Register company" (gradient button with arrow up-right icon, navigates to `/employer/signup`)
- Feature Tags: "Verified employers", "Interview scheduling", "Audit-ready trails", "Intent-aware matching"

**Preview Card:**
- Shows "Pipeline pulse" metric (24h)
- Stage drift indicator (-38%)
- Progress bar showing "On track"
- Tags: "SOC2-ready workflows", "Verified orgs"

**Metrics Section:**
- "10K+ Live roles"
- "50K+ Professionals"
- "5K+ Organizations"
- "95% Happy placements"

**Pathway Cards:**
- Candidate Card:
  - Icon: Users
  - Title: "Your profile, one timeline."
  - Description: "Verified identity and applications that stay readable for hiring teams."
  - Button: "Create account" (links to `/candidate/signup`)
- Employer Card:
  - Icon: Building2
  - Title: "Hiring ops in one trail."
  - Description: "Verification, interviews, and outcomes linked for recruiting and leadership."
  - Button: "Register company" (links to `/employer/signup`)

#### Features Section
**Content:**
- Section Label: "PLATFORM SURFACE"
- Heading: "Serious hiring infrastructure — without the enterprise drag."
- Description: "Search, interviews, and decisions in flows your team can explain — without rewrites or vaporware."

**Feature Cards (6 cards in grid):**
1. **Semantic matching** (large card)
   - Icon: Search
   - Description: "Rank roles and candidates on skills, seniority, and intent — not keyword stuffing."
   - Tags: "Role-aware", "Enterprise SLA"

2. **Verified parties**
   - Icon: Shield
   - Description: "Employers and candidates meet after structured checks — fewer wasted loops."

3. **One-click apply**
   - Icon: Zap
   - Description: "Reuse your profile payload safely across postings."

4. **Curated talent pool**
   - Icon: Users
   - Description: "Surface prospects who opted in and fit your bar."

5. **Executive dashboards**
   - Icon: BarChart3
   - Description: "Funnel velocity, source quality, and recruiter throughput in one pane."

6. **Threaded context** (full width)
   - Icon: MessageSquare
   - Description: "Keep hiring conversations beside the record — not buried in inboxes."

#### Contact Section
**Left Column:**
- Label: "CONTACT"
- Heading: "Let's scope your rollout."
- Description: "Whether you are mobilizing a hiring sprint or onboarding an entire talent organization — tell us what success looks like."

**Contact Channels (3 cards):**
1. Email: support@jobgenie.com
   - Hint: "Response within one business day."
2. Phone: +1 (555) 123-4567
   - Hint: "Weekdays 9am–6pm PT."
3. HQ: San Francisco, CA
   - Hint: "Global remote-first teams."

**Right Column - Contact Form:**
- Form Title: "Send a brief"
- Note: "This form is presented for layout parity — wire your handler when API is ready."
- Fields:
  - Name (text input)
  - Work email (email input)
  - How can we help? (textarea, 5 rows)
- Button: "Submit inquiry" (rounded full)

#### Footer Component
**Logo Section:**
- JobGenie logo
- Description: "JobGenie connects verified employers with intent-rich candidates — one operating system for modern recruiting teams."

**Footer Columns:**
1. **Product:**
   - Platform (links to #features)
   - Candidates (links to `/candidate/signup`)
   - Employers (links to `/employer/signup`)

2. **Company:**
   - Overview (links to #about)
   - Contact (links to #contact)
   - Sign in (links to `/login`)

3. **Legal:**
   - Privacy (links to `/privacy`)
   - Terms (links to `/terms`)

**Bottom Section:**
- Copyright: "© 2026 JobGenie. All rights reserved."
- Social Links: LinkedIn, X / Twitter

---

## 2. Common Components

### 2.1 AuthShell Layout

**Used by:** All authentication pages

**Structure:**
- Two-column responsive layout (form left, info right on large screens)
- Left column: Form content
- Right column: 
  - Side headline
  - Side description
  - Optional bullet points list
- Full-width on mobile, split on desktop
- Background with subtle gradients

### 2.2 Theme Toggle

**Features:**
- Sun/Moon icon toggle
- Switches between light, dark, and system themes
- Available in header on all pages
- Persistent across sessions

### 2.3 PortalRichPlaceholder

**Used for:** Empty state pages

**Elements:**
- Large icon (customizable)
- Title
- Description
- Primary action button
- Secondary action button (optional)
- Responsive card design

---

## 3. Authentication Pages

### 3.1 Universal Login Page (`/login`)

**Layout:** AuthShell

**Icon:** LogIn icon (blue/primary background)

**Heading:** "Welcome back"
**Subheading:** "Sign in with your work email to continue."

**Form Fields:**
- Email Address (email input with autocomplete)
- Password (password input with show/hide toggle)

**Buttons:**
- "Sign In" (gradient button, full width)
  - Loading state: "Signing in..." with spinner

**Links:**
- "Forgot your password?" (with KeyRound icon, links to `/forgot-password`)

**Additional Actions:**
- "New to JobGenie?" text
- Two buttons in grid:
  - "Candidate sign up" (outline button, links to `/candidate/signup`)
  - "Employer sign up" (outline button, links to `/employer/signup`)

**Side Info:**
- Headline: "The hiring OS your team can actually run."
- Description: "Role-aware workspaces for candidates, employers, and operations — with verification and timelines in one place."

---

### 3.2 Candidate Signup Page (`/candidate/signup`)

**Layout:** AuthShell

**Icon:** User icon (primary background)

**Heading:** "Create your candidate account"
**Subheading:** "Join verified job seekers on JobGenie — free to get started."

**Form Fields (all required unless noted):**

**Row 1 (2 columns):**
- First Name (text input)
- Last Name (text input)

**Row 2 (2 columns):**
- NIC/Passport (text input, max 12 chars)
- Gender (select dropdown: Male, Female, Other)

**Full Width:**
- Date of Birth (date picker, max: 9999-12-31)
- Residential Address (text input)

**Row 3 (2 columns):**
- Contact No (tel input, format: +94XXXXXXXXX, max 15 chars)
- Email (email input)

**Password Fields:**
- Password (password input with show/hide toggle)
  - Validation message: "Minimum 8 characters, must include at least an uppercase, a lowercase, a number and a special character"
  - Password strength indicator (5-level bar):
    - Very Weak (red)
    - Weak (orange)
    - Fair (yellow)
    - Good (lime)
    - Strong (green)
  - Shows strength label below bars

- Confirm Password (password input with show/hide toggle)
  - Shows check mark (green) when passwords match
  - Shows X mark (red) when passwords don't match
  - Match/mismatch text indicator below

**Button:**
- "Create Account" (primary button, full width, size lg)
  - Loading state: "Creating Account..." with spinner

**Footer Link:**
- "Already have an account? Sign in" (links to `/login`)

**Side Info:**
- Headline: "Your career graph, one verified profile."
- Description: "Show intent-rich credentials, track every application in one timeline, and get matched to roles that fit how you work."
- Bullets:
  - "Credential-backed identity & résumé graph"
  - "Transparent stages from screen to offer"
  - "Calendar-aware scheduling with employers"

**Special Features:**
- Form data saved to localStorage on change
- Restored from localStorage on mount
- Real-time client-side validation
- Field-by-field validation on blur

---

### 3.3 Employer Signup Page (`/employer/signup`)

**Layout:** AuthShell (bare mode, wider max-width: 2xl)

**Heading:** "Employer registration"
**Description:** "Complete company details, then your admin profile — we'll guide you through both steps."

**Component:** EmployerSignupWizard (multi-step wizard)

**Footer Link:**
- "Already have an account? Sign in" (links to `/login`)

**Side Info:**
- Headline: "Evidence-led hiring for serious teams."
- Description: "Verify your organization, upload BR credentials, and onboard recruiters into one audit-friendly workspace."
- Bullets:
  - "Business registry & document verification"
  - "Pipeline analytics leadership actually reads"
  - "Structured interviews & feedback in context"

---

### 3.4 MIS Login Page (`/mis/login`)

**Layout:** AuthShell

**Icon:** Shield icon (primary background)

**Heading:** "MIS sign in"
**Subheading:** "Enter your administrator email and password."

**Form Component:** MISLoginForm

**Form Fields:**
- Email (email input)
- Password (password input with show/hide toggle)

**Button:**
- "Sign In" (gradient button, full width)

**Side Info:**
- Headline: "Operations console for trusted admins."
- Description: "Management Information System access is restricted to authorized personnel. Sign in with your issued credentials."
- Bullets:
  - "Role & permission governance"
  - "Employer and candidate oversight"
  - "Audit logs and platform analytics"

**Note:** No signup link (admin-only access)

---

### 3.5 Forgot Password Page (`/forgot-password`)

**Layout:** AuthShell

**Icon:** KeyRound icon (primary background)

**Heading:** "Forgot password?"
**Subheading:** "Enter your registered email — we'll send a reset link if an account exists."

**Form Fields:**
- Email Address (email input with autocomplete)

**Button:**
- "Send Reset Link" (gradient button, full width)
  - Loading state: "Sending Reset Link..." with spinner

**Success State (after submission):**
- Icon: MailCheck (large, in colored circle)
- Heading: "Check Your Email"
- Message: "If an account with that email exists, we've sent a password reset link. It expires in **1 hour**."
- Note: "Didn't receive it? Check your spam folder or try again."
- Button: "Try a different email" (outline)

**Footer Link:**
- "Remember your password? Back to sign in" (links to `/login`)

**Side Info:**
- Headline: "Reset access without losing continuity."
- Description: "We'll email a secure link so you can set a new password and get back to hiring or applying in minutes."
- Bullets:
  - "Time-limited reset links"
  - "Works for every JobGenie workspace role"
  - "Same SSO-ready email you use to sign in"

---

### 3.6 Reset Password Page (`/reset-password?token=...`)

**Layout:** AuthShell

**Icon:** ShieldCheck icon (primary background)

**Heading:** "Set new password"
**Subheading:** "Enter and confirm your new password below."

**Form Component:** ResetPasswordForm

**Form Fields:**
- New Password (password input with show/hide toggle)
- Confirm Password (password input with show/hide toggle)

**Button:**
- "Reset Password" (gradient button, full width)

**Footer Link:**
- "Back to sign in" (links to `/login`)

**Side Info:**
- Headline: "Choose a password that protects your pipeline."
- Description: "Use a unique passphrase with mixed characters — it secures every workspace tied to this email."
- Bullets:
  - "Password strength enforced platform-wide"
  - "Single sign-on to candidate or employer apps"
  - "Invalid links expire automatically"

**Validation:**
- Redirects to `/forgot-password` if no token provided

---

### 3.7 Verify Email Pages

#### Candidate Verify Email (`/candidate/verify-email?email=...`)

**Layout:** Simple centered card (no AuthShell)

**Icon:** MailCheck (large, primary background)

**Heading:** "Verify Your Email"
**Description:** "We've sent a 6-digit verification code to your email address."

**Form Component:** VerifyEmailForm

**Elements:**
- 6-digit code input fields
- "Verify Email" button
- Resend code option
- Timer countdown

**Footer:**
- "Back to Sign Up" button with ArrowLeft icon (ghost style, links to `/candidate/signup`)

**Validation:**
- Redirects to `/candidate/signup` if no email provided

#### Employer Verify Email (`/employer/verify-email?email=...`)

**Same as Candidate Verify Email** but:
- Back button links to `/employer/signup`
- Redirects to `/employer/signup` if no email

---

### 3.8 Complete Profile Pages

#### Candidate Create Profile (`/candidate/create-profile`)

**Layout:** Simple page with card

**Elements:**
- "Back to Home" button (ghost, with ArrowLeft icon)
- Header Card:
  - Icon: UserCircle (large, primary background)
  - Heading: "Complete Your Profile"
  - Description: "Welcome[, {firstName}]! Fill in your details to access your dashboard."

**Component:** CreateProfileWizard (multi-step form)

**Pre-filled Data:**
- First Name
- Last Name
- Email
- Phone
- Address
- Country
- Industry

**Redirects:**
- To `/login` if no user session

---

#### Employer Complete Profile (`/employer/complete-profile`)

**Layout:** Simple centered container

**Heading:** "Complete Employer Profile"
**Description:** 
- For Super Admin: "Let's finish setting up your profile to start posting jobs and finding top talent"
- For Sub-Admin: "Complete your personal profile to start working with your team"

**Component:** EmployerProfileWizard

**Features:**
- Multi-step form
- Different steps for super admin vs sub-admin
- Loads employer and company data

**Redirects:**
- To `/employer/login` if no session
- To `/employer/dashboard` if profile already complete

---

## 4. Candidate Portal

### 4.1 Candidate Portal Layout

**Common Structure for All Candidate Pages:**

#### Sidebar (Collapsible)
**Header:**
- JobGenie logo with image
- "JobGenie" text (hidden when collapsed)
- Collapsible button

**Navigation Items:**
1. Dashboard (LayoutDashboard icon)
   - Link: `/candidate/dashboard`
   - Always accessible

2. Browse Jobs (Briefcase icon)
   - Link: `/candidate/jobs`
   - Requires MIS approval

3. Applications (FileText icon)
   - Link: `/candidate/applications`
   - Requires MIS approval

4. Invitations (Mail icon)
   - Link: `/candidate/invitations`
   - Shows badge with unopened invitation count
   - Requires MIS approval

5. Calendar (CalendarDays icon)
   - Link: `/candidate/calendar`
   - Requires MIS approval

6. My Profile (User icon)
   - Link: `/candidate/profile`
   - Always accessible

7. My Resumes (FileText icon)
   - Link: `/candidate/resumes`
   - Always accessible

8. Settings (Settings icon)
   - Link: `/candidate/settings`
   - Requires MIS approval

**Restricted Item Behavior:**
- Disabled state (opacity 50%, cursor not-allowed)
- Tooltip: "{Item Title} - Awaiting MIS approval"
- Not clickable

**Active State:**
- Primary color background
- Highlighted with special styling

#### Header (Sticky)
**Left Side:**
- Sidebar toggle button (with rotation animation)
  - Icon changes based on sidebar state
- "CANDIDATE" label (small, uppercase, primary color)
- Page title (large, bold, gradient text)
- Page description (smaller, muted)

**Right Side:**
- User Menu Dropdown:
  - Avatar/Profile picture
  - Name
  - Email
  - Membership number
  - Dropdown items:
    - My Profile
    - My Resumes
    - Settings
    - Divider
    - Sign Out

---

### 4.2 Candidate Dashboard (`/candidate/dashboard`)

**Page Title:** "Overview"
**Page Description:** "Welcome back, {firstName}!"

**Components:**

#### Approval Status (if pending)
**Alert Card (prominent):**
- Icon: AlertTriangle (primary colored)
- Title: "Approval pending"
- Message: "Your profile is under review. You can browse jobs, but applications stay paused until MIS approves you — typically within 24 hours."
- Button: "Check status" (gradient, links to `/candidate/profile`)

#### Approval Notification Modal
**Triggers when:**
- User is approved or rejected
- First time seeing status

**Approved Version:**
- Success icon and messaging
- "Get Started" button

**Rejected Version:**
- Error icon
- Rejection reason displayed
- Contact support message

#### Section 1: Application Pulse
**Title:** "Application pulse"
**Description:** "Live counts for where you are in the hiring journey."

**4 Stat Cards:**
1. Under Review
   - Icon: FileText (green scheme)
   - Shows count

2. Interviews
   - Icon: Users (cyan scheme)
   - Shows count

3. Offers Received
   - Icon: Gift (green scheme)
   - Shows count

4. Saved Jobs
   - Icon: Bookmark (cyan scheme)
   - Shows count

#### Section 2: Two-Column Layout

**Left Column (60% width):**
- **Recommended Jobs Widget**
  - Shows job listings
  - Job cards with apply buttons

**Right Column (40% width):**

1. **Interview Calendar Widget**
   - Shows upcoming interviews
   - Calendar view
   - Event cards

2. **Profile Strength Widget**
   - Progress indicator
   - Percentage complete
   - Missing sections list
   - "Complete Profile" button

3. **Upgrade Pro Card**
   - Premium features preview
   - "Upgrade Now" button

**Additional Components:**
- RestrictionToastListener (background)
- InvitationRealtimeBridge (real-time updates)

---

### 4.3 Browse Jobs Page (`/candidate/jobs`)

**Page Title:** "Browse Jobs"
**Page Description:** "Discover new opportunities that match your skills"

**Current State:** Placeholder

**Placeholder Component:**
- Icon: Briefcase (large)
- Title: "Job board goes live soon"
- Message: "Employers are onboarding now. While listings are being prepared, use Invitations to manage active interviews and your Dashboard for status at a glance."
- Primary Button: "Go to invitations" (links to `/candidate/invitations`)
- Secondary Button: "Back to overview" (links to `/candidate/dashboard`)

---

### 4.4 My Applications Page (`/candidate/applications`)

**Page Title:** "My Applications"
**Page Description:** "Track the status of your job applications"

**Current State:** Placeholder

**Placeholder Component:**
- Icon: FileText (large)
- Title: "No applications logged yet"
- Message: "Once you apply to published roles, each submission will land here with its current stage. Until then, nurture warm conversations inside Invitations."
- Primary Button: "View invitations" (links to `/candidate/invitations`)
- Secondary Button: "Open calendar" (links to `/candidate/calendar`)

---

### 4.5 Interview Invitations Page (`/candidate/invitations`)

**Page Title:** "Interview Invitations"
**Page Description:** "Manage your interview invitations from employers"

**Component:** InvitationsClient (complex client component)

**Features:**
- List of all invitations
- Each invitation card shows:
  - Company name
  - Position
  - Status badges
  - Interview rounds
  - Action buttons (Accept, Decline, Reschedule, etc.)
  - Interview roadmap timeline

**Invitation Card Actions:**
- View details button
- Accept invitation button
- Decline invitation button
- Reschedule request button
- Round response submission
- Job offer acceptance/decline

**Modals:**
- Invitation detail modal
- Decline reason modal
- Reschedule request modal
- Round feedback modal
- Job offer modal

**Real-time Updates:**
- Status changes
- New invitations
- Round updates

---

### 4.6 Interview Calendar Page (`/candidate/calendar`)

**Page Title:** "Interview Calendar"
**Page Description:** "View all your scheduled interviews and invitations"

**Component:** CandidateCalendarClient

**Features:**
- Full calendar view
- Month/Week/Day views
- Interview events displayed
- Color-coded by status
- Click events to see details

**Event Types:**
- Scheduled interviews
- Pending invitations
- Completed interviews
- Rescheduled events

**Event Details Modal:**
- Company name
- Position
- Date and time
- Round number
- Interview status
- Action buttons

---

### 4.7 My Profile Page (`/candidate/profile`)

**Page Title:** "My Profile"
**Page Description:** "View your professional profile"

**Component:** ProfileContent

**Sections:**

#### Profile Header
- Profile picture
- Full name
- Membership number
- Email
- Phone
- Current position
- Edit button (top right)

#### Basic Information Card
- NIC/Passport
- Gender
- Date of Birth
- Address
- Nationality
- Edit button

#### Professional Summary Card
- Industry
- Current Position
- Years of Experience
- Experience Level
- Employment Type
- Availability Status
- Expected Monthly Salary
- Edit button

#### Qualifications Card
- Highest Qualification
- List of all qualifications
- Edit button

#### Experience Section
- List of work experiences
- Each entry:
  - Company name
  - Position
  - Duration
  - Description
- Add/Edit/Delete buttons

#### Education Section
- List of educational background
- Each entry:
  - Institution
  - Degree/Diploma
  - Duration
  - Field of study
- Add/Edit/Delete buttons

#### Certificates Section
- List of certifications
- Each entry:
  - Certificate name
  - Issuing organization
  - Date obtained
  - Certificate file/link
- Add/Edit/Delete buttons

#### Projects Section
- List of projects
- Each entry:
  - Project name
  - Description
  - Technologies used
  - Duration
- Add/Edit/Delete buttons

#### Awards Section
- List of awards and achievements
- Each entry:
  - Award name
  - Organization
  - Date received
  - Description
- Add/Edit/Delete buttons

**Approval Status Badge:**
- Pending: Yellow badge
- Approved: Green badge
- Rejected: Red badge with reason

**Edit Modals:**
- Each section has edit modal
- Form fields matching section
- Save/Cancel buttons
- Validation errors shown

---

### 4.8 My Resumes Page (`/candidate/resumes`)

**Page Title:** "My Resumes"
**Page Description:** "Manage your resume documents"

**Features:**
- Upload resume button
- List of uploaded resumes
- Each resume card:
  - File name
  - Upload date
  - File size
  - Primary/Secondary toggle
  - Download button
  - Delete button
  - Preview button

**Actions:**
- Upload new resume (file picker)
- Set as primary resume (radio select)
- Download resume
- Delete resume (with confirmation)
- Preview resume (modal or new tab)

**Validation:**
- File type restrictions (PDF, DOC, DOCX)
- File size limit
- Minimum one resume required

---

### 4.9 Settings Page (`/candidate/settings`)

**Page Title:** "Settings"
**Page Description:** "Manage your account settings"

**Sections:**

#### Account Settings Card
- Email (read-only, display only)
- Phone (editable)
- Change Password button
- Save button

#### Notification Preferences Card
- Email notifications toggle
- Interview reminder emails toggle
- Application status updates toggle
- Marketing emails toggle
- Save button

#### Privacy Settings Card
- Profile visibility toggle
- Show contact information toggle
- Allow employer messages toggle
- Save button

#### Delete Account Card
- Warning message
- "Delete My Account" button (destructive)
- Confirmation modal

**Modals:**
- Change Password Modal:
  - Current password field
  - New password field
  - Confirm new password field
  - Save/Cancel buttons

- Delete Account Confirmation:
  - Warning text
  - "Type DELETE to confirm" input
  - Confirm/Cancel buttons

---

## 5. Employer Portal

### 5.1 Employer Portal Layout

**Common Structure for All Employer Pages:**

#### Sidebar (Collapsible)
**Header:**
- JobGenie logo with image
- "JobGenie" text (hidden when collapsed)

**Navigation Items:**
1. Dashboard (LayoutDashboard icon)
   - Link: `/employer/dashboard`
   - Always accessible

2. Job Postings (Briefcase icon)
   - Link: `/employer/jobs`
   - Requires MIS company approval

3. Applications (FileText icon)
   - Link: `/employer/applications`
   - Requires MIS company approval

4. Candidates (Users icon)
   - Link: `/employer/candidates`
   - Requires MIS company approval

5. Invitations (Mail icon)
   - Link: `/employer/invitations`
   - Shows badge with pending invitation count
   - Requires MIS company approval

6. Calendar (CalendarDays icon)
   - Link: `/employer/calendar`
   - Requires MIS company approval

7. Company Profile (Building2 icon)
   - Link: `/employer/company`
   - Always accessible

8. Company Admins (UserCog icon)
   - Link: `/employer/admins`
   - Requires MIS company approval

9. Settings (Settings icon)
   - Link: `/employer/settings`
   - Requires MIS company approval

**Restricted Item Behavior:**
- Disabled state (opacity 50%)
- Tooltip: "{Item Title} - Awaiting MIS approval"
- Not clickable until company approved

#### Header (Sticky)
**Left Side:**
- Sidebar toggle button
- "EMPLOYER" label (small, uppercase, accent color)
- Page title (large, bold, gradient text)
- Page description

**Right Side:**
- Employer User Menu:
  - Avatar/Profile picture
  - Name
  - Company name
  - Email
  - Dropdown items:
    - My Profile
    - Company Profile
    - Company Admins (super admin only)
    - Settings
    - Divider
    - Sign Out

---

### 5.2 Employer Dashboard (`/employer/dashboard`)

**Page Title:** "Dashboard"
**Page Description:** "Welcome back! Here's an overview of your recruitment activities."

#### Company Pending Approval Alert (if pending)
**Alert Card:**
- Icon: Loader2 (animated spinner, primary color)
- Title: "Company profile in review"
- Message: "MIS is verifying your organization. You will be notified when you are cleared to post jobs and run full hiring workflows. You can still refine your company profile while you wait."
- Gradient background with primary/accent colors

#### Section 1: Operations Snapshot
**Title:** "Operations snapshot"
**Description:** "Headline metrics for postings and inbound talent. Wire these to live data when ready."

**4 Stat Cards:**
1. Active Job Postings
   - Icon: Briefcase (green scheme)
   - Value: Count
   - Description: "Jobs currently open"

2. Total Applications
   - Icon: FileText (cyan scheme)
   - Value: Count
   - Description: "All time applications"

3. Shortlisted
   - Icon: Users (green scheme)
   - Value: Count
   - Description: "Candidates under review"

4. New Applications
   - Icon: TrendingUp (cyan scheme)
   - Value: Count
   - Description: "In the last 7 days"

#### Section 2: Recent Activity Card
- Icon: Activity
- Title: "Recent activity"
- Empty state:
  - Message: "No activity yet"
  - Description: "Once candidates apply and your team moves stages, a live feed will appear here."

**Additional Components:**
- RestrictionToastListener (background)

---

### 5.3 Job Postings Page (`/employer/jobs`)

**Page Title:** "Job Postings"
**Page Description:** "Create and manage your job listings"

**Features:**
- "Post New Job" button (top right, gradient style)
- Job listings table/grid
- Each job card:
  - Job title
  - Department
  - Location
  - Employment type
  - Posted date
  - Status badge (Active/Closed/Draft)
  - Applicant count
  - Action buttons

**Job Actions:**
- Edit job button
- View applications button
- Close/Reopen job toggle
- Delete job button
- Clone job button

**Modals:**
- Create/Edit Job Modal:
  - Job Title
  - Department
  - Location
  - Employment Type (Full-time, Part-time, Contract, etc.)
  - Salary Range
  - Job Description (rich text editor)
  - Requirements
  - Benefits
  - Application Deadline
  - Save as Draft/Publish buttons

- Delete Confirmation Modal
- Close Job Confirmation Modal

---

### 5.4 Applications Page (`/employer/applications`)

**Page Title:** "Applications"
**Page Description:** "Review candidate applications"

**Filters:**
- Job filter dropdown
- Status filter (New, Reviewed, Shortlisted, Rejected)
- Date range picker
- Search by candidate name

**Applications Table:**
Each row shows:
- Candidate name (clickable)
- Applied for (job title)
- Application date
- Status badge
- Resume download button
- Action buttons

**Actions:**
- View candidate profile button
- Shortlist button
- Reject button
- Schedule interview button
- Download resume button

**Modals:**
- Candidate Profile Modal:
  - Full candidate details
  - Resume viewer
  - Action buttons
  
- Reject Application Modal:
  - Reason textarea
  - Confirm/Cancel buttons

- Schedule Interview Modal:
  - Interview round selector
  - Date/Time picker
  - Location/Meeting link
  - Interviewer selection
  - Notes textarea
  - Send invitation button

---

### 5.5 Browse Candidates Page (`/employer/candidates`)

**Page Title:** "Browse Candidates"
**Page Description:** "Filter and view approved candidate profiles"

**Component:** CandidateTable

**Filters:**
- Industry dropdown (loaded from database)
- Experience level filter
- Employment type filter
- Availability status filter
- Salary range slider
- Search by name/skills

**Candidates Table:**
Each row shows:
- Candidate name
- Industry
- Current position
- Years of experience
- Experience level
- Availability status
- Expected salary
- Invited status badge
- Action buttons

**Invited Status:**
- Shows if candidate already invited
- Displays invitation status
- Shows current interview round
- Pipeline status indicator

**Actions:**
- View profile button
- Invite candidate button (if not invited)
- View invitation status button (if invited)
- Download resume button

**Invite Candidate Modal:**
- Job position selector
- Interview details
- Custom message textarea
- Send invitation button

**Modals:**
- Candidate Profile View Modal:
  - Complete profile information
  - Experience timeline
  - Education history
  - Skills and qualifications
  - Resume download
  - Invite button

---

### 5.6 Invitations Page (`/employer/invitations`)

**Page Title:** "Invitations"
**Page Description:** "Track interview invitations sent to candidates"

**Filters:**
- Status filter (All, Pending, Accepted, Declined, In Progress, Completed)
- Job filter dropdown
- Date range

**Invitations List:**
Each invitation card shows:
- Candidate name and picture
- Job position
- Status badge (large, colored)
- Invitation sent date
- Last updated date
- Current round (if multi-round)
- Pipeline status
- Action buttons

**Status Badges:**
- Pending: Yellow
- Accepted: Green
- Declined: Red
- Interviewing: Blue
- Offer Sent: Purple
- Completed: Gray

**Actions:**
- View details button
- Cancel invitation button (if pending)
- Schedule next round button
- Provide feedback button
- Request reschedule button
- Send job offer button
- View candidate profile button

**Interview Roadmap:**
- Shows all interview rounds
- Displays current round highlight
- Round status indicators
- Round feedback

**Modals:**

1. **Invitation Details Modal:**
   - Full invitation history
   - All rounds information
   - Candidate responses
   - Interview feedback
   - Action buttons

2. **Schedule Interview Round Modal:**
   - Round number
   - Date/Time picker
   - Location/Meeting link
   - Duration
   - Interviewer assignment
   - Notes
   - Send button

3. **Provide Feedback Modal:**
   - Round selector
   - Rating (1-5 stars)
   - Strengths textarea
   - Weaknesses textarea
   - Overall notes
   - Recommendation (Pass to next round / Reject / On Hold)
   - Submit button

4. **Send Job Offer Modal:**
   - Position
   - Salary offer
   - Start date
   - Benefits summary
   - Terms and conditions
   - Offer letter upload
   - Additional notes
   - Send offer button

5. **Cancel Invitation Modal:**
   - Warning message
   - Reason textarea
   - Confirm/Cancel buttons

---

### 5.7 Calendar Page (`/employer/calendar`)

**Page Title:** "Interview Calendar"
**Page Description:** "View all scheduled interviews"

**Calendar Views:**
- Month view
- Week view
- Day view
- List view

**Features:**
- Color-coded by job position
- Click event to view details
- Drag-and-drop reschedule
- Filter by interviewer
- Filter by job position

**Event Details Modal:**
- Candidate name
- Job position
- Interview round
- Date and time
- Interviewer(s)
- Location/Meeting link
- Status
- Notes
- Action buttons (Reschedule, Cancel, Add Feedback)

---

### 5.8 Company Profile Page (`/employer/company`)

**Page Title:** "Company Profile"
**Page Description:** "View and manage your company information"

**Component:** CompanyProfileClient

**Sections:**

#### Company Header
- Company logo
- Company name
- Business registration number
- Industry
- Approval status badge
- Edit button (super admin only)

#### Company Details Card
- Company email
- Company phone
- Website
- Address
- City
- Country
- Edit button (super admin only)

#### Business Registration Card
- Registration number
- BR certificate file
- Upload date
- Download button
- Re-upload button (super admin only)

#### Company Description Card
- About the company (rich text)
- Founded year
- Company size
- Edit button (super admin only)

**Edit Modals (Super Admin Only):**
- Edit Company Info Modal
- Upload BR Certificate Modal
- Edit Description Modal

**Approval Status Display:**
- Pending: Yellow badge with clock icon
- Approved: Green badge with check icon
- Rejected: Red badge with X icon and reason

---

### 5.9 Company Admins Page (`/employer/admins`)

**Page Title:** "Company Admins"
**Page Description:** "View all administrators in your company"

**Header (Super Admin Only):**
- Badge: "{count} / 5 sub-admins"
- "Add sub-admin" button (disabled if limit reached)
  - Links to `/employer/admins/add`

**Component:** AdminProfilesClient

**Admin Cards:**
Each admin card shows:
- Profile picture
- Full name
- Email
- Designation
- Job title
- Department
- Phone
- Super Admin badge (if applicable)
- Joined date
- Action buttons (super admin only)

**Super Admin Identifying:**
- Special badge
- Different card color
- "Owner" label

**Actions (Super Admin Only):**
- Edit admin button
- Remove admin button (not for super admin)
- View details button

**Modals:**

1. **Add Sub-Admin Modal:**
   - Email input (for existing user or invite)
   - First name
   - Last name
   - Designation
   - Job title
   - Department
   - Phone
   - Send invitation button

2. **Edit Admin Modal:**
   - Same fields as add
   - Save button

3. **Remove Admin Confirmation:**
   - Warning message
   - Admin details
   - Confirm/Cancel buttons

---

#### Add Sub-Admin Page (`/employer/admins/add`)

**Page Title:** "Add Company Admin"
**Page Description:** "Invite a new administrator to your company"

**Form Fields:**
- Email address (email input)
- First name
- Last name
- Designation
- Job title
- Department
- Phone number

**Buttons:**
- "Send Invitation" (primary, gradient)
- "Cancel" (outline, links back to `/employer/admins`)

**Validation:**
- Email format check
- Duplicate email check
- Required field validation

**Success:**
- Confirmation message
- Redirect to admins list

---

### 5.10 Settings Page (`/employer/settings`)

**Page Title:** "Settings"
**Page Description:** "Manage employer account settings"

**Sections:**

#### My Account Card
- Email (read-only)
- Phone (editable)
- Change password button
- Save button

#### Notification Preferences Card
- Email notifications for new applications toggle
- Interview reminder emails toggle
- Candidate response notifications toggle
- Marketing emails toggle
- Save button

#### Company Branding Card (Super Admin Only)
- Upload company logo
- Primary brand color picker
- Save button

---

## 6. MIS Portal

### 6.1 MIS Portal Layout

**Common Structure for All MIS Pages:**

#### Sidebar (Collapsible)
**Header:**
- JobGenie logo with image
- "JobGenie" text (when expanded)
- "MIS System" subtitle (when expanded)

**Navigation Items:**
1. Dashboard (LayoutDashboard icon)
   - Link: `/mis/dashboard`

2. MIS User Management (Users icon)
   - Link: `/mis/users`

3. Roles & Permissions (Shield icon)
   - Link: `/mis/roles`

4. Candidates (UserSquare icon)
   - Link: `/mis/candidates`

5. Employers (Building2 icon)
   - Link: `/mis/employers`

6. Interviews (Calendar icon)
   - Link: `/mis/interviews`

7. Jobs (Briefcase icon)
   - Link: `/mis/jobs`

8. Reports & Analytics (BarChart3 icon)
   - Link: `/mis/reports`

9. Audit Logs (FileText icon)
   - Link: `/mis/audit`

10. Master Data (Settings icon)
    - Link: `/mis/settings`

**No Restricted Items:**
- All items accessible based on role permissions
- No approval-dependent restrictions

#### Header (Sticky)
**Left Side:**
- Sidebar toggle button
- Page title (large, bold)
- Page description

**Right Side:**
- User Menu:
  - Avatar
  - Name
  - Email
  - Dropdown items:
    - My Profile
    - Settings
    - Divider
    - Sign Out

---

### 6.2 MIS Dashboard (`/mis/dashboard`)

**Page Title:** "MIS Dashboard"
**Page Description:** "Welcome to the Management Information System dashboard."

**Dashboard Cards (8 cards in grid):**

1. **MIS User Management**
   - Icon: Users (blue)
   - Title: "MIS User Management"
   - Description: "Manage MIS administrator accounts"
   - Link: `/mis/users`
   - No count

2. **Roles & Permissions**
   - Icon: Shield (violet)
   - Title: "Roles & Permissions"
   - Description: "Manage roles and access control"
   - Link: `/mis/roles`
   - No count

3. **Candidate Approvals**
   - Icon: UserSquare (green)
   - Title: "Candidate Approvals"
   - Description: "Review and approve candidate profiles"
   - Link: `/mis/candidates`
   - Shows count of candidates

4. **Employer Management**
   - Icon: Building2 (purple)
   - Title: "Employer Management"
   - Description: "Manage employer accounts and companies"
   - Link: `/mis/employers`
   - Shows count of companies

5. **Job Management**
   - Icon: Briefcase (orange)
   - Title: "Job Management"
   - Description: "Oversee job postings and listings"
   - Link: `/mis/jobs`
   - Shows count of jobs

6. **Reports & Analytics**
   - Icon: BarChart3 (indigo)
   - Title: "Reports & Analytics"
   - Description: "View system reports and analytics"
   - Link: `/mis/reports`
   - No count

7. **Audit Logs**
   - Icon: FileText (red)
   - Title: "Audit Logs"
   - Description: "View system activity and error logs"
   - Link: `/mis/audit`
   - No count

8. **Master Data**
   - Icon: Settings (gray)
   - Title: "Master Data"
   - Description: "Manage industries and designations"
   - Link: `/mis/settings`
   - No count

**Card Interactions:**
- Hover: Border color change to match icon color
- Click: Navigate to respective page

---

### 6.3 MIS Users Page (`/mis/users`)

**Page Title:** "MIS Users"
**Page Description:** "Manage MIS administrator accounts"

**Header Actions:**
- "Add MIS User" button (primary, top right)
  - Links to `/mis/users/add`

**Component:** MISUserTable

**Table Columns:**
- Name (First name + Last name)
- Email
- Role (from role assignment)
- Super Admin badge (if applicable)
- Created date
- Status (Active/Inactive)
- Actions

**Actions:**
- Edit user button
- Reset password button
- Deactivate/Activate toggle button
- Delete user button (with confirmation)
- View details button

**Modals:**

1. **Edit MIS User Modal:**
   - First name
   - Last name
   - Email (read-only)
   - Role selector
   - Super admin toggle
   - Save button

2. **Reset Password Modal:**
   - Confirmation message
   - "Send password reset email" button
   - Auto-generate temporary password option

3. **Delete User Confirmation:**
   - Warning message
   - User details display
   - "Type DELETE to confirm" input
   - Confirm/Cancel buttons

**Filters:**
- Role filter dropdown
- Super admin filter (All / Super Admins / Regular Admins)
- Status filter (All / Active / Inactive)
- Search by name or email

---

#### Add MIS User Page (`/mis/users/add`)

**Page Title:** "Add MIS User"
**Page Description:** "Create a new MIS administrator account"

**Component:** AddMISUserForm

**Form Fields:**
- First Name
- Last Name
- Email
- Role Selector (dropdown of available roles)
- Is Super Admin (checkbox)
- Temporary Password (auto-generated or manual)
- Confirm Password

**Buttons:**
- "Create User" (primary)
- "Cancel" (outline, links back to `/mis/users`)

**Validation:**
- Email uniqueness check
- Password strength validation
- Required fields

**Success:**
- Success message
- Option to send welcome email
- Redirect to users list

---

### 6.4 Roles & Permissions Page (`/mis/roles`)

**Page Title:** "Roles & Permissions"
**Page Description:** "Manage MIS roles and assign permissions"

**Header:**
- Description: "Create roles and assign specific permissions to control access within the MIS system."
- "Create Role" button (primary, top right)
  - Links to `/mis/roles/create`

**Component:** RolesTable

**Table Columns:**
- Role Name
- Description
- Permissions Count
- Users Assigned Count
- Created Date
- Actions

**Role Cards/Rows:**
Each shows:
- Role name
- Description
- Permission count badge
- User count badge
- Action buttons

**Actions:**
- Edit role button
- Manage permissions button
- View users button
- Delete role button (if no users assigned)

**Modals:**

1. **Edit Role Modal:**
   - Role name
   - Description textarea
   - Save button

2. **Delete Role Confirmation:**
   - Warning if users assigned
   - Confirm/Cancel buttons

---

#### Create Role Page (`/mis/roles/create`)

**Page Title:** "Create New Role"
**Page Description:** "Define a new role and assign permissions"

**Form Sections:**

**1. Role Details:**
- Role Name (text input)
- Description (textarea)

**2. Assign Permissions:**
- Permission categories (collapsible sections):
  
  - **Candidate Management:**
    - View candidates
    - Approve candidates
    - Reject candidates
    - Edit candidate profiles
    - Delete candidates
  
  - **Employer Management:**
    - View companies
    - Approve companies
    - Reject companies
    - Edit company profiles
    - Delete companies
  
  - **User Management:**
    - View MIS users
    - Create MIS users
    - Edit MIS users
    - Delete MIS users
    - Reset passwords
  
  - **Role Management:**
    - View roles
    - Create roles
    - Edit roles
    - Delete roles
    - Assign permissions
  
  - **Job Management:**
    - View jobs
    - Edit jobs
    - Delete jobs
  
  - **Interview Management:**
    - View interviews
    - Reschedule interviews
    - Cancel interviews
  
  - **Reports:**
    - View reports
    - Export reports
  
  - **Audit Logs:**
    - View audit logs
    - Export audit logs
  
  - **Master Data:**
    - View master data
    - Edit master data

**Buttons:**
- "Create Role" (primary)
- "Cancel" (outline)

**Features:**
- Select all in category checkbox
- Individual permission checkboxes
- Permission descriptions on hover

---

#### Edit Role Page (`/mis/roles/[roleId]`)

**Page Title:** "Edit Role: {roleName}"
**Page Description:** "Modify role details and permissions"

**Same as Create Role Page but:**
- Pre-filled with existing role data
- "Save Changes" button instead of "Create Role"
- Additional section showing:
  - Users assigned to this role
  - Created date
  - Last modified date

---

#### Role Permissions Page (`/mis/roles/[roleId]/permissions`)

**Page Title:** "Manage Permissions: {roleName}"
**Page Description:** "Assign or remove permissions for this role"

**Layout:**
- Left side: Available permissions (grouped by category)
- Right side: Assigned permissions

**Features:**
- Drag and drop permissions
- Or click to toggle
- Search/filter permissions
- Save button

**Permission Categories with checkboxes:**
- Same categories as Create Role page

---

### 6.5 Candidate Approvals Page (`/mis/candidates`)

**Page Title:** "Candidate Approvals"
**Page Description:** "Review and approve candidate profiles"

**Component:** CandidateTable

**Filters:**
- Status filter (All, Pending, Approved, Rejected)
- Industry filter
- Date range
- Search by name or email

**Table Columns:**
- Name (First + Last)
- Email
- Industry
- Current Position
- Years of Experience
- Profile Completion (percentage)
- Status Badge
- Registration Date
- Actions

**Status Badges:**
- Pending: Yellow with clock icon
- Approved: Green with check icon
- Rejected: Red with X icon

**Actions:**
- View full profile button
- Approve button (if pending)
- Reject button (if pending or approved)
- View details button

**Modals:**

1. **Candidate Profile Detail Modal:**
   - Tabbed interface:
     - **Basic Info Tab:**
       - Personal details
       - Contact information
       - NIC/Passport
     
     - **Professional Tab:**
       - Industry
       - Current position
       - Experience timeline
       - Qualifications
     
     - **Documents Tab:**
       - Resume download
       - Certificates
       - Other documents
   
   - Action buttons at bottom:
     - Approve
     - Reject
     - Close

2. **Approve Candidate Modal:**
   - Candidate summary
   - Confirmation message
   - Optional approval notes
   - "Confirm Approval" button
   - Cancel button

3. **Reject Candidate Modal:**
   - Candidate summary
   - Rejection reason dropdown (predefined reasons)
   - Custom reason textarea
   - "Confirm Rejection" button
   - Cancel button

**Rejection Reasons:**
- Incomplete profile
- Invalid documents
- Duplicate account
- Suspicious activity
- Does not meet criteria
- Other (requires custom text)

**Bulk Actions:**
- Select multiple candidates
- Bulk approve (with confirmation)
- Bulk reject (requires reason)

---

### 6.6 Employer Management Page (`/mis/employers`)

**Page Title:** "Company Approvals"
**Page Description:** "Review and approve company registration requests"

**Component:** EmployerTable

**Filters:**
- Status filter (All, Pending, Approved, Rejected)
- Industry filter
- Registration date range
- Search by company name or registration number

**Table Columns:**
- Company Name
- Business Registration No.
- Industry
- Primary Contact (from super admin)
- Status Badge
- Registration Date
- Actions

**Status Badges:**
- Pending: Yellow
- Approved: Green
- Rejected: Red

**Actions:**
- View company details button
- View admins button
- Approve button (if pending)
- Reject button
- Suspend account button (if approved)

**Modals:**

1. **Company Details Modal:**
   - **Company Info Tab:**
     - Company name
     - Business registration number
     - Industry
     - Address
     - Phone
     - Email
     - Website
   
   - **Documents Tab:**
     - BR certificate viewer/download
     - Other uploaded documents
   
   - **Super Admin Tab:**
     - Name
     - Email
     - Phone
     - Designation
   
   - **Sub-Admins Tab:**
     - List of all sub-admins
     - Count: X/5
   
   - Action buttons:
     - Approve Company
     - Reject Company
     - Close

2. **Approve Company Modal:**
   - Company summary
   - Verification checklist:
     - BR certificate verified
     - Company details verified
     - Contact information verified
   - Approval notes (optional)
   - "Confirm Approval" button

3. **Reject Company Modal:**
   - Company summary
   - Rejection reason dropdown
   - Custom reason textarea
   - "Confirm Rejection" button

**Rejection Reasons:**
- Invalid business registration
- Incomplete documents
- Suspicious activity
- Duplicate registration
- Does not meet criteria
- Other

4. **Suspend Account Modal:**
   - Warning message
   - Suspension reason
   - Duration (Temporary / Permanent)
   - Confirm button

---

### 6.7 Interviews Page (`/mis/interviews`)

**Page Title:** "Interview Management"
**Page Description:** "Oversee all interview schedules and reschedule requests"

**Filters:**
- Status filter (Scheduled, Completed, Cancelled, Rescheduled)
- Company filter
- Candidate filter
- Date range
- Search

**Table Columns:**
- Candidate Name
- Company Name
- Job Position
- Interview Date & Time
- Round Number
- Status Badge
- Reschedule Requested (flag)
- Actions

**Status Badges:**
- Scheduled: Blue
- In Progress: Yellow
- Completed: Green
- Cancelled: Red
- Rescheduled: Purple

**Reschedule Request Flag:**
- Red exclamation badge if candidate requested reschedule
- Requires MIS approval

**Actions:**
- View details button
- Approve reschedule button (if requested)
- Cancel interview button
- View feedback button (if completed)

**Modals:**

1. **Interview Details Modal:**
   - Candidate information
   - Company information
   - Job position
   - Interview details:
     - Date and time
     - Location/Meeting link
     - Round number
     - Interviewer(s)
   - Status timeline
   - Notes
   - Action buttons

2. **Approve Reschedule Modal:**
   - Current schedule
   - Requested new schedule
   - Candidate reason
   - "Approve" button
   - "Reject" button
   - Counter-propose option

3. **Cancel Interview Modal:**
   - Warning message
   - Cancellation reason
   - Notify parties checkboxes
   - Confirm button

---

### 6.8 Jobs Page (`/mis/jobs`)

**Page Title:** "Job Management"
**Page Description:** "Oversee all job postings across the platform"

**Filters:**
- Company filter
- Status filter (Active, Closed, Draft, Flagged)
- Industry filter
- Employment type filter
- Posted date range
- Search by job title

**Table Columns:**
- Job Title
- Company Name
- Industry
- Employment Type
- Posted Date
- Application Count
- Status Badge
- Actions

**Status Badges:**
- Active: Green
- Closed: Gray
- Draft: Yellow
- Flagged: Red (requires review)

**Actions:**
- View job details button
- View applications button
- Flag job button (for review)
- Close job button
- Delete job button

**Modals:**

1. **Job Details Modal:**
   - Job title
   - Company
   - Description
   - Requirements
   - Benefits
   - Salary range
   - Location
   - Employment type
   - Posted date
   - Deadline
   - Application count
   - Action buttons

2. **Flag Job Modal:**
   - Reason for flagging dropdown:
     - Inappropriate content
     - Spam
     - Discriminatory
     - Misleading information
     - Other
   - Additional notes
   - Flag button

3. **Delete Job Confirmation:**
   - Warning message
   - Job details
   - Reason for deletion
   - Confirm button

---

### 6.9 Reports & Analytics Page (`/mis/reports`)

**Page Title:** "Reports & Analytics"
**Page Description:** "View system reports and analytics"

**Report Categories:**

#### 1. User Statistics Card
- Total candidates count
- Approved candidates
- Pending approvals
- Rejected candidates
- Monthly registration trend chart
- "View Details" button

#### 2. Company Statistics Card
- Total companies count
- Approved companies
- Pending approvals
- Rejected companies
- Monthly registration trend chart
- "View Details" button

#### 3. Job Statistics Card
- Total jobs posted
- Active jobs
- Closed jobs
- Average applications per job
- Monthly posting trend chart
- "View Details" button

#### 4. Interview Statistics Card
- Total interviews scheduled
- Completed interviews
- Cancelled interviews
- Reschedule requests
- Monthly interview trend chart
- "View Details" button

#### 5. Platform Usage Card
- Daily active users
- Weekly active users
- Monthly active users
- Peak usage hours chart
- "View Details" button

**Advanced Reports Section:**
- "Generate Custom Report" button
- Report filters:
  - Date range selector
  - Entity type (Candidates / Companies / Jobs / Interviews)
  - Metrics selector (checkboxes)
  - Group by (Day / Week / Month / Year)
  - Export format (PDF / Excel / CSV)
- "Generate Report" button
- Previously generated reports list with download links

**Charts:**
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Data tables with sorting

---

### 6.10 Audit Logs Page (`/mis/audit`)

**Page Title:** "Audit Logs"
**Page Description:** "View system activity and error logs"

**Filters:**
- Log type (All / Authentication / User Actions / System Events / Errors)
- Date range
- User filter
- Action type filter
- Search by keyword

**Logs Table:**
Each log entry shows:
- Timestamp (precise to seconds)
- User (who performed action)
- Action Type
- Entity Affected
- Details (collapsible)
- IP Address
- Status (Success / Failed)
- Severity Level badge

**Severity Levels:**
- Info: Blue
- Warning: Yellow
- Error: Red
- Critical: Red with exclamation

**Log Types:**

1. **Authentication Logs:**
   - Login attempts (success/failed)
   - Logout events
   - Password changes
   - Password reset requests
   - Session timeouts

2. **User Action Logs:**
   - Candidate approvals/rejections
   - Company approvals/rejections
   - Job postings created/edited/deleted
   - Interview schedules/cancellations
   - Profile updates
   - Document uploads

3. **System Events:**
   - Database backups
   - Scheduled job runs
   - Email notifications sent
   - System configuration changes
   - Maintenance events

4. **Error Logs:**
   - Application errors
   - Database errors
   - API failures
   - Integration errors
   - Validation errors

**Actions:**
- View full details button (opens modal with complete log)
- Export logs button (with date range)
- Filter and search

**Log Details Modal:**
- Complete log entry
- Full stack trace (if error)
- User agent
- Request/response data
- Related logs
- Close button

**Export Options:**
- Date range selection
- Log type selection
- Format (CSV / JSON / PDF)
- "Export" button

---

### 6.11 Master Data Page (`/mis/settings`)

**Page Title:** "Master Data Management"
**Page Description:** "Manage industries, designations, and other system-wide data"

**Tabs:**

#### 1. Industries Tab
**Features:**
- "Add Industry" button (top right)
- Industries list/table
- Each row:
  - Industry ID
  - Industry Name
  - Created Date
  - Used By Count (candidates + companies)
  - Active/Inactive toggle
  - Edit button
  - Delete button

**Modals:**
- Add Industry Modal:
  - Industry Name input
  - Description textarea
  - Active toggle
  - Save button

- Edit Industry Modal:
  - Same as add modal
  - Pre-filled with data

- Delete Confirmation:
  - Warning if used by candidates/companies
  - Force delete option (reassign to other industry)

#### 2. Designations Tab
**Features:**
- "Add Designation" button
- Designations list/table
- Each row:
  - Designation ID
  - Designation Name
  - Created Date
  - Used By Count
  - Active toggle
  - Edit/Delete buttons

**Same modals structure as Industries**

#### 3. Skills Tab
**Features:**
- "Add Skill" button
- Skills list/table
- Categories (grouping)
- Each skill:
  - Skill name
  - Category
  - Used by count
  - Active toggle
  - Edit/Delete buttons

#### 4. System Settings Tab
**Configuration Options:**
- **Email Settings:**
  - SMTP configuration
  - Email templates
  - Test email button

- **Notification Settings:**
  - Enable/disable notification types
  - Notification frequency
  - Template customization

- **Platform Settings:**
  - Maintenance mode toggle
  - Registration controls (open/closed/invite-only)
  - Max file upload sizes
  - Session timeout duration

- **Security Settings:**
  - Password policy rules
  - Two-factor authentication requirement
  - Session management
  - API rate limits

**Buttons:**
- Save Settings (at bottom of each section)
- Reset to Defaults

---

## Additional Modals & Components

### Realtime Components

**InvitationRealtimeBridge (Candidate):**
- Background component
- Listens for invitation updates
- Shows toast notifications for:
  - New invitations
  - Interview schedule changes
  - Status updates
  - Job offers

**InterviewRealtimeBridge (Employer):**
- Background component
- Listens for:
  - Candidate responses to invitations
  - Reschedule requests
  - Round completion
  - Interview feedback submissions

### Interview Components

**InterviewRoadmap:**
- Visual timeline of interview rounds
- Shows current round highlight
- Displays status for each round:
  - Pending
  - Scheduled
  - Completed
  - Cancelled
- Click to view round details

**RoundResponseCard (Candidate View):**
- Round number
- Status badge
- Scheduled date/time
- Location/meeting link
- Interviewer name(s)
- Action buttons (Accept/Decline/Reschedule)
- Feedback received (if completed)

**InterviewFeedbackPanel (Employer View):**
- Round selector
- Rating input (1-5 stars)
- Strengths textarea
- Weaknesses textarea
- Overall assessment
- Recommendation (Pass/Fail/On Hold)
- Submit button

### Job Components

**JobOfferCard (Candidate View):**
- Company name and logo
- Position title
- Salary offer
- Start date
- Benefits summary
- Offer letter download
- Accept/Decline buttons
- Negotiation option button

**JobOfferDialog (Employer View):**
- Position field
- Salary input
- Start date picker
- Benefits list
- Terms textarea
- Offer letter upload
- Send offer button

### Profile Wizards

**CreateProfileWizard (Candidate):**
Multi-step wizard with steps:
1. Basic Info
2. Industry & Experience
3. Education
4. Banking/Finance Specific (if applicable)
5. Certificates
6. Projects
7. Awards
8. Summary

Each step:
- Progress indicator at top
- Form fields for that step
- Previous/Next buttons
- Save as draft option

**EmployerProfileWizard (Employer):**
Multi-step wizard:

For Super Admin:
1. Company Info Step
2. Employer Details Step

For Sub-Admin:
1. Employer Details Step only

Navigation:
- Step indicators
- Previous/Next/Submit buttons

**EmployerSignupWizard:**
Combined wizard for signup:
1. Company Information Step
2. Upload BR Certificate Step
3. Admin Profile Step
4. Email Verification Step

---

## Toast Notifications

**Used Throughout System:**

**Success Toasts:**
- Profile updated
- Application submitted
- Invitation accepted
- Job posted
- User created
- Settings saved

**Error Toasts:**
- Validation errors
- Network errors
- Permission denied
- Session expired

**Info Toasts:**
- Awaiting approval
- Email sent
- Password changed

**Warning Toasts:**
- Unsaved changes
- Deadline approaching
- Session about to expire

**Custom Actions in Toasts:**
- Undo button (for reversible actions)
- View details button
- Dismiss button

---

## Form Validation

**Common Validation Rules Across Forms:**

**Email:**
- Valid email format
- Unique (for registration)
- Work email preferred (some forms)

**Password:**
- Minimum 8 characters
- At least 1 uppercase
- At least 1 lowercase
- At least 1 number
- At least 1 special character
- Password strength indicator

**Phone:**
- Format: +94XXXXXXXXX or similar
- Max length validation
- Country code required

**NIC/Passport:**
- Sri Lankan NIC format (old: 9 digits + V, new: 12 digits)
- Or passport number
- Max 12 characters

**File Uploads:**
- Type restrictions (PDF, DOC, DOCX, JPG, PNG)
- Size limits (typically 5MB-10MB)
- Virus scanning (backend)

**Date Fields:**
- Date of birth: Must be at least 18 years ago
- Interview dates: Must be future date
- Max date: 9999-12-31 (browser limitation)

**Real-time Validation:**
- On blur (field loses focus)
- On change for password strength
- Instant feedback with error messages

---

## Loading States

**Throughout Application:**

**Page Loading:**
- Skeleton screens for data tables
- Shimmer effect on cards
- Progress bars for large operations

**Button Loading:**
- Spinner icon replacing button content
- "Loading..." or specific text (e.g., "Signing in...")
- Button disabled during loading

**Component Loading:**
- Skeleton loaders for cards
- Loading spinners for small components
- Progressive loading for images

**Data Tables:**
- Row skeleton loaders
- Pagination loading states
- Infinite scroll loading indicator

---

## Empty States

**Across All Portals:**

**Empty Tables:**
- Large icon
- "No {items} found" heading
- Helpful message
- Primary action button (e.g., "Add Item")

**Empty Dashboards:**
- Placeholder cards
- "Get Started" CTAs
- Tutorial/onboarding hints

**Empty Search Results:**
- "No results found for '{query}'"
- Search suggestions
- Clear filters button

**Empty Notifications:**
- Bell icon
- "All caught up!" message
- Last checked timestamp

---

## Confirmation Dialogs

**Used for Destructive Actions:**

**Delete Confirmations:**
- Warning icon
- "Are you sure?" heading
- Item details display
- Consequences explained
- Type-to-confirm for critical items
- Confirm/Cancel buttons

**Cancel Confirmations:**
- "Unsaved changes will be lost"
- Save/Don't Save/Cancel options

**Approval Confirmations:**
- Summary of what will be approved
- Optional notes field
- Confirm/Cancel buttons

**Rejection Confirmations:**
- Required reason selection
- Optional additional details
- Confirm/Cancel buttons

---

## Error Pages

**Not included in main pages but present:**

### 404 Not Found
- Large 404 text
- "Page not found" heading
- Helpful message
- "Go Home" button
- Search suggestion

### 500 Server Error
- Error icon
- "Something went wrong" heading
- Error ID for support
- "Try Again" button
- "Contact Support" link

### 403 Forbidden
- Lock icon
- "Access Denied" heading
- Permission explanation
- "Go Back" button

---

## Accessibility Features

**Throughout Application:**

**Keyboard Navigation:**
- Tab order for all interactive elements
- Escape to close modals
- Enter to submit forms
- Arrow keys for navigation menus

**Screen Reader Support:**
- ARIA labels on all interactive elements
- ARIA live regions for dynamic updates
- Alt text on all images
- Semantic HTML structure

**Visual:**
- High contrast mode support
- Focus indicators on all interactive elements
- Error messages associated with form fields
- Loading states announced to screen readers

**Color Coding:**
- Not relying solely on color
- Icons + color for status
- Patterns for different states

---

## Responsive Design

**Breakpoints Used:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl/2xl)

**Mobile Adjustments:**
- Collapsible sidebar becomes drawer
- Tables become cards on mobile
- Multi-column forms become single column
- Touch-friendly button sizes
- Simplified navigation

**Tablet Adjustments:**
- Sidebar can collapse to icons
- Some 2-column layouts maintained
- Bottom navigation for key actions

**Desktop:**
- Full sidebar always visible
- Multi-column layouts
- Hover states active
- More data density

---

## Color Schemes & Themes

**Candidate Portal:**
- Primary: Blue/Cyan tones
- Accent: Green for success states
- Gradient: Blue to cyan

**Employer Portal:**
- Primary: Purple/Violet tones
- Accent: Orange/Amber
- Gradient: Purple to accent

**MIS Portal:**
- Primary: Neutral gray tones
- Accent: Blue for actions
- Professional, minimal aesthetic

**Status Colors:**
- Success/Approved: Green (#22c55e)
- Warning/Pending: Yellow/Amber (#eab308)
- Error/Rejected: Red (#ef4444)
- Info: Blue (#3b82f6)
- Neutral/Inactive: Gray (#6b7280)

**Dark Mode:**
- Available throughout app
- Persists user preference
- Optimized contrast ratios
- Reduced brightness for dark backgrounds

---

## Performance Features

**Optimization Techniques:**

**Code Splitting:**
- Route-based splitting
- Component lazy loading
- Dynamic imports for heavy components

**Caching:**
- SWR for data fetching
- LocalStorage for form state
- Browser caching for static assets

**Image Optimization:**
- Next.js Image component
- Lazy loading
- Responsive images
- WebP format with fallbacks

**Data Loading:**
- Server-side rendering for initial load
- Client-side fetching for updates
- Optimistic updates where appropriate
- Debounced search inputs

---

## Security Features

**Throughout Application:**

**Authentication:**
- Supabase Auth
- Row Level Security (RLS)
- Session management
- Auto-logout on inactivity

**Authorization:**
- Role-based access control (RBAC)
- Permission checks on actions
- API endpoint protection
- Client-side route guards

**Data Protection:**
- Input sanitization
- XSS protection
- CSRF tokens
- SQL injection prevention (via Supabase)

**Password Security:**
- Hashing (bcrypt)
- Password strength enforcement
- Password reset flow
- Password change history

**File Upload Security:**
- Type validation
- Size limits
- Virus scanning
- Secure storage (Supabase Storage)

---

## End of Documentation

This document provides a comprehensive overview of all pages, components, buttons, modals, and UI elements in the JobGenie system as of May 23, 2026. 

For technical implementation details, refer to the actual component files in the codebase.

**Total Pages Documented:** 45+
**Total Components Documented:** 100+
**Total Modals Documented:** 50+
