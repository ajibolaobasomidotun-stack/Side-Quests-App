import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Close } from './Icons';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  authErrorMessage
} from '../lib/firebase';
import { AGE_CONFIRM_LABEL, rememberAgeConfirmed } from '../lib/age';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'signin', onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  // New accounts must confirm they're 18+ before creating an account (email or Google).
  const needsAge = mode === 'signup';
  const ageOk = () => {
    if (!needsAge) return true;
    if (!isAdult) {
      setError('You need to be 18 or older to use SideQuests. Please confirm your age to continue.');
      return false;
    }
    rememberAgeConfirmed();
    return true;
  };

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const run = async (fn: () => Promise<unknown>, closeAfter = true) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (closeAfter) onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(authErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name.'); return; }
      if (!ageOk()) return;
      run(() => signUpWithEmail(name, email.trim(), password));
    } else if (mode === 'signin') {
      run(() => signInWithEmail(email.trim(), password));
    } else {
      run(async () => {
        await resetPassword(email.trim());
        setNotice('If an account exists for that email, a reset link is on its way.');
      }, false);
    }
  };

  const inputClass = 'w-full bg-brand-bg border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-text-muted';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-brand-container border border-white/15 rounded-3xl max-w-md w-full p-6 md:p-8 relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-brand-text-muted hover:text-white" aria-label="Close">
            <Close className="w-6 h-6" />
          </button>

          <span className="text-xs font-mono uppercase tracking-widest text-brand-volt font-semibold">SideQuests</span>
          <h3 id="auth-title" className="font-display text-2xl text-white font-bold mt-1 mb-6">
            {mode === 'signup' ? 'Create your account' : mode === 'signin' ? 'Welcome back' : 'Reset your password'}
          </h3>

          {needsAge && (
            <label className="flex items-start gap-3 mb-4 p-3 rounded-xl border border-white/10 bg-brand-bg/60 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(e) => { setIsAdult(e.target.checked); setError(null); }}
                className="mt-0.5 w-4 h-4 accent-[#C3F400] flex-shrink-0"
              />
              <span className="text-xs text-white leading-relaxed">
                {AGE_CONFIRM_LABEL} <span className="text-brand-text-muted">SideQuests is only for adults.</span>
              </span>
            </label>
          )}

          {mode !== 'reset' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => { if (ageOk()) run(() => signInWithGoogle()); }}
                className="w-full flex items-center justify-center gap-2 bg-white text-brand-bg font-sans font-bold text-sm py-3 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 my-5 text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">
                <span className="flex-1 h-px bg-white/10" /> or with email <span className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input className={inputClass} placeholder="Full name or business name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            )}
            <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            {mode !== 'reset' && (
              <input
                className={inputClass}
                type="password"
                placeholder={mode === 'signup' ? 'Password (6+ characters)' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            )}

            {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
            {notice && <p className="text-xs text-brand-volt">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand-volt text-brand-bg font-sans font-bold text-sm py-3 rounded-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-5 text-xs text-brand-text-muted flex flex-wrap justify-between gap-2">
            {mode === 'signin' && (
              <>
                <button className="hover:text-white" onClick={() => setMode('reset')}>Forgot password?</button>
                <button className="text-brand-volt hover:underline" onClick={() => setMode('signup')}>New here? Create an account</button>
              </>
            )}
            {mode === 'signup' && (
              <button className="text-brand-volt hover:underline" onClick={() => setMode('signin')}>Already have an account? Sign in</button>
            )}
            {mode === 'reset' && (
              <button className="text-brand-volt hover:underline" onClick={() => setMode('signin')}>Back to sign in</button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
