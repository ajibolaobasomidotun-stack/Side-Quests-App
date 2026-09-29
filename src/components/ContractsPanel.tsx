import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Contract, ContractMessage, Milestone, UserProfile } from '../types';
import {
  subscribeMilestones,
  subscribeMessages,
  sendMessage,
  uploadContractFile,
  getFileUrl,
  saveMilestonePlan,
  setContractStatus,
  completeContract,
  cancelContract,
  submitMilestone,
  reviewMilestone,
  MAX_UPLOAD_BYTES
} from '../lib/contracts';
import { Avatar } from './Avatar';
import { AttachFile, Send, CheckCircle, Close, Plus, Trash2, ChevronLeft, Download, Work } from './Icons';

type Toast = (message: string, type?: 'success' | 'info' | 'error') => void;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

const formatBytes = (b: number) =>
  b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(1)} GB`
  : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB`
  : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`;

const formatTime = (d: Date | null) =>
  d ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Sending…';

const CONTRACT_STATUS: Record<Contract['status'], { label: string; cls: string }> = {
  setup: { label: 'Setting up', cls: 'bg-white/5 text-white border-white/15' },
  proposed: { label: 'Awaiting acceptance', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  active: { label: 'In progress', cls: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  completed: { label: 'Completed', cls: 'bg-brand-volt/15 text-brand-volt border-brand-volt/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-300 border-red-500/20' }
};

const MILESTONE_STATUS: Record<Milestone['status'], { label: string; cls: string }> = {
  pending: { label: 'Not started', cls: 'bg-white/5 text-brand-text-muted border-white/10' },
  submitted: { label: 'Submitted for review', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  changes_requested: { label: 'Changes requested', cls: 'bg-red-500/10 text-red-300 border-red-500/20' },
  approved: { label: 'Approved', cls: 'bg-brand-volt/15 text-brand-volt border-brand-volt/30' }
};

const Chip: React.FC<{ label: string; cls: string }> = ({ label, cls }) => (
  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border whitespace-nowrap ${cls}`}>{label}</span>
);

const btnPrimary = 'bg-brand-volt text-brand-bg font-sans font-bold text-xs px-4 py-2 rounded-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100';
const btnGhost = 'border border-white/10 text-white font-sans text-xs px-4 py-2 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50';
const inputCls = 'w-full bg-brand-bg border border-white/10 focus:border-brand-volt focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder:text-brand-text-muted';

// ---------------------------------------------------------------------------
// Panel: list + workspace
// ---------------------------------------------------------------------------

interface ContractsPanelProps {
  uid: string;
  profile: UserProfile;
  contracts: Contract[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBrowse: () => void;
  showToast: Toast;
}

export const ContractsPanel: React.FC<ContractsPanelProps> = ({ uid, profile, contracts, selectedId, onSelect, onBrowse, showToast }) => {
  const selected = contracts.find((c) => c.id === selectedId) || null;

  if (contracts.length === 0) {
    return (
      <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
        <Work className="w-10 h-10 text-brand-text-muted mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-1">No contracts yet</p>
        <p className="text-xs text-brand-text-muted mb-4">
          {profile.accountType === 'provider'
            ? 'When you hire a creative for one of your quests, the contract opens here.'
            : 'When a gig provider hires you, the contract opens here.'}
        </p>
        <button onClick={onBrowse} className={btnPrimary}>
          {profile.accountType === 'provider' ? 'Review applicants' : 'Browse quests'}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List */}
      <div className={`lg:col-span-4 space-y-2 ${selected ? 'hidden lg:block' : ''}`}>
        {contracts.map((c) => {
          const isClient = c.clientUid === uid;
          const otherName = isClient ? c.creativeName : c.clientName;
          const otherAvatar = isClient ? c.creativeAvatar : c.clientAvatar;
          const s = CONTRACT_STATUS[c.status];
          const unreadHint = c.lastMessageBy && c.lastMessageBy !== uid && c.id !== selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex gap-3 ${
                c.id === selectedId ? 'bg-brand-container-high border-brand-volt/40' : 'bg-brand-container border-white/5 hover:border-white/15'
              }`}
            >
              <Avatar src={otherAvatar} name={otherName} className="w-10 h-10 rounded-lg text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white font-semibold truncate">{c.questTitle}</span>
                  {unreadHint && <span className="w-2 h-2 rounded-full bg-brand-volt flex-shrink-0" title="New message" />}
                </div>
                <p className="text-[11px] text-brand-text-muted truncate">
                  {isClient ? 'Creative' : 'Gig provider'}: {otherName} · {money(c.totalAmount)}
                </p>
                <div className="mt-1.5"><Chip {...s} /></div>
                {c.lastMessagePreview && <p className="text-[11px] text-brand-text-muted truncate mt-1.5">{c.lastMessagePreview}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className={`lg:col-span-8 ${selected ? '' : 'hidden lg:block'}`}>
        {selected ? (
          <ContractWorkspace key={selected.id} contract={selected} uid={uid} profile={profile} onBack={() => onSelect(null)} showToast={showToast} />
        ) : (
          <div className="bg-brand-container border border-white/5 rounded-2xl p-12 text-center">
            <p className="text-sm text-white font-semibold mb-1">Select a contract</p>
            <p className="text-xs text-brand-text-muted">Milestones, messages and files for each contract live here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Workspace for a single contract
// ---------------------------------------------------------------------------

interface WorkspaceProps {
  contract: Contract;
  uid: string;
  profile: UserProfile;
  onBack: () => void;
  showToast: Toast;
}

const ContractWorkspace: React.FC<WorkspaceProps> = ({ contract, uid, profile, onBack, showToast }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const isClient = contract.clientUid === uid;
  const otherName = isClient ? contract.creativeName : contract.clientName;
  const otherAvatar = isClient ? contract.creativeAvatar : contract.clientAvatar;
  const me = { uid, name: profile.organizationName || profile.displayName || 'Member' };

  useEffect(() => subscribeMilestones(contract.id, setMilestones), [contract.id]);
  useEffect(() => subscribeMessages(contract.id, setMessages), [contract.id]);

  const approvedTotal = milestones.filter((m) => m.status === 'approved').reduce((s, m) => s + m.amount, 0);
  const allApproved = milestones.length > 0 && milestones.every((m) => m.status === 'approved');

  const act = async (fn: () => Promise<void>, systemText?: string, successToast?: string) => {
    setBusy(true);
    try {
      await fn();
      if (systemText) await sendMessage(contract.id, me, { type: 'system', text: systemText });
      if (successToast) showToast(successToast, 'success');
    } catch (err) {
      console.warn(err);
      showToast('That didn’t go through. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-brand-container border border-white/5 rounded-2xl p-5">
        <button onClick={onBack} className="lg:hidden text-xs text-brand-text-muted hover:text-white flex items-center gap-1 mb-3">
          <ChevronLeft className="w-4 h-4" /> All contracts
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={otherAvatar} name={otherName} className="w-12 h-12 rounded-xl text-base" />
            <div className="min-w-0">
              <h4 className="font-display text-lg text-white font-semibold truncate">{contract.questTitle}</h4>
              <p className="text-xs text-brand-text-muted">
                {isClient ? 'Creative' : 'Gig provider'}: <span className="text-white">{otherName}</span> · {contract.category}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-mono text-lg text-brand-volt font-bold">{money(contract.totalAmount)}</p>
            <Chip {...CONTRACT_STATUS[contract.status]} />
          </div>
        </div>

        {(contract.status === 'active' || contract.status === 'completed') && milestones.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-brand-text-muted mb-1">
              <span>Approved {money(approvedTotal)} of {money(contract.totalAmount)}</span>
              <span>{milestones.filter((m) => m.status === 'approved').length}/{milestones.length} milestones</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-volt transition-all" style={{ width: `${contract.totalAmount ? Math.min(100, (approvedTotal / contract.totalAmount) * 100) : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      <StatusBanner
        contract={contract}
        isClient={isClient}
        otherName={otherName}
        milestones={milestones}
        allApproved={allApproved}
        busy={busy}
        onPropose={() => act(() => setContractStatus(contract.id, 'proposed', { changeRequest: '' }), 'Sent the milestone plan for acceptance.', 'Terms sent.')}
        onAccept={() => act(() => setContractStatus(contract.id, 'active'), 'Accepted the terms. Work can begin.', 'Contract started!')}
        onRequestChanges={(note) => act(() => setContractStatus(contract.id, 'setup', { changeRequest: note }), `Asked for changes to the terms: “${note}”`, 'Change request sent.')}
        onCancel={() => {
          if (!window.confirm('Cancel this contract? This can’t be undone.')) return;
          act(() => cancelContract(contract, isClient), 'Cancelled the contract.', 'Contract cancelled.');
        }}
        onComplete={() => act(() => completeContract(contract), 'Marked the contract as complete.', 'Contract completed!')}
      />

      {/* Milestones */}
      {isClient && contract.status === 'setup' ? (
        <PlanEditor contractId={contract.id} milestones={milestones} showToast={showToast} />
      ) : (
        <div className="bg-brand-container border border-white/5 rounded-2xl p-5">
          <h5 className="font-mono text-[10px] uppercase tracking-widest text-brand-text-muted mb-3">Milestones</h5>
          {milestones.length === 0 ? (
            <p className="text-xs text-brand-text-muted">No milestones yet.</p>
          ) : (
            <ol className="space-y-3">
              {milestones.map((m, i) => (
                <MilestoneRow
                  key={m.id}
                  index={i}
                  milestone={m}
                  contract={contract}
                  isClient={isClient}
                  busy={busy}
                  onSubmit={(note) => act(() => submitMilestone(contract.id, m.id, note), `Submitted “${m.title}” for review.${note ? ` Note: ${note}` : ''}`, 'Submitted for review.')}
                  onReview={(approve, feedback) => act(
                    () => reviewMilestone(contract.id, m.id, approve, feedback),
                    approve ? `Approved “${m.title}”.${feedback ? ` ${feedback}` : ''}` : `Requested changes on “${m.title}”: ${feedback}`,
                    approve ? 'Milestone approved.' : 'Changes requested.'
                  )}
                />
              ))}
            </ol>
          )}
        </div>
      )}

      <ChatPanel contract={contract} me={me} messages={messages} showToast={showToast} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status banner: what happens next, and the buttons to do it
// ---------------------------------------------------------------------------

interface BannerProps {
  contract: Contract;
  isClient: boolean;
  otherName: string;
  milestones: Milestone[];
  allApproved: boolean;
  busy: boolean;
  onPropose: () => void;
  onAccept: () => void;
  onRequestChanges: (note: string) => void;
  onCancel: () => void;
  onComplete: () => void;
}

const StatusBanner: React.FC<BannerProps> = (p) => {
  const { contract, isClient, otherName, busy } = p;
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');

  const box = (children: React.ReactNode, tone: 'volt' | 'plain' = 'plain') => (
    <div className={`rounded-2xl p-5 border ${tone === 'volt' ? 'bg-brand-volt/5 border-brand-volt/25' : 'bg-brand-container border-white/5'}`}>{children}</div>
  );

  const changeRequest = contract.changeRequest ? (
    <div className="mt-3 text-xs bg-brand-bg/60 border border-white/10 rounded-lg p-3">
      <span className="text-brand-text-muted">{isClient ? `${otherName} asked for changes:` : 'You asked for changes:'}</span>
      <p className="text-white mt-1 whitespace-pre-line">{contract.changeRequest}</p>
    </div>
  ) : null;

  switch (contract.status) {
    case 'setup':
      return isClient ? box(<>
        <p className="text-sm text-white font-semibold">Agree the milestones</p>
        <p className="text-xs text-brand-text-muted mt-1">Adjust the milestones below if needed, save, then send them to {otherName} to accept.</p>
        {changeRequest}
        <div className="flex flex-wrap gap-2 mt-4">
          <button disabled={busy || p.milestones.length === 0} onClick={p.onPropose} className={btnPrimary}>Send to {otherName}</button>
          <button disabled={busy} onClick={p.onCancel} className={btnGhost}>Cancel contract</button>
        </div>
      </>, 'volt') : box(<>
        <p className="text-sm text-white font-semibold">{otherName} is preparing the milestones</p>
        <p className="text-xs text-brand-text-muted mt-1">You’ll be asked to accept the terms before work starts. Use the chat to discuss details.</p>
        {changeRequest}
        <div className="mt-4"><button disabled={busy} onClick={p.onCancel} className={btnGhost}>Decline contract</button></div>
      </>);

    case 'proposed':
      return isClient ? box(<>
        <p className="text-sm text-white font-semibold">Waiting for {otherName} to accept</p>
        <p className="text-xs text-brand-text-muted mt-1">They can accept the milestones or ask for changes.</p>
        <div className="mt-4"><button disabled={busy} onClick={p.onCancel} className={btnGhost}>Cancel contract</button></div>
      </>) : box(<>
        <p className="text-sm text-white font-semibold">Review and accept the terms</p>
        <p className="text-xs text-brand-text-muted mt-1">{otherName} proposed the milestones below, totalling {money(contract.totalAmount)}.</p>
        {asking ? (
          <div className="mt-3 space-y-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="What would you like changed?" className={inputCls} />
            <div className="flex gap-2">
              <button disabled={busy || !note.trim()} onClick={() => { p.onRequestChanges(note.trim()); setAsking(false); setNote(''); }} className={btnPrimary}>Send request</button>
              <button onClick={() => setAsking(false)} className={btnGhost}>Back</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            <button disabled={busy} onClick={p.onAccept} className={btnPrimary}>Accept terms & start</button>
            <button disabled={busy} onClick={() => setAsking(true)} className={btnGhost}>Ask for changes</button>
            <button disabled={busy} onClick={p.onCancel} className={btnGhost}>Decline</button>
          </div>
        )}
      </>, 'volt');

    case 'active':
      return box(<>
        <p className="text-sm text-white font-semibold">Work in progress</p>
        <p className="text-xs text-brand-text-muted mt-1">
          {isClient
            ? 'Review each milestone when it’s submitted. Approve it, or ask for changes.'
            : 'Submit each milestone for review when it’s ready. Attach files in the chat.'}
        </p>
        <p className="text-[11px] text-brand-text-muted mt-2">
          Protected Payments aren’t switched on yet, so payment is arranged directly between you for now.
        </p>
        {isClient && p.allApproved && (
          <div className="mt-4"><button disabled={busy} onClick={p.onComplete} className={btnPrimary}>Mark contract complete</button></div>
        )}
      </>, p.allApproved && isClient ? 'volt' : 'plain');

    case 'completed':
      return box(<>
        <p className="text-sm text-white font-semibold">Contract completed</p>
        <p className="text-xs text-brand-text-muted mt-1">All milestones were approved. Files and messages stay available here.</p>
      </>, 'volt');

    case 'cancelled':
      return box(<>
        <p className="text-sm text-white font-semibold">Contract cancelled</p>
        <p className="text-xs text-brand-text-muted mt-1">This contract was called off before work started.</p>
      </>);
  }
};

// ---------------------------------------------------------------------------
// Plan editor (gig provider, setup only)
// ---------------------------------------------------------------------------

type PlanRow = { id?: string; title: string; amount: string };

const PlanEditor: React.FC<{ contractId: string; milestones: Milestone[]; showToast: Toast }> = ({ contractId, milestones, showToast }) => {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync from the server whenever there are no unsaved edits.
  useEffect(() => {
    if (!dirty) setRows(milestones.map((m) => ({ id: m.id, title: m.title, amount: String(m.amount) })));
  }, [milestones, dirty]);

  const update = (i: number, patch: Partial<PlanRow>) => {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
    setDirty(true);
  };
  const total = rows.reduce((s, r) => s + (Math.round(parseFloat(r.amount)) || 0), 0);

  const save = async () => {
    const plan = rows.map((r) => ({ id: r.id, title: r.title.trim(), amount: Math.round(parseFloat(r.amount)) }));
    if (plan.length === 0) return setError('Add at least one milestone.');
    if (plan.length > 20) return setError('Up to 20 milestones.');
    if (plan.some((m) => !m.title)) return setError('Every milestone needs a title.');
    if (plan.some((m) => !m.amount || m.amount <= 0)) return setError('Every milestone needs an amount above $0.');
    setError(null);
    setSaving(true);
    try {
      await saveMilestonePlan(contractId, milestones, plan);
      setDirty(false);
      showToast('Milestones saved.', 'success');
    } catch (err) {
      console.warn(err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-brand-container border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-mono text-[10px] uppercase tracking-widest text-brand-text-muted">Milestones (editable until sent)</h5>
        <span className="font-mono text-sm text-brand-volt font-bold">{money(total)}</span>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id || `new-${i}`} className="flex gap-2 items-center">
            <span className="text-[10px] font-mono text-brand-text-muted w-5">{i + 1}.</span>
            <input value={r.title} onChange={(e) => update(i, { title: e.target.value })} maxLength={200} placeholder="What will be delivered" className={`${inputCls} flex-1`} />
            <div className="relative w-28">
              <span className="absolute left-3 top-2 text-sm text-brand-text-muted">$</span>
              <input type="number" min={1} value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} className={`${inputCls} pl-6`} />
            </div>
            <button onClick={() => { setRows((x) => x.filter((_, j) => j !== i)); setDirty(true); }} className="text-brand-text-muted hover:text-red-300 p-1" aria-label="Remove milestone">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <button onClick={() => { setRows((x) => [...x, { title: '', amount: '' }]); setDirty(true); }} className={`${btnGhost} flex items-center gap-1`}>
          <Plus className="w-3.5 h-3.5" /> Add milestone
        </button>
        <div className="flex gap-2">
          {dirty && <button onClick={() => { setDirty(false); setError(null); }} className={btnGhost}>Discard</button>}
          <button disabled={!dirty || saving} onClick={save} className={btnPrimary}>{saving ? 'Saving…' : 'Save milestones'}</button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2" role="alert">{error}</p>}
      {dirty && <p className="text-[11px] text-brand-text-muted mt-2">Save your changes before sending the terms.</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// One milestone during/after the contract
// ---------------------------------------------------------------------------

interface MilestoneRowProps {
  index: number;
  milestone: Milestone;
  contract: Contract;
  isClient: boolean;
  busy: boolean;
  onSubmit: (note: string) => void;
  onReview: (approve: boolean, feedback: string) => void;
}

const MilestoneRow: React.FC<MilestoneRowProps> = ({ index, milestone: m, contract, isClient, busy, onSubmit, onReview }) => {
  const [mode, setMode] = useState<'idle' | 'submit' | 'changes'>('idle');
  const [text, setText] = useState('');
  const active = contract.status === 'active';
  const canSubmit = active && !isClient && (m.status === 'pending' || m.status === 'changes_requested');
  const canReview = active && isClient && m.status === 'submitted';

  return (
    <li className="bg-brand-bg/60 border border-white/5 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white font-semibold"><span className="text-brand-text-muted font-mono mr-1.5">{index + 1}.</span>{m.title}</p>
          <div className="mt-1.5"><Chip {...MILESTONE_STATUS[m.status]} /></div>
        </div>
        <span className="font-mono text-sm text-brand-volt font-bold">{money(m.amount)}</span>
      </div>

      {m.submissionNote && (m.status === 'submitted' || m.status === 'approved' || m.status === 'changes_requested') && (
        <p className="text-xs text-white/80 mt-3 whitespace-pre-line"><span className="text-brand-text-muted">Submission note: </span>{m.submissionNote}</p>
      )}
      {m.feedback && (m.status === 'changes_requested' || m.status === 'approved') && (
        <p className={`text-xs mt-2 whitespace-pre-line ${m.status === 'changes_requested' ? 'text-red-200' : 'text-white/80'}`}>
          <span className="text-brand-text-muted">Feedback: </span>{m.feedback}
        </p>
      )}

      {mode !== 'idle' ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={mode === 'submit' ? 'Optional note, e.g. what’s included and where the files are' : 'What needs to change?'}
            className={inputCls}
          />
          <div className="flex gap-2">
            <button
              disabled={busy || (mode === 'changes' && !text.trim())}
              onClick={() => { mode === 'submit' ? onSubmit(text.trim()) : onReview(false, text.trim()); setMode('idle'); setText(''); }}
              className={btnPrimary}
            >
              {mode === 'submit' ? 'Submit for review' : 'Send feedback'}
            </button>
            <button onClick={() => { setMode('idle'); setText(''); }} className={btnGhost}>Back</button>
          </div>
        </div>
      ) : (
        (canSubmit || canReview) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {canSubmit && <button disabled={busy} onClick={() => setMode('submit')} className={btnPrimary}>{m.status === 'changes_requested' ? 'Resubmit for review' : 'Submit for review'}</button>}
            {canReview && (
              <>
                <button disabled={busy} onClick={() => onReview(true, '')} className={`${btnPrimary} flex items-center gap-1`}><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                <button disabled={busy} onClick={() => setMode('changes')} className={`${btnGhost} flex items-center gap-1`}><Close className="w-3.5 h-3.5" /> Request changes</button>
              </>
            )}
          </div>
        )
      )}
    </li>
  );
};

// ---------------------------------------------------------------------------
// Chat + files
// ---------------------------------------------------------------------------

interface ChatProps {
  contract: Contract;
  me: { uid: string; name: string };
  messages: ContractMessage[];
  showToast: Toast;
}

const ChatPanel: React.FC<ChatProps> = ({ contract, me, messages, showToast }) => {
  const [tab, setTab] = useState<'chat' | 'files'>('chat');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [upload, setUpload] = useState<{ name: string; progress: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const closed = contract.status === 'cancelled';
  const files = useMemo(() => messages.filter((m) => m.type === 'file' && m.file), [messages]);

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, tab]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(contract.id, me, { type: 'text', text });
      setDraft('');
    } catch (err) {
      console.warn(err);
      showToast('Message not sent. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('Files can be up to 1 GB. For bigger files, share a link in the chat.', 'error');
      return;
    }
    setUpload({ name: file.name, progress: 0 });
    try {
      const meta = await uploadContractFile(contract.id, me.uid, file, (progress) => setUpload({ name: file.name, progress }));
      await sendMessage(contract.id, me, { type: 'file', text: file.name, file: meta });
      showToast('File uploaded.', 'success');
    } catch (err: any) {
      console.warn(err);
      showToast(err?.message?.includes('1 GB') ? err.message : 'Upload failed. Please try again.', 'error');
    } finally {
      setUpload(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const openFile = async (path: string) => {
    try {
      const url = await getFileUrl(path);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.warn(err);
      showToast('Could not open that file.', 'error');
    }
  };

  const FileChip: React.FC<{ m: ContractMessage; mine?: boolean }> = ({ m, mine }) => (
    <button
      onClick={() => m.file && openFile(m.file.path)}
      className={`flex items-center gap-2 text-left rounded-lg px-3 py-2 border ${mine ? 'border-brand-bg/20 bg-brand-bg/10' : 'border-white/10 bg-white/5'} hover:opacity-90`}
    >
      <Download className="w-4 h-4 flex-shrink-0" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate max-w-[220px]">{m.file?.name}</span>
        <span className="block text-[10px] opacity-70">{formatBytes(m.file?.size || 0)}</span>
      </span>
    </button>
  );

  return (
    <div className="bg-brand-container border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex border-b border-white/5">
        {(['chat', 'files'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider ${tab === t ? 'text-brand-volt border-b-2 border-brand-volt' : 'text-brand-text-muted hover:text-white'}`}
          >
            {t === 'chat' ? 'Messages' : `Files (${files.length})`}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <>
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-xs text-brand-text-muted text-center mt-10">No messages yet. Say hello and agree the details.</p>}
            {messages.map((m) => {
              if (m.type === 'system') {
                return (
                  <p key={m.id} className="text-[11px] text-brand-text-muted text-center">
                    <span className="text-white/80">{m.senderUid === me.uid ? 'You' : m.senderName}</span> {m.text.charAt(0).toLowerCase() + m.text.slice(1)} · {formatTime(m.createdAt)}
                  </p>
                );
              }
              const mine = m.senderUid === me.uid;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? 'bg-brand-volt text-brand-bg' : 'bg-brand-container-high text-white'}`}>
                    {!mine && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>}
                    {m.type === 'file' ? <FileChip m={m} mine={mine} /> : <p className="text-sm whitespace-pre-line break-words">{m.text}</p>}
                    <p className={`text-[9px] mt-1 ${mine ? 'text-brand-bg/60' : 'text-brand-text-muted'}`}>{formatTime(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {upload && (
            <div className="px-4 pb-2">
              <p className="text-[11px] text-brand-text-muted mb-1 truncate">Uploading {upload.name}… {Math.round(upload.progress * 100)}%</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-brand-volt" style={{ width: `${upload.progress * 100}%` }} /></div>
            </div>
          )}

          {closed ? (
            <p className="text-xs text-brand-text-muted text-center p-4 border-t border-white/5">This contract is closed.</p>
          ) : (
            <form onSubmit={send} className="flex items-end gap-2 p-3 border-t border-white/5">
              <input ref={fileInput} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button type="button" disabled={!!upload} onClick={() => fileInput.current?.click()} className="p-2.5 rounded-lg border border-white/10 text-brand-text-muted hover:text-brand-volt disabled:opacity-50" aria-label="Attach file" title="Attach a file (up to 1 GB)">
                <AttachFile className="w-4 h-4" />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
                rows={1}
                maxLength={4000}
                placeholder="Write a message…"
                className={`${inputCls} resize-none`}
              />
              <button type="submit" disabled={sending || !draft.trim()} className="p-2.5 rounded-lg bg-brand-volt text-brand-bg disabled:opacity-50" aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="p-4">
          {files.length === 0 ? (
            <p className="text-xs text-brand-text-muted text-center py-10">No files yet. Attach files from the Messages tab.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 bg-brand-bg/60 border border-white/5 rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{m.file?.name}</p>
                    <p className="text-[11px] text-brand-text-muted">{formatBytes(m.file?.size || 0)} · {m.senderUid === me.uid ? 'You' : m.senderName} · {formatTime(m.createdAt)}</p>
                  </div>
                  <button onClick={() => m.file && openFile(m.file.path)} className={`${btnGhost} flex items-center gap-1`}><Download className="w-3.5 h-3.5" /> Open</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
