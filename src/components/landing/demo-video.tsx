"use client";

import { useEffect, useRef } from "react";

export function DemoVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = 2;
    video.playbackRate = 2;
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      playsInline
      preload="metadata"
      poster="/superfinz-product-demo-poster.jpg"
      aria-label="SuperFinz mobile product walkthrough playing at double speed"
    >
      <source src="/superfinz-product-demo.mp4" type="video/mp4" />
      Your browser does not support embedded video.
    </video>
  );
}
