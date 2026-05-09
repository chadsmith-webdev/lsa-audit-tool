// ─── Shared audit types ───────────────────────────────────────────────────────
// Single source of truth for types used across the API route, UI components,
// and shared audit view. Import from here — never redefine locally.

// ─── Section label map ────────────────────────────────────────────────────────
// Single source of truth. Import this anywhere section IDs need display names.
// If you add a new section key to the audit, add it here — nowhere else.
export const SECTION_LABELS: Record<string, string> = {
  gbp: "Google Business Profile",
  reviews: "Reviews",
  onpage: "On-Page SEO",
  technical: "Technical SEO",
  citations: "Citations",
  backlinks: "Backlinks",
  competitors: "Competitor Comparison",
  ai_citability: "AI Citability",
};

export type AuditInput = {
  businessName: string;
  websiteUrl: string;
  primaryTrade: string;
  serviceCity: string;
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
  // GBP snapshot columns — added in migration v2
  gbp_found?: boolean | null;
  gbp_rating?: number | null;
  gbp_review_count?: number | null;
  gbp_photo_count?: number | null;
  gbp_has_hours?: boolean | null;
};
