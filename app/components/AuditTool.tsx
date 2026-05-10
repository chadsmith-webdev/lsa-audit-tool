"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuditInput, AuditSection, AuditResult } from "@/lib/types";
import { AuditForm } from "./audit/AuditForm";
import { AuditLoading } from "./audit/AuditLoading";
import { AuditResults } from "./audit/AuditResults";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Remodeling",
  "General Contracting",
  "Other",
];

const SECTION_ORDER = [
  "gbp",
  "reviews",
  "onpage",
  "technical",
  "citations",
  "backlinks",
  "competitors",
];

// ─── Orchestrator ─────────────────────────────────────────────────────────────

type Phase = "form" | "loading" | "results";

export default function AuditTool() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<AuditInput>(() => {
    const business = searchParams?.get("business") ?? "";
    const city = searchParams?.get("city") ?? "";
    const trade = searchParams?.get("trade") ?? "";
    const validTrade = TRADES.includes(trade) ? trade : "";
    return {
      businessName: business.slice(0, 100),
      websiteUrl: "",
      primaryTrade: validTrade,
      serviceCity: city.slice(0, 100),
    };
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof AuditInput, string>>
  >({});
  const [auditError, setAuditError] = useState<string | null>(null);
  const [doneSections, setDoneSections] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    SECTION_ORDER[0],
  );
  const [result, setResult] = useState<AuditResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting…");

  function validate(): boolean {
    const e: Partial<Record<keyof AuditInput, string>> = {};
    if (!form.businessName || form.businessName.trim().length < 2)
      e.businessName = "Business name required (min 2 characters)";
    if (!form.primaryTrade) e.primaryTrade = "Select a trade";
    if (!form.serviceCity || form.serviceCity.trim().length < 2)
      e.serviceCity = "Service city required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    let input = { ...form };
    if (input.websiteUrl && !/^https?:\/\//.test(input.websiteUrl)) {
      input.websiteUrl = "https://" + input.websiteUrl;
    }

    setPhase("loading");
    setDoneSections([]);
    setActiveSectionId(SECTION_ORDER[0]);
    setAuditError(null);
    setStatusMessage("Connecting…");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ??
            "You've already run a free audit this month. Come back in 30 days.",
        );
      }

      if (!response.ok || !response.body) {
        throw new Error(
          "Failed to connect to audit service. Please try again.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          let eventType = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6);
          }
          if (!dataStr) continue;

          let data: unknown;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (eventType === "section") {
            setStatusMessage("Scoring your results…");
            const id = (data as AuditSection).id;
            setDoneSections((prev) => [...prev, id]);
            const idx = SECTION_ORDER.indexOf(id);
            if (idx >= 0 && idx < SECTION_ORDER.length - 1) {
              setActiveSectionId(SECTION_ORDER[idx + 1]);
            }
          } else if (eventType === "complete") {
            const auditResult = data as AuditResult;
            setResult(auditResult);
            setPhase("results");

            // GA4 Custom Event: audit_complete
            if (
              typeof window !== "undefined" &&
              typeof (window as unknown as { gtag?: unknown }).gtag ===
                "function"
            ) {
              (
                window as unknown as { gtag: (...args: unknown[]) => void }
              ).gtag("event", "audit_complete", {
                business_name: auditResult.business_name,
                overall_score: auditResult.overall_score,
                score_bucket: auditResult.score_bucket,
              });
            }
          } else if (eventType === "status") {
            setStatusMessage((data as { message: string }).message);
          } else if (eventType === "error") {
            setAuditError(
              (data as { message?: string }).message ?? "Something went wrong",
            );
            setPhase("form");
          }
        }
      }
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const message = isAbort
        ? "The audit took too long — try again, it usually completes."
        : err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setAuditError(message);
      setPhase("form");
      return;
    }
    clearTimeout(timer);
  }

  if (phase === "form") {
    return (
      <AuditForm
        form={form}
        errors={errors}
        auditError={auditError}
        onChange={(k, v) => {
          setForm((f) => ({ ...f, [k]: v }));
          if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
        }}
        onSubmit={handleSubmit}
      />
    );
  }

  if (phase === "loading") {
    return (
      <AuditLoading
        businessName={form.businessName}
        doneSections={doneSections}
        activeSectionId={activeSectionId}
        statusMessage={statusMessage}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <AuditResults
        result={result}
        input={form}
        onRunAgain={() => {
          setPhase("form");
          setResult(null);
          setDoneSections([]);
        }}
      />
    );
  }

  return null;
}
