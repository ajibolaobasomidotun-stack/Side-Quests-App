import React, { useState } from 'react';
import type { Application, Quest, UserProfile } from '../types';
import { Plus, Work, CheckCircle, Close, AccountCircle } from './Icons';

interface DashboardProps {
  uid: string;
  profile: UserProfile;
  quests: Quest[];
  myApplications: Application[];
  receivedApplications: Application[];
  onPostQuest: () => void;
  onBrowseQuests: () => void;
  onViewQuest: (quest: Quest) => void;
  onAccept: (app: Application) => Promise<void>;
  onDecline: (app: Application) => Promise<void>;
  onWithdraw: (app: Application) => Promise<void>;
  onSetQuestStatus: (quest: Quest, status: Quest['status']) => Promise<void>;
}

const statusChip: Record<string, string> = {
  pending: 'bg-white/5 text-white border-white/15',
  accepted: 'bg-brand-volt/15 text-brand-volt border-brand-volt/30',
  declined: 'bg-red-500/10 text-red-300 border-red-500/20',
  open: 'bg-brand-volt/15 text-brand-volt border-brand-volt/30',
  active: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  completed: 'bg-white/5 text-brand-text-muted border-white/10'
};

const statusLabel: Record<string, string> = {
  pending: 'Pending', accepted: 'Hired', declined: 'Declined',
  open: 'Accepting applications', active: 'In progress', completed: 'Completed'
};

const Chip: React.FC<{ status: string }> = ({ status }) => (
  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusChip[status] || statusChip.pending}`}>
    {statusLabel[status] || status}
  </span>
);

const Avatar: React.FC<{ src?: string; name: string }> = ({ src, name }) =>
  src ? (
    <img src={src} alt={name} className="w-10 h-10 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
  ) : (
    <span className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
      <AccountCircle className="w-6 h-6 text-brand-text-muted" />
    </span>
  );

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const { uid, profile, quests } = props;
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  };

  if (profile.accountType === 'provider') {
    const myQuests = quests.filter((q) => q.clientUid === uid);
    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="font-display text-xl text-white font-semibold">Your quests</h4>
            <p className="text-xs text-brand-text-muted mt-1">Review applicants and hire for each quest you've posted.</p>
          </div>
          <button onClick={props.onPostQuest} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 w-fit hover:scale-[1.02] active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Post a quest
          </button>
        </div>

        {myQuests.length === 0 ? (
          <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
            <Work className="w-10 h-10 text-brand-text-muted mx-auto mb-3" />
            <p className="text-sm text-white font-semibold mb-1">You haven't posted a quest yet</p>
            <p className="text-xs text-brand-text-muted">Post one and creatives can start applying right away.</p>
          </div>
        ) : (
          myQuests.map((quest) => {
            const apps = props.receivedApplications.filter((a) => a.questId === quest.id);
            return (
              <div key={quest.id} className="bg-brand-container border border-white/5 rounded-2xl p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Chip status={quest.status} /></div>
                    <button onClick={() => props.onViewQuest(quest)} className="font-display text-lg text-white font-semibold text-left hover:text-brand-volt">
                      {quest.title}
                    </button>
                    <p className="text-xs text-brand-text-muted font-mono mt-1">
                      ${quest.budget.toLocaleString()} · {quest.category} · Deadline {quest.deadline}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {quest.status === 'open' && (
                      <button disabled={busyId === quest.id} onClick={() => act(quest.id, () => props.onSetQuestStatus(quest, 'completed'))}
                        className="text-xs text-brand-text-muted border border-white/10 hover:text-white px-3 py-1.5 rounded-lg">
                        Close quest
                      </button>
                    )}
                    {quest.status === 'active' && (
                      <button disabled={busyId === quest.id} onClick={() => act(quest.id, () => props.onSetQuestStatus(quest, 'completed'))}
                        className="text-xs text-brand-text-muted border border-white/10 hover:text-white px-3 py-1.5 rounded-lg">
                        Mark completed
                      </button>
                    )}
                  </div>
                </div>

                <span className="font-mono text-[10px] uppercase tracking-widest text-brand-text-muted block mb-2">
                  Applicants ({apps.length})
                </span>
                {apps.length === 0 ? (
                  <p className="text-xs text-brand-text-muted">No applications yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {apps.map((a) => (
                      <li key={a.id} className="bg-brand-bg/60 border border-white/5 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={a.applicantAvatar} name={a.applicantName} />
                            <div>
                              <p className="text-sm text-white font-semibold">{a.applicantName}</p>
                              {a.applicantHeadline && <p className="text-[11px] text-brand-text-muted">{a.applicantHeadline}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-brand-volt font-bold">${Number(a.bidAmount).toLocaleString()}</p>
                            <Chip status={a.status} />
                          </div>
                        </div>
                        <p className="text-xs text-white/85 leading-relaxed mt-3 whitespace-pre-line">{a.proposalText}</p>
                        {a.status === 'pending' && quest.status === 'open' && (
                          <div className="flex gap-2 mt-3 justify-end">
                            <button disabled={busyId === a.id} onClick={() => act(a.id, () => props.onDecline(a))}
                              className="text-xs text-white border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg flex items-center gap-1.5">
                              <Close className="w-3.5 h-3.5" /> Decline
                            </button>
                            <button disabled={busyId === a.id} onClick={() => act(a.id, () => props.onAccept(a))}
                              className="text-xs font-bold bg-brand-volt text-brand-bg px-4 py-2 rounded-lg flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Hire
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </section>
    );
  }

  // Artist view
  const apps = props.myApplications;
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="font-display text-xl text-white font-semibold">Your applications</h4>
          <p className="text-xs text-brand-text-muted mt-1">Track every quest you've applied to.</p>
        </div>
        <button onClick={props.onBrowseQuests} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl w-fit hover:scale-[1.02] active:scale-95 transition-all">
          Browse quests
        </button>
      </div>
      {apps.length === 0 ? (
        <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
          <Work className="w-10 h-10 text-brand-text-muted mx-auto mb-3" />
          <p className="text-sm text-white font-semibold mb-1">No applications yet</p>
          <p className="text-xs text-brand-text-muted">Find a quest that fits your skills and send a pitch.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) => {
            const quest = quests.find((q) => q.id === a.questId);
            return (
              <li key={a.id} className="bg-brand-container border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <button disabled={!quest} onClick={() => quest && props.onViewQuest(quest)} className="font-display text-base text-white font-semibold text-left hover:text-brand-volt disabled:hover:text-white">
                    {a.questTitle}
                  </button>
                  <p className="text-xs text-brand-text-muted font-mono mt-1">
                    Your rate ${Number(a.bidAmount).toLocaleString()} · Applied {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip status={a.status} />
                  {a.status === 'pending' && (
                    <button disabled={busyId === a.id} onClick={() => act(a.id, () => props.onWithdraw(a))}
                      className="text-xs text-brand-text-muted hover:text-red-300 underline">
                      Withdraw
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
