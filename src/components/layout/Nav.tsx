"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { NAV, site } from "@/config/site";
import { useLenis } from "@/components/providers/SmoothScroll";
import { cn } from "@/lib/cn";

/**
 * Minimal navigation. Each page section declares `data-nav-theme="dark|light"`;
 * the nav reads whichever section sits under it and flips its ink accordingly.
 */
export default function Nav() {
  const lenis = useLenis();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [active, setActive] = useState("#home");
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  /* which section is under the nav? */
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-theme]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setTheme((e.target as HTMLElement).dataset.navTheme === "light" ? "light" : "dark");
          if (e.target.id) setActive(`#${e.target.id}`);
        }
      },
      // a thin strip along the top edge of the viewport: whichever section crosses it wins
      { rootMargin: "-1px 0px -97% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const goTo = useCallback(
    (href: string) => {
      const el = href === "#home" ? 0 : (document.querySelector(href) as HTMLElement | null);
      if (el === null) return;
      if (lenis) {
        lenis.scrollTo(el, {
          duration: 2.2,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
      } else if (typeof el === "number") {
        window.scrollTo({ top: 0 });
      } else {
        el.scrollIntoView();
      }
    },
    [lenis]
  );

  /* mobile menu: lock scroll, staggered entrance, Escape to close */
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && menu.current) {
      gsap.fromTo(
        menu.current.querySelectorAll("a"),
        { y: 50, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: "power3.out", delay: 0.15 }
      );
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const onLink = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    // let the menu release its scroll lock first
    window.setTimeout(() => goTo(href), open ? 60 : 0);
  };

  const ink = theme === "dark" || open ? "text-bone" : "text-ink";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between px-6 transition-colors duration-500 md:px-12",
          ink
        )}
      >
        {/* legibility scrim over photography */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-ink/55 to-transparent transition-opacity duration-500",
            theme === "dark" && !open ? "opacity-100" : "opacity-0"
          )}
        />
        <a
          href="#home"
          onClick={(e) => onLink(e, "#home")}
          className="font-display text-2xl leading-none tracking-[0.02em]"
        >
          {site.name}
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-9 text-[13px] font-normal tracking-[0.1em]">
            {NAV.map((item) => {
              const isBook = item.href === "#book";
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => onLink(e, item.href)}
                    aria-current={active === item.href ? "true" : undefined}
                    className={cn(
                      "relative py-2 transition-opacity duration-300",
                      isBook
                        ? "border border-current px-5 hover:bg-bone hover:text-ink"
                        : "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-cine hover:after:scale-x-100 aria-[current=true]:after:scale-x-100"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="relative z-[60] flex h-10 items-center gap-3 text-[13px] tracking-[0.1em] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden className="relative block h-2.5 w-6">
            <span
              className={cn(
                "absolute left-0 h-px w-full bg-current transition-all duration-500 ease-cine",
                open ? "top-1/2 rotate-45" : "top-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-px w-full bg-current transition-all duration-500 ease-cine",
                open ? "top-1/2 -rotate-45" : "bottom-0"
              )}
            />
          </span>
        </button>
      </header>

      <div
        id="mobile-menu"
        ref={menu}
        data-lenis-prevent
        className={cn(
          "fixed inset-0 z-40 flex flex-col justify-center bg-ink px-8 text-bone transition-opacity duration-500 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-5">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                tabIndex={open ? 0 : -1}
                onClick={(e) => onLink(e, item.href)}
                className="font-display text-5xl"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
