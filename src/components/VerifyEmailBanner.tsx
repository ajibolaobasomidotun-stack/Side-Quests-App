/**
 * Shown to signed-in email accounts that haven't verified their address yet.
 * Until they do, the database rules block posting, applying, inviting,
 * messaging and paying.
 */
import React, { useEffect, useState } from 'react';
import { refreshEmailVerified, sendVerificationEmail } from '../lib/firebase';

type Toast = (message: string, type?: 'success' | 'info' | 'error') => void;

const RESEND_COOLDOWN_S = 60;

export const VerifyEmailBanner: React.FC<{ email: string; onVerified: () => void; showToast: Toast }> = ({ email, onVerified, showToast }) => {
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  // Check again whenever they come back to the tab (e.g. after clicking the link in their inbox).
  useEffect(() => {
    const onFocus = () => { refreshEmailVerified().then((ok) => ok && onVerified()).catch(() => undefined); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [onVerified]);

  const resend = async () => {
    try {
      await sendVerificationEmail();
      setCooldown(RESEND_COOLDOWN_S);
      showToast(`Verification link sent to ${email}.`, 'success');
    } catch (err: any) {
      showToast(err?.code === 'auth/too-many-requests' ? 'Too many emails sent. Please wait a few minutes and try again.' : 'Couldn’t send the email. Please try again.', 'error');
    }
  };

  const check = async () => {
    setChecking(true);
    try {
      if (await refreshEmailVerified()) {
        onVerified();
        showToast('Email verified. You’re all set.', 'success');
      } else {
        showToast('Not verified yet. Click the link in the email we sent, then try again.', 'info');
      }
    } catch {
      showToast('Couldn’t check right now. Please try again.', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-[#FFB547]/10 border-b border-[#FFB547]/30" role="status">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="text-xs text-white flex-1 leading-relaxed">
          <span className="font-semibold">Verify your email to get started.</span>{' '}
          <span className="text-white/80">We sent a link to <span className="text-white">{email}</span>. You’ll need it to post quests, apply, invite or pay.</span>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={check} disabled={checking} className="text-xs font-bold bg-[#FFB547] text-brand-bg px-3 py-1.5 rounded-lg disabled:opacity-60">
            {checking ? 'Checking…' : 'I’ve verified'}
          </button>
          <button onClick={resend} disabled={cooldown > 0} className="text-xs text-white border border-white/20 px-3 py-1.5 rounded-lg disabled:opacity-60">
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          </button>
        </div>
      </div>
    </div>
  );
};
