import { useEffect, useRef, type ReactNode } from "react";

/**
 * Pixel dissolve reveal, matching the mechanics of the tile-reveal effect on
 * authenticom.com/product/recordrecharge (their `pixelated-scroll-transition`
 * script, inspected directly from the live page):
 *
 *  - grid: 16 cols x 6 rows
 *  - ScrollTrigger: start "top bottom", end "top center", scrub 0.3
 *  - stagger: amount 1.5, per-tile duration 0.1 (GSAP timeline units, so as
 *    fractions of the total: each tile's local window is ~6% of the scroll
 *    range, staggered so tile i starts at (i/(n-1)) * 1.5/1.6 of the range)
 *  - priority order: scattered bottom-up wave (distance-from-bottom + noise
 *    + a sine ripple across columns), not row-by-row
 *
 * `scrub: 0.3` is not an instant 1:1 mapping to scroll position — GSAP
 * smooths it with ~0.3s of catch-up easing, so it keeps drifting toward the
 * target after you stop scrolling instead of snapping. Reproduced here with
 * exponential smoothing inside a rAF loop.
 */
const COLS = 16;
const ROWS = 6;
const STAGGER_AMOUNT = 1.5;
const TILE_DURATION = 0.1;
const TIMELINE_DURATION = STAGGER_AMOUNT + TILE_DURATION;
const SCRUB_SMOOTHING = 0.3;

function buildRevealOrder(cols: number, rows: number) {
  const cells: { index: number; priority: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dist = rows - 1 - r;
      const priority = dist * 50 + Math.random() * 300 + Math.sin(c * 0.3) * 30;
      cells.push({ index: c * rows + r, priority });
    }
  }
  cells.sort((a, b) => a.priority - b.priority);
  return cells.map((cell) => cell.index);
}

export function PixelReveal({
  children,
  tint = "#FDFCF9",
  pixelBorderClassName = "",
  className,
}: {
  children: ReactNode;
  tint?: string;
  pixelBorderClassName?: string;
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Array<HTMLDivElement | null>>([]);
  const orderRef = useRef<number[]>();
  if (!orderRef.current) orderRef.current = buildRevealOrder(COLS, ROWS);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const order = orderRef.current!;
    const n = order.length;
    let smoothed = 0;
    let raw = 0;
    let frame = 0;
    let last = performance.now();

    const getRawProgress = () => {
      const rect = sectionEl.getBoundingClientRect();
      const vh = window.innerHeight;
      // start "top bottom" (rect.top === vh) -> 0, end "top center" (rect.top === vh/2) -> 1
      return Math.min(1, Math.max(0, (vh - rect.top) / (vh / 2)));
    };

    const apply = (progress: number) => {
      order.forEach((pixelIndex, i) => {
        const el = pixelsRef.current[pixelIndex];
        if (!el) return;
        const t0 = (i / (n - 1)) * (STAGGER_AMOUNT / TIMELINE_DURATION);
        const t1 = t0 + TILE_DURATION / TIMELINE_DURATION;
        const local = Math.min(1, Math.max(0, (progress - t0) / (t1 - t0)));
        el.style.opacity = String(1 - local);
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      raw = getRawProgress();
      // exponential smoothing approximating GSAP's scrub catch-up easing
      const rate = 1 - Math.exp(-dt / SCRUB_SMOOTHING);
      smoothed += (raw - smoothed) * rate;
      apply(smoothed);
      if (Math.abs(raw - smoothed) > 0.001 || (raw > 0 && raw < 1)) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    last = performance.now();
    apply(getRawProgress());
    kick();

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={sectionRef} className={className ? `relative ${className}` : "relative"}>
      {children}
      <div className="pointer-events-none absolute inset-0 z-10 flex" aria-hidden>
        {Array.from({ length: COLS }).map((_, c) => (
          <div key={c} className="flex flex-1 flex-col">
            {Array.from({ length: ROWS }).map((_, r) => (
              <div
                key={r}
                ref={(el) => {
                  pixelsRef.current[c * ROWS + r] = el;
                }}
                className={`flex-1 ${pixelBorderClassName}`}
                style={{ backgroundColor: tint }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
