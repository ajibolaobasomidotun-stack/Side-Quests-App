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
import { Creative, Quest, Task, Article, UserProfile, AccountType } from './types';
import { INITIAL_CREATIVES, INITIAL_QUESTS, INITIAL_TASKS, LEARN_ARTICLES } from './data';
import { INITIAL_USER_PROFILE, ARTIST_CATEGORIES, PROVIDER_CATEGORIES } from './profileData';
import { ProfileCreator } from './components/ProfileCreator';
import { ProfileView } from './components/ProfileView';
import { PostQuestModal } from './components/PostQuestModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'quests' | 'creatives' | 'learn' | 'pricing' | 'tasks' | 'profile'>('quests');
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [creatives, setCreatives] = useState<Creative[]>(INITIAL_CREATIVES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sidequests_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USER_PROFILE;
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isPostQuestModalOpen, setIsPostQuestModalOpen] = useState<boolean>(false);
  
  // Active detail views
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  
  // Custom hiring state
  const [hiringCreative, setHiringCreative] = useState<Creative | null>(null);
  const [hireTitle, setHireTitle] = useState('');
  const [hireBudget, setHireBudget] = useState('1500');
  const [hireDescription, setHireDescription] = useState('');
  const [hireMilestoneCount, setHireMilestoneCount] = useState('2');

  // Active task details inside the Tasks tab
  const [activeTaskId, setActiveTaskId] = useState<string>('t1');
  const [taskViewRole, setTaskViewRole] = useState<'artist' | 'client'>('artist');
  const [chatMessage, setChatMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Audio player mock state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleSaveUserProfile = (savedProfile: UserProfile) => {
    setUserProfile(savedProfile);
    try {
      localStorage.setItem('sidequests_user_profile', JSON.stringify(savedProfile));
    } catch (e) {
      console.error(e);
    }
    
    // If saving as artist, dynamically update/add to creatives collective
    if (savedProfile.accountType === 'artist') {
      const existingIdx = creatives.findIndex(c => c.id === savedProfile.id || c.name.includes('(You)'));
      const artistCreative: Creative = {
        id: savedProfile.id,
        name: `${savedProfile.displayName} (You)`,
        role: savedProfile.selectedCategories.some(c => c.includes('md') || c.includes('music_director')) ? 'md' :
              savedProfile.selectedCategories.some(c => c.includes('engineer') || c.includes('atmos') || c.includes('stereo')) ? 'engineer' :
              savedProfile.selectedCategories.some(c => c.includes('prod') || c.includes('beat') || c.includes('electronic')) ? 'producer' : 'musician',
        roleLabel: savedProfile.roleHeadline,
        avatarUrl: savedProfile.avatarUrl,
        bio: savedProfile.bio,
        verified: true,
        rating: 5.0,
        tags: savedProfile.selectedCategories.map(catId => {
          const c = ARTIST_CATEGORIES.find(x => x.id === catId);
          return c ? c.name : catId;
        }).slice(0, 4),
        credits: savedProfile.credits && savedProfile.credits.length > 0 ? savedProfile.credits : ['SideQuests Verified Artist Profile'],
        gear: savedProfile.gear && savedProfile.gear.length > 0 ? savedProfile.gear : ['Apollo x8p', 'Custom Rig'],
        hourlyRate: savedProfile.hourlyRate || 120,
        location: savedProfile.location,
        verifiedCreditsCount: (savedProfile.credits?.length || 0) + 12
      };
      
      if (existingIdx >= 0) {
        setCreatives(prev => {
          const next = [...prev];
          next[existingIdx] = artistCreative;
          return next;
        });
      } else {
        setCreatives(prev => [artistCreative, ...prev]);
      }
    }

    setIsEditingProfile(false);
    showToast(
      `Account configured as ${savedProfile.accountType === 'artist' ? 'Artist Talent' : 'Gig Provider'} with ${savedProfile.selectedCategories.length} selected categories!`,
      'success'
    );
  };

  const handleStartCreateProfile = (type: AccountType = 'artist') => {
    setUserProfile(prev => ({
      ...prev,
      accountType: type
    }));
    setIsEditingProfile(true);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchProfileType = (newType: AccountType) => {
    setUserProfile(prev => {
      const updated: UserProfile = {
        ...prev,
        accountType: newType,
        selectedCategories: newType === 'artist' 
          ? ['prod_electronic', 'eng_stereo_mix', 'mus_synth_keys'] 
          : ['gp_tour_live', 'gp_label_ep']
      };
      try {
        localStorage.setItem('sidequests_user_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Account view switched to ${newType === 'artist' ? 'Artist Talent' : 'Gig Provider'}!`, 'info');
  };

  const handleAddNewQuest = (newQuest: Quest) => {
    setQuests(prev => [newQuest, ...prev]);
    showToast(`Quest "${newQuest.title}" posted to the SideQuests network! Escrow ready.`, 'success');
  };

  const handleApplyQuest = (quest: Quest) => {
    // Check if already applied
    if (quest.applied) {
      showToast('You have already applied to this gig!', 'info');
      return;
    }

    // Set quest as applied
    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, applied: true } : q));

    // Create a new task (active contract) for the user as the Artist
    const newTask: Task = {
      id: `task_${Date.now()}`,
      questId: quest.id,
      questTitle: quest.title,
      clientName: quest.clientName,
      artistName: 'Elena Rostova (You)', // Mock user
      category: quest.category,
      totalBudget: quest.budget,
      escrowBalance: quest.budget,
      releasedAmount: 0,
      status: 'active',
      role: 'artist',
      currentMilestoneIndex: 0,
      milestones: quest.milestones.map(m => ({
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: 'escrowed'
      })),
      messages: [
        {
          id: `msg_${Date.now()}_1`,
          sender: 'client',
          text: `Hi Elena! Thanks for applying to "${quest.title}". We’ve approved your application and fully funded the smart-contract escrow of $${quest.budget.toLocaleString()}. Welcome aboard!`,
          time: 'Just now'
        },
        {
          id: `msg_${Date.now()}_2`,
          sender: 'client',
          text: 'Please review the milestones and let us know when you begin working on the first phase.',
          time: 'Just now'
        }
      ],
      files: []
    };

    setTasks(prev => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    setTaskViewRole('artist');
    showToast(`Application submitted! $${quest.budget.toLocaleString()} locked in escrow!`, 'success');
    
    // Smooth transition to Tasks tab
    setActiveTab('tasks');
  };

  const handleCreateCustomHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringCreative) return;

    const totalBudget = parseFloat(hireBudget) || 1000;
    
    // Create custom milestones based on input count
    const mCount = parseInt(hireMilestoneCount) || 2;
    const milestoneAmount = Math.round(totalBudget / mCount);
    const milestones = Array.from({ length: mCount }).map((_, idx) => ({
      id: `custom_m_${Date.now()}_${idx}`,
      title: idx === mCount - 1 ? 'Final Master Delivery & Approval' : `Milestone Phase ${idx + 1} Deliverable`,
      amount: idx === mCount - 1 ? totalBudget - (milestoneAmount * (mCount - 1)) : milestoneAmount,
      status: 'escrowed' as const
    }));

    // Create custom task
    const newTask: Task = {
      id: `task_custom_${Date.now()}`,
      questId: `custom_q_${Date.now()}`,
      questTitle: hireTitle || `Direct Session: ${hiringCreative.name}`,
      clientName: 'You (Studio Client)',
      artistName: hiringCreative.name,
      category: hiringCreative.role === 'engineer' ? 'Studio Sessions' : hiringCreative.role === 'md' ? 'Live Performance' : 'Production',
      totalBudget: totalBudget,
      escrowBalance: totalBudget,
      releasedAmount: 0,
      status: 'active',
      role: 'client',
      currentMilestoneIndex: 0,
      milestones: milestones,
      messages: [
        {
          id: `m_c_1`,
          sender: 'client',
          text: `Hey ${hiringCreative.name}! I’ve set up a custom session: "${hireTitle || `Direct Session`}" and deposited $${totalBudget.toLocaleString()} directly into the SideQuests trust escrow. Ready when you are!`,
          time: 'Just now'
        }
      ],
      files: []
    };

    setTasks(prev => [newTask, ...prev]);
    setActiveTaskId(newTask.id);
    setTaskViewRole('client');
    setHiringCreative(null);
    setSelectedCreative(null);
    
    // Clear form
    setHireTitle('');
    setHireBudget('1500');
    setHireDescription('');
    setHireMilestoneCount('2');

    showToast(`Escrow session funded! $${totalBudget.toLocaleString()} secured.`, 'success');
    setActiveTab('tasks');
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTask) return;

    const newMsg = {
      id: `msg_user_${Date.now()}`,
      sender: activeTask.role,
      text: chatMessage,
      time: 'Just now'
    };

    // Update state
    setTasks(prev => prev.map(t => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    setChatMessage('');

    // Trigger mock auto-reply after 2 seconds to make the chat feel functional
    setTimeout(() => {
      if (!activeTask) return;
      const counterparty = activeTask.role === 'artist' ? 'client' : 'artist';
      const responseName = counterparty === 'artist' ? activeTask.artistName.replace(' (You)', '') : activeTask.clientName.replace(' (You)', '');
      
      const responseText = counterparty === 'artist' 
        ? `Thanks! Got your message. I am tracking this in my DAW right now and will upload a progress stem shortly.`
        : `Got it! Let’s keep pushing on these milestones. The escrow balance looks good on my end. Cheers!`;

      const autoMsg = {
        id: `msg_auto_${Date.now()}`,
        sender: counterparty,
        text: responseText,
        time: 'Just now'
      };

      setTasks(prev => prev.map(t => {
        if (t.id === activeTask.id) {
          // Prevent duplicating if they changed tasks in the meantime
          return {
            ...t,
            messages: [...t.messages, autoMsg]
          };
        }
        return t;
      }));
      showToast(`New message from ${responseName}`, 'info');
    }, 3000);
  };

  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTask) return;

    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newFile = {
              id: `f_${Date.now()}`,
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              uploadedAt: 'Just now',
              uploadedBy: activeTask.role,
              url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' // Live fallback mp3
            };

            setTasks(prevTasks => prevTasks.map(t => {
              if (t.id === activeTask.id) {
                // If artist uploads, let's also automatically submit the current pending milestone!
                const updatedMilestones = [...t.milestones];
                const currentIdx = t.currentMilestoneIndex;
                if (currentIdx < updatedMilestones.length && updatedMilestones[currentIdx].status === 'escrowed' && t.role === 'artist') {
                  updatedMilestones[currentIdx] = {
                    ...updatedMilestones[currentIdx],
                    status: 'submitted',
                    submittedFile: newFile.url,
                    submittedFileName: newFile.name,
                    submittedAt: 'Just now'
                  };
                }

                return {
                  ...t,
                  files: [newFile, ...t.files],
                  milestones: updatedMilestones
                };
              }
              return t;
            }));

            setIsUploading(false);
            setUploadProgress(0);
            showToast(`${file.name} uploaded successfully!`, 'success');
          }, 500);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  const handleReleaseEscrow = (taskId: string, milestoneId: string) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        const updatedMilestones = t.milestones.map(m => {
          if (m.id === milestoneId) {
            return { ...m, status: 'released' as const };
          }
          return m;
        });

        const releasedMilestone = t.milestones.find(m => m.id === milestoneId);
        const releaseAmount = releasedMilestone ? releasedMilestone.amount : 0;

        const newEscrowBalance = Math.max(0, t.escrowBalance - releaseAmount);
        const newReleasedAmount = t.releasedAmount + releaseAmount;
        const nextMilestoneIdx = t.currentMilestoneIndex + 1;

        // check if completely done
        const isCompleted = updatedMilestones.every(m => m.status === 'released');

        return {
          ...t,
          escrowBalance: newEscrowBalance,
          releasedAmount: newReleasedAmount,
          milestones: updatedMilestones,
          currentMilestoneIndex: nextMilestoneIdx,
          status: isCompleted ? 'completed' : 'active'
        };
      }
      return t;
    }));

    showToast('Escrow funds released to Artist successfully!', 'success');
  };

  const scrollToQuests = () => {
    setActiveTab('quests');
    setTimeout(() => {
      questsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Synchronize playback progress bar simulation
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

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
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'pricing' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('pricing')}>Escrow Trust</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'tasks' ? 'text-brand-volt' : ''}`} onClick={() => setActiveTab('tasks')}>OS Console</button>
            <button className={`hover:text-brand-volt transition-colors ${activeTab === 'profile' ? 'text-brand-volt font-bold' : ''}`} onClick={() => { setActiveTab('profile'); setIsEditingProfile(false); }}>Profile</button>
          </div>

          {/* User Account / Profile Badge */}
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
            <img 
              src={userProfile.avatarUrl} 
              alt={userProfile.displayName} 
              className="w-5 h-5 rounded-full object-cover border border-white/20"
              referrerPolicy="no-referrer"
            />
            <span className="hidden sm:inline font-sans text-xs font-semibold max-w-[100px] truncate text-white">
              {userProfile.displayName.split(' ')[0]}
            </span>
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
              userProfile.accountType === 'artist' 
                ? 'bg-brand-volt text-brand-bg' 
                : 'bg-indigo-500 text-white'
            }`}>
              {userProfile.accountType === 'artist' ? 'Artist' : 'Provider'}
            </span>
          </button>

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
                    The Operating System for the Modern <span className="text-brand-volt text-glow italic font-normal font-display block sm:inline">Music Gig Economy</span>
                  </h2>
                  <p className="text-lg md:text-xl text-brand-text-muted mb-10 leading-relaxed font-sans max-w-xl">
                    Connecting world-class musicians, engineers, and producers with high-stakes, escrow-protected opportunities.
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
                    <button 
                      onClick={() => handleStartCreateProfile('artist')}
                      className="border border-brand-volt/40 bg-brand-volt/10 text-brand-volt font-sans font-semibold text-sm px-6 py-3.5 rounded-xl hover:bg-brand-volt/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-brand-volt" />
                      Create Profile
                    </button>
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
                        Never chase an invoice again. Smart-contract escrow ensures your funds are secured and verified before you even boot your DAW or step on stage.
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
                        Access high-value contracts from major labels, video game studios, and independent powerhouses tailored exactly to your technical gear & specs.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 (Col Span 2): Verified portfolios */}
                  <div className="md:col-span-2 bg-brand-container-high border border-white/10 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <h4 className="font-display text-2xl text-white mb-3 font-semibold">Verified portfolios</h4>
                      <p className="text-brand-text-muted text-sm leading-relaxed mb-6">
                        Your professional reputation is your greatest asset. We aggregate engineering credits, album certifications, and verified client testimonials into a singular high-editorial profile.
                      </p>
                      <button 
                        onClick={() => {
                          const marcus = creatives.find(c => c.id === 'c1');
                          if (marcus) setSelectedCreative(marcus);
                        }}
                        className="text-brand-volt font-sans font-semibold text-xs flex items-center gap-1.5 hover:gap-3 transition-all uppercase tracking-wider"
                      >
                        View Example Profile 
                        <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
                      </button>
                    </div>
                    <div className="w-full md:w-5/12 aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-brand-bg relative group">
                      <img 
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuADdQ0rH3ghpBis9Juqesk8fd5Ij1NY52kSoHoDzL1JfZ-4laaASkQkkk-EXr077OP1sxn_ck29BZ4rf-jqvTuWZSt4k9AAGBcbS_cQ3c8xDl-ga6UlAI5dL8MSCCf3hVJMCzZtZmU2xQOkfNHegYgdJsygzPCgk9Abu3v7_Z9JENx7pGv9w_SSJz2GakCerDAXLKktSJnssHyWMuGi_ZRGQLFK-E93Qo77eWbeZh9L7Q1ctvZHmvRfP-1mkPcm2D73YA" 
                        alt="Musician Professional Portfolio Interface" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent opacity-60"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* AGENCY VALUE PROP SECTION: STUDIO OWNERS */}
              <section className="py-16 border-b border-white/5 bg-brand-bg">
                <div className="max-w-xl mx-auto text-center mb-16">
                  <h3 className="font-display text-3xl md:text-4xl text-white mb-3 font-semibold">For Studio Owners & Agencies</h3>
                  <p className="text-brand-text-muted text-sm leading-relaxed">
                    Streamline your production pipeline with vetted, high-caliber talent on demand.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <Schedule className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Book vetted talent in &lt;48 hours</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Our proprietary matching algorithm identifies the perfect engineer or performer for your specific sonic requirements instantly.
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <FolderZip className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Simplified logistics</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Contracting, NDAs, and secure multi-gigabyte file transfers are handled natively within the SideQuests OS. One dashboard for your entire production crew.
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                      <Shield className="w-6 h-6 text-brand-volt" />
                    </div>
                    <h4 className="font-display text-lg text-white font-semibold mb-3">Escrow-protected payments</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed max-w-xs">
                      Funds are only released upon your explicit milestone approval. Absolute security for high-budget productions and sensitive intellectual property.
                    </p>
                  </div>
                </div>
              </section>

              {/* HIGH-STAKES DISCIPLINES */}
              <section className="py-16 border-b border-white/5">
                <div className="mb-10 flex justify-between items-end">
                  <div>
                    <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">High-Stakes Disciplines</h3>
                    <p className="text-brand-text-muted font-mono text-xs uppercase tracking-widest mt-1">Specialized Verticals</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => showToast('Sliding list updated', 'info')}
                      aria-label="Previous" 
                      className="p-2 border border-white/10 rounded-lg active:scale-90 transition-all text-brand-text-muted hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => showToast('Sliding list updated', 'info')}
                      aria-label="Next" 
                      className="p-2 border border-white/10 rounded-lg active:scale-90 transition-all bg-white/5 text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-6 scroll-smooth snap-x">
                  {/* Category 1 */}
                  <div className="flex-shrink-0 w-80 bg-brand-container rounded-2xl overflow-hidden border border-white/5 snap-start group hover:border-white/15 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-container to-transparent z-10"></div>
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 grayscale group-hover:grayscale-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvvkfMBu5pn1kAh_kAklwd4xw8YVKSTOzp9a0gte4MT8IoVjCNrqnVzc4WpTA0DQewGaqr0GA35XLEcgIVdt0DOIGKBkKsGp5pALNPfzWFIriX66evalZLPXQeYjue-6S6IV8X0AIhTF5PZF-9gSGJMInfninIj1swQIaDIbNsGP9wUaxo9I9fE-NKp8HsiWNliMeccri_ytiPw4IHKBAQD64IWmmAw0b_8wKLz2jv7rUYaoMig0Qd" 
                        alt="Live Performance Stage"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 left-4 z-20 font-mono text-[10px] uppercase font-bold tracking-wider bg-brand-volt text-brand-bg px-2.5 py-1 rounded-md">LIVE</span>
                    </div>
                    <div className="p-6">
                      <h4 className="font-display text-lg text-white font-semibold mb-2">Live Performance</h4>
                      <p className="text-xs text-brand-text-muted leading-relaxed mb-4">Touring musicians, session players, and MDs for global arenas & festivals.</p>
                      <div className="h-[2px] w-full bg-white/10 relative">
                        <div className="absolute inset-0 bg-brand-volt w-1/3 shadow-[0_0_10px_rgba(195,244,0,0.5)]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="flex-shrink-0 w-80 bg-brand-container rounded-2xl overflow-hidden border border-white/5 snap-start group hover:border-white/15 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-container to-transparent z-10"></div>
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 grayscale group-hover:grayscale-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkYCSkvhRgRQxJjhNICtlXVynwTdPvzknbZLfJNyxAkFNQXLwiUVUUEp8zsD0J4hhDtQwUItpJzg4gCeX807LNxM3QuUryLylXSHoo_ExkusKlhLGVpjxufxIJBpXZHPpGTspIzOw5UuFF7vTmaKq8XFJDdbgaras-LedG-CLIuCRKhiqGGRX-un51NUHKGrqerDzEC5zY1muIz_7Nj0wTru8KtvZ2cFXBKHdlE0MSNnu7r452dyrx" 
                        alt="Recording Studio Control Room"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 left-4 z-20 font-mono text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md">ENGINEERING</span>
                    </div>
                    <div className="p-6">
                      <h4 className="font-display text-lg text-white font-semibold mb-2">Studio Sessions</h4>
                      <p className="text-xs text-brand-text-muted leading-relaxed mb-4">Grammy-caliber tracking, analog mixing, and mastering engineers.</p>
                      <div className="h-[2px] w-full bg-white/10 relative">
                        <div className="absolute inset-0 bg-brand-volt w-2/3 shadow-[0_0_10px_rgba(195,244,0,0.5)]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="flex-shrink-0 w-80 bg-brand-container rounded-2xl overflow-hidden border border-white/5 snap-start group hover:border-white/15 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-container to-transparent z-10"></div>
                      <img 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 grayscale group-hover:grayscale-0" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZFUAqrIJupLJFxRytw0vaaH5-Ou6tPin04ADt6HYFlEUJW9TyxzlqF6XMf4qnzTiCyh0BQltjS26VDm6KuWGvu0mXBUAF1FbViS68O3HYfHxDRpVFO54bZoViuJ1tDe5I54J4ixFEqNFdpd1V85b6hKG4Gd_x4UkWbuuXgl5ni7w_Vs0_7mOi47ehfefj-ay1TUmFw2OVGRsDlLT4Mb2S8jh6znFr1Pdt-PnZRKF2MV0MMYpqhOHs" 
                        alt="Music Production Workspace"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 left-4 z-20 font-mono text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md">CREATIVE</span>
                    </div>
                    <div className="p-6">
                      <h4 className="font-display text-lg text-white font-semibold mb-2">Production</h4>
                      <p className="text-xs text-brand-text-muted leading-relaxed mb-4">Composers, beatmakers, synthesists, and dynamic creative directors.</p>
                      <div className="h-[2px] w-full bg-white/10 relative">
                        <div className="absolute inset-0 bg-brand-volt w-1/2 shadow-[0_0_10px_rgba(195,244,0,0.5)]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SEARCHABLE ACTIVE QUESTS LIST (FIND WORK ENGINE) */}
              <section ref={questsSectionRef} className="py-16 border-b border-white/5 scroll-mt-20">
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl text-white font-semibold">Active Quests</h3>
                    <p className="text-brand-text-muted text-sm mt-1">Funded escrow contracts accepting applications</p>
                  </div>
                  
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Live Performance', 'Studio Sessions', 'Production'].map((cat) => (
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
                    placeholder="Search gigs (e.g., Atmos, Ableton, synth, bass)..."
                    className="w-full bg-brand-container border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-text-muted"
                  />
                </div>

                {/* Grid of Quests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quests
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
                              <img className="w-10 h-10 rounded-lg object-cover" src={quest.clientAvatar} alt={quest.clientName} referrerPolicy="no-referrer" />
                              <div>
                                <span className="text-brand-text-muted text-[10px] font-mono uppercase tracking-wider">{quest.clientName}</span>
                                <span className="block font-mono text-[10px] text-brand-volt uppercase tracking-wider mt-0.5">{quest.category}</span>
                              </div>
                            </div>
                            <span className="font-mono text-base font-bold text-brand-volt bg-brand-volt/5 border border-brand-volt/10 px-3 py-1 rounded-lg">
                              ${quest.budget.toLocaleString()}
                            </span>
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
                              {quest.applied ? 'Applied' : 'Apply & Secure Escrow'}
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
                          Every talent on our platform undergoes a rigorous 3-stage vetting process including technical portfolio audits, references, and credit verification.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><LockOpen className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Escrow Payments</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          Our proprietary escrow system holds client funds securely in trust until both parties confirm milestone completion, completely eliminating non-payment risks.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><CurrencyExchange className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Transparent Pricing</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          Flat, straightforward platform escrow fees and zero hidden charges. You see exactly what the talent earns and exactly what the studio pays.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="text-3xl flex-shrink-0 mt-1"><SupportAgent className="w-8 h-8 text-brand-bg" /></span>
                      <div>
                        <h4 className="font-sans font-bold text-lg uppercase tracking-tight mb-2">Mediation Support</h4>
                        <p className="text-sm font-medium text-brand-bg/80 leading-relaxed">
                          In the rare event of a dispute, our expert mediation team—composed of veteran audio professionals—steps in to resolve issues fairly.
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
                      <Headphones className="w-4 h-4" />
                      Join as Artist Talent
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
                <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">The Artist Collective</h3>
                <p className="text-brand-text-muted text-sm mt-1">Direct contact directory of premium, thoroughly vetted audio elite</p>
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
                    placeholder="Search by name, tags, credits or gear..."
                    className="w-full bg-brand-container border border-white/10 focus:border-brand-volt focus:outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-text-muted"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'All', label: 'All Specialties' },
                    { key: 'producer', label: 'Producers' },
                    { key: 'engineer', label: 'Engineers' },
                    { key: 'musician', label: 'Musicians' },
                    { key: 'md', label: 'Music Directors' }
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
                          <img className="w-16 h-16 rounded-xl object-cover border border-white/10" src={creative.avatarUrl} alt={creative.name} referrerPolicy="no-referrer" />
                          <div className="text-right">
                            <span className="font-mono text-base font-bold text-brand-volt block">${creative.hourlyRate}/hr</span>
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
                          Portfolio & Gear
                        </button>
                        <button 
                          onClick={() => {
                            setHiringCreative(creative);
                            setHireBudget('1500');
                          }}
                          className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-4 py-2.5 rounded-lg hover:scale-[1.03] active:scale-95 transition-all"
                        >
                          Hire & Lock Escrow
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
                <p className="text-brand-text-muted text-sm mt-1">High-editorial masterclasses and technical specifications for audio elite</p>
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
                      Read Masterclass <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
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
                          Open Spec <ArrowRightAlt className="w-4 h-4 text-brand-volt" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PRICING & ESCROW FEES VIEW */}
          {activeTab === 'pricing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
              <div className="mb-12 max-w-xl">
                <h3 className="font-display text-3xl md:text-4xl text-white font-semibold">Platform & Escrow Tiers</h3>
                <p className="text-brand-text-muted text-sm mt-1">SideQuests keeps flat rates with absolute payment security. Choose your career speed.</p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                
                {/* Plan 1 */}
                <div className="bg-brand-container border border-white/5 p-8 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-brand-text-muted uppercase tracking-wider">CREATOR BASE</span>
                    <h4 className="font-display text-3xl text-white font-bold mt-1 mb-4">Flat Escrow Fee</h4>
                    <p className="text-sm text-brand-text-muted leading-relaxed mb-6">
                      For independent session artists, MDs, and engineers looking to secure payments using the SideQuests trust protocol.
                    </p>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-5xl font-extrabold text-white">4%</span>
                      <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider">of contract budget</span>
                    </div>

                    <ul className="space-y-3.5 mb-8 border-t border-white/5 pt-6">
                      <li className="text-xs text-brand-text-muted flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span>Secure smart-contract escrow locks</span>
                      </li>
                      <li className="text-xs text-brand-text-muted flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span>High-fidelity lossless WAV file transfers</span>
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
                      For power-user studios, record labels, and premier touring musicians demanding instant booking and white-glove disputes.
                    </p>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="font-display text-5xl font-extrabold text-white">$49</span>
                      <span className="text-xs text-brand-text-muted font-mono uppercase tracking-wider">/ month</span>
                    </div>

                    <ul className="space-y-3.5 mb-8 border-t border-white/5 pt-6">
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">1.8% reduced escrow transaction fee</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">Unlimited gig files storage (lossless ADM BWF)</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">Priority 1-hour fast-track booking matchmaker</span>
                      </li>
                      <li className="text-xs text-white flex items-center gap-2">
                        <Verified className="w-4 h-4 text-brand-volt flex-shrink-0" />
                        <span className="font-medium">Direct live support chat with mediation team</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => showToast('Checkout simulator activated! Collective Pro enabled.', 'success')}
                    className="w-full bg-brand-volt text-brand-bg font-sans font-extrabold text-xs py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-brand-volt/10 glow-btn"
                  >
                    Upgrade to Collective Pro
                  </button>
                </div>

              </div>

              {/* Escrow Budget Calculator */}
              <div className="bg-brand-container border border-white/5 p-8 rounded-2xl max-w-2xl mx-auto">
                <h4 className="font-display text-xl text-white font-bold mb-2">Escrow Fee Estimator</h4>
                <p className="text-xs text-brand-text-muted leading-relaxed mb-6">
                  Input your projected music production gig budget to view the standard SideQuests trust protection fee and compare layouts.
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

          {/* TASKS / MUSIC GIG OPERATING SYSTEM CONSOLE VIEW */}
          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
              
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl md:text-3xl text-white font-semibold flex items-center gap-2">
                    <TaskAlt className="w-7 h-7 text-brand-volt" />
                    OS Console
                  </h3>
                  <p className="text-brand-text-muted text-xs mt-1">Active trust contracts, live file sync, and milestones release authorization</p>
                </div>
                
                {/* Role Switcher */}
                <div className="flex bg-brand-container border border-white/10 p-1 rounded-xl w-fit">
                  <button 
                    onClick={() => {
                      setTaskViewRole('artist');
                      // Auto pick first artist task if present
                      const artistT = tasks.find(t => t.role === 'artist');
                      if (artistT) setActiveTaskId(artistT.id);
                    }}
                    className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-all ${
                      taskViewRole === 'artist' 
                        ? 'bg-brand-volt text-brand-bg font-bold' 
                        : 'text-brand-text-muted hover:text-white'
                    }`}
                  >
                    My Gigs (Artist)
                  </button>
                  <button 
                    onClick={() => {
                      setTaskViewRole('client');
                      // Auto pick first client task if present
                      const clientT = tasks.find(t => t.role === 'client');
                      if (clientT) setActiveTaskId(clientT.id);
                    }}
                    className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-all ${
                      taskViewRole === 'client' 
                        ? 'bg-brand-volt text-brand-bg font-bold' 
                        : 'text-brand-text-muted hover:text-white'
                    }`}
                  >
                    My Hires (Client)
                  </button>
                </div>
              </div>

              {/* Split layout: sidebar tasks list + active workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Sidebar list of contracts */}
                <div className="lg:col-span-4 space-y-3">
                  <span className="font-mono text-[10px] text-brand-text-muted uppercase tracking-widest font-semibold block mb-2">Contracts list</span>
                  
                  {tasks.filter(t => t.role === taskViewRole).length === 0 ? (
                    <div className="bg-brand-container border border-white/5 p-6 rounded-2xl text-center">
                      <p className="text-xs text-brand-text-muted">No active contracts in this view.</p>
                      {taskViewRole === 'artist' ? (
                        <button onClick={() => scrollToQuests()} className="text-brand-volt text-xs font-semibold font-mono mt-3 uppercase hover:underline">Apply to a Quest</button>
                      ) : (
                        <button onClick={() => setActiveTab('creatives')} className="text-brand-volt text-xs font-semibold font-mono mt-3 uppercase hover:underline">Browse Vetted Creatives</button>
                      )}
                    </div>
                  ) : (
                    tasks
                      .filter(t => t.role === taskViewRole)
                      .map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setActiveTaskId(task.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            task.id === activeTaskId 
                              ? 'bg-brand-container-high border-brand-volt/30 shadow-lg shadow-brand-volt/5' 
                              : 'bg-brand-container border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider bg-brand-volt/5 border border-brand-volt/10 px-2 py-0.5 rounded">
                              {task.category}
                            </span>
                            <span className="font-mono text-xs font-bold text-white">${task.totalBudget.toLocaleString()}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1">{task.questTitle}</h4>
                          <div className="flex justify-between items-center text-[10px] text-brand-text-muted">
                            <span>Counterparty: <span className="text-white font-medium">{task.role === 'artist' ? task.clientName : task.artistName}</span></span>
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-volt animate-pulse'}`}></span>
                              {task.status === 'completed' ? 'Done' : 'Active'}
                            </span>
                          </div>
                        </button>
                      ))
                  )}
                </div>

                {/* Main operational panel */}
                {activeTask && activeTask.role === taskViewRole ? (
                  <div className="lg:col-span-8 bg-brand-container border border-white/5 rounded-2xl p-6">
                    
                    {/* Header summary info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5 mb-6">
                      <div>
                        <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider block mb-1">TRUST ESCROW REGISTERED</span>
                        <h4 className="font-display text-xl text-white font-bold leading-tight">{activeTask.questTitle}</h4>
                        <p className="text-xs text-brand-text-muted mt-1">
                          {activeTask.role === 'artist' ? `Contract with ${activeTask.clientName}` : `Contracting ${activeTask.artistName}`}
                        </p>
                      </div>

                      {/* Escrow specs */}
                      <div className="flex gap-4 bg-brand-bg border border-white/5 p-3 rounded-xl font-mono text-[11px]">
                        <div>
                          <span className="text-brand-text-muted block">Locked in Escrow</span>
                          <span className="text-brand-volt font-bold text-sm">${activeTask.escrowBalance.toLocaleString()}</span>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div>
                          <span className="text-brand-text-muted block">Released Funds</span>
                          <span className="text-white font-bold text-sm">${activeTask.releasedAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational tabs layout inside Workspace */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left half: Milestones tracker */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-mono text-[10px] text-brand-text-muted uppercase tracking-widest font-semibold">Milestones Roadmap</h5>
                          <span className="font-mono text-[9px] text-brand-volt bg-brand-volt/5 border border-brand-volt/10 px-2 py-0.5 rounded">
                            Phase {activeTask.currentMilestoneIndex + 1} of {activeTask.milestones.length}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {activeTask.milestones.map((milestone, idx) => {
                            const isCurrent = idx === activeTask.currentMilestoneIndex;
                            const isReleased = milestone.status === 'released';
                            const isSubmitted = milestone.status === 'submitted';

                            return (
                              <div 
                                key={milestone.id}
                                className={`p-4 rounded-xl border transition-all ${
                                  isCurrent && activeTask.status !== 'completed'
                                    ? 'bg-brand-volt/5 border-brand-volt/30'
                                    : isReleased
                                    ? 'bg-white/[0.01] border-white/5 opacity-60'
                                    : 'bg-brand-bg border-white/5'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <h6 className="text-xs font-semibold text-white">{milestone.title}</h6>
                                  <span className="font-mono text-xs font-bold text-white">${milestone.amount.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center justify-between pt-1 text-[10px]">
                                  <span className="font-mono text-brand-text-muted">
                                    Status: {' '}
                                    <span className={
                                      isReleased ? 'text-emerald-400' : isSubmitted ? 'text-blue-400' : 'text-brand-volt'
                                    }>
                                      {isReleased ? 'RELEASED' : isSubmitted ? 'SUBMITTED / PENDING' : 'SECURED IN ESCROW'}
                                    </span>
                                  </span>

                                  {/* Action Buttons based on role */}
                                  {activeTask.role === 'client' && isSubmitted && (
                                    <button
                                      onClick={() => handleReleaseEscrow(activeTask.id, milestone.id)}
                                      className="bg-brand-volt text-brand-bg font-sans font-bold px-3 py-1 rounded hover:scale-105 active:scale-95 transition-all"
                                    >
                                      Release ${milestone.amount.toLocaleString()}
                                    </button>
                                  )}

                                  {activeTask.role === 'artist' && isCurrent && !isSubmitted && !isReleased && (
                                    <span className="text-[9px] font-mono text-brand-volt uppercase tracking-wider animate-pulse">
                                      Upload Deliverable to Submit
                                    </span>
                                  )}
                                </div>

                                {isSubmitted && milestone.submittedFileName && (
                                  <div className="mt-3 bg-brand-bg p-2 rounded border border-white/10 flex items-center justify-between text-xs">
                                    <span className="text-white line-clamp-1">{milestone.submittedFileName}</span>
                                    {milestone.submittedFile && (
                                      <button 
                                        onClick={() => {
                                          setIsPlaying(!isPlaying);
                                          showToast(isPlaying ? 'Mock playback paused' : 'Mock playback started!', 'info');
                                        }}
                                        className="text-brand-volt hover:underline flex items-center gap-1 font-semibold"
                                      >
                                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <PlayArrow className="w-3.5 h-3.5" />}
                                        {isPlaying ? 'Pause' : 'Review'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right half: Files and Messages */}
                      <div className="space-y-6">
                        
                        {/* Audio Player (Mock waveform of review) */}
                        {isPlaying && (
                          <div className="bg-brand-bg border border-brand-volt/20 p-4 rounded-xl">
                            <span className="font-mono text-[8px] text-brand-volt uppercase block tracking-wider mb-2 animate-pulse">ACTIVE REVIEW AUDIO TRACK</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setIsPlaying(false)} className="w-8 h-8 rounded-full bg-brand-volt flex items-center justify-center text-brand-bg">
                                <Pause className="w-4 h-4" />
                              </button>
                              <div className="flex-1">
                                <span className="text-xs text-white block font-semibold truncate">Reviewing rough stems mix.mp3</span>
                                <div className="h-1 bg-white/10 rounded-full mt-2 relative overflow-hidden">
                                  <div style={{ width: `${playbackProgress}%` }} className="absolute h-full bg-brand-volt shadow-[0_0_10px_rgba(195,244,0,0.8)]"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Files Synchronization Manager */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-mono text-[10px] text-brand-text-muted uppercase tracking-widest font-semibold">Files Locker</h5>
                            
                            {/* File upload selector */}
                            <label className="text-brand-volt hover:text-white transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1 font-mono uppercase tracking-wider">
                              <AttachFile className="w-3.5 h-3.5" />
                              Add File
                              <input 
                                type="file" 
                                accept="audio/*,application/zip" 
                                className="hidden" 
                                onChange={handleFileUploadSimulate}
                                disabled={isUploading}
                              />
                            </label>
                          </div>

                          {isUploading && (
                            <div className="bg-brand-container-high p-3 rounded-xl border border-brand-volt/20 mb-3 text-xs">
                              <span className="text-brand-volt font-mono font-bold block mb-1">Uploading and phase aligning... {uploadProgress}%</span>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div style={{ width: `${uploadProgress}%` }} className="h-full bg-brand-volt transition-all"></div>
                              </div>
                            </div>
                          )}

                          {activeTask.files.length === 0 ? (
                            <div className="p-6 border border-dashed border-white/10 rounded-xl text-center bg-brand-bg/50">
                              <FileUpload className="w-6 h-6 text-brand-text-muted mx-auto mb-2" />
                              <p className="text-[11px] text-brand-text-muted leading-normal">
                                Drop stems, rough tracks, or ADM BWF masters. Uploading automatically submits the current milestone.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {activeTask.files.map((f) => (
                                <div key={f.id} className="p-2.5 bg-brand-bg border border-white/5 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 truncate">
                                    <FolderZip className="w-4 h-4 text-brand-volt flex-shrink-0" />
                                    <div className="truncate">
                                      <span className="text-white block font-medium truncate">{f.name}</span>
                                      <span className="text-[9px] text-brand-text-muted font-mono">{f.size} • By {f.uploadedBy === 'artist' ? 'Artist' : 'Client'}</span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setIsPlaying(true);
                                      showToast(`Streaming ${f.name}`, 'info');
                                    }}
                                    className="p-1 hover:text-brand-volt text-brand-text-muted transition-colors"
                                    aria-label="Play track"
                                  >
                                    <PlayArrow className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Interactive Message Chat */}
                        <div>
                          <h5 className="font-mono text-[10px] text-brand-text-muted uppercase tracking-widest font-semibold mb-3">Live Session Chat</h5>
                          
                          <div className="bg-brand-bg border border-white/5 rounded-xl flex flex-col h-60">
                            {/* Messages display */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-52">
                              {activeTask.messages.map((m) => {
                                const isMe = m.sender === activeTask.role;
                                return (
                                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                                      isMe 
                                        ? 'bg-brand-volt text-brand-bg font-medium rounded-tr-none' 
                                        : 'bg-brand-container border border-white/10 text-white rounded-tl-none'
                                    }`}>
                                      <p className="leading-normal">{m.text}</p>
                                    </div>
                                    <span className="text-[8px] text-brand-text-muted font-mono mt-0.5 px-1">{m.time}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSendMessage} className="p-2 border-t border-white/5 flex gap-1.5 bg-brand-container-high/40 rounded-b-xl">
                              <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Message session counterparty..."
                                className="flex-1 bg-transparent text-xs text-white focus:outline-none px-2 py-1 placeholder:text-brand-text-muted"
                              />
                              <button type="submit" className="p-1.5 bg-brand-volt hover:scale-105 active:scale-95 transition-all text-brand-bg rounded-lg">
                                <Send className="w-3.5 h-3.5 text-brand-bg" />
                              </button>
                            </form>
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="lg:col-span-8 bg-brand-container border border-white/5 rounded-2xl p-12 text-center">
                    <Checklist className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
                    <h4 className="text-lg text-white font-bold font-display mb-2">No Active Contract Selected</h4>
                    <p className="text-xs text-brand-text-muted max-w-sm mx-auto mb-6">
                      Toggle roles above or select one of your ongoing smart-contract gigs on the left to review tracks, write messages, and release escrow milestones.
                    </p>
                    {taskViewRole === 'artist' ? (
                      <button onClick={() => scrollToQuests()} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-3 rounded-xl hover:scale-105 transition-all">
                        Apply to Open Quests
                      </button>
                    ) : (
                      <button onClick={() => setActiveTab('creatives')} className="bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-3 rounded-xl hover:scale-105 transition-all">
                        Browse Elite Creatives
                      </button>
                    )}
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* PROFILE VIEW & CREATOR ROUTE */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
              {isEditingProfile ? (
                <ProfileCreator
                  currentProfile={userProfile}
                  onSaveProfile={handleSaveUserProfile}
                  onCancel={() => setIsEditingProfile(false)}
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
                  onOpenCreateQuestModal={() => setIsPostQuestModalOpen(true)}
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
              The high-fidelity professional network and operating system for the global music infrastructure. Handcrafted by audio veterans.
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
              <li><button onClick={() => showToast('About SideQuests: Vetted gig networks for audio.', 'info')} className="hover:text-brand-volt transition-colors">About Us</button></li>
              <li><button onClick={() => showToast('Trust protocol and active secure escrow.', 'info')} className="hover:text-brand-volt transition-colors">Trust & Safety</button></li>
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
          <span>HANDCRAFTED FOR THE AUDIO ELITE</span>
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
                <img className="w-24 h-24 rounded-2xl object-cover border border-white/10" src={selectedCreative.avatarUrl} alt={selectedCreative.name} referrerPolicy="no-referrer" />
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
                    <h5 className="font-mono text-[10px] text-brand-volt uppercase tracking-widest block mb-2.5 font-bold">Verified Credits</h5>
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
                    <h5 className="font-mono text-[10px] text-brand-volt uppercase tracking-widest block mb-2.5 font-bold">Hardware & DAW Spec</h5>
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
                    setHiringCreative(selectedCreative);
                    setHireBudget('1500');
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
                  <img className="w-12 h-12 rounded-xl object-cover border border-white/10" src={selectedQuest.clientAvatar} alt={selectedQuest.clientName} referrerPolicy="no-referrer" />
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
                  <span className="font-mono text-[9px] text-brand-volt uppercase tracking-wider block mb-2">ROADMAP MILESTONES (ESCROW SECURED)</span>
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
                    handleApplyQuest(selectedQuest);
                    setSelectedQuest(null);
                  }}
                  className={`font-sans text-xs font-bold px-6 py-2 rounded-lg transition-all ${
                    selectedQuest.applied 
                      ? 'bg-brand-container-high text-brand-text-muted border border-white/10 cursor-not-allowed'
                      : 'bg-brand-volt text-brand-bg hover:scale-102 active:scale-95 shadow-md shadow-brand-volt/10'
                  }`}
                  disabled={selectedQuest.applied}
                >
                  {selectedQuest.applied ? 'Applied' : 'Apply & Fund Escrow'}
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

      {/* Hire & Lock Escrow custom modal */}
      <AnimatePresence>
        {hiringCreative && (
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
              className="bg-brand-container border border-white/10 rounded-2xl max-w-md w-full p-6 relative"
            >
              <button 
                onClick={() => setHiringCreative(null)}
                className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <Close className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <h4 className="font-display text-xl text-white font-bold mb-1">Fund Escrow Session</h4>
                <p className="text-xs text-brand-text-muted">Hire <span className="text-white font-semibold">{hiringCreative.name}</span> instantly. Funds are securely held until you approve the milestones.</p>
              </div>

              <form onSubmit={handleCreateCustomHire} className="space-y-4 text-xs">
                <div>
                  <label className="font-mono text-[9px] text-brand-text-muted uppercase tracking-wider block mb-1.5 font-bold">Session / Project Title</label>
                  <input 
                    type="text" 
                    required
                    value={hireTitle}
                    onChange={(e) => setHireTitle(e.target.value)}
                    placeholder="e.g. Master Vocals for Synth Wave Single"
                    className="w-full bg-brand-bg border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-brand-volt focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[9px] text-brand-text-muted uppercase tracking-wider block mb-1.5 font-bold">Total Budget ($)</label>
                    <input 
                      type="number" 
                      required
                      value={hireBudget}
                      onChange={(e) => setHireBudget(e.target.value)}
                      placeholder="1500"
                      className="w-full bg-brand-bg border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:border-brand-volt focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[9px] text-brand-text-muted uppercase tracking-wider block mb-1.5 font-bold">Milestones Roadmaps</label>
                    <select
                      value={hireMilestoneCount}
                      onChange={(e) => setHireMilestoneCount(e.target.value)}
                      className="w-full bg-brand-bg border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-brand-volt focus:outline-none"
                    >
                      <option value="1">1 Milestone (100%)</option>
                      <option value="2">2 Milestones (50/50)</option>
                      <option value="3">3 Milestones (30/40/30)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] text-brand-text-muted uppercase tracking-wider block mb-1.5 font-bold">Brief Session Brief & Deliverable Instructions</label>
                  <textarea 
                    rows={3}
                    value={hireDescription}
                    onChange={(e) => setHireDescription(e.target.value)}
                    placeholder="Describe exactly what files you expect and details..."
                    className="w-full bg-brand-bg border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-brand-volt focus:outline-none resize-none"
                  />
                </div>

                {/* Secure warning info */}
                <div className="bg-brand-volt/5 p-3 rounded-lg border border-brand-volt/10 text-[10px] text-brand-text-muted flex items-start gap-2 leading-relaxed">
                  <Shield className="w-4 h-4 text-brand-volt flex-shrink-0 mt-0.5" />
                  <span>
                    Securing funds deposits them in the SideQuests secure trust escrow locker. Funds will ONLY be released when you approve deliverables inside the OS console.
                  </span>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setHiringCreative(null)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-brand-volt text-brand-bg font-sans font-bold px-5 py-2 rounded-lg hover:scale-102 active:scale-95 transition-all text-xs"
                  >
                    Deposit & Lock Escrow
                  </button>
                </div>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
