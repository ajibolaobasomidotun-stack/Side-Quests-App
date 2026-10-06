import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Verified } from './Icons';
import { PLATFORM_FEE_RATE } from '../lib/contracts';

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PricingSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [budget, setBudget] = useState('1000');
  const amount = Math.max(0, parseFloat(budget) || 0);
  const fee = Math.round(amount * 100 * PLATFORM_FEE_RATE) / 100;

  const steps = [
    ['Agree the milestones', 'The gig provider and creative agree what will be delivered, and what each milestone is worth.'],
    ['Pay up front', 'The gig provider pays the agreed amount, with no fees on top. The money is held by SideQuests Protected Payments.'],
    ['Approve and release', 'As each milestone is approved, its payment is released to the creative’s bank account. The 3% fee on the total comes off the final payout.']
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
      <div className="mb-10 max-w-xl">
        <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">Simple, flat pricing</h3>
        <p className="text-brand-text-muted text-sm mt-1">Free to join, free to post quests, free to apply. One fee when a contract is paid.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-brand-container border border-brand-volt/20 p-8 rounded-2xl">
          <span className="font-mono text-xs text-brand-volt uppercase tracking-wider">Platform fee</span>
          <div className="flex items-baseline gap-2 mt-2 mb-2">
            <span className="font-display text-6xl font-extrabold text-white">3%</span>
            <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider">of what the creative earns</span>
          </div>
          <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
            Gig providers pay the agreed amount and nothing more. The 3% fee is worked out on the contract total and taken from the creative’s final payout, so creatives keep 97% of their rate.
          </p>
          <ul className="space-y-3 border-t border-white/5 pt-6">
            {[
              'Protected Payments on every contract',
              'Money released milestone by milestone',
              'Messages and file delivery in every contract',
              'Pay by US bank account (recommended) or card',
              'Help from the SideQuests team if something goes wrong'
            ].map((t) => (
              <li key={t} className="text-xs text-brand-text-muted flex items-center gap-2">
                <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <button onClick={onGetStarted} className="mt-8 w-full bg-brand-volt text-brand-bg font-sans font-bold text-xs py-3.5 rounded-xl hover:scale-[1.01] active:scale-95 transition-all">
            Get started free
          </button>
        </div>

        <div className="bg-brand-container border border-white/5 p-8 rounded-2xl">
          <h4 className="font-display text-xl text-white font-bold mb-2">Fee calculator</h4>
          <p className="text-xs text-brand-text-muted mb-5">Enter a contract amount to see what each side pays and receives.</p>
          <label className="font-mono text-[10px] text-brand-text-muted uppercase tracking-wider block mb-2 font-semibold">Contract amount ($)</label>
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-brand-bg border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-volt focus:outline-none text-white font-mono"
          />
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-brand-text-muted">Contract amount</span><span className="text-white font-mono">{fmt(amount)}</span></div>
            <div className="flex justify-between"><span className="text-brand-text-muted">Platform fee (3%)</span><span className="text-white font-mono">{fmt(fee)}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-2"><span className="text-white font-semibold">Gig provider pays</span><span className="text-brand-volt font-mono font-bold">{fmt(amount)}</span></div>
            <div className="flex justify-between"><span className="text-white font-semibold">Creative receives</span><span className="text-brand-volt font-mono font-bold">{fmt(Math.max(0, amount - fee))}</span></div>
          </div>
          <p className="text-[11px] text-brand-text-muted mt-5 leading-relaxed">
            Paying by US bank account keeps costs low for everyone. Card payments are also accepted.
            Payouts are handled by Stripe; creatives set up payouts once before accepting their first contract.
          </p>
        </div>
      </div>

      <div className="bg-brand-container border border-white/5 p-8 rounded-2xl">
        <h4 className="font-display text-xl text-white font-bold mb-6">How Protected Payments work</h4>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="font-mono text-brand-volt text-sm font-bold">0{i + 1}</span>
              <p className="text-sm text-white font-semibold mt-1">{title}</p>
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
};
