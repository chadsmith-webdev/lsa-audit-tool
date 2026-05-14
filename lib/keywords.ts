/**
 * Rule-based keyword suggestions per trade.
 * Each entry is a template that accepts a city name.
 * Used to pre-populate the geo-grid keyword input.
 */

const TRADE_KEYWORDS: Record<string, string[]> = {
  seo: [
    "local SEO company {city}",
    "SEO agency {city}",
    "digital marketing agency {city}",
    "local search marketing {city}",
    "SEO consultant {city}",
    "Google Business Profile management {city}",
    "local SEO services {city}",
  ],
  marketing: [
    "marketing agency {city}",
    "digital marketing {city}",
    "online marketing company {city}",
    "marketing consultant {city}",
    "web design company {city}",
    "social media marketing {city}",
    "advertising agency {city}",
  ],
  hvac: [
    "HVAC repair {city}",
    "AC repair {city}",
    "AC service {city}",
    "furnace repair {city}",
    "HVAC company {city}",
    "air conditioning installation {city}",
    "heating and cooling {city}",
  ],
  plumbing: [
    "plumber {city}",
    "plumbing repair {city}",
    "emergency plumber {city}",
    "water heater replacement {city}",
    "drain cleaning {city}",
    "leak repair {city}",
    "plumbing company {city}",
  ],
  roofing: [
    "roofer {city}",
    "roof repair {city}",
    "roof replacement {city}",
    "roofing contractor {city}",
    "storm damage roof repair {city}",
    "roof inspection {city}",
    "roofing company {city}",
  ],
  electrical: [
    "electrician {city}",
    "electrical repair {city}",
    "panel upgrade {city}",
    "electrical contractor {city}",
    "generator installation {city}",
    "EV charger installation {city}",
    "emergency electrician {city}",
  ],
  landscaping: [
    "landscaper {city}",
    "lawn care {city}",
    "landscaping company {city}",
    "lawn mowing service {city}",
    "landscape design {city}",
    "tree trimming {city}",
    "irrigation system installation {city}",
  ],
  remodeling: [
    "remodeling contractor {city}",
    "home remodeling {city}",
    "kitchen remodel {city}",
    "bathroom remodel {city}",
    "home renovation {city}",
    "general contractor {city}",
    "addition contractor {city}",
  ],
};

// Normalize trade strings coming from the audit form
// e.g. "HVAC / Air Conditioning" -> "hvac"
const TRADE_ALIASES: Record<string, string> = {
  "local seo": "seo",
  "seo agency": "seo",
  "seo company": "seo",
  "digital marketing": "marketing",
  "marketing agency": "marketing",
  "web design": "marketing",
  hvac: "hvac",
  "air conditioning": "hvac",
  plumbing: "plumbing",
  plumber: "plumbing",
  roofing: "roofing",
  roofer: "roofing",
  electrical: "electrical",
  electrician: "electrical",
  landscaping: "landscaping",
  lawn: "landscaping",
  remodeling: "remodeling",
  renovation: "remodeling",
  "general contractor": "remodeling",
};

function normalizeTrade(trade: string): string | null {
  const lower = trade.toLowerCase();
  for (const [alias, key] of Object.entries(TRADE_ALIASES)) {
    if (lower.includes(alias)) return key;
  }
  return null;
}

/**
 * Returns keyword suggestions for a given trade and city.
 * Falls back to an empty array if trade is unrecognized.
 */
export function getSuggestedKeywords(trade: string, city: string): string[] {
  const key = normalizeTrade(trade);
  if (!key || !TRADE_KEYWORDS[key]) return [];
  const cityLabel = city.trim() || "your city";
  return TRADE_KEYWORDS[key].map((t) => t.replace("{city}", cityLabel));
}
