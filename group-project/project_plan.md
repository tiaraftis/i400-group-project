# Aurora Skating School Project Plan

## What We Have Done So Far

### Frontend & Auth Flow
1. **Designed a Premium UI:** Built a sleek, themed Login and Sign-Up page with smooth transition animations and an ice-skating background.
2. **Form Validation:** Ensured all sign-ups require you to type your password twice and instantly checks for a match.
3. **Simulated Flow replaced by Reality:** I originally built the login utilizing HTML/CSS, but then correctly converted and ported the entire setup into a React application.
4. **Supabase Integration:** Wired the React `App.tsx` perfectly with Supabase, turning the simulated form submissions into actual secure `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()` processes.
5. **Dynamic Dashboard:** Designed a nice `Welcome, [User]!` sidebar dashboard that tracks three major categories: Ratings, Feedback, and Navigations.

### Backend Infrastructure
6. **Custom Roles:** Fully rewrote `schema.sql` to represent a Skating School instead of a Community Center. Created the specific roles: `admin`, `skater`, and `coach`.
7. **Skating Tables:** Added complex tables for `skating_classes` (tracking levels, locations, capacities) and a `class_registrations` pivot table.
8. **Logging Mechanism:** Established a clean `public.logs` table with proper row-level-security so that admins can review all portal activity securely.
9. **Automated Linking:** Placed a critical PostgreSQL Trigger (`handle_new_user()`) at the bottom of the schema so that anytime a skater completes your sign-up page, they are automatically placed into the `public.users` table so you can verify their default `'skater'` role.

---

## What Is Still Needed

### 1. Connecting the Dashboard UI to Real Data
* Right now, the Dashboard tabs (*Ratings, Feedback, Navigations*) rely on hardcoded static strings. We need to create backend tables for Ratings and Feedback.
* We need to build dynamic React components that fetch the logged-in skater's personal ratings from Supabase using `supabase.from('ratings').select('*')` and display them seamlessly in the UI.

### 2. Admin & Coach Controls
* We need to establish an "Approve / Alter / Manage" portal that is conditionally shown to users only if they log in and hold the `'admin'` or `'coach'` role inside the `public.users` table.
* **Coaches** need a page with forms to securely leave Feedback and Ratings on a skater's profile.
* **Admins** need a UI to actively view and filter the `public.logs` table, and efficiently promote skaters to admins or coaches.
* A robust UI for admins to create completely new skating classes, assign a coach to them, and set a specific rink room location.

### 3. Skater Class Registration System
* Build out a section in the "Navigations" or "Schedules" tab where a standard Skater can actively browse upcoming `skating_classes` and safely click to reserve a slot.
* Ensure UI logic updates the remaining capacity for that session.

### 4. Tracking System Logs
* Wire up React utility functions that automatically send `insert` requests directly to `public.logs` whenever any meaningful activity happens (e.g., when an admin deletes a class or a skater reserves ice time).
