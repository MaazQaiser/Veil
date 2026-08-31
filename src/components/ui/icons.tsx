import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Icon({ title, className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      className={cn("h-[1.1em] w-[1.1em] shrink-0", className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l5 5L19 7" />
    </Icon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 4.7L2.8 18a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.7a2 2 0 00-3.4 0z" />
    </Icon>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icon>
  );
}

export function IconLoader(props: IconProps) {
  return (
    <Icon className={cn("animate-spin", props.className)} {...props}>
      <path d="M12 3a9 9 0 109 9" />
    </Icon>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 16v-4a6 6 0 1112 0v4l1.2 2H4.8L6 16zM10 20h4" />
    </Icon>
  );
}

export function IconMessage(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6h14v10H8l-3 3V6z" />
    </Icon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3 3.7-4.5 7-4.5S17.6 16 19 19" />
    </Icon>
  );
}

export function IconHandshake(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 13l2.5 2.5a2 2 0 002.8 0L16 13" />
      <path d="M4 11l4-4 3 3M20 11l-4-4-3 3" />
    </Icon>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="11" width="12" height="9" rx="1" />
      <path d="M9 11V8a3 3 0 016 0v3" />
    </Icon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Icon>
  );
}

export function IconDocument(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4h7l4 4v12H7V4z" />
      <path d="M14 4v4h4" />
    </Icon>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-5v-5h-4v5H5a1 1 0 01-1-1v-8z" />
    </Icon>
  );
}

export function IconVeil(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    </Icon>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="6" height="6" rx="0.5" />
      <rect x="14" y="4" width="6" height="6" rx="0.5" />
      <rect x="4" y="14" width="6" height="6" rx="0.5" />
      <rect x="14" y="14" width="6" height="6" rx="0.5" />
    </Icon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.2-1.8-4-4.2-4.5" />
    </Icon>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icon>
  );
}
