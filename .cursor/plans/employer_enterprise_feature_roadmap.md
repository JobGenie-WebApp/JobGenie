# JobGenie Employer Portal - Enterprise Feature Roadmap

**Date:** 2026-04-24  
**Scope:** Senior Software Architect Analysis - Employer Side  
**Industry Benchmark:** LinkedIn Talent Solutions, Indeed for Employers, SEEK, Glassdoor, Workday Recruiting, Greenhouse, Lever, SmartRecruiters

---

## Executive Summary

The current JobGenie employer portal implements **~30% of enterprise-grade features** expected in a modern recruitment platform. This document provides a comprehensive analysis of:

1. ✅ **Implemented Features** (What exists and works)
2. 🚧 **Partially Developed Features** (Started but incomplete)
3. ❌ **Missing Critical Features** (Must-have for production)
4. ⬆️ **Enhancement Opportunities** (Upgrade existing to enterprise-grade)
5. 🚀 **Strategic New Features** (Industry-standard innovations)

**Priority Approach:** Enhance and complete existing features FIRST, then add new capabilities.

---

## 1. Current Implementation Status Analysis

### 1.1 ✅ FULLY IMPLEMENTED FEATURES

Based on schema analysis and codebase exploration:

#### A. Authentication & Onboarding
- ✅ Email/password registration with verification
- ✅ Multi-step signup wizard with validation
- ✅ Company profile creation workflow
- ✅ Business registration certificate upload
- ✅ Profile completion tracking
- ✅ Password reset functionality
- ✅ Email verification system
- ✅ Sub-admin invitation system (invitation tokens)

#### B. Company Management
- ✅ Company profile CRUD (basic information)
- ✅ Business registration number validation
- ✅ Company logo upload
- ✅ Industry classification
- ✅ Company description and bio
- ✅ Multiple specialities tagging
- ✅ Office location with map link
- ✅ Company size classification

#### C. Multi-Admin System
- ✅ Super admin designation
- ✅ Sub-admin invitation via email
- ✅ Admin profile management
- ✅ Basic admin listing UI

#### D. Approval Workflow (Employer Side View)
- ✅ Approval status tracking (pending/approved/rejected)
- ✅ Status banner UI with real-time updates
- ✅ Approval-based feature gating
- ✅ MIS review tracking fields

#### E. Candidate Discovery & Invitation
- ✅ Browse approved candidates
- ✅ Filter by industry/designation/experience
- ✅ Send job invitations (with/without job posting)
- ✅ Custom message per invitation
- ✅ View candidate profiles
- ✅ Modal-based candidate detail view

#### F. Interview Management (Multi-Round System)
- ✅ Multi-round interview scheduling
- ✅ Offer multiple time slots
- ✅ Alternative date options
- ✅ Online/physical interview mode selection
- ✅ Interview confirmation workflow
- ✅ Meeting link management (manual entry)
- ✅ Interview address for physical meetings
- ✅ Interview cancellation (employer side)
- ✅ Interview feedback submission
- ✅ Round outcome tracking (advance/reject/offer/no_decision)
- ✅ Next round scheduling
- ✅ Interview rounds display UI

#### G. Job Offer System
- ✅ Job offer creation after interview
- ✅ Salary specification (amount, currency, period)
- ✅ Start date and expiry date
- ✅ Offer letter file upload
- ✅ Offer status tracking (pending/accepted/declined/withdrawn)
- ✅ Offer dialog UI

#### H. Pipeline Management (Foundation)
- ✅ Pipeline status enum (active/rejected/offered/hired/withdrawn/expired)
- ✅ Current round number tracking
- ✅ Invitation status lifecycle

---

### 1.2 🚧 PARTIALLY DEVELOPED FEATURES

These features have database models, schema definitions, or placeholder UI but are **incomplete**:

#### A. Job Posting Management (40% Complete)
**What Exists:**
- ✅ `Job` table with full schema (title, location, industry, deadline, description, status)
- ✅ Job status enum (draft/published/paused/closed/archived)
- ✅ Job type enum (full_time/part_time/contract/internship/freelance)
- ✅ API route for fetching active jobs (`/api/employer/jobs/active`)
- ✅ Sidebar navigation item ("Job Postings")

**What's Missing:**
- ❌ Create new job posting UI/API
- ❌ Edit existing job posting UI/API
- ❌ Publish/unpublish job workflow
- ❌ Job posting status management (draft → published → paused → closed)
- ❌ Job posting analytics (views, applications per job)
- ❌ Job posting templates
- ❌ Job duplication feature
- ❌ Bulk job operations
- ❌ Job posting preview before publish
- ❌ Advertisement link management

**Priority:** ⚠️ CRITICAL - Required for core product functionality

#### B. Applications Management (10% Complete)
**What Exists:**
- ✅ Sidebar navigation item ("Applications")
- ✅ Route protection in middleware
- ✅ Invitation system (which acts as targeted outreach, not passive applications)

**What's Missing:**
- ❌ Traditional job application system (candidates apply to jobs)
- ❌ Application inbox/queue for employers
- ❌ Application status workflow (new/reviewing/shortlisted/rejected)
- ❌ Application filtering and sorting
- ❌ Bulk application actions
- ❌ Application notes and tags
- ❌ Application timeline tracking
- ❌ Resume parsing from applications
- ❌ Application export (CSV/Excel)
- ❌ `/employer/applications/page.tsx` implementation

**Priority:** ⚠️ HIGH - Industry-standard feature expected by all employers

#### C. Dashboard Analytics (20% Complete)
**What Exists:**
- ✅ Dashboard page with stat cards UI
- ✅ Hardcoded TODO for stats

**What's Missing:**
- ❌ Real active jobs count
- ❌ Total applications count
- ❌ Shortlisted candidates count
- ❌ New applications (last 7 days) count
- ❌ Recent activity feed
- ❌ Time-to-hire metric
- ❌ Interview-to-offer conversion rate
- ❌ Application funnel visualization
- ❌ Industry benchmarking
- ❌ Trend charts (week-over-week, month-over-month)

**Priority:** ⚠️ HIGH - Executives expect data-driven insights

#### D. Employer Settings (0% Complete)
**What Exists:**
- ✅ Sidebar navigation item
- ✅ Route protection

**What's Missing:**
- ❌ Account settings page (`/employer/settings`)
- ❌ Notification preferences
- ❌ Email notification toggles
- ❌ Change password functionality
- ❌ Profile privacy settings
- ❌ Hiring team preferences
- ❌ Calendar integration settings
- ❌ API key management
- ❌ Webhook configuration
- ❌ Danger zone (company deactivation)

**Priority:** 🔶 MEDIUM - Expected for user control and compliance

#### E. Profile Management (60% Complete)
**What Exists:**
- ✅ View employer profile
- ✅ Basic profile update
- ✅ Profile image upload

**What's Missing:**
- ❌ Social media links (LinkedIn, Twitter, Facebook)
- ❌ Company culture/values section
- ❌ Employee testimonials
- ❌ Office photos gallery
- ❌ Benefits and perks showcase
- ❌ Company video introduction
- ❌ Awards and certifications display
- ❌ Employer branding customization

**Priority:** 🔶 MEDIUM - Important for employer brand perception

---

### 1.3 ❌ MISSING CRITICAL ENTERPRISE FEATURES

Features that are **completely absent** but required for enterprise-grade operation:

#### A. Applicant Tracking System (ATS) Core (0%)
- ❌ Candidate pipeline/kanban view (drag-and-drop stages)
- ❌ Custom pipeline stages per company
- ❌ Stage transition automation
- ❌ Time-in-stage tracking
- ❌ Pipeline analytics (conversion rates per stage)
- ❌ Candidate scoring/rating system
- ❌ Collaborative hiring (team reviews, scorecards)
- ❌ Hiring team roles and permissions
- ❌ Candidate disposition reasons
- ❌ Silver medalist pool (talent CRM)

**Business Impact:** 🔴 CRITICAL - This is core ATS functionality

#### B. Reporting & Analytics Suite (0%)
- ❌ Time-to-hire report
- ❌ Cost-per-hire calculation
- ❌ Source of hire analytics
- ❌ Recruiter performance metrics
- ❌ Job posting effectiveness report
- ❌ Diversity & inclusion dashboard
- ❌ Interview-to-offer ratio
- ❌ Offer acceptance rate
- ❌ Candidate drop-off analysis
- ❌ Custom report builder
- ❌ Scheduled report delivery (email PDF/CSV)
- ❌ Export to Excel/Google Sheets

**Business Impact:** 🔴 CRITICAL - Data-driven decision making requirement

#### C. Communication Hub (0%)
- ❌ In-app messaging with candidates
- ❌ Email template library (rejection, interview invite, offer, etc.)
- ❌ Bulk email campaigns
- ❌ SMS notifications for urgent interviews
- ❌ WhatsApp Business integration
- ❌ Communication history per candidate
- ❌ Auto-response templates
- ❌ Email open and click tracking
- ❌ Interview reminder automation
- ❌ Follow-up task automation

**Business Impact:** 🔴 CRITICAL - Communication is core to recruitment

#### D. Subscription & Billing (0%)
- ❌ Subscription plan management (Free/Pro/Enterprise)
- ❌ Job credit system (X postings per month)
- ❌ Usage tracking and quotas
- ❌ Payment gateway integration (Stripe, PayHere)
- ❌ Invoice generation
- ❌ Payment history
- ❌ Upgrade/downgrade workflow
- ❌ Billing alerts and notifications
- ❌ Promo code support
- ❌ Refund management

**Business Impact:** 🔴 CRITICAL - Revenue blocker for commercialization

#### E. Compliance & Privacy (0%)
- ❌ GDPR/PDPA compliance toolkit
- ❌ Candidate data export (right to data portability)
- ❌ Candidate data deletion (right to be forgotten)
- ❌ Consent management
- ❌ Data retention policy enforcement
- ❌ Audit trail for sensitive operations
- ❌ Data breach notification workflow
- ❌ Privacy policy version tracking
- ❌ Cookie consent management

**Business Impact:** 🔴 CRITICAL - Legal requirement in many jurisdictions

#### F. Integration Platform (0%)
- ❌ Calendar sync (Google Calendar, Outlook)
- ❌ Video conferencing auto-link (Zoom, Teams, Meet)
- ❌ LinkedIn profile import
- ❌ Background check provider integration
- ❌ Assessment platform integration (HackerRank, Codility)
- ❌ E-signature integration (DocuSign)
- ❌ HRIS integration (onboarding handoff)
- ❌ Accounting software sync (QuickBooks, Xero)
- ❌ Job board cross-posting (LinkedIn, Indeed)
- ❌ Zapier/Make.com webhook integrations

**Business Impact:** 🔴 CRITICAL - Modern employers expect integrations

#### G. Advanced Search & Matching (0%)
- ❌ Boolean search (advanced candidate queries)
- ❌ Saved searches with alerts
- ❌ AI-powered candidate matching
- ❌ Skills-based matching
- ❌ Salary expectation matching
- ❌ Location-based search (radius)
- ❌ Availability-based filtering
- ❌ Experience level matching
- ❌ Education requirement matching
- ❌ Candidate recommendation engine

**Business Impact:** 🔴 CRITICAL - Core talent discovery capability

#### H. Mobile Responsiveness & Native Apps (Partial)
- ❌ Fully responsive mobile UI (partially done)
- ❌ Native iOS app
- ❌ Native Android app
- ❌ Mobile push notifications
- ❌ Offline mode support
- ❌ Mobile-optimized interview scheduling
- ❌ Quick actions on mobile

**Business Impact:** 🟡 HIGH - Mobile-first world requirement

---

## 2. Enterprise Enhancement Roadmap (Existing Features)

**Philosophy:** Enhance what exists BEFORE building new features.

### Phase 1: Core Feature Enhancement (Weeks 1-8)

#### 2.1 Enhance: Dashboard (Currently 20% Enterprise-Grade)

**Current State:** Static placeholder stats, no real data

**Enterprise Enhancements:**

**A. Real-Time KPI Dashboard**
```
Priority: P0 (Must-Have)
Effort: 3 weeks
Dependencies: Database queries, caching layer
```

**Features to Add:**
1. **Real Metrics from Database:**
   - Active jobs count (status = 'published')
   - Total invitations sent (all-time)
   - Active candidates in pipeline (status != 'rejected|withdrawn')
   - Interview scheduled count (next 7/30 days)
   - Offers pending acceptance
   - Average time-to-hire (days from invitation → hire)
   - Interview-to-offer conversion rate
   - Offer acceptance rate

2. **Time-Series Visualization:**
   - Line chart: Invitations sent per week (last 12 weeks)
   - Bar chart: Interviews per month (last 6 months)
   - Funnel chart: Invitation → Interview → Offer → Hire

3. **Quick Actions Panel:**
   - "Post a Job" button
   - "Browse Candidates" button
   - "Schedule Interview" quick link
   - "Review Applications" (when implemented)

4. **Recent Activity Feed:**
   - Last 10 activities with timestamps
   - "Candidate X accepted interview for Y position"
   - "Offer sent to Candidate Z"
   - "New application for Job ABC"
   - Click to navigate to detail

5. **Performance Indicators:**
   - Traffic light indicators (green/amber/red)
   - "Jobs with no applications in 7 days" alert
   - "Pending interviews expiring soon" alert
   - "Candidates waiting for feedback" count

**Database Queries Required:**
```sql
-- Sample queries needed
SELECT COUNT(*) FROM jobs WHERE status = 'published' AND company_id = ?;
SELECT COUNT(*) FROM job_invitations WHERE employer_id = ? AND status IN ('pending', 'accepted');
SELECT AVG(EXTRACT(EPOCH FROM (closed_at - sent_at)) / 86400) as avg_days 
FROM job_invitations 
WHERE pipeline_status = 'hired' AND employer_id = ?;
```

**UI/UX Improvements:**
- Replace static cards with animated counters
- Add skeleton loading states
- Add refresh button with last-updated timestamp
- Add date range selector (Last 7/30/90/365 days)
- Export dashboard as PDF report

---

#### 2.2 Enhance: Multi-Round Interview System (Currently 60% Enterprise-Grade)

**Current State:** Basic multi-round scheduling exists, but lacks sophistication

**Enterprise Enhancements:**

**A. Interview Scheduling Intelligence**
```
Priority: P0 (Must-Have)
Effort: 4 weeks
Dependencies: Calendar API integration
```

**Features to Add:**
1. **Calendar Integration:**
   - Sync with Google Calendar / Outlook
   - Auto-block time slots based on employer calendar
   - Send calendar invites to both parties
   - Update calendar on reschedule/cancel
   - Detect conflicts and suggest alternatives

2. **Auto-Link Generation for Video Interviews:**
   - Integrate Zoom API (auto-create meeting on confirm)
   - Integrate Google Meet API
   - Integrate Microsoft Teams API
   - Store join link in `meeting_link` field
   - Send join link in confirmation email
   - Show "Join Interview" button 15 mins before start

3. **Interview Preparation Checklist:**
   - Employer pre-interview checklist (review resume, prepare questions)
   - Interview scorecard template assignment
   - Interview panel assignment (multi-interviewer support)
   - Automated reminder emails (24h, 1h before interview)

4. **Interview Recording & Notes:**
   - In-app note-taking during interview
   - Upload interview recording (optional, with consent)
   - Time-stamped notes
   - Tag key moments ("strong technical answer", "concern about X")

5. **Post-Interview Workflow:**
   - Mandatory feedback form (cannot proceed without feedback)
   - Structured scorecard evaluation (1-5 scale per criterion)
   - Collaborative decision (if multiple interviewers)
   - Auto-reminder if feedback not submitted within 24h
   - Feedback visibility to hiring team

**Schema Extensions:**
```sql
-- Add to InterviewRound table
ALTER TABLE interview_rounds ADD COLUMN calendar_event_id VARCHAR(255);
ALTER TABLE interview_rounds ADD COLUMN zoom_meeting_id VARCHAR(255);
ALTER TABLE interview_rounds ADD COLUMN zoom_join_url TEXT;
ALTER TABLE interview_rounds ADD COLUMN interview_notes TEXT;
ALTER TABLE interview_rounds ADD COLUMN scorecard_data JSONB;
ALTER TABLE interview_rounds ADD COLUMN interviewer_user_ids UUID[];
```

**B. Interview Analytics Dashboard**
```
Priority: P1 (Should-Have)
Effort: 2 weeks
```

**Features to Add:**
- No-show rate per job/employer
- Average interview duration
- Interview-to-offer conversion rate per round
- Feedback sentiment analysis
- Time-to-feedback metric (should be < 24h)

---

#### 2.3 Enhance: Candidate Invitation System (Currently 50% Enterprise-Grade)

**Current State:** Basic invitation with time slots, lacks sophistication

**Enterprise Enhancements:**

**A. Advanced Invitation Management**
```
Priority: P1 (Should-Have)
Effort: 3 weeks
```

**Features to Add:**
1. **Bulk Invitation Actions:**
   - Select multiple candidates from search
   - Send same invitation to batch (with personalization tokens)
   - Template library for invitation messages
   - Invitation preview before send
   - Schedule send time (drip campaigns)

2. **Invitation Templates:**
   - Pre-built message templates
   - Industry-specific templates (IT, Banking, Finance)
   - Merge tags: `{{candidate_name}}`, `{{job_title}}`, `{{company_name}}`
   - Template performance analytics (open rate, response rate)

3. **Follow-Up Automation:**
   - Auto-follow-up if no response in X days
   - Escalation workflow (notify hiring manager if candidate declines)
   - Auto-archive expired invitations

4. **Invitation Analytics:**
   - Per-job invitation performance
   - Response rate by industry/designation
   - Time-to-response metric
   - A/B test different message templates

**Schema Extensions:**
```sql
CREATE TABLE invitation_templates (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES employers(id),
  template_name VARCHAR(200),
  subject VARCHAR(255),
  body TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  response_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 2.4 Enhance: Company Profile (Currently 60% Enterprise-Grade)

**Current State:** Basic company information, lacks employer branding

**Enterprise Enhancements:**

**A. Employer Brand Showcase**
```
Priority: P2 (Nice-to-Have)
Effort: 3 weeks
```

**Features to Add:**
1. **Rich Media Gallery:**
   - Office photos (multiple images)
   - Company culture video (YouTube/Vimeo embed)
   - Team photos
   - Event photos (company outings, hackathons)
   - Image carousel on profile page

2. **Social Proof Elements:**
   - Employee testimonials (with photo + designation)
   - Awards and certifications (logos + descriptions)
   - Industry recognitions
   - "Top Employer 2026" badges
   - Glassdoor rating embed (if available)

3. **Benefits & Perks Catalog:**
   - Health insurance
   - Flexible working hours
   - Remote work options
   - Professional development budget
   - Gym membership
   - Free lunch
   - Stock options/ESOP
   - Icons + descriptions

4. **Company Culture Page:**
   - Core values (drag-and-drop order)
   - Mission and vision statements
   - Diversity & inclusion statement
   - Work-life balance description
   - Career growth opportunities

5. **Social Media Integration:**
   - LinkedIn company page link
   - Twitter feed embed
   - Facebook page link
   - Instagram feed (if relevant)
   - Auto-fetch latest posts

**Schema Extensions:**
```sql
CREATE TABLE company_media (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  media_type VARCHAR(50), -- 'image', 'video', 'embed'
  media_url VARCHAR(500),
  caption TEXT,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_testimonials (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  employee_name VARCHAR(100),
  employee_designation VARCHAR(200),
  employee_photo_url VARCHAR(255),
  testimonial_text TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_benefits (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  benefit_category VARCHAR(100), -- 'health', 'financial', 'work-life', 'development'
  benefit_name VARCHAR(200),
  benefit_description TEXT,
  icon_name VARCHAR(50), -- Lucide icon name
  is_active BOOLEAN DEFAULT true
);
```

---

#### 2.5 Enhance: Sub-Admin Management (Currently 40% Enterprise-Grade)

**Current State:** Basic invitation and listing, no permissions

**Enterprise Enhancements:**

**A. Role-Based Access Control (RBAC)**
```
Priority: P0 (Must-Have)
Effort: 4 weeks
Dependencies: Permission matrix design
```

**Features to Add:**
1. **Hierarchical Roles:**
   - **Super Admin:** Full access (cannot be restricted)
   - **Hiring Manager:** Create jobs, interview candidates, extend offers
   - **Recruiter:** Browse candidates, send invitations, schedule interviews (no offer authority)
   - **Interviewer:** View assigned candidates, submit feedback (read-only on pipeline)
   - **Billing Admin:** Manage subscriptions, invoices (no candidate access)
   - **Custom Role:** Define granular permissions

2. **Permission Matrix:**
   | Resource | View | Create | Edit | Delete | Special |
   |----------|------|--------|------|--------|---------|
   | Jobs | ✓ | ✓ | ✓ | ✓ | Publish, Archive |
   | Candidates | ✓ | ✗ | ✗ | ✗ | Invite, Message |
   | Invitations | ✓ | ✓ | ✓ | ✓ | Cancel |
   | Interviews | ✓ | ✓ | ✓ | ✓ | Reschedule, Feedback |
   | Offers | ✓ | ✓ | ✗ | ✓ | Extend, Withdraw |
   | Company Profile | ✓ | ✗ | ✓ | ✗ | - |
   | Admins | ✓ | ✓ | ✓ | ✓ | - |
   | Billing | ✓ | ✗ | ✓ | ✗ | - |
   | Reports | ✓ | ✗ | ✗ | ✗ | Export |

3. **Admin Activity Tracking:**
   - Audit log per admin (who did what when)
   - Last login tracking
   - Active session management
   - Force logout capability (by super admin)
   - Failed login attempt tracking

4. **Admin Lifecycle Management:**
   - Invite with specific role
   - Role change workflow
   - Temporary access grants (expires after X days)
   - Deactivate admin (soft delete)
   - Admin onboarding checklist

**Schema Extensions:**
```sql
CREATE TABLE employer_roles (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  role_name VARCHAR(100),
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- cannot be deleted if true
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employer_permissions (
  id UUID PRIMARY KEY,
  permission_name VARCHAR(100) UNIQUE, -- 'jobs.create', 'offers.extend'
  resource VARCHAR(50), -- 'jobs', 'candidates', 'offers'
  action VARCHAR(50), -- 'view', 'create', 'edit', 'delete', 'publish'
  description TEXT
);

CREATE TABLE employer_role_permissions (
  role_id UUID REFERENCES employer_roles(id),
  permission_id UUID REFERENCES employer_permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to employers table
ALTER TABLE employers ADD COLUMN role_id UUID REFERENCES employer_roles(id);
ALTER TABLE employers ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE employers ADD COLUMN last_login_ip VARCHAR(45);
ALTER TABLE employers ADD COLUMN login_attempt_count INT DEFAULT 0;
ALTER TABLE employers ADD COLUMN account_locked_until TIMESTAMPTZ;
```

---

## 3. Critical Missing Features Implementation (Priority Order)

### Phase 2: Core Missing Features (Weeks 9-20)

#### 3.1 Job Posting Management (CRITICAL - Week 9-12)

**Epic:** Complete job posting lifecycle from creation to archival

**User Stories:**

**US-01: Create Job Posting**
```
As a hiring manager,
I want to create a new job posting with all details,
So that I can attract qualified candidates.

Acceptance Criteria:
- Form with fields: job_title, location, industry, job_type, deadline, description, advertisement_link
- Rich text editor for description (Markdown support)
- Industry dropdown (pre-populated from master data)
- Job type selection (full_time, part_time, contract, internship, freelance)
- Save as draft functionality
- Validation: required fields, deadline must be future date
- Success message with option to "Publish Now" or "Continue Editing"
```

**UI Components:**
```tsx
// File: src/app/employer/(dashboard)/jobs/new/page.tsx
// Multi-step form wizard:
// Step 1: Basic Details (title, location, job_type)
// Step 2: Job Description (rich text editor)
// Step 3: Requirements (skills, experience, education)
// Step 4: Additional Info (salary range, deadline, ad link)
// Step 5: Review & Publish
```

**API Endpoints Required:**
```typescript
// POST /api/employer/jobs - Create job
// PUT /api/employer/jobs/[id] - Update job
// DELETE /api/employer/jobs/[id] - Delete job
// POST /api/employer/jobs/[id]/publish - Publish job
// POST /api/employer/jobs/[id]/pause - Pause job
// POST /api/employer/jobs/[id]/close - Close job
// POST /api/employer/jobs/[id]/archive - Archive job
// POST /api/employer/jobs/[id]/duplicate - Duplicate job
// GET /api/employer/jobs - List all jobs with filters
// GET /api/employer/jobs/[id] - Get job details
```

**US-02: Job Listing View**
```
As a hiring manager,
I want to see all my job postings in a table,
So that I can manage them efficiently.

Acceptance Criteria:
- Table with columns: Job Title, Status, Applications, Views, Posted Date, Deadline, Actions
- Filter by status (all, draft, published, paused, closed, archived)
- Search by job title
- Sort by any column
- Pagination (20 per page)
- Quick actions: Edit, Duplicate, Pause/Resume, Close, Archive, View
- Bulk actions: Pause selected, Close selected, Archive selected
- Status badges with colors: Draft (gray), Published (green), Paused (yellow), Closed (red)
```

**US-03: Job Analytics Per Posting**
```
As a hiring manager,
I want to see performance metrics for each job,
So that I can optimize my job postings.

Metrics to Display:
- Total views (unique candidates who viewed the job)
- Total applications received
- Application conversion rate (views → applications)
- Invitation sent count (for this job)
- Interview scheduled count
- Offers extended count
- Average time-to-hire for this job
- Top traffic sources (organic search, LinkedIn, Indeed, direct)
```

**Database Enhancements:**
```sql
-- Add view tracking
CREATE TABLE job_views (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  referrer VARCHAR(255),
  ip_address VARCHAR(45)
);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_candidate_id ON job_views(candidate_id);

-- Add to jobs table
ALTER TABLE jobs ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN application_count INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN salary_min DECIMAL(12,2);
ALTER TABLE jobs ADD COLUMN salary_max DECIMAL(12,2);
ALTER TABLE jobs ADD COLUMN salary_currency VARCHAR(10) DEFAULT 'LKR';
ALTER TABLE jobs ADD COLUMN required_experience_years INT;
ALTER TABLE jobs ADD COLUMN required_education VARCHAR(100);
ALTER TABLE jobs ADD COLUMN required_skills TEXT[]; -- Array of skill names
ALTER TABLE jobs ADD COLUMN remote_option BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN visa_sponsorship BOOLEAN DEFAULT false;
```

---

#### 3.2 Applications Management System (CRITICAL - Week 13-16)

**Epic:** Implement traditional job application workflow alongside invitation system

**Architecture Decision:**
- Current system: Employer-initiated (employer invites candidates)
- New system: Candidate-initiated (candidates apply to jobs)
- Both systems coexist: Invitations + Applications

**User Stories:**

**US-04: Candidate Applies to Job (Candidate Side)**
```
As a candidate,
I want to apply to a published job,
So that I can be considered for the position.

Acceptance Criteria:
- "Apply" button on job detail page
- Application form: Cover letter (optional), Resume selection
- Validation: Resume must be uploaded first
- One-click apply for candidates with complete profiles
- Confirmation message after successful application
- Cannot apply twice to the same job
- Cannot apply if already invited to the same job
```

**US-05: Application Inbox (Employer Side)**
```
As a hiring manager,
I want to see all applications received for my jobs,
So that I can review and respond to applicants.

Acceptance Criteria:
- Table with columns: Candidate, Job Applied, Applied Date, Status, Resume, Actions
- Filter by: Job, Status (new, reviewing, shortlisted, interview, offered, rejected), Date range
- Sort by: Applied date (most recent first), Candidate name
- Search by candidate name
- Bulk select and change status
- Quick actions: View Profile, Download Resume, Shortlist, Reject, Invite to Interview
- "New" badge for unreviewed applications
- Application count per status in header cards
```

**US-06: Application Status Workflow**
```
Status Lifecycle:
1. New → Just received, not yet reviewed
2. Reviewing → Employer is actively reviewing
3. Shortlisted → Moved to shortlist for interview consideration
4. Interview → Interview scheduled (links to interview_rounds)
5. Offered → Job offer extended
6. Rejected → Application rejected
7. Withdrawn → Candidate withdrew application
8. Hired → Candidate accepted offer and hired
```

**Database Schema:**
```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Application content
  cover_letter TEXT,
  resume_url VARCHAR(255), -- Can differ from candidate's primary resume
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'new', -- new, reviewing, shortlisted, interview, offered, rejected, withdrawn, hired
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID, -- employer user_id
  
  -- Employer actions
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID, -- employer user_id
  shortlisted_at TIMESTAMPTZ,
  shortlisted_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejection_reason TEXT,
  
  -- Internal notes
  employer_notes TEXT, -- Private notes for hiring team
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  tags TEXT[], -- Array of tags like ['strong-candidate', 'needs-more-experience']
  
  -- Linking to invitation/interview
  invitation_id UUID REFERENCES job_invitations(id), -- If converted to invitation
  
  -- Metadata
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  
  -- Source tracking
  application_source VARCHAR(100), -- 'direct', 'linkedin', 'indeed', 'referral'
  referrer_id UUID, -- If referred by another user
  
  UNIQUE(job_id, candidate_id) -- Cannot apply twice
);

CREATE INDEX idx_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX idx_applications_company_id ON job_applications(company_id);
CREATE INDEX idx_applications_status ON job_applications(status);
CREATE INDEX idx_applications_applied_at ON job_applications(applied_at);
```

**API Endpoints:**
```typescript
// Candidate-facing
POST /api/candidate/jobs/[id]/apply - Submit application
DELETE /api/candidate/applications/[id] - Withdraw application
GET /api/candidate/applications - List my applications
GET /api/candidate/applications/[id] - Get application detail

// Employer-facing
GET /api/employer/applications - List applications with filters
GET /api/employer/applications/[id] - Get application detail
PATCH /api/employer/applications/[id]/status - Change status
PATCH /api/employer/applications/[id]/notes - Add/update notes
POST /api/employer/applications/[id]/convert-to-invitation - Convert to invitation
POST /api/employer/applications/bulk-action - Bulk status change
POST /api/employer/applications/export - Export as CSV
```

---

#### 3.3 Reporting & Analytics Suite (HIGH PRIORITY - Week 17-20)

**Epic:** Comprehensive reporting dashboard for data-driven hiring decisions

**US-07: Time-to-Hire Report**
```
Metric: Average days from job published to candidate hired

Components:
- Overall average (all jobs)
- Per-job breakdown
- Trend chart (month-over-month)
- Bottleneck identification (which stage takes longest?)
- Industry benchmark comparison

Visualization: Line chart + table
```

**US-08: Funnel Analytics**
```
Funnel Stages:
1. Job Published
2. Applications Received (or Invitations Sent)
3. Interview Scheduled
4. Interview Completed
5. Offer Extended
6. Offer Accepted
7. Candidate Hired

Display:
- Funnel chart with conversion rates per stage
- Drop-off analysis (where do most candidates drop out?)
- Recommendations to improve each stage
```

**US-09: Source of Hire**
```
Track where hired candidates came from:
- Direct applications (via JobGenie)
- Employer invitations
- LinkedIn referrals
- Indeed cross-posts
- Employee referrals
- Other

Visualization: Pie chart + table
Insight: Which source has highest quality candidates?
```

**US-10: Recruiter Performance Dashboard**
```
Metrics per employer user (recruiter/hiring manager):
- Invitations sent
- Response rate
- Interview scheduled count
- Offers extended
- Offers accepted
- Average time-to-hire
- Candidate satisfaction score (if feedback collected)

Leaderboard: Top performers of the month
```

**Implementation:**
```tsx
// File: src/app/employer/(dashboard)/reports/page.tsx
// Tabs:
// - Overview (key metrics cards)
// - Time-to-Hire
// - Funnel Analysis
// - Source of Hire
// - Recruiter Performance
// - Custom Reports (query builder)

// Use Recharts or Chart.js for visualizations
// Add date range picker (last 7/30/90/365 days, custom range)
// Export button (PDF, CSV, Excel)
```

---

## 4. Strategic Enterprise Features (Future Phase)

### Phase 3: Differentiation & Scale (Weeks 21-40)

#### 4.1 AI-Powered Candidate Matching

**Features:**
- AI resume screening (auto-score candidates against job requirements)
- Skill extraction from resumes using NLP
- Candidate-job fit score (0-100%)
- Diversity recommendations (ensure diverse shortlist)
- Bias detection in job descriptions
- Predictive analytics (likelihood of candidate accepting offer)

**Tech Stack:**
- OpenAI GPT-4 API for resume parsing
- pgvector extension for semantic search
- Vector embeddings for skills matching
- ML model for fit scoring

**Implementation Estimate:** 8 weeks

---

#### 4.2 Collaborative Hiring Workspace

**Features:**
- Team hiring spaces (per job)
- Collaborative candidate evaluation (multi-reviewer scorecards)
- Comment threads on candidate profiles
- @mention team members
- Approval workflows (hiring manager → department head → HR)
- Interview panel scheduling (find common availability)
- Decision consensus tracking

**Tech Stack:**
- Supabase Realtime for collaborative features
- WebSocket connections for live updates
- Presence indicators (who's viewing this candidate now)

**Implementation Estimate:** 6 weeks

---

#### 4.3 Subscription & Monetization Engine

**Pricing Tiers:**

**Free Tier:**
- 1 active job posting
- 10 invitations per month
- Basic analytics
- Email support

**Pro Tier ($99/month):**
- 5 active job postings
- 100 invitations per month
- Advanced analytics
- Calendar integration
- Priority support

**Enterprise Tier ($499/month):**
- Unlimited job postings
- Unlimited invitations
- White-label branding
- API access
- Dedicated account manager
- Custom integrations

**Implementation:**
- Stripe payment gateway
- PayHere for Sri Lankan local payments
- Usage tracking middleware
- Quota enforcement
- Upgrade/downgrade workflows
- Invoice generation (PDF)
- Payment reminder automation

**Implementation Estimate:** 6 weeks

---

#### 4.4 Multi-Language Support (i18n)

**Languages:**
- English (default)
- Sinhala
- Tamil

**Implementation:**
- next-i18next library
- Translation files in `/public/locales/`
- Language switcher in header
- RTL support for certain languages
- Database content translation (job descriptions, company bios)

**Implementation Estimate:** 4 weeks

---

#### 4.5 Mobile Apps (iOS & Android)

**Features:**
- Native mobile UI
- Push notifications
- Offline mode (view cached candidates)
- Mobile-optimized interview scheduling
- Quick actions (approve/reject with swipe)
- Camera integration (take photo in interview, upload later)

**Tech Stack:**
- React Native or Flutter
- Shared business logic with web
- Deep linking (email → open in app)

**Implementation Estimate:** 16 weeks (full-featured apps)

---

## 5. Technical Architecture Enhancements

### 5.1 Performance & Scalability

**Current Gaps:**
- No caching layer
- No read replicas for analytics queries
- No CDN for static assets
- No background job processing

**Enhancements:**

**A. Caching Strategy**
```typescript
// Redis caching for:
- Company profiles (TTL: 1 hour)
- Job listings (TTL: 15 mins)
- Candidate search results (TTL: 5 mins)
- Dashboard stats (TTL: 5 mins)

// Implementation:
// Use Upstash Redis or Supabase Realtime
```

**B. Database Optimization**
```sql
-- Add missing indexes
CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX idx_invitations_employer_status ON job_invitations(employer_id, status);
CREATE INDEX idx_applications_job_status ON job_applications(job_id, status);

-- Partitioning for large tables
-- Partition event_logs by month
CREATE TABLE event_logs_2026_04 PARTITION OF event_logs
FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

**C. Background Job Processing**
```typescript
// Use pg_cron or external queue (BullMQ with Redis)

// Jobs to background:
- Email sending (bulk invitations, reports)
- Report generation (PDF exports)
- Data exports (CSV)
- Audit log writing
- Analytics aggregation
- Reminder notifications
```

**D. API Rate Limiting**
```typescript
// Per employer rate limits:
// - 100 requests per minute (general)
// - 10 invitations per minute (prevent spam)
// - 5 job posts per hour

// Implementation: Use Supabase Edge Functions with Deno KV
```

---

### 5.2 Security Enhancements

**A. Row-Level Security (RLS) Hardening**
```sql
-- Ensure all employer tables have RLS policies
-- Example: Employers can only access their own company's data

CREATE POLICY "Employers can view own company jobs"
ON jobs FOR SELECT
USING (company_id IN (
  SELECT company_id FROM employers WHERE user_id = auth.uid()
));

CREATE POLICY "Employers can update own company jobs"
ON jobs FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM employers WHERE user_id = auth.uid()
));
```

**B. API Endpoint Security Audit**
```typescript
// Checklist for all /api/employer/* endpoints:
// ✅ Authentication check (valid session)
// ✅ Authorization check (user is employer role)
// ✅ Resource ownership check (employer belongs to company that owns resource)
// ✅ Input validation (Zod schema)
// ✅ Rate limiting
// ✅ Audit logging (log all mutations)
```

**C. File Upload Security**
```typescript
// Enhancements:
- Virus scanning (ClamAV or VirusTotal API)
- File type validation (magic bytes, not just extension)
- File size limits (10MB for resumes, 5MB for logos)
- Signed URLs with short expiry (15 mins for downloads)
- Watermarking for sensitive documents
```

**D. Multi-Factor Authentication (MFA)**
```typescript
// For super admins (high-privilege accounts)
- TOTP (Google Authenticator)
- SMS OTP (Twilio)
- Email OTP
- Enforce MFA for super admins
- Backup codes generation
```

---

### 5.3 Observability & Monitoring

**A. Logging Infrastructure**
```typescript
// Centralized logging:
- Use existing event_logs, api_request_logs, error_logs tables
- Build MIS UI to view logs (already planned)
- Add log levels: DEBUG, INFO, WARN, ERROR, FATAL
- Structured logging (JSON format)
- Log aggregation tool (Grafana Loki or ELK stack)
```

**B. Error Tracking**
```typescript
// Integrate Sentry or Rollbar
// Capture:
- JavaScript errors (client-side)
- API errors (server-side)
- Unhandled promise rejections
- User context (user_id, role, action)
- Breadcrumbs (user actions leading to error)
```

**C. Performance Monitoring**
```typescript
// Metrics to track:
- API response times (p50, p95, p99)
- Database query duration
- Page load times (Core Web Vitals)
- User session duration
- Feature usage analytics

// Tools: Vercel Analytics, Google Analytics 4, or custom
```

**D. Alerting**
```typescript
// Alerts to set up:
- Error rate > 1% (critical)
- API response time > 2s for p95 (warning)
- Database connection pool exhausted (critical)
- Storage quota > 80% (warning)
- Payment failure (critical, notify billing team)
- Scheduled job failure (warning)
```

---

## 6. Implementation Priority Matrix

### Priority Framework:
- **P0 (Critical):** Revenue blockers, legal compliance, security
- **P1 (High):** Core product functionality, user-requested features
- **P2 (Medium):** UX improvements, nice-to-have features
- **P3 (Low):** Future vision, experimental features

---

### Recommended 6-Month Roadmap

**Month 1-2: Foundation & Quick Wins**
- ✅ Complete job posting management (P0)
- ✅ Implement applications system (P0)
- ✅ Enhance dashboard with real analytics (P1)
- ✅ Build employer settings page (P1)
- ✅ Add RBAC for sub-admins (P0)

**Month 3-4: Advanced Features**
- ✅ Build reporting suite (P1)
- ✅ Enhance interview system (calendar integration, video links) (P1)
- ✅ Implement communication hub (email templates, bulk messaging) (P1)
- ✅ Add candidate pipeline/kanban view (P1)
- ✅ Build employer profile enhancements (branding, testimonials) (P2)

**Month 5-6: Scale & Differentiation**
- ✅ Implement billing & subscriptions (P0 for commercialization)
- ✅ Add AI candidate matching (P2)
- ✅ Build integration platform (calendar, video, LinkedIn) (P1)
- ✅ Add multi-language support (P2)
- ✅ Launch mobile-responsive optimizations (P1)

---

## 7. Success Metrics & KPIs

**Product Metrics:**
- Job posting creation rate (target: 80% of employers post ≥1 job within first week)
- Application volume per job (target: avg 15 applications/job)
- Interview conversion rate (target: 30% of invitations → scheduled interview)
- Offer acceptance rate (target: 70% of offers accepted)
- Time-to-hire (target: <21 days from job post to hire)

**Engagement Metrics:**
- Daily active employers (DAU)
- Weekly active employers (WAU)
- Session duration (target: >8 mins)
- Feature adoption rate (% of employers using advanced features)
- Retention rate (% of employers returning month-over-month)

**Revenue Metrics (Post-Billing Implementation):**
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)
- Churn rate (target: <5% monthly)
- Free-to-paid conversion rate (target: >10%)

**Quality Metrics:**
- Candidate satisfaction score (CSAT for employer experience)
- Time-to-value (days from signup to first interview scheduled)
- Support ticket volume (target: <2% of users submit ticket/month)
- Error rate (target: <0.1% of requests)
- Page load time (target: <2s for p95)

---

## 8. Conclusion & Recommendations

### Key Findings:
1. **Current State:** Employer portal has ~30% of expected enterprise features
2. **Biggest Gap:** Billing/monetization, reporting/analytics, full job posting lifecycle
3. **Strongest Asset:** Robust database schema already designed for scale
4. **Quick Wins:** Many features just need UI implementation (schema exists)

### Recommended Approach:
1. **Phase 1 (Weeks 1-8):** Enhance existing features to production-grade
2. **Phase 2 (Weeks 9-20):** Implement critical missing features (jobs, applications, reports)
3. **Phase 3 (Weeks 21-40):** Strategic differentiation (AI, integrations, mobile)

### Critical Path Items:
- ✅ Job posting management (blocks employer value prop)
- ✅ Applications system (industry-standard expectation)
- ✅ Billing engine (blocks revenue generation)
- ✅ Reporting suite (enterprise buyers require this)
- ✅ RBAC for teams (multi-user companies need this)

### Technical Debt to Address:
- Add comprehensive caching layer
- Implement background job processing
- Set up monitoring and alerting
- Conduct security audit on all API endpoints
- Add automated testing (unit + integration)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-24  
**Author:** Senior Software Architect Analysis  
**Next Review:** After Phase 1 completion (Week 8)
