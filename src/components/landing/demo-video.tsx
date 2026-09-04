"use client";

import { useEffect, useRef, useState } from "react";

type PlaybackRate = 1 | 2;
const RATES: readonly PlaybackRate[] = [1, 2];

type DemoVideoClassNames = {
  stack: string;
  frame: string;
  speaker: string;
  video: string;
  speedGroup: string;
  speedButton: string;
  srOnly: string;
};

/**
 * Product walkthrough video inside the phone frame, with a 1× / 2× speed
 * toggle beneath it. Defaults to 2×; native controls stay available.
 */
export function DemoVideo({ classNames }: { classNames: DemoVideoClassNames }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState<PlaybackRate>(2);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
  }, [rate]);

  return (
    <div className={classNames.stack}>
      <div className={classNames.frame}>
        <div className={classNames.speaker} aria-hidden="true" />
        <video
          ref={videoRef}
          className={classNames.video}
          controls
          playsInline
          preload="metadata"
          poster="/superfinz-product-demo-poster.jpg"
          aria-label="SuperFinz mobile product walkthrough"
        >
          <source src="/superfinz-product-demo.mp4" type="video/mp4" />
          Your browser does not support embedded video.
        </video>
      </div>
      <div className={classNames.speedGroup} role="group" aria-label="Playback speed">
        {RATES.map((value) => (
          <button
            key={value}
            type="button"
            className={classNames.speedButton}
            aria-pressed={rate === value}
            onClick={() => setRate(value)}
          >
            {value}×<span className={classNames.srOnly}> speed</span>
          </button>
        ))}
      </div>
    </div>
  );
}
