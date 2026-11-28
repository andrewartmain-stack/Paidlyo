"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SRC = "/videos/paidlyo-demo.mp4";
const POSTER = "/videos/paidlyo-demo-poster.jpg";

/**
 * Hero demo video: muted, looping, plays inline and autoplays; a Pause / Play button is always
 * available (WCAG 2.2.2). The poster keeps the layout
 * stable while the video loads.
 */
export function HeroVideo({ label }: { label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Autoplays even with prefers-reduced-motion (Windows reports it whenever "Animation effects"
    // is off): the video is muted and the Pause button stops it.
    // Muted autoplay; ignore browsers that block it (the Play button still works).
    video.play().catch(() => {});
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  return (
    <figure className="relative mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-30px_rgb(14_15_12/0.35)]">
        <video
          ref={ref}
          className="block aspect-video w-full bg-muted"
          src={SRC}
          poster={POSTER}
          width={1920}
          height={1080}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause demo video" : "Play demo video"}
        className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-foreground/80 text-background outline-none transition-colors hover:bg-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-4 sm:bottom-4"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
      </button>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
