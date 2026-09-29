/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Notifications, 
  ArrowForward, 
  ArrowRightAlt, 
  Payments, 
  Verified, 
  Schedule, 
  FolderZip, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  VerifiedUser, 
  LockOpen, 
  CurrencyExchange, 
  SupportAgent, 
  CameraAlt, 
  Share, 
  Groups, 
  Explore, 
  Palette, 
  School, 
  Checklist,
  Search,
  FilterList,
  Work,
  FileUpload,
  Close,
  Send,
  PlayArrow,
  Pause,
  AttachFile,
  TaskAlt,
  Info,
  CheckCircle,
  AccountCircle,
  Download,
  LocalActivity,
  UserPlus,
  Sparkles,
  Building2,
  Headphones,
  Edit3
} from './components/Icons'; // Using simple fallback SVGs or Lucide/material-styled custom icons for ultimate reliability

import { motion, AnimatePresence } from 'motion/react';
import { Creative, Quest, Article, UserProfile, AccountType, Application, Contract } from './types';
import { LEARN_ARTICLES } from './data';
import { GIG_CATEGORIES, GIG_CATEGORY_KEYS } from './categories';
import { INITIAL_USER_PROFILE, ARTIST_CATEGORIES, PROVIDER_CATEGORIES } from './profileData';
import { ProfileCreator } from './components/ProfileCreator';
import { ProfileView } from './components/ProfileView';
import { PostQuestModal } from './components/PostQuestModal';
import { AuthModal } from './components/AuthModal';
import { ApplyModal } from './components/ApplyModal';
import { Dashboard } from './components/Dashboard';
import { Avatar } from './components/Avatar';
import { ContractsPanel } from './components/ContractsPanel';
import { hireAndCreateContract, subscribeMyContracts } from './lib/contracts';
import {
  auth,
  signOutUser,
  fetchUserProfile,
  saveUserProfile,
  updateAccountType,
  subscribeArtists,
  createQuest,
  subscribeQuests,
  setQuestStatus,
  submitApplication,
  setApplicationStatus,
  withdrawApplication,
  subscribeMyApplications,
  subscribeReceivedApplications,
  toggleBookmark,
  subscribeUserBookmarks
} from './lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'quests' | 'creatives' | 'learn' | 'pricing' | 'tasks' | 'profile'>('quests');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [artistProfiles, setArtistProfiles] = useState<UserProfile[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [consoleTab, setConsoleTab] = useState<'contracts' | 'quests'>('contracts');
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup' }>({ open: false, mode: 'signin' });
  const [applyingQuest, setApplyingQuest] = useState<Quest | null>(null);
  
  // Firebase Auth & Cloud Firestore state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<{ status: string } | null>(null);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isPostQuestModalOpen, setIsPostQuestModalOpen] = useState<boolean>(false);
  
  // Active detail views
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  
  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Quest Category Filter state
  const [questCategoryFilter, setQuestCategoryFilter] = useState<string>('All');
  const [questSearch, setQuestSearch] = useState<string>('');

  // Creative Filter state
  const [creativeRoleFilter, setCreativeRoleFilter] = useState<string>('All');
  const [creativeSearch, setCreativeSearch] = useState<string>('');

  // Auto scroll references
  const questsSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check Express Backend Server Health & Platform Statistics
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setServerStatus({ status: 'Operational' });
        }
      })
      .catch(() => {
        // Dev / fallback
      });
  }, []);

  // Firebase Auth State Listener & Firestore Profile Hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setHasProfile(false);
        setUserProfile(INITIAL_USER_PROFILE);
        setIsAuthLoading(false);
        return;
      }
      try {
        const remoteProfile = await fetchUserProfile(user.uid);
        if (remoteProfile) {
          setUserProfile(remoteProfile);
          setHasProfile(true);
        } else {
          // New account: send them through profile setup, where they choose Creative or Gig Provider.
          setHasProfile(false);
          setUserProfile(prev => ({
            ...INITIAL_USER_PROFILE,
            id: user.uid,
            accountType: prev.accountType,
            displayName: user.displayName || '',
            avatarUrl: user.photoURL || '',
            createdAt: new Date().toISOString()
          }));
          setIsEditingProfile(true);
          setActiveTab('profile');
        }
      } catch (e) {
        console.warn('Could not load profile:', e);
      } finally {
        setIsAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Live quests from Firestore
  useEffect(() => {
    const unsub = subscribeQuests(setQuests);
    return () => unsub();
  }, []);

  // Live artist directory from Firestore
  useEffect(() => {
    const unsub = subscribeArtists(setArtistProfiles);
    return () => unsub();
  }, []);

  // Applications: sent (creatives) and received (studios)
  useEffect(() => {
    if (!currentUser) {
      setMyApplications([]);
      setReceivedApplications([]);
      setContracts([]);
      setSelectedContractId(null);
      return;
    }
    const unsubContracts = subscribeMyContracts(currentUser.uid, setContracts);
    const unsubMine = subscribeMyApplications(currentUser.uid, setMyApplications);
    const unsubReceived = subscribeReceivedApplications(currentUser.uid, setReceivedApplications);
    return () => { unsubContracts(); unsubMine(); unsubReceived(); };
  }, [currentUser]);

  const appliedQuestIds = new Set(myApplications.map(a => a.questId));
  const openQuests: Quest[] = quests
    .filter(q => q.status === 'open')
    .map(q => ({ ...q, applied: appliedQuestIds.has(q.id) }));

  const creatives: Creative[] = artistProfiles
    .filter(p => p.displayName && p.id !== undefined)
    .map((p): Creative => {
      const cats = p.selectedCategories || [];
      const firstGroup = cats.map(id => ARTIST_CATEGORIES.find(x => x.id === id)?.group).find(Boolean);
      const role = (GIG_CATEGORY_KEYS as string[]).includes(firstGroup || '') ? (firstGroup as Creative['role']) : 'Other';
      return {
        id: p.id,
        name: p.displayName,
        role,
        roleLabel: p.roleHeadline || 'Creative',
        avatarUrl: p.avatarUrl || '',
        bio: p.bio || '',
        verified: p.verified === true,
        rating: 0,
        tags: cats.map(catId => ARTIST_CATEGORIES.find(x => x.id === catId)?.name || catId).slice(0, 4),
        credits: p.credits || [],
        gear: p.gear || [],
        hourlyRate: p.hourlyRate || 0,
        location: p.location || '',
        verifiedCreditsCount: p.verified ? (p.credits?.length || 0) : 0
      };
    });

  // Real-time Cloud Firestore Bookmarks Subscription
  useEffect(() => {
    if (!currentUser) {
      setUserBookmarks([]);
      return;
    }
    const unsub = subscribeUserBookmarks(currentUser.uid, (ids) => {
      setUserBookmarks(ids);
    });
    return () => unsub();
  }, [currentUser]);

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => setAuthModal({ open: true, mode });
  // Kept under the old name: every "Sign in" button in the UI calls this.
  const handleGoogleSignIn = () => openAuth('signin');

  const handleGoogleSignOut = async () => {
    try {
      await signOutUser();
      setActiveTab('quests');
      showToast('Signed out of SideQuests.', 'info');
    } catch (err) {
      showToast('Could not sign out.', 'error');
    }
  };

  const handleToggleBookmark = async (questId: string) => {
    if (!currentUser) {
      showToast('Sign in to save quests.', 'info');
      openAuth('signin');
      return;
    }
    const isBookmarked = userBookmarks.includes(questId);
    try {
      await toggleBookmark(currentUser.uid, questId, isBookmarked);
      showToast(isBookmarked ? 'Removed from saved quests.' : 'Quest saved.', 'success');
    } catch (err) {
      console.warn('Bookmark toggle failed:', err);
      showToast('Could not update saved quests.', 'error');
    }
  };

  const handleSaveUserProfile = async (savedProfile: UserProfile) => {
    if (!currentUser) {
      showToast('Sign in to save your profile.', 'info');
      openAuth('signup');
      return;
    }
    const profileToSave: UserProfile = { ...savedProfile, id: currentUser.uid, verified: userProfile.verified };
    try {
      await saveUserProfile(currentUser.uid, profileToSave, !hasProfile);
      setUserProfile(profileToSave);
      setHasProfile(true);
      setIsEditingProfile(false);
      showToast('Profile saved!', 'success');
    } catch (err) {
      console.warn('Could not save profile:', err);
      showToast('Could not save your profile. Please try again.', 'error');
    }
  };

  const handleStartCreateProfile = (type: AccountType = 'artist') => {
    setUserProfile(prev => ({ ...prev, accountType: type }));
    if (!currentUser) {
      openAuth('signup');
      return;
    }
    setIsEditingProfile(true);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchProfileType = async (newType: AccountType) => {
    if (!currentUser || !hasProfile) return;
    try {
      await updateAccountType(currentUser.uid, newType);
      setUserProfile(prev => ({ ...prev, accountType: newType }));
      showToast(`Switched to ${newType === 'artist' ? 'Creative' : 'Gig Provider'} account.`, 'info');
    } catch (err) {
      showToast('Could not switch account type.', 'error');
    }
  };

  const openPostQuest = () => {
    if (!currentUser) { openAuth('signup'); return; }
    if (!hasProfile) { handleStartCreateProfile('provider'); return; }
    if (userProfile.accountType !== 'provider') {
      showToast('Switch to a Gig Provider account (Profile tab) to post quests.', 'info');
      return;
    }
    setIsPostQuestModalOpen(true);
  };

  const handleAddNewQuest = async (newQuest: Quest) => {
    if (!currentUser) return;
    try {
      await createQuest(currentUser.uid, userProfile, newQuest);
      showToast(`Quest "${newQuest.title}" is live!`, 'success');
    } catch (err) {
      console.warn('Could not post quest:', err);
      showToast('Could not post your quest. Check the details and try again.', 'error');
    }
  };

  const handleApplyQuest = (quest: Quest) => {
    if (!currentUser) {
      showToast('Sign in or create an account to apply.', 'info');
      openAuth('signup');
      return;
    }
    if (!hasProfile) {
      handleStartCreateProfile('artist');
      return;
    }
    if (quest.clientUid === currentUser.uid) {
      showToast('This is your own quest.', 'info');
      return;
    }
    if (userProfile.accountType !== 'artist') {
      showToast('Switch to a Creative account (Profile tab) to apply to quests.', 'info');
      return;
    }
    if (appliedQuestIds.has(quest.id)) {
      showToast('You have already applied to this quest.', 'info');
      return;
    }
    setApplyingQuest(quest);
  };

  const handleSubmitApplication = async (quest: Quest, proposalText: string, bidAmount: number) => {
    if (!currentUser || !quest.clientUid) throw new Error('Not ready');
    await submitApplication({
      questId: quest.id,
      questTitle: quest.title,
      clientUid: quest.clientUid,
      applicantUid: currentUser.uid,
      applicantName: userProfile.displayName,
      applicantAvatar: userProfile.avatarUrl,
      applicantHeadline: userProfile.roleHeadline,
      proposalText,
      bidAmount
    });
    showToast('Application sent! Track it in the OS Console.', 'success');
  };

  const openContract = (contractId: string) => {
    setActiveTab('tasks');
    setConsoleTab('contracts');
    setSelectedContractId(contractId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptApplication = async (app: Application) => {
    const quest = quests.find(q => q.id === app.questId);
    if (!quest || !currentUser) {
      showToast('Could not find that quest. Please refresh and try again.', 'error');
      return;
    }
    try {
      const contractId = await hireAndCreateContract(app, quest, { ...userProfile, id: currentUser.uid });
      showToast(`You hired ${app.applicantName}! Agree the milestones to get started.`, 'success');
      openContract(contractId);
    } catch (err) {
      console.warn(err);
      showToast('Could not complete the hire. Please try again.', 'error');
    }
  };

  const handleDeclineApplication = async (app: Application) => {
    try {
      await setApplicationStatus(app.id, 'declined');
    } catch (err) {
      showToast('Could not decline the application.', 'error');
    }
  };

  const handleWithdrawApplication = async (app: Application) => {
    try {
      await withdrawApplication(app.id);
      showToast('Application withdrawn.', 'info');
    } catch (err) {
      showToast('Could not withdraw the application.', 'error');
    }
  };

  const handleSetQuestStatus = async (quest: Quest, status: Quest['status']) => {
    try {
      await setQuestStatus(quest.id, status);
    } catch (err) {
      showToast('Could not update the quest.', 'error');
    }
  };

  const handleDirectHire = (_creative: Creative) => {
    showToast('Direct hiring arrives with Protected Payments. For now, post a quest and they can apply.', 'info');
  };

  const scrollToQuests = () => {
    setActiveTab('quests');
    setTimeout(() => {
      questsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="bg-brand-bg text-on-surface font-sans antialiased selection:bg-brand-volt selection:text-brand-bg min-h-screen relative flex flex-col">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] pointer-events-none"
          >
            <div className={`p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md shadow-2xl ${
              toast.type === 'success' 
                ? 'bg-brand-container-high/90 border-brand-volt/40 text-brand-volt' 
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-400'
                : 'bg-brand-container-high/90 border-white/20 text-white'
            }`}>
              {toast.type === 'success' ? <VerifiedUser className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
              <span className="font-medium text-sm text-white">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED HEADER */}
      <header className="fixed top-0 w-full h-16 z-40 bg-brand-bg/85 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 md:px-16" role="banner">
        <div className="flex items-center gap-3">
          <button aria-label="Menu" className="text-white hover:text-brand-volt transition-colors" onClick={() => scrollToQuests()}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white cursor-pointer select-none" onClick={() => setActiveTab('quests')}>
            SIDEQUESTS
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 text-xs uppercase font-mono tracking-widest text-brand-text-muted items-center">
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'quests' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('quests')}>Ecosystem</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'creatives' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('creatives')}>Creatives</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'learn' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('learn')}>Academy</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'pricing' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('pricing')}>Payment Protection</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'tasks' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('tasks')}>OS Console</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'profile' ? 'text-brand-volt font-bold' : ''}`} onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); }}>Profile</button>
          </div>

          {/* Backend Server Status Pill */}
          {serverStatus && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-volt/5 border border-brand-volt/20 text-brand-volt font-mono text-[9px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-volt animate-ping" />
              <span>Full-Stack Live</span>
            </div>
          )}

          {/* Google Auth / Profile Controls */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab('profile');
                  setIsEditingProfile(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-brand-volt/15 border-brand-volt text-brand-volt shadow-[0_0_15px_rgba(195,244,0,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                }`}
              >
                <Avatar src={userProfile.avatarUrl || currentUser.photoURL || ''} name={userProfile.displayName || currentUser.displayName || ''} className="w-5 h-5 rounded-full border border-brand-volt/40 text-[8px]" />
                <span className="hidden sm:inline font-sans text-xs font-semibold max-w-[110px] truncate text-white">
                  {(currentUser.displayName || userProfile.displayName).split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-volt" title="Synced with Firebase" />
              </button>

              <button
                onClick={handleGoogleSignOut}
                title="Sign Out"
                className="text-brand-text-muted hover:text-red-400 text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-mono uppercase text-[10px]"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs tracking-wider transition-all hover:border-brand-volt/60 hover:text-brand-volt cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              <span className="hidden sm:inline">Sign In / Sign Up</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}

          <button 
            aria-label="Notifications" 
            className="text-brand-text-muted hover:text-brand-volt transition-colors relative"
            onClick={() => showToast('Protocol monitoring: No critical warnings detected.', 'info')}
          >
            <Notifications className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-brand-volt text-glow"></span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow pt-16 pb-24 md:pb-12 max-w-7xl mx-auto w-full px-4 md:px-8">
        
        {/* VIEW ROUTER */}
        <div className="w-full">
          {activeTab === 'quests' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              
              {/* HERO SECTION */}
              <section className="relative min-h-[80vh] flex flex-col justify-center py-12 md:py-20 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-radial-gradient from-brand-volt/5 to-transparent pointer-events-none -z-10"></div>
                <div className="max-w-2xl relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-6 border border-brand-volt/20 rounded-full font-mono text-xs text-brand-volt uppercase tracking-wider bg-brand-volt/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-volt animate-ping"></span>
                    Beta Access Available
                  </span>
                  <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mb-6 leading-[1.1] tracking-tight">
                    The Operating System for the Modern <span className="text-brand-volt text-glow italic font-normal font-display block sm:inline">Creative Gig Economy</span>
                  </h2>
                  <p className="text-lg md:text-xl text-brand-text-muted mb-10 leading-relaxed font-sans max-w-xl">
                    Connecting world-class creatives with payment-protected gig opportunities.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button 
                      onClick={() => {
                        questsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-brand-volt text-brand-bg font-sans font-semibold text-sm px-7 py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-volt/10 glow-btn"
                    >
                      Find Work
                      <ArrowForward className="w-4 h-4 text-brand-bg" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('creatives')}
                      className="border border-white/20 bg-white/5 text-white font-sans font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      Hire Talent
                    </button>
                    {!currentUser ? (
                      <button 
                        onClick={() => openAuth('signup')}
                        className="border border-white/30 bg-white/10 text-white font-sans font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                      >
                        Sign Up Free
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStartCreateProfile('artist')}
                        className="border border-brand-volt/40 bg-brand-volt/10 text-brand-volt font-sans font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-brand-volt/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-brand-volt" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-6 left-0 flex items-center gap-3 opacity-40 hidden md:flex">
                  <div className="w-px h-12 bg-white"></div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white">Explore Ecosystem</span>
                </div>
              </section>

              {/* BENTO VALUE PROP SECTION: FOR THE CREATORS */}
              <section className="py-16 border-b border-white/5">
                <div className="mb-12">
                  <h3 className="font-display text-3xl md:text-4xl text-white mb-2 font-semibold">For The Creators</h3>
                  <p className="text-brand-volt font-mono text-xs uppercase tracking-widest">Architecting your career autonomy</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Reliable payments */}
                  <div className="bg-brand-container border border-white/5 p-8 rounded-2xl flex flex-col justify-between min-h-[250px] hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-brand-volt/5 flex items-center justify-center border border-brand-volt/10 mb-4">
                      <Payments className="w-6 h-6 text-brand-volt" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl md:text-2xl text-white mb-2 font-semibold">Reliable payments</h4>
                      <p className="text-brand-text-muted text-sm leading-relaxed">
                        Never chase an invoice again. With Protected Payments, the gig provider pays before you start the work.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Consistent, well-paying gigs */}
                  <div className="bg-brand-volt text-brand-bg p-8 rounded-2xl flex flex-col justify-between min-h-[250px] shadow-lg shadow-brand-volt/5">
                    <div className="w-12 h-12 rounded-xl bg-brand-bg/10 flex items-center justify-center mb-4">
                      <Verified className="w-6 h-6 text-brand-bg" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl md:text-2xl text-brand-bg mb-2 font-bold leading-tight">Consistent, well-paying gigs</h4>
                      <p className="text-brand-bg/85 text-sm font-medium leading-relaxed">
                        Find paid gigs from brands, agencies, event organizers and independent clients that match your skills.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 (Col Span 2): Verified portfolios */}
                  <div className="md:col-span-2 bg-brand-container-high border border-white/10 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <h4 className="font-display text-2xl text-white mb-3 font-semibold">Verified portfolios</h4>
                      <p className="text-brand-text-muted text-sm leading-relaxed mb-6">
                        Your reputation is your greatest asset. Showcase your best work, credits and skills in one profile gig providers can trust.
                      </p>
                      <button 
                        onClick={() => setActiveTab('creatives')}
                        className="text-brand-volt font-sans font-semibold text-xs flex items-center gap-1.5 hover:gap-3 transition-all uppercase tracking-wider"
                      >
                        Browse Creatives 
                        <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
                      </button>
                    </div>
                    <div className="w-full md:w-5/12 aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-brand-bg relative group">
                      <img 
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuADdQ0rH3ghpBis9Juqesk8fd5Ij1NY52kSoHoDzL1JfZ-4laaASkQkkk-EXr077OP1sxn_ck29BZ4rf-jqvTuWZSt4k9AAGBcbS_cQ3c8xDl-ga6UlAI5dL8MSCCf3hVJMCzZtZmU2xQOkfNHegYgdJsygzPCgk9Abu3v7_Z9JENx7pGv9w_SSJz2GakCerDAXLKktSJnssHyWMuGi_ZRGQLFK-E93Qo77eWbeZh9L7Q1ctvZHmvRfP-1mkPcm2D73YA" 
                        alt="Creative portfolio" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent opacity-60"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* VALUE PROP SECTION: GIG PROVIDERS */}
              <section className="py-16 border-b border-white/5 bg-brand-bg">
                <div className="max-w-xl mx-auto text-center mb-16">
                  <h3 className="font-display text-3xl md:text-4xl text-white mb-3 font-semibold">For Gig Providers</h3>
                  <p className="text-brand-text-muted text-sm leading-relaxed">
                    Brands, agencies, event organizers and individuals: find the right creative for any project.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <Schedule className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Find talent fast</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Post a quest and get applications from creatives with the skills you need, or browse the directory.
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <FolderZip className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Simplified logistics</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Review applicants, hire, and track every quest from one dashboard.
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <Shield className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Protected payments</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Funds are only released when you approve each milestone, so you stay in control of your budget.
                    </p>
                  </div>
                </div>
              </section>

              {/* CREATIVE DISCIPLINES */}
              <section className="py-16 border-b border-white/5">
                <div className="mb-10">
                  <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">Every Kind of Creative Work</h3>
                  <p className="text-brand-text-muted font-mono text-xs uppercase tracking-widest mt-1">Pick a discipline to see open quests</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GIG_CATEGORIES.map((cat) => {
                    const openCount = openQuests.filter(q => q.category === cat.key).length;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setQuestCategoryFilter(cat.key);
                          questsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-left bg-brand-container rounded-2xl border border-white/5 p-6 hover:border-brand-volt/40 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md group-hover:bg-brand-volt group-hover:text-brand-bg group-hover:border-brand-volt transition-colors">{cat.tag}</span>
                          <span className="font-mono text-[10px] text-brand-text-muted">{openCount} open</span>
                        </div>
                        <h4 className="font-display text-lg text-white font-semibold mb-2">{cat.key}</h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed">{cat.blurb}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* SEARCHABLE ACTIVE QUESTS LIST (FIND WORK ENGINE) */}
              <section ref={questsSectionRef} className="py-16 border-b border-white/5 scroll-mt-20">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl text-white font-semibold">Active Quests</h3>
                    <p className="text-brand-text-muted text-sm mt-1">Open quests accepting applications</p>
                  </div>
                  
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-2">
                    {['All', ...GIG_CATEGORY_KEYS].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setQuestCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-all ${
                          questCategoryFilter === cat 
                            ? 'bg-brand-volt text-brand-bg font-bold' 
                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative max-w-md">
                  <span className="absolute inset-y-0 left-3 flex items-center text-brand-text-muted">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={questSearch}
                    onChange={(e) => setQuestSearch(e.target.value)}
                    placeholder="Search gigs (e.g. photographer, logo, voiceover, DJ)..."
                    className="w-full bg-brand-container border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-text-muted"
                  />
                </div>

                {/* Grid of Quests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {openQuests.length === 0 && (
                    <div className="md:col-span-2 bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
                      <p className="text-sm text-white font-semibold mb-1">No open quests right now</p>
                      <p className="text-xs text-brand-text-muted mb-4">Gig providers: be the first to post one.</p>
                      <button onClick={openPostQuest} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl">Post a Quest</button>
                    </div>
                  )}
                  {openQuests
                    .filter(q => questCategoryFilter === 'All' || q.category === questCategoryFilter)
                    .filter(q => q.title.toLowerCase().includes(questSearch.toLowerCase()) || q.description.toLowerCase().includes(questSearch.toLowerCase()))
                    .map((quest) => (
                      <div 
                        key={quest.id} 
                        className="bg-brand-container border border-white/5 p-6 rounded-2xl hover:border-white/15 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={quest.clientAvatar} name={quest.clientName} className="w-10 h-10 rounded-lg text-sm" />
                              <div>
                                <span className="text-brand-text-muted text-[10px] font-mono uppercase tracking-wider">{quest.clientName}</span>
                                <span className="block font-mono text-[10px] text-brand-volt uppercase tracking-wider mt-0.5">{quest.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleBookmark(quest.id)}
                                title={userBookmarks.includes(quest.id) ? "Remove from saved" : "Save Quest to Firestore"}
                                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                  userBookmarks.includes(quest.id)
                                    ? 'bg-brand-volt/20 border-brand-volt text-brand-volt shadow-[0_0_10px_rgba(195,244,0,0.3)]'
                                    : 'bg-white/5 border-white/10 text-brand-text-muted hover:text-white hover:border-white/20'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                                </svg>
                              </button>
                              <span className="font-mono text-base font-bold text-brand-volt bg-brand-volt/5 border border-brand-volt/10 px-3 py-1 rounded-lg">
                                ${quest.budget.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-display text-lg text-white font-semibold mb-2 leading-snug">{quest.title}</h4>
                          <p className="text-xs text-brand-text-muted leading-relaxed line-clamp-3 mb-6">{quest.description}</p>
                          
                          <div className="mb-6">
                            <span className="font-mono text-[10px] uppercase text-white tracking-widest block mb-2 font-semibold">Requirements:</span>
                            <ul className="space-y-1">
                              {quest.requirements.slice(0, 2).map((req, idx) => (
                                <li key={idx} className="text-xs text-brand-text-muted flex items-start gap-2">
                                  <span className="text-brand-volt mt-0.5">•</span>
                                  <span className="line-clamp-1">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-brand-text-muted">Deadline: <span className="text-white">{quest.deadline}</span></span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedQuest(quest)}
                              className="text-white bg-white/5 border border-white/10 hover:bg-white/10 font-sans text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                            >
                              Details
                            </button>
                            <button 
                              onClick={() => handleApplyQuest(quest)}
                              className={`font-sans text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                                quest.applied 
                                  ? 'bg-brand-container-high text-brand-text-muted border border-white/10 cursor-not-allowed'
                                  : 'bg-brand-volt text-brand-bg hover:scale-105 active:scale-95'
                              }`}
                              disabled={quest.applied}
                            >
                              {quest.applied ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </section>

              {/* TRUST PROTOCOL (HIGH CONTRAST ELECTRIC LIME) */}
              <section className="py-20 px-6 md:px-12 bg-brand-volt text-brand-bg rounded-3xl my-12 relative overflow-hidden">
                <div className="max-w-4xl mx-auto">
                  <h3 className="font-display text-3xl md:text-4xl font-extrabold mb-12 tracking-tight">The SideQuests Trust Protocol</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    
                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><VerifiedUser className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Verified Profiles</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          Look for the verified badge: it means the SideQuests team has reviewed that creative's identity and portfolio.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><LockOpen className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Protected Payments</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          With Protected Payments, the gig provider pays up front and the money is only released to the creative when each milestone is approved, so nobody is left chasing an invoice.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><CurrencyExchange className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Transparent Pricing</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          Flat, straightforward platform fees and zero hidden charges. You see exactly what the creative earns and exactly what the gig provider pays.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><SupportAgent className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Mediation Support</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          In the rare event of a dispute, the SideQuests team steps in to help both sides reach a fair outcome.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* FINAL CTA */}
              <section className="py-24 text-center relative overflow-hidden">
                <div className="relative z-10 max-w-2xl mx-auto">
                  <h2 className="font-display text-4xl sm:text-5xl text-white mb-8 leading-tight font-semibold">
                    Ready to Level Up Your Professional Output?
                  </h2>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => handleStartCreateProfile('artist')} 
                      className="bg-brand-volt text-brand-bg font-sans font-bold text-sm px-8 py-4 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-brand-volt/20 flex items-center justify-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      Join as a Creative
                    </button>
                    <button 
                      onClick={() => handleStartCreateProfile('provider')} 
                      className="border border-white/20 text-white font-sans font-bold text-sm px-8 py-4 rounded-xl backdrop-blur-sm hover:bg-white/5 active:scale-95 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-brand-volt" />
                      Register as Gig Provider
                    </button>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* CREATIVES DIRECTORY VIEW */}
          {activeTab === 'creatives' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
              <div className="mb-10">
                <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">The Creative Collective</h3>
                <p className="text-brand-text-muted text-sm mt-1">Creatives on SideQuests. A check mark means SideQuests has verified the profile.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="relative max-w-md w-full">
                  <span className="absolute inset-y-0 left-3 flex items-center text-brand-text-muted">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={creativeSearch}
                    onChange={(e) => setCreativeSearch(e.target.value)}
                    placeholder="Search by name, skill or keyword..."
                    className="w-full bg-brand-container border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-text-muted"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'All', label: 'All' },
                    ...GIG_CATEGORIES.map(c => ({ key: c.key, label: c.key }))
                  ].map((roleObj) => (
                    <button
                      key={roleObj.key}
                      onClick={() => setCreativeRoleFilter(roleObj.key)}
                      className={`px-3.5 py-1.5 rounded-lg font-sans text-xs uppercase tracking-wider font-semibold transition-all ${
                        creativeRoleFilter === roleObj.key
                          ? 'bg-brand-volt text-brand-bg font-bold'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {roleObj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Creatives */}
              {creatives.length === 0 && (
                <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center mb-6">
                  <p className="text-sm text-white font-semibold mb-1">No creatives have joined yet</p>
                  <p className="text-xs text-brand-text-muted mb-4">Creatives: create your profile to be listed here.</p>
                  <button onClick={() => handleStartCreateProfile('artist')} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl">Create Creative Profile</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creatives
                  .filter(c => creativeRoleFilter === 'All' || c.role === creativeRoleFilter)
                  .filter(c => 
                    c.name.toLowerCase().includes(creativeSearch.toLowerCase()) || 
                    c.bio.toLowerCase().includes(creativeSearch.toLowerCase()) ||
                    c.tags.some(t => t.toLowerCase().includes(creativeSearch.toLowerCase())) ||
                    c.roleLabel.toLowerCase().includes(creativeSearch.toLowerCase())
                  )
                  .map((creative) => (
                    <div 
                      key={creative.id} 
                      className="bg-brand-container border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/15 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <Avatar src={creative.avatarUrl} name={creative.name} className="w-16 h-16 rounded-xl border border-white/10 text-lg" />
                          <div className="text-right">
                            {creative.hourlyRate > 0 && <span className="font-mono text-base font-bold text-brand-volt block">${creative.hourlyRate}/hr</span>}
                            <span className="text-brand-text-muted text-[10px] font-mono block mt-1">{creative.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="font-display text-xl text-white font-bold leading-tight">{creative.name}</h4>
                          {creative.verified && <Verified className="w-4 h-4 text-brand-volt" />}
                        </div>
                        <p className="font-mono text-[10px] text-brand-volt uppercase tracking-wider mb-3">{creative.roleLabel}</p>
                        
                        <p className="text-xs text-brand-text-muted leading-relaxed line-clamp-3 mb-4">{creative.bio}</p>

                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {creative.tags.map((tag, idx) => (
                            <span key={idx} className="bg-white/5 text-white border border-white/10 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex gap-2">
                        <button 
                          onClick={() => setSelectedCreative(creative)}
                          className="flex-1 text-white bg-white/5 border border-white/10 hover:bg-white/10 font-sans text-xs font-semibold py-2.5 rounded-lg transition-all"
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => handleDirectHire(creative)}
                          className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-4 py-2.5 rounded-lg hover:scale-[1.03] active:scale-95 transition-all"
                        >
                          Hire & Fund
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          )}

          {/* LEARN / ACADEMY VIEW */}
          {activeTab === 'learn' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
              <div className="mb-12">
                <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">SideQuests Academy</h3>
                <p className="text-brand-text-muted text-sm mt-1">Practical guides for creatives and the people who hire them</p>
              </div>

              {/* Main feature Article */}
              <div className="bg-brand-container-high border border-white/10 rounded-2xl overflow-hidden mb-12 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-80 relative bg-brand-bg">
                  <img 
                    className="w-full h-full object-cover grayscale brightness-90" 
                    src={LEARN_ARTICLES[0].image} 
                    alt={LEARN_ARTICLES[0].title} 
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-4 left-4 font-mono text-[10px] uppercase font-bold tracking-wider bg-brand-volt text-brand-bg px-2.5 py-1 rounded-md">Featured Specifications</span>
                </div>
                <div className="p-8 md:p-10 flex-1">
                  <span className="text-brand-volt font-mono text-xs uppercase tracking-wider">{LEARN_ARTICLES[0].category} • {LEARN_ARTICLES[0].readTime}</span>
                  <h4 className="font-display text-2xl md:text-3xl text-white font-bold mt-2 mb-4 leading-tight">{LEARN_ARTICLES[0].title}</h4>
                  <p className="text-brand-text-muted text-sm leading-relaxed mb-6">{LEARN_ARTICLES[0].summary}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-white">{LEARN_ARTICLES[0].author}</span>
                      <span className="block text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">{LEARN_ARTICLES[0].authorRole}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedArticle(LEARN_ARTICLES[0])}
                      className="text-brand-volt font-sans font-semibold text-xs flex items-center gap-1.5 hover:gap-3 transition-all uppercase tracking-wider"
                    >
                      Read Guide <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of secondary articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {LEARN_ARTICLES.slice(1).map((article) => (
                  <div 
                    key={article.id} 
                    className="bg-brand-container border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/12 transition-all"
                  >
                    <div className="h-48 relative bg-brand-bg">
                      <img className="w-full h-full object-cover grayscale brightness-80" src={article.image} alt={article.title} referrerPolicy="no-referrer" />
                      <span className="absolute top-4 left-4 font-mono text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-brand-text-muted uppercase tracking-wider">{article.readTime}</span>
                        <h4 className="font-display text-xl text-white font-bold mt-1.5 mb-3 leading-snug">{article.title}</h4>
                        <p className="text-xs text-brand-text-muted leading-relaxed line-clamp-3 mb-6">{article.summary}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-semibold text-white">{article.author}</span>
                          <span className="block text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">{article.authorRole}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedArticle(article)}
                          className="text-brand-volt font-sans font-semibold text-xs flex items-center gap-1"
                        >
                          Read <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PRICING & FEES VIEW */}
          {activeTab === 'pricing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
              <div className="mb-12 max-w-xl">
                <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">Platform Fees & Tiers</h3>
                <p className="text-brand-text-muted text-sm mt-1">Simple, flat platform fees. Pricing will be confirmed when Protected Payments launches.</p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                
                {/* Plan 1 */}
                <div className="bg-brand-container border border-white/5 p-8 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-brand-text-muted uppercase tracking-wider">CREATOR BASE</span>
                    <h4 className="font-display text-3xl text-white font-bold mt-1 mb-4">Flat Platform Fee</h4>
                    <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
                      For independent creatives who want to get paid securely with SideQuests Protected Payments.
                    </p>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-5xl font-extrabold text-white">4%</span>
                      <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider">of contract budget</span>
                    </div>

                    <ul className="space-y-3.5 mb-8 border-t border-white/5 pt-6">
                      <li className="text-xs text-brand-text-muted flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span>Protected Payments on every milestone</span>
                      </li>
                      <li className="text-xs text-brand-text-muted flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span>Secure file delivery for every gig</span>
                      </li>
                      <li className="text-xs text-brand-text-muted flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span>Core disputes and mediation support access</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => showToast('Creator Base subscription active by default!', 'info')}
                    className="w-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-sans font-bold text-xs py-3.5 rounded-xl transition-all"
                  >
                    Active on Registration
                  </button>
                </div>

                {/* Plan 2 */}
                <div className="bg-brand-container-high border border-brand-volt/20 p-8 rounded-2xl flex flex-col justify-between relative shadow-lg shadow-brand-volt/5">
                  <div className="absolute top-4 right-4 bg-brand-volt text-brand-bg font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md">
                    POPULAR
                  </div>
                  <div>
                    <span className="font-mono text-xs text-brand-volt uppercase tracking-wider">COLLECTIVE PRO</span>
                    <h4 className="font-display text-3xl text-white font-bold mt-1 mb-4">Infinite Autonomy</h4>
                    <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
                      For busy creatives and gig providers who run lots of quests.
                    </p>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-5xl font-extrabold text-white">$49</span>
                      <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider">/ month</span>
                    </div>

                    <ul className="space-y-3.5 mb-8 border-t border-white/5 pt-6">
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">1.8% reduced transaction fee</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">More file storage for deliverables</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">Featured placement in search</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">Priority support</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => showToast('Collective Pro is coming soon.', 'info')}
                    className="w-full bg-brand-volt text-brand-bg font-sans font-extrabold text-xs py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-brand-volt/10 glow-btn"
                  >
                    Coming Soon
                  </button>
                </div>

              </div>

              {/* Fee Calculator */}
              <div className="bg-brand-container border border-white/5 p-8 rounded-2xl max-w-2xl mx-auto">
                <h4 className="font-display text-xl text-white font-bold mb-2">Platform Fee Estimator</h4>
                <p className="text-xs text-brand-text-muted leading-relaxed mb-6">
                  Enter a gig budget to see the platform fee on each plan.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="font-mono text-[10px] text-brand-text-muted uppercase tracking-wider block mb-2 font-semibold">Projected Gig Budget ($)</label>
                    <input 
                      type="number" 
                      defaultValue="5000"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const el = document.getElementById('calc-total');
                        const elPro = document.getElementById('calc-total-pro');
                        const feeEl = document.getElementById('calc-fee');
                        const feeElPro = document.getElementById('calc-fee-pro');
                        if (el && elPro && feeEl && feeElPro) {
                          const fee = val * 0.04;
                          const feePro = val * 0.018;
                          feeEl.innerText = `$${fee.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
                          feeElPro.innerText = `$${feePro.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
                          el.innerText = `$${(val + fee).toLocaleString(undefined, {maximumFractionDigits: 0})}`;
                          elPro.innerText = `$${(val + feePro).toLocaleString(undefined, {maximumFractionDigits: 0})}`;
                        }
                      }}
                      className="w-full bg-brand-bg border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-volt focus:outline-none text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <span className="font-mono text-[9px] text-brand-text-muted uppercase block tracking-wider mb-1">Creator Base (4%)</span>
                      <span id="calc-fee" className="block text-lg font-bold text-white font-mono">$200</span>
                      <span className="text-[10px] text-brand-text-muted block mt-1">Total funded: <span id="calc-total" className="text-white font-semibold font-mono">$5,200</span></span>
                    </div>

                    <div className="bg-brand-volt/5 p-4 rounded-xl border border-brand-volt/10">
                      <span className="font-mono text-[9px] text-brand-volt uppercase block tracking-wider mb-1 font-semibold">Collective Pro (1.8%)</span>
                      <span id="calc-fee-pro" className="block text-lg font-bold text-brand-volt font-mono">$90</span>
                      <span className="text-[10px] text-brand-text-muted block mt-1">Total funded: <span id="calc-total-pro" className="text-white font-semibold font-mono">$5,090</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TASKS / GIG OPERATING SYSTEM CONSOLE VIEW */}
          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl text-white font-semibold flex items-center gap-2">
                    <TaskAlt className="w-7 h-7 text-brand-volt" />
                    OS Console
                  </h3>
                  <p className="text-brand-text-muted text-xs mt-1">Your contracts, quests and applications</p>
                </div>
                {currentUser && hasProfile && (
                  <div className="flex bg-brand-container border border-white/10 p-1 rounded-xl w-fit">
                    {([
                      ['contracts', `Contracts${contracts.length ? ` (${contracts.length})` : ''}`],
                      ['quests', userProfile.accountType === 'provider' ? 'Quests & Applicants' : 'My Applications']
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setConsoleTab(key)}
                        className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-all ${
                          consoleTab === key ? 'bg-brand-volt text-brand-bg font-bold' : 'text-brand-text-muted hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!currentUser ? (
                <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
                  <p className="text-sm text-white font-semibold mb-1">Sign in to see your contracts, quests and applications</p>
                  <button onClick={() => openAuth('signin')} className="mt-3 bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl">Sign In</button>
                </div>
              ) : !hasProfile ? (
                <div className="bg-brand-container border border-white/5 rounded-2xl p-10 text-center">
                  <p className="text-sm text-white font-semibold mb-1">Finish setting up your profile first</p>
                  <button onClick={() => { setActiveTab('profile'); setIsEditingProfile(true); }} className="mt-3 bg-brand-volt text-brand-bg font-sans font-bold text-xs px-5 py-2.5 rounded-xl">Set Up Profile</button>
                </div>
              ) : consoleTab === 'contracts' ? (
                <ContractsPanel
                  uid={currentUser.uid}
                  profile={userProfile}
                  contracts={contracts}
                  selectedId={selectedContractId}
                  onSelect={setSelectedContractId}
                  onBrowse={() => (userProfile.accountType === 'provider' ? setConsoleTab('quests') : scrollToQuests())}
                  showToast={showToast}
                />
              ) : (
                <Dashboard
                  uid={currentUser.uid}
                  profile={userProfile}
                  quests={quests}
                  myApplications={myApplications}
                  receivedApplications={receivedApplications}
                  onPostQuest={openPostQuest}
                  onBrowseQuests={scrollToQuests}
                  onViewQuest={(q) => setSelectedQuest(q)}
                  onAccept={handleAcceptApplication}
                  onDecline={handleDeclineApplication}
                  onWithdraw={handleWithdrawApplication}
                  onSetQuestStatus={handleSetQuestStatus}
                  onOpenContract={openContract}
                />
              )}
            </motion.div>
          )}

          {/* PROFILE VIEW & CREATOR ROUTE */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
              {isAuthLoading ? (
                <p className="text-center text-sm text-brand-text-muted py-20">Loading…</p>
              ) : !currentUser ? (
                <div className="max-w-md mx-auto bg-brand-container border border-white/10 rounded-3xl p-8 text-center my-10">
                  <h3 className="font-display text-2xl text-white font-bold mb-2">Your SideQuests profile</h3>
                  <p className="text-sm text-brand-text-muted mb-6">Sign in or create a free account to set up your Creative or Gig Provider profile.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => openAuth('signup')} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-3 rounded-xl">Create Account</button>
                    <button onClick={() => openAuth('signin')} className="border border-white/15 text-white font-sans font-semibold text-xs px-6 py-3 rounded-xl hover:bg-white/5">Sign In</button>
                  </div>
                </div>
              ) : (isEditingProfile || !hasProfile) ? (
                <ProfileCreator
                  currentProfile={userProfile}
                  onSaveProfile={handleSaveUserProfile}
                  onCancel={() => { if (hasProfile) setIsEditingProfile(false); else setActiveTab('quests'); }}
                  onNavigateToExplore={() => {
                    setActiveTab('quests');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : (
                <ProfileView
                  profile={userProfile}
                  onEditProfile={() => setIsEditingProfile(true)}
                  onSwitchAccountType={handleSwitchProfileType}
                  quests={quests}
                  creatives={creatives}
                  onSelectCreative={(c) => setSelectedCreative(c)}
                  onSelectQuest={(q) => setSelectedQuest(q)}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenCreateQuestModal={openPostQuest}
                  currentUser={currentUser}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                />
              )}
            </motion.div>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-brand-bg border-t border-white/5 pt-16 pb-28 md:pb-16 px-4 md:px-16" role="contentinfo">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <h2 className="font-display text-2xl text-white tracking-tight mb-4 font-semibold">SIDEQUESTS</h2>
            <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
              The professional network and operating system for the global creative economy. Handcrafted by creatives
            </p>
          </div>
          <div>
            <h5 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4 font-semibold">Platform</h5>
            <ul className="space-y-2 text-xs text-brand-text-muted">
              <li><button onClick={() => setActiveTab('creatives')} className="hover:text-brand-volt transition-colors">Creatives</button></li>
              <li><button onClick={() => scrollToQuests()} className="hover:text-brand-volt transition-colors">Quests</button></li>
              <li><button onClick={() => setActiveTab('learn')} className="hover:text-brand-volt transition-colors">Learn</button></li>
              <li><button onClick={() => setActiveTab('pricing')} className="hover:text-brand-volt transition-colors">Pricing</button></li>
              <li><button onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); }} className="hover:text-brand-volt transition-colors">My Profile</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4 font-semibold">Company</h5>
            <ul className="space-y-2 text-xs text-brand-text-muted">
              <li><button onClick={() => showToast('About SideQuests: the gig network for creatives of every kind.', 'info')} className="hover:text-brand-volt transition-colors">About Us</button></li>
              <li><button onClick={() => showToast('Protected Payments and verified profiles.', 'info')} className="hover:text-brand-volt transition-colors">Trust & Safety</button></li>
              <li><button onClick={() => showToast('GDPR Compliant Privacy Terms.', 'info')} className="hover:text-brand-volt transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => showToast('Terms of Service and Dispute resolution rules.', 'info')} className="hover:text-brand-volt transition-colors">Terms of Service</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[10px] text-white uppercase tracking-widest mb-4 font-semibold">Social</h5>
            <div className="flex gap-3">
              <a aria-label="Instagram" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-brand-text-muted hover:text-brand-volt transition-colors" href="#">
                <CameraAlt className="w-5 h-5" />
              </a>
              <a aria-label="Twitter" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-brand-text-muted hover:text-brand-volt transition-colors" href="#">
                <Share className="w-5 h-5" />
              </a>
              <a aria-label="LinkedIn" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-brand-text-muted hover:text-brand-volt transition-colors" href="#">
                <Groups className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-brand-text-muted font-mono text-[10px] uppercase tracking-wider">
          <span>© 2026 SIDEQUESTS GLOBAL INC.</span>
          <span>HANDCRAFTED FOR CREATIVES</span>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav aria-label="Bottom navigation" className="fixed bottom-0 left-0 w-full z-40 bg-brand-bg/95 backdrop-blur-md border-t border-white/5 py-2.5 px-2 flex justify-around items-center md:hidden">
        <button 
          onClick={() => {
            setActiveTab('quests');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'quests' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <Explore className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Quests</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('creatives');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'creatives' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <Palette className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Creatives</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('learn');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'learn' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <School className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Learn</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('pricing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'pricing' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <Payments className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Pricing</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('tasks');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'tasks' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <Checklist className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Tasks</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('profile');
            setIsEditingProfile(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile' 
              ? 'text-brand-volt bg-brand-volt/10 font-bold' 
              : 'text-brand-text-muted hover:text-white opacity-70'
          }`}
        >
          <AccountCircle className="w-5 h-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider mt-1">Profile</span>
        </button>
      </nav>

      {/* DETAILS / MODAL OVERLAYS */}
      
      {/* Creative detail Modal */}
      <AnimatePresence>
        {selectedCreative && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-bg/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-brand-container border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
            >
              <button 
                onClick={() => setSelectedCreative(null)}
                className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <Close className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row items-start gap-6 pb-6 border-b border-white/5 mb-6">
                <Avatar src={selectedCreative.avatarUrl} name={selectedCreative.name} className="w-24 h-24 rounded-2xl border border-white/10 text-2xl" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-2xl text-white font-bold">{selectedCreative.name}</h4>
                    {selectedCreative.verified && <Verified className="w-5 h-5 text-brand-volt" />}
                  </div>
                  <p className="font-mono text-xs text-brand-volt uppercase tracking-wider mb-2">{selectedCreative.roleLabel}</p>
                  <p className="text-xs text-brand-text-muted mb-4">{selectedCreative.location} • Hourly rate: ${selectedCreative.hourlyRate}/hr</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCreative.tags.map((t, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="font-mono text-[10px] text-brand-volt uppercase tracking-widest block mb-2 font-bold">About</h5>
                  <p className="text-xs text-brand-text-muted leading-relaxed">{selectedCreative.bio}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-mono text-[10px] text-brand-volt uppercase tracking-widest block mb-2.5 font-bold">Credits & Past Work</h5>
                    <ul className="space-y-2">
                      {selectedCreative.credits.map((cr, idx) => (
                        <li key={idx} className="text-xs text-brand-text-muted flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-brand-volt flex-shrink-0 mt-0.5" />
                          <span>{cr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] text-brand-volt uppercase tracking-widest block mb-2.5 font-bold">Tools & Equipment</h5>
                    <ul className="space-y-2">
                      {selectedCreative.gear.map((g, idx) => (
                        <li key={idx} className="text-xs text-brand-text-muted flex items-start gap-2">
                          <LocalActivity className="w-4 h-4 text-brand-volt flex-shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedCreative(null)}
                  className="px-5 py-2.5 rounded-lg border border-white/10 text-white text-xs font-semibold hover:bg-white/5 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleDirectHire(selectedCreative);
                  }}
                  className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-2.5 rounded-lg hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-brand-volt/10"
                >
                  Secure Direct Hire
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-bg/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-brand-container border border-white/10 rounded-2xl max-w-xl w-full p-6 relative"
            >
              <button 
                onClick={() => setSelectedQuest(null)}
                className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <Close className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 mb-6">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedQuest.clientAvatar} name={selectedQuest.clientName} className="w-12 h-12 rounded-xl border border-white/10 text-sm" />
                  <div>
                    <h4 className="font-display text-lg text-white font-bold leading-tight">{selectedQuest.title}</h4>
                    <span className="text-[10px] text-brand-text-muted font-mono uppercase tracking-wider">{selectedQuest.clientName}</span>
                  </div>
                </div>
                <span className="font-mono text-base font-bold text-brand-volt bg-brand-volt/5 border border-brand-volt/10 px-3 py-1.5 rounded-lg">
                  ${selectedQuest.budget.toLocaleString()}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider block mb-1">DISCIPLINE CATEGORY</span>
                  <span className="text-white uppercase font-bold">{selectedQuest.category}</span>
                </div>

                <div>
                  <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider block mb-1">GIG SPECIFICATIONS</span>
                  <p className="text-brand-text-muted leading-relaxed">{selectedQuest.description}</p>
                </div>

                <div>
                  <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider block mb-2">ROADMAP MILESTONES (FUNDED)</span>
                  <div className="space-y-2">
                    {selectedQuest.milestones.map((milestone, idx) => (
                      <div key={idx} className="bg-brand-bg p-3 rounded-lg border border-white/5 flex justify-between items-center text-[11px]">
                        <span className="text-white font-semibold">{idx + 1}. {milestone.title}</span>
                        <span className="font-mono text-brand-volt font-bold">${milestone.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedQuest(null)}
                  className="px-5 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all text-xs"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    const q = selectedQuest;
                    setSelectedQuest(null);
                    handleApplyQuest(q);
                  }}
                  className={`font-sans text-xs font-bold px-6 py-2 rounded-lg transition-all ${
                    appliedQuestIds.has(selectedQuest.id)
                      ? 'bg-brand-container-high text-brand-text-muted border border-white/10 cursor-not-allowed'
                      : 'bg-brand-volt text-brand-bg hover:scale-102 active:scale-95 shadow-md shadow-brand-volt/10'
                  }`}
                  disabled={appliedQuestIds.has(selectedQuest.id) || selectedQuest.status !== 'open'}
                >
                  {appliedQuestIds.has(selectedQuest.id) ? 'Applied' : selectedQuest.status !== 'open' ? 'Closed' : 'Apply'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article read Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-bg/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-brand-container border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <Close className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <span className="text-brand-volt font-mono text-[10px] uppercase tracking-wider">{selectedArticle.category} • {selectedArticle.readTime}</span>
                <h4 className="font-display text-2xl md:text-3xl text-white font-bold mt-1.5 leading-tight">{selectedArticle.title}</h4>
                <div className="flex items-center gap-2 mt-3 text-xs text-brand-text-muted">
                  <span className="text-white font-medium">{selectedArticle.author}</span>
                  <span>•</span>
                  <span>{selectedArticle.authorRole}</span>
                </div>
              </div>

              <div className="mb-6 rounded-xl overflow-hidden h-48 bg-brand-bg relative">
                <img className="w-full h-full object-cover grayscale brightness-95" src={selectedArticle.image} alt={selectedArticle.title} referrerPolicy="no-referrer" />
              </div>

              <div className="space-y-4 text-xs md:text-sm text-brand-text-muted leading-relaxed">
                {selectedArticle.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 mt-8 flex justify-between items-center text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">
                <span>SideQuests Technical Spec</span>
                <button 
                  onClick={() => {
                    setSelectedArticle(null);
                    showToast('Article marked as completed', 'success');
                  }}
                  className="text-brand-volt font-semibold font-sans hover:underline uppercase"
                >
                  Mark Completed
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal(prev => ({ ...prev, open: false }))}
      />

      <ApplyModal
        quest={applyingQuest}
        onClose={() => setApplyingQuest(null)}
        onSubmit={handleSubmitApplication}
      />

      {/* Post Quest Modal for Gig Providers */}
      <PostQuestModal
        isOpen={isPostQuestModalOpen}
        onClose={() => setIsPostQuestModalOpen(false)}
        onPostQuest={handleAddNewQuest}
        currentUser={userProfile}
      />

    </div>
  );
}
