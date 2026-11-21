"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** After checkout, re-renders the page every 2 seconds (up to ~30 s) until the webhook has synced. */
export function RefreshUntilReady() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      if (count > 15) clearInterval(timer);
      else router.refresh();
    }, 2000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
