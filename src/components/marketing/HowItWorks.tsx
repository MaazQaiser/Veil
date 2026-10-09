import { IconCheck } from "@/components/ui/icons";
import { Reveal } from "./Reveal";
import { CountUp } from "./CountUp";

const CHECKLIST = [
  "Ranked by fit, not by who applied first",
  "847 professionals available today, right now",
  "18 handshakes made every hour, on average",
  "No cold outreach ever",
  "Connections only happen once both sides say yes",
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-black/10 bg-white py-20 text-[#0B0C0C] md:py-28">
      <div className="site-container">
        <Reveal delay={100} className="text-center">
          <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
            How VAEL Works
          </span>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-12 grid items-center gap-12 rounded-md border border-black/10 bg-white px-8 py-10 md:grid-cols-2 md:gap-16 md:px-12 md:py-14">
            <div>
              <p className="font-sans text-[5.5rem] font-medium leading-none tracking-tight text-[#0B0C0C] md:text-[7rem]">
                <CountUp value={92} duration={2800} />
                <span>%</span>
              </p>
              <p className="mt-5 font-sans text-[1.125rem] text-[#0B0C0C]/65">Average match, updated every week.</p>
            </div>

            <ul className="space-y-6">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[#DE7C40] bg-[#DE7C40] text-[#0B0C0C]">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-sans text-[1.125rem] leading-snug text-[#0B0C0C]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
