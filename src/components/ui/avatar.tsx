import { cn } from "@/lib/cn";

export function Avatar({
  name,
  src,
  size = "md",
  locked,
  className,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Before a Handshake opens, a face is obscured rather than absent. */
  locked?: boolean;
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "h-8 w-8 text-caption"
      : size === "lg"
        ? "h-14 w-14 text-h4"
        : size === "xl"
          ? "h-20 w-20 text-h3"
          : "h-10 w-10 text-body-sm";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted font-sans text-foreground",
        dim,
        className,
      )}
      aria-hidden={false}
      aria-label={locked ? `${name}, photo hidden until you connect` : name}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={cn("h-full w-full object-cover", locked && "scale-105 blur-[5px]")}
        />
      ) : (
        initials || "V"
      )}
      {locked && src ? <span className="absolute inset-0 bg-foreground/10" aria-hidden /> : null}
    </span>
  );
}
