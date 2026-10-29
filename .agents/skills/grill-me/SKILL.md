---
name: grill-me
description: RoleReady project-specific job interview stress-testing skill. Grills a candidate across their resume, job description, uploaded context files, shared URLs, industry, department, and seniority level (up to C-Suite) with adjustable heat (Warm Rehearsal to Full Executive Roast), AI voice interviewing (Male/Female interviewer), and live timing/composure feedback.
disable-model-invocation: false
---

# Grill Me (RoleReady Edition) — Executive & Niche Job Interview Stress-Testing Skill

> **Scope Note**: The global `grill-me` skill (`~/.agents/skills/grill-me`) critiques general software plans and iterations. This project-local skill (`.agents/skills/grill-me`) is engineered specifically for **RoleReady** to grill job candidates at Tier 3 (`Offer Secured` / `Top Candidate` / `Unfair Advantage`).

## 1. Deep Context & Niche Role Calibration

The more context the candidate provides, the sharper and more realistic the grilling becomes:
- **Uploaded Context Files**: Ingests supplemental candidate or company artifacts alongside the resume PDF (e.g., 30-60-90 day plans, board decks, technical architecture RFCs, case study PDFs, or 10-K filings).
- **Shared Context Links / URLs**: Incorporates company URLs, product documentation, earnings call transcripts, press releases, or interviewer background links.
- **Niche Role Taxonomy**:
  - **Industry**: FinTech & Payments, AI & Foundation Models, Private Equity / Venture Capital, Enterprise SaaS, Healthcare & Biotech, Sovereign / Defence Tech, Management Consulting, etc.
  - **Department**: Executive Leadership, Product Management, Software & Systems Engineering, Quantitative / Data Science, Commercial & GTM, Finance & Strategy.
  - **Seniority Level**: Individual Contributor (L4–L5), Staff / Principal IC (L6–L8), Director / Head of Department, VP / SVP, and **C-Suite (CEO, CTO, CFO, CPO, COO, CRO) / Board Member**.

## 2. Adjustable Heat Dial (Tier 3 Exclusive)

At the highest paid tier, candidates can turn up the heat to get roasted or dial it down as they transition from early rehearsal to final-panel readiness:
1. **Level 1 · Warm Rehearsal**: Supportive Socratic guidance that helps organise STAR structure and surface missing resume metrics.
2. **Level 2 · Panel Pressure**: Realistic cross-functional panel follow-ups probing scope, methodology, and role alignment.
3. **Level 3 · Bar-Raiser Grill**: Sceptical counter-questioning that isolates personal contribution from team momentum and challenges rejected trade-offs.
4. **Level 4 · Executive Roast (Max Heat)**: Unfiltered C-Suite / Board / PE Operating Partner pressure test. Interrupts vague generalities, demands unit-economics and P&L proof, tests catastrophic failure modes, and enforces strict time discipline.

## 3. AI Voice Interviewing (Male or Female Interviewer Persona)

- Candidates choose their interviewer persona and voice:
  - **Female Interviewer (`Elena Vance · Managing Partner & Bar-Raiser`)**
  - **Male Interviewer (`Marcus Sterling · Chief Product & Technology Officer`)**
- Questions are spoken aloud via AI voice synthesis, and the candidate answers aloud via live microphone voice capture (with transcript + audio telemetry).

## 4. Timing, Pacing & Calm-Under-Pressure Feedback

Feedback evaluates not only *what* the candidate said, but *how* they delivered it under pressure:
- **Response Latency (Time-to-First-Word)**: Measures whether the candidate hesitates or composes a crisp executive headline within 2–4 seconds.
- **Pacing & Cadence (Words Per Minute)**: Targets the 130–160 WPM executive authority zone (flagging nervous rushing >180 WPM or stalling <100 WPM).
- **Filler-Word Discipline**: Counts hedging and filler tokens (*"um"*, *"uh"*, *"sort of"*, *"basically"*, *"I think maybe"*) that erode C-suite authority.
- **Calm-Under-Pressure Score (0–100)**: Combines pacing stability, time-box adherence, filler discipline, and directness into an actionable composure readout alongside the content scorecard.
