# RoleReady

AI interview practice grounded in your own resume. Upload your resume as a PDF and paste the job description. RoleReady writes six tailored interview questions, each one citing the resume lines and job requirements it tests. You type your answers, or say them out loud and let the browser's speech-to-text type them up, and get a 0–100 score across four criteria: relevance, evidence, structure and impact. Each score comes with one thing to fix and a stronger rewrite that only uses facts from your resume. After each score, **Grill Me** asks the tougher follow-up a panel would, aimed at the weakest part of your answer, as hard as you set the Heat Dial (Warm to Executive Roast), and tells you whether your reply held up. Your sessions are saved to History so you can come back and re-drill your weakest question, and a finished session can be saved as a PDF report or emailed to yourself.

**Live demo:** https://roleready-team44.vercel.app. Click **Try the demo** to sign in with sample data; no account needed.

Built by Team 44 for the Outskill AI Accelerator hackathon (October 2026).

## Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router, deployed on Vercel.
- **Backend:** Supabase for auth, Postgres with row-level security, storage for resume PDFs, and Deno Edge Functions (`parse-resume`, `generate-questions`, `score-answer` and `grill-followup`).
- **AI:** Gemini through Google AI Studio, called only from the Edge Functions. Claude is an optional fallback via `LLM_PROVIDER=anthropic`.
- **Shared types:** `supabase/functions/_shared/contracts.ts`, imported by the app as `@contracts`.

The spec is in [`docs/PRD.md`](docs/PRD.md). Rules for coding agents are in [`AGENTS.md`](AGENTS.md).

## Run it locally on mock data

You only need Node.js 18 or newer. No Supabase project or API keys are required.

```bash
npm install
echo "VITE_USE_MOCKS=true" > .env.local
npm run dev
```

Open http://localhost:5173 and click **Try the demo**.

With `VITE_USE_MOCKS=true`, every call in `src/lib/api.ts` returns data from `src/mocks/` after a short fake delay, and nothing touches the network. The app also falls back to mock data automatically when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.

Tip: an answer containing `#fail` simulates an AI error, so you can see the error and retry state.

## Run it against Supabase

1. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and set `VITE_USE_MOCKS=false`.
2. Apply `supabase/migrations/` and deploy the functions in `supabase/functions/`.
3. Set the function secrets: `supabase secrets set GEMINI_API_KEY=... LLM_PROVIDER=gemini`.

Never put an AI key or the service-role key in a `VITE_` variable: those are bundled into the browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Type-check only |
| `npm run preview` | Serve the production build |

`VITE_` variables are read at build time. After you change one on Vercel, redeploy.

## Roadmap

These features are shown in the app as **Coming soon** and are not built yet:

- Grill Me with a spoken AI interviewer (the typed Grill Me follow-up and its Heat Dial are live)
- Niche and C-Suite question sets, plus extra context from your own documents and links
- Salary negotiation scripts
- Paid plans
