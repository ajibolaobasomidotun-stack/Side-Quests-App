import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Close } from './Icons';
import type { Quest } from '../types';

interface ApplyModalProps {
  quest: Quest | null;
  onClose: () => void;
  onSubmit: (quest: Quest, proposalText: string, bidAmount: number) => Promise<void>;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ quest, onClose, onSubmit }) => {
  const [proposal, setProposal] = useState('');
  const [bid, setBid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (quest) {
      setProposal('');
      setBid(String(quest.budget));
      setError(null);
    }
  }, [quest]);

  if (!quest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidAmount = Math.round(parseFloat(bid));
    if (proposal.trim().length < 20) {
      setError('Tell the studio a bit more (at least 20 characters): relevant credits, gear, availability.');
      return;
    }
    if (!bidAmount || bidAmount <= 0) {
      setError('Enter your rate for this quest in USD.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(quest, proposal.trim(), bidAmount);
      onClose();
    } catch (err) {
      setError('Could not send your application. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="bg-brand-container border border-white/15 rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl"
          role="dialog"
          aria-modal="true"
        >
          <button type="button" onClick={onClose} className="absolute top-5 right-5 text-brand-text-muted hover:text-white" aria-label="Close">
            <Close className="w-6 h-6" />
          </button>

          <span className="text-xs font-mono uppercase tracking-widest text-brand-volt font-semibold">Apply to quest</span>
          <h3 className="font-display text-xl text-white font-bold mt-1 mb-1 pr-8">{quest.title}</h3>
          <p className="text-xs text-brand-text-muted mb-6">
            {quest.clientName} · Budget ${quest.budget.toLocaleString()}
          </p>

          <label className="block text-[10px] font-mono uppercase tracking-widest text-white mb-2">Your pitch</label>
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder="Why you're right for this: relevant credits, gear, and when you can start."
            className="w-full bg-brand-bg border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl p-4 text-sm text-white placeholder:text-brand-text-muted mb-4"
          />

          <label className="block text-[10px] font-mono uppercase tracking-widest text-white mb-2">Your rate for this quest ($ USD)</label>
          <input
            type="number"
            min={1}
            value={bid}
            onChange={(e) => setBid(e.target.value)}
            className="w-full bg-brand-bg border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 px-4 text-sm text-white mb-4"
          />

          {error && <p className="text-xs text-red-400 mb-4" role="alert">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send application'}
            </button>
          </div>
        </motion.form>
      </div>
    </AnimatePresence>
  );
};
