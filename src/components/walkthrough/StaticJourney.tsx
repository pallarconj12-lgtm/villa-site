import SafeImage from "@/components/ui/SafeImage";
import { site } from "@/config/site";
import { OVERLAYS, STATIC_STOPS, framePath } from "@/config/frames";

/**
 * The reduced-motion experience: the same journey as ordinary scrolling.
 * No pinning, no scrubbing, no smooth-scroll hijack, no parallax, just full-bleed
 * photographs in walking order with the same four lines of copy.
 */
export default function StaticJourney() {
  return (
    <section id="home" data-nav-theme="dark" aria-label="Walkthrough of the villa" className="bg-ink text-bone">
      <div className="relative h-svh w-full">
        <SafeImage
          src={framePath(1)}
          alt="Aerial view of the villa and its pool, ringed by palms"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/35" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-[12svh] md:px-12">
          <h1 className="font-display text-[clamp(3.4rem,12.5vw,11.5rem)] leading-[0.92]">
            {site.name}
          </h1>
          <p className="mt-4 text-lg font-light tracking-[0.04em] md:text-2xl">“{site.tagline}”</p>
        </div>
      </div>

      {STATIC_STOPS.map((stop) => {
        const overlay = OVERLAYS.find((o) => stop.frame >= o.from - 1 && stop.frame <= o.to);
        return (
          <figure key={stop.frame} className="relative h-[70svh] w-full md:h-[85svh]">
            <SafeImage
              src={framePath(stop.frame)}
              alt={stop.label}
              fill
              loading="lazy"
              sizes="100vw"
              label={stop.label}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-12">
              {overlay && (
                <>
                  <p className="font-display text-5xl tracking-[0.05em] md:text-8xl">{overlay.title}</p>
                  <p className="mt-2 text-lg font-light md:text-2xl">{overlay.line}</p>
                </>
              )}
              <p className="mt-3 text-sm font-light tracking-[0.08em] text-bone/80">{stop.label}</p>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}
