"use client";

import { useState } from "react";
import { COUNTRIES, type IpType, type Txn } from "@/lib/engine";
import { Field, inputCls } from "./ui";

export type Outcome =
  | { kind: "approved"; orderId: string; via3ds?: boolean }
  | { kind: "declined" }
  | { kind: "error"; message: string };

type Props = {
  txn: Txn;
  onChange: (t: Txn) => void;
  onPay: () => void;
  busy: boolean;
  outcome: Outcome | null;
  onReset: () => void;
};

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Storefront({ txn, onChange, onPay, busy, outcome, onReset }: Props) {
  const set = <K extends keyof Txn>(k: K, v: Txn[K]) => onChange({ ...txn, [k]: v });
  const patch = (p: Partial<Txn>) => onChange({ ...txn, ...p });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="ml-3 flex-1 truncate rounded bg-white px-2 py-0.5 text-xs text-stone-500 ring-1 ring-stone-200">
          🔒 shop.northwind-outfitters.example/checkout
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
        <span className="font-semibold tracking-tight">Northwind Outfitters</span>
        <span className="text-xs text-stone-400">Secure checkout</span>
      </div>

      {outcome ? (
        <Result outcome={outcome} txn={txn} onReset={onReset} />
      ) : (
        <form
          className="grid gap-6 p-5 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            onPay();
          }}
        >
          {/* Cart */}
          <div className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Your order</h3>
            <ul className="space-y-2 text-sm">
              {txn.items.map((i) => (
                <li key={i.name} className="flex justify-between gap-2">
                  <span className="text-stone-600">{i.name}</span>
                  <span className="tabular-nums">{money(i.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{money(txn.amount)}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 md:col-span-3">
            <Field label="Email">
              <input className={inputCls} value={txn.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Billing country">
                <CountrySelect value={txn.billingCountry} onChange={(v) => set("billingCountry", v)} />
              </Field>
              <Field label="Shipping country">
                <CountrySelect value={txn.shippingCountry} onChange={(v) => set("shippingCountry", v)} />
              </Field>
            </div>
            <Field label="Name on card">
              <input className={inputCls} value={txn.cardholderName} onChange={(e) => set("cardholderName", e.target.value)} />
            </Field>
            <Field label="Card number">
              <input
                className={`${inputCls} font-mono tracking-wider`}
                value={txn.cardNumber}
                inputMode="numeric"
                onChange={(e) => set("cardNumber", formatCard(e.target.value))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry">
                <input className={inputCls} value={txn.expiry} onChange={(e) => set("expiry", e.target.value)} />
              </Field>
              <Field label="CVC">
                <input className={inputCls} value={txn.cvc} onChange={(e) => set("cvc", e.target.value)} />
              </Field>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {busy ? "Processing…" : `Pay ${money(txn.amount)}`}
            </button>
          </div>
        </form>
      )}

      <Signals txn={txn} set={set} patch={patch} disabled={busy || !!outcome} />
    </div>
  );
}

function Result({ outcome, txn, onReset }: { outcome: Outcome; txn: Txn; onReset: () => void }) {
  return (
    <div className="animate-rise flex flex-col items-center px-6 py-12 text-center">
      {outcome.kind === "approved" ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h3 className="mt-4 text-xl font-semibold">Thank you, your order is confirmed</h3>
          <p className="mt-1 text-sm text-stone-500">
            Order {outcome.orderId} · {money(txn.amount)}
            {outcome.via3ds && " · verified with 3-D Secure"}
          </p>
        </>
      ) : outcome.kind === "declined" ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl text-rose-700">!</div>
          <h3 className="mt-4 text-xl font-semibold">We couldn&apos;t process your payment</h3>
          <p className="mt-1 max-w-sm text-sm text-stone-500">
            Please try a different payment method or contact support. The shopper sees a generic message; the
            reasons stay with the merchant.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold">Something went wrong</h3>
          <p className="mt-1 max-w-sm text-sm text-rose-600">{outcome.message}</p>
        </>
      )}
      <button onClick={onReset} className="mt-6 rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50">
        Start over
      </button>
    </div>
  );
}

function Signals({
  txn,
  set,
  patch,
  disabled,
}: {
  txn: Txn;
  set: <K extends keyof Txn>(k: K, v: Txn[K]) => void;
  patch: (p: Partial<Txn>) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true);
  const num = (k: keyof Txn) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);
  return (
    <div className="border-t border-dashed border-stone-300 bg-stone-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Behind the scenes · signals collected for Brighterion
        </span>
        <span className="text-stone-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <fieldset disabled={disabled} className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
          <Field label="Order total ($)">
            <input
              type="number"
              className={inputCls}
              value={txn.amount}
              onChange={(e) => {
                const amount = Number(e.target.value);
                patch({ amount, items: [{ name: "Custom basket", price: amount }] });
              }}
            />
          </Field>
          <Field label="Card issuing country">
            <CountrySelect value={txn.cardCountry} onChange={(v) => set("cardCountry", v)} />
          </Field>
          <Field label="IP country">
            <CountrySelect value={txn.ipCountry} onChange={(v) => set("ipCountry", v)} />
          </Field>
          <Field label="IP type">
            <select className={inputCls} value={txn.ipType} onChange={(e) => set("ipType", e.target.value as IpType)}>
              {["residential", "vpn", "tor", "datacenter"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Email age (days)">
            <input type="number" className={inputCls} value={txn.emailAgeDays} onChange={num("emailAgeDays")} />
          </Field>
          <Field label="Attempts on card (1h)">
            <input type="number" className={inputCls} value={txn.attemptsLastHour} onChange={num("attemptsLastHour")} />
          </Field>
          <Field label="Cards on device">
            <input type="number" className={inputCls} value={txn.cardsOnDevice} onChange={num("cardsOnDevice")} />
          </Field>
          <Field label="Account name">
            <input className={inputCls} value={txn.accountName} onChange={(e) => set("accountName", e.target.value)} />
          </Field>
          <Field label="Customer">
            <select
              className={inputCls}
              value={txn.returningCustomer ? "returning" : "new"}
              onChange={(e) => set("returningCustomer", e.target.value === "returning")}
            >
              <option value="new">New</option>
              <option value="returning">Returning</option>
            </select>
          </Field>
          <Field label="Prior good orders">
            <input type="number" className={inputCls} value={txn.priorGoodOrders} onChange={num("priorGoodOrders")} />
          </Field>
          <Field label="IP address" className="col-span-2">
            <input className={`${inputCls} font-mono`} value={txn.ipAddress} onChange={(e) => set("ipAddress", e.target.value)} />
          </Field>
        </fieldset>
      )}
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {COUNTRIES.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>
  );
}

function formatCard(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}
