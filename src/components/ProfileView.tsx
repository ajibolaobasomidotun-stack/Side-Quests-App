/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Avatar } from './Avatar';
import { UserProfile, Quest, Creative, AccountType } from '../types';
import { ARTIST_CATEGORIES, PROVIDER_CATEGORIES } from '../profileData';
import { 
  Verified, 
  VerifiedUser, 
  Edit3, 
  LocationOn, 
  Payments, 
  Palette, 
  Building2, 
  Sparkles, 
  ArrowForward, 
  CheckCircle,
  AccountCircle,
  FolderZip,
  Tune,
  Star,
  Checklist
} from './Icons';

interface ProfileViewProps {
  profile: UserProfile;
  onEditProfile: () => void;
  onSwitchAccountType: (type: AccountType) => void;
  quests: Quest[];
  creatives: Creative[];
  onSelectQuest: (quest: Quest) => void;
  onSelectCreative: (creative: Creative) => void;
  onNavigateTab: (tab: 'quests' | 'creatives' | 'learn' | 'pricing' | 'tasks') => void;
  onOpenCreateQuestModal?: () => void;
  currentUser?: any;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onEditProfile,
  onSwitchAccountType,
  quests,
  creatives,
  onSelectQuest,
  onSelectCreative,
  onNavigateTab,
  onOpenCreateQuestModal,
  currentUser,
  onGoogleSignIn,
  onGoogleSignOut
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'matches' | 'categories'>('overview');

  const categoryPool = profile.accountType === 'artist' ? ARTIST_CATEGORIES : PROVIDER_CATEGORIES;

  // Selected category names
  const categoryNames = profile.selectedCategories.map(catId => {
    const found = categoryPool.find(c => c.id === catId);
    return found ? found.name : catId;
  });

  // Creatives: open quests in the same disciplines as their skills
  const myVerticals = new Set(
    profile.selectedCategories
      .map(catId => ARTIST_CATEGORIES.find(c => c.id === catId)?.group)
      .filter(Boolean) as string[]
  );
  const matchedQuests = quests.filter(quest =>
    quest.status === 'open' && quest.clientUid !== profile.id && myVerticals.has(quest.category)
  );

  // Gig providers: creatives in the disciplines they've posted quests for (or everyone, before their first quest)
  const postedVerticals = new Set(quests.filter(q => q.clientUid === profile.id).map(q => q.category as string));
  const matchedCreatives = creatives.filter(creative =>
    creative.id !== profile.id && (postedVerticals.size === 0 || postedVerticals.has(creative.role))
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-6 md:py-10">
      
      {/* TOP BANNER & ROLE SWITCHER */}
      <div className="bg-brand-container-low border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial-gradient from-brand-volt/10 to-transparent pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative flex-shrink-0">
              <Avatar src={profile.avatarUrl} name={profile.displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-brand-volt shadow-xl shadow-brand-volt/10 text-2xl" />
              {profile.verified && (
                <span className="absolute -bottom-1 -right-1 p-1 bg-brand-bg rounded-lg border border-brand-volt/40" title="Verified by SideQuests">
                  <Verified className="w-4 h-4 text-brand-volt" />
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white font-display">
                  {profile.displayName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-volt/15 text-brand-volt border border-brand-volt/30 text-xs font-mono font-bold uppercase">
                  {profile.accountType === 'artist' ? 'Creative' : 'Gig Provider'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-brand-text-muted border border-white/10 text-xs font-mono">
                  {profile.verified ? 'Verified by SideQuests' : 'Verification pending'}
                </span>
              </div>
              <div className="text-xs text-brand-volt font-mono font-medium">{profile.handle}</div>
              <div className="text-sm text-white/90 font-medium mt-1">{profile.roleHeadline}</div>
              <div className="flex items-center gap-4 text-xs text-brand-text-muted mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <LocationOn className="w-3.5 h-3.5" />
                  {profile.location}
                </span>
                {profile.hourlyRate && (
                  <span className="text-brand-volt font-bold">
                    ${profile.hourlyRate}/hr
                  </span>
                )}
                {profile.orgType && (
                  <span className="text-brand-volt">
                    {profile.orgType}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
            <button
              onClick={onEditProfile}
              className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-volt/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile & Categories
            </button>
            
            <button
              onClick={() => onSwitchAccountType(profile.accountType === 'artist' ? 'provider' : 'artist')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-medium text-xs px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {profile.accountType === 'artist' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-brand-volt" />
                  Switch to Gig Provider
                </>
              ) : (
                <>
                  <Palette className="w-3.5 h-3.5 text-brand-volt" />
                  Switch to Creative
                </>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-brand-volt/10 border border-brand-volt/30 text-brand-volt text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-volt" />
                  Signed in
                </span>
                {onGoogleSignOut && (
                  <button 
                    onClick={onGoogleSignOut}
                    className="text-white/60 hover:text-red-400 uppercase text-[9px] underline transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : onGoogleSignIn ? (
              <button
                onClick={onGoogleSignIn}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-sans font-medium text-xs px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                </svg>
                Sign In
              </button>
            ) : null}
          </div>
        </div>

        {/* PROFILE STATS / HIGHLIGHTS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-brand-container-high/60 border border-white/5 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono text-brand-text-muted uppercase">Selected Categories</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{profile.selectedCategories.length} Categories</div>
          </div>

          <div className="bg-brand-container-high/60 border border-white/5 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono text-brand-text-muted uppercase">Member Since</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>

          <div className="bg-brand-container-high/60 border border-white/5 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono text-brand-text-muted uppercase">
              {profile.accountType === 'artist' ? 'Listed Credits' : 'Open Quests'}
            </div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {profile.accountType === 'artist'
                ? (profile.credits?.length || 0)
                : quests.filter(q => q.clientUid === profile.id && q.status === 'open').length}
            </div>
          </div>

          <div className="bg-brand-container-high/60 border border-white/5 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono text-brand-text-muted uppercase">Verification</div>
            <div className={`text-xs font-bold font-mono mt-1 flex items-center gap-1 ${profile.verified ? 'text-brand-volt' : 'text-brand-text-muted'}`}>
              <VerifiedUser className="w-3.5 h-3.5" />
              {profile.verified ? 'Verified' : 'Pending review'}
            </div>
          </div>
        </div>

      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            activeSubTab === 'overview'
              ? 'bg-brand-volt/15 text-brand-volt border border-brand-volt/30 font-bold'
              : 'text-brand-text-muted hover:text-white'
          }`}
        >
          Profile Overview & Bio
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            activeSubTab === 'categories'
              ? 'bg-brand-volt/15 text-brand-volt border border-brand-volt/30 font-bold'
              : 'text-brand-text-muted hover:text-white'
          }`}
        >
          Categories & Disciplines ({profile.selectedCategories.length})
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeSubTab === 'matches'
              ? 'bg-brand-volt/15 text-brand-volt border border-brand-volt/30 font-bold'
              : 'text-brand-text-muted hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-volt" />
          {profile.accountType === 'artist' 
            ? `Matching Quests (${matchedQuests.length > 0 ? matchedQuests.length : 'All'})` 
            : `Recommended Talent (${matchedCreatives.length > 0 ? matchedCreatives.length : 'All'})`}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-2 font-semibold">
                About
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed font-sans max-w-3xl">
                {profile.bio || 'No bio provided.'}
              </p>
            </div>

            {/* Profile Categories Tag Cloud */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3 font-semibold">
                Specialized Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.selectedCategories.map(catId => {
                  const cat = categoryPool.find(c => c.id === catId);
                  return (
                    <span
                      key={catId}
                      className="px-3 py-1.5 rounded-xl bg-brand-volt/10 border border-brand-volt/25 text-brand-volt font-mono text-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      {cat ? cat.name : catId}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Creative-specific credits & tools */}
            {profile.accountType === 'artist' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3 font-semibold">
                    Portfolio Credits
                  </h3>
                  <div className="space-y-2">
                    {(profile.credits || []).length === 0 && <p className="text-xs text-brand-text-muted">No credits added yet.</p>}
                    {(profile.credits || []).map((credit, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-white/90 bg-brand-container-high/40 p-2.5 rounded-xl border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-volt flex-shrink-0"></span>
                        <span>{credit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3 font-semibold">
                    Tools & Equipment
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile.gear || []).length === 0 && <p className="text-xs text-brand-text-muted">No tools or equipment added yet.</p>}
                    {(profile.gear || []).map((item, i) => (
                      <span key={i} className="bg-brand-container-high border border-white/10 px-3 py-1.5 rounded-xl text-xs text-brand-text-muted font-mono">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gig Provider specific goals */}
            {profile.accountType === 'provider' && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-3 font-semibold">
                  Active Gig Openings & Hiring Goals
                </h3>
                <div className="space-y-2">
                  {(profile.hiringGoals || []).length === 0 && <p className="text-xs text-brand-text-muted">No hiring goals added yet.</p>}
                  {(profile.hiringGoals || []).map((goal, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-white/90 bg-brand-container-high/40 p-3 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-volt flex-shrink-0"></span>
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </motion.div>
      )}

      {/* TAB 2: CATEGORIES BREAKDOWN */}
      {activeSubTab === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white font-display">
              Active Category Tags for this Profile ({profile.selectedCategories.length})
            </h3>
            <button
              onClick={onEditProfile}
              className="text-xs text-brand-volt font-mono hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manage Categories
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.selectedCategories.map(catId => {
              const cat = categoryPool.find(c => c.id === catId);
              if (!cat) return null;
              return (
                <div key={cat.id} className="bg-brand-container-low border border-brand-volt/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand-volt mb-1">
                    {cat.group}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{cat.name}</h4>
                  <p className="text-xs text-brand-text-muted leading-relaxed">{cat.description}</p>
                </div>
              );
            })}
          </div>

        </motion.div>
      )}

      {/* TAB 3: MATCHED QUETS OR CREATIVES */}
      {activeSubTab === 'matches' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {profile.accountType === 'artist' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Quests Matching Your Categories
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    Open quests in your disciplines: {Array.from(myVerticals).join(', ') || 'add skills to your profile to see matches'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('quests')}
                  className="text-xs text-brand-volt font-mono hover:underline flex items-center gap-1"
                >
                  View All Quests
                  <ArrowForward className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(matchedQuests.length > 0 ? matchedQuests : quests).slice(0, 4).map(quest => (
                  <div
                    key={quest.id}
                    onClick={() => onSelectQuest(quest)}
                    className="bg-brand-container-low border border-white/10 hover:border-brand-volt/40 p-5 rounded-2xl cursor-pointer transition-all hover:bg-brand-container-high/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-white hover:text-brand-volt transition-colors">
                        {quest.title}
                      </h4>
                      <span className="text-xs font-mono font-bold text-brand-volt bg-brand-volt/10 px-2.5 py-1 rounded-lg border border-brand-volt/20">
                        ${quest.budget.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-brand-text-muted line-clamp-2 mb-3">
                      {quest.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-brand-text-muted">
                      <span>Client: {quest.clientName}</span>
                      <span className="text-brand-volt">{quest.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Creatives For Your Quests
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    Creatives working in the same disciplines as the quests you've posted.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('creatives')}
                  className="text-xs text-brand-volt font-mono hover:underline flex items-center gap-1"
                >
                  Browse All Talent
                  <ArrowForward className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(matchedCreatives.length > 0 ? matchedCreatives : creatives).slice(0, 4).map(creative => (
                  <div
                    key={creative.id}
                    onClick={() => onSelectCreative(creative)}
                    className="bg-brand-container-low border border-white/10 hover:border-brand-volt/40 p-5 rounded-2xl cursor-pointer transition-all hover:bg-brand-container-high/50 flex items-center gap-4"
                  >
                    <Avatar src={creative.avatarUrl} name={creative.name} className="w-14 h-14 rounded-xl border border-white/10 text-base" />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{creative.name}</h4>
                        <span className="text-xs font-mono text-brand-volt font-bold">${creative.hourlyRate}/hr</span>
                      </div>
                      <div className="text-xs text-brand-text-muted mt-0.5 line-clamp-1">{creative.roleLabel}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {creative.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-container-high border border-white/5 text-brand-volt">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      )}

    </div>
  );
};
