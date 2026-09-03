import styles from "./phone.module.css";

type Screen = "today" | "split" | "bills";

const screens: Record<Screen, React.ReactNode> = {
  today: (
    <>
      <div className={styles.topbar}>
        <span>Your Today page</span>
        <span className={styles.dot} />
      </div>
      <p className={styles.kicker}>Safe to spend · this week</p>
      <p className={styles.hero}>₹3,010</p>
      <p className={styles.sub}>₹430 a day after protecting bills, work and savings</p>
      <ul className={styles.lines}>
        <li><span>Total money now</span><b>₹11,460</b></li>
        <li><span>Bills, work and savings</span><b>−₹8,450</b></li>
        <li className={styles.strong}><span>Safe to spend</span><b>₹3,010</b></li>
      </ul>
      <div className={styles.meter} aria-hidden="true">
        <div className={styles.meterHead}><span>Emergency cover</span><b>6 of 30 days</b></div>
        <div className={styles.meterBar}><i style={{ width: "20%" }} /></div>
      </div>
      <nav className={styles.tabs} aria-hidden="true">
        <span className={styles.tabOn}>Today</span><span>Income</span><span>Plan</span><span>Coach</span><span>Safety</span>
      </nav>
    </>
  ),
  split: (
    <>
      <div className={styles.topbar}>
        <span>Payout landed</span>
        <span className={styles.dot} />
      </div>
      <p className={styles.kicker}>Zomato · settled 2 Sep</p>
      <p className={styles.hero}>₹2,900</p>
      <p className={styles.sub}>Suggested split. Change anything before you confirm.</p>
      <ul className={styles.lines}>
        <li><span>Rent · due 5 Sep</span><b>₹1,200</b></li>
        <li><span>Fuel and repairs</span><b>₹500</b></li>
        <li><span>Safety cushion</span><b>₹400</b></li>
        <li><span>Savings</span><b>₹300</b></li>
        <li className={styles.strong}><span>Free to spend</span><b>₹500</b></li>
      </ul>
      <div className={styles.button}>Confirm split</div>
    </>
  ),
  bills: (
    <>
      <div className={styles.topbar}>
        <span>Bills this month</span>
        <span className={styles.dot} />
      </div>
      <p className={styles.kicker}>Protected so far</p>
      <p className={styles.hero}>₹6,120</p>
      <p className={styles.sub}>of ₹16,349 due. Rent is fully covered.</p>
      <ul className={styles.lines}>
        <li><span>Rent · 5 Sep</span><b className={styles.ok}>Covered</b></li>
        <li><span>Bike EMI · 8 Sep</span><b>₹1,900 to go</b></li>
        <li><span>Electricity · 14 Sep</span><b>₹1,150 to go</b></li>
        <li><span>School fee · 20 Sep</span><b>₹2,500 to go</b></li>
      </ul>
      <p className={styles.note}>Next reminder: Tue 7 Sep, 8:00 am</p>
    </>
  ),
};

export function Phone({ screen, className }: { screen: Screen; className?: string }) {
  return (
    <div className={`${styles.phone} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.island} />
      <div className={styles.screen}>{screens[screen]}</div>
    </div>
  );
}
