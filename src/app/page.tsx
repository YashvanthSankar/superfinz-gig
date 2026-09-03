import Link from "next/link";
import { IncomeMorph } from "@/components/landing/income-morph";
import { Phone } from "@/components/landing/phone";
import { Reveal } from "@/components/landing/reveal";
import {
  BILLS,
  BILLS_TOTAL,
  DAILY_INCOME,
  MONTH_TOTAL,
  inr,
} from "@/components/landing/landing-data";
import styles from "./page.module.css";

const sources = ["Zomato", "Swiggy", "Cash", "Rain day", "Uber", "Zomato", "Swiggy", "Cash", "Uber", "Rain day"];
const ticker = DAILY_INCOME.slice(0, 10).map((amount, i) => ({
  day: i + 1,
  source: sources[i],
  amount,
}));

const steps = [
  {
    title: "Log the payout",
    body: "Add each settlement in seconds. UPI, cash, or platform, it all counts the same.",
  },
  {
    title: "It gets split",
    body: "Rent, EMI, fuel, safety cushion, savings, spend. You see the split before you confirm, and you can change it.",
  },
  {
    title: "You get one number",
    body: "Safe to spend, today and this week. Everything above it is already promised somewhere.",
  },
  {
    title: "Ask the coach",
    body: "Plain-language answers built on your real pattern. “Can I take Sunday off?” gets a number, not a lecture.",
  },
];

const problems = [
  {
    title: "Income arrives in pieces.",
    body: "Weekday settlements, weekend surges, rain days at zero. UPI, cash and platform payouts all land on different days.",
  },
  {
    title: "Bills arrive as one block.",
    body: "Rent on the 5th is three times your best day. EMI, electricity and school fees follow whether the week was good or not.",
  },
  {
    title: "Earning has its own costs.",
    body: "A flat tyre or an empty tank means no income tomorrow. Work money and home money share one wallet and vanish together.",
  },
];

const appFacts = [
  { k: "5 sec", v: "to log a payout" },
  { k: "Offline", v: "works without signal, syncs later" },
  { k: "8:00 am", v: "reminder the day before every due date" },
  { k: "0", v: "loans pushed at you" },
];

/* Mirrored chart geometry. One rupee scale for both halves so the size difference is honest. */
const CW = 1000;
const AXIS = 130;
const UNIT = 35; // rupees per SVG unit
const COLS = DAILY_INCOME.length;
const PADX = 8;
const GAP = 6;
const BW = (CW - PADX * 2 - GAP * (COLS - 1)) / COLS;
const CH = AXIS + Math.round(9000 / UNIT) + 70;
const colX = (day: number) => PADX + (day - 1) * (BW + GAP);

function StoreBadges({ tone }: { tone: "onNavy" | "onPaper" }) {
  return (
    <div className={`${styles.badges} ${tone === "onNavy" ? styles.badgesNavy : ""}`}>
      <a href="#app" className={styles.badge}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.3 3-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM14 5.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>
        <span><small>Download on the</small>App Store</span>
      </a>
      <a href="#app" className={styles.badge}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M3.6 2.4c-.3.3-.4.7-.4 1.2v16.8c0 .5.1.9.4 1.2l.1.1L13 12.3v-.2L3.7 2.3l-.1.1z"/><path fill="currentColor" opacity=".8" d="M16.1 15.5 13 12.3v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2.1h-.1z"/><path fill="currentColor" opacity=".6" d="M16.2 15.4 13 12.2 3.6 21.6c.4.4.9.4 1.6 0l11-6.2z"/><path fill="currentColor" opacity=".9" d="M16.2 8.9 5.2 2.7c-.7-.4-1.2-.3-1.6 0L13 12.2l3.2-3.3z"/></svg>
        <span><small>Get it on</small>Google Play</span>
      </a>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <Reveal />
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.wordmark}>SuperFinz</Link>
          <ul className={styles.navLinks}>
            <li><a href="#problem">Problem</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#app">The app</a></li>
          </ul>
          <div className={styles.navActions}>
            <a href="#app" className={styles.navButton}>Get the app</a>
          </div>
        </nav>
      </header>

      <div id="main-content">
        {/* ============ HERO ============ */}
        <section className={`${styles.band} ${styles.navy} ${styles.hero}`}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Now on iOS and Android</p>
              <h1 className={styles.h1}>
                <span>Every payout,</span>
                <span className={styles.h1Light}>a paycheck.</span>
              </h1>
              <p className={styles.lead}>
                SuperFinz is the salary layer for India&rsquo;s gig workers. It takes the money you
                actually earned this week, from UPI, cash and platform settlements, and turns it into
                one number you can safely spend today. Rent, EMI and fuel are already set aside.
              </p>
              <StoreBadges tone="onNavy" />
              <p className={styles.heroMeta}>
                <span>Free to start</span>
                <span aria-hidden="true">·</span>
                <span>No lending</span>
                <span aria-hidden="true">·</span>
                <span>Built in India</span>
              </p>
            </div>
            <div className={styles.heroVisual}>
              <Phone screen="today" className={styles.heroPhone} />
            </div>
          </div>
        </section>

        {/* ============ TICKER ============ */}
        <section className={`${styles.band} ${styles.navy} ${styles.tickerBand}`} aria-label="Example month of settlements">
          <div className={styles.ticker}>
            <ul className={styles.tickerTrack}>
              {[...ticker, ...ticker].map((t, i) => (
                <li key={`${t.day}-${i}`} aria-hidden={i >= ticker.length}>
                  <span className={styles.tickerDay}>{t.day} Sep</span>
                  <span>{t.source}</span>
                  <span className={t.amount === 0 ? styles.tickerZero : styles.tickerAmt}>{inr(t.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ PROBLEM ============ */}
        <section id="problem" className={`${styles.band} ${styles.paper}`}>
          <div className={styles.container}>
            <div className={styles.sectionHead} data-reveal>
              <p className={styles.eyebrow}>The problem</p>
              <h2 className={styles.h2}>
                Budgeting apps assume a salary.
                <br />
                7.7 million Indian gig workers don&rsquo;t have one.
              </h2>
              <p className={styles.sub}>
                NITI Aayog counts 7.7 million gig workers in India and expects 23.5 million by 2030.
                Every one of them earns a different amount every day and pays the same bills every
                month. Here is one real-looking month for a delivery partner.
              </p>
            </div>

            <figure className={styles.chart} data-reveal>
              <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chartSvg} role="img" aria-label={`Thirty days of earnings totalling ${inr(MONTH_TOTAL)} drawn above the line, and ${inr(BILLS_TOTAL)} of bills drawn below it on the same scale. Rent alone is taller than any day of income.`}>
                {DAILY_INCOME.map((v, i) => (
                  <rect key={`in-${i}`} x={colX(i + 1)} width={BW} y={AXIS - v / UNIT} height={v / UNIT} fill="var(--accent)" rx={1.5} />
                ))}
                {BILLS.map((b) => (
                  <g key={b.name}>
                    <rect x={colX(b.day)} width={BW} y={AXIS} height={b.amount / UNIT} fill="var(--ink)" rx={1.5} />
                    <text x={colX(b.day)} y={AXIS + b.amount / UNIT + 20} className={styles.chartLabel}>{b.name}</text>
                    <text x={colX(b.day)} y={AXIS + b.amount / UNIT + 38} className={styles.chartLabelStrong}>{inr(b.amount)}</text>
                  </g>
                ))}
                <line x1={0} x2={CW} y1={AXIS} y2={AXIS} stroke="var(--rule-strong)" />
                <text x={colX(14)} y={AXIS - 2750 / UNIT - 10} className={styles.chartLabel} textAnchor="middle">best day {inr(2750)}</text>
                <text x={colX(4) + BW / 2} y={AXIS - 10} className={styles.chartLabel} textAnchor="middle">₹0</text>
                <text x={PADX} y={AXIS + 16} className={styles.chartLabel}>Income ↑ · Bills ↓</text>
                <text x={CW - PADX} y={AXIS + 16} className={styles.chartLabel} textAnchor="end">same scale</text>
              </svg>
              <ul className={styles.billLegend} aria-hidden="true">
                {BILLS.map((b) => (
                  <li key={b.name}><span>{b.name} · {b.day} Sep</span><b>{inr(b.amount)}</b></li>
                ))}
              </ul>
              <figcaption className={styles.chartCaption}>
                <span>{inr(MONTH_TOTAL)} earned across 30 days.</span>
                <span>{inr(BILLS_TOTAL)} due on 5 of them.</span>
              </figcaption>
            </figure>

            <ul className={styles.threeUp} data-reveal>
              {problems.map((p) => (
                <li key={p.title}>
                  <h3 className={styles.h3}>{p.title}</h3>
                  <p>{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how" className={`${styles.band} ${styles.navy} ${styles.how}`}>
          <div className={styles.container}>
            <div className={styles.sectionHead} data-reveal>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.h2}>We smooth the month before you spend it.</h2>
            </div>
          </div>
          <div className={styles.container}>
            <IncomeMorph />
          </div>
          <div className={styles.container}>
            <ol className={styles.steps} data-reveal>
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className={styles.stepIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============ THE APP ============ */}
        <section id="app" className={`${styles.band} ${styles.paper}`}>
          <div className={`${styles.container} ${styles.appGrid}`}>
            <div className={styles.appCopy} data-reveal>
              <p className={styles.eyebrow}>Native iOS and Android</p>
              <h2 className={styles.h2}>Built for one hand, between rides.</h2>
              <p className={styles.sub}>
                Dark mode, offline-first, low-data. Reminders before every due date. Nothing to learn.
              </p>
              <dl className={styles.factList}>
                {appFacts.map((f) => (
                  <div key={f.v}>
                    <dt>{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
              <StoreBadges tone="onPaper" />
            </div>
            <div className={styles.phones} data-reveal>
              <Phone screen="split" className={styles.phoneL} />
              <Phone screen="today" className={styles.phoneC} />
              <Phone screen="bills" className={styles.phoneR} />
            </div>
          </div>
        </section>


        {/* ============ CTA ============ */}
        <section className={`${styles.band} ${styles.navy} ${styles.cta}`}>
          <div className={styles.container} data-reveal>
            <h2 className={styles.h1}>
              <span>Start tomorrow</span>
              <span className={styles.h1Light}>with one safe number.</span>
            </h2>
            <StoreBadges tone="onNavy" />
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerGrid}`}>
          <Link href="/" className={styles.wordmark}>SuperFinz</Link>
          <ul className={styles.footerLinks}>
            <li><a href="#problem">Problem</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#app">The app</a></li>
          </ul>
          <p className={styles.footerNote}>
            Financial resilience for irregular earners. © {new Date().getFullYear()} SuperFinz.
          </p>
        </div>
      </footer>
    </main>
  );
}
