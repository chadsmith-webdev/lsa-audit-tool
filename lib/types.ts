// ─── Shared audit types ───────────────────────────────────────────────────────
// Single source of truth for types used across the API route, UI components,
// and shared audit view. Import from here — never redefine locally.

export type AuditInput = {
  businessName: string;
  websiteUrl: string;
  primaryTrade: string;
  serviceCity: string;
  noWebsite: boolean;
};

export interface AuditSection {
  id: string;
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
}

export interface AICitabilitySection {
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
  sub_signals: {
    grounding: "strong" | "partial" | "weak";
    review_density: "strong" | "partial" | "weak";
    photo_freshness: "strong" | "weak" | "unknown";
  };
}

export interface AuditResult {
  business_name: string;
  overall_score: number;
  overall_label: "Strong" | "Solid" | "Needs Work" | "Critical";
  summary: string;
  has_website: boolean;
  score_bucket: "Critical" | "Needs Work" | "Solid" | "Strong";
  sections: AuditSection[];
  top_3_actions: string[];
  competitor_names: string[];
  ai_citability_score?: number;
  ai_citability_section?: AICitabilitySection;
  // Set by the API after Supabase insert — not part of the Claude response
  auditId?: string;
  cached?: boolean;
}

export type AuditRow = {
  id: string;
  business_name: string;
  overall_score: number;
  score_bucket: string;
  trade: string;
  city: string;
  result: AuditResult;
  created_at: string;
};
