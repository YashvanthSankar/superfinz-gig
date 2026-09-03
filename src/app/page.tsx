import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Bike,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  Car,
  CircleGauge,
  IndianRupee,
  LockKeyhole,
  Package,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingDown,
  Utensils,
  WalletCards,
  Zap,
} from "lucide-react";
import styles from "./page.module.css";

const problems = [
  {
    icon: TrendingDown,
    stat: "₹0 → ₹1,800",
    title: "Income swings every day",
    body: "A rainy Tuesday pays nothing. A festival weekend pays triple. Platform payouts, UPI, and cash all land on different days.",
  },
  {
    icon: CalendarCheck,
    stat: "Due on the 5th",
    title: "Bills never swing",
    body: "Rent, EMI, electricity, school fees. They arrive on a fixed date whether the week was good or not.",
  },
  {
    icon: BriefcaseBusiness,
    stat: "Fuel, fees, repairs",
    title: "Earning costs money",
    body: "A flat tyre or an empty tank means no income tomorrow. Work costs get mixed with personal spending and vanish.",
  },
];

const solution = [
  {
    icon: CircleGauge,
    title: "One safe-to-spend number",
    body: "Open the app, see exactly what you can spend today after every bill and work cost is protected. No spreadsheets. No guessing.",
  },
  {
    icon: IndianRupee,
    title: "Auto-split every payout",
    body: "Each settlement is divided across bills, work costs, a safety buffer, savings, and spending. Set once, runs forever.",
  },
  {
    icon: ReceiptText,
    title: "Bill shield",
    body: "Upcoming essentials are reserved before their due date. Money for rent is locked away before it can leak.",
  },
  {
    icon: Sparkles,
    title: "A coach that knows gig work",
    body: "Ask in plain language. Get straight answers built on your actual income pattern, not generic advice.",
  },
];

const workers = [
  { icon: Bike, label: "Delivery riders" },
  { icon: Car, label: "Cab drivers" },
  { icon: Package, label: "Couriers" },
  { icon: Utensils, label: "Food partners" },
  { icon: Smartphone, label: "Freelancers" },
  { icon: Zap, label: "Daily-wage pros" },
];

const marquee = [
  "Safe to spend",
  "Bill shield",
  "Payout split",
  "Work-cost pocket",
  "Safety buffer",
  "Gig coach",
  "iOS",
  "Android",
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <div className={styles.bgGlowA} aria-hidden="true" />
      <div className={styles.bgGlowB} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand} aria-label="SuperFinz home">
            <span className={styles.brandMark}>S</span>
            <span>SuperFinz</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#app">The app</a>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.signInLink}>
              Sign in
            </Link>
            <Link href="/demo" className={styles.navCta}>
              Try the demo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <div id="main-content">
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.pill}>
              <span className={styles.pillDot} />
              Now on iOS &amp; Android
            </div>
            <h1 className={styles.heroTitle}>
              A salary layer
              <br />
              for people
              <br />
              <span className={styles.heroGradient}>without salaries.</span>
            </h1>
            <p className={styles.heroLead}>
              SuperFinz turns unpredictable gig income into one calm number you
              can trust every morning. Bills protected. Work costs covered. Spend
              the rest without fear.
            </p>
            <div className={styles.heroActions}>
              <a href="#app" className={styles.storeButton}>
                <Apple size={22} aria-hidden="true" />
                <span>
                  <small>Download on the</small>
                  App Store
                </span>
              </a>
              <a href="#app" className={styles.storeButton}>
                <PlayIcon />
                <span>
                  <small>Get it on</small>
                  Google Play
                </span>
              </a>
              <Link href="/demo" className={styles.ghostButton}>
                Open web demo
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <ul className={styles.heroProof}>
              <li>
                <Check size={14} aria-hidden="true" /> Built for Indian gig
                workers
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Works with UPI, cash &amp;
                platform payouts
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Free to start
              </li>
            </ul>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.phone}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <div className={styles.screenTop}>
                  <span>Good morning, Ravi</span>
                  <span className={styles.screenBadge}>Tue</span>
                </div>
                <div className={styles.screenSafe}>
                  <small>Safe to spend today</small>
                  <strong>₹640</strong>
                  <em>after ₹3,200 protected</em>
                </div>
                <div className={styles.screenRow}>
                  <span>Rent · 5 Sep</span>
                  <b className={styles.ok}>Reserved</b>
                </div>
                <div className={styles.screenRow}>
                  <span>Bike EMI · 8 Sep</span>
                  <b className={styles.ok}>Reserved</b>
                </div>
                <div className={styles.screenRow}>
                  <span>Fuel pocket</span>
                  <b>₹1,100</b>
                </div>
                <div className={styles.screenRow}>
                  <span>Safety buffer</span>
                  <b>₹2,450</b>
                </div>
                <div className={styles.screenBar}>
                  <i style={{ width: "62%" }} />
                </div>
                <div className={styles.screenCoach}>
                  <Sparkles size={12} aria-hidden="true" />
                  Payout of ₹2,900 landed. Split it?
                </div>
              </div>
            </div>
            <div className={`${styles.floatCard} ${styles.floatA}`}>
              <ShieldCheck size={16} aria-hidden="true" />
              Rent locked in
            </div>
            <div className={`${styles.floatCard} ${styles.floatB}`}>
              <IndianRupee size={16} aria-hidden="true" />
              Payout split in 1 tap
            </div>
            <div className={`${styles.floatCard} ${styles.floatC}`}>
              <CircleGauge size={16} aria-hidden="true" />
              Safe number updated
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className={styles.marquee} aria-hidden="true">
          <div className={styles.marqueeTrack}>
            {[...marquee, ...marquee].map((item, i) => (
              <span key={`${item}-${i}`}>
                {item}
                <i>✦</i>
              </span>
            ))}
          </div>
        </div>

        {/* WHO */}
        <section className={styles.who}>
          <p className={styles.whoTitle}>Made for the people who keep India moving</p>
          <ul className={styles.whoList}>
            {workers.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* PROBLEM */}
        <section id="problem" className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>The problem</span>
            <h2>
              Irregular income. <span className={styles.strike}>Regular</span>{" "}
              <span className={styles.heroGradient}>relentless</span> bills.
            </h2>
            <p>
              Over 12 million gig workers in India earn a different amount every
              single day. Every budgeting app assumes a salary. So none of them
              work.
            </p>
          </div>
          <div className={styles.grid3}>
            {problems.map(({ icon: Icon, stat, title, body }) => (
              <article key={title} className={styles.problemCard}>
                <div className={styles.cardIcon}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <span className={styles.cardStat}>{stat}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className={styles.problemPunch}>
            <WalletCards size={20} aria-hidden="true" />
            <p>
              The result: a good week gets spent, a bad week borrows, and rent is
              always a surprise. <strong>That is the problem we kill.</strong>
            </p>
          </div>
        </section>

        {/* SOLUTION */}
        <section id="solution" className={`${styles.section} ${styles.sectionSolution}`}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>The solution</span>
            <h2>
              We turn every payout into a{" "}
              <span className={styles.heroGradient}>paycheck.</span>
            </h2>
            <p>
              SuperFinz sits between your earnings and your spending. Money comes
              in messy. It goes out planned.
            </p>
          </div>
          <div className={styles.grid4}>
            {solution.map(({ icon: Icon, title, body }, i) => (
              <article key={title} className={styles.solutionCard}>
                <span className={styles.stepNum}>0{i + 1}</span>
                <div className={styles.cardIcon}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* APP */}
        <section id="app" className={styles.appSection}>
          <div className={styles.appInner}>
            <div className={styles.appCopy}>
              <span className={styles.eyebrow}>Native iOS &amp; Android app</span>
              <h2>
                Sleek. Fast.
                <br />
                Built for one-handed use
                <br />
                between rides.
              </h2>
              <ul className={styles.appList}>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Log a payout in under 5 seconds
                </li>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Dark mode, offline-first, low-data
                </li>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Reminders before every due date
                </li>
                <li>
                  <Check size={16} aria-hidden="true" />
                  Plain-language coach, no jargon
                </li>
              </ul>
              <div className={styles.heroActions}>
                <a href="#app" className={styles.storeButton}>
                  <Apple size={22} aria-hidden="true" />
                  <span>
                    <small>Download on the</small>
                    App Store
                  </span>
                </a>
                <a href="#app" className={styles.storeButton}>
                  <PlayIcon />
                  <span>
                    <small>Get it on</small>
                    Google Play
                  </span>
                </a>
              </div>
              <p className={styles.appNote}>
                <LockKeyhole size={14} aria-hidden="true" />
                Your data stays yours. No lending, no selling, no spam.
              </p>
            </div>
            <div className={styles.appPhones} aria-hidden="true">
              <div className={`${styles.miniPhone} ${styles.miniA}`}>
                <div className={styles.miniHead}>Split payout</div>
                <div className={styles.miniAmount}>₹2,900</div>
                <div className={styles.miniRow}><span>Bills</span><b>₹1,200</b></div>
                <div className={styles.miniRow}><span>Work</span><b>₹500</b></div>
                <div className={styles.miniRow}><span>Safety</span><b>₹400</b></div>
                <div className={styles.miniRow}><span>Savings</span><b>₹300</b></div>
                <div className={styles.miniRow}><span>Spend</span><b>₹500</b></div>
                <div className={styles.miniBtn}>Confirm split</div>
              </div>
              <div className={`${styles.miniPhone} ${styles.miniB}`}>
                <div className={styles.miniHead}>This week</div>
                <div className={styles.miniBars}>
                  {[40, 70, 30, 90, 55, 80, 65].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className={styles.miniRow}><span>Earned</span><b>₹6,340</b></div>
                <div className={styles.miniRow}><span>Protected</span><b className={styles.ok}>₹3,200</b></div>
                <div className={styles.miniRow}><span>Safe</span><b>₹640/day</b></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <h2>
            Stop guessing.
            <br />
            Start every day with one safe number.
          </h2>
          <div className={styles.heroActions}>
            <Link href="/demo" className={styles.primaryButton}>
              Try the live demo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#app" className={styles.ghostButton}>
              Get the app
            </a>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href="/" className={styles.brand} aria-label="SuperFinz home">
            <span className={styles.brandMark}>S</span>
            <span>SuperFinz</span>
          </Link>
          <div className={styles.footerLinks}>
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#app">App</a>
            <Link href="/demo">Demo</Link>
            <Link href="/login">Sign in</Link>
          </div>
          <p>© {new Date().getFullYear()} SuperFinz. Financial resilience for irregular earners.</p>
        </div>
      </footer>
    </main>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 3.5v17l9.5-8.5L4 3.5z" fill="#34a853" />
      <path d="M4 3.5l9.5 8.5 3-2.7L5.5 3.2A1.2 1.2 0 0 0 4 3.5z" fill="#4285f4" />
      <path d="M4 20.5l9.5-8.5 3 2.7-11 6.1A1.2 1.2 0 0 1 4 20.5z" fill="#ea4335" />
      <path d="M13.5 12l3-2.7 3.2 1.8c.9.5.9 1.3 0 1.8l-3.2 1.8-3-2.7z" fill="#fbbc04" />
    </svg>
  );
}
