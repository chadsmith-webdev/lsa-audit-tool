// Curated list of high-value citation directories for local home-service contractors.
// Tier 1 = must-have core 10. Tier 2 = strong additions. Tier 3 = trade-specific or niche.
// `charLimit` is the typical description length the directory accepts (rounded down for safety).

export type CitationTier = 1 | 2 | 3;

export interface CitationDirectory {
  slug: string;
  name: string;
  url: string; // submission / signup URL
  tier: CitationTier;
  charLimit: number;
  notes: string;
  // Trades this is especially relevant for. Empty = relevant to all home services.
  trades?: string[];
}

const TRADES = {
  HVAC: "hvac",
  PLUMBING: "plumbing",
  ELECTRICAL: "electrical",
  ROOFING: "roofing",
  GENERAL_CONTRACTOR: "general contractor",
  LANDSCAPING: "landscaping",
} as const;

export const DIRECTORIES: CitationDirectory[] = [
  // Tier 1 — core 10 every business needs
  {
    slug: "gbp",
    name: "Google Business Profile",
    url: "https://www.google.com/business/",
    tier: 1,
    charLimit: 750,
    notes:
      "The single most important citation. Verify by postcard, phone, or email. Set primary category to the most specific trade match.",
  },
  {
    slug: "yelp",
    name: "Yelp",
    url: "https://biz.yelp.com/signup",
    tier: 1,
    charLimit: 1000,
    notes:
      "Free claim. Don't pay for ads at first — just claim, fill out completely, and add photos.",
  },
  {
    slug: "facebook",
    name: "Facebook Business Page",
    url: "https://www.facebook.com/pages/creation/",
    tier: 1,
    charLimit: 255,
    notes:
      "Use the same NAP as your GBP exactly. Set the 'Services' tab so it matches your trades.",
  },
  {
    slug: "apple-maps",
    name: "Apple Business Connect",
    url: "https://businessconnect.apple.com/",
    tier: 1,
    charLimit: 300,
    notes:
      "Powers Siri, Apple Maps, Spotlight. Often missed — about 30% of contractors aren't listed.",
  },
  {
    slug: "bing-places",
    name: "Bing Places",
    url: "https://www.bingplaces.com/",
    tier: 1,
    charLimit: 700,
    notes:
      "Import from Google takes 60 seconds. Bing powers Yahoo, DuckDuckGo, ChatGPT search.",
  },
  {
    slug: "bbb",
    name: "Better Business Bureau",
    url: "https://www.bbb.org/get-listed",
    tier: 1,
    charLimit: 500,
    notes:
      "Accreditation costs money — but a free listing is allowed and still helps NAP consistency. Many homeowners check BBB.",
  },
  {
    slug: "yellowpages",
    name: "Yellowpages.com",
    url: "https://accounts.yellowpages.com/register",
    tier: 1,
    charLimit: 500,
    notes:
      "Free basic listing. Old-school but still trusted by data aggregators.",
  },
  {
    slug: "foursquare",
    name: "Foursquare for Business",
    url: "https://business.foursquare.com/",
    tier: 1,
    charLimit: 250,
    notes:
      "Feeds Apple Maps, Tinder, Uber, Snapchat, and most location-aware apps.",
  },
  {
    slug: "mapquest",
    name: "MapQuest",
    url: "https://business.mapquest.com/",
    tier: 1,
    charLimit: 500,
    notes:
      "Free. Still used by ~10% of mobile users and some in-vehicle nav systems.",
  },
  {
    slug: "nextdoor",
    name: "Nextdoor Business",
    url: "https://business.nextdoor.com/",
    tier: 1,
    charLimit: 1000,
    notes:
      "High intent — neighbors actively recommend contractors. Free claim, paid ads optional.",
  },

  // Tier 2 — strong supplemental
  {
    slug: "manta",
    name: "Manta",
    url: "https://www.manta.com/claim",
    tier: 2,
    charLimit: 500,
    notes:
      "Free B2B + small-business directory. Indexed by Google for hyper-local queries.",
  },
  {
    slug: "superpages",
    name: "Superpages",
    url: "https://accounts.superpages.com/register",
    tier: 2,
    charLimit: 500,
    notes: "Yellow Pages property. Free basic listing covers NAP consistency.",
  },
  {
    slug: "merchantcircle",
    name: "MerchantCircle",
    url: "https://www.merchantcircle.com/signup",
    tier: 2,
    charLimit: 500,
    notes: "Free citation source. Allows photos and blog posts.",
  },
  {
    slug: "hotfrog",
    name: "Hotfrog",
    url: "https://www.hotfrog.com/AddCompany",
    tier: 2,
    charLimit: 500,
    notes:
      "Global free business directory. Quick to add — pure NAP consistency play.",
  },
  {
    slug: "ezlocal",
    name: "EZlocal",
    url: "https://www.ezlocal.com/",
    tier: 2,
    charLimit: 250,
    notes: "Free listing. Feeds several smaller aggregators.",
  },

  // Tier 3 — trade-specific
  {
    slug: "homeadvisor",
    name: "HomeAdvisor / Angi",
    url: "https://www.homeadvisor.com/r/sign-up-as-a-pro/",
    tier: 3,
    charLimit: 500,
    notes:
      "Lead-buying platform. The listing itself is a citation. Free profile available — you only pay for actual leads.",
    trades: [
      TRADES.HVAC,
      TRADES.PLUMBING,
      TRADES.ELECTRICAL,
      TRADES.ROOFING,
      TRADES.GENERAL_CONTRACTOR,
      TRADES.LANDSCAPING,
    ],
  },
  {
    slug: "thumbtack",
    name: "Thumbtack",
    url: "https://www.thumbtack.com/pro/",
    tier: 3,
    charLimit: 1000,
    notes:
      "Lead-buying platform but the public profile is a strong citation. Pay-per-lead model.",
    trades: [
      TRADES.HVAC,
      TRADES.PLUMBING,
      TRADES.ELECTRICAL,
      TRADES.ROOFING,
      TRADES.GENERAL_CONTRACTOR,
      TRADES.LANDSCAPING,
    ],
  },
  {
    slug: "porch",
    name: "Porch",
    url: "https://pros.porch.com/",
    tier: 3,
    charLimit: 500,
    notes: "Home-services platform. Free profile.",
    trades: [
      TRADES.HVAC,
      TRADES.PLUMBING,
      TRADES.ELECTRICAL,
      TRADES.ROOFING,
      TRADES.GENERAL_CONTRACTOR,
    ],
  },
  {
    slug: "houzz",
    name: "Houzz Pro",
    url: "https://www.houzz.com/pro",
    tier: 3,
    charLimit: 800,
    notes:
      "Especially valuable for remodelers, GCs, landscapers. Free profile + portfolio.",
    trades: [TRADES.GENERAL_CONTRACTOR, TRADES.LANDSCAPING, TRADES.ROOFING],
  },
  {
    slug: "networx",
    name: "Networx",
    url: "https://www.networx.com/contractor-signup",
    tier: 3,
    charLimit: 500,
    notes: "Pay-per-lead. Free profile creation.",
    trades: [TRADES.HVAC, TRADES.PLUMBING, TRADES.ELECTRICAL, TRADES.ROOFING],
  },
];

export function directoriesForTrade(trade: string): CitationDirectory[] {
  const key = trade.toLowerCase();
  return DIRECTORIES.filter((d) => {
    if (!d.trades || !d.trades.length) return true; // universal
    return d.trades.some((t) => key.includes(t));
  });
}
