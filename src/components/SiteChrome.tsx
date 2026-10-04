import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';

export type Tab = 'quests' | 'creatives' | 'learn' | 'pricing' | 'tasks' | 'profile' | 'terms' | 'privacy';

type Nav = {
  activeTab: Tab;
  go: (tab: Tab) => void;          // switch tab and scroll to top
  findGigs: () => void;            // quests tab, scroll to the quest list
  howItWorks: () => void;          // quests tab, scroll to the Protected Payments demo
  openProfile: () => void;
};

type Account = {
  signedIn: boolean;
  isProvider: boolean;
  name: string;
  avatarUrl: string;
  onSignIn: () => void;
  onJoin: () => void;
  onSignOut: () => void;
  onPostQuest: () => void;
};

const Logo = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 cursor-pointer" aria-label="SideQuests home">
    <span className="w-2.5 h-2.5 rounded-full bg-brand-volt" />
    <span className="font-display text-2xl font-semibold tracking-tight text-white">SideQuests</span>
  </button>
);

function useLinks(nav: Nav, signedIn: boolean) {
  const links: { label: string; onClick: () => void; active: boolean }[] = [
    { label: 'Find gigs', onClick: nav.findGigs, active: nav.activeTab === 'quests' },
    { label: 'Creatives', onClick: () => nav.go('creatives'), active: nav.activeTab === 'creatives' },
    { label: 'How it works', onClick: nav.howItWorks, active: false },
    { label: 'Pricing', onClick: () => nav.go('pricing'), active: nav.activeTab === 'pricing' },
    { label: 'Guides', onClick: () => nav.go('learn'), active: nav.activeTab === 'learn' },
  ];
  if (signedIn) links.push({ label: 'My work', onClick: () => nav.go('tasks'), active: nav.activeTab === 'tasks' });
  return links;
}

/* ---------------- HEADER ---------------- */

export function SiteHeader({ nav, account }: { nav: Nav; account: Account }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const links = useLinks(nav, account.signedIn);
  const firstName = (account.name || '').split(' ')[0] || 'Account';

  // close menus on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setUserMenu(false); setMenuOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  // lock page scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const run = (fn: () => void) => () => { setMenuOpen(false); setUserMenu(false); fn(); };

  return (
    <>
    <header className="fixed top-0 w-full h-16 z-40 bg-brand-bg/85 backdrop-blur-md border-b border-white/10" role="banner">
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        <Logo onClick={run(() => nav.go('quests'))} />

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={run(l.onClick)}
              aria-current={l.active ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${l.active ? 'text-white bg-white/5' : 'text-[#BDBDB6] hover:text-white'}`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {account.signedIn ? (
            <>
              {account.isProvider && (
                <button onClick={run(account.onPostQuest)} className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl bg-brand-volt text-brand-bg text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer">
                  Post a quest
                </button>
              )}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenu((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  className="flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full border border-white/10 bg-white/5 hover:border-white/25 transition-colors cursor-pointer"
                >
                  <Avatar src={account.avatarUrl} name={account.name} className="w-7 h-7 rounded-full text-[10px]" />
                  <span className="hidden sm:inline text-sm text-white max-w-[110px] truncate">{firstName}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A96" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {userMenu && (
                  <div role="menu" className="absolute right-0 mt-2 w-52 p-1.5 rounded-2xl border border-white/10 bg-[#161616] shadow-2xl lp-pop">
                    {[
                      { label: 'My profile', fn: nav.openProfile },
                      { label: 'My work', fn: () => nav.go('tasks') },
                      ...(account.isProvider ? [{ label: 'Post a quest', fn: account.onPostQuest }] : []),
                    ].map((i) => (
                      <button key={i.label} role="menuitem" onClick={run(i.fn)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-white hover:bg-white/5 cursor-pointer">{i.label}</button>
                    ))}
                    <div className="my-1 border-t border-white/10" />
                    <button role="menuitem" onClick={run(account.onSignOut)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-[#BDBDB6] hover:text-red-400 hover:bg-white/5 cursor-pointer">Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={run(account.onSignIn)} className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl text-sm text-white hover:bg-white/5 cursor-pointer">Sign in</button>
              <button onClick={run(account.onJoin)} className="inline-flex h-10 items-center px-4 rounded-xl bg-brand-volt text-brand-bg text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer glow-btn">Join free</button>
            </>
          )}

          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="lg:hidden w-10 h-10 grid place-items-center rounded-xl border border-white/10 text-white cursor-pointer"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>

      {/* mobile / tablet menu (outside the header: its backdrop blur would trap a fixed child) */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-brand-bg backdrop-blur-md border-t border-white/10 overflow-y-auto lp-pop">
          <nav aria-label="Main" className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={run(l.onClick)}
                className={`text-left py-4 border-b border-white/5 font-display text-2xl cursor-pointer ${l.active ? 'text-brand-volt' : 'text-white'}`}
              >
                {l.label}
              </button>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              {account.signedIn ? (
                <>
                  {account.isProvider && <button onClick={run(account.onPostQuest)} className="h-12 rounded-xl bg-brand-volt text-brand-bg font-semibold cursor-pointer">Post a quest</button>}
                  <button onClick={run(nav.openProfile)} className="h-12 rounded-xl border border-white/15 text-white font-semibold cursor-pointer">My profile</button>
                  <button onClick={run(account.onSignOut)} className="h-12 rounded-xl text-[#BDBDB6] cursor-pointer">Sign out</button>
                </>
              ) : (
                <>
                  <button onClick={run(account.onJoin)} className="h-12 rounded-xl bg-brand-volt text-brand-bg font-semibold cursor-pointer">Join free</button>
                  <button onClick={run(account.onSignIn)} className="h-12 rounded-xl border border-white/15 text-white font-semibold cursor-pointer">Sign in</button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

/* ---------------- FOOTER ---------------- */

export function SiteFooter({ nav, account }: { nav: Nav; account: Account }) {
  const col = (title: string, items: { label: string; onClick: () => void }[]) => (
    <div>
      <h5 className="font-mono text-[11px] text-white uppercase tracking-[0.16em] mb-4">{title}</h5>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.label}>
            <button onClick={i.onClick} className="text-sm text-brand-text-muted hover:text-white transition-colors cursor-pointer">{i.label}</button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="border-t border-white/10 mt-8 pb-24 md:pb-0" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-10 grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
        <div className="col-span-2 md:col-span-1">
          <Logo onClick={() => nav.go('quests')} />
          <p className="mt-4 text-sm text-brand-text-muted leading-relaxed max-w-xs">
            Paid gigs for creatives of every kind. The gig provider pays up front, and the money is released as each milestone is approved.
          </p>
        </div>
        {col('For creatives', [
          { label: 'Find gigs', onClick: nav.findGigs },
          { label: 'How it works', onClick: nav.howItWorks },
          { label: 'Guides', onClick: () => nav.go('learn') },
        ])}
        {col('For gig providers', [
          { label: 'Post a quest', onClick: account.onPostQuest },
          { label: 'Browse creatives', onClick: () => nav.go('creatives') },
          { label: 'Pricing', onClick: () => nav.go('pricing') },
        ])}
        {col('Account', account.signedIn
          ? [
              { label: 'My profile', onClick: nav.openProfile },
              { label: 'My work', onClick: () => nav.go('tasks') },
              { label: 'Sign out', onClick: account.onSignOut },
            ]
          : [
              { label: 'Join free', onClick: account.onJoin },
              { label: 'Sign in', onClick: account.onSignIn },
            ])}
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#6E6E68]">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} SideQuests</span>
          <button onClick={() => nav.go('terms')} className="hover:text-white cursor-pointer">Terms</button>
          <button onClick={() => nav.go('privacy')} className="hover:text-white cursor-pointer">Privacy</button>
        </span>
        <span>Payments by Stripe · Photos: Unsplash</span>
      </div>
    </footer>
  );
}

/* ---------------- MOBILE TAB BAR ---------------- */

const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export function MobileTabBar({ nav, account }: { nav: Nav; account: Account }) {
  const items = [
    { label: 'Gigs', tab: 'quests' as Tab, d: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3', onClick: () => nav.go('quests') },
    { label: 'Creatives', tab: 'creatives' as Tab, d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', onClick: () => nav.go('creatives') },
    account.signedIn
      ? { label: 'My work', tab: 'tasks' as Tab, d: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', onClick: () => nav.go('tasks') }
      : { label: 'Pricing', tab: 'pricing' as Tab, d: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', onClick: () => nav.go('pricing') },
    account.signedIn
      ? { label: 'Profile', tab: 'profile' as Tab, d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', onClick: nav.openProfile }
      : { label: 'Join', tab: null, d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6', onClick: account.onJoin },
  ];
  return (
    <nav aria-label="Quick navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-brand-bg/95 backdrop-blur-md border-t border-white/10 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {items.map((i) => {
        const on = i.tab !== null && nav.activeTab === i.tab;
        return (
          <button key={i.label} onClick={i.onClick} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] cursor-pointer ${on ? 'text-brand-volt' : 'text-[#9A9A96]'}`}>
            <Icon d={i.d} />
            {i.label}
          </button>
        );
      })}
    </nav>
  );
}
