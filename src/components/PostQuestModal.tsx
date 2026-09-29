/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quest, UserProfile, GigCategory } from '../types';
import { GIG_CATEGORY_KEYS } from '../categories';
import { Close, Payments, VerifiedUser, Plus, Trash2, ArrowForward } from './Icons';

interface PostQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostQuest: (quest: Quest) => void;
  currentUser: UserProfile;
}

export const PostQuestModal: React.FC<PostQuestModalProps> = ({
  isOpen,
  onClose,
  onPostQuest,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GigCategory>('Photo & Video');
  const [budget, setBudget] = useState('3500');
  const [deadline, setDeadline] = useState('In 14 Days');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newReq, setNewReq] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const [milestones, setMilestones] = useState<{ title: string; amount: number }[]>([
    { title: 'Milestone 1: First draft / initial delivery', amount: 1750 },
    { title: 'Milestone 2: Final delivery & sign-off', amount: 1750 }
  ]);

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setRequirements(prev => [...prev, newReq.trim()]);
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalBudget = Math.round(parseFloat(budget));
    if (title.trim().length < 3) { setFormError('Give your quest a title.'); return; }
    if (description.trim().length < 20) { setFormError('Describe the work in at least a sentence or two.'); return; }
    if (!totalBudget || totalBudget <= 0) { setFormError('Enter a budget in USD.'); return; }
    setFormError(null);

    const newQuest: Quest = {
      id: `quest_${Date.now()}`,
      title: title.trim(),
      clientName: currentUser.organizationName || currentUser.displayName || 'Gig Provider',
      clientAvatar: currentUser.avatarUrl || '',
      category,
      budget: totalBudget,
      deadline: deadline || 'In 14 Days',
      description: description.trim(),
      requirements,
      milestones: [
        { title: milestones[0]?.title || 'Phase 1', amount: Math.round(totalBudget / 2) },
        { title: milestones[1]?.title || 'Phase 2', amount: totalBudget - Math.round(totalBudget / 2) }
      ].map((m, idx) => ({
        id: `qm_${Date.now()}_${idx}`,
        title: m.title,
        amount: m.amount,
        status: 'escrowed'
      })),
      status: 'open'
    };

    onPostQuest(newQuest);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-brand-container border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-brand-text-muted hover:text-white transition-colors"
            aria-label="Close"
          >
            <Close className="w-6 h-6" />
          </button>

          <div className="mb-6 border-b border-white/10 pb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-volt font-semibold">
              Gig Provider Portal
            </span>
            <h3 className="text-2xl font-bold text-white font-display mt-1">
              Post a New Quest
            </h3>
            <p className="text-xs text-brand-text-muted mt-1">
              Describe the work and creatives can start applying right away.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                Quest Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product photographer for a 20-item skincare launch"
                className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GigCategory)}
                  className="w-full bg-brand-container-high border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                >
                  {GIG_CATEGORY_KEYS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                  Budget ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-brand-text-muted text-sm">$</span>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBudget(val);
                      const num = parseFloat(val) || 0;
                      setMilestones([
                        { title: 'Milestone 1: First draft / initial delivery', amount: Math.round(num / 2) },
                        { title: 'Milestone 2: Final delivery & sign-off', amount: num - Math.round(num / 2) }
                      ]);
                    }}
                    className="w-full bg-brand-container-high border border-white/10 rounded-xl pl-8 pr-3 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                  Timeline / Deadline
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. In 14 Days"
                  className="w-full bg-brand-container-high border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                Quest Description & Deliverables *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you need, deliverables, dates, location (or remote), and anything the creative should know..."
                className="w-full bg-brand-container-high border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt resize-none leading-relaxed"
              />
            </div>

            {/* Requirements list */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                Requirements & Qualifications
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                  placeholder="e.g. Portfolio with e-commerce product shots"
                  className="flex-grow bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                />
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="bg-white/10 hover:bg-brand-volt hover:text-brand-bg text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-1.5">
                {requirements.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-brand-container-high/60 border border-white/5 px-3 py-1.5 rounded-lg text-xs text-white">
                    <span>• {r}</span>
                    <button type="button" onClick={() => handleRemoveRequirement(i)} className="text-brand-text-muted hover:text-red-400">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Protected Payments Notice */}
            <div className="bg-brand-volt/5 border border-brand-volt/20 rounded-xl p-3.5 flex items-center gap-3">
              <VerifiedUser className="w-5 h-5 text-brand-volt flex-shrink-0" />
              <div className="text-xs text-brand-text-muted">
                <span className="text-white font-semibold">Protected Payments:</span> The ${parseFloat(budget || '0').toLocaleString()} budget is paid up front when you select an applicant and released milestone by milestone.
              </div>
            </div>

            {formError && <p className="text-xs text-red-400" role="alert">{formError}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-volt/10 flex items-center gap-2"
              >
                Publish Quest
                <ArrowForward className="w-4 h-4" />
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
