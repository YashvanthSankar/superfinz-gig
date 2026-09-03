# SuperFinz — Full Frontend Implementation Prompt

Copy everything below the divider into Codex, Claude Code, Cursor, Lovable, Bolt, or another coding agent. The prompt is designed specifically for the existing `superfinz-gig` repository.

---

## Role

Act as a senior product designer, fintech UX specialist, frontend architect, and Next.js engineer. Redesign and implement the existing repository as a polished, functional hackathon prototype named **SuperFinz**.

Build the complete frontend—not just a landing page or a collection of static cards. It must feel like one coherent banking dashboard that a gig or informal worker could use every day.

## Objective

Create a one-stop financial-resilience dashboard for people whose income changes from day to day.

- **Product name:** SuperFinz
- **Tagline:** Turn irregular earnings into a predictable money plan.
- **Positioning:** A salary layer for people without salaries.
- **Hackathon problem statement:** Financial Resilience for Gig and Informal Workers
- **Core question answered every day:** “How much can I safely use today without risking my essential commitments?”

SuperFinz should help workers:

1. See income from multiple formal and informal sources.
2. Understand gross income, work costs, and true net income.
3. Know a conservative safe-to-spend amount.
4. Automatically plan every payout across essential needs, work costs, savings, emergencies, and flexible spending.
5. Build a financial cushion despite irregular cash flow.
6. Understand an explainable financial-resilience score.
7. Receive useful interventions before taking debt.
8. Access responsible credit only when necessary and with complete cost transparency.

## Non-negotiable product rules

- Use **SuperFinz** everywhere. Never use “SuperFinz Gig” as the visible product name.
- Present this as the current product. Do not discuss the previous app, a redesign, migration, or pivot.
- Do not position the product for students, salaried Gen-Z users, retirement planning, FIRE, stock investing, market news, generic finance calculators, crypto, or “roasting” expenses.
- Do not reduce the product to an expense tracker. Its core is irregular-income planning and resilience.
- Never imply that SuperFinz itself is a bank or lender.
- Any bank connection, Account Aggregator connection, payment rail, insurance integration, or loan flow that is not real must be clearly labeled **Prototype data** or **Simulated partner offer**.
- Treat forecasts as estimates and display ranges. Never promise future earnings.
- Never let AI invent balances, calculate official financial figures, or approve credit. Use deterministic application logic for every number; AI may only explain those results in plain language.
- Do not use manipulative loan messaging, countdown timers, preselected borrowing, hidden charges, shame, or dark patterns.
- Show complete borrowing cost before confirmation: principal, APR, fees, total repayment, schedule, cooling-off information, grievance path, and regulated partner identity.

## Existing repository and technology constraints

Work inside the existing repository. Inspect it before changing anything.

1. Read the repository structure and `package.json`.
2. This repository uses a newer Next.js version with breaking changes. Before writing application code, read the relevant guides in `node_modules/next/dist/docs/` for routing, layouts, server/client components, metadata, fonts, data handling, and any API you touch.
3. Reuse installed dependencies and existing infrastructure where appropriate.
4. Preserve working authentication, database, and configuration code unless a change is necessary for this product.
5. Do not overwrite unrelated user changes.
6. Remove legacy product pages from the visible navigation. Reuse useful primitives and utilities only if they fit the new experience.

Expected stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives where installed
- Lucide icons
- Recharts for charts
- Motion for restrained interaction animation
- Existing authentication and Prisma infrastructure where practical

Architecture rules:

- Use Server Components by default.
- Use Client Components only for charts, forms, sheets, dialogs, sliders, filters, simulations, chat interactions, and other genuinely interactive sections.
- Keep demo data in typed fixtures behind a small data-adapter layer, so it can later be replaced with real APIs.
- The primary demo must work without external accounts or live financial services.
- Do not expose secrets or require unavailable environment variables to view the prototype.

## Required routes

Implement these routes:

```text
/
/login
/onboarding
/dashboard
/dashboard/income
/dashboard/plan
/dashboard/safety
/dashboard/coach
/dashboard/settings
```

Route meaning:

- `/` — public product story and hackathon landing page
- `/login` — sign-in and instant demo access
- `/onboarding` — five-step irregular-income setup
- `/dashboard` — Today dashboard
- `/dashboard/income` — income sources, trends, and cashbook
- `/dashboard/plan` — commitments, forecast, and scenarios
- `/dashboard/safety` — pockets, resilience, protection, and responsible credit
- `/dashboard/coach` — contextual financial coach
- `/dashboard/settings` — profile, rules, consent, notifications, and accessibility

## Global application shell

### Desktop

Use a persistent left sidebar with:

- SuperFinz wordmark
- Today
- Income
- Plan
- Safety
- Coach
- A compact “Prototype data” status near the bottom
- User profile and Settings at the bottom
- A prominent but not oversized **Add entry** action

The content area should have a readable maximum width, spacious margins, and a responsive bento-grid layout.

### Mobile

Use:

- Compact top bar with product name, notification button, and avatar
- Five-item bottom navigation: Today, Income, Plan, Safety, Coach
- Safe-area padding for devices with home indicators
- Floating or sticky Add Entry action where appropriate
- No horizontal page scrolling

## Visual design system

Create a confident, friendly financial interface: warm, grounded, modern, and understandable. It should look credible enough for a bank partnership without feeling like a corporate banking portal.

### Color tokens

Use semantic design tokens rather than raw hex values throughout page components.

```text
Canvas / warm cream:       #F7F1E5
Secondary surface:         #EDE4D1
Primary ink:               #1A1612
Secondary text:            #493F35
Brand orange:              #F4511E
Soft orange:               #FFDCC8
Positive green:            #087443
Soft green:                #D5EDDE
Warning amber:             #A87500
Soft warning:              #F4E4B7
Destructive red:           #B52B20
White elevated surface:    #FFFDFC
Border:                    rgba(26, 22, 18, 0.18)
```

Check every foreground/background pair for WCAG AA contrast.

### Typography

- Use Geist or the repository’s established sans-serif for body and interface text.
- Use Gatwick or an available expressive display face only for major marketing headings.
- Body text must be at least 16px on mobile.
- Supporting labels should generally be at least 14px.
- Use tabular numerals for money, percentages, dates, and chart axes.
- Use the Indian numbering system and rupee formatting consistently: `₹6,800`, `₹3,200`, `18% APR`.

### Shape and composition

- Use a bento-grid system for dashboards and a single-column stack on small screens.
- Prefer square or lightly rounded cards, not excessive pill-shaped containers.
- Use strong 1–2px borders and small deliberate shadows.
- Avoid glassmorphism, neon gradients, excessive blur, or generic blue fintech styling.
- Use Lucide icons. Do not use emoji as interface icons.
- Keep data-dense screens calm through hierarchy and whitespace.
- Use orange for action and emphasis, green for protected/healthy states, amber for attention, and red only for destructive or critical states.

### Motion

- Use subtle 150–250ms transitions.
- Animate state changes, sheets, tab indicators, and number updates only when it improves comprehension.
- Avoid scroll-jacking, continuous decorative motion, or long entrance sequences.
- Respect `prefers-reduced-motion`.

## Public landing page

The landing page must explain the full product in under two minutes and support a hackathon demo.

### Header

- SuperFinz wordmark
- How it works
- Product
- Responsible banking
- Sign in
- Primary CTA: **Try the demo**

### Hero

Use this content direction:

- Eyebrow: **BANKING FOR IRREGULAR INCOMES**
- Heading: **Your earnings change. Your financial stability shouldn’t.**
- Supporting copy: “SuperFinz turns scattered payouts, cash earnings, and recurring commitments into one clear plan—so gig workers know what is safe to use, what must be protected, and what to do next.”
- Primary CTA: **Open demo dashboard**
- Secondary CTA: **See how it works**
- Trust note: “Hackathon prototype. No real bank account or loan is created.”

Beside the copy, show a realistic dashboard preview using the canonical demo data:

- Available balance: ₹6,800
- Safe to spend: ₹620 until Friday
- Expected next payout: ₹2,100–₹3,400
- Cushion: 12 protected days
- Resilience score: 68 / 100

### Problem section

Explain the real problem with three concise cards:

- Income arrives at different times and through different channels.
- Fixed commitments do not wait for a good earning week.
- Traditional credit decisions often cannot see informal consistency or platform income.

### Core insight

Large statement:

> Gig workers do not need another monthly budget. They need a daily salary layer built around uncertain income.

### Five product layers

Create an anchored product story using:

1. **Income Pulse** — unifies platform payouts, UPI receipts, and cash entries.
2. **Safe-to-Spend** — protects upcoming essentials before showing spendable money.
3. **Smart Pockets** — gives every payout a job as soon as it arrives.
4. **Resilience Passport** — makes financial progress visible without judging income size.
5. **Responsible Support** — recommends non-credit actions first, then transparent partner credit only when needed.

### How it works

Show a four-step flow:

1. Connect or add income sources.
2. Add essential commitments and work costs.
3. Review the forecast and Smart Split rule.
4. Use the Today dashboard to make safer decisions.

### Responsible banking section

Explain:

- Consent-based data use
- Revocable connections
- Explainable calculations
- Range-based forecasts
- Non-credit interventions first
- Transparent regulated-partner offers

### Final CTA and footer

- Heading: **Make every payout feel more predictable.**
- CTA: **Explore SuperFinz**
- Footer links: Product, Accessibility, Data and consent, Responsible credit, Contact
- Display “Prototype for Innovation Unbound” and an explicit simulation disclaimer.

## Login page

Create a compact, polished login experience:

- SuperFinz wordmark and tagline
- Continue with Google, if existing auth supports it
- Primary demo action: **Continue as Ravi**
- Prototype disclosure
- Three benefits: Know today’s safe amount, protect essentials, prepare for low-income weeks
- Clear loading and authentication error states

Do not block judges behind real OAuth. Demo access must always be available.

## Onboarding

Build a five-step, resumable onboarding flow with a visible progress indicator, Back/Continue controls, inline validation, and a final review.

### Step 1 — Work profile

Collect:

- Preferred name
- City
- Preferred language
- Work types: delivery, ride-hailing, home services, freelance, street vending, construction/daily wage, domestic work, other
- Primary financial priority: stable weekly spending, emergency cushion, upcoming bills, work expenses, debt avoidance

### Step 2 — Income sources

Allow multiple sources:

- Platform payout
- Direct UPI payment
- Bank transfer
- Cash income
- Other

For each source capture:

- Source name
- Typical amount or range
- Daily, weekly, fortnightly, monthly, or irregular frequency
- Usual payout day if applicable
- Connection mode: simulated bank connection, CSV/import, or manual entry

Display consent and prototype labels wherever a source appears connected.

### Step 3 — Income pattern

Ask for:

- Low-week earnings
- Typical-week earnings
- Good-week earnings
- Typical earning days
- Known seasonal or weekly pattern
- Usual platform deductions
- Recurring work costs

Explain that these values create an estimate, not a guarantee.

### Step 4 — Commitments

Allow the user to add:

- Rent
- Groceries
- Fuel
- Vehicle or equipment maintenance
- Phone/data
- Utilities
- EMI
- Insurance
- Family contribution
- Health
- Custom commitment

Each commitment needs amount, next due date, recurrence, priority, and autopay status.

### Step 5 — Protection plan

Configure a Smart Split rule with editable percentages:

- Essentials
- Work costs
- Emergency cushion
- Long-term savings
- Flexible spending

Requirements:

- Percentages must total 100%.
- Show a live rupee preview for a sample payout.
- Explain every bucket in plain language.
- Do not silently move or claim to move money.
- Require explicit confirmation before enabling a simulated automatic split.

### Final review

Summarize:

- Income sources
- Income range
- Commitments
- Split rule
- What SuperFinz will calculate
- What is simulated

Primary CTA: **Build my money plan**

## Today dashboard

The Today page is the product’s main screen. The user should understand their situation in five seconds.

### Header

- Greeting: “Good morning, Ravi”
- Context: “Thursday, 3 September” or current demo date
- Prototype data badge
- Notification button
- Add entry button

### Safe-to-Spend hero

Make this the strongest card on the page.

- Label: **Safe to spend**
- Value: **₹620**
- Period: **until Friday**
- Available balance: ₹6,800
- Expected payout: ₹2,100–₹3,400
- Essentials due before payout: ₹4,000
- Protected pockets: ₹2,280
- Status: **Stable, but keep ₹4,000 protected for rent**
- Action: **How this is calculated**

The calculation drawer must explain the formula using the currently displayed values. It should distinguish current balance, protected money, near-term commitments, and conservative buffer. Do not hide important caveats behind an info icon.

### Money timeline

Show the next five to seven events on a horizontal desktop timeline and vertical mobile timeline:

- Today — fuel, ₹350 estimated
- Friday — Swiggy payout, ₹2,100–₹3,400 expected
- Saturday — mobile bill, ₹299 due
- Monday — family transfer, ₹1,000 planned
- 5th — rent, ₹4,000 due

Use event types, icons, and text labels rather than color alone.

### 30-day cash-flow forecast

Use an accessible chart with:

- Historical balance as a solid line
- Expected future balance as a dashed line
- Confidence range as a low-opacity band
- Safety floor as a labeled horizontal reference line
- Commitment markers
- A visible legend
- Useful tooltips
- A text summary below the chart for screen-reader and non-visual comprehension

Never show forecast values as exact certainties.

### Cushion card

Show:

- Current emergency cushion: ₹6,000
- Protected days: 12
- Goal: 30 protected days
- Progress bar with a visible numeric label
- Suggested action: “Protect ₹160 from the next payout to reach 13 days sooner.”

### Latest payout split

For the latest ₹3,200 payout, show:

- Essentials: ₹1,760
- Work costs: ₹480
- Emergency cushion: ₹320
- Long-term savings: ₹160
- Flexible spending: ₹480

Clearly label these as allocated or planned amounts. Do not imply a real transfer unless the user explicitly triggers a simulated transfer flow.

### Resilience snapshot

Show:

- Score: 68 / 100
- Status: Building stability
- Positive factor: “You protected essential commitments in 4 of the last 5 weeks.”
- Risk factor: “One income source provides most of this week’s earnings.”
- Action: **View my resilience passport**

### One recommended action

Show a single prioritized recommendation—not a noisy task list.

Example:

> Friday’s payout may arrive one day late. Move the ₹299 mobile bill to Monday or protect ₹300 today.

Actions: **Protect ₹300** and **See alternatives**

### Quick actions

- Add income
- Add expense
- Split a payout
- Review commitments

## Smart Split interaction

Build Smart Split as a reusable sheet or dialog.

Input:

- Payout source
- Amount
- Received date
- Optional note

Allocation controls:

- Essentials
- Work costs
- Emergency cushion
- Long-term savings
- Flexible spending

Requirements:

- Support linked sliders and numeric inputs.
- Keep percentages and rupee amounts synchronized.
- Validate that allocation totals 100% and equals the payout amount after rounding.
- Show the before/after impact on safe-to-spend and protected days.
- Use an explicit confirmation screen.
- If no real money movement exists, say “Save planned allocation,” not “Transfer money.”
- Include success, validation-error, and cancel states.

## Income page

Use three tabs: **Overview**, **Cashbook**, and **Sources**.

### Overview

Show:

- This week gross income: ₹5,950
- Work costs: ₹1,100
- True net income: ₹4,850
- Change from typical week
- Number of active sources
- Next expected payout range

Include a 12-week chart with gross and net income. Use variation, not a perfectly smooth line. Include one delayed payout and one repair-cost spike in the demo history.

Show source contribution cards:

- Swiggy
- Rapido
- Direct UPI tips
- Cash/manual income if used

Each source card should show total, share of income, payout timing, status, and recent consistency.

### Cashbook

Provide an income-and-expense ledger, not merely a list of expenses.

Entry types:

- Income
- Work expense
- Personal essential
- Flexible expense
- Transfer/allocation

Filters:

- Date range
- Entry type
- Source
- Category
- Search

Each row/card shows date, title, source/category, amount, status, and edit action.

The Add Entry flow should support:

- Income or expense
- Amount
- Date
- Source
- Category
- Cash/UPI/bank/platform method
- Recurring toggle
- Notes
- Work-related toggle where relevant

### Sources

Allow the user to:

- View all connected and manual sources
- Add a manual source
- Start a simulated connection
- See last sync time
- Pause or revoke data access
- Read what data is used and why

Do not show a connected state without a consent record or prototype label.

## Plan page

The Plan page turns irregular income into a forward-looking plan.

### Forecast summary

Show:

- Expected 30-day income range
- Committed outflow
- Estimated work costs
- Lowest projected balance range
- Number of protected days
- Confidence level and why

Reuse the accessible forecast chart at a larger size.

### Commitments

Group commitments into:

- Due soon
- This month
- Later

Each commitment needs:

- Name
- Amount
- Due date
- Priority
- Funding status
- Pocket/source
- Autopay status
- Mark paid, edit, reschedule, and delete actions

Distinguish essential and flexible commitments in text, not just color.

### Scenario simulator

Allow the user to compare practical scenarios:

- What if income is 20% lower next week?
- What if Friday’s payout is delayed by two days?
- What if vehicle repair costs ₹2,500?
- What if I take two days off?

Output:

- Updated safe-to-spend
- Updated lowest balance range
- Commitments at risk
- Cushion days after the event
- Recommended action

Keep this deterministic and label assumptions. Include Reset and Compare controls.

### Earning target

Provide a practical target:

> Earn approximately ₹1,850 net by Sunday to fund rent, fuel, and the mobile bill while keeping a ₹600 safety buffer.

Show the assumptions and allow the user to switch between conservative, typical, and optimistic income cases.

## Safety page

Use four tabs: **Pockets**, **Resilience**, **Protection**, and **Responsible Credit**.

### Pockets

Show cards for:

- Essentials
- Work costs
- Emergency cushion
- Long-term savings
- Flexible spending

Each card needs current amount, target, purpose, progress, recent activity, and add/withdraw-plan actions.

Also show the current Smart Split rule and an Edit Rule action.

### Resilience Passport

Show an explainable score of 68 / 100. Make it clear this is a planning indicator, not a bureau credit score.

Factors:

- Income consistency
- Source diversity
- Commitment coverage
- Cushion depth
- Work-cost control
- Repayment reliability, only when actual data exists

For each factor show:

- Current status
- Contribution to score
- Evidence
- A user-controllable improvement action

Include a “Why this score?” drawer with the calculation rules and last-updated time. Never use protected traits or opaque behavioral surveillance.

### Protection center

Provide useful, clearly scoped support:

- Emergency cushion guidance
- Benefits and scheme discovery, such as e-Shram information
- Basic insurance-awareness checklist
- Nominee and emergency-contact reminder
- Account and fraud-safety checklist

Label external schemes and insurance content as informational. Do not claim enrollment or coverage unless implemented.

### Responsible Credit

First show the intervention ladder:

1. Adjust or reschedule a flexible commitment.
2. Use available flexible funds.
3. Use only the necessary part of the emergency cushion.
4. Set a short earning target.
5. Consider a regulated partner offer only for the remaining verified gap.

Example need card:

- Upcoming verified shortfall: ₹2,500
- Reason: vehicle repair required to continue earning
- Recommended non-credit actions already considered

Example simulated partner offer:

- Amount: ₹2,500
- APR: 18%
- Processing fee: ₹50
- Total repayment: ₹2,620
- Schedule: 8 weekly payments of ₹327.50
- Regulated partner: clearly marked placeholder/simulated partner

Include:

- View key facts
- Compare with no-credit plan
- Not now
- Continue to simulated eligibility check
- Cooling-off information
- Grievance route
- Data used for the eligibility simulation

Never show “pre-approved,” urgency, celebratory debt language, or an enabled final-borrow action without consent and full disclosure.

## Coach page

Build a contextual, multilingual-ready coach—not a generic chatbot.

Suggested prompts:

- How much can I safely spend today?
- Can I afford to take Sunday off?
- What happens if Friday’s payout is late?
- How can I reach 15 cushion days?
- Explain my resilience score.
- Do I need credit for this repair?

Response rules:

- Start with a direct answer.
- Cite the exact dashboard figures used.
- Separate known facts from estimates.
- State assumptions.
- Give no more than three practical next steps.
- Provide a button or deep link for any proposed action.
- Do not shame, diagnose, promise returns, or make eligibility decisions.
- For credit questions, show non-credit options first.

Example response:

> Yes, but keep the day low-cost. Your current safe-to-spend is ₹620 until Friday. Taking Sunday off reduces next week’s expected income by about ₹700–₹950, so your rent remains funded but your cushion goal may be delayed by 3–4 days.

Response actions:

- Simulate Sunday off
- Protect ₹300
- View assumptions

Include loading, empty, error, retry, copy, feedback, and clear-chat states. Add a note that AI explanations can be wrong and that dashboard calculations remain the source of truth.

## Settings page

Sections:

- Profile and work preferences
- Income pattern preferences
- Smart Split default rule
- Notifications and reminders
- Connections and consent
- Language and accessibility
- Security
- Account and data controls

Connection cards must expose data type, purpose, last sync, consent date, and revoke control.

Accessibility preferences should include reduced motion, larger text, higher contrast where feasible, and preferred language.

## Required shared components

Create reusable, typed components rather than duplicating markup:

```text
AppShell
Sidebar
MobileTopBar
MobileBottomNav
PageHeader
PrototypeDataBadge
MetricCard
SafeToSpendCard
CalculationDrawer
ForecastChart
ForecastTextSummary
MoneyTimeline
MoneyTimelineEvent
CushionCard
PocketCard
PocketProgress
SmartSplitSheet
SplitAllocationRow
ResilienceScoreCard
ResilienceFactorRow
IncomeSourceCard
CashbookTable
CashbookMobileList
AddEntryDialog
CommitmentCard
ScenarioSimulator
EarningTargetCard
CreditNeedCard
CreditOfferCard
KeyFactsDrawer
CoachChat
CoachSuggestionChip
ConsentCard
EmptyState
ErrorState
SkeletonState
ConfirmationDialog
Toast
AccessibleTabs
RangeToggle
```

Do not force abstraction where it harms readability, but ensure core financial patterns are consistent across pages.

## Canonical demo persona and data

Use one internally consistent demo persona everywhere.

### Persona

- Name: Ravi Kumar
- Age: 27
- City: Chennai
- Work: delivery partner with occasional ride-hailing work
- Income sources: Swiggy, Rapido, direct UPI tips
- Preferred language: English, with architecture ready for Tamil localization

### Current state

- Available balance: ₹6,800
- Safe-to-spend: ₹620 until Friday
- Expected next payout: ₹2,100–₹3,400
- This week gross income: ₹5,950
- Work costs: ₹1,100
- This week net income: ₹4,850
- Emergency cushion: ₹6,000
- Protected days: 12
- Cushion target: 30 days
- Resilience score: 68 / 100

### Upcoming commitments

- Fuel: ₹700 total weekly plan
- Mobile bill: ₹299
- Rent: ₹4,000
- Family contribution: ₹1,000
- Maintenance reserve: ₹500

### Latest payout

Payout: ₹3,200

- Essentials: ₹1,760
- Work costs: ₹480
- Emergency cushion: ₹320
- Long-term savings: ₹160
- Flexible spending: ₹480

These allocations must total ₹3,200.

### History

Create 12 weeks of plausible demo history with:

- Different income each week
- Weekday/weekend variation
- One delayed platform payout
- One vehicle-repair expense spike
- A gradual but imperfect increase in cushion savings
- Source diversity changes

All cards, charts, tables, coach answers, formulas, and scenarios must derive from this shared dataset. Do not hardcode contradictory values separately in multiple components.

## Responsive behavior

Test at minimum:

- 375px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop

Rules:

- Dashboard bento grids collapse into a logical single column.
- Primary information appears before secondary analytics on mobile.
- Tables become readable card lists or provide a controlled scroll region with clear affordance.
- Dialogs become bottom sheets where appropriate.
- Charts retain labels and summaries without clipping.
- Sticky navigation never covers form buttons or content.
- Money values wrap or scale gracefully.
- No page-level horizontal overflow.

## Accessibility requirements

Target WCAG 2.2 AA.

- Maintain at least 4.5:1 text contrast where required.
- Use a logical heading hierarchy.
- Use real form labels; do not rely on placeholders.
- Show inline errors and connect them using `aria-describedby`.
- Make all controls keyboard accessible.
- Provide a strong `:focus-visible` state.
- Support Escape and focus return for dialogs/sheets.
- Use appropriate dialog, tab, menu, and live-region semantics.
- Make interactive targets at least 44×44px on touch screens.
- Never communicate state by color alone.
- Add text summaries for charts and meaningful accessible names for icon-only controls.
- Respect reduced-motion preferences.
- Do not auto-advance multi-step forms after a selection.

## Loading, empty, error, and offline states

Design these intentionally for every data-driven page.

### Loading

- Use dimensionally stable skeletons.
- Reserve chart space to avoid layout shift.
- Disable duplicate form submissions.

### Empty

Examples:

- No income sources: explain how to add a manual source.
- No cashbook entries: offer Add income and Add expense.
- No commitments: explain why adding the next bill improves safe-to-spend.
- No coach history: show useful suggested questions.

### Error

- Use human-readable messages.
- Preserve form data.
- Provide Retry where relevant.
- Never expose raw stack traces.

### Offline/demo resilience

- Keep canonical demo data available locally.
- Show a subtle “Using last available demo data” message if a simulated refresh fails.

## Required interactions

All of the following must work:

- Desktop and mobile navigation
- Tabs and filters
- Add, edit, and delete cashbook entry flows
- Add and edit commitment flows
- Smart Split percentages and validation
- Calculation details drawer
- Forecast tooltips and text summary
- Mark commitment paid
- Scenario selection, comparison, and reset
- Pocket contribution planning
- Simulated source connection and consent revocation
- Responsible-credit comparison and key facts
- Coach suggestions and messages
- Toasts and inline errors
- Keyboard interaction and focus management

Do not use native `alert()` or `confirm()` for product interactions.

## Data architecture and calculations

Define strict TypeScript types for at least:

```text
WorkerProfile
IncomeSource
LedgerEntry
Commitment
Pocket
AllocationRule
ForecastPoint
ForecastSummary
ResilienceFactor
ResilienceScore
CreditOffer
ConsentRecord
CoachMessage
Notification
```

Organize code by responsibility:

```text
domain types
demo fixtures
calculation functions
formatting utilities
data adapters
shared UI components
feature components
route pages
```

Implement pure, testable functions for:

- Indian currency formatting
- Gross income
- Work costs
- True net income
- Upcoming essential commitments
- Protected money
- Cushion days
- Safe-to-spend
- Smart Split allocation and rounding
- Forecast ranges
- Resilience factor scoring
- Credit repayment totals

Calculation principles:

- Work from the ledger and commitments rather than duplicate display constants.
- Use integer paise internally if practical to avoid floating-point money errors.
- Keep forecast assumptions explicit.
- Use conservative values for near-term safe-to-spend.
- Never allow an AI response to override calculated values.

## Performance and implementation quality

- Avoid unnecessary Client Components.
- Avoid duplicated financial calculations.
- Avoid raw hex colors scattered across pages.
- Avoid duplicated demo data.
- Avoid hydration errors and console warnings.
- Dynamically load heavy chart code where useful.
- Reserve dimensions for charts and skeletons.
- Do not ship broken links, dead buttons, or placeholder lorem ipsum.
- Do not add large dependencies when existing tools can solve the problem.
- Keep bundles and images reasonable.
- Use semantic HTML before adding ARIA.
- Maintain a clean, understandable component structure.

## Acceptance criteria

The implementation is complete only when all of the following are true:

1. Every required route renders and is reachable from the intended navigation.
2. The visible product name is SuperFinz everywhere.
3. The interface clearly serves gig and informal workers with irregular income.
4. Safe-to-spend is the main dashboard decision, not monthly spending or investing.
5. The safe-to-spend calculation can be inspected and explained using visible values.
6. Income forecasts use ranges and uncertainty language.
7. The cashbook supports income and expenses.
8. Gross income, work costs, and net income are distinguished.
9. Smart Split totals validate correctly and never implies an unimplemented real transfer.
10. Cushion progress is expressed in both rupees and protected days.
11. The resilience score is explainable and does not pretend to be a bureau credit score.
12. Responsible-credit UX presents non-credit interventions first.
13. Any simulated offer shows principal, APR, fees, total repayment, schedule, partner status, cooling-off information, and grievance path.
14. Coach responses reference dashboard data and label assumptions.
15. Demo numbers remain consistent across pages.
16. The experience works at 375px without horizontal overflow.
17. Charts have visible legends, tooltips, and text summaries.
18. Forms have labels, validation, keyboard support, and clear focus states.
19. Loading, empty, error, and prototype states are present.
20. Lint, type-check, and production build pass with no unresolved warnings introduced by this work.

## Recommended implementation sequence

1. Audit the repository and working tree.
2. Read the relevant local Next.js documentation.
3. Define semantic tokens and global typography.
4. Define domain types, canonical demo fixtures, and calculation utilities.
5. Build the responsive application shell and navigation.
6. Implement Today.
7. Implement Income.
8. Implement Plan.
9. Implement Safety.
10. Implement Coach.
11. Implement Settings.
12. Implement Onboarding.
13. Implement Landing and Login.
14. Wire all interactions and state transitions.
15. Add loading, empty, error, and offline/demo states.
16. Test responsive behavior and keyboard navigation.
17. Run lint, type-check, and production build.
18. Fix all issues caused by the implementation.

## Final execution instruction

Work autonomously through the full implementation. Do not stop after writing a plan or building only the dashboard shell. Make reasonable product decisions within this specification. If backend capabilities are missing, provide a clearly labeled, typed, local demo implementation behind adapters instead of leaving core flows broken.

At completion, provide:

- A concise summary of what was built
- A route list
- Any simulated integrations and their labels
- Verification commands run and their results
- Any genuine limitations that remain

The final product should make a hackathon judge understand this sentence immediately:

> **SuperFinz gives workers without fixed salaries a safe daily number, a plan for every payout, and a path to resilience before debt becomes the answer.**
