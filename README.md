# turbo-garbanzo

Advanced application development group project repository

## React Migration

This project has been migrated to use React and React Router with Vite as the build tool. All major features are now implemented as React components and routed via React Router.

### Project Structure

- `src/`
  - `main.jsx` — React entry point
  - `App.jsx` — Root component with all routes
  - `login/Login.jsx` — Login page (Supabase auth)
  - `dashboard/Dashboard.jsx` — Dashboard page
  - `profile/Profile.jsx` — Profile page
  - `schedule/Schedule.jsx` — Schedule page
  - `availability/Availability.jsx` — Availability page
  - `pay/Pay.jsx` — Pay page
  - `timesheet/Timesheet.jsx` — Timesheet page
  - `timeoff/Timeoff.jsx` — Time off page
  - `admin/AdminDashboard.jsx` — Admin dashboard
  - `managerapproval/ManagerApproval.jsx` — Manager approval page
  - `lib/supabase/client.js` — Supabase client setup
  - `input.css` — Tailwind CSS entry (now scans JSX files)
- `public/index.html` — HTML entry for Vite
- `legacy_html/` — Archived original HTML and JS files

### Usage

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Notes
- All routing is now handled by React Router.
- Supabase authentication is integrated in the Login and Dashboard components.
- Tailwind CSS is configured to scan `.jsx` files for class usage.
- The original HTML/JS files are archived in `legacy_html/` for reference.

---

For further development, continue building new features as React components and update routes in [`src/App.jsx`](src/App.jsx).
