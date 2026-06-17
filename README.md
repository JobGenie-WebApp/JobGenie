# JobGenie 🧞‍♂️

A modern job portal platform built with Next.js 16, React 19, and Supabase. JobGenie connects job seekers with employers through an intuitive, feature-rich interface.

## ✨ Features

### For Candidates
- 📝 **User Registration** - Complete signup flow with email verification
- 🔐 **Secure Authentication** - Supabase Auth with password hashing
- 📧 **Email Verification** - OTP-based verification with NodeMailer
- 🏠 **Dashboard** - Modern collapsible sidebar with navigation
- 👤 **Profile Management** - Update personal information
- 💼 **Job Search** - Browse available positions
- 📄 **Applications** - Track job application status

### For Employers
- 🏢 **Company Registration** - Employer signup flow
- 📋 **Job Posting** - Create and manage job listings
- 👥 **Candidate Management** - Review applications

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Backend** | Supabase (Auth + Database) |
| **ORM** | Prisma 7 |
| **State** | Redux Toolkit |
| **Email** | NodeMailer |
| **Icons** | Lucide React |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── candidate/          # Candidate routes
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   ├── signup/         # Registration
│   │   └── verify-email/   # Email verification
│   ├── employer/           # Employer routes
│   ├── login/              # Login page
│   └── api/                # API routes
├── components/
│   ├── candidate/          # Candidate-specific components
│   ├── landing/            # Landing page components
│   ├── layout/             # Header, Footer
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase client utilities
│   ├── validations/        # Zod schemas
│   └── utils/              # Helper functions
└── store/                  # Redux store
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/jobgenie.git
   cd jobgenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following in `.env`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   
   # SMTP (for email verification)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components:
- Button, Input, Label
- Select, Radio Group
- Avatar, Dropdown Menu
- Sidebar, Tooltip
- Sheet, Separator

## 🔐 Authentication Flow

1. **Registration** → Email + Password + Profile info
2. **Email Verification** → 6-digit OTP sent via email (valid for 15 minutes)
3. **Login** → Email + Password
4. **Session** → Supabase Auth + cookies

## 📧 Email Configuration

See `email.config.example` for SMTP setup instructions, including:
- Gmail with App Passwords
- Outlook/Microsoft
- Custom SMTP servers

## 🌙 Theme Support

The app supports both light and dark modes:
- Toggle available in user dropdown menu
- System preference detection
- Persistent theme selection

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ by the JobGenie Team
