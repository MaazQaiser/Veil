import { useEffect, useRef } from "react";

let members: (() => void)[] = [];
let ticking = false;
let listenerAttached = false;

function runAll() {
  ticking = false;
  members.forEach((update) => update());
}

function requestTick() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(runAll);
}

function ensureListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
}

export function ParallaxImage({
  src,
  alt = "",
  className,
  strength = 36,
}: {
  src: string;
  alt?: string;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function update() {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const travel = viewportH + rect.height;
      const center = rect.top + rect.height / 2;
      const progress = (viewportH / 2 - center) / (travel / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      node.style.transform = `translateY(${(clamped * strength).toFixed(2)}px)`;
    }

    members.push(update);
    ensureListener();
    update();
    requestTick();

    return () => {
      members = members.filter((fn) => fn !== update);
    };
  }, [strength]);

  return <img ref={ref} src={src} alt={alt} className={className} />;
}
