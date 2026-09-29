"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import SafeImage from "@/components/ui/SafeImage";
import { framePath } from "@/config/frames";
import { BLOCKED_OFFSETS, RATE, SPECS } from "@/config/site";

const MAX_GUESTS = Number(SPECS.find((s) => s.label === "Guests")?.value ?? 8);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (base: string, n: number) => {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const nice = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en", { day: "numeric", month: "short", timeZone: "UTC" });

/** Front-end only: wire `reserve` to your booking engine / API route (see TODO). */
export default function Booking() {
  const today = iso(new Date());
  const sample = useMemo(() => BLOCKED_OFFSETS.map(([a, b]) => ({ from: plus(today, a), to: plus(today, b) })), [today]);
  const [live, setLive] = useState<{ from: string; to: string }[] | null>(null);
  const blocked = live ?? (supabase ? [] : sample); // sample dates only in demo mode (no backend)
  useEffect(() => {
    supabase?.rpc("pv_availability").then(({ data }) => {
      // check_out is the morning guests leave, so the last blocked night is the day before
      if (data) setLive((data as { check_in: string; check_out: string }[]).map((r) => ({ from: r.check_in, to: plus(r.check_out, -1) })));
    });
  }, []);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const nights = checkIn && checkOut && checkOut > checkIn ? Math.round((+new Date(checkOut) - +new Date(checkIn)) / 864e5) : 0;
  // a stay collides with a blocked range when it starts before the range ends and ends after it starts
  const clash = nights > 0 && blocked.find((b) => checkIn <= b.to && plus(checkOut, -1) >= b.from);
  const total = nights * RATE.perNight;

  const reserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nights || clash) return;
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setError("Please add your name and a valid email.");
    setError("");
    setSending(true);
    if (supabase) {
      const { error: err } = await supabase.from("pv_bookings").insert({
        check_in: checkIn, check_out: checkOut, guests, guest_name: name.trim(), guest_email: email.trim(),
        notes: notes.trim() || null, total, status: "pending",
      });
      if (err) { setSending(false); return setError("Sorry, we could not send your request. Please try again."); }
    }
    setSending(false);
    setDone(true);
  };

  const field = "mt-2 w-full border-0 border-b border-bone/40 bg-transparent pb-3 pt-1 text-lg font-light text-bone [color-scheme:dark] focus:border-gold focus:outline-none";
  const label = "text-sm font-normal tracking-[0.08em] text-bone/85";

  return (
    <section id="book" data-nav-theme="dark" className="relative isolate overflow-hidden bg-ink px-6 py-28 text-bone md:px-12 md:py-40">
      <SafeImage src={framePath(38)} alt="" fill loading="lazy" sizes="100vw" label="Sunset aerial" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/20 to-ink/50" />

      <div className="mx-auto grid max-w-[1300px] items-center gap-12 lg:grid-cols-12">
        <h2 className="font-display text-[clamp(3rem,7.4vw,7rem)] leading-[0.98] tracking-[0.02em] lg:col-span-6">
          MAKE THIS
          <br />
          YOUR ESCAPE
        </h2>

        {/* floating glass panel */}
        <form
          onSubmit={reserve}
          noValidate
          className="rounded-sm border border-white/20 bg-white/10 p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-700 ease-cine hover:-translate-y-1 md:p-9 lg:col-span-6"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-display text-4xl">
              {RATE.currency}
              {RATE.perNight}
              <span className="ml-2 text-base font-light text-bone/70">/ night</span>
            </p>
          </div>

          <div className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            <div>
              <label htmlFor="checkin" className={label}>Check-in</label>
              <input id="checkin" type="date" min={today} value={checkIn} className={field}
                onChange={(e) => { setCheckIn(e.target.value); setDone(false); if (checkOut && checkOut <= e.target.value) setCheckOut(""); }} />
            </div>
            <div>
              <label htmlFor="checkout" className={label}>Check-out</label>
              <input id="checkout" type="date" min={checkIn ? plus(checkIn, 1) : today} value={checkOut} className={field}
                onChange={(e) => { setCheckOut(e.target.value); setDone(false); }} />
            </div>
            <div className="sm:col-span-2">
              <span id="gl" className={label}>Guests</span>
              <div role="group" aria-labelledby="gl" className="mt-2 flex items-center justify-between border-b border-bone/40 pb-2 pt-1">
                <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="h-10 w-10 text-2xl font-light hover:text-gold">−</button>
                <span aria-live="polite" className="text-lg font-light">{guests} {guests === 1 ? "guest" : "guests"}</span>
                <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))} className="h-10 w-10 text-2xl font-light hover:text-gold">+</button>
              </div>
            </div>
            <div>
              <label htmlFor="gname" className={label}>Full name</label>
              <input id="gname" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor="gemail" className={label}>Email</label>
              <input id="gemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className={label}>Special requests</label>
              <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrival time, celebrations, dietary needs…"
                className={field + " resize-none placeholder:text-bone/40"} />
            </div>
          </div>

          <div className="mt-6 min-h-[4.5rem] text-[15px] font-light" role="status" aria-live="polite">
            {done ? (
              <p className="text-lagoon-light">Request received. We will email you to confirm {nice(checkIn)} to {nice(checkOut)} for {guests} guest{guests > 1 ? "s" : ""} shortly.</p>
            ) : error ? (
              <p className="text-[#e6b9a3]">{error}</p>
            ) : clash ? (
              <p className="text-[#e6b9a3]">Those dates overlap a booking ({nice(clash.from)} to {nice(clash.to)}). The villa is free again from {nice(plus(clash.to, 1))}.</p>
            ) : nights ? (
              <p className="flex justify-between border-t border-bone/25 pt-4 text-lg">
                <span>{nights} night{nights > 1 ? "s" : ""} × {RATE.currency}{RATE.perNight}</span>
                <span className="font-display text-2xl text-gold">{RATE.currency}{total.toLocaleString()}</span>
              </p>
            ) : (
              <p className="text-bone/70">
                Not available: {blocked.map((b) => `${nice(b.from)} to ${nice(b.to)}`).join(" · ")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!nights || !!clash || sending}
            className="mt-4 w-full bg-bone px-9 py-5 text-[13px] font-normal tracking-[0.2em] text-ink transition-all duration-500 hover:scale-[1.02] hover:bg-gold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-bone"
          >
            {sending ? "SENDING…" : "RESERVE YOUR STAY"}
          </button>
        </form>
      </div>
    </section>
  );
}
