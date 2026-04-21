# Bloomington Figure Skating Club Portal

A comprehensive, role-based scheduling and management portal for the Bloomington Figure Skating Club. Skaters, coaches, and administrators can seamlessly navigate rink zones, dynamically sign up for classes, and organize schedules with overlap protection.

## Features
- **User Roles:** Secure authentication with custom application capabilities specifically partitioned for Skaters, Coaches, and Admins.
- **Rink Navigations:** Interactive scheduling module that allows skaters to actively manage their class sign-ups and observe real-time enrollment capacities. 
- **Admin Management:** Streamlined interface for administrators to actively plan classes, reliably prevent instructor/zone double booking, enforce capacity limits, and instantly push schedule revisions to the active live database.
- **Coach Portal:** Specifically customized schedule views that exclusively render an instructor's assigned classes to teach.

## Technology Stack
- **Frontend Code:** React, TypeScript, Vite
- **Styling Design:** Custom Vanilla CSS 
- **Backend & Authentication Database:** Supabase (PostgreSQL architecture)

## Local Development
1. Clone the repository and navigate explicitly to the backend web directory:
   ```bash
   cd web
   ```
2. Install standard Node dependencies:
   ```bash
   npm install
   ```
3. Set your Supabase environmental connectivity string configurations permanently inside a root `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the Hot-Reloading frontend development server:
   ```bash
   npm run dev
   ```

## Deployment Instructions

### Frontend Deployment (Vercel, Netlify, or Github Pages)
1. Commit your final structured codebase entirely to a GitHub repository.
2. Link your primary repository cleanly to your Vercel or Netlify hosting dashboard.
3. Configure your automated Build Command: `npm run build`
4. Configure your compiled Output Directory block: `dist`
5. **Crucially**, define your private `.env` variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) directly inside your hosting provider's "Environment Variables" deployment settings!
6. Click Deploy.

### Backend Infrastructure (Supabase)
Your backend strictly operates safely via Supabase. Make sure your database executes the following explicit logic properties:
1. Define Primary Key overrides for tables locally:
    - Replace default user `id` explicitly with `skater_id` inside `public.users`.
    - Replace default class `id` explicitly with `class_id` inside `public.skating_classes`.
2. Construct the registration junction explicitly to map users to their scheduled class loads safely. 

## Acknowledgements 
Developed in the class I400-Vibe and AI Programming, Spring 2026, IUB, with the assistance of models (gemini) within (antigravity).

