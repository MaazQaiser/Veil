const ITEMS = [
  "Sarah Mitchell matched with a Creative Director search — 92% fit",
  "A handshake just opened in Construction",
  "Marcus Chen went available in Media & Technology",
  "Amara Okonkwo accepted a request in Construction",
  "James Park is available this week in Trucking",
  "Elena Voss matched with a Commercial opportunity — 81% fit",
  "18 handshakes made in the last hour",
  "Priya Nair just joined Media & Technology",
  "David Ruiz went available in Residential",
  "847 professionals available today",
];

function TickerRow() {
  return (
    <>
      {ITEMS.map((item, index) => (
        <span key={`${item}-${index}`} className="flex shrink-0 items-center gap-6">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FACC15]" aria-hidden />
          <span className="whitespace-nowrap text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-white/60">
            {item}
          </span>
        </span>
      ))}
    </>
  );
}

export function LiveTicker() {
  return (
    <div className="w-full overflow-hidden border-y border-white/10 bg-white/[0.03]">
      <div className="card-marquee-track flex w-max items-center gap-6 py-2.5">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  );
}
