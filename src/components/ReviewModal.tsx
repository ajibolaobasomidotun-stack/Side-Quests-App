/**
 * Review flow for a completed contract: quick stars and tags, role-specific
 * category ratings, "would work again" and an optional note. Plus the card
 * shown in the contract workspace that opens it and shows the outcome.
 */
import React, { useEffect, useState } from 'react';
import type { Contract, Review } from '../types';
import {
  REVIEW_WINDOW_DAYS,
  STAR_WORDS,
  canReview,
  fetchMyReview,
  fetchReviewOfMe,
  reviewDeadline,
  reviewErrorMessage,
  reviewSpecFor,
  submitReview
} from '../lib/reviews';
import { Avatar } from './Avatar';
import { Close, Star } from './Icons';
import { Stars } from './ProfileExtras';

type Toast = (message: string, type?: 'success' | 'info' | 'error') => void;

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

interface ReviewModalProps {
  contract: Contract;
  uid: string;
  onClose: () => void;
  onDone: (released: boolean) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ contract, uid, onClose, onDone }) => {
  const isClient = contract.clientUid === uid;
  const otherName = isClient ? contract.creativeName : contract.clientName;
  const otherAvatar = isClient ? contract.creativeAvatar : contract.clientAvatar;
  const otherUid = isClient ? contract.creativeUid : contract.clientUid;
  const otherReviewed = !!contract.reviewedBy?.includes(otherUid);
  const spec = reviewSpecFor(isClient ? 'creative' : 'provider');

  const [overall, setOverall] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [cats, setCats] = useState<Record<string, number>>({});
  const [again, setAgain] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const tagList = overall >= 4 ? spec.tags.good : spec.tags.bad;
  const ready = overall > 0 && spec.categories.every((c) => cats[c.key]) && again !== null;

  const pickStars = (n: number) => {
    setOverall(n);
    setTags([]);
    // Pre-fill categories with the overall score; people adjust what differs.
    setCats((prev) => Object.fromEntries(spec.categories.map((c) => [c.key, prev[c.key] || n])));
  };

  const submit = async () => {
    if (!ready) {
      setError('Pick stars, rate each category and say whether you’d work together again.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await submitReview({ contractId: contract.id, overall, categories: cats, tags, note: note.trim(), wouldWorkAgain: !!again });
      onDone(res.released);
    } catch (err) {
      setError(reviewErrorMessage(err));
      setBusy(false);
    }
  };

  const pill = (on: boolean) => `h-10 px-3.5 rounded-full border text-sm transition-colors ${
    on ? 'border-brand-volt bg-brand-volt/15 text-brand-volt' : 'border-white/15 text-white hover:border-white/30'
  }`;

  return (
    <div className="fixed inset-0 z-[60] bg-brand-bg/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="bg-brand-container border border-white/10 w-full sm:max-w-lg max-h-[94vh] rounded-t-3xl sm:rounded-3xl flex flex-col">
        <div className="flex justify-end p-3">
          <button onClick={onClose} disabled={busy} className="w-11 h-11 rounded-xl border border-white/10 grid place-items-center text-white" aria-label="Close">
            <Close className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-4 space-y-5">
          <div className="flex flex-col items-center text-center gap-2">
            <Avatar src={otherAvatar} name={otherName} className="w-16 h-16 rounded-2xl border-2 border-brand-volt text-xl" />
            <span className="font-mono text-[11px] tracking-[0.15em] text-brand-volt">CONTRACT COMPLETE</span>
            <h2 id="review-title" className="font-display text-2xl text-white font-semibold leading-tight">How was working with {otherName}?</h2>
            <span className="text-xs text-brand-text-muted">{contract.questTitle}</span>
          </div>

          <div className="rounded-xl p-3 bg-brand-volt/5 border border-brand-volt/25 text-xs text-white/90 leading-relaxed">
            {otherReviewed
              ? `${otherName} has already left their review. You’ll both see each other’s reviews as soon as you submit.`
              : `Reviews are blind: ${otherName} won’t see yours until they’ve left theirs, or the ${REVIEW_WINDOW_DAYS}-day window closes.`}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div role="radiogroup" aria-label="Overall rating" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={overall === n}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  onClick={() => pickStars(n)}
                  className="w-12 h-12 grid place-items-center"
                >
                  <Star className={`w-9 h-9 ${n <= overall ? 'text-[#FFB547]' : 'text-white/15'}`} />
                </button>
              ))}
            </div>
            <span className={`h-5 text-sm font-semibold ${overall >= 4 ? 'text-brand-volt' : 'text-[#FFB547]'}`}>{STAR_WORDS[overall]}</span>
          </div>

          {overall > 0 && (
            <>
              <div className="space-y-2 text-center">
                <span className="text-sm text-brand-text-muted">{overall >= 4 ? 'What went well?' : 'What could have been better?'}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {tagList.map((t) => {
                    const on = tags.includes(t);
                    return (
                      <button key={t} aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])} className={pill(on)}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {spec.categories.map((c) => (
                  <div key={c.key} className="p-3 rounded-xl bg-brand-container-low border border-white/5">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      <span className="text-[11px] text-brand-text-muted">{c.hint}</span>
                    </div>
                    <div role="radiogroup" aria-label={c.name} className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const on = cats[c.key] === n;
                        return (
                          <button
                            key={n}
                            role="radio"
                            aria-checked={on}
                            aria-label={`${c.name}: ${n} of 5`}
                            onClick={() => setCats({ ...cats, [c.key]: n })}
                            className={`h-10 rounded-lg border font-mono text-sm ${on ? 'bg-brand-volt border-brand-volt text-brand-bg' : 'border-white/10 text-white'}`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-brand-container-low border border-white/5 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">{isClient ? 'Would you hire them again?' : 'Would you work for them again?'}</span>
                <div className="flex gap-1.5">
                  <button aria-pressed={again === true} onClick={() => setAgain(true)} className={pill(again === true)}>Yes</button>
                  <button aria-pressed={again === false} onClick={() => setAgain(false)} className={pill(again === false)}>No</button>
                </div>
              </div>

              <label className="block text-xs text-brand-text-muted">
                Add a note (optional, shown on their profile)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="What stood out?"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-brand-bg text-white text-sm p-3 resize-none focus:outline-none focus:border-brand-volt"
                />
              </label>
            </>
          )}
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        </div>

        <div className="p-4 sm:px-7 border-t border-white/10">
          <button
            onClick={submit}
            disabled={busy || overall === 0}
            className="w-full h-12 rounded-xl bg-brand-volt text-brand-bg font-bold text-sm disabled:bg-white/10 disabled:text-brand-text-muted"
          >
            {busy ? 'Sending…' : otherReviewed ? 'Submit and unlock reviews' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Shown in the contract workspace once the contract is completed. */
export const ReviewCard: React.FC<{ contract: Contract; uid: string; showToast: Toast }> = ({ contract, uid, showToast }) => {
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<Review | null | undefined>(undefined);
  const [theirs, setTheirs] = useState<Review | null>(null);
  const isClient = contract.clientUid === uid;
  const otherName = isClient ? contract.creativeName : contract.clientName;
  const otherUid = isClient ? contract.creativeUid : contract.clientUid;
  const iReviewed = !!contract.reviewedBy?.includes(uid);
  const otherReviewed = !!contract.reviewedBy?.includes(otherUid);
  const deadline = reviewDeadline(contract);
  const windowOpen = !deadline || deadline.getTime() > Date.now();
  const reviewedKey = (contract.reviewedBy || []).join(',');

  useEffect(() => {
    let live = true;
    if (!iReviewed && windowOpen) { setMine(null); return; }
    fetchMyReview(contract.id, uid).then((r) => live && setMine(r)).catch(() => live && setMine(null));
    fetchReviewOfMe(contract, uid).then((r) => live && setTheirs(r));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.id, uid, reviewedKey, windowOpen]);

  if (contract.status !== 'completed') return null;

  return (
    <div className="rounded-2xl p-5 border bg-brand-container border-white/5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white font-semibold">Reviews</p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            {canReview(contract, uid)
              ? otherReviewed
                ? `${otherName} has left their review. Leave yours to see it.`
                : `Rate ${otherName}. Reviews stay hidden until you both submit${deadline ? `, or until ${fmtDate(deadline)}` : ''}.`
              : iReviewed
                ? mine?.released || theirs
                  ? 'Both reviews are public on your profiles.'
                  : `Your review is in. It shows once ${otherName} reviews you${deadline ? ` or on ${fmtDate(deadline)}` : ''}.`
                : 'The review window for this contract has closed.'}
          </p>
        </div>
        {canReview(contract, uid) && (
          <button onClick={() => setOpen(true)} className="bg-brand-volt text-brand-bg font-bold text-xs px-4 py-2 rounded-lg flex-shrink-0">
            Rate {otherName.split(' ')[0]}
          </button>
        )}
      </div>

      {theirs && (
        <div className="p-3 rounded-xl bg-brand-bg/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-text-muted">{otherName} rated you</span>
            <Stars value={theirs.overall} />
          </div>
          {theirs.note && <p className="text-sm text-white mt-2">{theirs.note}</p>}
          {theirs.tags.length > 0 && <p className="text-[11px] text-brand-text-muted mt-1">{theirs.tags.join(' · ')}</p>}
        </div>
      )}

      {open && (
        <ReviewModal
          contract={contract}
          uid={uid}
          onClose={() => setOpen(false)}
          onDone={(released) => {
            setOpen(false);
            showToast(released ? 'Review sent. Both reviews are now public.' : 'Review sent. It stays hidden until they review you.', 'success');
          }}
        />
      )}
    </div>
  );
};
