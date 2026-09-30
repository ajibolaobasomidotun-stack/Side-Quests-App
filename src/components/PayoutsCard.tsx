import React, { useState } from 'react';
import { startPayoutOnboarding, openPayoutDashboard, paymentErrorMessage } from '../lib/contracts';
import { Payments } from './Icons';

interface PayoutsCardProps {
  payoutsReady: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

/** Creatives: set up (or manage) Stripe payouts so they can be paid for contracts. */
export const PayoutsCard: React.FC<PayoutsCardProps> = ({ payoutsReady, showToast }) => {
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<string>, newTab: boolean) => {
    setBusy(true);
    try {
      const url = await fn();
      if (newTab) {
        window.open(url, '_blank', 'noopener');
        setBusy(false);
      } else {
        window.location.href = url;
      }
    } catch (err) {
      showToast(paymentErrorMessage(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto mb-6 rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      payoutsReady ? 'bg-brand-container border-white/5' : 'bg-brand-volt/5 border-brand-volt/25'
    }`}>
      <div className="flex items-start gap-3">
        <Payments className="w-6 h-6 text-brand-volt flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white font-semibold">{payoutsReady ? 'Payouts are set up' : 'Set up payouts to get paid'}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {payoutsReady
              ? 'Money for approved milestones goes straight to your bank account through Stripe.'
              : 'You need this before accepting a contract. Stripe verifies your identity and holds your bank details; SideQuests never sees them.'}
          </p>
        </div>
      </div>
      <button
        disabled={busy}
        onClick={() => (payoutsReady ? go(openPayoutDashboard, true) : go(startPayoutOnboarding, false))}
        className={payoutsReady
          ? 'border border-white/10 text-white font-sans text-xs px-4 py-2 rounded-lg hover:bg-white/5 disabled:opacity-50 whitespace-nowrap'
          : 'bg-brand-volt text-brand-bg font-sans font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap'}
      >
        {busy ? 'Opening Stripe…' : payoutsReady ? 'View payouts' : 'Set up payouts'}
      </button>
    </div>
  );
};
