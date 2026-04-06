# **LSA Free Audit Tool — Build Spec**

**Local Search Ally | AI-Powered Local SEO Auditor for Contractors**

---

## **1\. What This Is**

A free tool on localsearchally.com that takes inputs from a contractor, runs a live AI-powered 7-section local SEO audit using real web research, returns an instant scored report, and captures their email in exchange for the full action plan.

It replaces the cold "book a call" CTA as the site's primary conversion driver.

---

## **2\. Architecture Overview**

\[Contractor fills form\]  
        ↓  
\[React frontend → POST /api/audit (SSE stream)\]  
        ↓  
\[Next.js API route calls Claude API \+ web\_search\]  
        ↓  
\[Claude researches GBP, site, citations, etc.\]  
        ↓  
\[SSE streams section scores as they complete → UI fills in progressively\]  
        ↓  
\[Final JSON stored in Supabase → unique shareable URL generated\]  
        ↓  
\[Email gate unlocks full action list → Resend sends PDF\]  
        ↓  
\[Slack notification fires to Chad → CRM tagged by trade/city/score\]  
        ↓  
\[Email follow-up sequence → Calendly booking\]

---

## **3\. Tech Stack**

| Layer | Choice | Why |
| ----- | ----- | ----- |
| Framework | Next.js 14 (App Router) | API routes \+ React in one repo |
| Styling | Tailwind CSS \+ CSS Modules | Tailwind for layout/spacing, CSS Modules for component styles |
| AI | Anthropic claude-sonnet-4-20250514 | Best balance of speed \+ quality |
| Web Search | Built-in `web_search_20250305` tool | Real-time GBP/site data |
| Email | Resend \+ React Email | Reliable, easy PDF attachment |
| PDF Report | Puppeteer or @react-pdf/renderer | Branded output |
| Hosting | Vercel | Zero-config Next.js deploy |
| Database | Supabase | Shareable result URLs \+ audit cache |
| Rate Limiting | Upstash Redis | IP-based abuse prevention |
| Analytics | Plausible (or GA4) | Track completions, email captures |

---

## **3a. Styling Architecture**

Three-layer system — each layer has a specific job:

| Layer | File | Used for |
| ----- | ----- | ----- |
| CSS custom properties | `app/globals.css` | Brand tokens — single source of truth for all colors and fonts |
| CSS Modules | `styles/audit.module.css` | Component-specific visual styles, animations, pseudo-selectors |
| Tailwind utilities | inline `className` | Layout, spacing, flex/grid, responsive breakpoints |

**Rules (also in AGENTS.md):**

* Brand token values (colors, fonts) live only in `globals.css` as CSS vars — never hardcode hex values or font names in JSX or module files  
* CSS Modules consume tokens via `var(--carolina)`, `var(--font-ui)`, etc.  
* Tailwind extended in `tailwind.config.ts` to expose brand tokens as utility classes (`text-carolina`, `bg-slate`, etc.)  
* Dynamic state (green/yellow/red score colors) driven by `data-status` attribute selectors in the CSS module — not inline styles  
* **Inline styles are only acceptable for SVG geometry that requires runtime-calculated numbers** (e.g. `strokeDasharray` on the score gauge). Everything else belongs in CSS Modules or Tailwind.

**File locations:**

app/globals.css          ← CSS vars \+ Google Fonts import \+ base resets  
styles/audit.module.css  ← All audit tool component styles  
tailwind.config.ts       ← Extends Tailwind theme with brand tokens  
app/components/  
  AuditTool.tsx          ← Main component (imports styles as \`styles\`)

---

## **4\. Input Form**

Four fields plus a no-website toggle:

interface AuditInput {  
  businessName: string;    // "Rogers HVAC Pro"  
  websiteUrl:   string;    // "rogershvacpro.com" (conditionally required)  
  primaryTrade: string;    // "HVAC" (dropdown)  
  serviceCity:  string;    // "Rogers, AR"  
  noWebsite:    boolean;   // hides websiteUrl field, adjusts prompt  
}

**Trade dropdown options:** HVAC · Plumbing · Electrical · Roofing · Landscaping · Remodeling · General Contracting · Other

**Validation:**

* Business name: required, min 2 chars  
* URL: required unless noWebsite is checked; add https:// if missing  
* Trade: required, from list  
* City: required, min 2 chars

**No-website UX:** When "No website yet" is checked, replace the URL input with a red notice:

"No website \= invisible in Google search. We'll show you what to do about it."

This primes the contractor for the low onpage/technical/backlinks scores, and frames those findings as urgent before they see results.

---

## **5\. API Route**

**File:** `app/api/audit/route.ts`

// POST /api/audit  
// Body: AuditInput  
// Returns: SSE stream of { event: "section"|"complete"|"error", data: ... }

export const maxDuration \= 120; // Vercel max timeout

export async function POST(req: Request) {  
  const input: AuditInput \= await req.json();  
  const encoder \= new TextEncoder();

  const stream \= new ReadableStream({  
    async start(controller) {  
      const send \= (event: string, data: unknown) \=\> {  
        controller.enqueue(encoder.encode(  
          \`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n\`  
        ));  
      };

      try {  
        const result \= await runAudit(input, (section) \=\> {  
          // Called each time a section is parsed from the stream  
          send("section", section);  
        });

        // Store in Supabase and return shareable ID  
        const { id } \= await supabase  
          .from("audits")  
          .insert({ ...result, input, created\_at: new Date() })  
          .select("id").single();

        send("complete", { ...result, auditId: id });

        // Fire Slack notification  
        await notifySlack(result, input, id);

      } catch (err) {  
        send("error", { message: err.message });  
      } finally {  
        controller.close();  
      }  
    }  
  });

  return new Response(stream, {  
    headers: {  
      "Content-Type": "text/event-stream",  
      "Cache-Control": "no-cache",  
      "Connection": "keep-alive",  
    },  
  });  
}

**Note on true streaming:** The Claude API with web\_search tool doesn't stream section-by-section natively — it returns the full JSON at the end. For the SSE pattern above, parse the completed JSON and emit each section with a short delay (150ms stagger) to create a progressive reveal effect while keeping a single API call. True streaming requires prompt engineering Claude to output sections sequentially as separate JSON objects.

---

## **6\. System Prompt**

You are a local SEO specialist auditing a contractor's online presence for  
Local Search Ally. Research the business using web search and produce an honest,  
scored audit across 7 sections. Return ONLY valid JSON — no preamble, no markdown.

AUDIT SECTIONS (score each 1–10):  
1\. gbp — Google Business Profile: claimed, complete, keyword-optimized description,  
   active with posts? Note photo count specifically — under 10 photos is a critical gap.  
2\. reviews — Quantity, recency, average rating, owner response rate.  
   Under 10 reviews or zero responses \= red.  
3\. onpage — Title tags, H1s, dedicated service pages, keyword targeting (trade \+ city).  
4\. technical — Core Web Vitals (LCP, INP, CLS from PageSpeed Insights if findable),  
   mobile-friendly, HTTPS, sitemap.xml present, AND schema markup: is there a  
   \<script type="application/ld+json"\> block with @type LocalBusiness or a trade  
   subtype (Plumber, HVACBusiness, Electrician, RoofingContractor)?  
   Does it include name, address, phone, serviceArea, openingHours?  
5\. citations — NAP consistency across Google, Yelp, BBB, Angi, HomeAdvisor.  
6\. backlinks — Domain authority signals, local/industry links, anchor text quality.  
7\. competitors — Top 3 Map Pack results for \[trade\] \[city\] AR. How does this  
   business compare on reviews, GBP completeness, and web presence?

NO-WEBSITE HANDLING: If the business has no website, score onpage, technical,  
and backlinks as 1 each. Set headline to "No website found — this is costing  
you calls every day." Skip URL-based checks for those sections only.

SCORING:  
\- 8–10 → status: "green"  
\- 5–7  → status: "yellow"  
\- 1–4  → status: "red"

SEARCH STRATEGY:  
\- Search "\[business name\] \[city\]" → GBP panel, photo count, review count  
\- Search "\[business name\] reviews" → recency, owner response rate  
\- Fetch homepage \+ a service page; look for JSON-LD schema block \+ CWV via PageSpeed  
\- Check \[website\]/sitemap.xml  
\- Search "\[trade\] \[city\] AR" → top 3 Map Pack competitors  
\- Search "\[business name\]" on Yelp, Angi, BBB for NAP consistency

REQUIRED JSON:  
{  
  "business\_name": string,  
  "overall\_score": number (average of 7 sections, rounded),  
  "overall\_label": "Strong" | "Solid" | "Needs Work" | "Critical",  
  "summary": string (1 sentence, plain English, specific),  
  "has\_website": boolean,  
  "score\_bucket": "Critical" | "Needs Work" | "Solid" | "Strong",  
  "sections": \[{  
    "id": "gbp|reviews|onpage|technical|citations|backlinks|competitors",  
    "name": string,  
    "score": number (1–10),  
    "status": "green" | "yellow" | "red",  
    "headline": string (plain English, no jargon),  
    "finding": string (2–3 sentences, business impact, specific),  
    "priority\_action": string (specific next step)  
  }\],  
  "top\_3\_actions": string\[\],  
  "competitor\_names": string\[\]  
}

VOICE: Plain English only. Every finding \= a business consequence (lost calls,  
lost jobs, invisible to Google). Be specific. Never invent data.

---

## **7\. User Prompt Builder**

function buildAuditPrompt(input: AuditInput): string {  
  const websiteLine \= input.noWebsite  
    ? "Website: NONE — this business has no website"  
    : \`Website: ${input.websiteUrl}\`;

  const noWebsiteNote \= input.noWebsite  
    ? "\\nNOTE: No website. Score onpage, technical, backlinks as 1\. Focus on GBP, reviews, citations, competitors."  
    : "";

  return \`  
Audit this contractor's local SEO:

Business Name: ${input.businessName}  
${websiteLine}  
Primary Trade: ${input.primaryTrade}  
Service City: ${input.serviceCity}  
${noWebsiteNote}

Research all 7 sections using web search. Return the JSON audit result only.  
  \`.trim();  
}

---

## **8\. Response Schema (TypeScript)**

interface AuditSection {  
  id: string;  
  name: string;  
  score: number;  
  status: "green" | "yellow" | "red";  
  headline: string;  
  finding: string;  
  priority\_action: string;  
}

interface AuditResult {  
  business\_name: string;  
  overall\_score: number;  
  overall\_label: "Strong" | "Solid" | "Needs Work" | "Critical";  
  summary: string;  
  has\_website: boolean;  
  score\_bucket: "Critical" | "Needs Work" | "Solid" | "Strong";  
  sections: AuditSection\[\];  
  top\_3\_actions: string\[\];  
  competitor\_names: string\[\];  
}

---

## **9\. Shareable Result URLs**

Every completed audit gets a unique URL. Think of it like a Loom recording link — permanent, shareable, no login needed.

**Database:** Supabase table `audits`

create table audits (  
  id          uuid primary key default gen\_random\_uuid(),  
  business\_name text,  
  overall\_score int,  
  score\_bucket  text,  
  trade         text,  
  city          text,  
  result        jsonb,      \-- full AuditResult  
  input         jsonb,      \-- AuditInput (for cache key)  
  created\_at    timestamptz default now()  
);

**URL pattern:** `localsearchally.com/audit/[uuid]`

**Cache logic:** Before calling Claude, check if an audit exists for the same URL in the last 24 hours. If yes, return cached result instantly. This saves \~$0.15 per repeat hit and responds in \<1 second.

const existing \= await supabase  
  .from("audits")  
  .select("\*")  
  .eq("input-\>\>websiteUrl", input.websiteUrl)  
  .gte("created\_at", new Date(Date.now() \- 86\_400\_000).toISOString())  
  .single();

if (existing.data) return existing.data; // Skip Claude call

**UI:** On the results page, show a "🔗 Share Results" button that copies the shareable URL to clipboard.

---

## **10\. Lead Notifications to Chad**

When a contractor submits their email:

**Slack webhook** (immediate):

await fetch(process.env.SLACK\_WEBHOOK\_URL, {  
  method: "POST",  
  body: JSON.stringify({  
    text: \`🔔 New audit lead\`,  
    blocks: \[{  
      type: "section",  
      text: {  
        type: "mrkdwn",  
        text: \`\*${businessName}\* — ${trade} in ${city}\\nScore: \*${score}/100\* (${scoreBucket})\\nEmail: ${email}\\n\<${siteUrl}/audit/${auditId}|View audit\>\`  
      }  
    }\]  
  })  
});

**What it tells you:** Business, trade, city, score, and a direct link to their audit. You know immediately if a 3/10 roofer in Rogers just opted in. Call them before they forget they ran the audit.

---

## **11\. Frontend UX Flow**

### **Step 1 — Input Form**

* 4 fields \+ "No website yet" checkbox  
* CTA: "Run My Free Audit →"  
* Below: "Real audit. Real data. 60–90 seconds."

### **Step 2 — Loading (Progressive)**

Each section chip updates with a checkmark as it "completes." Current section shows a pulsing dot indicator. No fake progress bar. Loading state mirrors the 7 sections so contractors know what's being checked.

### **Step 3 — Results (Partial Reveal)**

Sections animate in one by one (180ms stagger) after results land. Show immediately, no gate:

* Overall score gauge (animated fill)  
* All 7 section scores with traffic lights \+ one-line headline  
* Top 3 actions  
* Summary sentence \+ competitors found

**Email gate below the fold (sections 5–7 locked):**

"Your full action plan — ranked by impact — is ready." \[email input\] \[Send It →\]

### **Step 4 — Email Delivery**

On submit: Resend API → branded PDF report \+ Calendly CTA Subject: "Your Local SEO Audit — \[Business Name\]"

### **Step 5 — Post-Email**

* "Report on the way" confirmation  
* Book a call CTA (Calendly)

### **Step 6 — Re-Audit**

Persistent footer card: "Run this again in 30 days to track your progress." Keeps the tool sticky and creates a reason to come back.

---

## **12\. Lead Capture & Email Sequence**

**On submit — data captured:**

{  
  email,  
  auditId,  
  businessName,  
  trade: input.primaryTrade,  
  city: input.serviceCity,  
  scoreBucket: result.score\_bucket,   // "Critical" | "Needs Work" | "Solid" | "Strong"  
  overallScore: result.overall\_score,  
  lowestSection: result.sections.sort((a,b) \=\> a.score \- b.score)\[0\].id  
}

**Resend audience tags:** `trade:[value]`, `city:[value]`, `score:[bucket]` Enables segmented follow-up sequences by trade and urgency.

### **Email 1 — Immediate: Report Delivery**

* Subject: "Your Local SEO Audit — \[Business Name\]"  
* PDF attached, Calendly CTA  
* Tone: "Here's what I found. Happy to walk through it if useful."

### **Email 2 — Day 2: Specific Finding**

* Pull `lowestSection` from captured data  
* 3-sentence email about that exact issue  
* CTA: "Takes 20 minutes to fix. Want to do it together?"

### **Email 3 — Day 5: Industry Data**

* "\[Trade\] contractors in the Map Pack get X% more call volume." (BrightLocal stat)  
* CTA: Calendly

### **Email 4 — Day 10: Last Touch**

* "If now's not the right time, no worries."  
* "If you want to talk: \[calendar link\]"

---

## **13\. PDF Report Structure**

Page 1 — Cover  
  Logo \+ "Local SEO Audit Report"  
  Business name, trade, city, date

Page 2 — Overall Score \+ Summary  
  Score gauge (colored by label)  
  One-sentence summary  
  Top 3 actions

Page 3–4 — Section Breakdown  
  Each section: score, headline, finding, priority action  
  Traffic light icons

Page 5 — About Local Search Ally  
  Brief intro \+ Calendly CTA

Branded: \#020203 bg, \#7bafd4 carolina accents, Bricolage Grotesque headings, Space Grotesk body, JetBrains Mono for scores.

---

## **14\. Environment Variables**

ANTHROPIC\_API\_KEY=sk-ant-...  
RESEND\_API\_KEY=re\_...  
SUPABASE\_URL=https://...supabase.co  
SUPABASE\_SERVICE\_KEY=eyJ...  
UPSTASH\_REDIS\_URL=...  
UPSTASH\_REDIS\_TOKEN=...  
SLACK\_WEBHOOK\_URL=https://hooks.slack.com/...  
NEXT\_PUBLIC\_SITE\_URL=https://localsearchally.com  
CALENDLY\_URL=https://calendly.com/...

---

## **15\. Rate Limiting & Cost Control**

**Rate limit:** 5 audits per IP per 24 hours (Upstash Redis \+ Next.js middleware)

**Cost per audit:**

* Claude tokens: \~$0.05  
* Web search calls: \~7 × $0.01 \= \~$0.07  
* Total: \~$0.10–0.15

**Cache hit:** $0.00 (returns Supabase row, skips Claude)

**Monthly at 200 audits:** \~$20–30 (before cache savings)

---

## **16\. Error Handling**

| Error | Response |
| ----- | ----- |
| JSON parse fails | Retry once with `"Return ONLY JSON, no other text"` appended |
| Web search returns nothing | Section score \= 5, finding: "Couldn't verify — worth checking manually" |
| API timeout (\>120s) | Show user-facing message: "The audit took too long — try again, it usually completes." |
| No website (user checked) | Skip URL-based sections, score onpage/technical/backlinks as 1 |
| Invalid URL | Frontend validation catches before API call |
| Supabase insert fails | Return result to user anyway; log error silently |

**AbortController pattern (120s hard timeout):**

const controller \= new AbortController();  
const timer \= setTimeout(() \=\> controller.abort(), 120\_000);  
// Pass signal to fetch call  
// catch AbortError → show friendly message

---

## **17\. Build Phases**

### **Phase 1 — Core Tool (2–3 weeks)**

* \[ \] Next.js project setup \+ Vercel deploy  
* \[ \] Input form \+ validation \+ no-website toggle  
* \[ \] API route with Claude \+ web\_search \+ 120s timeout  
* \[ \] Results display (progressive section reveal)  
* \[ \] Basic email capture  
* \[ \] Simple email delivery via Resend  
* \[ \] Slack webhook notification

### **Phase 2 — Storage \+ Sharing (1 week)**

* \[ \] Supabase setup \+ audits table  
* \[ \] Shareable result URLs (/audit/\[id\])  
* \[ \] 24-hour result caching (skip Claude for repeat URLs)  
* \[ \] Copy link button on results page

### **Phase 3 — Polish \+ PDF (1–2 weeks)**

* \[ \] Branded PDF report generation  
* \[ \] Error states \+ retry logic  
* \[ \] Rate limiting (Upstash Redis)  
* \[ \] Analytics events (Plausible/GA4)  
* \[ \] Re-audit CTA \+ reminder

### **Phase 4 — Email Sequence (1 week)**

* \[ \] Resend audience \+ tagging (trade, city, score bucket)  
* \[ \] 4-email drip sequence  
* \[ \] Day-2 dynamic email (lowest section personalization)

### **Phase 5 — SEO Landing Page (3–5 days)**

* \[ \] Dedicated URL: /free-local-seo-audit  
* \[ \] Full landing page copy (H1 → FAQ)  
* \[ \] SoftwareApplication schema markup  
* \[ \] Meta title \+ description  
* \[ \] Internal links from all blog posts

---

## **18\. SEO Landing Page**

**URL:** `localsearchally.com/free-local-seo-audit`

**Meta title:** Free Local SEO Audit for Contractors | Local Search Ally

H1: See Exactly How Your Business Shows Up in Google — Free  
Subhead: Enter your business info. Get a real audit in 90 seconds.  
\[TOOL — above the fold\]  
H2: What the audit checks  
H2: Why contractors in NWA use it  
H2: What you get  
H2: Frequently Asked Questions

---

## **19\. KPIs at 90 Days**

| Metric | Target |
| ----- | ----- |
| Audit completions | 100+/month |
| Email capture rate | 40%+ of completions |
| Email → Calendly click | 15%+ |
| Calendly → booked call | 50%+ of clicks |
| Organic traffic to tool page | 200+/month |
| Backlinks earned | 5+ |
| Cache hit rate | 20%+ (repeat audits) |
| Avg response time (cold) | \<90s |

