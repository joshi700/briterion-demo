"use client";

import { useRef, useState } from "react";
import Storefront, { type Outcome } from "@/components/Storefront";
import DecisionPanel from "@/components/DecisionPanel";
import Challenge from "@/components/Challenge";
import { DecisionChip } from "@/components/ui";
import { SCENARIOS, type Assessment, type Txn } from "@/lib/engine";
import { useEngineConfig, useMode } from "@/lib/store";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DemoPage() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [txn, setTxn] = useState<Txn>(SCENARIOS[0].txn);
  const [config] = useEngineConfig();
  const [mode] = useMode();

  const [busy, setBusy] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [request, setRequest] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const run = useRef(0);

  function reset(next?: Txn) {
    run.current++;
    setBusy(false);
    setAssessment(null);
    setRevealed(0);
    setRequest(null);
    setError(null);
    setChallenge(false);
    setOutcome(null);
    setFollowUp(null);
    if (next) setTxn(next);
  }

  function pickScenario(id: string) {
    setScenarioId(id);
    reset(SCENARIOS.find((s) => s.id === id)!.txn);
  }

  async function pay() {
    reset();
    const id = run.current;
    setBusy(true);
    const body = { mode, txn: { ...txn, cardNumber: maskPan(txn.cardNumber), cvc: "***" }, config };
    setRequest({ method: "POST", url: "/api/assess", body });

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, txn, config }),
      });
      const data = await res.json();
      if (id !== run.current) return;
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);

      await wait(350);
      const a = data as Assessment;
      setAssessment(a);
      for (let i = 1; i <= a.results.length; i++) {
        await wait(110);
        if (id !== run.current) return;
        setRevealed(i);
      }
      await wait(800);
      if (id !== run.current) return;

      if (a.decision === "APPROVE") {
        setOutcome({ kind: "approved", orderId: orderId() });
        setFollowUp("Sent to the Mastercard Gateway for authorisation. Approved by the issuer.");
      } else if (a.decision === "DECLINE") {
        setOutcome({ kind: "declined" });
        setFollowUp("Blocked before authorisation. No issuer call, no chargeback exposure.");
      } else {
        setChallenge(true);
        setFollowUp("Stepping up to 3-D Secure. Waiting for the cardholder…");
      }
    } catch (e) {
      if (id !== run.current) return;
      setError((e as Error).message);
      setOutcome({ kind: "error", message: (e as Error).message });
    } finally {
      if (id === run.current) setBusy(false);
    }
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Card-not-present checkout</h1>
          <span className="hidden text-sm text-stone-500 sm:inline">Pick a shopper to pre-populate the checkout</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => pickScenario(s.id)}
              className={`rounded-xl border bg-white p-3 text-left transition ${
                s.id === scenarioId ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {i + 1}. {s.label}
                </span>
                <DecisionChip decision={s.expected} className="!text-[10px]" />
              </div>
              <div className="mt-1 text-xs text-stone-500">{s.tagline}</div>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Storefront
            txn={txn}
            onChange={(t) => {
              setTxn(t);
              if (scenario && JSON.stringify(t) !== JSON.stringify(scenario.txn)) setScenarioId("custom");
            }}
            onPay={pay}
            busy={busy || challenge}
            outcome={outcome}
            onReset={() => reset()}
          />
        </div>
        <div className="space-y-3 lg:sticky lg:top-20 lg:col-span-5 lg:self-start">
          <DecisionPanel
            assessment={assessment}
            revealed={revealed}
            thresholds={config.thresholds}
            busy={busy}
            request={request}
            error={error}
          />
          {followUp && (
            <div className="animate-rise rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Next</span>
              {followUp}
            </div>
          )}
        </div>
      </div>

      {challenge && (
        <Challenge
          amount={txn.amount}
          card={txn.cardNumber}
          onResult={(ok) => {
            setChallenge(false);
            if (ok) {
              setOutcome({ kind: "approved", orderId: orderId(), via3ds: true });
              setFollowUp("Cardholder authenticated with 3-D Secure. Authorised, with fraud liability shifted to the issuer.");
            } else {
              setOutcome({ kind: "declined" });
              setFollowUp("3-D Secure challenge failed or was abandoned. Payment not authorised.");
            }
          }}
        />
      )}
    </main>
  );
}

function maskPan(pan: string) {
  const d = pan.replace(/\D/g, "");
  return d.length > 10 ? `${d.slice(0, 6)}******${d.slice(-4)}` : d;
}

function orderId() {
  return "NW-" + Math.floor(100000 + Math.random() * 900000);
}
