"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True while the element is on screen. Elements inside a `hidden` tab panel never intersect,
 * so this also covers "tab not selected". Used to run timers only when they can be seen.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}
