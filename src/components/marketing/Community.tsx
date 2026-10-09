import { Link } from "react-router-dom";
import {
  IconDocument,
  IconGrid,
  IconHandshake,
  IconMessage,
  IconUser,
  IconUsers,
} from "@/components/ui/icons";
import { Reveal } from "./Reveal";

const FEED = [
  {
    icon: IconMessage,
    bold: "Real",
    italic: "Discussions",
    copy: "Threads inside your district, not another feed to babysit.",
  },
  {
    icon: IconDocument,
    bold: "Industry",
    italic: "Posts",
    copy: "News and shop-talk from professionals doing the work you do.",
  },
  {
    icon: IconHandshake,
    bold: "Early",
    italic: "Opportunities",
    copy: "Openings shared with the community before they ever go public.",
  },
  {
    icon: IconUsers,
    bold: "Peer",
    italic: "Recommendations",
    copy: "Endorsements from people who've actually worked with you.",
  },
  {
    icon: IconGrid,
    bold: "Saved",
    italic: "Posts",
    copy: "Come back to what mattered, whenever you need it.",
  },
  {
    icon: IconUser,
    bold: "Direct",
    italic: "Messages",
    copy: "Move a public thread to a private one, without leaving the district.",
  },
] as const;

export function Community() {
  return (
    <section
      id="community"
      data-surface="site-dark"
      className="relative overflow-hidden border-t border-white/10 bg-[#0B0C0C] py-20 text-white md:py-28"
    >
      <img
        src="/scenes/city.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/75 via-[#0B0C0C]/80 to-[#0B0C0C]/95" />

      <div className="site-container relative z-[2]">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
              How VAEL Connects
            </span>
            <h2 className="mt-5 font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-white">
              More than
              <br />
              <span className="text-white/65">a marketplace.</span>
            </h2>
          </div>
          <p className="max-w-sm font-sans text-[1.0625rem] leading-[1.55] text-white/65 lg:text-right">
            Not another feed. Just the places people actually go when they want the real story on a
            district, a client, or a job.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEED.map((item, index) => (
            <Reveal key={`${item.bold}-${item.italic}`} delay={(index % 3) * 100}>
              <div className="group rounded-md border border-[#DE7C40]/50 bg-[#141414]/90 p-7 motion-safe:transition-colors motion-safe:duration-300 hover:bg-[#DE7C40]/[0.08]">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#DE7C40]/15 text-[#DE7C40]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-sans text-[1.25rem] font-medium tracking-tight text-white">
                  {item.bold} <span className="text-white/65">{item.italic}</span>
                </h3>
                <p className="mt-3 text-body-sm text-white/55">{item.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <Link
            to="/feed"
            className="mt-12 inline-flex h-12 items-center justify-center rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
          >
            Enter Community →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
