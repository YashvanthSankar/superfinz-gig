# SuperFinz

SuperFinz is a one-stop financial resilience dashboard for gig and informal workers whose income changes from week to week.

The product answers one useful question first: **how much money is actually safe to spend before the next expected payout?** It protects upcoming commitments, earning costs, and an emergency buffer before showing a flexible amount.

Built for **Innovation Unbound — Financial Resilience for Gig and Informal Workers**.

## What works

- Google sign-in on web, iOS, and Android development builds
- Guided setup for income range, work costs, important bills, and safety goals
- One clear safe-to-use amount based only on money already received
- Simple income and work-cost entry with true take-home for the week
- Adaptive payout planning that protects bills, work money, and a cushion first
- Easy scenarios for a low-income week, late payout, repair, or time off
- Plain-language money coach grounded in the same saved figures
- Calm light and dark themes on web and iOS
- Full calculations, source controls, safety checks, and responsible-credit details available only when requested
- Public Ravi demo at `/demo` with no login required

The current platform connections and credit preview are explicitly marked as prototypes. SuperFinz does not connect to a real bank, move money, or issue a loan in this build.

## Architecture

| Layer       | Technology                            | Responsibility                                                                   |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| Web         | Next.js 16 + React 19                 | Landing, demo, onboarding, dashboard, API routes                                 |
| Mobile      | Expo SDK 57 + Expo Router             | Native iOS and Android experience                                                |
| Shared      | TypeScript + Zod                      | Contracts, validation, and deterministic money calculations                      |
| Database    | Convex                                | Users, sessions, gig profiles, ledger, commitments, sources, pockets, and splits |
| Web auth    | NextAuth                              | Google OAuth and secure web session cookie                                       |
| Mobile auth | Google native sign-in + JWT           | Short access token, rotating refresh token, SecureStore                          |
| Coach       | OpenAI Responses API + local fallback | Short plan-grounded answers without exposing secrets to the client               |

### Data flow

```text
Web / Expo UI
      |
      v
Authenticated Next.js API routes
      |
      v
Server-only Convex adapter
      |
      v
Secured Convex queries and atomic mutations
      |
      v
Shared deterministic dashboard calculator
```

The Convex functions require a server key and every record is checked against the signed-in user ID. The browser and native app never receive the Convex server key.

## Gig-worker tables

- `gigProfiles`: income range, working pattern, current balance, and safety targets
- `gigIncomeSources`: manual or simulated sources, expected payout range, status, and consent dates
- `gigCashEntries`: settled/expected ledger with pocket debit and linked-operation metadata
- `gigCommitments`: amount, due date, recurrence, importance, funding, and payment status
- `gigPockets`: the five protected money purposes
- `gigSplitRules`: user-confirmed percentage rule totaling exactly 100%
- `gigPayoutSplits`: immutable audit record for each confirmed payout split
- `gigPreferences` and `gigNotificationStates`: worker-controlled, non-promotional reminders
- `gigOutcomeEvents`: anonymous product-outcome measurement for the hackathon demo
- `users` and `mobileSessions`: Google identity and hashed rotating native sessions

Legacy PostgreSQL tables remain only as an import source; the running app reads and writes Convex.

## Routes

| Route                 | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `/`                   | Product landing page                                       |
| `/demo`               | Complete Ravi prototype dashboard without authentication   |
| `/login`              | Google sign-in and demo access                             |
| `/onboarding`         | Irregular-income setup flow                                |
| `/dashboard`          | Safe-to-spend Today view                                   |
| `/dashboard/income`   | Cashbook, income sources, payout Smart Split               |
| `/dashboard/plan`     | Forecast, commitments, earning target, scenarios           |
| `/dashboard/safety`   | Pockets, resilience factors, responsible credit guardrails |
| `/dashboard/coach`    | Plan-grounded questions and answers                        |
| `/dashboard/settings` | Profile, split rule, source consent, sign-out              |

The equivalent native experience lives under `apps/mobile/src/app`.
Older generic-budget dashboard URLs redirect into these gig-worker screens so the product has one clear purpose.

## Local setup

Use Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Set the environment values described in the two example files. Do not put a Google client secret in any `EXPO_PUBLIC_` value.

For AI coach answers, set `OPENAI_API_KEY` only on the Next.js server. `OPENAI_MODEL` is optional. Without an API key, the coach still returns a deterministic answer from the saved plan.

Link and push the existing Convex project:

```bash
npx convex dev --configure existing --once
```

Start the web API and Expo development server in separate terminals:

```bash
npm run dev
npm run mobile
```

For a physical phone, `EXPO_PUBLIC_API_URL` must be a reachable LAN or HTTPS address. For the local iOS simulator, `http://127.0.0.1:3000` works when the web server is on port 3000. See [MOBILE_SETUP.md](MOBILE_SETUP.md) for native OAuth and EAS instructions.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:convex
npm run build
cd apps/mobile && npx expo install --check
```

The Convex smoke test creates an isolated test user and verifies authentication, ownership, onboarding, editable cashbook records, adaptive bill protection, preferences, outcome metrics, pocket updates, and session rotation. It removes the test user and every related record afterward.

## PostgreSQL-to-Convex import

If an older PostgreSQL database must be imported, set `DATABASE_URL`, point the Convex environment values to the intended deployment, and run:

```bash
npm run migrate:convex
```

The importer uses stable external IDs so it can be rerun without duplicating legacy rows. Always back up the source database first.

## Safety boundaries

- Expected payouts never increase the spendable balance until confirmed as settled.
- Forecasts show ranges, not guarantees.
- The Resilience Passport is not a bureau credit score.
- Credit is not auto-approved from behavioral data.
- Smart Split requires a 100% rule and explicit user confirmation.
- Source access can be paused or revoked.
- Financial actions expose loading, error, and review states.
