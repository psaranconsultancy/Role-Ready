---
name: grill-me
description: RoleReady project-specific job interview stress-testing skill. Grills a candidate across their resume, job description, uploaded context files, shared URLs, industry, department, seniority band, dedicated Niche Category, and dedicated C-Suite Category with adjustable heat (Warm Rehearsal to Full Executive Roast), AI voice interviewing (Male/Female interviewer), and live timing/composure feedback.
disable-model-invocation: false
---

# Grill Me (RoleReady Edition) — Niche & C-Suite Job Interview Stress-Testing Skill

> **Scope Note**: The global `grill-me` skill (`~/.agents/skills/grill-me`) critiques general software plans and iterations. This project-local skill (`.agents/skills/grill-me`) is engineered specifically for **RoleReady** to grill job candidates at Tier 3 (`Offer Secured` / `Top Candidate` / `Unfair Advantage` / `Niche Specialist Pro` / `C-Suite & Board`).

## 1. Separate Context Categories: Niche Category & C-Suite Category

The more context the candidate provides, the sharper and more realistic the grilling becomes. **Niche** and **C-Suite** are separate, first-class categories:
- **Industry**: FinTech & Payments, AI & Foundation Models, Private Equity / Venture Capital, Enterprise B2B SaaS, Healthcare & Biotech, Cybersecurity & Defence, Management Consulting, Consumer & Marketplaces.
- **Department**: Executive Leadership / General Management, Product Management, Software & Systems Engineering, Data Science & Quantitative Analytics, Finance, Strategy & CorpDev, Commercial, GTM & Revenue, Operations & Risk.
- **Seniority Band**: Mid-Level IC (L4–L5), Senior / Staff / Principal IC (L6–L8), Director / Head of Department, VP / SVP / Managing Director, C-Suite Executive, Board Member / Operating Partner.
- **Niche Category (Standalone Specialist Domain Category)**:
  - Regulated FinTech, KYB & Cross-Border Payments
  - AI Agents, Model Evals & Inference Infrastructure
  - PE Portfolio Turnaround & Post-Merger Integration
  - Clinical Biotech, Trial Design & Regulatory Submissions
  - Zero-Trust Security, Defence & Sovereign Cloud
  - Quantitative Pricing, Risk & Market Microstructure
  - Enterprise Usage Billing, PLG & Funnel Diagnostics
  - Deep-Tech Hardware, Robotics & Supply Chain
- **C-Suite Category (Standalone Executive & Board Seat Category)**:
  - Chief Product Officer (CPO) / VP Product
  - Chief Executive Officer (CEO) / Managing Director
  - Chief Technology Officer (CTO) / VP Engineering
  - Chief Financial Officer (CFO) / Head of CorpDev
  - Chief Operating Officer (COO) / Transformation Lead
  - Chief Revenue Officer (CRO) / Commercial Lead
  - Chief Information Security Officer (CISO) / Chief Risk Officer
  - Board Director / Operating Partner / Advisory
  - Non-C-Suite (Specialist IC / Manager / Director Track)
- **Uploaded Context Files**: Ingests supplemental candidate or company files alongside the resume PDF (30-60-90 day plans, board decks, technical RFCs, case study PDFs, or 10-K filings).
- **Shared Context Links / URLs**: Incorporates company URLs, product documentation, earnings call transcripts, investor memos, or interviewer profiles.

## 2. Five Dynamic Tier & Category Switcher Lenses

When the user switches between the five tabs in `TierPricingSection.tsx`, the headline, subheadline, tagline banner, 4-pillar feature box, and 3-tier comparison cards all update dynamically:
1. **Outcome-Driven**: `Essential Prep` → `Interview Ready` → `Offer Secured`
2. **Role & Ambition**: `Applicant` → `Shortlist` → `Top Candidate`
3. **Competitive Advantage**: `Baseline` → `Competitive Edge` → `Unfair Advantage`
4. **Niche Specialist**: `Generalist Prep` → `Domain Ready` → `Niche Specialist Pro`
5. **C-Suite & Board**: `Standard Screen` → `Department Lead` → `C-Suite & Board`

## 3. Adjustable Heat Dial (Tier 3 Exclusive)

At the highest paid tier, candidates can turn up the heat to get roasted or dial it down as they move from early practice to final-panel readiness:
1. **Level 1 · Warm Rehearsal (120s)**: Friendly coaching tone that helps structure the story and bring out the numbers on the resume without clock pressure.
2. **Level 2 · Panel Pressure (90s)**: Realistic cross-functional panel follow-ups testing method, collaboration, and role fit.
3. **Level 3 · Bar-Raiser Grill (75s)**: Sceptical follow-up questioning that separates personal work from team momentum and challenges trade-offs.
4. **Level 4 · Executive Roast (60s Max Heat)**: Unfiltered C-Suite, Board, and Niche domain pressure test on a 60-second clock. Challenges weak assumptions, unit costs, failure modes, and filler words.

## 4. AI Voice Interviewing (Male or Female Interviewer Persona)

- Candidates choose their interviewer persona and voice:
  - **Female Interviewer (`Elena Vance · Managing Partner & Bar-Raiser`)**
  - **Male Interviewer (`Marcus Sterling · Chief Product & Technology Officer`)**
- Questions are spoken aloud via AI voice synthesis, and the candidate answers aloud via live microphone voice capture.

## 5. Timing, Pacing & Calm-Under-Pressure Feedback

Feedback evaluates both content and vocal composure under pressure:
- **Response Delay (Time-to-First-Word)**: Measures whether the candidate starts speaking clearly within 2–4 seconds.
- **Pacing (Words Per Minute)**: Targets a steady 120–165 WPM pace (flagging rushing >165 WPM or stalling <95 WPM).
- **Filler-Word Count**: Counts filler words (*"um"*, *"uh"*, *"like"*, *"basically"*, *"sort of"*) that weaken authority.
- **Calm-Under-Pressure Score (0–100)**: Combines pacing, countdown-clock adherence, filler count, and concrete numbers into a clear composure score.

## 6. Mandatory Anti-Slop Gate (`no-ai-slop`)

Before showing any question, rebuttal, or feedback to the candidate, automatically apply `.agents/skills/no-ai-slop/SKILL.md`:
- Never display raw internal reference codes (`R1`, `R2`, `R3`, `J1`, `J2`, `J4`, `R1..Rn`, `J1..Jn`) or fake trademark symbols (`™`) in customer-facing text. Always quote or summarize the human resume bullet or job requirement directly.
- Cut banned buzzwords (`leverage`, `delve`, `foster`, `utilize`, `empower`, `streamline`, `robust`, `cutting-edge`, `seamless`, `elevate`, `unlock`, `supercharge`, `telemetry`, `calibration`, `counterfactuals`, `gravitas`).
