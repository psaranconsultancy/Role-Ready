---
name: grill-with-docs
description: RoleReady bespoke skill combining relentless multi-round interview grilling with live document ingestion (board decks, 10-Ks, RFCs, case studies, shared URLs) and real-time generation of Candidate Decision Records (CDRs) and a Niche & C-Suite Domain Glossary as the candidate answers each round.
disable-model-invocation: false
---

# Grill With Docs (RoleReady Edition) — Document-Grounded Interview Grilling + Live Decision Log & Glossary

> **Scope Note**: Globally (`~/.agents/skills/grill-with-docs`), `grill-with-docs` interviews a user to sharpen a software plan while creating Architecture Decision Records (ADRs) and a domain glossary as you go. In **RoleReady**, `grill-with-docs` is bespoke to high-stakes job interview preparation across separate **Niche Specialist** and **C-Suite Executive** categories.

## How `grill-with-docs` Works in RoleReady

Call `grilling` alongside live document synthesis so that every interview round both **reads the candidate's uploaded documents** and **writes a structured Interview Prep Dossier as they answer**:

### 1. Multi-Document & Link Ingestion (Input Docs)
Before asking a question, cross-reference:
- **Resume PDF bullets** and **Job Description requirements** (using human-readable quotes, never raw internal IDs like `R1` or `J2`).
- **Uploaded Supplemental Docs**: Board decks, 10-K filings, 30-60-90 day plans, technical architecture RFCs, clinical protocols, or case study PDFs.
- **Shared Context Links**: Investor memos, product documentation, earnings transcripts, or company strategy pages.
- **Dedicated Niche Category**: e.g., Regulated FinTech & Cross-Border Payments, AI Agents & Inference Infra, PE Portfolio Turnaround, Clinical Biotech, Zero-Trust Security, Quant Risk, Enterprise PLG, Deep-Tech Hardware.
- **Dedicated C-Suite Category**: CEO, CPO, CTO, CFO, COO, CRO, CISO, Board Director, or Specialist IC/Director track.

### 2. Live Candidate Decision Records — CDRs (Generated Output Doc 1)
Just as software engineering uses ADRs to record architectural trade-offs, `grill-with-docs` creates a **Candidate Decision Record (CDR)** for each frontier question settled during Round 1 and Round 2:
- **Decision Title & Context**: The exact panel challenge, referencing the uploaded deck/RFC and job requirement.
- **Decision Taken & Personal Ownership**: The specific call the candidate made (separating personal action from team momentum).
- **Trade-Off & What Was Cut**: The competing project, budget item, or scope cut the candidate defended.
- **Proof & Rollback Threshold**: The before/after metric and the 14-day safety metric that triggers a rollback if the plan breaks.

### 3. Niche & C-Suite Domain Glossary (Generated Output Doc 2)
As the candidate works through the rounds, `grill-with-docs` maintains a **Role & Domain Glossary** that maps:
- **Domain / Board Term**: The exact term expected by hiring panels in the selected **Niche Category** and **C-Suite Category**.
- **What the Panel Is Really Testing**: Why the interviewer listens for this concept.
- **Your Grounded Proof**: How the candidate's resume and uploaded documents prove mastery of that term.

### 4. Exportable Interview Dossier (`.md` / Clipboard)
At any point during or after the grilling rounds, the candidate can copy or download their complete **Grill-With-Docs Interview Dossier** combining:
1. Settled Candidate Decision Records (CDR-01..CDR-04)
2. Niche & C-Suite Domain Glossary
3. Voice Timing & Calm-Under-Pressure Readout
4. Word-for-Word Salary & Equity Negotiation Script

### 5. Mandatory Anti-Slop Gate (`no-ai-slop`)
Every generated question, Decision Record, and Glossary definition must pass `.agents/skills/no-ai-slop/SKILL.md`:
- Zero banned AI buzzwords (`leverage`, `delve`, `foster`, `utilize`, `empower`, `streamline`, `robust`, `cutting-edge`, `seamless`, `elevate`, `unlock`, `supercharge`, `telemetry`, `calibration`, `counterfactuals`, `gravitas`).
- Zero raw developer reference codes (`R1`, `R3`, `J2`, `R1..Rn`, `J1..Jn`) or fake trademark symbols (`™`).
