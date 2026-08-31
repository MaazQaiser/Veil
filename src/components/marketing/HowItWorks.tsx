import { FlowStrip, SectionHead } from "./primitives";

const STEPS = [
  { n: "01", title: "Veil In", copy: "Show that you're available." },
  { n: "02", title: "Find Your Match", copy: "See opportunities ranked by fit." },
  { n: "03", title: "Handshake", copy: "Connect only when both sides agree." },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border py-20 md:py-28">
      <div className="site-container">
        <SectionHead eyebrow="HOW VAEL WORKS" title="Availability changes everything." />
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-12">
          {STEPS.map((step) => (
            <li key={step.n}>
              <p className="site-meta text-accent">{step.n}</p>
              <h3 className="site-h3 mt-3">{step.title}</h3>
              <p className="mt-3 text-body text-muted">{step.copy}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 border-t border-border pt-8">
          <FlowStrip steps={["AVAILABLE", "92% MATCH", "HANDSHAKE", "PRIVATE ROOM"]} />
        </div>
      </div>
    </section>
  );
}
