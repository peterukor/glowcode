import { useEffect, useRef, useState } from "react";

/**
 * Whether an element's content is wider than the element (so it scrolls sideways).
 * Scrollable regions use it to become keyboard-focusable only when there's something to scroll.
 */
export function useOverflows<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, overflows] as const;
}
