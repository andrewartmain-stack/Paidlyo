"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatDuration, liveSeconds } from "../duration";

/**
 * An entry's duration. Stopped: h:mm. Running: h:mm:ss, ticking every second, with a timer
 * icon. The first render uses the server's clock (`serverNowMs`) so server and client HTML match.
 */
export function LiveDuration({
  minutes,
  timerStartedAt,
  serverNowMs,
  className,
}: {
  minutes: number;
  timerStartedAt: string | null;
  serverNowMs: number;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(serverNowMs);

  useEffect(() => {
    if (!timerStartedAt) return;
    const tick = () => setNowMs(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [timerStartedAt]);

  if (!timerStartedAt) {
    return <span className={className}>{formatDuration(minutes)}</span>;
  }

  return (
    <span className={cn("inline-flex items-center justify-end gap-2", className)}>
      <Timer aria-hidden className="size-4 shrink-0 text-brand" />
      <span role="timer" aria-label="Running timer">
        {formatClock(liveSeconds(minutes, timerStartedAt, nowMs))}
      </span>
    </span>
  );
}
