// Guesses the role title and company from a job spec, so the candidate does
// not have to type them. Runs in the browser, instantly, with no API call.
// It only ever suggests: the fields stay editable, and an empty result is fine.

const ROLE_WORD =
  /\b(analyst|engineer|manager|designer|developer|lead|director|specialist|consultant|officer|scientist|coordinator|associate|executive|architect|administrator|assistant|advisor|adviser|strategist|accountant|researcher|representative|intern|head of|vp|vice president|owner|partner|technician|writer|editor|marketer|recruiter|controller|planner|programmer|tester|nurse|teacher|operator)s?\b/i;

const NOT_A_COMPANY =
  /^(the|this|our|we|you|us|role|position|job|team|company|client|it|they|a|an)$/i;

const tidy = (s: string) =>
  s
    .replace(/[*_#`"“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:|,.]+|[\s\-–—:|,.;!]+$/g, '')
    .trim();

// "experienced and adaptable Senior Business Analyst" -> "Senior Business Analyst".
const FILLER =
  /^(?:an?|the|and|&|or|experienced|talented|passionate|motivated|self-motivated|driven|results-driven|dynamic|adaptable|ambitious|enthusiastic|skilled|highly|proactive|detail-oriented|exceptional|outstanding|creative|innovative|brilliant|confident|curious|seasoned|versatile|energetic|hands-on|commercially|minded|commercially-minded|strategic|analytical|organised|organized|hardworking|hard-working|friendly|great|strong|exciting|new|an|our|your)$/i;

function stripFiller(text: string): string {
  let words = text.split(' ');
  while (words.length > 1 && FILLER.test(words[0].replace(/[,;]$/, ''))) words = words.slice(1);
  return words.join(' ');
}

function dropLeadingAdjectives(title: string): string {
  let words = title.split(' ');
  // Job titles are written in capitals; leading lowercase words are description.
  const firstCap = words.findIndex((w) => /^[A-Z0-9]/.test(w));
  if (firstCap > 0) words = words.slice(firstCap);
  while (words.length > 1 && FILLER.test(words[0].replace(/[,;]$/, ''))) words = words.slice(1);
  return words.join(' ');
}

const cleanTitle = (raw: string): string | null => {
  let t = stripFiller(tidy(raw))
    // "Senior Analyst to join our team" -> "Senior Analyst"
    .split(/\s+(?:to|who|that|which|with|for|in|on|based|located|reporting|within|join|\(|-|–|—|\|)\s+|[,.;(]/i)[0];
  t = tidy(t.replace(/^(?:an?|the)\s+/i, ''));
  t = dropLeadingAdjectives(t);
  if (!t || t.length > 70 || t.split(' ').length > 8) return null;
  if (!ROLE_WORD.test(t)) return null;
  return t;
};

const cleanCompany = (raw: string): string | null => {
  const c = tidy(raw.split(/\s+(?:is|are|has|was|were|we|-|–|—|\|)\s+|[,.;:(]/i)[0]);
  if (!c || c.length > 50 || c.split(' ').length > 5) return null;
  if (NOT_A_COMPANY.test(c) || ROLE_WORD.test(c)) return null;
  // A company name starts with a capital or a digit (FinFlow, 3M, eBay is rare enough).
  if (!/^[A-Z0-9]/.test(c)) return null;
  return c;
};

export interface JobSpecDetails {
  roleTitle: string | null;
  company: string | null;
}

export function guessJobSpecDetails(text: string): JobSpecDetails {
  const src = text.slice(0, 6000);
  const lines = src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let roleTitle: string | null = null;
  let company: string | null = null;
  const setTitle = (v: string | undefined) => {
    if (!roleTitle && v) roleTitle = cleanTitle(v);
  };
  const setCompany = (v: string | undefined) => {
    if (!company && v) company = cleanCompany(v);
  };

  // 1. Labelled fields: "Job title: Senior Analyst", "Company: FinFlow".
  for (const line of lines.slice(0, 40)) {
    const t = line.match(/^(?:job\s*title|role\s*title|role|position|title|vacancy|job)\s*[:\-–—]\s*(.+)$/i);
    if (t) setTitle(t[1]);
    const c = line.match(/^(?:company(?:\s*name)?|employer|organi[sz]ation|hiring\s+company|client)\s*[:\-–—]\s*(.+)$/i);
    if (c) setCompany(c[1]);
  }

  // 2. "FinFlow is looking for a Senior Product Analyst to join..."
  const hiring = src.match(
    /\b([A-Z][\w&.'’-]*(?:[ \t]+[A-Z][\w&.'’-]*){0,3})[ \t]+(?:is|are)[ \t]+(?:currently[ \t]+)?(?:looking[ \t]+for|hiring|seeking|searching[ \t]+for|recruiting)[ \t]+(?:an?[ \t]+|the[ \t]+)?([^\n.;]{3,90})/
  );
  if (hiring) {
    setCompany(hiring[1]);
    setTitle(hiring[2]);
  }

  // 3. "We are looking for a Senior Product Analyst" / "As a Senior Analyst, you will..."
  const we = src.match(
    /\b(?:we\s+are|we're|we\s+are\s+currently)\s+(?:looking\s+for|hiring|seeking|recruiting)\s+(?:an?\s+|the\s+)?(?:talented\s+|experienced\s+|passionate\s+)?([^\n.;]{3,90})/i
  );
  if (we) setTitle(we[1]);
  const asA = src.match(/\bAs\s+(?:an?|the|our)\s+([^\n,.;]{3,70}),\s+you\b/);
  if (asA) setTitle(asA[1]);

  // 4. A short line near the top: "Senior Product Analyst at FinFlow" or just the title.
  for (const line of lines.slice(0, 8)) {
    if (line.length > 90) continue;
    const at = line.match(/^(.+?)\s+(?:at|@|-|–|—|\|)\s+([A-Z][^,|]{1,40})$/);
    if (at && cleanTitle(at[1])) {
      setTitle(at[1]);
      setCompany(at[2]);
    }
    if (!roleTitle && !/[.:]$/.test(line) && !/^about\b/i.test(line)) setTitle(line);
  }

  // 5. "About FinFlow" / "Join FinFlow" / "Why FinFlow?"
  for (const line of lines.slice(0, 60)) {
    const m = line.match(/^(?:about|join|why|life\s+at|working\s+at)\s+(?!the\b|this\b|us\b|you\b|our\b|me\b)(.{2,45}?)[?!:]?$/i);
    if (m) setCompany(m[1]);
  }
  const joinInline = src.match(/\b(?:join|at|with)[ \t]+([A-Z][\w&.'’-]+(?:[ \t]+[A-Z][\w&.'’-]+){0,2})(?:'s|’s)?[ \t]+(?:team|squad|mission|growing|as\b)/);
  if (joinInline) setCompany(joinInline[1]);

  return { roleTitle, company };
}
