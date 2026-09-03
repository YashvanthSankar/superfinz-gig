# SuperFinz — Complete Product Feature List

## Product definition

- **Product name:** SuperFinz
- **Tagline:** Turn irregular earnings into a predictable money plan.
- **Positioning:** A salary layer for people without salaries.
- **Primary users:** Gig workers, platform workers, freelancers, daily-wage earners, and informal workers with irregular income.
- **Core customer question:** How much can I safely use today without affecting my essential commitments?
- **Core innovation:** An adaptive income firewall that protects work costs and upcoming commitments before showing spendable money.

## Product principles

1. Plan around the next reliable payout, not a fixed monthly salary.
2. Separate gross earnings, work expenses, and true net income.
3. Never present pending earnings as money already available.
4. Protect essentials before encouraging flexible spending.
5. Trigger savings from actual settled income instead of using rigid monthly deductions.
6. Use forecast ranges and confidence levels rather than guaranteed predictions.
7. Give users control over every allocation and connection.
8. Recommend non-credit actions before presenting credit.
9. Use deterministic calculations for financial figures; AI may only explain them.
10. Clearly label all prototype integrations and simulated financial products.

---

# 1. Public landing page

## Hero section

- SuperFinz wordmark
- “Banking for irregular incomes” eyebrow
- Primary heading: “Your earnings change. Your financial stability shouldn’t.”
- Clear explanation of the irregular-income problem
- Primary CTA: Open demo dashboard
- Secondary CTA: See how it works
- Hackathon-prototype disclaimer
- Live product preview containing:
  - Current balance
  - Safe-to-use amount
  - Expected payout range
  - Protected days
  - Resilience score

## Problem explanation

- Income arrives from different sources and at different times.
- Work expenses reduce the amount that actually reaches the household.
- Fixed bills continue during low-income periods.
- Bank balances do not distinguish protected money from spendable money.
- Small shortfalls can lead to repeated borrowing.

## Product pillars

- Income Pulse
- Safe Until Next Payout
- Adaptive Smart Split
- Smart Pockets
- Resilience Passport
- Responsible Support

## How it works

1. Connect or manually add income sources.
2. Add work costs and essential commitments.
3. Review the income forecast and protection rule.
4. Use the Today dashboard to make safer daily decisions.

## Trust section

- Consent-based financial data access
- Revocable connections
- Explainable financial calculations
- Range-based forecasts
- Clear distinction between settled and expected income
- Non-credit interventions first
- Transparent regulated-partner credit only when required

## Landing-page footer

- Product
- Accessibility
- Data and consent
- Responsible credit
- Contact
- Innovation Unbound prototype label

---

# 2. Login and demo access

- Google authentication when existing authentication supports it
- Instant “Continue as Ravi” demo access
- Loading state
- Authentication error state
- Retry action
- Prototype disclosure
- Benefits summary:
  - Know today’s safe amount
  - Protect upcoming essentials
  - Prepare for low-income periods
- Never require a judge to configure a real account before viewing the demo

---

# 3. Worker onboarding

Use a five-step, resumable onboarding flow with progress, Back, Continue, Save and Exit, validation, and final review.

## Step 1 — Work profile

- Preferred name
- City
- Preferred language
- Work type selection:
  - Food or grocery delivery
  - Ride-hailing
  - Home services
  - Freelancing
  - Street vending
  - Construction or daily wage
  - Domestic work
  - Other
- Multiple-work-type support
- Primary financial priority:
  - Stable weekly spending
  - Emergency cushion
  - Upcoming bills
  - Work expenses
  - Avoiding debt

## Step 2 — Income sources

- Add multiple income sources
- Source types:
  - Platform payout
  - Direct UPI payment
  - Bank transfer
  - Cash income
  - Other
- Source name
- Expected amount or range
- Payment frequency
- Usual payout day
- Connection mode:
  - Simulated bank connection
  - Simulated platform connection
  - File import
  - Manual entry
- Prototype-data badge
- Consent explanation
- Ability to skip connection and continue manually

## Step 3 — Income pattern

- Low-week earnings
- Typical-week earnings
- Good-week earnings
- Typical earning days
- Expected day-of-week variation
- Known seasonal patterns
- Platform deductions
- Recurring work expenses
- Income-estimate disclaimer
- Preview of estimated income range

## Step 4 — Commitments

- Add commitment categories:
  - Rent
  - Groceries
  - Fuel
  - Vehicle maintenance
  - Equipment maintenance
  - Phone and data
  - Utilities
  - EMI
  - Insurance
  - Family contribution
  - Health
  - Education
  - Custom
- Amount
- Due date
- Recurrence
- Essential or flexible classification
- Priority
- Autopay status
- Edit and delete controls

## Step 5 — Protection plan

- Configure default payout allocation across:
  - Essentials
  - Work costs
  - Emergency cushion
  - Long-term savings
  - Flexible spending
- Percentage and rupee inputs
- Live sample-payout preview
- Validation that percentages total 100%
- Bucket explanations
- Ability to override the suggested allocation
- Explicit confirmation
- Clear label that the prototype saves a planned allocation and does not move real money

## Onboarding review

- Worker profile summary
- Income-source summary
- Low, typical, and good income cases
- Work-cost summary
- Commitment summary
- Allocation-rule summary
- Connected-data and consent summary
- Simulation disclaimer
- CTA: Build my money plan

---

# 4. Application shell and navigation

## Desktop navigation

- Persistent sidebar
- SuperFinz wordmark
- Today
- Income
- Plan
- Safety
- Coach
- Add Entry action
- Prototype Data badge
- User profile
- Settings
- Logout

## Mobile navigation

- Compact top bar
- Notification action
- User avatar
- Bottom navigation:
  - Today
  - Income
  - Plan
  - Safety
  - Coach
- Add Entry action
- Safe-area support
- No horizontal page scrolling

## Shared shell features

- Current-page indicator
- Breadcrumbs where helpful
- Responsive page titles
- Global loading feedback
- Toast notifications
- Confirmation dialogs
- Keyboard navigation
- Visible focus states

---

# 5. Today dashboard

The dashboard must communicate the worker’s current financial state within five seconds.

## Safe Until Next Payout hero

- Primary safe-to-use amount
- Time horizon, such as “until Friday”
- Current available balance
- Money already protected
- Essential commitments due before the next reliable payout
- Work costs required before the next payout
- Minimum safety buffer
- Expected next payout range
- Financial status label
- Data freshness timestamp
- Forecast confidence
- “How this is calculated” action

## Calculation explanation drawer

- Current settled balance
- Less protected commitments
- Less earning-enabling work costs
- Less minimum safety buffer
- Resulting safe amount
- Pending income shown separately
- Plain-language explanation
- Data-source labels
- Assumptions
- Last-updated time

## Income Pulse summary

- Today’s gross income
- This week’s gross income
- Work expenses
- True net income
- Comparison with a typical week
- Active income sources
- Next expected payout
- Income confidence indicator

## Money timeline

- Combined upcoming income and outgoing commitments
- Settled, expected, due, planned, and paid statuses
- Income ranges for uncertain payouts
- Horizontal layout on desktop
- Vertical layout on mobile
- Event details drawer
- Example events:
  - Today: fuel
  - Friday: platform payout
  - Saturday: mobile bill
  - Monday: family contribution
  - 5th: rent

## Thirty-day cash-flow forecast

- Historical balance line
- Expected future balance line
- Confidence-range band
- Safety-floor reference line
- Commitment markers
- Expected-payout markers
- Best, typical, and conservative cases
- Date-range selector
- Tooltips
- Visible legend
- Text summary for accessibility
- Explanation of assumptions
- No false precision

## Emergency cushion card

- Cushion balance
- Protected days
- Cushion goal
- Progress bar
- Numeric progress label
- Suggested next contribution
- Cushion activity
- Add contribution plan
- Emergency-withdrawal plan

## Latest payout allocation

- Payout amount
- Payout source
- Received date
- Essentials allocation
- Work-cost allocation
- Emergency-cushion allocation
- Long-term-savings allocation
- Flexible-spending allocation
- Planned versus completed status
- Edit allocation
- View split details

## Resilience snapshot

- Resilience score
- Status label
- Strongest positive factor
- Most important risk factor
- Recommended improvement
- Link to full Resilience Passport
- Clear statement that this is not a bureau credit score

## One recommended action

- Exactly one prioritized action
- Reason the action matters now
- Financial impact
- Primary action
- Alternative action
- Dismiss or remind-later option

Examples:

- Protect ₹300 because the next payout may be delayed.
- Move a flexible bill to keep rent fully funded.
- Add ₹160 from the next payout to gain another protected day.

## Dashboard quick actions

- Add income
- Add expense
- Split a payout
- Add commitment
- Mark bill paid
- Run a scenario

## Recent activity

- Recent income
- Recent expenses
- Recent pocket allocations
- Recently paid commitments
- Source and category labels
- View full cashbook

---

# 6. Income section

Use Overview, Cashbook, and Sources tabs.

## Income overview

- This week’s gross income
- Work expenses
- True net income
- Net-income change from a typical week
- Active source count
- Next expected payout range
- Twelve-week gross-versus-net chart
- Day-of-week earning pattern
- Platform contribution breakdown
- Work-cost ratio
- Delayed-payout indicator
- Income consistency summary

## Income-source cards

- Source name and icon
- Platform, bank, UPI, cash, or manual type
- Current-period earnings
- Share of total income
- Payout frequency
- Next payout range
- Recent consistency
- Last sync
- Connection status
- Prototype or live-data label
- View source details

## Cashbook

Support both income and expenses.

Entry types:

- Income
- Work expense
- Personal essential
- Flexible expense
- Commitment payment
- Pocket allocation
- Transfer

Cashbook features:

- Search
- Date filter
- Entry-type filter
- Source filter
- Category filter
- Payment-method filter
- Amount filter
- Sort
- Desktop table
- Mobile card list
- Empty state
- Pagination or progressive loading when required
- Export option as a later-phase feature

## Add and edit entry

- Income or expense selector
- Amount
- Date and time
- Source
- Category
- Payment method
- Work-related toggle
- Recurring toggle
- Notes
- Receipt attachment as a later-phase feature
- Validation
- Save
- Delete with confirmation
- Recalculate all dependent dashboard values after save

## Income-source management

- View connected and manual sources
- Add manual source
- Start simulated connection
- Pause connection
- Refresh data
- View last sync
- Resolve connection error
- Revoke consent
- Explain what data is collected
- Explain why it is used
- Show consent date and expiry

---

# 7. Adaptive Smart Split

Smart Split should be triggered when actual income is received.

## Payout input

- Payout source
- Settled amount
- Received date
- Optional note
- Existing default rule

## Allocation buckets

- Essentials
- Work costs
- Emergency cushion
- Long-term savings
- Flexible spending

## Adaptive allocation engine

- Protect overdue commitments first
- Protect commitments due before the next likely payout
- Protect minimum earning-enabling work costs
- Refill emergency cushion
- Fund long-term goals
- Release remaining money for flexible spending
- Change recommendations when payout amount changes
- Change recommendations when due dates change
- Change recommendations when cushion depth changes
- Change recommendations when expected income risk changes

## Smart Split controls

- Linked percentage and rupee inputs
- Sliders with accessible keyboard controls
- Total-allocation validation
- Currency-rounding correction
- Before-and-after safe amount
- Before-and-after protected days
- Commitments funded by the split
- Explanation of recommendation
- User override
- Reset to recommendation
- Explicit confirmation
- Success state
- Error state
- Cancel state
- Planned-allocation wording when no real transfer occurs

---

# 8. Plan section

## Forecast summary

- Expected 30-day income range
- Committed outflow
- Expected work costs
- Lowest projected balance range
- Protected days
- Forecast confidence
- Confidence explanation
- Data freshness

## Commitments manager

- Due soon group
- This month group
- Later group
- Essential and flexible labels
- Amount
- Due date
- Recurrence
- Priority
- Funding status
- Funding source or pocket
- Autopay status
- Mark as paid
- Edit
- Reschedule
- Delete
- Add commitment
- At-risk warning

## Scenario simulator

Preset scenarios:

- Income falls 20% next week
- Next payout is delayed by two days
- Vehicle repair costs ₹2,500
- Worker takes one or two days off
- Fuel cost increases
- A commitment amount changes

Scenario results:

- Updated safe-to-use amount
- Updated income range
- Updated lowest-balance range
- Commitments at risk
- Updated cushion days
- Required net-earning target
- Recommended action
- Non-credit alternatives
- Compare with baseline
- Reset
- Save scenario as a later-phase feature

## Earning target

- Net amount required by a selected date
- Commitments covered by that target
- Work costs required to achieve it
- Conservative, typical, and optimistic cases
- Target per remaining workday
- Target progress
- Assumptions
- Ability to adjust planned workdays

---

# 9. Safety section

Use Pockets, Resilience, Protection, and Responsible Credit tabs.

## Smart Pockets

Pocket types:

- Essentials
- Work costs
- Emergency cushion
- Long-term savings
- Flexible spending

Pocket features:

- Current planned or real balance
- Target
- Purpose
- Funding progress
- Recent activity
- Contribution recommendation
- Add contribution plan
- Withdrawal plan
- Warning before using protected money
- Edit pocket target
- Current Smart Split rule

## Resilience Passport

- Overall score out of 100
- Status label
- Last-updated time
- Score trend
- Explanation that it is not a bureau credit score

Resilience factors:

- Income consistency
- Income-source diversity
- Essential-commitment coverage
- Emergency-cushion depth
- Work-cost control
- Repayment reliability only when verified data exist

For every factor show:

- Current status
- Score contribution
- Evidence used
- Improvement action
- User-controllable inputs
- Missing-data state

## Resilience-score explanation

- Full formula or rules
- Data sources
- Factors not used
- No protected-trait scoring
- No contacts, private messages, or invasive behavioral surveillance
- No loan-approval promise
- Dispute or correct data action

## Protection center

- Emergency-cushion guidance
- e-Shram information
- Benefits and welfare-scheme discovery
- Health-insurance awareness
- Accident-insurance awareness
- Life-insurance awareness
- Nominee reminder
- Emergency-contact reminder
- Fraud and account-safety checklist
- Vehicle or equipment protection information
- Claim-document checklist
- Human-support or help-center direction
- Informational-only disclaimers

## Responsible Credit need assessment

- Verified shortfall amount
- Reason for shortfall
- Commitments causing the gap
- Current cushion effect
- Income-recovery estimate
- Alternatives already evaluated
- Amount that remains after alternatives

## Non-credit intervention ladder

1. Reschedule a flexible commitment.
2. Reduce flexible allocation temporarily.
3. Use available flexible funds.
4. Use only the necessary part of the cushion.
5. Set a short net-earning target.
6. Surface applicable benefits or protection.
7. Consider regulated-partner credit only for the remaining verified gap.

## Simulated credit offer

- Regulated partner identity or clear placeholder
- Simulated-offer badge
- Principal
- APR
- Interest amount
- Processing fee
- Other applicable fees
- Net disbursed amount
- Total repayment
- Number and frequency of installments
- Installment amount
- Repayment dates
- Late or penal charges
- Cooling-off period
- Key Facts Statement
- Eligibility-data explanation
- Grievance officer and route
- RBI complaint information where applicable
- Compare with no-credit plan
- Not now
- Continue to simulated eligibility check

## Credit safety rules

- No “pre-approved” language unless legally valid
- No countdowns or artificial urgency
- No celebratory debt language
- No preselected loan
- No hidden fees
- No AI loan approval
- No loan larger than the verified need
- No contact-list or unrelated-phone-data access
- No product ranking based on SuperFinz commission
- No direct lending by SuperFinz

---

# 10. Financial Coach

## Suggested questions

- How much can I safely use today?
- Can I afford to take Sunday off?
- What happens if Friday’s payout is late?
- How can I reach 15 cushion days?
- Explain my Resilience Passport.
- Why did my safe amount decrease?
- Do I need credit for this repair?

## Coach response behavior

- Direct answer first
- Exact dashboard figures used
- Known facts separated from estimates
- Visible assumptions
- No more than three recommended steps
- Deep links to relevant actions
- Non-credit actions before credit
- Plain language
- Localization-ready responses
- No shame or judgment
- No investment-return promises
- No invented financial figures
- No approval or eligibility decisions

## Coach interface

- Chat history
- Suggested-prompt chips
- Context card showing relevant dashboard values
- Send and stop controls
- Loading state
- Retry state
- Error state
- Copy response
- Helpful/not-helpful feedback
- Clear conversation
- AI limitation notice
- Dashboard calculations remain the source of truth

---

# 11. Notifications and proactive alerts

- Expected payout reminder
- Delayed-payout warning
- Upcoming essential commitment
- Commitment at risk
- Low safe-to-use amount
- Safety-floor warning
- Work-cost spike
- Income lower than typical range
- Cushion contribution suggestion
- Pocket target reached
- Connection sync failure
- Consent expiry
- Insurance or document reminder
- Resilience-score factor change
- Alert preferences
- Quiet hours
- Push, in-app, SMS, or WhatsApp-ready architecture
- No spam or loan-promotion notifications

---

# 12. Settings and user controls

## Profile

- Name
- City
- Work types
- Preferred language
- Currency and locale

## Financial preferences

- Low, typical, and good income ranges
- Typical workdays
- Default safety buffer
- Safe-to-use planning horizon
- Smart Split rule
- Cushion target
- Forecast preference

## Notifications

- Channel preferences
- Alert categories
- Quiet hours
- Reminder timing

## Connections and consent

- Connected source list
- Data types accessed
- Purpose of access
- Consent date
- Consent expiry
- Last sync
- Pause
- Reconnect
- Revoke
- Delete imported data where permitted

## Accessibility

- Larger text
- Higher contrast
- Reduced motion
- Preferred language
- Screen-reader-friendly summaries
- Clear numeric and date formats

## Security and account

- Sign out
- Session management as a later-phase feature
- Data export as a later-phase feature
- Account deletion
- Privacy information
- Terms
- Grievance and support details

---

# 13. Data and integration features

## Demo data adapter

- Typed local fixtures
- Deterministic calculations
- No required external account
- Consistent data across every page
- Easy replacement with production APIs

## Bank and Account Aggregator readiness

- Simulated consent flow
- Data-purpose explanation
- Date-range and data-type selection
- Explicit consent
- Consent receipt
- Revoke flow
- Data freshness
- Error and retry states
- Never request bank passwords or PINs

## Platform integration readiness

- Swiggy-style source
- Rapido-style source
- Additional platform sources
- Settled payout data
- Pending earnings
- Platform deductions
- Work activity metadata only when necessary and consented
- Connection health
- Partner API adapter

## Cash and informal income

- Fast manual entry
- Repeat previous entry
- Favorite source
- Optional voice-entry architecture
- Cash balance
- Manual-source confidence label
- Duplicate-entry prevention

## Payment and pocket readiness

- Planned allocations in the prototype
- Partner-bank subaccount architecture for production
- User-confirmed transfer mandate for production
- No false claim that money moved

## Social-protection readiness

- e-Shram information
- Scheme-discovery adapter
- Eligibility questions
- Application deep links
- Informational status
- No false enrollment confirmation

---

# 14. Financial calculation engines

All official values must come from testable application logic.

## Money engine

- Indian currency formatting
- Integer-paise handling where practical
- Allocation rounding
- Total consistency checks

## Income engine

- Gross income
- Platform deductions
- Work expenses
- True net income
- Income by source
- Income-source concentration
- Low, typical, and high earning ranges
- Day-of-week patterns

## Safe-to-use engine

Base logic:

```text
Safe now = settled liquid balance
         − essential commitments due before the next reliable inflow
         − work costs required to keep earning before that inflow
         − user-selected minimum safety buffer
```

- Result cannot be lower than zero
- Pending earnings stay separate
- Explain every subtraction
- Recalculate after every relevant change
- Show data freshness and confidence

## Forecast engine

- Historical net cash flow
- Expected payout windows
- Conservative, typical, and optimistic paths
- Confidence range
- Commitment events
- Work-cost estimates
- Safety-floor breach detection
- Forecast-error tracking as a later-phase feature

## Cushion engine

- Emergency-cushion balance
- Average essential daily cost
- Protected days
- Target days
- Contribution required for the next protected day

## Resilience engine

- Explainable factor weights
- Income consistency
- Source diversity
- Commitment coverage
- Cushion depth
- Work-cost ratio
- Verified repayment behavior
- Missing-data handling
- No protected traits

## Credit-cost engine

- Principal
- Interest
- Fees
- APR display
- Net disbursal
- Installment amount
- Repayment dates
- Total repayment
- Rounding validation

---

# 15. Accessibility and inclusive design

- Target WCAG 2.2 AA
- Minimum required color contrast
- Logical heading hierarchy
- Real form labels
- Inline validation
- Error descriptions connected to fields
- Full keyboard navigation
- Visible focus states
- Accessible dialogs and sheets
- Focus trapping and focus return
- Escape-key support
- Minimum 44×44px touch targets
- No information communicated only through color
- Chart legends and text summaries
- Accessible names for icon-only buttons
- Reduced-motion support
- No automatic onboarding-step advance
- No placeholder-only inputs
- Plain-language financial explanations
- Localization-ready layout
- Mobile-first content priority

---

# 16. Loading, empty, error, and offline states

## Loading

- Stable skeletons
- Reserved chart space
- Button progress states
- Duplicate-submission prevention

## Empty states

- No income sources
- No income entries
- No expenses
- No commitments
- No coach history
- No notifications
- No connected accounts
- Clear action for every empty state

## Error states

- Human-readable error
- Preserve user input
- Retry action
- Connection-recovery instructions
- No raw stack traces

## Offline and prototype resilience

- Local canonical demo data
- Last-available-data message
- Offline manual entry where possible
- Sync-pending state
- Clear separation between local and connected data

---

# 17. Partner and investor dashboard

This is a small secondary demonstration for potential banks, gig platforms, employers, or benefit providers. It must use anonymized, aggregated data.

## Partner metrics

- Active workers
- Connected income sources
- Percentage with essential commitments protected
- Average protected days
- Change in cushion depth
- Predicted shortfalls
- Shortfalls resolved without credit
- Work-cost trends
- Income-source concentration
- Responsible partner referrals
- Consent coverage
- Data freshness

## Partner controls

- Date range
- Worker segment
- City
- Work type
- Aggregated trend charts
- Outcome definitions
- Data-use policy
- No individual financial surveillance
- No worker-level punitive scoring

## Investor metrics

- Weekly active users
- Safe-to-use checks per user
- Payouts allocated
- Commitment coverage rate
- Increase in protected days
- Forecast accuracy
- Recommended actions completed
- Shortfalls prevented
- Credit avoided through intervention
- Responsible partner conversion
- User retention
- Platform-partner retention hypothesis

---

# 18. Canonical hackathon demo persona

## Worker

- Name: Ravi Kumar
- Age: 27
- City: Chennai
- Work: Delivery partner with occasional ride-hailing work
- Income sources: Swiggy, Rapido, and direct UPI tips

## Current financial state

- Available balance: ₹6,800
- Safe to use: ₹620 until Friday
- Expected next payout: ₹2,100–₹3,400
- This week’s gross income: ₹5,950
- Work expenses: ₹1,100
- True net income: ₹4,850
- Emergency cushion: ₹6,000
- Protected days: 12
- Cushion target: 30 days
- Resilience score: 68/100

## Commitments

- Weekly fuel plan: ₹700
- Mobile bill: ₹299
- Rent: ₹4,000
- Family contribution: ₹1,000
- Maintenance reserve: ₹500

## Latest ₹3,200 payout allocation

- Essentials: ₹1,760
- Work costs: ₹480
- Emergency cushion: ₹320
- Long-term savings: ₹160
- Flexible spending: ₹480

The allocations must always total ₹3,200.

## Historical data requirements

- Twelve weeks of plausible earnings
- Weekday and weekend variation
- Multiple income sources
- One delayed payout
- One vehicle-repair spike
- Gradual but imperfect cushion growth
- Changing source concentration
- Internally consistent cards, charts, tables, and coach responses

---

# 19. Hackathon demonstration flow

1. Open Ravi’s Today dashboard.
2. Show the ₹6,800 bank balance.
3. Reveal that only ₹620 is safe until Friday.
4. Open the calculation drawer and show protected rent, work costs, and buffer.
5. Show the uncertain ₹2,100–₹3,400 upcoming payout.
6. Add a settled ₹3,200 platform payout.
7. Use Adaptive Smart Split to protect commitments and increase cushion progress.
8. Open the scenario simulator.
9. Trigger an unexpected ₹2,500 vehicle repair.
10. Show safe-to-use, at-risk commitments, cushion days, and earning target update together.
11. Show non-credit alternatives.
12. Display a transparent simulated partner offer only if a gap remains.
13. End with the explainable Resilience Passport.

---

# 20. Feature priorities

## P0 — Must be completed for the hackathon

- Responsive application shell
- Demo login
- Worker onboarding
- Unified income and expense cashbook
- Gross/work-cost/net-income separation
- Safe Until Next Payout hero
- Calculation explanation
- Money timeline
- Thirty-day forecast with ranges
- Adaptive Smart Split
- Commitments manager
- Cushion and protected days
- Scenario simulator
- Resilience Passport
- Non-credit intervention ladder
- Transparent simulated credit-offer screen
- Financial Coach using canonical data
- Consent and prototype labels
- Mobile and keyboard accessibility
- Loading, empty, and error states

## P1 — Strong investor-demo additions

- Partner dashboard
- Outcome metrics
- Source connection management
- Consent receipts
- Benefits and e-Shram discovery
- Notification center
- Forecast-error tracking
- Multilingual structure
- Higher-contrast and larger-text preferences

## P2 — Post-hackathon roadmap

- Real regulated Account Aggregator partnership
- Real platform API connections
- Real partner-bank pockets
- Consent-based payout routing
- Production notification channels
- Voice-assisted cash entry
- Tax filing assistance
- Insurance and benefit integrations
- Regulated lending-partner integration
- Formal user-data export
- Longitudinal impact analytics

---

# 21. Features intentionally excluded

- Stock portfolio
- Market news
- Cryptocurrency
- FIRE or retirement calculators
- Student-focused budgeting
- Expense roasting
- Social feed
- Generic rewards marketplace
- Unexplained AI-generated financial numbers
- Guaranteed income predictions
- Direct lending by SuperFinz
- Credit-first home screen
- Dark patterns
- Invasive contact, call-log, message, or location-data collection
- Claims that simulated money was transferred

---

# 22. Final acceptance checklist

- [ ] The visible product name is SuperFinz everywhere.
- [ ] Every primary route is reachable.
- [ ] The experience clearly serves workers with irregular income.
- [ ] Safe Until Next Payout is the main dashboard feature.
- [ ] Its calculation is inspectable and internally consistent.
- [ ] Pending income is separated from settled money.
- [ ] Gross income, work expenses, and true net income are distinct.
- [ ] The cashbook supports income and expenses.
- [ ] Forecasts use ranges, assumptions, and confidence.
- [ ] Smart Split adapts to actual payout and commitment conditions.
- [ ] Smart Split allocations always match the payout total.
- [ ] Prototype allocation does not imply a real money transfer.
- [ ] Cushion progress appears in rupees and protected days.
- [ ] Scenarios update every dependent value consistently.
- [ ] The Resilience Passport is explainable.
- [ ] The Resilience Passport is not presented as a bureau score.
- [ ] Non-credit interventions appear before credit.
- [ ] Credit screens show the complete cost and regulated-partner status.
- [ ] AI explains deterministic calculations without inventing figures.
- [ ] Demo values remain consistent across every screen.
- [ ] All simulated integrations are labeled.
- [ ] Consent can be reviewed and revoked.
- [ ] The UI works at 375px without horizontal overflow.
- [ ] Forms and navigation are keyboard accessible.
- [ ] Charts include legends and text summaries.
- [ ] Loading, empty, error, and offline/demo states exist.
- [ ] No excluded legacy feature remains in primary navigation.
- [ ] Lint, type-check, and production build pass.

## Final product statement

> **SuperFinz gives workers without fixed salaries a safe daily number, a plan for every payout, and a path to resilience before debt becomes the answer.**
