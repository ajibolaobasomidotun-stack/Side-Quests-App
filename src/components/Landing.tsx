import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GIG_CATEGORIES } from '../categories';

// Stock photos from Unsplash (free Unsplash License) until real member work is available.
// Hotlinked from images.unsplash.com as Unsplash recommends.
const photo = (id: string, w = 480, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const P = {
  sunset: 'photo-1497316730643-415fac54a2af',
  studio: 'photo-1632582204758-5ac65783517a',
  typing: 'photo-1510442650500-93217e634e4c',
  dancer: 'photo-1541904845547-0eaf866de232',
  swatches: 'photo-1561070791-2526d30994b5',
  sewing: 'photo-1626784579980-db39c1a13aa9',
  vinyl: 'photo-1616714109948-c74fe5029a4d',
  camera: 'photo-1590486803833-1c5dc8ddd4c8',
  video: 'photo-1587050265310-1a2d98ccce5f',
  sketch: 'photo-1605007622549-018572089f27',
  typewriter: 'photo-1635714257063-3277d61cb1df',
  mic: 'photo-1531651008558-ed1740375b39',
  makeup: 'photo-1709477542149-f4e0e21d590b',
};

const TILES = [
  { img: P.sunset, label: 'Landscape photography', color: '#4DA3FF', h: 250 },
  { img: P.studio, label: 'Music production', color: '#FF6B4A', h: 190 },
  { img: P.typing, label: 'Copywriting', color: '#FFB547', h: 220 },
  { img: P.dancer, label: 'Live performance', color: '#FF5FA2', h: 260 },
  { img: P.swatches, label: 'Brand identity', color: '#A78BFA', h: 230 },
  { img: P.sewing, label: 'Wardrobe styling', color: '#2DD4BF', h: 200 },
  { img: P.vinyl, label: 'Album release', color: '#FF6B4A', h: 240 },
  { img: P.camera, label: 'Portrait session', color: '#4DA3FF', h: 210 },
  { img: P.video, label: 'Short film edit', color: '#4DA3FF', h: 190 },
  { img: P.sketch, label: 'Illustration', color: '#A78BFA', h: 250 },
  { img: P.typewriter, label: 'Scriptwriting', color: '#FFB547', h: 200 },
  { img: P.mic, label: 'Voiceover', color: '#FF5FA2', h: 230 },
];

const WORDS = [
  { text: 'photographers', color: '#4DA3FF' },
  { text: 'illustrators', color: '#A78BFA' },
  { text: 'DJs', color: '#FF6B4A' },
  { text: 'voice actors', color: '#FF5FA2' },
  { text: 'copywriters', color: '#FFB547' },
  { text: 'makeup artists', color: '#2DD4BF' },
  { text: 'producers', color: '#FF6B4A' },
  { text: 'videographers', color: '#4DA3FF' },
];

const DISCIPLINE_LOOK: Record<string, { img: string; color: string; short: string; skills: string[] }> = {
  'Music & Audio': { img: P.vinyl, color: '#FF6B4A', short: 'Producers, session players, DJs, mix engineers', skills: ['Music production', 'Mixing & mastering', 'Session musician', 'Vocalist', 'DJ', 'Sound design'] },
  'Photo & Video': { img: P.camera, color: '#4DA3FF', short: 'Photographers, videographers, editors', skills: ['Portrait & event photography', 'Product photography', 'Videography', 'Video editing', 'Motion graphics', 'Drone'] },
  'Design & Illustration': { img: P.swatches, color: '#A78BFA', short: 'Brand designers, illustrators, UI/UX', skills: ['Brand & graphic design', 'Illustration', 'UI/UX & web design', '3D & CGI', 'Murals'] },
  'Writing & Content': { img: P.typing, color: '#FFB547', short: 'Copywriters, scriptwriters, UGC creators', skills: ['Copywriting', 'Scriptwriting', 'Social media', 'UGC content', 'Editing & proofreading'] },
  'Performance & Events': { img: P.dancer, color: '#FF5FA2', short: 'Actors, dancers, hosts, voice actors', skills: ['Acting', 'Dance & choreography', 'Host & MC', 'Voiceover', 'Modelling', 'Live entertainment'] },
  'Fashion & Beauty': { img: P.makeup, color: '#2DD4BF', short: 'Makeup artists, stylists, designers', skills: ['Makeup artistry', 'Hair styling', 'Wardrobe styling', 'Fashion design & tailoring'] },
};

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Check = ({ color = '#C3F400', size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="font-mono text-xs tracking-[0.18em] text-brand-volt uppercase">{children}</span>
);

/* ---------------- HERO ---------------- */

export function LandingHero({ onFindGigs, onHire }: { onFindGigs: () => void; onHire: () => void }) {
  const reduce = useReducedMotion();
  const [wi, setWi] = useState(0);
  const [snap, setSnap] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let snapTimer: number | undefined;
    const t = window.setInterval(() => {
      setSnap(false);
      setWi((i) => {
        const next = i + 1;
        if (next >= WORDS.length) snapTimer = window.setTimeout(() => { setSnap(true); setWi(0); }, 650);
        return next;
      });
    }, 2300);
    return () => { window.clearInterval(t); if (snapTimer) window.clearTimeout(snapTimer); };
  }, [reduce]);

  const words = [...WORDS, WORDS[0]]; // extra copy so the loop scrolls forward seamlessly
  const cols = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]].map((idx) => {
    const l = idx.map((i) => TILES[i]);
    return l.concat(l);
  });

  return (
    <section className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center py-12 md:py-16 border-b border-white/5">
      <div className="relative z-10 lp-rise">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-7 border border-brand-volt/30 rounded-full font-mono text-xs text-brand-volt bg-brand-volt/5">
          <span className="w-2 h-2 rounded-full bg-brand-volt lp-pulse" />
          Now welcoming founding creatives
        </span>
        <h2 className="font-display text-[44px] sm:text-6xl lg:text-7xl text-white leading-[1.04] tracking-tight font-semibold">
          Paid gigs for
          <span className="block h-[1.08em] leading-[1.08] overflow-hidden" aria-live="polite">
            <span
              className="block"
              style={{
                transform: `translateY(-${wi * 1.08}em)`,
                transition: snap || reduce ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              {words.map((w, i) => (
                <span key={i} className="block h-[1.08em] leading-[1.08] italic whitespace-nowrap" style={{ color: w.color }}>{w.text}.</span>
              ))}
            </span>
          </span>
          Paid up front.
        </h2>
        <p className="mt-6 text-lg text-[#BDBDB6] leading-relaxed max-w-xl">
          Find creative work you’ll love. The gig provider pays before you start, and the money is released to you as each milestone is approved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onFindGigs} className="bg-brand-volt text-brand-bg font-semibold px-7 py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 glow-btn cursor-pointer">
            Find gigs
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <button onClick={onHire} className="border border-white/20 bg-white/5 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
            Hire a creative
          </button>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#BDBDB6]">
          {['Free to join', 'Creatives keep 100% of their rate', 'Payouts by Stripe'].map((t) => (
            <span key={t} className="flex items-center gap-2"><Check />{t}</span>
          ))}
        </div>
      </div>

      <div className="relative h-[380px] sm:h-[480px] lg:h-[600px] overflow-hidden grid grid-cols-3 gap-3 lp-fade-mask" aria-label="Examples of creative work">
        {cols.map((col, ci) => (
          <div key={ci} className={reduce ? '' : ci === 1 ? 'lp-col-down' : 'lp-col-up'} style={{ marginTop: ci === 2 ? 60 : 0 }}>
            {col.map((t, ti) => (
              <div key={ti} className="relative mb-3 rounded-2xl overflow-hidden bg-[#161616] lp-lift" style={{ height: t.h }}>
                <img src={photo(t.img)} alt={t.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-black/55" />
                <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] text-white">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />{t.label}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- DISCIPLINES ---------------- */

export function Disciplines({ onSeeGigs }: { onSeeGigs: (category: string) => void }) {
  const cats = GIG_CATEGORIES.filter((c) => DISCIPLINE_LOOK[c.key]);
  const [sel, setSel] = useState(1);
  const cur = cats[sel] ?? cats[0];
  const look = DISCIPLINE_LOOK[cur.key];

  return (
    <section className="py-16 border-b border-white/5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <Eyebrow>Six disciplines, one home</Eyebrow>
          <h3 className="font-display text-4xl md:text-5xl text-white font-semibold mt-3">Every kind of creative work</h3>
        </div>
        <p className="text-brand-text-muted max-w-sm">Pick your discipline to see the skills gig providers hire for.</p>
      </div>
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto hide-scrollbar snap-x -mx-4 px-4 md:mx-0 md:px-0">
        {cats.map((c, i) => {
          const l = DISCIPLINE_LOOK[c.key];
          const on = i === sel;
          return (
            <button
              key={c.key}
              onClick={() => setSel(i)}
              aria-pressed={on}
              className="snap-start shrink-0 w-[200px] md:w-auto text-left rounded-2xl overflow-hidden border transition-all lp-lift cursor-pointer"
              style={{ borderColor: on ? l.color : 'rgba(255,255,255,0.07)', background: on ? 'rgba(255,255,255,0.04)' : '#141414' }}
            >
              <div className="relative h-28">
                <img src={photo(l.img, 400, 240)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-3.5">
                <span className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />{c.key}
                </span>
                <span className="block mt-1 text-xs text-brand-text-muted leading-snug">{l.short}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div key={cur.key} className="mt-5 p-5 rounded-2xl border border-white/10 bg-[#141414] flex flex-col md:flex-row md:items-center gap-4 lp-pop">
        <span className="font-semibold text-white shrink-0" style={{ color: look.color }}>{cur.key}</span>
        <div className="flex flex-wrap gap-2 flex-1">
          {look.skills.map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-[#E6E6E0]">{s}</span>
          ))}
        </div>
        <button onClick={() => onSeeGigs(cur.key)} className="text-brand-volt font-semibold text-sm shrink-0 hover:underline cursor-pointer">
          See {cur.key} gigs →
        </button>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */

const STEPS = [
  { title: 'Agree the milestones', body: 'Get hired and agree what you’ll deliver, and what each milestone is worth.' },
  { title: 'The gig provider pays up front', body: 'The full amount is paid before you start and held by Protected Payments.' },
  { title: 'Deliver the work', body: 'Submit each milestone with your files, right inside the contract.' },
  { title: 'Get paid', body: 'Each approval releases that milestone’s money straight to your bank.' },
];
const STEP_MS = 3600;

export function HowItWorks() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [released, setReleased] = useState(0);
  const start = useRef(Date.now());
  const auto = playing && !reduce;

  const go = (i: number, keepPlaying: boolean) => {
    start.current = Date.now();
    setElapsed(0);
    setReleased(i === 3 && reduce ? 1500 : 0);
    setStep(i);
    if (!keepPlaying) setPlaying(false);
  };

  useEffect(() => {
    const t = window.setInterval(() => {
      const e = Date.now() - start.current;
      if (auto && e > STEP_MS) { go((step + 1) % 4, true); return; }
      setElapsed(Math.min(1, e / STEP_MS));
      if (step === 3) setReleased(Math.round(Math.min(1, e / 900) * 1500 * 100) / 100);
    }, 50);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, step]);

  const chips = [
    { l: 'SETTING UP', bg: 'rgba(255,255,255,0.08)', fg: '#E6E6E0' },
    { l: 'PROTECTED', bg: 'rgba(195,244,0,0.15)', fg: '#C3F400' },
    { l: 'IN REVIEW', bg: 'rgba(255,181,71,0.15)', fg: '#FFB547' },
    { l: 'PAID OUT', bg: 'rgba(195,244,0,0.15)', fg: '#C3F400' },
  ];
  const ms = (i: number) => {
    if (step === 0) return { status: 'DRAFT', dot: '#6E6E68', fill: false };
    if (step === 1) return { status: 'FUNDED', dot: '#C3F400', fill: false };
    if (step === 2) return i === 0 ? { status: 'SUBMITTED', dot: '#FFB547', fill: false } : { status: 'FUNDED', dot: '#C3F400', fill: false };
    return i === 0 ? { status: 'PAID OUT', dot: '#C3F400', fill: true } : { status: 'FUNDED', dot: '#C3F400', fill: false };
  };

  return (
    <section id="how" className="py-16 border-b border-white/5 grid lg:grid-cols-2 gap-10 items-center scroll-mt-20">
      <div>
        <Eyebrow>Protected Payments</Eyebrow>
        <h3 className="font-display text-4xl md:text-5xl text-white font-semibold mt-3 leading-tight">Get paid for every milestone. Never chase an invoice again.</h3>
        <ol className="mt-8 space-y-2">
          {STEPS.map((s, i) => {
            const on = step === i;
            return (
              <li key={i}>
                <button
                  onClick={() => go(i, false)}
                  className="w-full text-left flex gap-4 p-4 rounded-2xl border transition-colors cursor-pointer"
                  style={{ borderColor: on ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.06)', background: on ? 'rgba(195,244,0,0.05)' : 'transparent' }}
                >
                  <span className="font-mono text-sm pt-0.5" style={{ color: on ? '#C3F400' : '#6E6E68' }}>0{i + 1}</span>
                  <span className="flex-1">
                    <span className="block text-white font-semibold">{s.title}</span>
                    <span className="block text-sm text-brand-text-muted mt-1">{s.body}</span>
                    <span className="block mt-3 h-[2px] rounded bg-white/10 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                      <span className="block h-full bg-brand-volt" style={{ width: `${on ? (auto ? elapsed : 1) * 100 : 0}%` }} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={() => { start.current = Date.now(); setPlaying(!playing); }} className="h-11 px-4 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 cursor-pointer">
            {playing ? 'Pause demo' : 'Play demo'}
          </button>
          <span className="text-sm text-brand-text-muted">Tap any step to jump to it.</span>
        </div>
      </div>

      {/* contract mock */}
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 sm:p-7 shadow-2xl" aria-label="Example contract">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-brand-volt/15 text-brand-volt grid place-items-center text-xs font-semibold">You</span>
          <div className="flex-1 min-w-0">
            <span className="block font-display text-xl text-white">Product shoot · 20 items</span>
            <span className="block text-xs text-brand-text-muted">Photo &amp; Video · 2 milestones</span>
          </div>
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full" style={{ background: chips[step].bg, color: chips[step].fg }}>{chips[step].l}</span>
        </div>
        <div className="mt-6 space-y-2">
          {['Shoot day', 'Edited selects'].map((t, i) => {
            const m = ms(i);
            return (
              <div key={t} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: m.dot, background: m.fill ? m.dot : 'transparent' }} />
                <span className="flex-1 text-white text-sm">{t}</span>
                <span className="font-mono text-[11px] text-brand-text-muted">{m.status}</span>
                <span className="font-mono text-sm text-white">$1,500</span>
              </div>
            );
          })}
        </div>
        <div key={step} className="mt-5 min-h-[92px] lp-pop">
          {step === 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
              <div><span className="block text-xs text-brand-text-muted">Agreed total</span><span className="font-mono text-2xl text-white">$3,000.00</span></div>
              <span className="px-4 py-2 rounded-xl bg-brand-volt text-brand-bg text-sm font-semibold">Accept terms</span>
            </div>
          )}
          {step === 1 && (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-volt/30 bg-brand-volt/5">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C3F400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.5 8 9.5 4.6-1 8-4.5 8-9.5V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
              <div className="flex-1"><span className="block text-xs text-brand-text-muted">Held by Protected Payments</span><span className="font-mono text-2xl text-white">$3,090.00</span></div>
              <span className="text-xs text-brand-text-muted text-right">Paid by bank<br />incl. 3% fee</span>
            </div>
          )}
          {step === 2 && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
              <span className="w-11 h-11 rounded-xl bg-[#4DA3FF]/15 grid place-items-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
              </span>
              <div className="flex-1"><span className="block text-white text-sm font-semibold">selects_final.zip</span><span className="block text-xs text-brand-text-muted">Shoot day submitted for review</span></div>
              <span className="text-xs text-[#FFB547]">Awaiting approval</span>
            </div>
          )}
          {step === 3 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-volt text-brand-bg">
              <div><span className="block text-xs font-semibold opacity-70">Released to your bank</span><span className="font-mono text-2xl font-semibold">+{money(released)}</span></div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0E0E0E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- BOTH SIDES ---------------- */

export function BothSides() {
  const [aud, setAud] = useState<'creative' | 'provider'>('creative');
  const items = aud === 'creative'
    ? [
        { title: 'Money up front', body: 'Work only starts once the gig provider has paid. No more chasing invoices.' },
        { title: 'Gigs across every discipline', body: 'From brand shoots to voiceovers, find paid work that fits your skills.' },
        { title: 'A profile that sells you', body: 'Show your best work and let gig providers find you.' },
      ]
    : [
        { title: 'Find the right creative', body: 'Post a quest and get pitches from creatives across six disciplines.' },
        { title: 'Pay with confidence', body: 'Money is only released when you approve each milestone.' },
        { title: 'One workspace per hire', body: 'Milestones, messages and files for every hire in one place.' },
      ];
  return (
    <section className="py-16 border-b border-white/5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <h3 className="font-display text-4xl md:text-5xl text-white font-semibold">Built for both sides of the gig</h3>
        <div role="group" aria-label="Show benefits for" className="inline-flex p-1 rounded-full border border-white/10 bg-white/5 self-start">
          {(['creative', 'provider'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAud(a)}
              aria-pressed={aud === a}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
              style={{ background: aud === a ? '#C3F400' : 'transparent', color: aud === a ? '#0E0E0E' : '#CFCFC9' }}
            >
              {a === 'creative' ? 'I’m a creative' : 'I’m hiring'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((b, i) => (
          <div key={aud + i} className="p-7 rounded-3xl lp-pop lp-lift" style={{ background: i === 0 ? '#F5F5F2' : '#161616', color: i === 0 ? '#0E0E0E' : '#F5F5F2' }}>
            <span className="font-mono text-sm opacity-60">0{i + 1}</span>
            <span className="block font-display text-2xl mt-8">{b.title}</span>
            <span className="block mt-2 text-sm opacity-75 leading-relaxed">{b.body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FOUNDING CREATIVES ---------------- */

export function FoundingCreatives({ onClaim }: { onClaim: () => void }) {
  const perks = [
    { title: 'Founding badge', body: 'A permanent badge on your profile.' },
    { title: 'Featured on the Creatives page', body: 'Seen first by the first gig providers to join.' },
    { title: 'A direct line to the team', body: 'Tell us what to build next.' },
  ];
  return (
    <section className="my-16 rounded-3xl bg-brand-volt text-brand-bg p-8 md:p-14 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
      <div>
        <span className="font-mono text-xs tracking-[0.18em] uppercase opacity-70">Founding creatives</span>
        <h3 className="font-display text-4xl md:text-5xl font-semibold mt-3 leading-tight">Be one of the first 100 creatives on SideQuests.</h3>
        <p className="mt-4 text-base opacity-80 max-w-lg">We’re opening SideQuests to a small group first. Founding creatives help shape the platform, and get noticed first by the gig providers who join.</p>
        <button onClick={onClaim} className="mt-7 px-7 py-3.5 rounded-xl bg-brand-bg text-white font-semibold hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer">
          Claim a founding spot
        </button>
      </div>
      <ul className="space-y-3">
        {perks.map((p) => (
          <li key={p.title} className="flex gap-3 p-4 rounded-2xl bg-black/[0.07]">
            <Check color="#0E0E0E" size={22} />
            <span><span className="block font-semibold">{p.title}</span><span className="block text-sm opacity-75">{p.body}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- PRICING ---------------- */

export function PricingCalculator() {
  const [budget, setBudget] = useState(1000);
  const fee = Math.round(budget * 3) / 100;
  return (
    <section id="pricing-home" className="py-16 border-b border-white/5 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <Eyebrow>Simple pricing</Eyebrow>
        <h3 className="font-display text-4xl md:text-5xl text-white font-semibold mt-3">Free to join. <span className="text-brand-volt italic">3%</span> when you hire.</h3>
        <p className="mt-4 text-brand-text-muted max-w-md">The fee is paid by the gig provider, on top of the agreed amount. Creatives keep every cent of their rate.</p>
      </div>
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#141414]">
        <label htmlFor="lp-budget" className="flex justify-between text-sm text-brand-text-muted">
          Contract amount <span className="font-mono text-white">{money(budget)}</span>
        </label>
        <input id="lp-budget" type="range" min={100} max={20000} step={100} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} className="w-full mt-4 accent-[#C3F400]" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white/5">
            <span className="block text-xs text-brand-text-muted">Gig provider pays</span>
            <span className="block font-mono text-xl sm:text-2xl text-white mt-1">{money(budget + fee)}</span>
            <span className="block text-xs text-brand-text-muted mt-1">incl. {money(fee)} fee</span>
          </div>
          <div className="p-4 rounded-2xl bg-brand-volt/10 border border-brand-volt/30">
            <span className="block text-xs text-brand-text-muted">Creative receives</span>
            <span className="block font-mono text-xl sm:text-2xl text-brand-volt mt-1">{money(budget)}</span>
            <span className="block text-xs text-brand-text-muted mt-1">100% of the rate</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */

export function FinalCTA({ onJoin, onPost }: { onJoin: () => void; onPost: () => void }) {
  return (
    <section className="py-24 text-center">
      <h3 className="font-display text-4xl sm:text-6xl text-white font-semibold leading-tight">
        Your next gig is a <span className="text-brand-volt italic">side quest</span> away.
      </h3>
      <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
        <button onClick={onJoin} className="bg-brand-volt text-brand-bg font-semibold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all glow-btn cursor-pointer">Join as a creative</button>
        <button onClick={onPost} className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 active:scale-95 transition-colors cursor-pointer">Post a quest</button>
      </div>
      <p className="mt-10 text-xs text-[#6E6E68]">Photos: Unsplash</p>
    </section>
  );
}
