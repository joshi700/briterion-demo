// Mock Brighterion decision engine. Pure and deterministic, so it runs in the
// browser (Rules tab preview) and in the /api/assess route alike.

export type IpType = "residential" | "vpn" | "tor" | "datacenter";

export type CartItem = { name: string; price: number };

export type Txn = {
  items: CartItem[];
  amount: number;
  currency: string;
  email: string;
  emailAgeDays: number;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
  accountName: string;
  cardCountry: string;
  ipAddress: string;
  ipCountry: string;
  ipType: IpType;
  billingCountry: string;
  shippingCountry: string;
  attemptsLastHour: number;
  cardsOnDevice: number;
  returningCustomer: boolean;
  priorGoodOrders: number;
};

export type RuleKind = "score" | "block" | "trust";

export type Rule = {
  id: string;
  name: string;
  description: string;
  kind: RuleKind;
  enabled: boolean;
  points: number;
  /** Optional numeric threshold the rule compares against. */
  param?: number;
  paramLabel?: string;
};

export type Thresholds = { review: number; decline: number };

export type EngineConfig = { rules: Rule[]; thresholds: Thresholds };

export type Decision = "APPROVE" | "REVIEW" | "DECLINE";

export type RuleResult = {
  id: string;
  name: string;
  kind: RuleKind;
  enabled: boolean;
  hit: boolean;
  points: number;
  detail: string;
};

export type Assessment = {
  assessmentId: string;
  score: number;
  decision: Decision;
  action: string;
  results: RuleResult[];
  reasons: string[];
  processingMs: number;
  source: "mock" | "live";
};

export const MAX_SCORE = 999;

const DISPOSABLE_DOMAINS = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.dev", "yopmail.com"];

export const BLOCKLIST = ["5105105105105100"];

export const DEFAULT_RULES: Rule[] = [
  {
    id: "blocklist",
    name: "Card on block list",
    description: "Card number is on the merchant's negative list. Always declines.",
    kind: "block",
    enabled: true,
    points: 0,
  },
  {
    id: "amount_high",
    name: "High order value",
    description: "Order total is above the threshold.",
    kind: "score",
    enabled: true,
    points: 150,
    param: 500,
    paramLabel: "Amount >",
  },
  {
    id: "country_mismatch",
    name: "Card country ≠ IP country",
    description: "Card issuing country does not match where the shopper is connecting from.",
    kind: "score",
    enabled: true,
    points: 200,
  },
  {
    id: "anon_ip",
    name: "Anonymising IP",
    description: "Shopper is behind a VPN, TOR exit node or data-centre proxy.",
    kind: "score",
    enabled: true,
    points: 180,
  },
  {
    id: "velocity",
    name: "Card velocity",
    description: "Too many payment attempts with this card in the last hour.",
    kind: "score",
    enabled: true,
    points: 200,
    param: 3,
    paramLabel: "Attempts >",
  },
  {
    id: "multi_card_device",
    name: "Device linked to many cards",
    description: "The same device fingerprint has been used with several different cards.",
    kind: "score",
    enabled: true,
    points: 120,
    param: 2,
    paramLabel: "Cards >",
  },
  {
    id: "disposable_email",
    name: "Disposable email domain",
    description: "Email uses a throwaway / temporary mailbox provider.",
    kind: "score",
    enabled: true,
    points: 150,
  },
  {
    id: "new_email",
    name: "New email address",
    description: "Email address was first seen recently.",
    kind: "score",
    enabled: true,
    points: 80,
    param: 30,
    paramLabel: "Age (days) <",
  },
  {
    id: "billing_shipping",
    name: "Billing ≠ shipping country",
    description: "Goods are being shipped to a different country from the billing address.",
    kind: "score",
    enabled: true,
    points: 100,
  },
  {
    id: "name_mismatch",
    name: "Cardholder ≠ account name",
    description: "Name on the card does not match the customer account.",
    kind: "score",
    enabled: true,
    points: 60,
  },
  {
    id: "trusted",
    name: "Trusted returning customer",
    description: "Returning customer with a history of good orders. Lowers the score.",
    kind: "trust",
    enabled: true,
    points: -150,
    param: 3,
    paramLabel: "Good orders ≥",
  },
];

export const DEFAULT_THRESHOLDS: Thresholds = { review: 300, decline: 600 };

export const DEFAULT_CONFIG: EngineConfig = { rules: DEFAULT_RULES, thresholds: DEFAULT_THRESHOLDS };

const digits = (s: string) => s.replace(/\D/g, "");

function check(rule: Rule, t: Txn): { hit: boolean; detail: string } {
  const p = rule.param ?? 0;
  switch (rule.id) {
    case "blocklist": {
      const hit = BLOCKLIST.includes(digits(t.cardNumber));
      return { hit, detail: hit ? "Card matched negative list" : "Not on block list" };
    }
    case "amount_high":
      return { hit: t.amount > p, detail: `$${t.amount.toFixed(2)} vs limit $${p}` };
    case "country_mismatch":
      return {
        hit: t.cardCountry !== t.ipCountry,
        detail: `Card ${t.cardCountry} · IP ${t.ipCountry}`,
      };
    case "anon_ip":
      return { hit: t.ipType !== "residential", detail: `IP type: ${t.ipType}` };
    case "velocity":
      return { hit: t.attemptsLastHour > p, detail: `${t.attemptsLastHour} attempts in 1h` };
    case "multi_card_device":
      return { hit: t.cardsOnDevice > p, detail: `${t.cardsOnDevice} card(s) on this device` };
    case "disposable_email": {
      const domain = t.email.split("@")[1]?.toLowerCase() ?? "";
      const hit = DISPOSABLE_DOMAINS.includes(domain);
      return { hit, detail: domain ? `Domain: ${domain}` : "No email" };
    }
    case "new_email":
      return { hit: t.emailAgeDays < p, detail: `First seen ${t.emailAgeDays} day(s) ago` };
    case "billing_shipping":
      return {
        hit: t.billingCountry !== t.shippingCountry,
        detail: `Bill ${t.billingCountry} · Ship ${t.shippingCountry}`,
      };
    case "name_mismatch": {
      const norm = (s: string) => s.trim().toLowerCase();
      const hit = norm(t.cardholderName) !== norm(t.accountName);
      return { hit, detail: `"${t.cardholderName}" vs "${t.accountName}"` };
    }
    case "trusted":
      return {
        hit: t.returningCustomer && t.priorGoodOrders >= p,
        detail: t.returningCustomer ? `${t.priorGoodOrders} good order(s)` : "New customer",
      };
    default:
      return { hit: false, detail: "" };
  }
}

export const ACTIONS: Record<Decision, string> = {
  APPROVE: "Send for authorisation",
  REVIEW: "Step up: 3-D Secure challenge",
  DECLINE: "Reject. Do not send for authorisation",
};

export function evaluate(t: Txn, config: EngineConfig = DEFAULT_CONFIG): Assessment {
  const results: RuleResult[] = config.rules.map((rule) => {
    const { hit, detail } = check(rule, t);
    return {
      id: rule.id,
      name: rule.name,
      kind: rule.kind,
      enabled: rule.enabled,
      hit: rule.enabled && hit,
      points: rule.enabled && hit ? rule.points : 0,
      detail,
    };
  });

  const raw = results.reduce((n, r) => n + r.points, 0);
  const score = Math.max(0, Math.min(MAX_SCORE, raw));
  const blocked = results.some((r) => r.kind === "block" && r.hit);

  let decision: Decision;
  if (blocked || score >= config.thresholds.decline) decision = "DECLINE";
  else if (score >= config.thresholds.review) decision = "REVIEW";
  else decision = "APPROVE";

  const reasons = results
    .filter((r) => r.hit && r.kind !== "trust")
    .sort((a, b) => (a.kind === "block" ? -1 : b.kind === "block" ? 1 : b.points - a.points))
    .map((r) => r.name);

  return {
    assessmentId: "brt_" + hash(JSON.stringify(t)).toString(36).padStart(8, "0"),
    score,
    decision,
    action: ACTIONS[decision],
    results,
    reasons,
    processingMs: 18 + (hash(t.email + t.amount) % 40),
    source: "mock",
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Demo scenarios (pre-populated shoppers)

export type Scenario = {
  id: string;
  label: string;
  tagline: string;
  expected: Decision;
  txn: Txn;
};

const base: Omit<Txn, "items" | "amount"> = {
  currency: "USD",
  email: "",
  emailAgeDays: 0,
  cardNumber: "",
  expiry: "12/29",
  cvc: "123",
  cardholderName: "",
  accountName: "",
  cardCountry: "US",
  ipAddress: "",
  ipCountry: "US",
  ipType: "residential",
  billingCountry: "US",
  shippingCountry: "US",
  attemptsLastHour: 1,
  cardsOnDevice: 1,
  returningCustomer: false,
  priorGoodOrders: 0,
};

const withTotal = (items: CartItem[]) => ({
  items,
  amount: Math.round(items.reduce((n, i) => n + i.price, 0) * 100) / 100,
});

export const SCENARIOS: Scenario[] = [
  {
    id: "happy",
    label: "Happy path",
    tagline: "Loyal customer, everything matches",
    expected: "APPROVE",
    txn: {
      ...base,
      ...withTotal([{ name: "Trail Runner Shoes", price: 129 }]),
      email: "jordan.lee@gmail.com",
      emailAgeDays: 1240,
      cardNumber: "5123 4500 0000 0008",
      cardholderName: "Jordan Lee",
      accountName: "Jordan Lee",
      ipAddress: "73.162.18.44",
      returningCustomer: true,
      priorGoodOrders: 6,
    },
  },
  {
    id: "review",
    label: "Step-up (3DS)",
    tagline: "New customer, high value, ships abroad",
    expected: "REVIEW",
    txn: {
      ...base,
      ...withTotal([
        { name: "Smartwatch Pro", price: 649 },
        { name: "International shipping", price: 40 },
      ]),
      email: "sam.patel@outlook.com",
      emailAgeDays: 12,
      cardNumber: "5123 4500 0000 0008",
      cardholderName: "Sam Patel",
      accountName: "Sam Patel",
      ipAddress: "98.207.54.10",
      shippingCountry: "CA",
    },
  },
  {
    id: "negative",
    label: "Negative path",
    tagline: "Card-testing pattern from abroad",
    expected: "DECLINE",
    txn: {
      ...base,
      ...withTotal([
        { name: 'Ultrabook 14"', price: 1199 },
        { name: "Express shipping", price: 50 },
      ]),
      email: "xk29qz@mailinator.com",
      emailAgeDays: 0,
      cardNumber: "2223 0000 0000 0007",
      cardholderName: "M Smith",
      accountName: "John Carter",
      ipAddress: "185.220.101.7",
      ipCountry: "NG",
      ipType: "vpn",
      shippingCountry: "GB",
      attemptsLastHour: 5,
      cardsOnDevice: 4,
    },
  },
  {
    id: "blocked",
    label: "Block-listed card",
    tagline: "Low score, but the card is on the negative list",
    expected: "DECLINE",
    txn: {
      ...base,
      ...withTotal([{ name: "Insulated Bottle (2-pack)", price: 79 }]),
      email: "chris.wong@yahoo.com",
      emailAgeDays: 400,
      cardNumber: "5105 1051 0510 5100",
      cardholderName: "Chris Wong",
      accountName: "Chris Wong",
      ipAddress: "24.5.88.120",
    },
  },
];

export const COUNTRIES = ["US", "CA", "GB", "AU", "IN", "SG", "DE", "NG", "BR", "RU"];

export function mergeRules(saved: Rule[] | undefined): Rule[] {
  // Keep user edits but pick up any rule added since they were saved.
  if (!saved) return DEFAULT_RULES;
  return DEFAULT_RULES.map((d) => {
    const s = saved.find((r) => r.id === d.id);
    return s ? { ...d, enabled: s.enabled, points: s.points, param: s.param } : d;
  });
}
