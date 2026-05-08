"use client";

import { motion } from "framer-motion";
import styles from "@/styles/audit.module.css";
import type { AuditInput } from "@/lib/types";
import { fadeUp } from "./motionVariants";

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

export function AuditForm({
  form,
  errors,
  auditError,
  onChange,
  onSubmit,
}: {
  form: AuditInput;
  errors: Partial<Record<keyof AuditInput, string>>;
  auditError: string | null;
  onChange: (k: keyof AuditInput, v: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.div
      className={styles.formWrap}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.formCard}>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          {/* Field order: Business Name → Trade → City → Website
              Progressive commitment: start easy, increase effort gradually */}
          <div className={styles.fieldGroup}>
            <label className="form-label" htmlFor="businessName">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              className="form-input"
              placeholder="Rogers HVAC Pro"
              value={form.businessName}
              onChange={(e) => onChange("businessName", e.target.value)}
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <span className="form-error">{errors.businessName}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className="form-label" htmlFor="primaryTrade">
              Primary Trade
            </label>
            <select
              id='primaryTrade'
              className={`form-select ${styles.select}`}
              value={form.primaryTrade}
              onChange={(e) => onChange("primaryTrade", e.target.value)}
              aria-invalid={!!errors.primaryTrade}
            >
              <option value="">Select trade…</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.primaryTrade && (
              <span className="form-error">{errors.primaryTrade}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className="form-label" htmlFor="serviceCity">
              Service City
            </label>
            <input
              id="serviceCity"
              type="text"
              className="form-input"
              placeholder="Rogers, AR"
              value={form.serviceCity}
              onChange={(e) => onChange("serviceCity", e.target.value)}
              aria-invalid={!!errors.serviceCity}
            />
            {errors.serviceCity && (
              <span className="form-error">{errors.serviceCity}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className="form-label" htmlFor="websiteUrl">
              Website{" "}
              <span className={styles.labelOptional}>(optional)</span>
            </label>
            <input
              id="websiteUrl"
              type="url"
              className="form-input"
              placeholder="rogershvacpro.com"
              value={form.websiteUrl}
              onChange={(e) => onChange("websiteUrl", e.target.value)}
              aria-invalid={!!errors.websiteUrl}
            />
            {errors.websiteUrl && (
              <span className="form-error">{errors.websiteUrl}</span>
            )}
          </div>

          {auditError && (
            <p className={styles.auditError} role="alert">
              {auditError}
            </p>
          )}

          <button type="submit" className={styles.submitBtn}>
            Run My Free Audit →
          </button>
          <p className={styles.formTrust}>
            Checks your actual Google listing, reviews, and citations — not
            estimates. Built by Chad Smith, NWA local SEO specialist.
          </p>
        </form>
      </div>
    </motion.div>
  );
}
