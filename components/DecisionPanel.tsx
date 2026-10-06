"use client";

import { useEffect, useState } from "react";
import { MAX_SCORE, type Assessment, type Thresholds } from "@/lib/engine";
import { DECISION_STYLE, DecisionChip } from "./ui";
import { Logo } from "./Nav";

type Props = {
  assessment: Assessment | null;
  /** How many rule rows to show (animates the evaluation). */
  revealed: number;
  thresholds: Thresholds;
  busy: boolean;
  request: unknown;
  error: string | null;
};

export default function DecisionPanel({ assessment, revealed, thresholds, busy, request, error }: Props) {
  const [tab, setTab] = useState<"rules" | "request" | "response">("rules");
  const done = assessment && revealed >= assessment.results.length;

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-950/20 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-indigo-950 px-4 py-3 text-white">
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Brighterion merchant console</div>
          <div className="truncate text-[11px] text-indigo-200">
            {assessment
              ? `${assessment.assessmentId} · ${assessment.processingMs}ms · ${assessment.source}`
              : "Real-time CNP risk assessment"}
          </div>
        </div>
      </div>

      {!assessment && !busy && !error && (
        <div className="px-6 py-16 text-center text-sm text-stone-500">
          Pick a scenario and press <b>Pay</b>. Brighterion scores the transaction before it goes to authorisation.
        </div>
      )}
      {busy && !assessment && (
        <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-stone-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-900 border-t-transparent" />
          Assessing transaction…
        </div>
      )}
      {error && <div className="m-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {assessment && (
        <div className="p-4">
          <ScoreGauge score={done ? assessment.score : null} thresholds={thresholds} />

          <div
            className={`mt-4 flex items-center justify-between rounded-lg border p-3 transition ${
              done ? "opacity-100" : "opacity-30"
            }`}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Decision</div>
              <div className="mt-1 text-sm text-stone-700">{assessment.action}</div>
            </div>
            <DecisionChip decision={assessment.decision} className="text-sm" />
          </div>

          {done && assessment.reasons.length > 0 && (
            <div className="animate-rise mt-3 flex flex-wrap gap-1.5">
              {assessment.reasons.map((r) => (
                <span key={r} className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                  {r}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex gap-1 border-b border-stone-200 text-xs">
            {(["rules", "request", "response"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-3 py-2 ${
                  tab === t ? "border-indigo-900 font-semibold text-indigo-950" : "border-transparent text-stone-500"
                }`}
              >
                {t === "rules" ? "Rules evaluated" : t === "request" ? "API request" : "API response"}
              </button>
            ))}
          </div>

          {tab === "rules" ? (
            <ul className="mt-2 divide-y divide-stone-100">
              {assessment.results.slice(0, revealed).map((r) => (
                <li key={r.id} className="animate-rise flex items-center gap-3 py-2 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      !r.enabled
                        ? "bg-stone-100 text-stone-300"
                        : r.hit
                          ? r.kind === "trust"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                          : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    {!r.enabled ? "–" : r.hit ? "!" : "✓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={r.enabled ? "text-stone-800" : "text-stone-400 line-through"}>{r.name}</div>
                    <div className="truncate text-xs text-stone-400">{r.detail}</div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs tabular-nums ${
                      r.kind === "block" && r.hit
                        ? "font-semibold text-rose-700"
                        : r.points > 0
                          ? "text-rose-700"
                          : r.points < 0
                            ? "text-emerald-700"
                            : "text-stone-300"
                    }`}
                  >
                    {r.kind === "block" && r.hit ? "BLOCK" : r.points > 0 ? `+${r.points}` : r.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-stone-950 p-3 font-mono text-[11px] leading-relaxed text-stone-100">
              {JSON.stringify(tab === "request" ? request : assessment, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ score, thresholds }: { score: number | null; thresholds: Thresholds }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (score === null) {
      setShown(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 600);
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const pct = (n: number) => `${(n / MAX_SCORE) * 100}%`;
  const decision = shown >= thresholds.decline ? "DECLINE" : shown >= thresholds.review ? "REVIEW" : "APPROVE";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Risk score</span>
        <span className="font-mono text-3xl font-semibold tabular-nums">
          {score === null ? "—" : shown}
          <span className="text-sm text-stone-400"> / {MAX_SCORE}</span>
        </span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-stone-100">
        <div className="absolute inset-y-0 left-0 bg-emerald-100" style={{ width: pct(thresholds.review) }} />
        <div
          className="absolute inset-y-0 bg-amber-100"
          style={{ left: pct(thresholds.review), width: pct(thresholds.decline - thresholds.review) }}
        />
        <div className="absolute inset-y-0 right-0 bg-rose-100" style={{ left: pct(thresholds.decline) }} />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${DECISION_STYLE[decision].bar}`}
          style={{ width: pct(shown) }}
        />
      </div>
      <div className="relative mt-1 h-4 font-mono text-[10px] text-stone-400">
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(thresholds.review) }}>
          {thresholds.review}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(thresholds.decline) }}>
          {thresholds.decline}
        </span>
        <span className="absolute right-0">{MAX_SCORE}</span>
      </div>
    </div>
  );
}
