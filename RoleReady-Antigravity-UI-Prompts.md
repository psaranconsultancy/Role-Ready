# RoleReady: next Antigravity prompts (sign-in fix + visual redesign)

For Saran (Person A, frontend). 29 Oct 2026.
Repo: psaranconsultancy/Role-Ready, branch `feat/frontend-mocks`. Live: https://roleready-team44.vercel.app

## Why you only see the sign-in page

The app code is fine. In mock mode, any email plus a 6+ character password signs you in.
The problem is the Vercel build: the project **has no `VITE_USE_MOCKS` variable**. Vite bakes `VITE_` variables into the bundle at build time, so the live bundle was built in "real" mode. Sign-in calls `https://placeholder-project.supabase.co`, which does not exist, so every sign-in and sign-up fails. (I checked the live JavaScript: the mock code path is not in it, and the Supabase URL is the placeholder.)

The project does have a set of `role_ready_storage_1_*` and `NEXT_PUBLIC_role_ready_storage_1_*` variables from a Vercel Supabase integration. The app ignores them: Vite only reads names that start with `VITE_`.

**Quick fix (no code):** Vercel → project `role-ready-7st5` → Settings → Environment Variables → add `VITE_USE_MOCKS` = `true` for Production and Preview → Deployments → latest → Redeploy. Any change to a `VITE_` variable needs a redeploy to take effect.

Prompt 1 below also makes the app fall back to mock mode by itself when Supabase is not configured, so this cannot happen again on demo day.

## How to run these

1. In Antigravity, open the Role-Ready folder, `git checkout feat/frontend-mocks`, `git pull`.
2. Use **Planning** mode. Paste **Prompt 1**, review the plan, let it run, check it in the browser. Commit.
3. Paste **Prompt 2** the same way. It is the bigger one. Commit.
4. Paste **Prompt 3** for the final polish pass. Commit and push. Vercel redeploys `feat/frontend-mocks` by itself.

AGENTS.md stays at the repo root and still applies. Neither prompt touches `contracts.ts`, `supabase/` or the PRD scope.

---

## Prompt 1: demo sign-in that always works, and a public landing route

```
Read AGENTS.md and docs/PRD.md first. Work only in src/ (and index.html / tailwind.config.js if needed). Do not edit supabase/ or supabase/functions/_shared/contracts.ts.

Problem: on the deployed site users cannot get past the login page. The Vercel build had no VITE_USE_MOCKS variable, so api.ts ran in real mode against the placeholder Supabase URL and every sign-in failed. Fix this so a demo user can always get in, and make the root URL a public landing page.

1. Mock-mode detection (src/lib/api.ts and src/lib/supabase.ts)
   - Export a single `isMockMode()` from api.ts (or a small src/lib/env.ts) that returns true when VITE_USE_MOCKS === 'true', OR when VITE_SUPABASE_URL is missing, empty, or contains "placeholder", OR when VITE_SUPABASE_ANON_KEY is missing.
   - When it falls back because Supabase is not configured, console.warn once: "RoleReady: Supabase not configured, running on mock data."
   - Every api.ts function already branches on mock mode; make them all use this one function.

2. One-click demo user
   - Add `signInAsDemo()` to api.ts. In mock mode it signs in as { id: 'user-demo', email: 'demo@roleready.app' } with the same 600–1500 ms fake delay, and the mock store seeds the existing fixture sessions for that user (so History is not empty on first visit).
   - Expose it through AuthContext as `signInDemo`.
   - In real mode (Supabase configured and VITE_USE_MOCKS false) signInAsDemo is not offered; the button is hidden.

3. Routes (src/App.tsx)
   - `/` = new public LandingPage (built properly in Prompt 2; for now a simple hero with "Try the demo" and "Sign in" buttons).
   - `/login` = LoginPage. `/app` redirects to `/history`. Keep /new, /session/:id, /history protected.
   - Unknown routes go to `/` (not /history).
   - Signed-in users who open `/login` go to `/history`. Signed-in users can still see `/` (show "Open dashboard" instead of "Sign in" there).
   - The Header only renders on protected pages; Landing and Login have their own minimal top bar.

4. Login page
   - Above the form, when isMockMode() is true, show a prominent primary button "Continue as demo user" that calls signInDemo and navigates to /history. Under it a small divider "or use your email".
   - Show a small, non-alarming pill at the top: "Demo mode · sample data, nothing is saved to a server".
   - Keep the existing email/password form and error handling.

5. Sign-out returns to `/` (the landing page), not /login.

6. Make sure `vercel.json` still rewrites all paths to /index.html so /history etc. work on refresh.

Verify per AGENTS.md: npm run build and npm run lint pass. Then in the browser, with VITE_USE_MOCKS unset in .env.local AND again with it set to true: open /, click Try the demo, land on History with seeded sessions, start a new session with "Fill sample resume & JD", answer one question, see feedback, sign out, land on /. Report what you checked.
```

---

## Prompt 2: visual identity, landing page and screen redesign

```
Read AGENTS.md and docs/PRD.md first. Work only in src/, index.html and tailwind.config.js. Do not change contracts, api.ts function signatures, routes from the previous step, or add features outside the PRD. This is a visual redesign: same flow, same data, much stronger look. No new UI framework; Tailwind + lucide-react only.

The current UI is generic (indigo-on-slate default Tailwind). Give RoleReady a distinctive, confident identity: think "a sharp hiring manager's notebook" — editorial, warm, precise. Not a generic SaaS template.

A. Design tokens (tailwind.config.js + src/index.css)
   - Colours, defined as named Tailwind colours and CSS variables:
     ink #0E1726 (text, dark surfaces) · paper #F7F4EE (page background, warm off-white) · card #FFFFFF · line #E6E0D4 (borders)
     signal #FF5A36 (primary actions, the brand accent) with hover #E8471F
     grounded #0F766E (anything tied to evidence: R/J citation chips, "backed by resume")
     caution #B45309 (unsupported claims, mid scores) · strong #15803D (high scores) · weak #B91C1C (low scores, errors)
   - Remove the default indigo everywhere. Every colour must come from these tokens.
   - Fonts (Google Fonts in index.html): "Fraunces" (600, 700) for display headings and big numbers; "Inter" (400–700) for body; "JetBrains Mono" (500) for R1/J2 citation chips and scores.
   - Radius: 14px cards, 10px inputs/buttons, full pills for chips. Shadows: one soft shadow token only (0 1px 2px rgb(14 23 38 / .06), 0 8px 24px rgb(14 23 38 / .06)).
   - A subtle paper texture or faint dotted grid on the page background (CSS only, very low contrast).
   - Respect prefers-reduced-motion for every animation.

B. Logo / wordmark
   - Replace the Briefcase square with a wordmark: "RoleReady" in Fraunces with the "R" of Ready in signal colour, plus a small mark: a rounded square in ink containing a white check that becomes a speech-bubble tail (inline SVG component src/components/Logo.tsx). Use it on Landing, Login and Header. Also set it as the favicon (inline SVG data URL in index.html) and update <title> to "RoleReady · Interview practice grounded in your resume".

C. Landing page (src/pages/LandingPage.tsx), sections top to bottom:
   1. Top bar: Logo · links "How it works", "Why it's different" (anchor scroll) · "Sign in" text button · "Try the demo" signal button.
   2. Hero (two columns on desktop, stacked on mobile):
      Left: eyebrow "AI interview coach" · H1 in Fraunces, large: "Walk in knowing what they'll ask." · sub: "Upload your resume, paste the job description, and practise six questions built from both. Every question cites your resume lines and the role's requirements, and every answer gets a hiring-manager score with a stronger rewrite." · buttons "Try the demo — no sign-up" (signal) and "Sign in" (outline) · small trust line "Free · takes 10 minutes · your resume stays private".
      Right: a static product preview card built from the fixtures (not an image): one question card with two citation chips (R3, J2), a short typed answer, and a score ring showing 78 with "Strong · tighten the result" — slightly rotated stack of 2 cards behind it for depth.
   3. "How it works": 3 numbered steps with icons — Upload resume & JD → Answer 6 tailored questions → Get scored, fix, re-drill.
   4. "Why it's different": 3 cards — "Grounded, not generic" (cites R1..Rn and J1..Jn), "Scored like a hiring manager" (0–100 with what to fix next), "Evidence check" (flags claims your resume doesn't back). Use the grounded/caution colours here so the visual language matches the app.
   5. Closing CTA band on ink background: "Your next interview is a practice run away." + Try the demo button.
   6. Footer: "Built by Team 44 · Outskill AI Accelerator 2026".

D. Shared components (src/components/)
   - Button (variants: primary/signal, secondary/outline, ghost; sizes sm/md/lg; loading prop shows spinner and keeps width).
   - Card, Pill/Badge, CitationChip (replace ReferenceChip styling: mono font, grounded colour for R, ink outline for J, tooltip with the full line text on hover AND focus).
   - ScoreRing (SVG ring 0–100, colour by band: <50 weak, 50–74 caution, ≥75 strong; number in Fraunces in the middle; aria-label "Score 78 out of 100, strong"). Use it in FeedbackPanel and SessionSummary and the History list.
   - Skeleton (shimmer blocks, reduced-motion safe).
   - EmptyState (icon, title, one line, one action button).
   - ErrorBanner restyle: weak-colour left border, plain-language title per ApiError code (bad_request "Check your input", unauthorized "Please sign in again", parse_failed "We couldn't read that PDF", llm_failed "The coach timed out", not_found "Session not found"), the message, and a Retry button. Keep role="alert".
   - Header: logo left; nav "New practice" and "History" as pill tabs with an active state not shown by colour alone (underline or filled); user email in a small avatar menu with Sign out.

E. Every must-have screen gets designed loading, empty and error states
   - History: skeleton list (3 rows) while loading · EmptyState "No practice sessions yet — start your first one" with a New practice button · ErrorBanner with retry. Each session row: role + company in Fraunces, date, status pill, ScoreRing (small) for completed sessions, "Resume" or "Review" action.
   - New session: two-step layout with a visible stepper (1 Resume & JD → 2 Questions). Resume drop zone with drag-over state, file chip after upload (name, size, remove). JD textarea with a live character counter that turns grounded colour at 200+. "Fill sample resume & JD" stays, styled as a ghost button. While parsing and generating, show a staged progress panel ("Reading your resume… → Matching to the job's requirements… → Writing 6 questions…") instead of a bare spinner. Errors inline under the relevant field plus ErrorBanner for API errors.
   - Session (interview): progress bar "Question 2 of 6" at top; left rail on desktop listing the 6 questions with answered/current/locked states (icon + text, not colour only); question card with its citation chips; answer box with the live STAR word counter already there; submitting state "Scoring your answer…" with skeleton feedback; FeedbackPanel with ScoreRing, verdict, "What to fix next" list, "Stronger rewrite" in a quote block, and any unsupported claims in caution colour with a "not in your resume" label.
   - Summary: big ScoreRing for the session average, per-question mini bars, weakest question highlighted with the existing re-drill button as a signal CTA.
   - Session not found / unknown route: friendly EmptyState with a link back to History.

F. Motion and polish
   - 150–200 ms ease-out transitions on hover/focus; cards lift 1px on hover; feedback panel fades/slides in. Nothing bounces.
   - Visible focus rings in signal colour (2px, offset 2px) on every interactive element.
   - Check contrast: body text on paper and white on signal must meet WCAG AA (darken signal for text-on-white uses if needed).
   - Mobile at 375 px: no horizontal scroll, stacked layouts, sticky bottom "Submit answer" bar on the Session page.

Verify per AGENTS.md: npm run build and npm run lint pass. Walk the whole flow on mocks at 1280 px and 375 px: Landing → Try the demo → History (seeded) → New practice with sample → 6 questions → answer one (and one containing "#fail" to see the error state) → feedback → finish → Summary → History → reopen. Also force the empty state by clearing localStorage and signing in as demo after removing seeded sessions, or add a ?empty=1 dev-only query flag in mock mode. Take screenshots of Landing, History, Session with feedback, and Summary and show them to me. Report anything that failed.
```

---

## Prompt 3: final polish pass (after Prompt 2 is merged)

```
Review the app against AGENTS.md as a picky product designer. Walk every screen at 1280 px and 375 px on mocks and list every inconsistency: leftover indigo/slate defaults, mismatched spacing, buttons not using the Button component, missing loading/empty/error states, focus rings missing, text under 14px that should be larger, contrast failures, layout shift while loading. Then fix them all in one pass, keeping behaviour unchanged. npm run build and lint must pass. Show me before/after screenshots of the three worst issues you found.
```

---

## After the prompts

- Commit after each prompt (`git add -A && git commit -m "..."`), then `git push`. Vercel rebuilds `feat/frontend-mocks` automatically.
- If you merge to `main` later, change the Vercel production branch to `main` (Settings → Git).
- When B's real Supabase project is ready, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_USE_MOCKS=false` in Vercel and redeploy. The `role_ready_storage_1_*` variables from the Vercel integration are not read by the app unless their values are copied into those `VITE_` names.
