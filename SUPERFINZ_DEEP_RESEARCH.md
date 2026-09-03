# SuperFinz: Solving the Gig-Worker Spending Problem

**Deep-research brief for the Innovation Unbound hackathon**

**India-first analysis, with global comparisons**

**Prepared: 3 September 2026**

## Executive answer

Gig workers do not primarily have an “overspending problem.” They have a **timing, uncertainty, and liquidity problem**:

- Income changes daily and may arrive from several platforms, UPI, bank transfers, or cash.
- A large part of headline earnings is consumed by fuel, maintenance, commissions, data, and other costs required to keep working.
- Rent, family support, EMIs, and bills remain fixed even when earnings fall.
- Workers must decide what is safe to use before they know precisely when or how much they will earn next.
- Conventional recurring savings and rigid monthly budgets often do not match this cash flow.
- A small shock can turn into repeated short-term borrowing.

The best solution for SuperFinz is therefore an **adaptive income firewall**:

> SuperFinz turns each settled inflow into a protected plan. It first accounts for the costs of earning and the commitments due before the next uncertain payout, then exposes one explainable amount that is genuinely safe to use.

The memorable investor description remains:

> **A salary layer for people without salaries.**

The hackathon-winning difference should not be “AI budgeting” or “safe to spend” alone. Those ideas already exist. SuperFinz should combine:

1. Cross-platform and cash income visibility
2. True net earnings after work costs
3. Range-based next-payout forecasting
4. An explainable safe-to-use amount tied to the next payout—not merely the calendar month
5. Adaptive payout protection based on current commitments—not a rigid 50/30/20 split
6. Shock and workday scenarios
7. A portable, explainable Resilience Passport
8. Non-credit interventions before any regulated-partner credit

## 1. What the evidence says the real problem is

### The market is large, but size claims need care

NITI Aayog estimated 7.7 million Indian gig workers in 2020–21 and projected 23.5 million by 2029–30. It also explicitly described its estimate as indicative because official data are limited. Use the projection to show direction, not as an unquestionable current TAM. [NITI Aayog, *India’s Booming Gig and Platform Economy*](https://www.niti.gov.in/sites/default/files/2023-02/25th_June_Final_Report_27062022.pdf)

### Gross earnings hide the real spendable income

Dvara Research’s Bengaluru financial-diaries study is the most directly relevant evidence found. Its small sample averaged ₹35,075 in monthly platform earnings but ₹18,470 in work-related expenses, leaving ₹16,604 in net platform income. In that sample, the difference between “earned” and “available for the household” was enormous. [Dvara Research, *The financial lives of platform workers*](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf)

This gives SuperFinz a crucial product principle:

> Never call gross platform payouts “income available to spend.” Show gross earnings, work costs, and true net income separately.

### Volatility exists on both sides of the cash flow

During Dvara’s 14-day diaries, participants experienced 57% variation around average daily earnings and 79% variation around average daily work expenses. Volatility remained even after differences in hours worked were considered. Eighteen of 22 participants expected earnings to differ across two equal-work weeks. [Dvara Research](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf)

Broader evidence points in the same direction. Recent JPMorganChase Institute research found that one in four months for hourly workers had an earnings change of at least 21%, with part of earnings instability passing through to spending instability. This is US evidence rather than an India gig-worker estimate, but it reinforces why annual income is a poor proxy for day-to-day security. [JPMorganChase Institute, *Earnings instability*](https://www.jpmorganchase.com/institute/all-topics/household-financial-health/earnings-instability)

### Workers already use intelligent coping strategies

Dvara describes three recurring needs in low-income money management:

- **Scramble for liquidity** when money is urgently needed
- **Mop up surplus liquidity** when a good earning period arrives
- **Harden money** by mentally assigning it to rent, school fees, remittances, or another purpose before it disappears into daily spending

Workers also change platforms, extend working hours, delay expenses, borrow within social networks, and mentally earmark bank balances. SuperFinz should digitize these existing behaviors instead of imposing a salaried-person budget model. [Dvara Research](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf)

### Rigid saving products do not fit irregular surpluses

In the same study, none of the 22 diary participants reported using FDs, RDs, post-office savings accounts, pension funds, or mutual funds. Some had abandoned recurring deposits because they could not maintain regular contributions. They favored bank balances, cash, and chit funds because money could be accessed during emergencies. This is a small, localized sample, but the design signal is strong: **saving must be flexible, reversible, and triggered by actual income rather than a fixed monthly date.** [Dvara Research](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf)

CGAP’s platform-worker pilots support this direction. ABALOBI let workers choose a percentage of each earning to sweep into savings; SafeBoda saw better registration and use for automatic deductions than for a wallet requiring manual deposits; an extra MPESA step limited another pilot. CGAP also found that in-person outreach materially improved adoption, so digital-only assumptions are risky. [CGAP, *Regular Savings from Irregular Income*](https://www.cgap.org/blog/regular-savings-irregular-income-how-platforms-can-help)

CFPB analysis of Qapital users found guaranteed saving rules were associated with substantially more saving than purchase-round-up or other contingent rules. It is US observational data and not gig-specific, so it should not be treated as proof for India. It does, however, argue against making round-ups the core innovation. [CFPB, *Consumer Savings App Strategies and Savings Outcomes*](https://www.consumerfinance.gov/data-research/research-reports/consumer-savings-app-strategies-and-savings-outcomes/)

### Small borrowing often smooths routine consumption

In Dvara’s 14-day diaries, 18 of 22 participants borrowed at least once. Participants took 44 new loans averaging ₹2,781; 26 of those loans—60%—were for routine consumption smoothing and averaged ₹1,763. Friends and relatives supplied 26 of the 44 loans, often with flexible terms. Again, this describes a small sample, but it shows that “credit access” alone does not solve the cause of the shortfall. [Dvara Research](https://dvararesearch.com/wp-content/uploads/2023/12/Research-Report_-The-financial-lives-of-platform-workers-A-diaries-study-in-Bengaluru-India.pdf)

ADB research on low-skilled urban workers during the pandemic similarly found platform workers less likely to rely on savings and more likely to borrow or sell assets than comparable non-platform workers. [Asian Development Bank Institute, 2025](https://www.adb.org/publications/exploring-economic-challenges-and-resilience-during-covid-19-of-low-skilled-gig-workers-in-urban-india)

## 2. What workers already have

This is a bounded scan of public product capabilities, not a hands-on audit or an exhaustive list.

| Solution category | Verified examples | What it already solves | Remaining gap for SuperFinz |
|---|---|---|---|
| Platform earnings and payouts | Uber Driver, Swiggy partner ecosystem | Earnings visibility, bank payout, rewards, some insurance or partner benefits | Usually sees only one platform and does not protect household commitments across all income |
| Earned wage access and credit | KarmaLife, Refyne | Early access, personal loans, lines of credit, repayment deductions | Liquidity arrives mainly through credit; it does not eliminate the spending decision that creates the next shortfall |
| Gig-focused financial product hub | Dvara Spark Money | Account, UPI, tax filing, digital gold, insurance, loans and assisted support | Strong distribution breadth; public materials do not clearly show a cross-source, next-payout safe-spending engine |
| Automated saving | Jar, Fi Jars | Small automatic saving, goals, deposits, round-ups or schedules | Rules are generally fixed or goal-based, not dynamically reprioritized by payout uncertainty and imminent commitments |
| Expense tracking | Axio and many budgeting apps | Transaction categorization and retrospective spend insight | Explains where money went after spending rather than protecting what must remain before spending |
| Generic safe-to-spend budgeting | PocketGuard | Computes money left after bills, goals and budgets | Confirms that “safe to spend” alone is not novel; it is monthly/general-purpose and not designed around Indian gig-work costs and payout behavior |
| Self-employed banking/admin | Found, Wingspan | Pockets, tax withholding, bookkeeping, payments, benefits | Primarily US business/freelancer context; optimized around tax and business administration rather than daily low-income resilience |
| Government protection | e-Shram and connected schemes | Worker identity, scheme discovery and portable social-protection architecture | Does not manage daily cash flow or determine what is safe to use |

Sources: [KarmaLife](https://karmalife.ai/), [Dvara Holdings FY24 impact report](https://www.dvara.com/wp-content/uploads/2025/01/ImpactReport-DvaraHoldings-FY24.pdf), [Jar](https://www.myjar.app/), [Fi Smart Deposits](https://fi.money/features/deposits), [PocketGuard](https://pocketguard.com/), [Found](https://found.com/), [Wingspan](https://www.wingspan.app/for-workers), and [PIB’s e-Shram/social-security overview](https://www.pib.gov.in/FactsheetDetails.aspx?ModuleId=16&NoteId=150554&id=150554&lang=1&reg=37).

## 3. The white space

No single reviewed India-focused offering publicly presents all of these as one decision system:

- Multiple platform, bank, UPI, and manual cash inflows
- Pending versus settled earnings
- Gross-to-net conversion after earning-enabling costs
- Forecast ranges rather than a fixed expected salary
- Commitments protected through the next likely payout
- A user-controlled split that changes when income or due dates change
- “Can I take tomorrow off?” and “What if the payout is late?” scenarios
- Resilience measured in protected days and commitment coverage
- Non-credit intervention before a loan offer
- Portability across platforms and jobs

That combination—not any single card—is the opportunity.

## 4. Recommended solution: the SuperFinz Adaptive Income Firewall

### Layer 1 — Income Pulse

Bring together:

- Settled platform payouts
- Pending platform earnings
- UPI and bank receipts
- Manually entered cash income
- Fuel, maintenance, tolls, data, platform fees, and other work costs

Show three numbers clearly:

```text
Gross earnings − earning costs = true net income
```

Do not mix pending earnings into current balance. Display a conservative payout range and confidence separately.

### Layer 2 — Safe Until Next Payout

Replace the generic monthly budget with a short, event-based horizon:

```text
Safe now = liquid money available now
         − essential commitments due before the next reliable inflow
         − earning-enabling costs required before that inflow
         − minimum user-chosen safety buffer
```

Clamp the result at zero. Expected income should not be treated as spendable until it settles. If the product later includes expected inflows in planning views, use a conservative lower-bound estimate and label it—not in the “money available now” figure.

Every result must expose:

- The amount
- The horizon: “until Friday”
- The protected commitments
- The work-cost reserve
- The safety buffer
- Data freshness
- Forecast confidence
- A plain-language calculation drawer

### Layer 3 — Adaptive Payout Routing

Do not use only a fixed 50/30/20 rule. When a payout lands, calculate a suggested waterfall:

1. Fund overdue or near-term essential commitments.
2. Fund the minimum fuel/equipment/data required to keep earning.
3. Refill the emergency buffer toward the next protected day.
4. Fund longer-term goals.
5. Release the remainder for flexible use.

The worker must be able to edit and confirm the suggestion. In a prototype, call it a **planned allocation**, not a money transfer.

Example:

| Event | Low payout | Typical payout | High payout |
|---|---:|---:|---:|
| Swiggy payout settles | ₹2,100 | ₹3,200 | ₹4,000 |
| Essentials protected first | ₹1,500 | ₹1,760 | ₹2,000 |
| Work-cost reserve | ₹400 | ₹480 | ₹600 |
| Cushion contribution | ₹100 | ₹320 | ₹600 |
| Long-term goal | ₹0 | ₹160 | ₹300 |
| Flexible remainder | ₹100 | ₹480 | ₹500 |

The innovation is not the buckets. It is that the priority and allocation change with the actual payout, due dates, cushion depth, and risk—not merely a static percentage.

### Layer 4 — Shock and Workday Simulator

Create four one-tap scenarios:

- Friday’s payout is two days late.
- Next week’s earnings fall 20%.
- Vehicle repair costs ₹2,500.
- Ravi takes Sunday off.

Update, in the same interaction:

- Safe-to-use amount
- Commitments at risk
- Required earning target
- Cushion days
- Recommended next action

This should be the hackathon’s “wow” moment because it demonstrates a live decision engine rather than a collection of charts.

### Layer 5 — Resilience Passport

Make the score an explainable planning indicator—not a credit bureau score.

Use only controllable, financial factors:

- Percentage of essential commitments funded before due date
- Cushion days
- Net-income volatility range
- Income-source concentration
- Work-cost ratio
- Repayment reliability only when verified data exist

Do not score protected traits, phone contacts, message content, precise location behavior, or opaque platform ratings. Do not promise that a bank will lend based on the score.

### Layer 6 — Intervention Before Credit

When a shortfall is predicted, show this sequence:

1. Reschedule a flexible commitment.
2. Reduce flexible allocation temporarily.
3. Use only the necessary cushion amount.
4. Set a short net-earning target.
5. Surface relevant benefit or insurance information.
6. Show regulated-partner credit only for the remaining verified gap.

This directly differentiates SuperFinz from a credit-first gig-fintech experience.

## 5. Why this can beat typical hackathon entries

The following is an inference from the challenge wording and current product landscape; the actual competing teams are unknown.

Many teams are likely to produce one of these:

- A generic AI finance chatbot
- An expense categorizer with pie charts
- A fixed 50/30/20 budget
- A savings round-up or gamified streak
- An alternative credit score
- A microloan marketplace
- A single-number income prediction

SuperFinz should demonstrate why each is insufficient:

| Likely idea | Weakness | SuperFinz response |
|---|---|---|
| Expense tracker | Retrospective | Protect money before spending occurs |
| AI coach | Advice without a financial engine | Deterministic calculations first; AI only explains |
| Fixed budget | Assumes stable period and amount | Next-payout horizon with adaptive allocations |
| Savings streak | Can debit during a low-income day | Save from actual settled inflows and change the amount safely |
| Credit score | Risks becoming another loan funnel | Resilience Passport plus non-credit intervention |
| Income forecast | False precision | Conservative range, confidence, and visible assumptions |
| Bank-balance dashboard | Balance is not spendable money | Separate protected, required-to-earn, and safe money |

### The one-sentence novelty claim

Do not claim that SuperFinz invented safe-to-spend. Say:

> **Unlike monthly budgeting apps or credit-first gig fintechs, SuperFinz protects the next essential commitments and earning costs from every irregular inflow, then shows what is safe to use until the next likely payout.**

### The one-screen demonstration

Build the Today screen around:

- `₹620 safe until Friday`
- Current balance: ₹6,800
- Rent and other protected commitments
- Work-cost reserve
- Expected payout: ₹2,100–₹3,400
- Cushion: 12 protected days
- One action: “Protect ₹300 because Friday’s payout may be late”

Then toggle **“Vehicle repair: ₹2,500”**. The safe amount, at-risk commitments, cushion days, and action plan should all update immediately.

## 6. What to build for the hackathon

### Must be functional

1. Unified income and expense cashbook
2. Gross/work-cost/net calculation
3. Safe Until Next Payout card with explainability
4. Money timeline for payouts and commitments
5. Adaptive payout-routing interaction
6. Emergency-cushion days
7. Four scenario simulations
8. Explainable Resilience Passport
9. Non-credit-first shortfall flow
10. Mobile-first, accessible UI

### Can be simulated—but must be labeled

- Platform connections
- Account Aggregator connection
- Partner-bank pockets
- Actual transfer of split amounts
- Insurance or benefit eligibility
- Loan eligibility and offers

### Do not spend hackathon time on

- Stock or crypto modules
- Social feeds
- Generic financial news
- A broad marketplace
- Dozens of expense charts
- A complex LLM agent architecture
- Real loan disbursement
- Pretending a financial integration is live

## 7. Technical and regulatory feasibility

### Financial data

RBI’s Account Aggregator framework requires explicit customer consent and prohibits the AA from using or storing customer credentials. In production, SuperFinz would need an appropriate regulated-partner arrangement; it should not present itself as an AA. Cash and unsupported platform data still need manual, file-import, or direct platform-partnership paths. [RBI Account Aggregator Directions](https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10598)

For the prototype:

- Use typed local data.
- Distinguish settled, pending, and user-entered records.
- Show consent purpose and revoke controls.
- Label every connection as simulated.

### Smart Split

Without a regulated partner and actual payment/account rails, SuperFinz can recommend and save an allocation plan but cannot claim money was moved. A production version could use partner-bank subaccounts or consented transfer mandates after legal and operational review.

### Credit

Under RBI’s 2025 Digital Lending Directions, the regulated entity remains responsible. Relevant requirements include comparable offer information, lender identity, APR and KFS access, prohibition of misleading dark patterns, cooling-off, grievance mechanisms, direct fund flows between borrower and regulated entity, and need-based data collection with explicit consent. [RBI, *Digital Lending Directions, 2025*](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12848&Mode=0)

Therefore:

- SuperFinz should be a planning and consent layer, not the lender.
- Any offer must be labeled as a simulated regulated-partner offer.
- AI must not make or imply the approval decision.
- Credit revenue must not determine which recommendation appears first.

### Social protection

India’s official e-Shram architecture now provides a relevant route for identity and portable social-security access. SuperFinz can help users discover and understand benefits, but it should not claim enrollment or eligibility without integration. [PIB / Ministry of Labour, December 2025](https://www.pib.gov.in/FactsheetDetails.aspx?ModuleId=16&NoteId=150554&id=150554&lang=1&reg=37)

## 8. Business and investor story

### Customer value

- Fewer essential-payment shortfalls
- More work costs recognized before household spending
- Gradual growth in protected days
- Less need for small consumption-smoothing debt
- Clearer control over days off and work shocks

### Distribution

A plausible model is B2B2C:

- Gig platforms benefit from retention and worker stability.
- Banks gain an underserved, digitally active customer segment.
- Insurers and benefit providers gain consented distribution.
- Workers receive the core planning experience free or subsidized.

CGAP notes that embedded financial services can improve worker engagement and platform retention, but evidence is still early and context-specific. Treat this as a partnership hypothesis to test, not a guaranteed commercial outcome. [CGAP, *How Can Embedded Financial Services Better Serve Platform Workers?*](https://www.cgap.org/blog/how-can-embedded-financial-services-better-serve-platform-workers)

### Revenue alignment

Prefer:

- Platform or bank SaaS/integration fees
- Sponsored worker-wellness programs
- Transparent, consented referrals for regulated savings, insurance, tax, or credit products

Avoid building the model primarily on loan conversion. A credit-dependent revenue model would conflict with the promise to prevent distress before selling debt.

### Defensible data advantage

The useful moat is not an LLM. It is a consented, cross-source time series of:

- Settled and pending income
- True earning costs
- Commitment timing
- Allocation decisions
- Forecast error
- Cushion recovery
- Which interventions prevented a shortfall

That dataset can improve forecasts and personalization while remaining explainable. It must never become hidden surveillance.

## 9. Validation plan before making strong claims

The research evidence is sufficient to choose a prototype direction, but not to validate product-market fit.

Interview 8–12 workers across delivery, ride-hailing, home services, freelance, and informal cash work. Include women, migrants, and workers who use multiple platforms.

Test these questions:

1. Can users distinguish gross earnings from true net income?
2. Do they understand “₹620 safe until Friday” without explanation?
3. Which money must never be locked because it may be needed for work or emergencies?
4. Do they trust a payout-triggered allocation, and what control is required?
5. Is “protected days” more meaningful than a conventional savings target?
6. Which shortfall interventions feel useful versus judgmental?
7. Would they trust a tool independent of the platform they work for?

Prototype success measures:

- At least 80% correctly explain the safe amount and its time horizon.
- Users can identify protected commitments in under 10 seconds.
- Users notice that pending earnings are not available money.
- Users can edit and confirm an adaptive split without assistance.
- No participant interprets the Resilience Passport as a guaranteed credit score.
- No participant interprets simulated allocations, benefits, or credit as already executed.

## 10. Final recommendation

Build SuperFinz around one protected decision loop:

```text
EARN → REMOVE WORK COSTS → PROTECT WHAT IS DUE → SHOW WHAT IS SAFE
     → PREPARE FOR SHOCKS → BORROW ONLY IF A VERIFIED GAP REMAINS
```

This solves the actual behavior described in the evidence: workers already shape income, triage spending, harden money, and borrow to bridge timing gaps. SuperFinz makes that process visible, adaptive, and safer.

The best final pitch is:

> **Your bank shows your balance. SuperFinz shows what is truly yours to use—after protecting the work and commitments your next income depends on.**

## Research limitations

- Dvara’s detailed financial diaries covered only 22 workers for 14 days in Bengaluru and were largely male.
- The NITI workforce projection is based on limited data and is explicitly indicative.
- The product scan uses publicly described features as of 3 September 2026 and is not exhaustive.
- The research did not include new primary interviews conducted by the SuperFinz team.
- Forecasting, scoring, and intervention effectiveness must be tested before use in real financial decisions.

Research stopped when the core problem, relevant behavioral mechanisms, competitor categories, regulatory boundaries, and proposed differentiation had sufficient primary or credible evidence, and additional searches were returning variations of already-mapped solutions.
