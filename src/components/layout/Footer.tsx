import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer data-nav-theme="dark" className="bg-ink px-6 py-16 text-bone md:px-12">
      <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-10 md:flex-row md:items-end">
        <p className="font-display text-4xl md:text-6xl">{site.name}</p>
        <div className="text-sm font-light leading-relaxed text-haze">
          <p>
            Enquiries{" "}
            <a className="text-bone underline-offset-4 hover:underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
          <p className="mt-1">© {site.year} {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
