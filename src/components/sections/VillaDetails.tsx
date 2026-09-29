import { AMENITIES, SPECS } from "@/config/site";

/** Dark, type-only section: the calm after the walkthrough. */
export default function VillaDetails() {
  return (
    <section
      id="villa"
      data-nav-theme="dark"
      className="bg-ink px-6 py-28 text-bone md:px-12 md:py-44"
    >
      <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-5">
          <h2 className="font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[1.06]">
            Built around one long view: from the front door, through the house, to the water.
          </h2>
          <p className="mt-8 max-w-md text-lg font-light leading-relaxed text-haze">
            Marble floors, warm timber and glass that slides away. Every room is set to catch the
            light at a different hour, and every one opens onto the garden.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <dl className="grid grid-cols-3 border-t border-bone/25">
            {SPECS.map((s) => (
              <div key={s.label} className="pt-6 md:pt-8">
                <dd className="font-display text-[clamp(3.6rem,8vw,7.5rem)] leading-none">
                  {s.value}
                </dd>
                <dt className="mt-3 text-sm font-light tracking-[0.06em] text-haze">{s.label}</dt>
              </div>
            ))}
          </dl>

          <ul className="mt-16 border-t border-bone/25">
            {AMENITIES.map((a) => (
              <li
                key={a.name}
                className="flex flex-col justify-between gap-1 border-b border-bone/25 py-5 md:flex-row md:items-baseline md:gap-8"
              >
                <span className="font-display text-2xl md:text-3xl">{a.name}</span>
                <span className="text-sm font-light text-haze md:max-w-[22ch] md:text-right">
                  {a.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
