# Turbo Garbanzo — Employee Scheduling & Workforce Management Platform

A modern, full-stack workforce management application built with React, Vite, Supabase, and Tailwind CSS. Designed for small to mid-size businesses with shift-based workforces.


## 🚀 Live Demo

[https://turbo-garbanzo-six.vercel.app](https://turbo-garbanzo-six.vercel.app)


## 📋 Features

### Employee Features
- Secure login, registration, and password reset via email
- Personal dashboard with schedule overview, calendar, and clock in/out
- View upcoming shifts
- Set weekly availability with preference levels (Can Work, Prefer Not to Work, Can't Work)
- Submit and track time off requests (PTO, Sick Leave, Unpaid Leave)
- View timesheet with weekly hours and overtime tracking
- View pay summary with estimated gross pay per pay period
- In-app notifications for schedule changes and time off decisions
- Profile management

### Scheduling Manager Features
- Weekly schedule grid showing all employees and their shifts
- Visual availability indicators per employee per day
- Coverage tracking with configurable minimum staffing requirements
- Add, edit, and delete shifts
- Review, approve, and deny time off requests with comments
- Employees automatically notified of decisions

### System Admin Features
- All manager capabilities
- User management — view, edit, and delete employee profiles
- Role assignment (Employee, Scheduling Manager, System Admin)
- Compensation management (hourly rate, salary, benefits eligibility, hire date)
- Full audit log of all system actions

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS v4 |
| Build Tool | Vite |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Email | Resend |
| Deployment | Vercel |

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profile data linked to Supabase auth |
| `roles` | Role definitions (Employee, Scheduling Manager, System Admin) |
| `schedules` | Employee shift assignments |
| `availability` | Employee weekly availability preferences |
| `time_entries` | Live clock in/out records |
| `time_records` | Historical time audit log |
| `time_off_request` | Employee time off requests and manager decisions |
| `employee_compensation` | Pay rates, pay type, benefits eligibility |
| `coverage_requirements` | Minimum staffing requirements per day |
| `notifications` | In-app notification records |
| `audit_log` | Comprehensive log of all system actions |

---

## 🔐 Security

- Row Level Security (RLS) enforced on every table
- Role-based access control via `private.get_my_role()` security definer function
- Auth functions isolated in private Postgres schema
- Performance-optimized RLS policies using `(select auth.uid())`
- Comprehensive audit logging for all sensitive operations
- Email confirmation required for new accounts
- Pay and compensation data isolated in separate table with admin-only access

---

## 🏗 Architecture Decisions

**Why Supabase?**
Supabase provides a managed PostgreSQL database with built-in auth, real-time capabilities, and a JavaScript client — ideal for a full-stack app without a dedicated backend server.

**Why separate `employee_compensation` table?**
Pay data is sensitive. Isolating it in its own table with strict admin-only RLS policies ensures managers can never accidentally access employee pay rates, even through indirect queries.

**Why a private Postgres schema for functions?**
Security definer functions exposed in the public schema are callable via the REST API. Moving them to a private schema prevents users from invoking role-check functions directly.

**Why `(select auth.uid())` in RLS policies?**
Wrapping auth functions in a subquery causes Postgres to evaluate them once per query rather than once per row, significantly improving performance at scale.

---

## 🚧 Known Limitations & Roadmap

**Current limitations:**
- Admin dashboard stats are placeholder data (analytics in development)
- Responsive design needs further optimization, especially the Schedule Manager grid
- Admins cannot create new auth users from the frontend (requires Supabase Admin API)
- No push notifications (in-app notifications only)
- Company name is a placeholder (multi-org support planned)

**Planned features:**
- Multi-organization support with dynamic company branding
- GPS-enabled clock in/out with location verification
- Push notifications via service worker
- Pay period management and payroll export
- Reporting and analytics dashboard
- Benefits eligibility tracking based on hire date
- Shift swap requests between employees
- Mobile app (React Native)

---

## 👥 Team

Built by Becca Ysbrand, KayLynn Johnson, Rylee Smith as a capstone project for Advanced Application Development at Southeast Technical Institute.

---

## 📝 Development Notes

- All environment variables are managed via `.env` (see `.env.example`)
- Supabase project: `turbo-garbanzo`
- Vercel deployment triggered on push to `main` branch
- `bbranch` used for feature development, merged to `main` for deployment

---

## ⚙️ Local Development

```bash
# Clone the repository
git clone https://github.com/rysbrand/turbo-garbanzo.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start development server
npm run dev
```

---

> **Note:** Company name, branding, and organization-specific configuration will be pulled dynamically from Supabase in a future multi-organization release.