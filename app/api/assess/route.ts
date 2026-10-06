import { NextResponse } from "next/server";
import { DEFAULT_CONFIG, evaluate, type EngineConfig, type Txn } from "@/lib/engine";

// POST /api/assess  { txn, config?, mode? }
//   mode "mock" (default): scored by the built-in demo engine.
//   mode "live": forwarded to BRIGHTERION_API_URL (server-side, so the key never reaches the browser).

const LIVE_URL = process.env.BRIGHTERION_API_URL;
const LIVE_KEY = process.env.BRIGHTERION_API_KEY;

export async function GET() {
  return NextResponse.json({
    service: "brighterion-demo",
    endpoint: "POST /api/assess",
    liveConfigured: Boolean(LIVE_URL),
    liveHost: LIVE_URL ? new URL(LIVE_URL).host : null,
  });
}

export async function POST(req: Request) {
  let body: { txn?: Txn; config?: EngineConfig; mode?: "mock" | "live" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!body.txn) return NextResponse.json({ error: "Missing txn" }, { status: 400 });

  const config = body.config ?? DEFAULT_CONFIG;

  if (body.mode !== "live") {
    return NextResponse.json(evaluate(body.txn, config));
  }

  if (!LIVE_URL) {
    return NextResponse.json(
      { error: "Live mode is not configured. Set BRIGHTERION_API_URL (and optionally BRIGHTERION_API_KEY)." },
      { status: 501 },
    );
  }

  const started = Date.now();
  try {
    const res = await fetch(LIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LIVE_KEY ? { Authorization: `Bearer ${LIVE_KEY}` } : {}),
      },
      body: JSON.stringify({ txn: maskCard(body.txn), config }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.score !== "number" || !data.decision) {
      return NextResponse.json(
        { error: `Live endpoint returned ${res.status}`, upstream: data },
        { status: 502 },
      );
    }
    // Fill in anything the live service leaves out so the UI can still render it.
    const fallback = evaluate(body.txn, config);
    return NextResponse.json({
      ...fallback,
      ...data,
      processingMs: data.processingMs ?? Date.now() - started,
      source: "live",
    });
  } catch (e) {
    return NextResponse.json({ error: `Could not reach live endpoint: ${(e as Error).message}` }, { status: 502 });
  }
}

function maskCard(t: Txn): Txn {
  const d = t.cardNumber.replace(/\D/g, "");
  return { ...t, cardNumber: d.slice(0, 6) + "******" + d.slice(-4), cvc: "" };
}
