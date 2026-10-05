# Briterion demo: CNP fraud decisioning

Mock e-commerce checkout (Northwind Outfitters) next to a live Briterion merchant console that scores each
transaction before it goes to authorisation.

## Demo flows (pre-populated)

1. **Happy path**: loyal customer, everything matches → Approve → authorised
2. **Step-up (3DS)**: new customer, high value, ships abroad → Review → 3DS challenge (code `1234`) → authorised with liability shift
3. **Negative path**: card-testing pattern (VPN, foreign IP, disposable email, velocity) → Decline before authorisation
4. **Block-listed card**: low score, but the card is on the negative list → hard decline

Every field in the checkout and in "Behind the scenes" can be edited, so you can build custom cases live.

## Pages

- `/`: checkout demo (with an API request/response view)
- `/rules`: turn rules on/off, change weights, limits and thresholds; preview updates live against all scenarios
- `/settings`: Mock / Live mode, plus curl docs for the API

## API

`POST /api/assess` with `{ mode?: "mock" | "live", txn, config? }` → `{ score, decision, action, results, reasons, … }`

Live mode forwards server-side to `BRITERION_API_URL` (Bearer `BRITERION_API_KEY`). See `.env.example`.

## Run

```bash
npm install
npm run dev
```
