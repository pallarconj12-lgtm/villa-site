import type { Metadata, Viewport } from "next";
import { Italiana, Jost } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Nav from "@/components/layout/Nav";

// Italiana: hairline-to-stem contrast that reads as architectural lettering at large sizes.
const display = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Jost: geometric and quiet, so the photography does the talking.
const body = Jost({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: `${site.name} | ${site.tagline}`,
  description: `${site.name}: a private villa with four bedrooms, an infinity pool and a garden that opens to the water. Walk through it before you book.`,
};

export const viewport: Viewport = {
  themeColor: "#1c201d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SmoothScroll>
          <Nav />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
