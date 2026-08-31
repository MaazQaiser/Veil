import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconBell, IconClose, IconMenu, IconMessage, IconSearch, IconUser } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/button";
import { DistrictStatus, type DistrictLotStatus } from "./status";
import { Badge } from "@/components/ui/badge";

export type NavItem = { id: string; label: string; href: string };

export const defaultCityNav: NavItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "feed", label: "Feed", href: "#feed" },
  { id: "search", label: "Search", href: "#search" },
  { id: "visible", label: "Create VAEL", href: "#visible" },
  { id: "districts", label: "Districts", href: "#districts" },
];

export function DistrictSwitcher({
  districts,
  value,
  onChange,
}: {
  districts: { id: string; name: string; status: DistrictLotStatus }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const current = districts.find((d) => d.id === value) ?? districts[0];
  return (
    <div className="inline-flex min-w-[12rem] flex-col gap-1">
      <label htmlFor="district-switcher" className="sr-only">
        District
      </label>
      <span className="relative">
        <select
          id="district-switcher"
          value={current?.id}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-md border border-border bg-surface px-4 pr-16 text-body text-foreground"
        >
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {current ? <DistrictStatus status={current.status} /> : null}
        </span>
      </span>
    </div>
  );
}

export function CityNav({
  items = defaultCityNav,
  current = "home",
  districtLabel = "Media & Technology",
  districtStatus = "live",
}: {
  items?: NavItem[];
  current?: string;
  districtLabel?: string;
  districtStatus?: DistrictLotStatus;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-border-subtle bg-background text-foreground">
      <div className="vael-container-wide flex h-nav items-center gap-3">
        <a href="#top" className="flex items-center gap-2 shrink-0">
          <img src="/vael-medallion.png" alt="" className="h-8 w-8" />
          <span className="font-sans text-h4">VAEL</span>
        </a>
        <nav className="hidden lg:flex items-center gap-7" aria-label="City">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={current === item.id ? "page" : undefined}
              className={cn(
                "py-2 text-button font-medium",
                current === item.id ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-2 text-caption">
            <span className="text-muted">District</span>
            <span>{districtLabel}</span>
            <DistrictStatus status={districtStatus} />
          </span>
          <IconButton label="Search" className="hidden sm:inline-flex">
            <IconSearch />
          </IconButton>
          <IconButton label="Notifications" className="relative">
            <IconBell />
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
              2
            </Badge>
          </IconButton>
          <IconButton label="Messages" className="hidden sm:inline-flex">
            <IconMessage />
          </IconButton>
          <IconButton label="Account">
            <IconUser />
          </IconButton>
          <IconButton label={open ? "Close menu" : "Open menu"} className="lg:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <IconClose /> : <IconMenu />}
          </IconButton>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-border px-4 py-3 lg:hidden" aria-label="City mobile">
          <p className="mb-3 flex items-center gap-2 text-caption md:hidden">
            <span className="text-muted">District</span> {districtLabel} <DistrictStatus status={districtStatus} />
          </p>
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={cn("block py-3 text-button font-medium", current === item.id ? "text-foreground" : "text-muted")}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
