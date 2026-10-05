"use client";

import Link from "next/link";
import { DEFAULT_CONFIG, MAX_SCORE, SCENARIOS, evaluate, type Rule } from "@/lib/engine";
import { useEngineConfig } from "@/lib/store";
import { DecisionChip, inputCls } from "@/components/ui";

const KIND_LABEL = { score: "Score", block: "Hard block", trust: "Trust" } as const;

export default function RulesPage() {
  const [config, setConfig, ready] = useEngineConfig();
  const { rules, thresholds } = config;

  const updateRule = (id: string, patch: Partial<Rule>) =>
    setConfig({ ...config, rules: rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const setThreshold = (k: "review" | "decline", v: number) => {
    const t = { ...thresholds, [k]: v };
    if (t.review > t.decline) {
      if (k === "review") t.decline = t.review;
      else t.review = t.decline;
    }
    setConfig({ ...config, thresholds: t });
  };

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rule configuration</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Turn rules on or off, change their weights and limits, and move the decision thresholds. The checkout demo
            uses these settings, and the preview on the right updates as you edit.
          </p>
        </div>
        <button
          onClick={() => setConfig(DEFAULT_CONFIG)}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          Reset to defaults
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Thresholds */}
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Decision thresholds</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(["review", "decline"] as const).map((k) => (
                <label key={k} className="block">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-stone-600">
                      {k === "review" ? "Review (3DS step-up) from" : "Decline from"}
                    </span>
                    <span className="font-mono">{thresholds[k]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={MAX_SCORE}
                    step={10}
                    value={thresholds[k]}
                    onChange={(e) => setThreshold(k, Number(e.target.value))}
                    className={`mt-2 w-full ${k === "review" ? "accent-amber-500" : "accent-rose-600"}`}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-stone-500">
              <span>
                <DecisionChip decision="APPROVE" className="!text-[10px]" /> 0–{thresholds.review - 1}
              </span>
              <span>
                <DecisionChip decision="REVIEW" className="!text-[10px]" /> {thresholds.review}–{thresholds.decline - 1}
              </span>
              <span>
                <DecisionChip decision="DECLINE" className="!text-[10px]" /> {thresholds.decline}+
              </span>
            </div>
          </section>

          {/* Rules */}
          <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2 font-medium">On</th>
                  <th className="px-2 py-2 font-medium">Rule</th>
                  <th className="hidden px-2 py-2 font-medium sm:table-cell">Type</th>
                  <th className="px-2 py-2 font-medium">Limit</th>
                  <th className="px-4 py-2 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rules.map((r) => (
                  <tr key={r.id} className={r.enabled ? "" : "opacity-50"}>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
                        className="h-4 w-4 accent-indigo-900"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-medium text-stone-900">{r.name}</div>
                      <div className="text-xs text-stone-500">{r.description}</div>
                    </td>
                    <td className="hidden px-2 py-3 align-top sm:table-cell">
                      <span
                        className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          r.kind === "block"
                            ? "bg-rose-100 text-rose-700"
                            : r.kind === "trust"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {KIND_LABEL[r.kind]}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-top">
                      {r.param !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap text-xs text-stone-500">{r.paramLabel}</span>
                          <input
                            type="number"
                            className={`${inputCls} w-20 !py-1`}
                            value={r.param}
                            onChange={(e) => updateRule(r.id, { param: Number(e.target.value) })}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {r.kind === "block" ? (
                        <span className="text-xs font-semibold text-rose-700">Auto-decline</span>
                      ) : (
                        <input
                          type="number"
                          step={10}
                          className={`${inputCls} ml-auto w-20 !py-1 text-right`}
                          value={r.points}
                          onChange={(e) => updateRule(r.id, { points: Number(e.target.value) })}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
          <section className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Live preview against demo shoppers</h2>
            <p className="mt-1 text-xs text-stone-500">How each scenario scores under the current rules.</p>
            <ul className="mt-4 space-y-3">
              {SCENARIOS.map((s) => {
                const a = evaluate(s.txn, config);
                const changed = a.decision !== s.expected;
                return (
                  <li key={s.id} className="rounded-lg border border-stone-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{s.label}</span>
                      <DecisionChip decision={a.decision} className="!text-[10px]" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full ${
                            a.decision === "APPROVE" ? "bg-emerald-500" : a.decision === "REVIEW" ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${(a.score / MAX_SCORE) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-xs tabular-nums">{a.score}</span>
                    </div>
                    {changed && (
                      <div className="mt-1.5 text-[11px] text-indigo-700">
                        Changed from {s.expected.toLowerCase()} by your edits
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link
              href="/"
              className="mt-4 block rounded-md bg-stone-900 py-2 text-center text-sm font-semibold text-white hover:bg-black"
            >
              Try it in the checkout →
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
