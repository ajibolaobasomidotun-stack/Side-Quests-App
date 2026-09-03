/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  AccountType, 
  CategoryOption 
} from '../types';
import { 
  ARTIST_CATEGORIES, 
  PROVIDER_CATEGORIES 
} from '../profileData';
import { 
  Verified, 
  VerifiedUser, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Building2, 
  Payments, 
  LocationOn, 
  FolderZip, 
  Headphones, 
  Mic, 
  Globe, 
  ArrowForward, 
  Edit3, 
  CheckCircle,
  AccountCircle
} from './Icons';

interface ProfileCreatorProps {
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onCancel?: () => void;
  initialMode?: AccountType;
  onNavigateToExplore?: () => void;
}

const AVATAR_PRESETS_ARTIST = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&h=400&fit=crop'
];

const AVATAR_PRESETS_PROVIDER = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&h=400&fit=crop'
];

export const ProfileCreator: React.FC<ProfileCreatorProps> = ({
  currentProfile,
  onSaveProfile,
  onCancel,
  initialMode,
  onNavigateToExplore
}) => {
  const [accountType, setAccountType] = useState<AccountType>(initialMode || currentProfile.accountType || 'artist');
  const [step, setStep] = useState<'type' | 'categories' | 'details' | 'preview'>('categories');

  // Form states
  const [displayName, setDisplayName] = useState(currentProfile.displayName || '');
  const [handle, setHandle] = useState(currentProfile.handle || '');
  const [roleHeadline, setRoleHeadline] = useState(currentProfile.roleHeadline || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [location, setLocation] = useState(currentProfile.location || 'Los Angeles, CA');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || AVATAR_PRESETS_ARTIST[0]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentProfile.selectedCategories || []);
  
  // Category search/filter
  const [categorySearch, setCategorySearch] = useState('');
  const [activeCategoryGroup, setActiveCategoryGroup] = useState<string>('All');

  // Artist specific states
  const [hourlyRate, setHourlyRate] = useState<number>(currentProfile.hourlyRate || 120);
  const [experienceLevel, setExperienceLevel] = useState<'emerging' | 'intermediate' | 'tour_veteran' | 'grammy_platinum'>(
    currentProfile.experienceLevel || 'tour_veteran'
  );
  const [availability, setAvailability] = useState<'available' | 'booked_soon' | 'tour_only' | 'remote_only'>(
    currentProfile.availability || 'available'
  );
  const [credits, setCredits] = useState<string[]>(
    currentProfile.credits && currentProfile.credits.length > 0 
      ? currentProfile.credits 
      : ['Music Director - US Arena Tour', 'Dolby Atmos Mix - Platinum LP', 'Session Keys - Live Festival Broadcast']
  );
  const [newCreditInput, setNewCreditInput] = useState('');
  
  const [gear, setGear] = useState<string[]>(
    currentProfile.gear && currentProfile.gear.length > 0
      ? currentProfile.gear
      : ['Nord Stage 4', 'iConnectivity PlayAUDIO12 Rig', 'UAD Apollo x8p', 'Genelec 8330A Atmos System']
  );
  const [newGearInput, setNewGearInput] = useState('');

  const [spotifyLink, setSpotifyLink] = useState(currentProfile.portfolioLinks?.spotify || '');
  const [soundcloudLink, setSoundcloudLink] = useState(currentProfile.portfolioLinks?.soundcloud || '');
  const [instagramLink, setInstagramLink] = useState(currentProfile.portfolioLinks?.instagram || '');
  const [websiteLink, setWebsiteLink] = useState(currentProfile.portfolioLinks?.website || '');

  // Gig Provider specific states
  const [organizationName, setOrganizationName] = useState(currentProfile.organizationName || 'Astral Echo Records');
  const [orgType, setOrgType] = useState<'Record Label' | 'Touring Agency' | 'Studio Facility' | 'Film / Game Audio' | 'Independent Producer' | 'Live Event Organizer'>(
    currentProfile.orgType || 'Record Label'
  );
  const [budgetTier, setBudgetTier] = useState<'tier_under_5k' | 'tier_5k_25k' | 'tier_25k_100k' | 'tier_100k_plus'>(
    currentProfile.budgetTier || 'tier_5k_25k'
  );
  const [hiringGoals, setHiringGoals] = useState<string[]>(
    currentProfile.hiringGoals || ['Hiring FOH Engineer for Fall Tour', 'Looking for Atmos Mix Engineers', 'Session Drummer needed for album']
  );
  const [newGoalInput, setNewGoalInput] = useState('');

  // Handle switching account type
  const handleTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (type === 'artist') {
      if (!avatarUrl || AVATAR_PRESETS_PROVIDER.includes(avatarUrl)) {
        setAvatarUrl(AVATAR_PRESETS_ARTIST[0]);
      }
      if (!roleHeadline || roleHeadline.includes('Executive') || roleHeadline.includes('Label')) {
        setRoleHeadline('Live Music Director & Dolby Atmos Mix Engineer');
      }
    } else {
      if (!avatarUrl || AVATAR_PRESETS_ARTIST.includes(avatarUrl)) {
        setAvatarUrl(AVATAR_PRESETS_PROVIDER[0]);
      }
      if (!roleHeadline || roleHeadline.includes('Engineer') || roleHeadline.includes('Musician')) {
        setRoleHeadline('Executive Producer & Touring Talent Director');
      }
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  // Add credit
  const handleAddCredit = () => {
    if (newCreditInput.trim()) {
      setCredits(prev => [...prev, newCreditInput.trim()]);
      setNewCreditInput('');
    }
  };

  // Remove credit
  const handleRemoveCredit = (index: number) => {
    setCredits(prev => prev.filter((_, i) => i !== index));
  };

  // Add gear
  const handleAddGear = () => {
    if (newGearInput.trim()) {
      setGear(prev => [...prev, newGearInput.trim()]);
      setNewGearInput('');
    }
  };

  // Remove gear
  const handleRemoveGear = (index: number) => {
    setGear(prev => prev.filter((_, i) => i !== index));
  };

  // Add hiring goal
  const handleAddGoal = () => {
    if (newGoalInput.trim()) {
      setHiringGoals(prev => [...prev, newGoalInput.trim()]);
      setNewGoalInput('');
    }
  };

  // Remove hiring goal
  const handleRemoveGoal = (index: number) => {
    setHiringGoals(prev => prev.filter((_, i) => i !== index));
  };

  // Submit and Save
  const handleSave = () => {
    const finalProfile: UserProfile = {
      id: currentProfile.id || `user_${Date.now()}`,
      accountType,
      displayName: displayName.trim() || (accountType === 'artist' ? 'Marcus Vane' : 'Astral Productions'),
      handle: handle.trim() ? (handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`) : '@creatives_pro',
      roleHeadline: roleHeadline.trim() || (accountType === 'artist' ? 'Audio Engineer & Music Director' : 'Executive Producer'),
      bio: bio.trim() || (accountType === 'artist' 
        ? 'Professional music director and high-fidelity mix engineer delivering stadium tours and platinum records.' 
        : 'Connecting premier talent with high-stakes tour production and label studio sessions.'),
      location: location.trim() || 'Los Angeles, CA',
      avatarUrl: avatarUrl || (accountType === 'artist' ? AVATAR_PRESETS_ARTIST[0] : AVATAR_PRESETS_PROVIDER[0]),
      selectedCategories: selectedCategories.length > 0 
        ? selectedCategories 
        : (accountType === 'artist' ? ['cat_dolby_atmos', 'cat_music_director'] : ['prov_arena_tour', 'prov_major_label']),
      
      hourlyRate: accountType === 'artist' ? Number(hourlyRate) || 120 : undefined,
      experienceLevel: accountType === 'artist' ? experienceLevel : undefined,
      availability: accountType === 'artist' ? availability : undefined,
      credits: accountType === 'artist' ? credits : undefined,
      gear: accountType === 'artist' ? gear : undefined,
      portfolioLinks: accountType === 'artist' ? {
        spotify: spotifyLink || undefined,
        soundcloud: soundcloudLink || undefined,
        instagram: instagramLink || undefined,
        website: websiteLink || undefined
      } : undefined,

      organizationName: accountType === 'provider' ? organizationName : undefined,
      orgType: accountType === 'provider' ? orgType : undefined,
      budgetTier: accountType === 'provider' ? budgetTier : undefined,
      verifiedEscrowFunded: accountType === 'provider' ? true : undefined,
      hiringGoals: accountType === 'provider' ? hiringGoals : undefined,

      createdAt: currentProfile.createdAt || new Date().toISOString().split('T')[0]
    };

    onSaveProfile(finalProfile);
  };

  const currentCategoryPool = accountType === 'artist' ? ARTIST_CATEGORIES : PROVIDER_CATEGORIES;
  
  // Unique groups for filtering
  const categoryGroups = ['All', ...Array.from(new Set(currentCategoryPool.map(c => c.group)))];

  // Filtered categories
  const filteredCategories = currentCategoryPool.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(categorySearch.toLowerCase()) || 
                          cat.description.toLowerCase().includes(categorySearch.toLowerCase());
    const matchesGroup = activeCategoryGroup === 'All' || cat.group === activeCategoryGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-6 md:py-10">
      
      {/* SECTION HEADER */}
      <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-volt/10 text-brand-volt border border-brand-volt/20 text-xs font-mono font-medium tracking-wider uppercase">
              Onboarding & Credentials
            </span>
            <span className="text-brand-text-muted text-xs font-mono">• Smart-Contract Escrow Ready</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
            Create Your <span className="text-brand-volt italic font-normal">SideQuests Profile</span>
          </h2>
          <p className="text-sm text-brand-text-muted mt-1 max-w-2xl leading-relaxed">
            Join the verified operating system for music professionals. Showcase your sound, select specialized disciplines, or contract verified audio talent.
          </p>
        </div>

        {/* Step Navigation Pill */}
        <div className="flex items-center gap-1 bg-brand-container-high/60 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setStep('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              step === 'categories'
                ? 'bg-brand-volt text-brand-bg font-bold shadow-md shadow-brand-volt/10'
                : 'text-brand-text-muted hover:text-white'
            }`}
          >
            1. Role & Categories ({selectedCategories.length})
          </button>
          <button
            onClick={() => setStep('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              step === 'details'
                ? 'bg-brand-volt text-brand-bg font-bold shadow-md shadow-brand-volt/10'
                : 'text-brand-text-muted hover:text-white'
            }`}
          >
            2. Profile Details
          </button>
          <button
            onClick={() => setStep('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              step === 'preview'
                ? 'bg-brand-volt text-brand-bg font-bold shadow-md shadow-brand-volt/10'
                : 'text-brand-text-muted hover:text-white'
            }`}
          >
            3. Live Card Preview
          </button>
        </div>
      </div>

      {/* STEP 1: ROLE SELECTION & CATEGORY SELECTION */}
      {step === 'categories' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          
          {/* ACCOUNT TYPE TOGGLE BANNER */}
          <div className="mb-8 bg-brand-container-low border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-volt/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-4 font-semibold">
              Step 1 • Choose Your Account Role
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Artist / Creative Talent */}
              <div 
                onClick={() => handleTypeChange('artist')}
                className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  accountType === 'artist'
                    ? 'bg-brand-container-high border-brand-volt shadow-lg shadow-brand-volt/5 ring-1 ring-brand-volt'
                    : 'bg-brand-container-low border-white/10 hover:border-white/20 hover:bg-brand-container-high/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      accountType === 'artist' ? 'bg-brand-volt text-brand-bg' : 'bg-white/5 text-white'
                    }`}>
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-display">Artist / Creative Talent</h4>
                      <p className="text-xs text-brand-text-muted">Audio engineers, MDs, producers & musicians</p>
                    </div>
                  </div>
                  {accountType === 'artist' && (
                    <span className="w-5 h-5 rounded-full bg-brand-volt text-brand-bg flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Apply to verified quests, get hired directly by major record labels and tour managers, and earn protected funds via milestone escrow.
                </p>
              </div>

              {/* Option 2: Gig Provider / Client / Producer */}
              <div 
                onClick={() => handleTypeChange('provider')}
                className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                  accountType === 'provider'
                    ? 'bg-brand-container-high border-brand-volt shadow-lg shadow-brand-volt/5 ring-1 ring-brand-volt'
                    : 'bg-brand-container-low border-white/10 hover:border-white/20 hover:bg-brand-container-high/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      accountType === 'provider' ? 'bg-brand-volt text-brand-bg' : 'bg-white/5 text-white'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-display">Gig Provider / Client / Label</h4>
                      <p className="text-xs text-brand-text-muted">Labels, tour directors, artists & studios</p>
                    </div>
                  </div>
                  {accountType === 'provider' && (
                    <span className="w-5 h-5 rounded-full bg-brand-volt text-brand-bg flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Post high-stakes quests, discover vetted audio veterans, manage contract milestones, and protect your budget with smart escrow lock.
                </p>
              </div>
            </div>
          </div>

          {/* CATEGORIES SELECTION BOX */}
          <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-volt" />
                  {accountType === 'artist' ? 'Select Categories That Fit Your Craft' : 'Select Categories You Regularly Hire & Contract For'}
                </h3>
                <p className="text-xs text-brand-text-muted mt-1">
                  Choose all disciplines that match your expertise. These dictate which quests and creative directories prioritize your profile.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-brand-volt bg-brand-volt/10 border border-brand-volt/20 px-3 py-1.5 rounded-lg">
                  {selectedCategories.length} Categories Selected
                </span>
                {selectedCategories.length > 0 && (
                  <button 
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-brand-text-muted hover:text-white underline font-mono"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-grow">
                <input 
                  type="text"
                  placeholder="Search categories (e.g. Dolby Atmos, MD, Synth, Hip-Hop)..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full bg-brand-container-high/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                />
              </div>

              {/* Group filter tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                {categoryGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => setActiveCategoryGroup(group)}
                    className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap font-mono transition-colors ${
                      activeCategoryGroup === group
                        ? 'bg-brand-volt/15 text-brand-volt border border-brand-volt/30 font-semibold'
                        : 'bg-brand-container-high border border-white/5 text-brand-text-muted hover:text-white'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
              {filteredCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-volt/10 border-brand-volt/60 shadow-md shadow-brand-volt/5 text-white'
                        : 'bg-brand-container-high/40 border-white/10 hover:border-white/20 hover:bg-brand-container-high text-brand-text-muted'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-sans font-semibold text-sm text-white">
                          {cat.name}
                        </span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-volt border-brand-volt text-brand-bg' : 'border-white/20 bg-black/20'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-brand-volt/80 mb-2">
                        {cat.group}
                      </span>
                      <p className="text-xs text-brand-text-muted line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Action Button */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="text-xs text-brand-text-muted">
                {selectedCategories.length === 0 ? (
                  <span className="text-amber-400">Please select at least 1 category to proceed</span>
                ) : (
                  <span>Ready for step 2!</span>
                )}
              </div>

              <button
                disabled={selectedCategories.length === 0}
                onClick={() => setStep('details')}
                className={`flex items-center gap-2 font-sans font-semibold text-xs px-6 py-3 rounded-xl transition-all ${
                  selectedCategories.length > 0
                    ? 'bg-brand-volt text-brand-bg hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-volt/10'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                Proceed to Profile Details
                <ArrowForward className="w-4 h-4" />
              </button>
            </div>

          </div>

        </motion.div>
      )}

      {/* STEP 2: PROFILE DETAILS FORM */}
      {step === 'details' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Main Form Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info Box */}
              <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
                <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3 flex items-center justify-between">
                  <span>General Information</span>
                  <span className="text-xs font-mono text-brand-volt uppercase font-normal">
                    {accountType === 'artist' ? 'Artist Account' : 'Gig Provider'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      {accountType === 'artist' ? 'Display / Artist Name' : 'Company / Organization Name'} *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={accountType === 'artist' ? 'e.g. Devon Thorne' : 'e.g. Astral Tour Management'}
                      className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Profile Handle *
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@devon_audio"
                      className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                    Professional Headline / Role *
                  </label>
                  <input
                    type="text"
                    value={roleHeadline}
                    onChange={(e) => setRoleHeadline(e.target.value)}
                    placeholder={accountType === 'artist' ? 'e.g. Live Music Director & Dolby Atmos Mix Engineer' : 'e.g. A&R Executive & Stadium Tour Producer'}
                    className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Primary Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Los Angeles, CA / Remote"
                      className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                    />
                  </div>

                  {accountType === 'artist' ? (
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                        Hourly / Project Rate ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-brand-text-muted text-sm">$</span>
                        <input
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(Number(e.target.value))}
                          placeholder="125"
                          className="w-full bg-brand-container-high border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                        Organization Type
                      </label>
                      <select
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value as any)}
                        className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                      >
                        <option value="Record Label">Record Label</option>
                        <option value="Touring Agency">Touring Agency</option>
                        <option value="Studio Facility">Studio Facility</option>
                        <option value="Film / Game Audio">Film / Game Audio</option>
                        <option value="Independent Producer">Independent Producer</option>
                        <option value="Live Event Organizer">Live Event Organizer</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                    Professional Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your experience, notable clients, sound signature, and operating approach..."
                    className="w-full bg-brand-container-high border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* ARTIST-SPECIFIC DETAILS */}
              {accountType === 'artist' && (
                <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                  <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
                    Talent Credentials & Key Gear
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                        Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value as any)}
                        className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                      >
                        <option value="emerging">Emerging Professional (1-3 yrs)</option>
                        <option value="intermediate">Mid-Level Studio / Touring (3-6 yrs)</option>
                        <option value="tour_veteran">Tour & Album Veteran (6+ yrs)</option>
                        <option value="grammy_platinum">Grammy Nominated / Platinum Credits</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                        Current Availability
                      </label>
                      <select
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value as any)}
                        className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-volt"
                      >
                        <option value="available">Available Immediately</option>
                        <option value="booked_soon">Limited Openings (Next 30 Days)</option>
                        <option value="remote_only">Remote Studio Only</option>
                        <option value="tour_only">Touring Contract Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Verified Credits */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Verified Credits & Notable Projects ({credits.length})
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCreditInput}
                        onChange={(e) => setNewCreditInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCredit())}
                        placeholder="e.g. Mix Engineer - Hyperion LP (Sony Music)"
                        className="flex-grow bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                      />
                      <button
                        onClick={handleAddCredit}
                        className="bg-white/10 hover:bg-brand-volt hover:text-brand-bg text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {credits.map((credit, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-brand-container-high/60 border border-white/5 px-3.5 py-2 rounded-xl text-xs text-white">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-volt"></span>
                            {credit}
                          </span>
                          <button
                            onClick={() => handleRemoveCredit(idx)}
                            className="text-brand-text-muted hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rig & Gear List */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Primary Rig & Studio Hardware ({gear.length})
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newGearInput}
                        onChange={(e) => setNewGearInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGear())}
                        placeholder="e.g. Sequential Prophet-6, PlayAUDIO12 Rig"
                        className="flex-grow bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                      />
                      <button
                        onClick={handleAddGear}
                        className="bg-white/10 hover:bg-brand-volt hover:text-brand-bg text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {gear.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 bg-brand-container-high border border-white/10 px-3 py-1.5 rounded-lg text-xs text-brand-text-muted">
                          {item}
                          <button onClick={() => handleRemoveGear(idx)} className="hover:text-red-400">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio links */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Streaming & Portfolio Links (Optional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={spotifyLink}
                        onChange={(e) => setSpotifyLink(e.target.value)}
                        placeholder="Spotify Artist URL"
                        className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                      />
                      <input
                        type="text"
                        value={soundcloudLink}
                        onChange={(e) => setSoundcloudLink(e.target.value)}
                        placeholder="SoundCloud / Reel URL"
                        className="w-full bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* PROVIDER-SPECIFIC DETAILS */}
              {accountType === 'provider' && (
                <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                  <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
                    Gig Provider & Escrow Preferences
                  </h3>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Typical Project Budget Range
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'tier_under_5k', label: 'Under $5,000', sub: 'Indie & Single Stems' },
                        { id: 'tier_5k_25k', label: '$5,000 - $25,000', sub: 'EP / Club Tour' },
                        { id: 'tier_25k_100k', label: '$25k - $100k', sub: 'Major LP / Arena Tour' },
                        { id: 'tier_100k_plus', label: '$100,000+', sub: 'Stadium / Global' }
                      ].map(t => (
                        <div
                          key={t.id}
                          onClick={() => setBudgetTier(t.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                            budgetTier === t.id
                              ? 'bg-brand-volt/15 border-brand-volt text-brand-volt font-bold'
                              : 'bg-brand-container-high border-white/10 text-brand-text-muted hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-mono">{t.label}</div>
                          <div className="text-[10px] text-brand-text-muted mt-1">{t.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hiring Goals */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Current Hiring Needs & Active Openings ({hiringGoals.length})
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newGoalInput}
                        onChange={(e) => setNewGoalInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                        placeholder="e.g. Seeking FOH Audio Engineer for 2026 amphitheater tour"
                        className="flex-grow bg-brand-container-high border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt"
                      />
                      <button
                        onClick={handleAddGoal}
                        className="bg-white/10 hover:bg-brand-volt hover:text-brand-bg text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {hiringGoals.map((goal, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-brand-container-high/60 border border-white/5 px-3.5 py-2 rounded-xl text-xs text-white">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-volt"></span>
                            {goal}
                          </span>
                          <button
                            onClick={() => handleRemoveGoal(idx)}
                            className="text-brand-text-muted hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust Protocol Guarantee */}
                  <div className="bg-brand-container-high/50 border border-brand-volt/20 rounded-xl p-4 flex items-start gap-3">
                    <VerifiedUser className="w-5 h-5 text-brand-volt flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        Smart-Contract Escrow Protection Enabled
                      </h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        Gig providers fund milestones into audited digital escrow contracts. Funds are only released when audio stems and deliverables meet contractual specifications.
                      </p>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Right Col: Avatar & Selected Categories Summary */}
            <div className="space-y-6">
              
              {/* Avatar Selector Card */}
              <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-4 font-semibold">
                  Profile Avatar
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-volt/60 shadow-lg shadow-brand-volt/10"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{displayName || 'Your Profile'}</div>
                    <div className="text-xs text-brand-volt font-mono">{handle || '@handle'}</div>
                  </div>
                </div>

                <div className="text-xs text-brand-text-muted mb-2 font-mono">Select Avatar Preset:</div>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {(accountType === 'artist' ? AVATAR_PRESETS_ARTIST : AVATAR_PRESETS_PROVIDER).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preset"
                      referrerPolicy="no-referrer"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        avatarUrl === url ? 'border-brand-volt scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-brand-text-muted uppercase mb-1">
                    Or paste custom Image URL:
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-brand-container-high border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-volt"
                  />
                </div>
              </div>

              {/* Selected Categories Summary Card */}
              <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted font-semibold">
                    Selected Categories ({selectedCategories.length})
                  </h3>
                  <button
                    onClick={() => setStep('categories')}
                    className="text-xs text-brand-volt hover:underline font-mono flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.map(catId => {
                    const cat = currentCategoryPool.find(c => c.id === catId);
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-volt/10 border border-brand-volt/30 text-brand-volt text-xs font-mono"
                      >
                        {cat ? cat.name : catId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 space-y-3">
                <button
                  onClick={() => setStep('preview')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-sans font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  View Network Profile Card
                  <ArrowForward className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSave}
                  className="w-full bg-brand-volt text-brand-bg hover:scale-[1.02] active:scale-95 font-sans font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-brand-volt/10 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save & Activate Profile
                </button>
              </div>

            </div>

          </div>

        </motion.div>
      )}

      {/* STEP 3: LIVE PROFILE CARD PREVIEW */}
      {step === 'preview' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          
          <div className="bg-brand-container-low border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-radial-gradient from-brand-volt/10 to-transparent pointer-events-none -mr-32 -mt-32"></div>

            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-brand-volt font-semibold">
                  Network Preview
                </span>
                <h3 className="text-2xl font-bold text-white font-display mt-1">
                  How Others See Your Profile
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('details')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Info
                </button>
                <button
                  onClick={() => setStep('categories')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-volt" />
                  Edit Categories
                </button>
              </div>
            </div>

            {/* THE PROFILE CARD DISPLAY */}
            <div className="bg-brand-container-high/90 border border-white/15 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl backdrop-blur-md relative">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-volt shadow-lg"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-brand-bg rounded-lg border border-brand-volt/40">
                      <Verified className="w-4 h-4 text-brand-volt" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold text-white font-display">{displayName || 'Unnamed Creative'}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-brand-volt/10 text-brand-volt border border-brand-volt/20 text-[10px] font-mono uppercase font-bold">
                        {accountType === 'artist' ? 'Verified Talent' : 'Gig Provider'}
                      </span>
                    </div>
                    <div className="text-xs text-brand-text-muted font-mono mt-0.5">{handle}</div>
                    <div className="text-xs text-white/90 font-medium mt-1">{roleHeadline}</div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {accountType === 'artist' ? (
                    <div>
                      <div className="text-2xl font-bold text-brand-volt font-mono">${hourlyRate}<span className="text-xs text-brand-text-muted font-normal">/hr</span></div>
                      <div className="text-[10px] font-mono text-brand-text-muted uppercase mt-0.5 flex items-center gap-1 sm:justify-end">
                        <LocationOn className="w-3 h-3" />
                        {location}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-bold text-brand-volt font-mono uppercase">{orgType}</div>
                      <div className="text-[10px] font-mono text-brand-text-muted uppercase mt-0.5">{location}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio & Categories */}
              <div className="py-6 space-y-4">
                <p className="text-xs text-brand-text-muted leading-relaxed font-sans">
                  {bio}
                </p>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted mb-2 font-semibold">
                    Core Specializations & Disciplines ({selectedCategories.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategories.map(catId => {
                      const cat = currentCategoryPool.find(c => c.id === catId);
                      return (
                        <span key={catId} className="px-2.5 py-1 rounded-lg bg-brand-volt/15 border border-brand-volt/30 text-brand-volt font-mono text-xs font-medium">
                          {cat ? cat.name : catId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {accountType === 'artist' && credits.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted mb-2 font-semibold">
                      Verified Portfolio Credits
                    </div>
                    <div className="space-y-1.5">
                      {credits.map((c, i) => (
                        <div key={i} className="text-xs text-white/90 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-volt"></span>
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {accountType === 'provider' && hiringGoals.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted mb-2 font-semibold">
                      Current Gig Needs & Open Quests
                    </div>
                    <div className="space-y-1.5">
                      {hiringGoals.map((g, i) => (
                        <div key={i} className="text-xs text-white/90 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-volt"></span>
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[10px] font-mono text-brand-text-muted uppercase">
                  Audited ID: {currentProfile.id || 'SQ-PRO-2026'} • 100% Escrow Protected
                </span>

                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto bg-brand-volt text-brand-bg font-sans font-bold text-xs px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-volt/10 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Publish & Join Network
                </button>
              </div>

            </div>

          </div>

        </motion.div>
      )}

    </div>
  );
};
