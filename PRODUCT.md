# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students hunting internships and new-grad roles. They apply to many roles in parallel, often in bursts, and lose track of where each application stands and who they should chase. They are currently managing this in a spreadsheet or scattered notes, and find it tedious. Their job in the product: log each application, move it through a status pipeline, know what needs a follow-up today, and stay motivated across a long, rejection-heavy search.

Career switchers and experienced professionals are named on the landing page as secondary audiences. They are not the design target.

## Product Purpose

TRACKr (also called InternTrack) is a job application tracker that replaces the spreadsheet. A user records applications (company, role, applied date, link, notes, optional follow-up date), moves them through five statuses (Applied, Online Assessment, Interview, Offer, Rejected) on a list or kanban board, and gets analytics, reminders and a shareable recap. Success for the user is never losing track of an application and never missing a follow-up. The project is also a deployed portfolio piece, so it is judged on product and engineering quality alike.

## Positioning

A spreadsheet stores applications; TRACKr tells you what to do next and keeps you going. What a neighboring tracker could not truthfully copy in one move is the combination of:
- **Follow-up nudges:** a weekly email digest and "follow-up due" badges driven by each application's follow-up date.
- **Momentum:** day streaks, milestones (first application, 10/25/50/100 applications, first OA, interview, offer), and a shareable job-search recap.
- **Capture by URL:** paste a job-posting link to prefill an application.
- **Personality:** a tool the user does not dread opening; its bold character is part of the pitch.

## Operating Context

Used daily, in short sessions, on desktop and on a phone. The main screens are the dashboard, a list and a kanban board of applications (drag between status columns, with undo), an application detail page with an activity timeline, CSV import and export, and a recap page. Users come from email links too (verify email, reset password, one-click digest unsubscribe) and from shared public recap links (`/r/:slug`) that render link previews. The hosted site is at trackr.dharmikchandel.tech, on free-tier infrastructure (Vercel, Render, Supabase Postgres, Redis Cloud) with keepalive pings, so cold starts and tight limits are real operating conditions.

## Capabilities and Constraints

Confirmed functionality (landing page previews use clearly labelled sample data with fictional companies, never real customers): email and password accounts with short-lived access tokens and rotating refresh cookies; password reset and email verification (login is deliberately **not** blocked on verification, which shows as a dismissible banner); application CRUD with search, filter and sort (the list marks overdue follow-ups, shows a total count, and can clear filters); kanban board; per-application activity timeline; weekly follow-up digest with opt-out; job-URL capture (server-side fetch guarded against SSRF); CSV import with preview and export guarded against formula injection; streaks and milestones; shareable recap; analytics.

Binding constraints:
- **Recap privacy:** a public recap exposes aggregate numbers only, frozen at creation, never per-application data. Revoking a share stops its link resolving. This guarantee is structural and must not be loosened.
- **Free-tier hosting:** features must tolerate cold starts, limited compute and no paid services.
- **Tone on progress:** momentum features never frame a missed day or a rejection as failure.

Terminology: "application" (one role applied to), "status", "follow-up", "recap", "milestone", "streak".

Undecided: monetization (none exists) and whether the landing page keeps its secondary-audience sections.

## Brand Commitments

The product name is TRACKr (with "InternTrack" as the repository and README name). The voice is confident and encouraging ("Every rejection is a redirection"), never guilt-inducing. Deployed under the maintainer's own domain.

## Evidence on Hand

Real: a deployed app, a working backend with tests for the CSV, milestone, recap and job-capture logic, and the implementation notes in `.local/IMPLEMENTATION_0N_*.md`. Absent: real user counts, testimonials, customer logos, benchmarks, pricing and accessibility audits. Future work must not fabricate any of these.

## Product Principles

1. **Tell the user what to do next, not just where things are.** Surface follow-ups and progress before raw lists.
2. **Encourage momentum, never guilt.** Progress is framed as runs and milestones; missed days and rejections are neutral.
3. **Privacy by structure.** Anything shared publicly is aggregate by design, not by policy.
4. **Capture with minimal effort.** Adding an application should take seconds: paste a URL, import a CSV, or fill a short form.
5. **Stay useful on free infrastructure.** Favor cheap reads, idempotent jobs and graceful behavior when a service is cold.

## Accessibility & Inclusion

No product-specific accessibility standard has been set. Do not claim WCAG compliance until one is chosen and audited.
