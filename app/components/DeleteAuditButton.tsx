"use client";

import { useTransition } from "react";
import { deleteAudit } from "@/app/actions/deleteAudit";

export default function DeleteAuditButton({ auditId }: { auditId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this audit? This can't be undone.")) return;
    startTransition(() => deleteAudit(auditId));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label="Delete audit"
      className="btn btn-ghost btn-sm"
      style={{
        color: "var(--muted)",
        flexShrink: 0,
        opacity: pending ? 0.4 : 1,
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => { if (!pending) e.currentTarget.style.color = "var(--status-red)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
