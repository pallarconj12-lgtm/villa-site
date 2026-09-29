"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import ClickJourney from "./ClickJourney";
import StaticJourney from "./StaticJourney";

/** Picks the immersive scroll journey, or the simplified one for reduced-motion visitors. */
export default function Walkthrough() {
  const reduced = useReducedMotion();
  return reduced ? <StaticJourney /> : <ClickJourney />;
}
