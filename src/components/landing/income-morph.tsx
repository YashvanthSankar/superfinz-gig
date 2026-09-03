"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { DAILY_AVERAGE, DAILY_INCOME, inr } from "./landing-data";
import styles from "./income-morph.module.css";

const W = 1000;
const H = 360;
const PAD_X = 8;
const BASE = 300;
const MAX = 2750;
const GAP = 6;
const BAR_W = (W - PAD_X * 2 - GAP * (DAILY_INCOME.length - 1)) / DAILY_INCOME.length;
const scale = (v: number) => (v / MAX) * 240;

function Bar({
  i,
  t,
}: {
  i: number;
  t: MotionValue<number>;
}) {
  const from = scale(DAILY_INCOME[i]);
  const to = scale(DAILY_AVERAGE);
  const height = useTransform(t, (v) => from + (to - from) * v);
  const y = useTransform(height, (h) => BASE - h);
  const fill = useTransform(t, [0, 1], ["#8FA3BC", "#60A5FA"]);
  return (
    <motion.rect
      x={PAD_X + i * (BAR_W + GAP)}
      width={BAR_W}
      y={y}
      height={height}
      fill={fill}
      rx={2}
    />
  );
}

export function IncomeMorph() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const raw = useTransform(scrollYProgress, [0.18, 0.62], [0, 1]);
  const t = useSpring(raw, { stiffness: 120, damping: 28, mass: 0.6 });
  const beforeOpacity = useTransform(t, [0, 0.45], [1, 0]);
  const afterOpacity = useTransform(t, [0.55, 1], [0, 1]);
  const lineOpacity = useTransform(t, [0.6, 1], [0, 1]);
  const hintOpacity = useTransform(t, [0.7, 1], [1, 0]);

  if (reduce) {
    return (
      <div className={styles.staticPair}>
        <figure className={styles.staticFig}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Thirty days of uneven daily earnings">
            {DAILY_INCOME.map((v, i) => (
              <rect key={i} x={PAD_X + i * (BAR_W + GAP)} width={BAR_W} y={BASE - scale(v)} height={scale(v)} fill="#8FA3BC" rx={2} />
            ))}
            <line x1={0} x2={W} y1={BASE} y2={BASE} stroke="#2A3C55" />
          </svg>
          <figcaption>What you earned, day by day</figcaption>
        </figure>
        <figure className={styles.staticFig}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`The same month smoothed to ${inr(DAILY_AVERAGE)} every day`}>
            {DAILY_INCOME.map((_, i) => (
              <rect key={i} x={PAD_X + i * (BAR_W + GAP)} width={BAR_W} y={BASE - scale(DAILY_AVERAGE)} height={scale(DAILY_AVERAGE)} fill="#60A5FA" rx={2} />
            ))}
            <line x1={0} x2={W} y1={BASE} y2={BASE} stroke="#2A3C55" />
          </svg>
          <figcaption>What SuperFinz pays you: {inr(DAILY_AVERAGE)} a day, every day</figcaption>
        </figure>
      </div>
    );
  }

  return (
    <div ref={ref} className={styles.track}>
      <div className={styles.sticky}>
        <div className={styles.captions} aria-live="polite">
          <motion.p style={{ opacity: beforeOpacity }} className={styles.caption}>
            <span className={styles.captionLabel}>Before</span>
            What you earned, day by day
          </motion.p>
          <motion.p style={{ opacity: afterOpacity }} className={`${styles.caption} ${styles.captionAfter}`}>
            <span className={styles.captionLabel}>With SuperFinz</span>
            {inr(DAILY_AVERAGE)} a day. Every day.
          </motion.p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Uneven daily earnings smoothing into one steady daily amount as you scroll">
          {DAILY_INCOME.map((_, i) => (
            <Bar key={i} i={i} t={t} />
          ))}
          <motion.line
            x1={0}
            x2={W}
            y1={BASE - scale(DAILY_AVERAGE)}
            y2={BASE - scale(DAILY_AVERAGE)}
            stroke="#F4F7FB"
            strokeDasharray="4 6"
            style={{ opacity: lineOpacity }}
          />
          <line x1={0} x2={W} y1={BASE} y2={BASE} stroke="#2A3C55" />
          <text x={PAD_X} y={H - 24} className={styles.axisText}>1 Sep</text>
          <text x={W - PAD_X} y={H - 24} textAnchor="end" className={styles.axisText}>30 Sep</text>
        </svg>
        <motion.p className={styles.hint} style={{ opacity: hintOpacity }} aria-hidden="true">Scroll</motion.p>
      </div>
    </div>
  );
}
