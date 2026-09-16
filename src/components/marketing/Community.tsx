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
import { PillEyebrow } from "./primitives";

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
      className="relative overflow-hidden bg-[#0B0C0C] py-20 text-white md:py-28"
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
            <PillEyebrow className="border-white/20 bg-white/10 text-white">
              How VAEL Connects
            </PillEyebrow>
            <h2 className="hero-display mt-5 text-white">
              More than
              <br />
              <span className="text-white/80">a marketplace.</span>
            </h2>
          </div>
          <p className="hero-lede max-w-sm text-white/65 lg:text-right">
            Not another feed. Just the places people actually go when they want the real story on a
            district, a client, or a job.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEED.map((item, index) => (
            <Reveal key={`${item.bold}-${item.italic}`} delay={(index % 3) * 100}>
              <div className="group rounded-2xl border border-white/12 bg-white/[0.04] p-7 backdrop-blur-md motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-h4 font-medium tracking-tight text-white">
                  {item.bold}{" "}
                  <span className="font-display text-[1.5rem] leading-none text-white/80">
                    {item.italic}
                  </span>
                </h3>
                <p className="mt-3 text-body-sm text-white/55">{item.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <Link
            to="/feed"
            className="mt-12 inline-flex h-12 items-center justify-center rounded-full bg-[#FACC15] px-6 text-[0.9375rem] font-medium text-[#0B0C0C] transition-opacity hover:opacity-90"
          >
            Enter Community →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
