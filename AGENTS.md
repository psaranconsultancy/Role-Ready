# RoleReady – rules for the coding agent

Put this file at the repo root. Antigravity reads AGENTS.md on every turn.

## What we are building
RoleReady: an AI interview coach. Sign in → upload resume PDF + paste job description → 6 tailored questions that cite resume lines (R1..Rn) and JD requirements (J1..Jn) → typed answers → scored feedback → saved History.
Full spec: `docs/PRD.md`. Hackathon MVP, 3 days, must-haves only. Do not add features that are not in the PRD.

## Stack
- React 18 + Vite + TypeScript (strict) + Tailwind CSS + React Router.
- `@supabase/supabase-js` v2 for auth, database and storage.
- No other UI framework. Small, hand-written components. `lucide-react` for icons is fine.
- Package manager: npm.

## Folder ownership (4-person team)
- `src/` – Person A (frontend). This is where you work by default.
- `supabase/migrations/` – Person B. Do not edit.
- `supabase/functions/` – Persons C and D. Do not edit, except reading `_shared/contracts.ts`.
- `supabase/functions/_shared/contracts.ts` – the shared API types. **Never change it without asking.** Import it in the app through the Vite/TS alias `@contracts`.
- `fixtures/` – Person D's sample data. You may read it to build mocks.

## Rules
- All data access goes through `src/lib/api.ts`. Components never call `supabase.functions.invoke` or `fetch` directly.
- `api.ts` reads `import.meta.env.VITE_USE_MOCKS`. When `"true"`, it returns data from `src/mocks/` with a 600–1500 ms fake delay and never touches the network. When false, it calls Supabase.
- Types come from `@contracts`. Do not redefine Session, Question, Feedback, etc.
- Never put an LLM API key, service-role key or any secret in frontend code or in `VITE_` variables.
- Every async action shows a loading state and handles `ApiError` with a friendly message and a retry button.
- Keep the UI accessible: labels on inputs, buttons reachable by keyboard, colour is never the only signal.
- Responsive down to 375 px wide.
- **No AI Slop (Mandatory & Automatic for All Customer-Facing Text)**: Automatically run every customer-facing string, prompt, question, feedback item, and UI label through `.agents/skills/no-ai-slop/SKILL.md` and `lint.mjs` before finishing any task. Never put AI slop in front of a user: no banned buzzwords (`leverage`, `delve`, `foster`, `utilize`, `empower`, `streamline`, `robust`, `cutting-edge`, `seamless`, `elevate`, `unlock`, `supercharge`), no fake trademark symbols (`™`), no binary contrasts (`"This is not X. It's Y."`), no colon reveals, no corporate jargon (`telemetry`, `calibration`, `counterfactuals`, `gravitas`), and no raw developer notation (`R1..Rn`).

## Verify before you say "done"
1. Automatically audit all customer-facing copy with `.agents/skills/no-ai-slop/SKILL.md` and verify `node "C:\Users\PSara\OneDrive\Desktop\Skills for Websites\.agents\skills\design-taste-frontend\scripts\lint.mjs" index.html src --app` passes with `0 FAIL` and zero `[copy]` warnings.
2. `npm run build` passes with no TypeScript errors.
3. `npm run lint` passes (if configured).
4. Run `npm run dev` and walk the whole flow in the browser on mocks: sign in → new session → 6 questions → answer one → feedback → finish all 6 → History → reopen.
Report what you checked and anything that failed.

## Git
Small commits with clear messages ("Add interview page", "Wire api.ts to mocks"). Work on a branch, not on `main`.
