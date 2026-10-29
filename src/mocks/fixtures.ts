import type {
  ResumeLine,
  JdRequirement,
  Question,
  Session,
  Feedback,
} from '@contracts';

export const SAMPLE_ROLE_TITLE = 'Senior Product Analyst';
export const SAMPLE_COMPANY = 'FinFlow';

export const SAMPLE_JD_TEXT = `About the role:
FinFlow is looking for a Senior Product Analyst to join our Core Payments & Retention squad. You will partner closely with Product Managers, Engineers, and Account Management to uncover growth levers, reduce involuntary and voluntary churn, and drive self-serve analytics adoption across the company.

Key Responsibilities & Requirements:
- 3+ years of experience in product analytics, data science, or business intelligence in a fast-paced SaaS or fintech environment.
- Advanced SQL proficiency and hands-on experience building scalable data models with dbt and BigQuery or Snowflake.
- Proven track record of designing, sizing, and analysing A/B experiments (onboarding, checkout, or pricing flows) with statistical rigour.
- Experience building self-serve BI dashboards in Looker or Tableau adopted by commercial and customer-facing teams.
- Deep familiarity with subscription billing, payment recovery, and cohort retention metrics (NDR, LTV, logo churn).
- Strong stakeholder communication skills: ability to translate noisy product event data into clear executive recommendations.
- Experience partnering with engineering to define and govern event-tracking taxonomies (Segment, Amplitude, or Mixpanel).`;

export const SAMPLE_RESUME_LINES: ResumeLine[] = [
  {
    id: 'R1',
    text: 'Product Analyst at PayPulse (B2B SaaS fintech, 2023–Present) supporting Checkout and Merchant Retention squads.',
  },
  {
    id: 'R2',
    text: 'Partnered with PM and 5 engineers to redesign the 4-step merchant onboarding flow, lifting 7-day activation from 41% to 54% across 12,000 signups.',
  },
  {
    id: 'R3',
    text: 'Designed and analysed 18 A/B tests on payment retry logic and dunning emails using Python (scipy) and SQL, recovering $420K in annualised ARR.',
  },
  {
    id: 'R4',
    text: 'Built an automated merchant churn-risk dashboard in Looker used weekly by 40 account managers, reducing logo churn by 14% over two quarters.',
  },
  {
    id: 'R5',
    text: 'Refactored 22 legacy SQL reporting scripts into modular dbt models on BigQuery, cutting daily pipeline runtime by 58% and reducing warehouse spend by 25%.',
  },
  {
    id: 'R6',
    text: 'Led migration of subscription billing analytics to Stripe Webhook events, reconciling a 6% revenue reporting discrepancy with Finance.',
  },
  {
    id: 'R7',
    text: 'Audited and standardised 85 frontend product events in Segment and Amplitude, raising tracking schema compliance from 64% to 97%.',
  },
  {
    id: 'R8',
    text: 'Junior Data Analyst at RetailLoop (2021–2023), owning weekly executive KPI packs and cohort retention reporting.',
  },
  {
    id: 'R9',
    text: 'Built a self-serve SQL query library and ran bi-weekly Looker office hours for 25 non-technical operations and marketing stakeholders.',
  },
  {
    id: 'R10',
    text: 'Presented quarterly pricing-tier elasticity analysis to VP of Product, informing a packaging change that lifted expansion revenue by 11%.',
  },
  {
    id: 'R11',
    text: 'B.Sc. in Economics & Statistics, University of Manchester (First Class Honours, 2021).',
  },
  {
    id: 'R12',
    text: 'Technical stack: SQL (BigQuery, Postgres), dbt, Python (pandas, scipy), Looker, Amplitude, Segment, Git.',
  },
];

export const SAMPLE_JD_REQUIREMENTS: JdRequirement[] = [
  {
    id: 'J1',
    text: '3+ years of experience in product analytics or BI within a SaaS or fintech environment.',
  },
  {
    id: 'J2',
    text: 'Advanced SQL proficiency and hands-on experience building modular data models in dbt and BigQuery.',
  },
  {
    id: 'J3',
    text: 'Proven track record of designing, sizing, and analysing A/B experiments on onboarding or payment flows.',
  },
  {
    id: 'J4',
    text: 'Experience building self-serve Looker dashboards adopted by commercial and account management teams.',
  },
  {
    id: 'J5',
    text: 'Deep familiarity with subscription billing, payment recovery, and cohort churn metrics.',
  },
  {
    id: 'J6',
    text: 'Ability to translate complex product usage data into actionable executive recommendations.',
  },
  {
    id: 'J7',
    text: 'Experience partnering with engineering to govern event tracking taxonomies in Segment or Amplitude.',
  },
];

export function buildQuestionsForSession(sessionId: string): Question[] {
  return [
    {
      id: `${sessionId}-q1`,
      session_id: sessionId,
      position: 1,
      type: 'behavioural',
      text: 'Walk me through how you built the Looker churn-risk dashboard for those 40 account managers at PayPulse. How did you decide which signals to include and drive weekly adoption?',
      why_asking:
        'Tests whether your Looker dashboard experience transfers to enabling our commercial and retention teams.',
      resume_refs: ['R4', 'R9'],
      jd_refs: ['J4', 'J5'],
    },
    {
      id: `${sessionId}-q2`,
      session_id: sessionId,
      position: 2,
      type: 'technical',
      text: 'In your 18 A/B tests on payment retry logic and dunning emails, how did you handle sample sizing, skewed revenue distributions, and guardrail metrics before calling a winner?',
      why_asking:
        'Probes the statistical depth behind your $420K ARR payment recovery experiments against our experimentation requirement.',
      resume_refs: ['R3', 'R12'],
      jd_refs: ['J3', 'J5'],
    },
    {
      id: `${sessionId}-q3`,
      session_id: sessionId,
      position: 3,
      type: 'technical',
      text: 'When you refactored 22 legacy SQL scripts into modular dbt models on BigQuery and cut runtime by 58%, how did you structure your staging and mart layers and validate data parity?',
      why_asking:
        'Verifies hands-on dbt and BigQuery data modelling experience required for our analytics stack.',
      resume_refs: ['R5', 'R6'],
      jd_refs: ['J2'],
    },
    {
      id: `${sessionId}-q4`,
      session_id: sessionId,
      position: 4,
      type: 'behavioural',
      text: 'Tell me about presenting your pricing-tier elasticity findings to the VP of Product. What pushback did you get, and how did you frame the data to land the 11% expansion lift?',
      why_asking:
        'Evaluates executive communication and influence with senior product leadership for commercial decisions.',
      resume_refs: ['R10', 'R2'],
      jd_refs: ['J6'],
    },
    {
      id: `${sessionId}-q5`,
      session_id: sessionId,
      position: 5,
      type: 'situational',
      text: 'Imagine our Core Payments squad ships a new checkout flow next Tuesday, but 30% of Segment events are firing with missing properties. Drawing on your tracking audit, how would you triage and prevent this?',
      why_asking:
        'Connects your Segment and Amplitude schema governance work to real tracking incidents with engineering.',
      resume_refs: ['R7', 'R2'],
      jd_refs: ['J7'],
    },
    {
      id: `${sessionId}-q6`,
      session_id: sessionId,
      position: 6,
      type: 'role_fit',
      text: 'Looking across your onboarding activation uplift (41% to 54%) and Stripe billing migration, what would your first 60 days as Senior Product Analyst on FinFlow’s Core Payments & Retention squad look like?',
      why_asking:
        'Assesses how you turn your fintech retention and onboarding background into a concrete 60-day plan for this role.',
      resume_refs: ['R1', 'R2', 'R6'],
      jd_refs: ['J1', 'J5'],
    },
  ];
}

export function buildSeedData(userId: string): {
  sessions: Session[];
  questions: Question[];
  answers: Feedback[];
} {
  const session1Id = 'seed-session-completed-1';
  const session2Id = 'seed-session-inprogress-2';

  const qSession1 = buildQuestionsForSession(session1Id);
  const qSession2 = buildQuestionsForSession(session2Id);

  const answersSession1: Feedback[] = [
    {
      question_id: `${session1Id}-q1`,
      answer_text:
        'At PayPulse, account managers were reacting to churn only after merchants cancelled. I shadowed 6 AMs to learn their workflow, then built a Looker dashboard combining 14-day payment failure spikes and login drops. I ran bi-weekly office hours for 40 account managers and added Slack alerts, which drove 88% weekly active usage and reduced logo churn by 14% over two quarters.',
      scores: { relevance: 5, evidence: 5, structure: 4, impact: 5 },
      overall: 94,
      what_worked:
        'Uses your Looker dashboard and office-hours experience with clear context, actions, and outcomes (40 account managers, 14% logo churn reduction).',
      one_fix:
        'Name which signal (failed payment velocity vs. seat usage) predicted churn best when you defined the risk score.',
      stronger_answer:
        'At PayPulse, our account management team lacked early warning signals before merchants churned. I worked with commercial leads to define a health score in dbt and surfaced it in an automated Looker churn-risk dashboard. To get all 40 account managers using it weekly, I ran bi-weekly Looker office hours and wrote workflow playbooks, cutting logo churn by 14% over two quarters.',
      unsupported_claims: [],
    },
    {
      question_id: `${session1Id}-q2`,
      answer_text:
        'When running the 18 A/B tests on payment retry intervals and dunning emails at PayPulse, I used Python (scipy) to run power calculations ahead of time so we could detect a 2% recovery lift with 80% power. Because merchant transaction volume was heavily right-skewed, I evaluated both binary invoice recovery rate and winsorized ARR per merchant, recovering $420K in annualised ARR while monitoring voluntary cancellation rate as our primary guardrail.',
      scores: { relevance: 5, evidence: 5, structure: 4, impact: 5 },
      overall: 94,
      what_worked:
        'Explains power sizing, skewed distribution handling in Python (scipy), and the $420K ARR impact from your resume.',
      one_fix:
        'Add one sentence on how you kept overlapping retry experiments from competing for the same delinquent merchant cohort.',
      stronger_answer:
        'Across 18 payment retry and dunning email A/B tests at PayPulse, I sized each experiment in Python (scipy) using historical invoice failure baselines. To handle skewed merchant ARR, I paired 7-day invoice recovery rate with winsorized recovered revenue and a strict voluntary-churn guardrail, recovering $420K in annualised ARR.',
      unsupported_claims: [],
    },
    {
      question_id: `${session1Id}-q3`,
      answer_text:
        'Our BigQuery warehouse had 22 monolithic SQL scripts that recalculated raw Stripe and product tables from scratch each morning. I refactored them into a three-tier dbt setup: staging views, reusable intermediate models, and incremental mart tables partitioned by event date. I checked row counts and revenue totals against the legacy outputs for 14 days, cutting daily pipeline runtime by 58% and warehouse compute spend by 25%.',
      scores: { relevance: 5, evidence: 5, structure: 4, impact: 4 },
      overall: 88,
      what_worked:
        'Cites the 22 SQL scripts, BigQuery and dbt refactoring, 58% runtime cut, and 25% cost savings from your resume.',
      one_fix:
        'Mention how you used your Stripe Webhook reconciliation work inside your automated dbt schema and discrepancy tests.',
      stronger_answer:
        'When I inherited 22 legacy SQL scripts on BigQuery at PayPulse, daily builds were slow and fragile. I restructured the pipeline into modular dbt staging, intermediate, and incremental mart models, adding automated dbt tests informed by our Stripe Webhook billing migration that resolved a 6% Finance discrepancy. This cut daily pipeline runtime by 58% and lowered BigQuery spend by 25%.',
      unsupported_claims: [],
    },
    {
      question_id: `${session1Id}-q4`,
      answer_text:
        'When I presented my pricing-tier elasticity analysis to the VP of Product, the initial concern was that raising thresholds on our mid-tier plan would hurt new merchant conversion. I segmented historical cohorts by transaction volume and combined that with findings from our onboarding flow redesign (41% to 54% activation) to show high-intent merchants were under-monetised. The VP approved a phased rollout that lifted expansion revenue by 11%.',
      scores: { relevance: 4, evidence: 4, structure: 4, impact: 4 },
      overall: 75,
      what_worked:
        'Connects the VP of Product elasticity presentation and 11% expansion lift with concrete pushback handling.',
      one_fix:
        'Describe the exact sensitivity scenarios you showed the VP so the downside risk was clear.',
      stronger_answer:
        'In my quarterly pricing-tier elasticity presentation to the VP of Product, leadership worried a packaging change might slow top-of-funnel activation. I brought cohort retention data alongside evidence from our merchant onboarding redesign, where we lifted 7-day activation from 41% to 54% across 12,000 signups, to prove activation held steady. Framing three revenue sensitivity scenarios helped us agree on a packaging update that increased expansion revenue by 11%.',
      unsupported_claims: [],
    },
    {
      question_id: `${session1Id}-q5`,
      answer_text:
        'First, I would isolate the broken release version in Amplitude and alert the 5 checkout engineers so we hotfix the missing Segment properties immediately. Longer term, based on my audit of 85 frontend events at PayPulse where I raised schema compliance from 64% to 97%, I would introduce a shared tracking plan with automated CI schema validation before any checkout PR merges.',
      scores: { relevance: 4, evidence: 4, structure: 3, impact: 4 },
      overall: 69,
      what_worked:
        'Uses your 85-event Segment and Amplitude audit (64% to 97% compliance) to back up the prevention plan.',
      one_fix:
        'Explain how you would quarantine or backfill the 30% malformed events in dbt so downstream Looker dashboards stay accurate.',
      stronger_answer:
        'In the first hour, I would work with the checkout engineers to find which client release dropped the Segment properties and filter broken payloads in dbt staging so Looker reporting stays clean. To stop it happening again, I would use the playbook from my PayPulse audit of 85 Segment and Amplitude events, where we raised schema compliance from 64% to 97%, by adding a schema check in pull requests.',
      unsupported_claims: [],
    },
    {
      question_id: `${session1Id}-q6`,
      answer_text:
        'In my first 30 days at FinFlow, I would audit the dbt/BigQuery billing models and Segment event taxonomy, much like my Stripe Webhook migration that fixed a 6% Finance discrepancy. By days 31–60, I would partner with PMs and Account Management to ship a self-serve Looker retention health view and scope our first two A/B experiments on involuntary payment recovery.',
      scores: { relevance: 4, evidence: 4, structure: 4, impact: 3 },
      overall: 69,
      what_worked:
        'Combines your Stripe migration, Looker dashboard, and A/B testing work into a practical 30/60-day onboarding plan for FinFlow’s Core Payments & Retention squad.',
      one_fix:
        'Set a concrete target for day 60 by citing your past 41% to 54% onboarding lift or $420K ARR recovery as a baseline for sizing your first test.',
      stronger_answer:
        'During days 1–30, I would audit FinFlow’s BigQuery and dbt billing tables and Segment taxonomy, drawing on my Stripe Webhook migration that resolved a 6% revenue discrepancy and my 85-event schema audit. In days 31–60, I would build a Looker churn-risk workflow like the one that cut logo churn 14% across 40 AMs and launch payment-recovery A/B tests modelled on the 18 experiments that recovered $420K ARR at PayPulse.',
      unsupported_claims: [],
    },
  ];

  const answersSession2: Feedback[] = [
    {
      question_id: `${session2Id}-q1`,
      answer_text:
        'At PayPulse I built a Looker churn-risk dashboard for 40 account managers. We tracked login frequency and failed invoice payments, held Looker office hours every two weeks, and reduced logo churn by 14% over two quarters.',
      scores: { relevance: 4, evidence: 5, structure: 3, impact: 4 },
      overall: 75,
      what_worked:
        'Cites the 40 account managers and 14% churn reduction plus bi-weekly office hours from your resume.',
      one_fix:
        'Add the Situation and Task first: explain how account managers spotted at-risk accounts before your dashboard existed.',
      stronger_answer:
        'Before my project at PayPulse, 40 account managers relied on manual spreadsheets to spot at-risk merchants. I built an automated Looker churn-risk dashboard surfacing payment failures and usage drops, and ran bi-weekly office hours to build it into their weekly prep, cutting logo churn by 14% over two quarters.',
      unsupported_claims: [],
    },
    {
      question_id: `${session2Id}-q2`,
      answer_text:
        'I designed and analysed 18 A/B tests on payment retry logic and dunning emails using Python scipy and SQL. We recovered $420K in annualised ARR by optimizing retry timing around payday cycles while keeping merchant unsubscribe rates flat.',
      scores: { relevance: 4, evidence: 5, structure: 3, impact: 5 },
      overall: 81,
      what_worked:
        'Uses your resume evidence (18 A/B tests, Python scipy, $420K ARR recovered) and names the unsubscribe guardrail.',
      one_fix:
        'Explain how you calculated minimum detectable effect and handled variance in merchant invoice sizes.',
      stronger_answer:
        'Across 18 payment retry and dunning A/B tests at PayPulse, I used Python (scipy) and SQL to run pre-test power calculations and stratified merchants by billing tier. Testing retry windows against an unsubscribe guardrail recovered $420K in annualised ARR.',
      unsupported_claims: [],
    },
    {
      question_id: `${session2Id}-q3`,
      answer_text:
        'I refactored 22 legacy SQL scripts into modular dbt models on BigQuery, which cut daily pipeline runtime by 58% and reduced warehouse spend by 25%. I also led a team of 12 data engineers to rebuild the entire company lakehouse Saving 3 million dollars.',
      scores: { relevance: 4, evidence: 3, structure: 3, impact: 4 },
      overall: 63,
      what_worked:
        'References the 22 SQL scripts, dbt on BigQuery, 58% faster runtime, and 25% cost reduction from your resume.',
      one_fix:
        'Keep to what is on your resume: remove the unverified claim about leading 12 data engineers and saving $3M, and explain how you structured your dbt staging and mart layers.',
      stronger_answer:
        'At PayPulse, I refactored 22 legacy SQL reporting scripts into modular staging and incremental mart models in dbt on BigQuery, and aligned billing definitions with our Stripe Webhook migration that closed a 6% Finance gap. This cut daily pipeline runtime by 58% and reduced BigQuery spend by 25%.',
      unsupported_claims: [
        'I also led a team of 12 data engineers to rebuild the entire company lakehouse Saving 3 million dollars.',
      ],
    },
  ];

  const sessions: Session[] = [
    {
      id: session1Id,
      user_id: userId,
      role_title: 'Senior Product Analyst',
      company: 'FinFlow',
      jd_text: SAMPLE_JD_TEXT,
      resume_path: `resumes/${userId}/${session1Id}.pdf`,
      resume_lines: SAMPLE_RESUME_LINES,
      jd_requirements: SAMPLE_JD_REQUIREMENTS,
      status: 'completed',
      overall_score: 82,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    },
    {
      id: session2Id,
      user_id: userId,
      role_title: 'Product Data Scientist',
      company: 'Monzo',
      jd_text: SAMPLE_JD_TEXT,
      resume_path: `resumes/${userId}/${session2Id}.pdf`,
      resume_lines: SAMPLE_RESUME_LINES,
      jd_requirements: SAMPLE_JD_REQUIREMENTS,
      status: 'in_progress',
      overall_score: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      completed_at: null,
    },
  ];

  return {
    sessions,
    questions: [...qSession1, ...qSession2],
    answers: [...answersSession1, ...answersSession2],
  };
}
