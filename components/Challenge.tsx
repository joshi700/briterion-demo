"use client";

import { useState } from "react";
import { inputCls } from "./ui";

/** Mock 3-D Secure issuer challenge shown when Briterion returns REVIEW. */
export default function Challenge({
  amount,
  card,
  onResult,
}: {
  amount: number;
  card: string;
  onResult: (ok: boolean) => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const last4 = card.replace(/\D/g, "").slice(-4);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-rise w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <span className="text-sm font-semibold">Your Bank · Secure verification</span>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">3-D SECURE</span>
        </div>
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (code === "1234") onResult(true);
            else setErr(true);
          }}
        >
          <p className="text-sm text-stone-600">
            Briterion asked for extra verification. Enter the code we sent to your phone to approve a payment of{" "}
            <b>${amount.toFixed(2)}</b> with card ending <b>{last4}</b>.
          </p>
          <input
            autoFocus
            className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`}
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErr(false);
            }}
            placeholder="••••"
          />
          {err && <p className="text-xs text-rose-600">Incorrect code. Try again.</p>}
          <p className="text-xs text-stone-400">Demo code: 1234</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onResult(false)}
              className="flex-1 rounded-md border border-stone-300 py-2 text-sm hover:bg-stone-50"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-md bg-stone-900 py-2 text-sm font-semibold text-white">
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
