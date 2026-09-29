"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type BookingRow } from "@/lib/supabase";
import { RATE } from "@/config/site";

const STATUS_STYLE: Record<BookingRow["status"], string> = {
  pending: "border-gold text-gold",
  confirmed: "border-lagoon-light text-lagoon-light",
  declined: "border-bone/30 text-bone/50",
  blocked: "border-bone/30 text-bone/70",
};
const btn = "border border-bone/40 px-4 py-2 text-[12px] tracking-[0.12em] transition-colors hover:bg-bone hover:text-ink";
const input = "w-full border-0 border-b border-bone/40 bg-transparent py-2 text-lg font-light text-bone [color-scheme:dark] focus:border-gold focus:outline-none";

/** Owner dashboard. Access is enforced by Supabase row-level security (pv_admins), not by hiding this page. */
export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(true);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!supabase) return setReady(true);
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("pv_bookings").select("*").order("check_in", { ascending: true });
    if (error) return setMsg(error.message);
    setRows(data as BookingRow[]);
    setIsAdmin(true);
  }, []);
  useEffect(() => { if (session) load(); }, [session, load]);

  // a signed-in user who is not in pv_admins simply sees no rows; tell them why
  useEffect(() => { if (session && rows.length === 0) setIsAdmin(false); else setIsAdmin(true); }, [session, rows]);

  const setStatus = async (id: string, status: BookingRow["status"]) => {
    setMsg("");
    const { error } = await supabase!.from("pv_bookings").update({ status }).eq("id", id);
    if (error) setMsg(error.code === "23P01" ? "Those dates overlap a confirmed stay or block." : error.message);
    load();
  };
  const block = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || to <= from) return setMsg("Choose a start date and a later end date (the morning the block ends).");
    const { error } = await supabase!.from("pv_bookings").insert({
      check_in: from, check_out: to, guests: 1, guest_name: "Owner block", guest_email: "block@perrysville.local", status: "blocked",
    });
    setMsg(error ? (error.code === "23P01" ? "Those dates overlap a confirmed stay or block." : error.message) : "");
    setFrom(""); setTo(""); load();
  };

  if (!ready) return null;
  if (!supabase)
    return <Shell><p className="text-lg font-light">Backend not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).</p></Shell>;

  if (!session)
    return (
      <Shell>
        <form
          className="mt-8 max-w-sm space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase!.auth.signInWithPassword({ email, password });
            setMsg(error ? "Sign-in failed. Check your email and password." : "");
          }}
        >
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button className={btn} type="submit">SIGN IN</button>
          <p className="text-[#e6b9a3]">{msg}</p>
        </form>
      </Shell>
    );

  const upcoming = rows.filter((r) => r.status === "confirmed").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <Shell action={<button className={btn} onClick={() => supabase!.auth.signOut()}>SIGN OUT</button>}>
      {!isAdmin && (
        <p className="mt-8 text-lg font-light text-[#e6b9a3]">
          You are signed in, but this account is not an admin yet. Add it to pv_admins (see the last comment in supabase/schema.sql).
        </p>
      )}
      <p className="mt-6 text-lg font-light text-bone/80">{pending} awaiting reply · {upcoming} confirmed</p>
      {msg && <p className="mt-4 text-[#e6b9a3]">{msg}</p>}

      <form onSubmit={block} className="mt-10 flex flex-wrap items-end gap-6 border-y border-bone/15 py-6">
        <div><label className="text-sm text-bone/70">Block from</label><input className={input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="text-sm text-bone/70">until (morning)</label><input className={input} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <button className={btn} type="submit">BLOCK DATES</button>
      </form>

      <ul className="mt-10 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="grid gap-4 border border-bone/15 p-5 md:grid-cols-[1.2fr_1.6fr_auto] md:items-center">
            <div>
              <p className="font-display text-2xl">{r.check_in} → {r.check_out}</p>
              <span className={`mt-2 inline-block border px-2 py-0.5 text-[11px] tracking-[0.12em] ${STATUS_STYLE[r.status]}`}>{r.status.toUpperCase()}</span>
            </div>
            <div className="text-[15px] font-light text-bone/85">
              {r.status === "blocked" ? "Owner block" : (
                <>
                  <p>{r.guest_name} · {r.guests} guest{r.guests > 1 ? "s" : ""} · <a className="underline" href={`mailto:${r.guest_email}`}>{r.guest_email}</a></p>
                  {r.total != null && <p className="text-bone/60">{RATE.currency}{Number(r.total).toLocaleString()} quoted</p>}
                  {r.notes && <p className="mt-1 text-bone/60">“{r.notes}”</p>}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {r.status === "pending" && (<><button className={btn} onClick={() => setStatus(r.id, "confirmed")}>CONFIRM</button><button className={btn} onClick={() => setStatus(r.id, "declined")}>DECLINE</button></>)}
              {r.status === "confirmed" && <button className={btn} onClick={() => setStatus(r.id, "declined")}>CANCEL</button>}
              {r.status === "blocked" && <button className={btn} onClick={async () => { await supabase!.from("pv_bookings").delete().eq("id", r.id); load(); }}>UNBLOCK</button>}
            </div>
          </li>
        ))}
        {rows.length === 0 && isAdmin && <li className="text-bone/60">No requests yet.</li>}
      </ul>
    </Shell>
  );
}

function Shell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-ink px-6 py-28 text-bone md:px-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-end justify-between gap-6">
          <h1 className="font-display text-5xl">Reservations</h1>
          {action}
        </div>
        {children}
      </div>
    </main>
  );
}
