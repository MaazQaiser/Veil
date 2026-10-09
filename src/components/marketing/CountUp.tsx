import { useEffect, useRef, useState } from "react";

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CountUp({
  value,
  duration = 1400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frameId = 0;
    let started = false;

    function start() {
      if (started) return;
      started = true;
      window.removeEventListener("scroll", onScroll);
      const startTime = performance.now();
      function tick(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        setDisplay(Math.round(value * easeOutExpo(progress)));
        if (progress < 1) frameId = requestAnimationFrame(tick);
      }
      frameId = requestAnimationFrame(tick);
    }

    function onScroll() {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) start();
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-US")}
    </span>
  );
}
