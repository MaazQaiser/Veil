import { FlowStrip, SectionHead } from "./primitives";

const STAGES = [
  { title: "Profile", copy: "Limited view — fit, discipline, availability." },
  { title: "Request", copy: "You ask to open the door." },
  { title: "Accept", copy: "Both sides choose to connect." },
  { title: "Private Handshake", copy: "Full profile and a private room." },
] as const;

export function Handshake() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="site-container">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHead title="Your profile stays private." />
            <p className="site-lede mt-6 text-muted">
              Profiles become fully visible only after both sides accept the connection.
            </p>
          </div>
          <div className="lg:col-span-7">
            <img
              src="/scenes/handshake.jpg"
              alt=""
              loading="lazy"
              className="site-card h-72 w-full object-cover md:h-[28rem]"
            />
          </div>
        </div>
        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, index) => (
            <li key={stage.title} className="border-t border-border pt-5">
              <p className="site-meta text-accent">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-h4 font-medium">{stage.title}</h3>
              <p className="mt-2 text-body-sm text-muted">{stage.copy}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <FlowStrip steps={["PROFILE", "REQUEST", "ACCEPT", "PRIVATE HANDSHAKE"]} />
        </div>
      </div>
    </section>
  );
}
