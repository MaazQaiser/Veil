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

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" />
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

export function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </Icon>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
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

export function IconEye(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a17.4 17.4 0 01-3.4 4.3M6.3 6.3A17.6 17.6 0 002 12s3.6 7 10 7a10.4 10.4 0 004.6-1" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
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

export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
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

export function IconVael(props: IconProps) {
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

export function IconEdit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 16.5V20h3.5L18.5 9 15 5.5 4 16.5z" />
      <path d="M13 7.5L16.5 11" />
    </Icon>
  );
}

export function IconBriefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="11" rx="1.5" />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />
    </Icon>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 105 9.5C5 14.7 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </Icon>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 15l6-6" />
      <path d="M11 6l1.2-1.2a3.5 3.5 0 0 1 5 5L16 11" />
      <path d="M13 18l-1.2 1.2a3.5 3.5 0 0 1-5-5L8 13" />
    </Icon>
  );
}

export function IconLifebuoy(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M5.6 5.6l4 4M18.4 5.6l-4 4M18.4 18.4l-4-4M5.6 18.4l4-4" />
    </Icon>
  );
}

export function IconBookmark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </Icon>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5a1 1 0 0 0-1.4 0L4 20" />
    </Icon>
  );
}

export function IconVideo(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10.5l5-3v9l-5-3" />
    </Icon>
  );
}

export function IconHash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4l-2 16M17 4l-2 16M4 9h16M3 15h16" />
    </Icon>
  );
}

export function IconMoreVertical(props: IconProps) {
  return (
    <Icon {...props} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </Icon>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5s-7.5-4.6-9.9-9.2C.7 8 2.3 4.7 5.6 4a5 5 0 0 1 6.4 2.6A5 5 0 0 1 18.4 4c3.3.7 4.9 4 3.5 7.3-2.4 4.6-9.9 9.2-9.9 9.2z" />
    </Icon>
  );
}

export function IconMessageCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.8A8 8 0 1 1 21 12z" />
    </Icon>
  );
}
