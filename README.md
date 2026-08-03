# LOOP AI — Customer Feedback Intelligence Platform 🚀
> Official Zidio Development Internship Project Brief v1.0 Implementation

Transform scattered customer quotes from Support Tickets, App Store Reviews, NPS Surveys, Sales Notes, and Community Posts into ranked, evidence-backed product insights with real-time sentiment analysis, AI theme clustering, grounded RAG Q&A, and Voice-of-Customer executive digests.

---

## 🏛️ Project Architecture & Tech Stack

- **Core Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database & ORM**: PostgreSQL (Supabase Compatible) & Prisma ORM (`v6.19.3`)
- **Authentication**: NextAuth.js / Auth.js with JWT session strategy, bcrypt password hashing, and OAuth SSO (Google & GitHub)
- **UI & Styling**: Tailwind CSS, Lucide Icons, Glassmorphism Aesthetics
- **Data Visualization**: Recharts (Volume streams, sentiment donut charts, theme bar graphs)
- **Validation**: Zod v4 (Strict schema validation across REST APIs)
- **AI Systems**: Grounded RAG Q&A with quote citations (`/api/ai/ask`), automatic sentiment classification, theme spike detection, and Voice-of-Customer executive digests.

---

## 👥 Seeded Demo Credentials

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Workspace Admin** | `admin@loop.ai` | `Password123!` | Full control over workspace, members, settings, and audit logs |
| **Analyst** | `analyst@loop.ai` | `Password123!` | Ingest feedback, run AI analysis, generate VoC reports, CSV export |
| **Viewer** | `viewer@loop.ai` | `Password123!` | Read-only access to dashboards, feedback inbox, and reports |

---

## 🚀 Quick Setup & Installation Guide

### 1. Environment Configuration (`.env`)
Create a `.env` file in the project root:

```env
# Database Connections
DATABASE_URL="postgresql://postgres:password@localhost:5432/loop_ai?sslmode=disable"
DIRECT_URL="postgresql://postgres:password@localhost:5432/loop_ai?sslmode=disable"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-32-chars"

# Execution Mode (Set "true" for isolated demo data fallback, "false" for production DB)
DEMO_MODE="false"

# OAuth SSO Credentials (Optional for production)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Resend API Key for Email Verification & Invites
RESEND_API_KEY="re_123456789"
```

### 2. Database Migration & Seeding
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database schema migrations
npx prisma db push

# Seed production database with 120 feedback quotes, 3 roles, and Acme workspace
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Key Folder Structure

```text
loop-ai-customer-feedback/
├── app/
│   ├── (app)/                   # App Shell Layout & Authenticated Pages
│   │   ├── dashboard/           # Real-time Executive Insights Dashboard
│   │   ├── feedback/            # Feedback Triage Inbox & Detail Modal
│   │   ├── analytics/           # Sentiment & Channel Analytics
│   │   ├── ai-assistant/        # Grounded RAG Ask LOOP Q&A Chat
│   │   ├── reports/             # Voice-of-Customer Digest Generator
│   │   ├── profile/             # Dynamic User Profile & Password Change
│   │   └── settings/            # Workspace Settings, Team Members, API Keys
│   ├── api/                     # REST API Endpoint Handlers
│   │   ├── auth/                # NextAuth, Email Verify, Password Reset, MFA
│   │   ├── feedback/            # Feedback CRUD & CSV Import
│   │   ├── members/             # Team Invites & RBAC Management
│   │   ├── dashboard/           # Aggregate Stats API
│   │   ├── reports/             # VoC Executive Report API
│   │   └── ai/                  # Ask LOOP RAG Chat Endpoint
│   └── components/              # Landing Page Sections (Hero, Features, Pricing)
├── components/                  # Global Reusable UI Components
│   ├── common/                  # Card, Modal, SearchBar, SecretKeyMasker
│   ├── layout/                  # DashboardLayout, Topbar, Sidebar
│   └── providers/               # NextAuth Client AuthProvider Wrapper
├── lib/
│   ├── auth.ts                  # NextAuth Options & Callbacks
│   ├── db.ts                    # PrismaClient Singleton Instance
│   ├── config.ts                # DEMO_MODE Configuration
│   ├── email.ts                 # Production Resend / SMTP Email Transporter
│   └── totp.ts                  # Zero-dependency RFC 6238 TOTP Engine
└── prisma/
    ├── schema.prisma            # PostgreSQL Data Models
    └── seed.ts                  # Database Seed Script
```

---

## 📜 Verification & Build Statements

- **`npm run lint`**: Executed cleanly with **0 ESLint errors and 0 warnings**.
- **`npx tsc --noEmit`**: Executed cleanly with **0 TypeScript errors**.
- **`npm run build`**: Successfully compiled static and dynamic pages for **37 routes**.
