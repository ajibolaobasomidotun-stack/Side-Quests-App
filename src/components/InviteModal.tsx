/**
 * Gig providers invite a creative to apply to one of their open quests.
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { Application, Invite, Quest, UserProfile } from '../types';
import { MAX_INVITE_NOTE, inviteId, sendInvite, withdrawInvite } from '../lib/invites';
import { Avatar } from './Avatar';
import { Close, Plus } from './Icons';

type Toast = (message: string, type?: 'success' | 'info' | 'error') => void;

interface InviteModalProps {
  creative: { id: string; name: string; avatarUrl?: string; roleLabel?: string } | null;
  provider: UserProfile & { id: string };
  quests: Quest[];
  sentInvites: Invite[];
  receivedApplications: Application[];
  onClose: () => void;
  onPostQuest: () => void;
  showToast: Toast;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  creative, provider, quests, sentInvites, receivedApplications, onClose, onPostQuest, showToast
}) => {
  const openQuests = useMemo(
    () => quests.filter((q) => q.clientUid === provider.id && q.status === 'open'),
    [quests, provider.id]
  );
  const [questId, setQuestId] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Status of this creative for each of my quests: invited / applied / free.
  const stateFor = (q: Quest): 'applied' | 'invited' | 'declined' | null => {
    if (!creative) return null;
    if (receivedApplications.some((a) => a.questId === q.id && a.applicantUid === creative.id)) return 'applied';
    const inv = sentInvites.find((i) => i.id === inviteId(q.id, creative.id));
    if (!inv) return null;
    return inv.status === 'applied' ? 'applied' : inv.status === 'declined' ? 'declined' : 'invited';
  };

  useEffect(() => {
    if (!creative) return;
    setNote('');
    setQuestId(openQuests.find((q) => !stateFor(q))?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creative?.id]);

  useEffect(() => {
    if (!creative) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [creative, busy, onClose]);

  if (!creative) return null;
  const firstName = creative.name.split(' ')[0];
  const selected = openQuests.find((q) => q.id === questId) || null;

  const send = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await sendInvite(provider, selected, creative, note);
      showToast(`Invited ${firstName} to apply to “${selected.title}”.`, 'success');
      onClose();
    } catch (err) {
      console.warn(err);
      showToast('Couldn’t send that invite. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (q: Quest) => {
    setBusy(true);
    try {
      await withdrawInvite(inviteId(q.id, creative.id));
      showToast('Invite withdrawn.', 'info');
    } catch {
      showToast('Couldn’t withdraw that invite.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-brand-bg/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title" onClick={() => !busy && onClose()}>
      <div className="bg-brand-container border border-white/10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={creative.avatarUrl} name={creative.name} className="w-12 h-12 rounded-xl text-sm" />
            <div className="min-w-0">
              <h3 id="invite-title" className="font-display text-xl text-white font-semibold leading-tight">Invite {firstName} to apply</h3>
              {creative.roleLabel && <p className="text-xs text-brand-text-muted truncate">{creative.roleLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} disabled={busy} className="w-10 h-10 rounded-xl border border-white/10 grid place-items-center text-white flex-shrink-0" aria-label="Close">
            <Close className="w-5 h-5" />
          </button>
        </div>

        {openQuests.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-5 text-center">
            <p className="text-sm text-white font-semibold">You don’t have an open quest yet</p>
            <p className="text-xs text-brand-text-muted mt-1">Post a quest first, then invite {firstName} to apply to it.</p>
            <button onClick={() => { onClose(); onPostQuest(); }} className="mt-4 bg-brand-volt text-brand-bg font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post a quest
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-brand-text-muted mb-2">Which quest?</p>
            <ul className="space-y-2" role="radiogroup" aria-label="Quest">
              {openQuests.map((q) => {
                const state = stateFor(q);
                const on = q.id === questId;
                return (
                  <li key={q.id}>
                    <div
                      role="radio"
                      aria-checked={on}
                      aria-disabled={!!state}
                      tabIndex={state ? -1 : 0}
                      onClick={() => !state && setQuestId(q.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !state && (e.preventDefault(), setQuestId(q.id))}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        state ? 'border-white/5 opacity-70' : on ? 'border-brand-volt bg-brand-volt/10 cursor-pointer' : 'border-white/10 hover:border-white/25 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{q.title}</p>
                        <p className="text-[11px] text-brand-text-muted font-mono">${q.budget.toLocaleString()} · {q.category}</p>
                      </div>
                      {state === 'invited' ? (
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-brand-volt">Invited</span>
                          <button onClick={(e) => { e.stopPropagation(); withdraw(q); }} disabled={busy} className="text-[11px] text-brand-text-muted underline hover:text-red-300">Withdraw</button>
                        </span>
                      ) : state === 'applied' ? (
                        <span className="text-[11px] text-brand-volt flex-shrink-0">Applied</span>
                      ) : state === 'declined' ? (
                        <span className="text-[11px] text-brand-text-muted flex-shrink-0">Declined</span>
                      ) : (
                        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${on ? 'border-brand-volt bg-brand-volt' : 'border-white/30'}`} aria-hidden="true" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <label className="block mt-4 text-xs text-brand-text-muted">
              Add a note (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={MAX_INVITE_NOTE}
                rows={3}
                placeholder={`Why ${firstName} would be great for this…`}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-brand-bg text-white text-sm p-3 resize-none focus:outline-none focus:border-brand-volt"
              />
            </label>
            <p className="text-[11px] text-brand-text-muted mt-2">
              {firstName} will see your invite in My work and can apply with their own pitch and rate, or decline.
            </p>

            <button
              onClick={send}
              disabled={busy || !selected}
              className="mt-4 w-full h-12 rounded-xl bg-brand-volt text-brand-bg font-bold text-sm disabled:bg-white/10 disabled:text-brand-text-muted"
            >
              {busy ? 'Sending…' : selected ? 'Send invite' : 'Already invited to all your open quests'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
