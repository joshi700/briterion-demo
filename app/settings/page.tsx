"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "@/lib/engine";
import { useMode, type Mode } from "@/lib/store";

type Info = { liveConfigured: boolean; liveHost: string | null };

export default function SettingsPage() {
  const [mode, setMode] = useMode();
  const [info, setInfo] = useState<Info | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/assess")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ liveConfigured: false, liveHost: null }));
  }, []);

  const sample = JSON.stringify({ mode: "mock", txn: SCENARIOS[2].txn }, null, 2);
  const curl = `curl -X POST ${origin || "https://<your-app>"}/api/assess \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ mode: "mock", txn: SCENARIOS[2].txn })}'`;

  const options: { id: Mode; title: string; body: string; disabled?: boolean }[] = [
    {
      id: "mock",
      title: "Mock",
      body: "Built-in demo engine. Same inputs always give the same result. No network calls.",
    },
    {
      id: "live",
      title: "Live endpoint",
      body: info?.liveConfigured
        ? `Transactions are forwarded server-side to ${info.liveHost}.`
        : "Not configured. Set BRITERION_API_URL (and BRITERION_API_KEY) in the deployment environment.",
      disabled: !info?.liveConfigured,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Decisioning mode</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <button
              key={o.id}
              disabled={o.disabled}
              onClick={() => setMode(o.id)}
              className={`rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                mode === o.id ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className={`h-3 w-3 rounded-full border ${mode === o.id ? "border-stone-900 bg-stone-900" : "border-stone-300"}`}
                />
                {o.title}
              </div>
              <p className="mt-1 text-xs text-stone-500">{o.body}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Assessment API</h2>
        <p className="mt-1 text-sm text-stone-500">
          This demo exposes a real HTTP endpoint you can call from Postman or curl:{" "}
          <code className="rounded bg-stone-100 px-1 font-mono text-xs">POST /api/assess</code>. Send{" "}
          <code className="font-mono text-xs">{"{ mode, txn, config? }"}</code> and get back the score, decision and
          rules that fired. Leave out <code className="font-mono text-xs">config</code> to use the default rules.
        </p>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">curl</h3>
        <pre className="mt-1 overflow-auto rounded-md bg-stone-950 p-3 font-mono text-[11px] text-stone-100">{curl}</pre>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">Request body (negative path)</h3>
        <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-stone-950 p-3 font-mono text-[11px] text-stone-100">
          {sample}
        </pre>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">Live endpoint contract</h3>
        <p className="mt-1 text-sm text-stone-500">
          In Live mode the server POSTs <code className="font-mono text-xs">{"{ txn, config }"}</code> to{" "}
          <code className="font-mono text-xs">BRITERION_API_URL</code>, with the card number masked to BIN + last 4 and
          the CVC removed. The response needs at least{" "}
          <code className="font-mono text-xs">{'{ "score": number, "decision": "APPROVE" | "REVIEW" | "DECLINE" }'}</code>.
          It can also return <code className="font-mono text-xs">results</code>,{" "}
          <code className="font-mono text-xs">reasons</code> and <code className="font-mono text-xs">action</code>.
        </p>
      </section>
    </main>
  );
}
