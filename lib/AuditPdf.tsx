import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditSection {
  id: string;
  name: string;
  score: number;
  status: "green" | "yellow" | "red";
  headline: string;
  finding: string;
  priority_action: string;
}

interface AuditResult {
  business_name: string;
  overall_score: number;
  overall_label: string;
  summary: string;
  score_bucket: string;
  sections: AuditSection[];
  top_3_actions: string[];
  competitor_names: string[];
}

interface PdfProps {
  result: AuditResult;
  trade: string;
  city: string;
  calendlyUrl?: string;
}

// ─── Brand tokens (can't use CSS vars in react-pdf) ───────────────────────────

const INK = "#020203";
const CAROLINA = "#7bafd4";
const WHITE = "#ffffff";
const GRAY = "#9ca3af";
const STATUS: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Pages
  page: {
    backgroundColor: INK,
    color: WHITE,
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  // Cover
  coverPage: {
    backgroundColor: INK,
    color: WHITE,
    padding: 56,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "Helvetica",
  },
  coverTop: { flex: 1, justifyContent: "center" },
  brand: {
    fontSize: 13,
    color: CAROLINA,
    letterSpacing: 1.5,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 16,
    lineHeight: 1.2,
  },
  coverBusiness: { fontSize: 20, color: CAROLINA, marginBottom: 6 },
  coverMeta: { fontSize: 13, color: GRAY },
  coverDivider: {
    borderBottomColor: CAROLINA,
    borderBottomWidth: 1,
    marginVertical: 36,
  },
  // Section headings
  sectionLabel: {
    fontSize: 10,
    color: CAROLINA,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  h2: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 6,
  },
  bodyText: { fontSize: 11, color: GRAY, lineHeight: 1.6 },
  // Score ring (represented as text in PDF)
  scoreCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    border: "6px solid",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  scoreNumber: { fontSize: 34, fontFamily: "Helvetica-Bold" },
  scoreDenom: { fontSize: 12, color: GRAY },
  scoreLabel: { fontSize: 12, marginTop: 4 },
  // Score + summary row
  scoreRow: {
    flexDirection: "row",
    gap: 32,
    alignItems: "flex-start",
    marginBottom: 28,
  },
  scoreSummary: { flex: 1 },
  // Top actions list
  actionItem: { flexDirection: "row", marginBottom: 10, gap: 10 },
  actionNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CAROLINA,
    color: INK,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 11,
    color: WHITE,
    lineHeight: 1.5,
    paddingTop: 3,
  },
  // Section card
  card: {
    backgroundColor: "#0e0f11",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  cardScore: { fontSize: 22, fontFamily: "Helvetica-Bold", width: 36 },
  cardHeadText: { flex: 1 },
  cardName: {
    fontSize: 10,
    color: CAROLINA,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardHeadline: { fontSize: 13, fontFamily: "Helvetica-Bold", color: WHITE },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  finding: { fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 8 },
  nextStepLabel: {
    fontSize: 9,
    color: CAROLINA,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  nextStep: { fontSize: 10, color: WHITE, lineHeight: 1.5 },
  // About page
  aboutTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 12,
  },
  aboutBody: { fontSize: 12, color: GRAY, lineHeight: 1.8, marginBottom: 24 },
  ctaBlock: {
    backgroundColor: "#0e0f11",
    borderRadius: 8,
    padding: 24,
    marginTop: 8,
  },
  ctaLine: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: CAROLINA,
    marginBottom: 6,
  },
  ctaUrl: { fontSize: 11, color: GRAY },
  // Dividers
  divider: {
    borderBottomColor: "#1e2024",
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  // Page number
  pageNum: {
    position: "absolute",
    bottom: 24,
    right: 48,
    fontSize: 9,
    color: GRAY,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  return STATUS[status] ?? GRAY;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function CoverPage({ result, trade, city }: Omit<PdfProps, "calendlyUrl">) {
  return (
    <Page style={s.coverPage}>
      <View style={s.coverTop}>
        <Text style={s.brand}>LOCAL SEARCH ALLY</Text>
        <Text style={s.coverTitle}>Local SEO{"\n"}Audit Report</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverBusiness}>{result.business_name}</Text>
        <Text style={s.coverMeta}>
          {trade} · {city} · {formatDate()}
        </Text>
      </View>
      <Text style={{ ...s.bodyText, fontSize: 9 }}>
        Prepared by Local Search Ally · localsearchally.com
      </Text>
    </Page>
  );
}

function OverallScorePage({ result }: { result: AuditResult }) {
  const color = statusColor(
    result.overall_score >= 8
      ? "green"
      : result.overall_score >= 5
        ? "yellow"
        : "red",
  );
  return (
    <Page style={s.page}>
      <Text style={s.sectionLabel}>Overall Score</Text>
      <Text style={s.h2}>{result.overall_label}</Text>
      <View style={s.divider} />

      <View style={s.scoreRow}>
        <View style={{ ...s.scoreCircle, borderColor: color }}>
          <Text style={{ ...s.scoreNumber, color }}>
            {result.overall_score}
          </Text>
          <Text style={s.scoreDenom}>/10</Text>
        </View>
        <View style={s.scoreSummary}>
          <Text
            style={{
              ...s.bodyText,
              color: WHITE,
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            {result.summary}
          </Text>
          {result.competitor_names.length > 0 && (
            <Text style={s.bodyText}>
              Competing against: {result.competitor_names.join(", ")}
            </Text>
          )}
        </View>
      </View>

      <Text style={s.sectionLabel}>Top 3 Priorities</Text>
      {result.top_3_actions.map((action, i) => (
        <View key={i} style={s.actionItem}>
          <View style={s.actionNum}>
            <Text>{i + 1}</Text>
          </View>
          <Text style={s.actionText}>{action}</Text>
        </View>
      ))}
      <Text style={s.pageNum}>2</Text>
    </Page>
  );
}

function SectionBreakdownPage({
  sections,
  pageNum,
}: {
  sections: AuditSection[];
  pageNum: number;
}) {
  return (
    <Page style={s.page}>
      <Text style={s.sectionLabel}>Section Breakdown</Text>
      <View style={s.divider} />
      {sections.map((sec) => (
        <View key={sec.id} style={s.card}>
          <View style={s.cardHead}>
            <Text style={{ ...s.cardScore, color: statusColor(sec.status) }}>
              {sec.score}
            </Text>
            <View style={s.cardHeadText}>
              <Text style={s.cardName}>{sec.name.toUpperCase()}</Text>
              <Text style={s.cardHeadline}>{sec.headline}</Text>
            </View>
            <View
              style={{
                ...s.statusDot,
                backgroundColor: statusColor(sec.status),
              }}
            />
          </View>
          <Text style={s.finding}>{sec.finding}</Text>
          {sec.priority_action && (
            <>
              <Text style={s.nextStepLabel}>NEXT STEP</Text>
              <Text style={s.nextStep}>{sec.priority_action}</Text>
            </>
          )}
        </View>
      ))}
      <Text style={s.pageNum}>{pageNum}</Text>
    </Page>
  );
}

function AboutPage({ calendlyUrl }: { calendlyUrl?: string }) {
  const calUrl = calendlyUrl ?? "https://calendly.com/localsearchally";
  return (
    <Page style={s.page}>
      <Text style={s.sectionLabel}>About</Text>
      <Text style={s.aboutTitle}>Local Search Ally</Text>
      <Text style={s.aboutBody}>
        Local Search Ally helps contractors in NWA get found on Google — and get
        more calls. We specialize in local SEO for trades: HVAC, plumbing,
        electrical, roofing, and more.{"\n\n"}
        This audit was generated using real-time web research. Every finding
        reflects your actual online presence today.
      </Text>
      <View style={s.ctaBlock}>
        <Text style={s.ctaLine}>Want us to fix this with you?</Text>
        <Text style={s.aboutBody}>
          Book a free 30-minute strategy call. We&apos;ll walk through your
          audit line by line and tell you exactly what to prioritize.
        </Text>
        <Text style={s.ctaUrl}>{calUrl}</Text>
      </View>
      <Text style={s.pageNum}>5</Text>
    </Page>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function AuditPdf({ result, trade, city, calendlyUrl }: PdfProps) {
  const firstHalf = result.sections.slice(0, 4);
  const secondHalf = result.sections.slice(4);

  return (
    <Document
      title={`Local SEO Audit — ${result.business_name}`}
      author='Local Search Ally'
      subject='Local SEO Audit Report'
    >
      <CoverPage result={result} trade={trade} city={city} />
      <OverallScorePage result={result} />
      <SectionBreakdownPage sections={firstHalf} pageNum={3} />
      {secondHalf.length > 0 && (
        <SectionBreakdownPage sections={secondHalf} pageNum={4} />
      )}
      <AboutPage calendlyUrl={calendlyUrl} />
    </Document>
  );
}
