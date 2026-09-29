"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SafeImage from "@/components/ui/SafeImage";
import { EXPERIENCES, img } from "@/config/site";
import { cn } from "@/lib/cn";
import FeatureGrid from "./FeatureGrid";

/**
 * Five large photographs. Motion is deliberately quiet: each frame opens from an
 * inset crop as it arrives, and the picture inside drifts slower than the page.
 */
export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".js-exp").forEach((item) => {
          const frame = item.querySelector(".js-frame");
          const pic = item.querySelector(".js-pic");
          const copy = item.querySelector(".js-copy");

          gsap.fromTo(
            frame,
            { clipPath: "inset(9% 7% 9% 7%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power2.out",
              scrollTrigger: { trigger: item, start: "top 88%", end: "top 38%", scrub: true },
            }
          );
          gsap.fromTo(
            pic,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
          gsap.from(copy, {
            y: 36,
            autoAlpha: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 62%" },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section
      id="experience"
      ref={root}
      data-nav-theme="light"
      className="bg-bone px-6 py-28 text-ink md:px-12 md:py-44"
    >
      <div className="mx-auto max-w-[1500px]">
        <FeatureGrid />
        <h2 className="max-w-[16ch] font-display text-[clamp(2.6rem,6vw,5.6rem)] leading-[1.02]">
          Days that unfold slowly.
        </h2>

        <div className="mt-20 flex flex-col gap-28 md:mt-32 md:gap-44">
          {EXPERIENCES.map((x) => {
            const wide = x.layout === "wide";
            const imageRight = x.layout === "right";
            return (
              <article
                key={x.title}
                className="js-exp grid grid-cols-12 items-end gap-x-8 gap-y-8 md:gap-x-10"
              >
                <div
                  className={cn(
                    "js-frame relative col-span-12 overflow-hidden bg-sand",
                    wide
                      ? "aspect-[4/3] md:aspect-[21/10]"
                      : "aspect-[4/3] md:aspect-[16/11] lg:col-span-8",
                    !wide && (imageRight ? "lg:col-start-5" : "lg:col-start-1"),
                    "lg:row-start-1"
                  )}
                >
                  <div className="js-pic absolute inset-x-0 -inset-y-[10%]">
                    <SafeImage
                      src={img(x.frame)}
                      alt={x.title}
                      label={x.title}
                      fill
                      loading="lazy"
                      sizes={wide ? "(min-width:1500px) 1500px, 92vw" : "(min-width:1024px) 60vw, 92vw"}
                      className="object-cover"
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "js-copy col-span-12",
                    wide
                      ? "lg:col-span-5 lg:col-start-1 lg:row-start-2"
                      : cn("lg:col-span-4 lg:row-start-1", imageRight ? "lg:col-start-1" : "lg:col-start-9")
                  )}
                >
                  <h3 className="font-display text-[clamp(2rem,3.4vw,3.4rem)] leading-[1.05]">
                    {x.title}
                  </h3>
                  <p className="mt-5 max-w-[42ch] text-lg font-light leading-relaxed text-umber">
                    {x.copy}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
