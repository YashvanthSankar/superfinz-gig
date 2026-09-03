# SuperFinz

<p align="center">
  <img src="public/superfinz.webp" width="112" alt="SuperFinz logo" />
</p>

<h3 align="center">A salary layer for people without salaries.</h3>

<p align="center">
  SuperFinz turns irregular earnings into one calm, explainable money plan:<br />
  protect the next bills, keep enough money to continue working, build a cushion, and show what is truly safe to spend.
</p>

<p align="center">
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-0B1220?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img alt="Expo 57" src="https://img.shields.io/badge/Expo-57-0B1220?style=flat-square&logo=expo&logoColor=white" />
  <img alt="Convex" src="https://img.shields.io/badge/Database-Convex-2563EB?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-2563EB?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Platforms" src="https://img.shields.io/badge/Apps-Web%20%7C%20iOS%20%7C%20Android-0F2D4A?style=flat-square" />
</p>

> **Innovation Unbound challenge:** How might banking technology help gig workers and people with irregular incomes build financial resilience through intelligent savings, responsible access to credit, and personalized financial guidance?

## The 20-second pitch

A delivery partner may see ₹6,800 in the bank, but that is not ₹6,800 available to spend. Some of it already belongs to rent, fuel, an electricity bill, or the next week of work. Existing banking apps show the balance. Budgeting apps explain where money went. Credit apps offer a loan after the shortage appears.

**SuperFinz intervenes before the shortage.** It plans around the next likely payout, protects essential commitments and earning costs from money already received, and shows one number the worker can safely use without breaking the plan.

```text
Money available now
− protected bills due before the next payout
− money required to keep earning
− the worker's chosen safety buffer
= SAFE TO SPEND UNTIL THE NEXT PAYOUT
```

Expected income is shown as a range, but it never becomes spendable until it actually arrives.

## Why this problem matters

Gig workers do not primarily have an overspending problem. They have a **timing, uncertainty, and liquidity problem**.

- Earnings arrive on different days through platforms, UPI, bank transfers, and cash.
- Gross earnings hide fuel, maintenance, commissions, mobile data, and other costs required to keep working.
- Rent, school fees, utilities, family support, and EMIs stay fixed during a weak week.
- A late payout or vehicle repair can turn a manageable week into repeated short-term borrowing.
- A rigid monthly budget assumes a salary date and a predictable amount—two things many gig workers do not have.

The scale is material: NITI Aayog estimated 7.7 million Indian gig workers in 2020–21 and projected 23.5 million by 2029–30. A Bengaluru financial-diaries study by Dvara Research found high variation in both daily earnings and daily work expenses; in its small sample, 18 of 22 workers borrowed during the 14-day diary period, and 60% of the new loans were used for routine consumption smoothing. These figures are directional rather than population-wide, but they reveal the product gap clearly. Sources: [NITI Aayog](https://www.niti.gov.in/sites/default/files/2023-02/25th_June_Final_Report_27062022.pdf), [Dvara Research](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf).

## The overlooked insight

Workers already try to **harden money**: mentally reserving part of a payout for rent, fuel, school fees, or an emergency before it disappears into daily spending.

SuperFinz turns that useful real-world behaviour into an adaptive digital system.

It does not force a salaried-person budget onto an irregular earner. It changes the planning clock from **“this month”** to **“until the next reliable payout.”**

## Our solution: the Adaptive Income Firewall

SuperFinz combines six capabilities into one decision loop.

### 1. Income Pulse

Records settled platform payouts, bank or UPI income, and manual cash income while keeping expected payouts visibly separate. It also separates gross earnings from work expenses to show true net earnings.

### 2. Safe Until Next Payout

Calculates a conservative safe-to-spend amount using only current liquid money. The card also explains the planning horizon, protected bills, required work costs, safety-buffer gap, data freshness, and expected-payout range.

### 3. Adaptive Payout Plan

When money arrives, SuperFinz recommends how to protect it in this order:

1. overdue and near-term essential commitments;
2. fuel, data, maintenance, and other earning-enabling costs;
3. the next day of emergency cushion;
4. longer-term savings;
5. flexible spending.

This is not a rigid 50/30/20 split. The recommendation changes with the actual payout, due dates, funded commitments, work needs, and current cushion. The worker reviews and confirms every allocation.

### 4. Shock Simulator

The worker can ask practical questions before making a decision:

- What if the next payout is late?
- What if next week's income falls?
- What if the vehicle needs a ₹2,500 repair?
- Can I take a day off?

The same calculation engine updates safe-to-spend, commitments at risk, cushion days, and the required earning target immediately.

### 5. Resilience Passport

An explainable planning indicator based on controllable financial factors such as commitment coverage, cushion depth, income-source concentration, income range, and work-cost control. It is explicitly **not** a bureau credit score and never uses contacts, messages, protected traits, or opaque platform ratings.

### 6. Plan-grounded Money Coach

The coach answers in short, plain language using the worker's saved plan. Financial numbers come from deterministic shared calculations—not from the language model. If AI is unavailable, the app returns a deterministic fallback instead of breaking the experience.

## Why SuperFinz is different

| Common approach | What it misses | SuperFinz response |
| --- | --- | --- |
| Expense tracker | Explains spending after it happens | Protects essential money before spending happens |
| Monthly budget | Assumes stable salary timing and amount | Plans until the next likely payout |
| Bank-balance dashboard | Treats the visible balance as usable money | Separates protected, required-to-earn, and safe money |
| Fixed percentage split | Ignores urgent bills and changing work costs | Adapts each payout to the worker's present situation |
| Income forecast | Can create false confidence | Shows a conservative range and does not spend it early |
| AI finance chatbot | Can produce fluent but ungrounded advice | Deterministic engine first; AI explains the verified plan |
| Credit-first gig fintech | Treats debt as the first intervention | Tries rescheduling, reallocation, cushion use, and an earning target first |
| Alternative credit score | Risks another opaque gatekeeper | Shows every factor and keeps the score out of automatic lending decisions |

> **Our novelty is not “safe to spend” by itself.** It is the closed loop that protects essential commitments and earning costs from every irregular inflow, adapts to the next payout horizon, tests shocks, and recommends non-credit actions before debt.

## A complete worker journey

```mermaid
flowchart LR
    A[Add work and income range] --> B[Add rent, bills and school fees]
    B --> C[Add weekly fuel and work costs]
    C --> D[See safe to spend until next payout]
    D --> E[Record a settled payout]
    E --> F[Review adaptive protection plan]
    F --> G[Test a late payout or repair]
    G --> H[Take one clear next action]
```

The onboarding asks only for information that changes the plan. Advanced controls remain behind help panels or focused subpages so a first-time digital finance user is not overwhelmed.

## Product surfaces

SuperFinz is implemented as a responsive web product and a native Expo application for iOS and Android.

| Surface | What the worker can do |
| --- | --- |
| **Today** | See safe-to-spend, the safe-until date, expected payout range, protected money, and one best next step |
| **Money** | Record settled income or costs, see true net work earnings, manage income sources, and start a payout plan |
| **Plan** | Add rent, electricity, gas, education fees, or EMIs; mark them paid; and run shock scenarios |
| **Safety** | Track protected pockets, cushion days, resilience factors, and responsible-credit guardrails |
| **Coach** | Ask plain-language questions grounded in the same live plan |
| **Settings** | Control profile, accessibility, alert preferences, split rules, and source consent |

### Designed for low digital confidence

- One primary decision per screen
- Plain words instead of banking jargon
- Large touch targets and clear back navigation
- Help beside unfamiliar concepts
- Progressive disclosure instead of crowded dashboards
- Larger-text, higher-contrast, and reduced-motion preferences
- Loading, empty, error, review, and undo states for financial actions
- Consistent experience across web, iOS, and Android

## The demo story

The public `/demo` route uses a fictional worker named Ravi and requires no sign-in.

Ravi has ₹6,800 available. SuperFinz protects his upcoming commitments, work costs, and safety buffer, then shows **₹620 safe until the next payout**. His expected ₹2,100–₹3,400 payout is visible but not counted. A judge can then plan a ₹3,200 settled payout or simulate a ₹2,500 repair and watch the recommended action change.

### 90-second judging flow

1. Open `/demo` and start on **Today**.
2. Expand **How is this calculated?** to prove the number is explainable.
3. Open **Money → Plan a payout**, enter ₹3,200, and review the adaptive allocation.
4. Open **Plan → What if income changes?** and select the ₹2,500 repair scenario.
5. Open **Safety** to show cushion days and transparent resilience factors.
6. Ask the **Coach** why the safe amount changed.

That sequence demonstrates one coherent decision engine—not a collection of disconnected screens.

## What is real in this prototype

### Fully implemented

- Google authentication for web and native development builds
- Guided gig-worker onboarding
- Editable income, cost, commitment, pocket, source, and preference data
- Shared deterministic safe-to-spend and forecast calculations
- Adaptive payout recommendation, review, confirmation, and audit record
- Shock simulation and non-credit alternatives
- Explainable Resilience Passport
- Plan-grounded AI coach with deterministic fallback
- Convex persistence with per-user ownership checks
- Native access/refresh session rotation with hashed refresh tokens
- Public no-login demo
- End-to-end iOS and Android application surface through Expo

### Simulated and clearly labelled

- Platform account connections and automatic payout sync
- Account Aggregator or bank data integration
- Real movement of protected money between bank accounts
- Partner credit, insurance, and benefit eligibility

SuperFinz does **not** connect to a real bank, move money, approve credit, or issue a loan in this build.

## Responsible finance by design

1. **Settled money only:** pending income never increases today's spendable balance.
2. **Ranges, not promises:** uncertain income is represented as a low–high estimate with confidence.
3. **Explain every number:** the inputs and protected amounts remain visible to the worker.
4. **User control:** payout allocations and source permissions require explicit confirmation.
5. **Non-credit first:** reschedule a flexible bill, reduce flexible allocation, set an earning target, or use only the necessary cushion before showing partner credit.
6. **No dark scoring:** the Resilience Passport is not a bureau score or an automatic lending decision.
7. **No invasive signals:** no contacts, messages, precise movement patterns, or protected traits are used.

## How the calculation works

The shared engine chooses the earliest upcoming active payout as the planning horizon. If no reliable payout exists, it uses a conservative seven-day horizon.

```text
unfunded essentials = essential bills due by the horizon − money already assigned
unfunded work costs = earning costs needed by the horizon − protected work money
safety gap         = chosen minimum buffer − current emergency cushion

protected money = protected pockets
                + unfunded essentials
                + unfunded work costs
                + safety gap

safe to spend = max(0, current balance − protected money)
```

The implementation clamps protected money to the current balance, avoids double-counting already funded commitments, and recalculates after every saved or deleted ledger entry. The core logic lives in [`packages/shared/src/gig.ts`](packages/shared/src/gig.ts) and is covered by deterministic tests in [`packages/shared/src/gig.test.ts`](packages/shared/src/gig.test.ts).

## Architecture

```mermaid
flowchart TB
    subgraph Clients
        W[Next.js web]
        I[iOS app]
        A[Android app]
    end

    W --> API[Authenticated Next.js API layer]
    I --> API
    A --> API

    API --> AUTH[Web + native session validation]
    API --> ENGINE[Shared TypeScript decision engine]
    API --> COACH[OpenAI Responses API<br/>with deterministic fallback]
    API --> STORE[Server-only Convex adapter]
    STORE --> DB[(Convex database)]

    ENGINE --> API
    AUTH --> API
```

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React 19 | Landing, public demo, onboarding, dashboard, authenticated API routes |
| Mobile | Expo SDK 57, Expo Router, React Native | Native iOS and Android experience |
| Shared core | TypeScript, Zod | Contracts, validation, safe-to-spend, forecast, payout, scenario, notification calculations |
| Database | Convex | Users, sessions, gig profiles, ledger, commitments, pockets, sources, rules, splits, preferences, outcomes |
| Web auth | NextAuth | Google OAuth and secure web session cookie |
| Native auth | Google Sign-In, JWT, SecureStore | Short access token and rotating refresh session |
| Coach | OpenAI Responses API | Plain-language explanation of server-supplied plan data |

### Security boundaries

- Convex is accessed through a server-only adapter; its server key is never exposed to browsers or native clients.
- Every protected query and mutation validates the signed-in user and record ownership.
- Native refresh tokens are random, hashed at rest, rotated on use, revocable, and stored on-device with SecureStore.
- The AI coach receives a bounded plan summary rather than database credentials or unrestricted records.
- Secrets must never use `NEXT_PUBLIC_` or `EXPO_PUBLIC_` prefixes.

## Repository map

```text
innovation-unbound/
├── src/app/                  # Next.js pages and authenticated API routes
├── src/components/gig/       # Web gig-worker product surfaces
├── apps/mobile/src/app/      # Expo Router screens for iOS and Android
├── packages/shared/src/      # Shared schemas and deterministic finance engine
├── convex/                   # Database schema, queries, and atomic mutations
├── scripts/                  # Migration and end-to-end smoke checks
└── prisma/                   # Legacy PostgreSQL import source only
```

The running application reads and writes Convex. Legacy PostgreSQL tables remain only as an optional migration source.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Product story and entry point |
| `/demo` | Complete Ravi demo without authentication |
| `/login` | Google sign-in and demo access |
| `/onboarding` | Irregular-income setup |
| `/dashboard` | Today and safe-to-spend |
| `/dashboard/income` | Cashbook, sources, and payout plan |
| `/dashboard/plan` | Commitments, forecast, and scenarios |
| `/dashboard/safety` | Pockets, resilience, and credit guardrails |
| `/dashboard/coach` | Plan-grounded money coach |
| `/dashboard/settings` | Profile, preferences, consent, and split rule |

The equivalent native routes live under [`apps/mobile/src/app`](apps/mobile/src/app).

## Run locally

### Prerequisites

- Node.js 22.13 or newer
- A Convex project
- Google OAuth clients for the platforms being tested
- Xcode for iOS or Android Studio for Android native development builds

### Install

```bash
npm install
cp .env.example .env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Fill the documented variables in both example files. Keep `OPENAI_API_KEY`, `SUPERFINZ_SERVER_KEY`, Google client secrets, and JWT secrets server-side.

Link the existing Convex project:

```bash
npx convex dev --configure existing --once
```

Start the web/API server and Expo in separate terminals:

```bash
npm run dev
npm run mobile
```

Open the native apps with:

```bash
npm run mobile:ios
npm run mobile:android
```

For a physical phone, `EXPO_PUBLIC_API_URL` must be a reachable LAN or HTTPS address. For the local iOS simulator, `http://127.0.0.1:3000` works when Next.js runs on port 3000. Native OAuth and EAS instructions are in [`MOBILE_SETUP.md`](MOBILE_SETUP.md).

The AI coach is optional for local development. Without `OPENAI_API_KEY`, the deterministic fallback still returns an answer grounded in the current plan.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:convex
npm run build
cd apps/mobile && npx expo install --check
```

The shared tests verify safe-to-spend, funded-commitment handling, settled-versus-expected income, adaptive allocation, scenario changes, and non-promotional alerts. The Convex smoke test creates an isolated user and checks authentication, ownership, onboarding, cashbook changes, payout protection, preferences, outcome events, pocket updates, and native session rotation before removing the test data.

## Production path

The prototype deliberately proves the decision system before pretending integrations are live. A responsible production rollout would add:

1. consented financial data through a regulated Account Aggregator or bank partner;
2. direct platform payout feeds plus manual and cash fallback paths;
3. bank-held goal pockets or recurring sweep instructions with explicit confirmation;
4. multilingual and voice-assisted onboarding with field testing;
5. regulated benefit, insurance, and credit partners only after non-credit interventions;
6. longitudinal outcome measurement: commitments paid on time, cushion days gained, and credit avoided.

## Success metrics

SuperFinz should be judged on resilience outcomes, not screen time:

- percentage of essential commitments funded before due dates;
- protected days added to the emergency cushion;
- reduction in unexpected shortfalls;
- true net earnings visibility after work costs;
- workers who avoid or reduce unnecessary short-term borrowing;
- comprehension of the safe-to-spend explanation;
- successful independent use by low-digital-confidence workers.

---

<p align="center">
  <strong>SuperFinz does not ask, “Where did your money go?”</strong><br />
  It answers, <strong>“What can you safely do next?”</strong>
</p>

<p align="center">Built for Innovation Unbound · Financial Resilience for Gig and Informal Workers</p>
