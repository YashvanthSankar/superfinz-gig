# SuperFinz — Implemented Feature Inventory

> Repository snapshot for hackathon judges, product reviewers, and investors.
> This document lists what is present in the codebase today and clearly labels
> prototype or backend-only work. It does not describe a future roadmap.

## Status key

- **Working:** Implemented in the product and backed by real application logic.
- **Prototype:** Usable in the demo, but an external financial institution or
  service is simulated.
- **Backend-ready:** Data model, calculation, or API exists, but there is no
  complete customer-facing screen or delivery channel yet.
- **Legacy/supporting:** Present in the repository, but not part of the current
  SuperFinz Gig customer journey.

## What SuperFinz does

SuperFinz is a web, iOS, and Android money-planning product for gig workers,
freelancers, daily-wage earners, and other people with irregular income. It
answers one immediate question:

> How much can I safely use before my next payout without taking money away
> from bills, work costs, or my safety cushion?

Unlike a normal bank balance, SuperFinz separates settled money from expected
income and gives every recorded payout a purpose.

## Core product loop — Working

1. The worker describes how they earn, their usual income range, current money,
   work costs, important bills, and main financial priority.
2. SuperFinz calculates a conservative plan using only money already received.
3. The **Today** screen shows one safe-to-use amount and explains what was
   protected first.
4. When a payout arrives, the worker reviews an adaptive five-pocket split.
5. Every saved payout, cost, bill payment, or correction recalculates the plan.
6. The worker can test a slow week or ask the Money Coach what to do next.

## Customer-facing product surfaces

| Area                  | Web     | iOS / Android | What is implemented                                                                                                                                |
| --------------------- | ------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public landing page   | Working | —             | Responsive problem/solution story, product preview, trust principles, CTAs, and embedded product video with 1x/2x playback.                        |
| Public live demo      | Working | —             | Judge-friendly dashboard and insights using a clearly labelled fictional worker, Ravi. No sign-in required.                                        |
| Google sign-in        | Working | Working       | Google OAuth on web; native Google sign-in in the Expo development build.                                                                          |
| Guided onboarding     | Working | Working       | Web setup flow plus a faster conversational mobile setup with typing or voice.                                                                     |
| Today                 | Working | Working       | Safe-to-use amount, planning horizon, protected-money explanation, expected payout range, best next step, and upcoming events.                     |
| Money                 | Working | Working       | Record income/costs, view current balance and weekly figures, inspect recent entries, and plan a payout. Web includes deeper analysis and filters. |
| Plan                  | Working | Working       | Create and manage bills, mark them paid, and test income or expense shocks.                                                                        |
| Safety                | Working | Working       | View five planning pockets, protected days, resilience factors, and privacy boundaries.                                                            |
| Plan Ahead / Insights | Working | Working       | 30-day runway, true take-home, slow-week simulations, and user-initiated summary sharing.                                                          |
| Money Coach           | Working | Working       | Plan-grounded chat, feedback, speech-to-text questions, and spoken answers.                                                                        |
| Settings              | Working | Working       | Planning basics, default split percentages, source status controls, theme, and sign-out.                                                           |

## 1. Fast, guided onboarding — Working

The setup asks only for information that changes the plan:

- preferred name, city, and language;
- type of gig work and main income source;
- working days per week;
- slow, normal, and good weekly take-home income;
- next likely payout date;
- weekly fuel, travel, mobile-data, tool, or supply costs;
- money available now and any existing emergency cushion;
- upcoming bills such as rent, electricity, gas, school fees, or EMI; and
- the worker's main goal: safe spending, bills, work costs, emergency savings,
  or avoiding daily debt.

The mobile flow behaves like a short conversation:

- the user can type or speak an answer;
- the assistant extracts structured fields from natural language;
- every answer is confirmed before moving on;
- assumptions are shown instead of hidden;
- a safe rule-based parser is used if the AI service is unavailable;
- incomplete answers are rejected with a simple example; and
- the draft is stored on the device so progress can be resumed.

At review, the system creates a starter safety buffer, one manual income source,
the user's bills, five pockets, and a goal-based default split. These defaults
can be changed later.

## 2. Safe to use until the next payout — Working

The shared finance engine calculates a single conservative number from:

- current settled balance;
- essential bills due before the next known payout;
- money already assigned to those bills;
- work costs needed to keep earning until that payout;
- the chosen safety buffer and current emergency cushion; and
- the next active source's payout date.

Expected income is displayed as a minimum–maximum range but is **not** added to
spendable money before it settles. If a payout is overdue or has no date, the
engine falls back to a seven-day planning window instead of pretending the
money will arrive.

The result includes:

- safe-to-use amount;
- safe-until date;
- available and protected money;
- bills and work costs protected before the next payout;
- safety-buffer gap;
- next expected payout range and status; and
- a data-freshness timestamp.

## 3. Adaptive payout planning — Working

When income actually arrives, the worker can record it through **Plan a
payout**. SuperFinz then recommends how to divide it across five planning
pockets:

1. bills and essentials;
2. fuel and other work costs;
3. emergency cushion;
4. long-term savings; and
5. flexible spending.

The recommendation changes with the payout amount, due bills, existing funded
amounts, work needs, and cushion depth. Before confirming, the worker sees:

- the amount and percentage for every pocket;
- why the recommendation changed;
- which commitments will be funded;
- safe-to-use before and after the payout; and
- protected days before and after the payout.

The user can keep the adaptive recommendation or customise it in the format
that feels easiest: exact rupee amounts or percentages. The mobile editor
converts between both views, shows both in the preview, and checks that the
five rupee amounts equal the payout or that percentages total 100%.
Confirmation records the settled income, updates the balance, updates all five
pockets, funds selected commitments, advances the source's next payout date,
and stores an audit record in one Convex mutation.

The mobile app writes the returned dashboard into its shared query cache, so a
new payout appears throughout the app immediately. A safely reversible latest
payout can be undone from the mobile money history; related balance, pockets,
bills, and source schedule are restored together.

> SuperFinz plans allocations; it does not transfer or custody real money.

## 4. Money workspace and true take-home — Working

### Common web and mobile features

- Record work, household/essential, and personal/flexible costs.
- Record date, category, payment method, source, and an optional note.
- Separate gross income, work costs, all costs, cash change, and true net income.
- View recent entries newest first.
- Delete normal entries with their balance and pocket effects reversed.
- Keep payout-linked and bill-linked records protected from unsafe editing.
- Refresh all screens after a successful financial action.
- Show loading, empty, success, validation, and retry/error states.

### Additional web money tools

- Add or edit settled manual income and costs.
- Mark an entry as recurring.
- Search the cashbook by category, note, source, or payment method.
- Filter by entry type, income source, and recent date range.
- Load long histories in small batches.
- View a 12-week gross-versus-net chart.
- Compare best earning days and income-source contribution.
- See a warning when work costs become a high share of gross earnings.

### Simplified mobile choice

The mobile app deliberately uses two clear actions: **Add a cost** subtracts
money already spent, while **Plan a payout** adds new earnings and assigns them
in one step. This reduces duplicate payout entries for low-confidence users.

## 5. Income sources and consent — Working with simulated integrations

Users can model income from platform payouts, direct UPI, bank transfer, cash,
or another source, with daily, weekly, fortnightly, monthly, or irregular
frequency.

Implemented controls include:

- add a manual source;
- add a simulated bank or platform source;
- store an expected payout range and next likely payout date;
- label every source as active, paused, error, or revoked;
- pause, resume, refresh, or revoke sources independently;
- store declared data types, purpose, consent dates, receipt ID, and last sync;
  and
- exclude paused or revoked sources from active forecasts.

**Prototype boundary:** bank, UPI, and gig-platform connections are simulators.
No Account Aggregator, bank, or platform account is contacted. The current
`FILE_IMPORT` option is represented in the source model and UI, but a complete
file-upload/import pipeline is not implemented.

## 6. Bills and commitments — Working

- Add rent, utilities, gas, education fees, EMI, or any custom commitment.
- Set amount, due date, recurrence, essential/flexible priority, and autopay
  metadata.
- Support weekly, fortnightly, monthly, quarterly, yearly, and one-time items.
- Track how much of each bill is already funded.
- Update the amount or due date.
- Mark one bill paid without marking every bill paid.
- Record the corresponding payment and update the balance/pocket.
- Advance recurring bills to their next due date.
- Delete a commitment with safe reconciliation of related planning state.
- Surface upcoming commitments in the Today timeline and scenario engine.

**Prototype boundary:** marking a bill paid records it in SuperFinz; it does not
send a real payment or enable bank autopay.

## 7. Slow-week protection and 30-day insights — Working

The deterministic scenario engine lets a worker test:

- lower or higher income;
- a delayed payout;
- a surprise repair or other cost;
- days away from work; and
- a rise or fall in work costs.

Every scenario recalculates:

- safe-to-use money;
- low and high 30-day income forecasts;
- lowest projected balance;
- protected days;
- bills that become at risk;
- the extra earning target;
- the target per remaining workday; and
- practical non-credit actions to try first.

Plan Ahead also shows gross earnings, work costs, true take-home, the amount
kept from every ₹100 earned, forecast confidence, and a private summary that is
shared only through the device/browser share action chosen by the user.

## 8. Resilience Passport and responsible support — Working / Prototype

The Safety area shows:

- the amounts held in all five planning pockets;
- progress toward pocket targets;
- current emergency-cushion days;
- an explainable resilience score and status; and
- individual factors with evidence and one improvement action.

The score uses visible planning inputs such as commitment coverage, cushion
depth, income variability/source concentration, and work-cost control. It is
clearly labelled as a planning indicator, **not** a bureau score or automatic
lending decision. The product states that it does not use contacts, messages,
call logs, photos, social graphs, or protected traits.

For an urgent work cost, the web product calculates the remaining gap and shows
non-credit steps first: move a flexible bill, set a short earning target, use
only the necessary cushion, and check available support.

**Prototype boundary:** the regulated credit-partner panel and example loan
terms are a labelled placeholder. The application button is disabled. No loan
application, credit check, underwriting, disbursement, or lender integration is
implemented.

## 9. Plan-grounded Money Coach — Working with graceful fallback

The coach can answer questions about safe spending, late payouts, emergency
cushions, the Resilience Passport, repairs, and responsible borrowing. It uses
the logged-in worker's current calculated dashboard as context.

- Core financial numbers always come from the deterministic shared engine.
- OpenAI can turn those verified numbers into a short, plain-language answer.
- A deterministic answer is returned if the language model is unavailable.
- Markdown formatting is stripped for clean display and speech.
- Users can copy/share answers and submit helpful/not-helpful feedback.
- The coach cannot move money, approve credit, or invent a balance.

Voice support includes:

- user-initiated recordings of up to 30 seconds;
- authenticated audio upload with type and size validation;
- OpenAI speech-to-text when configured;
- natural OpenAI text-to-speech when configured;
- browser or device speech fallback for reading answers aloud; and
- language/pronunciation handling for English, Hindi/Hinglish, Tamil/Tanglish,
  Telugu/Telugu-English, Kannada/Kannada-English, and
  Malayalam/Malayalam-English.

Audio is used for the active request and is not stored in the SuperFinz Convex
schema.

## 10. Personalisation, usability, and accessibility — Working

- The Today introduction and focus change with the goal selected at onboarding.
- Plain-language labels replace internal enum or banking terms.
- One primary decision is emphasized on each mobile screen.
- Forms open in focused sheets/modals instead of crowding the main page.
- Mobile screens provide visible top-left back navigation on subpages.
- Financial actions include confirmation, validation, progress, success, error,
  retry, and safe-delete states where relevant.
- Controls use accessible names, roles, states, live regions, and large touch
  targets.
- Charts include text/table equivalents for screen readers on web.
- Reduced-motion system settings are respected in mobile sheet animation.
- Light/dark theme switching is implemented on web and mobile, with the choice
  stored locally.
- Responsive web navigation and layouts support small and large screens.

**Backend-ready:** the database and API also store larger-text,
higher-contrast, reduced-motion, channel, quiet-hour, reminder-window, and alert
category preferences. A complete customer preference screen and actual push,
SMS, or WhatsApp delivery are not wired into the current UI.

## 11. Smart alerts — Backend-ready

The shared engine and authenticated API can derive up to 20 prioritised in-app
alerts for:

- expected or delayed payouts;
- bills due soon;
- low safe-to-use money;
- a forecast crossing the safety floor;
- income falling below the normal week;
- a high work-cost ratio;
- the next cushion-building step;
- completed pocket targets;
- source refresh/consent problems; and
- a weak resilience factor.

Notification state supports read, unread, dismiss, and snooze. Preferences can
turn categories on or off and configure quiet hours/reminder lead time.

**Current boundary:** these APIs and database records exist, but there is no
complete notification centre and no live push, SMS, or WhatsApp sender.

## 12. Partner outcome metrics — Backend-ready

A protected partner endpoint aggregates:

- active and weekly-active workers;
- connected sources and consent coverage;
- commitment coverage and average protected days;
- predicted shortfalls and non-credit resolutions;
- credit avoided;
- work-cost ratio;
- payout count/value;
- safe checks per worker;
- forecast accuracy when data is available;
- recommended actions completed; and
- six-week gross, work-cost, net-income, and payout-allocation trends.

The endpoint uses an API key, supports date/city/work-type filters, disables
public caching, and refuses to report cohorts smaller than 10 workers. Policy
metadata explicitly declares aggregation-only reporting, no worker-level
surveillance, no punitive scoring, and no credit-promotion notifications.

**Current boundary:** this is an API response, not a finished partner dashboard
screen.

## 13. Authentication and session security — Working

### Web

- Google OAuth through Auth.js/NextAuth.
- JWT-based web session.
- User records are created or updated in Convex after verified Google sign-in.
- Protected routes redirect signed-out or not-yet-onboarded users.

### Mobile

- Native Google ID token is verified by the server for the configured audience.
- Access tokens expire after 15 minutes.
- Random refresh tokens last up to 30 days and rotate on every refresh.
- Only SHA-256 hashes of refresh tokens are stored in Convex.
- Every request verifies the token, database session, user, expiry, and
  revocation state.
- Tokens are stored with Expo SecureStore.
- A failed refresh clears invalid credentials.
- Sign-out revokes the server session, clears device tokens, signs out of
  Google, and removes cached private dashboard data.

All main gig API routes require either a valid web session or mobile bearer
token. Inputs are validated before database mutation.

## 14. Backend and data layer — Working

Convex is the source of truth for the current application. The gig product uses
indexed tables for:

- users and device sessions;
- worker profiles;
- income sources and consent metadata;
- cash entries;
- bills/commitments;
- five planning pockets;
- default split rules;
- payout split audit records;
- customer preferences;
- notification state; and
- measurable outcome events.

Key consistency behaviour is implemented inside Convex mutations:

- balance and pocket updates happen with the financial record;
- a payout split updates all affected records together;
- deletion reverses the corresponding balance/pocket effect;
- paid recurring commitments roll forward safely;
- users can only mutate records that belong to them; and
- server access to Convex gig functions requires a private server key.

A migration script and migration mutations are included for moving the earlier
Prisma data model into Convex.

## 15. Shared deterministic finance engine — Working and tested

One TypeScript package is shared by the web application, mobile application,
API layer, demo, and tests. It contains:

- request schemas and financial limits;
- safe-to-use calculation;
- payout projection and adaptive recommendation;
- cash-flow timeline and 30-day forecast;
- slow-week scenario simulation;
- true take-home insights;
- resilience scoring and recommendations;
- alert derivation;
- quick-onboarding defaults and validation; and
- public data-transfer types.

Automated tests cover safe-spend edge cases, delayed/unknown payouts, work
costs, adaptive splits, scenario risk, insights, alerts, onboarding defaults,
input validation, core finance invariants, coach language detection, and demo
consistency.

## 16. Complete API inventory

### Current SuperFinz Gig APIs

- `GET /api/gig/dashboard` — complete calculated dashboard.
- `POST /api/gig/onboarding` — persist the worker's initial plan.
- `POST /api/gig/onboarding/assistant` — turn a natural-language setup answer
  into reviewed structured fields, with rule-based fallback.
- `GET/POST /api/gig/entries` — list and create money entries.
- `PATCH/DELETE /api/gig/entries/:id` — correct or safely remove an entry.
- `GET/POST/PATCH/DELETE /api/gig/commitments` — manage and pay bills.
- `POST /api/gig/split` — apply an adaptive or custom settled payout split and
  return the newly calculated dashboard.
- `GET/POST/PATCH /api/gig/sources` — list, add, refresh, pause, resume, or
  revoke an income source.
- `GET/PATCH /api/gig/settings` — update identity, safety targets, and split
  rules.
- `GET/PATCH /api/gig/preferences` — read or update accessibility and alert
  preferences.
- `GET/PATCH /api/gig/notifications` — derive alerts and update their state.
- `POST /api/gig/outcomes` — record privacy-safe outcome events.
- `POST /api/gig/coach` — plan-grounded text coaching.
- `POST /api/gig/coach/transcribe` — authenticated speech-to-text.
- `POST /api/gig/coach/speak` — authenticated natural speech generation.
- `GET /api/partner/metrics` — minimum-cohort aggregate partner outcomes.

### Auth APIs

- Auth.js Google callback route for web.
- `POST /api/mobile-auth/google` — verify Google and create a device session.
- `POST /api/mobile-auth/refresh` — rotate mobile credentials.
- `POST /api/mobile-auth/logout` — revoke the mobile session.
- `GET /api/auth/me` — return the current authenticated user.

### Legacy/supporting APIs not surfaced in the current gig-worker UI

The repository also retains working generic personal-finance APIs for profiles,
transactions, category budgets, savings goals, goal allocations, spending
heatmaps, a Groq-backed generic chat fallback, purchase checks, and finance
news with mock fallback. Their Convex tables and migration support remain in
the codebase, but they are not claimed as features of the present SuperFinz Gig
dashboard.

## 17. Build and delivery foundation — Working

- Next.js 16 responsive web application.
- Expo / React Native application targeting iOS and Android.
- EAS development, internal preview, and production build profiles.
- React Query cache and refetch flow on mobile.
- Zod validation shared across clients and server routes.
- Strict TypeScript configuration.
- Web app manifest, favicons, app icons, and mobile brand assets.
- Convex migration and smoke-test scripts.
- Vercel-oriented web build and environment configuration.

## Honest prototype boundaries

The following are **not** live integrations and should not be described as
production banking capabilities:

- no real bank, UPI, Account Aggregator, or gig-platform data connection;
- no automatic money transfer between real accounts;
- no custody or locking of customer funds;
- no real bill payment or autopay instruction;
- no real credit bureau check, underwriting, lender comparison, or loan
  application;
- no production push, SMS, or WhatsApp delivery;
- no completed file-import transaction parser; and
- no finished visual partner analytics portal.

What is real today is the end-to-end planning system: authenticated customer
data, Convex persistence, explainable calculations, payout/bill/cost workflows,
cross-screen updates, scenario simulation, voice-capable coaching, and a
clearly separated public demo.
