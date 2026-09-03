import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  CircleGauge,
  IndianRupee,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import styles from "./page.module.css";

const problems = [
  {
    icon: WalletCards,
    title: "Income arrives unevenly",
    body: "Platform payouts, UPI, bank transfers, and cash all arrive on different days.",
  },
  {
    icon: CalendarCheck,
    title: "Bills stay fixed",
    body: "Rent, electricity, gas, school fees, and EMIs do not wait for a good week.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Work has daily costs",
    body: "Fuel, platform fees, repairs, and supplies must be protected to keep earning.",
  },
];

const features = [
  {
    icon: CircleGauge,
    title: "Safe to spend",
    body: "One clear amount for today, after protecting what you must pay.",
  },
  {
    icon: ReceiptText,
    title: "Bill protection",
    body: "See upcoming essentials together and reserve money before each due date.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Work-cost protection",
    body: "Keep fuel, fees, and maintenance separate from personal spending.",
  },
  {
    icon: IndianRupee,
    title: "Payout planning",
    body: "Split each settled payout across bills, work, safety, savings, and spending.",
  },
];

const steps = [
  {
    title: "Add income and bills",
    body: "Enter earnings, payout dates, and the essentials your household depends on.",
  },
  {
    title: "SuperFinz protects the basics",
    body: "The plan sets aside bills, work costs, and your chosen safety buffer first.",
  },
  {
    title: "Use one safe number",
    body: "Check what is safe today and plan the next payout without complex budgeting.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand} aria-label="SuperFinz home">
            <span className={styles.brandMark} aria-hidden="true">
              S
            </span>
            <span>SuperFinz</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#solution">Solution</a>
            <a href="#how-it-works">How it works</a>
            <a href="#trust">Trust</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.signInLink}>
              Sign in
            </Link>
            <Link href="/demo" className={styles.navCta}>
              Try the demo
              <ArrowRight aria-hidden="true" size={17} strokeWidth={2.2} />
            </Link>
          </div>
        </nav>
      </header>

      <div id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Built for gig and informal workers</p>
            <h1 id="hero-title">
              Know what you can safely spend, even when income changes.
            </h1>
            <p className={styles.heroText}>
              SuperFinz turns irregular earnings, household bills, and work
              costs into one simple daily money plan.
            </p>

            <div className={styles.heroActions}>
              <Link href="/demo" className={styles.primaryButton}>
                Open the demo
                <ArrowRight aria-hidden="true" size={19} strokeWidth={2.2} />
              </Link>
              <a href="#how-it-works" className={styles.secondaryButton}>
                See how it works
              </a>
            </div>

            <div className={styles.heroNote}>
              <ShieldCheck aria-hidden="true" size={19} strokeWidth={2} />
              <span>
                Hackathon prototype. No real money moves and no loan is created.
              </span>
            </div>
          </div>

          <DashboardPreview />
        </section>

        <section
          className={styles.problemSection}
          aria-labelledby="problem-title"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The problem</p>
            <h2 id="problem-title">
              A bank balance does not show what is already spoken for.
            </h2>
            <p>
              When income changes every week, a normal monthly budget can
              quickly become outdated.
            </p>
          </div>

          <div className={styles.problemGrid}>
            {problems.map(({ icon: Icon, title, body }) => (
              <article className={styles.problemCard} key={title}>
                <span className={styles.iconTile} aria-hidden="true">
                  <Icon size={23} strokeWidth={1.9} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="solution"
          className={styles.solutionSection}
          aria-labelledby="solution-title"
        >
          <div className={styles.solutionIntro}>
            <div>
              <p className={styles.eyebrow}>One-stop dashboard</p>
              <h2 id="solution-title">
                One place to decide what to do with every rupee.
              </h2>
            </div>
            <p>
              SuperFinz starts with money that has actually arrived. It protects
              the essentials, then shows the amount left to use.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map(({ icon: Icon, title, body }) => (
              <article className={styles.featureCard} key={title}>
                <Icon aria-hidden="true" size={25} strokeWidth={1.8} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>

          <div className={styles.formulaCard}>
            <div>
              <p className={styles.formulaLabel}>Simple and explainable</p>
              <h3>Safe to spend is not a mystery score.</h3>
            </div>
            <div className={styles.formula} aria-label="Safe to spend formula">
              <span>Settled money</span>
              <span aria-hidden="true">−</span>
              <span>Bills</span>
              <span aria-hidden="true">−</span>
              <span>Work costs</span>
              <span aria-hidden="true">−</span>
              <span>Safety buffer</span>
              <span aria-hidden="true">=</span>
              <strong>Safe to spend</strong>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className={styles.howSection}
          aria-labelledby="how-title"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-title">A useful plan in three simple steps.</h2>
          </div>

          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="trust"
          className={styles.trustSection}
          aria-labelledby="trust-title"
        >
          <div className={styles.trustCopy}>
            <span className={styles.trustIcon} aria-hidden="true">
              <LockKeyhole size={26} strokeWidth={1.8} />
            </span>
            <p className={styles.eyebrow}>Responsible by design</p>
            <h2 id="trust-title">Clear guidance without hidden decisions.</h2>
            <p>
              The prototype keeps expected income separate, explains every
              calculation, and puts non-credit actions before borrowing.
            </p>
          </div>

          <ul className={styles.trustList}>
            <li>
              <Check aria-hidden="true" size={18} />
              Settled and expected income are clearly separated
            </li>
            <li>
              <Check aria-hidden="true" size={18} />
              Users choose and can change their protected amounts
            </li>
            <li>
              <Check aria-hidden="true" size={18} />
              No guaranteed income, hidden credit score, or automatic loan
            </li>
            <li>
              <Check aria-hidden="true" size={18} />
              Prototype data is labeled everywhere it appears
            </li>
          </ul>
        </section>

        <section className={styles.finalCta} aria-labelledby="cta-title">
          <p className={styles.eyebrow}>See SuperFinz in action</p>
          <h2 id="cta-title">Make the next payout easier to plan.</h2>
          <p>Explore a complete sample dashboard with no sign-in or setup.</p>
          <Link href="/demo" className={styles.primaryButton}>
            Explore the demo
            <ArrowRight aria-hidden="true" size={19} strokeWidth={2.2} />
          </Link>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link href="/" className={styles.brand} aria-label="SuperFinz home">
              <span className={styles.brandMark} aria-hidden="true">
                S
              </span>
              <span>SuperFinz</span>
            </Link>
            <p>Financial resilience for people with irregular incomes.</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#solution">Solution</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/demo">Demo</Link>
            <span>Innovation Unbound prototype</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <aside
      className={styles.dashboard}
      aria-label="Example SuperFinz dashboard"
    >
      <div className={styles.dashboardTopbar}>
        <div>
          <p>Today&apos;s plan</p>
          <span>Example dashboard · Ravi</span>
        </div>
        <span className={styles.prototypeBadge}>Prototype</span>
      </div>

      <div className={styles.safeCard}>
        <span>Safe to spend today</span>
        <strong>₹620</strong>
        <p>Protected until Friday</p>
      </div>

      <div className={styles.moneySummary}>
        <div>
          <span>Money available</span>
          <strong>₹6,800</strong>
        </div>
        <div>
          <span>Next expected payout</span>
          <strong>₹2,100–₹3,400</strong>
          <small>Not included yet</small>
        </div>
      </div>

      <div className={styles.protectedBlock}>
        <div className={styles.protectedHeading}>
          <span>Already protected</span>
          <strong>₹6,180</strong>
        </div>
        <div className={styles.protectionBar} aria-hidden="true">
          <span className={styles.billBar} />
          <span className={styles.workBar} />
          <span className={styles.bufferBar} />
          <span className={styles.safeBar} />
        </div>
        <ul className={styles.protectionList}>
          <li>
            <span>
              <i className={styles.billDot} />
              Bills due
            </span>
            <strong>₹3,950</strong>
          </li>
          <li>
            <span>
              <i className={styles.workDot} />
              Work costs
            </span>
            <strong>₹1,230</strong>
          </li>
          <li>
            <span>
              <i className={styles.bufferDot} />
              Safety buffer
            </span>
            <strong>₹1,000</strong>
          </li>
        </ul>
      </div>

      <div className={styles.nextAction}>
        <ShieldCheck aria-hidden="true" size={20} />
        <div>
          <strong>Your bills and work are covered.</strong>
          <span>₹620 is available for flexible spending.</span>
        </div>
      </div>
    </aside>
  );
}
