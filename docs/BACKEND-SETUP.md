# Backend setup (contingency)

Supabase project: **roleready-team44** (ref `ysbtdmdrnmssshbatyxd`, London, "Role Ready" org).

Done:
- Migrations `0001_init.sql` and `0002_delete_and_demo.sql` applied. Security advisor: no issues.
- Edge functions deployed (JWT required): `parse-resume`, `generate-questions`, `score-answer`.
- Vercel Preview env vars for branch `contingency/score-answer` only: `VITE_USE_MOCKS=false`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Production still runs on mocks.

Still needed in the Supabase dashboard:
1. Edge Functions → Secrets: `GEMINI_API_KEY` (from aistudio.google.com/apikey). `GEMINI_MODEL` is optional; the code defaults to `gemini-3.8-flash`.
2. Authentication → Sign In / Providers: turn off "Confirm email", turn on "Allow anonymous sign-ins" (powers "Try the demo").
3. Authentication → URL Configuration: Site URL `https://roleready-team44.vercel.app`.

Going live: set the same three `VITE_` vars on Production and redeploy. Rollback: `VITE_USE_MOCKS=true`, redeploy.
