import type { Decision } from "@/lib/engine";

export const DECISION_STYLE: Record<Decision, { label: string; chip: string; ring: string; bar: string }> = {
  APPROVE: { label: "Approve", chip: "bg-emerald-100 text-emerald-800", ring: "ring-emerald-500", bar: "bg-emerald-500" },
  REVIEW: { label: "Review", chip: "bg-amber-100 text-amber-800", ring: "ring-amber-500", bar: "bg-amber-500" },
  DECLINE: { label: "Decline", chip: "bg-rose-100 text-rose-800", ring: "ring-rose-500", bar: "bg-rose-500" },
};

export function DecisionChip({ decision, className = "" }: { decision: Decision; className?: string }) {
  const s = DECISION_STYLE[decision];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${s.chip} ${className}`}>
      {s.label}
    </span>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900";
