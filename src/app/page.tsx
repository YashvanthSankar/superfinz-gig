import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CircleCheck,
  Fuel,
  Gauge,
  HandCoins,
  IndianRupee,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  WalletCards,
  WifiOff,
  Zap,
} from "lucide-react";
import { Phone } from "@/components/landing/phone";
import { Reveal } from "@/components/landing/reveal";
import { DemoVideo } from "@/components/landing/demo-video";
import { DAILY_INCOME, MONTH_TOTAL, inr } from "@/components/landing/landing-data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "SuperFinz — Every payout, planned",
  description:
    "A one-stop money dashboard that turns irregular gig income into protected bills, work money, savings, and one safe-to-spend number.",
};

const workflow = [
  {
    number: "01",
    title: "Add what came in",
    body: "Log UPI, cash, or a platform payout in a few taps.",
    icon: HandCoins,
  },
  {
    number: "02",
    title: "Tell us what matters",
    body: "Add rent, EMI, school fees, fuel, and goals once.",
    icon: CalendarDays,
  },
  {
    number: "03",
    title: "Review the split",
    body: "SuperFinz suggests amounts. You stay in control and confirm.",
    icon: SlidersHorizontal,
  },
  {
    number: "04",
    title: "Spend with confidence",
    body: "See one safe number after tomorrow’s work and bills are protected.",
    icon: ShieldCheck,
  },
] as const;

const productBenefits = [
  {
    icon: Gauge,
    title: "Safe to spend",
    body: "A simple daily and weekly number, explained line by line.",
  },
  {
    icon: WalletCards,
    title: "Everything in one place",
    body: "Payouts, cash, bills, fuel, savings, and goals on one dashboard.",
  },
  {
    icon: BellRing,
    title: "Useful reminders",
    body: "A clear nudge before a bill is due—not a flood of notifications.",
  },
] as const;

const trustItems = [
  {
    icon: LockKeyhole,
    title: "Your money, your approval",
    body: "Every suggested split is visible and editable before it is saved.",
  },
  {
    icon: WifiOff,
    title: "Ready for weak networks",
    body: "Essential actions remain simple and the mobile app can sync later.",
  },
  {
    icon: Users,
    title: "Made for real households",
    body: "Plain language, large touch targets, and no finance jargon required.",
  },
  {
    icon: PiggyBank,
    title: "Resilience before credit",
    body: "We protect bills and a safety cushion before suggesting borrowing.",
  },
] as const;

const incomeBars = DAILY_INCOME.slice(0, 14);
const maxIncome = Math.max(...incomeBars);

function Brand() {
  return (
    <span className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">
        <Image
          src="/superfinz-mark.webp"
          alt=""
          width={34}
          height={34}
          className={styles.brandIcon}
        />
      </span>
      <span>SuperFinz</span>
    </span>
  );
}

function Arrow() {
  return <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />;
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Reveal />
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brandLink} aria-label="SuperFinz home">
            <Brand />
          </Link>
          <ul className={styles.navLinks}>
            <li><a href="#problem">The problem</a></li>
            <li><a href="#solution">How it works</a></li>
            <li><a href="#product">Product</a></li>
            <li><a href="#impact">Why it matters</a></li>
          </ul>
          <a href="#demo" className={styles.navCta}>
            Live demo <Arrow />
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.pill}>
                <Sparkles size={14} aria-hidden="true" />
                Innovation Unbound · Financial resilience
              </p>
              <h1>
                Gig income is irregular.
                <span>Your life doesn’t have to be.</span>
              </h1>
              <p className={styles.heroLead}>
                SuperFinz turns every payout into a simple plan—protecting bills,
                work costs, savings, and showing exactly what is safe to spend.
              </p>
              <div className={styles.heroActions}>
                <a href="#demo" className={styles.primaryButton}>
                  Watch the product demo <Arrow />
                </a>
                <a href="#solution" className={styles.secondaryButton}>
                  See how it works
                </a>
              </div>
              <ul className={styles.heroTrust} aria-label="Product principles">
                <li><CircleCheck size={16} aria-hidden="true" /> No forced loans</li>
                <li><CircleCheck size={16} aria-hidden="true" /> You approve every split</li>
                <li><CircleCheck size={16} aria-hidden="true" /> iOS · Android · Web</li>
              </ul>
            </div>

            <div className={styles.heroVisual}>
              <figure className={styles.photoFrame}>
                <Image
                  src="/superfinz-worker-hero.webp"
                  alt="A gig worker checking his phone beside his scooter before starting work"
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 52vw"
                  className={styles.heroImage}
                />
                <figcaption className={styles.photoCaption}>
                  Built around the way gig workers actually earn
                </figcaption>
              </figure>

              <div className={styles.incomeToast} aria-hidden="true">
                <span className={styles.toastIcon}><IndianRupee size={17} /></span>
                <span><small>Payout added</small><strong>+₹2,900</strong></span>
                <span className={styles.toastCheck}><Check size={14} /></span>
              </div>

              <div className={styles.safeCard} aria-label="Example safe-to-spend amount">
                <div className={styles.safeCardTop}>
                  <span>Safe to spend</span>
                  <span className={styles.liveDot}>Live</span>
                </div>
                <strong>₹3,010</strong>
                <p>₹430 a day until Sunday</p>
                <div className={styles.safeTrack} aria-hidden="true"><span /></div>
                <div className={styles.safeFoot}>
                  <span><ShieldCheck size={14} /> Bills protected</span>
                  <b>₹8,450</b>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.container} ${styles.heroBottom}`}>
            <span>One calm dashboard for</span>
            <ul>
              <li>Delivery partners</li>
              <li>Drivers</li>
              <li>Freelancers</li>
              <li>Home-service workers</li>
            </ul>
          </div>
        </section>

        <section id="demo" className={styles.demoSection}>
          <div className={styles.demoGlow} aria-hidden="true" />
          <div className={styles.container}>
            <div className={styles.demoIntro} data-reveal>
              <div>
                <p className={styles.eyebrow}>Product walkthrough</p>
                <h2>See the complete app in action.</h2>
              </div>
              <p>
                From first sign-in to a clear money plan—watch the working SuperFinz
                mobile experience exactly as it was built for the hackathon.
              </p>
            </div>

            <div className={styles.demoEnvironment} data-reveal>
              <div className={styles.demoChrome} aria-hidden="true">
                <span /><span /><span />
                <p>SuperFinz · Product demo</p>
                <b>2× · 01:42</b>
              </div>
              <div className={styles.demoCanvas}>
                <div className={styles.demoCalloutLeft} aria-hidden="true">
                  <span>01</span>
                  <p>Simple onboarding</p>
                  <i />
                  <span>02</span>
                  <p>Bills &amp; income</p>
                </div>

                <div className={styles.videoPhone}>
                  <div className={styles.videoSpeaker} aria-hidden="true" />
                  <DemoVideo className={styles.demoVideo} />
                </div>

                <div className={styles.demoCalloutRight} aria-hidden="true">
                  <span>03</span>
                  <p>Smart payout split</p>
                  <i />
                  <span>04</span>
                  <p>Safe to spend</p>
                </div>
              </div>
              <div className={styles.demoFooter}>
                <p><span>●</span> Real product capture</p>
                <p>iOS interface · Full journey · Plays at 2×</p>
              </div>
            </div>
          </div>
        </section>

        <section id="problem" className={styles.problemSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro} data-reveal>
              <p className={styles.eyebrow}>The problem we found</p>
              <h2>Most money tools wait for a monthly salary.</h2>
              <p>
                Gig workers earn daily, pay monthly, and spend money today to earn
                again tomorrow. That mismatch—not a lack of discipline—is the problem.
              </p>
            </div>

            <div className={styles.problemGrid} data-reveal>
              <article className={`${styles.problemCard} ${styles.incomeCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.iconBox}><Zap size={20} /></span>
                  <span>01 · Income</span>
                </div>
                <h3>There is no payday.</h3>
                <p>Good days, slow days, cash, and several platform settlements.</p>
                <div className={styles.miniChart} aria-label="Example of uneven income over fourteen days">
                  {incomeBars.map((value, index) => (
                    <span
                      key={`${value}-${index}`}
                      style={{ height: `${Math.max(7, Math.round((value / maxIncome) * 100))}%` }}
                      className={value === 0 ? styles.zeroBar : undefined}
                    />
                  ))}
                </div>
                <div className={styles.chartMeta}><span>14 days</span><b>{inr(incomeBars.reduce<number>((sum, value) => sum + value, 0))}</b></div>
              </article>

              <article className={`${styles.problemCard} ${styles.billCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.iconBox}><CalendarDays size={20} /></span>
                  <span>02 · Obligations</span>
                </div>
                <h3>Bills still arrive all at once.</h3>
                <p>Rent can be larger than the best earning day of the month.</p>
                <div className={styles.billCompare}>
                  <div><span>Best earning day</span><i style={{ width: "31%" }} /><b>₹2,750</b></div>
                  <div><span>Monthly rent</span><i style={{ width: "100%" }} /><b>₹9,000</b></div>
                </div>
              </article>

              <article className={`${styles.problemCard} ${styles.workCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.iconBox}><Fuel size={20} /></span>
                  <span>03 · Work costs</span>
                </div>
                <h3>Tomorrow’s income costs money today.</h3>
                <p>Fuel, data, maintenance, and repairs compete with home expenses.</p>
                <div className={styles.workCostVisual}>
                  <span><Fuel size={18} /> Fuel <b>₹500</b></span>
                  <span><Gauge size={18} /> Repair fund <b>₹350</b></span>
                  <div><span>Protected for tomorrow</span><strong>₹850</strong></div>
                </div>
              </article>
            </div>

            <div className={styles.problemProof} data-reveal>
              <p><strong>7.7 million</strong> gig workers were estimated in India in 2020–21.</p>
              <span aria-hidden="true" />
              <p><strong>23.5 million</strong> are projected by 2029–30.</p>
              <small>Source: NITI Aayog, India’s Booming Gig and Platform Economy</small>
            </div>
          </div>
        </section>

        <section id="solution" className={styles.solutionSection}>
          <div className={styles.container}>
            <div className={`${styles.sectionIntro} ${styles.solutionIntro}`} data-reveal>
              <p className={styles.eyebrow}>The SuperFinz solution</p>
              <h2>A salary-like rhythm, without needing a salary.</h2>
              <p>
                One guided flow turns scattered payouts into decisions a person can
                understand and act on immediately.
              </p>
            </div>

            <ol className={styles.workflow} data-reveal>
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.number}>
                    <span className={styles.workflowNumber}>{step.number}</span>
                    <span className={styles.workflowIcon}><Icon size={23} /></span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </li>
                );
              })}
            </ol>

            <div className={styles.safeDemo} data-reveal>
              <div className={styles.safeDemoCopy}>
                <p className={styles.eyebrow}>Our key innovation</p>
                <h2>One number that answers, “Can I spend this?”</h2>
                <p>
                  Safe to spend is not an AI guess. It is a transparent calculation
                  based on money available, upcoming bills, earning costs, and the
                  safety contribution the worker chose.
                </p>
                <div className={styles.formula}>
                  <span>Money now</span><b>−</b><span>Bills</span><b>−</b><span>Work</span><b>−</b><span>Safety</span><b>=</b><strong>Safe</strong>
                </div>
              </div>

              <div className={styles.safePanel}>
                <div className={styles.panelLabel}><span>This week</span><span>Updated now</span></div>
                <div className={styles.safeNumber}>
                  <span>Safe to spend</span>
                  <strong>₹3,010</strong>
                  <p>₹430 per day for the next 7 days</p>
                </div>
                <div className={styles.allocationBar} aria-label="₹11,460 split between bills, work, safety, and safe to spend">
                  <span className={styles.allocBills} />
                  <span className={styles.allocWork} />
                  <span className={styles.allocSafety} />
                  <span className={styles.allocSafe} />
                </div>
                <dl className={styles.allocationList}>
                  <div><dt><i className={styles.dotBills} /> Money now</dt><dd>₹11,460</dd></div>
                  <div><dt><i className={styles.dotBills} /> Bills protected</dt><dd>−₹5,900</dd></div>
                  <div><dt><i className={styles.dotWork} /> Work protected</dt><dd>−₹1,450</dd></div>
                  <div><dt><i className={styles.dotSafety} /> Safety contribution</dt><dd>−₹1,100</dd></div>
                  <div className={styles.totalRow}><dt><i className={styles.dotSafe} /> Safe to spend</dt><dd>₹3,010</dd></div>
                </dl>
                <p className={styles.panelNote}><ShieldCheck size={15} /> Nothing moves until the worker confirms.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className={styles.productSection}>
          <div className={`${styles.container} ${styles.productGrid}`}>
            <div className={styles.productCopy} data-reveal>
              <p className={styles.eyebrow}>The one-stop dashboard</p>
              <h2>Everything useful. Nothing overwhelming.</h2>
              <p className={styles.productLead}>
                The product is designed for a five-second glance between jobs,
                with deeper detail only when someone asks for it.
              </p>
              <ul className={styles.benefitList}>
                {productBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.title}>
                      <span><Icon size={21} /></span>
                      <div><h3>{benefit.title}</h3><p>{benefit.body}</p></div>
                    </li>
                  );
                })}
              </ul>
              <a href="#demo" className={styles.textButton}>
                Watch the full product demo <Arrow />
              </a>
            </div>

            <div className={styles.phoneStage} data-reveal>
              <div className={styles.phoneHalo} aria-hidden="true" />
              <Phone screen="bills" className={styles.phoneBackLeft} />
              <Phone screen="today" className={styles.phoneFront} />
              <Phone screen="split" className={styles.phoneBackRight} />
              <p className={styles.platformBadge}><span>●</span> Native app · iOS &amp; Android</p>
            </div>
          </div>
        </section>

        <section className={styles.trustSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro} data-reveal>
              <p className={styles.eyebrow}>Designed for trust</p>
              <h2>Simple enough for a first-time finance app.</h2>
              <p>
                Clear words, reversible choices, and calm guidance make SuperFinz
                usable across ages and levels of digital confidence.
              </p>
            </div>
            <div className={styles.trustGrid} data-reveal>
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title}>
                    <span><Icon size={23} /></span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="impact" className={styles.impactSection}>
          <div className={styles.container}>
            <div className={`${styles.sectionIntro} ${styles.impactIntro}`} data-reveal>
              <p className={styles.eyebrow}>Why this can scale</p>
              <h2>Better daily decisions create stronger financial futures.</h2>
            </div>
            <div className={styles.impactGrid} data-reveal>
              <article>
                <span className={styles.impactIcon}><Users size={22} /></span>
                <p className={styles.impactFor}>For workers</p>
                <h3>Fewer bill shocks. More control.</h3>
                <p>Turn uncertain weeks into visible, achievable next steps.</p>
              </article>
              <article>
                <span className={styles.impactIcon}><Building2 size={22} /></span>
                <p className={styles.impactFor}>For financial institutions</p>
                <h3>A fairer view of irregular cash flow.</h3>
                <p>Consent-based patterns can support timely, responsible help.</p>
              </article>
              <article>
                <span className={styles.impactIcon}><ShieldCheck size={22} /></span>
                <p className={styles.impactFor}>For the ecosystem</p>
                <h3>Resilience before financial distress.</h3>
                <p>Prevention becomes part of everyday money management.</p>
              </article>
            </div>

            <div className={styles.metricRail} data-reveal>
              <div><strong>5 sec</strong><span>to add a payout</span></div>
              <div><strong>1</strong><span>number to guide spending</span></div>
              <div><strong>0</strong><span>loans pushed by design</span></div>
              <div><strong>{inr(MONTH_TOTAL)}</strong><span>sample irregular month understood</span></div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalGlow} aria-hidden="true" />
          <div className={styles.container} data-reveal>
            <p className={styles.pill}>Built for Innovation Unbound</p>
            <h2>Every payout can become progress.</h2>
            <p>
              Experience the working SuperFinz dashboard—from onboarding and bills
              to smart payout splits and money coaching.
            </p>
            <div className={styles.finalActions}>
              <a href="#demo" className={styles.finalPrimary}>
                Watch product demo <Arrow />
              </a>
              <a
                href="https://github.com/YashvanthSankar/superfinz-gig"
                target="_blank"
                rel="noreferrer"
                className={styles.finalSecondary}
              >
                View the build
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerTop}`}>
          <div>
            <Brand />
            <p>A salary layer for people without salaries.</p>
          </div>
          <div className={styles.footerStatus}>
            <span>●</span> Working prototype · Web, iOS &amp; Android
          </div>
        </div>
        <div className={`${styles.container} ${styles.footerBottom}`}>
          <p>© {new Date().getFullYear()} SuperFinz</p>
          <div>
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#product">Product</a>
          </div>
          <p>Built in India for irregular earners.</p>
        </div>
      </footer>
    </div>
  );
}
