/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { photoToAvatarDataUrl, ImageError } from '../lib/image';
import { profileSocialLinks } from '../lib/social';
import { deleteProofFiles } from '../lib/proof';
import { SocialLinksEditor, ProofEditor } from './ProfileExtras';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserProfile, 
  AccountType, 
  CategoryOption,
  SocialLink,
  ProofItem
} from '../types';
import { 
  ARTIST_CATEGORIES, 
  PROVIDER_CATEGORIES 
} from '../profileData';
import { 
  Verified, 
  FileUpload,
  VerifiedUser, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Building2, 
  Payments, 
  LocationOn, 
  FolderZip, 
  Palette, 
  Mic, 
  Globe, 
  ArrowForward, 
  Edit3, 
  CheckCircle,
  AccountCircle
} from './Icons';

interface ProfileCreatorProps {
  currentProfile: UserProfile;
  /** Resolves true when the profile was saved. */
  onSaveProfile: (profile: UserProfile) => boolean | void | Promise<boolean | void>;
  /** Signed-in user's id, used for proof-of-work uploads. */
  uid?: string;
  onCancel?: () => void;
  initialMode?: AccountType;
  onNavigateToExplore?: () => void;
}

export const ProfileCreator: React.FC<ProfileCreatorProps> = ({
  currentProfile,
  onSaveProfile,
  uid,
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
  const [location, setLocation] = useState(currentProfile.location || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelected = async (file?: File | null) => {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      setAvatarUrl(await photoToAvatarDataUrl(file));
    } catch (err) {
      setPhotoError(err instanceof ImageError ? err.message : 'Could not use that photo. Please try another.');
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };
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
    currentProfile.credits || []
  );
  const [newCreditInput, setNewCreditInput] = useState('');
  
  const [gear, setGear] = useState<string[]>(
    currentProfile.gear || []
  );
  const [newGearInput, setNewGearInput] = useState('');

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => profileSocialLinks(currentProfile));
  const [proofItems, setProofItems] = useState<ProofItem[]>(currentProfile.proofItems || []);
  // Files removed in the editor are deleted only after the profile saves.
  const [removedProofPaths, setRemovedProofPaths] = useState<string[]>([]);

  // Gig Provider specific states
  const [organizationName, setOrganizationName] = useState(currentProfile.organizationName || '');
  const [orgType, setOrgType] = useState<string>(currentProfile.orgType || 'Brand / Business');
  const [budgetTier, setBudgetTier] = useState<'tier_under_5k' | 'tier_5k_25k' | 'tier_25k_100k' | 'tier_100k_plus'>(
    currentProfile.budgetTier || 'tier_5k_25k'
  );
  const [hiringGoals, setHiringGoals] = useState<string[]>(
    currentProfile.hiringGoals || []
  );
  const [newGoalInput, setNewGoalInput] = useState('');

  // Handle switching account type
  const handleTypeChange = (type: AccountType) => {
    setAccountType(type);
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
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setSaveError('Please add your name (or your business name) before publishing.');
      return;
    }
    if (selectedCategories.length === 0) {
      setSaveError('Pick at least one category so the right people can find you.');
      return;
    }
    setSaveError(null);
    const finalProfile: UserProfile = {
      id: currentProfile.id || `user_${Date.now()}`,
      accountType,
      displayName: displayName.trim(),
      handle: handle.trim() ? (handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`) : '',
      roleHeadline: roleHeadline.trim(),
      bio: bio.trim(),
      location: location.trim(),
      avatarUrl,
      selectedCategories,
      
      hourlyRate: accountType === 'artist' ? Number(hourlyRate) || 120 : undefined,
      experienceLevel: accountType === 'artist' ? experienceLevel : undefined,
      availability: accountType === 'artist' ? availability : undefined,
      credits: accountType === 'artist' ? credits : undefined,
      gear: accountType === 'artist' ? gear : undefined,
      socialLinks,
      proofItems: accountType === 'artist'
        ? proofItems.map((i) => ({ ...i, caption: i.caption.trim().slice(0, 140), isCover: !!i.isCover }))
        : currentProfile.proofItems,

      organizationName: accountType === 'provider' ? organizationName : undefined,
      orgType: accountType === 'provider' ? orgType : undefined,
      budgetTier: accountType === 'provider' ? budgetTier : undefined,
      hiringGoals: accountType === 'provider' ? hiringGoals : undefined,

      createdAt: currentProfile.createdAt || new Date().toISOString().split('T')[0]
    };

    const saved = await onSaveProfile(finalProfile);
    if (saved !== false && removedProofPaths.length) {
      const stillUsed = new Set(proofItems.map((i) => i.path));
      deleteProofFiles(removedProofPaths.filter((p) => !stillUsed.has(p)));
      setRemovedProofPaths([]);
    }
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
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
            Create Your <span className="text-brand-volt italic font-normal">SideQuests Profile</span>
          </h2>
          <p className="text-sm text-brand-text-muted mt-1 max-w-2xl leading-relaxed">
            Join the gig network for creatives. Show off your work and skills to get hired, or find creative talent for your next project.
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
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-display">Creative</h4>
                      <p className="text-xs text-brand-text-muted">Photographers, designers, musicians, writers, performers & more</p>
                    </div>
                  </div>
                  {accountType === 'artist' && (
                    <span className="w-5 h-5 rounded-full bg-brand-volt text-brand-bg flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Apply to quests, get hired by brands, agencies and clients, and get paid milestone by milestone with Protected Payments.
                </p>
              </div>

              {/* Option 2: Gig Provider */}
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
                      <h4 className="text-base font-bold text-white font-display">Gig Provider</h4>
                      <p className="text-xs text-brand-text-muted">Brands, agencies, event organizers & individuals</p>
                    </div>
                  </div>
                  {accountType === 'provider' && (
                    <span className="w-5 h-5 rounded-full bg-brand-volt text-brand-bg flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Post quests, discover creative talent, manage milestones, and protect your budget with Protected Payments.
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
                  placeholder="Search skills (e.g. photography, logo, voiceover, DJ)..."
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
                    {accountType === 'artist' ? 'Creative Account' : 'Gig Provider Account'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      {accountType === 'artist' ? 'Display Name' : 'Company / Organization Name'} *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={accountType === 'artist' ? 'e.g. Jordan Lee' : 'e.g. Bright Day Events'}
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
                      placeholder="@yourname"
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
                    placeholder={accountType === 'artist' ? 'e.g. Portrait & Brand Photographer' : 'e.g. Marketing Manager at Bright Day Events'}
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
                        {['Brand / Business', 'Creative Agency', 'Production Company', 'Record Label / Music', 'Event Organizer', 'Publisher / Media', 'Startup', 'Nonprofit', 'Individual / Private Client'].map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
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
                    placeholder="Briefly describe your experience, notable clients, style and how you like to work..."
                    className="w-full bg-brand-container-high border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* ARTIST-SPECIFIC DETAILS */}
              {accountType === 'artist' && (
                <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                  <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
                    Experience, Work & Tools
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
                        <option value="intermediate">Established (3-6 yrs)</option>
                        <option value="tour_veteran">Senior (6+ yrs)</option>
                        <option value="grammy_platinum">Award-winning / Top of field</option>
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
                        <option value="remote_only">Remote Only</option>
                        <option value="tour_only">On-location / Travel Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Verified Credits */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Credits & Notable Projects ({credits.length})
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCreditInput}
                        onChange={(e) => setNewCreditInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCredit())}
                        placeholder="e.g. Lookbook photography for Acme Apparel (2025)"
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

                  {/* Tools & Equipment List */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Tools & Equipment ({gear.length})
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newGearInput}
                        onChange={(e) => setNewGearInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGear())}
                        placeholder="e.g. Sony A7 IV, Adobe Creative Suite, Pro Tools"
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

                </div>
              )}

              {/* PROVIDER-SPECIFIC DETAILS */}
              {accountType === 'provider' && (
                <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                  <h3 className="text-base font-bold text-white font-display border-b border-white/10 pb-3">
                    Gig Provider & Payment Preferences
                  </h3>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold">
                      Typical Project Budget Range
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'tier_under_5k', label: 'Under $5,000', sub: 'Single gigs & small projects' },
                        { id: 'tier_5k_25k', label: '$5,000 - $25,000', sub: 'Campaigns & events' },
                        { id: 'tier_25k_100k', label: '$25k - $100k', sub: 'Large productions' },
                        { id: 'tier_100k_plus', label: '$100,000+', sub: 'Enterprise & ongoing' }
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
                        placeholder="e.g. Looking for a wedding photographer for June"
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
                        Protected Payments Enabled
                      </h4>
                      <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                        Gig providers pay for milestones up front with Protected Payments. Funds are only released when deliverables are approved.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />

              {accountType === 'artist' && (
                uid ? (
                  <ProofEditor
                    uid={uid}
                    items={proofItems}
                    onChange={setProofItems}
                    onRemove={(path) => setRemovedProofPaths((p) => [...p, path])}
                    skillOptions={selectedCategories.map((id) => ARTIST_CATEGORIES.find((c) => c.id === id)?.name || id)}
                  />
                ) : (
                  <p className="text-xs text-brand-text-muted">Sign in to upload proof of your work.</p>
                )
              )}

            </div>

            {/* Right Col: Avatar & Selected Categories Summary */}
            <div className="space-y-6">
              
              {/* Profile Picture Upload */}
              <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs font-mono uppercase tracking-widest text-brand-text-muted mb-4 font-semibold">
                  Profile Picture
                </h3>

                <div className="flex items-center gap-4 mb-4">
                  <Avatar src={avatarUrl} name={displayName} className="w-20 h-20 rounded-2xl border-2 border-brand-volt/60 text-2xl" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{displayName || 'Your Profile'}</div>
                    <div className="text-xs text-brand-volt font-mono truncate">{handle || '@handle'}</div>
                  </div>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoSelected(e.target.files?.[0])}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => photoInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoInputRef.current?.click(); } }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handlePhotoSelected(e.dataTransfer.files?.[0]); }}
                  className="border border-dashed border-white/20 hover:border-brand-volt/60 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <FileUpload className="w-5 h-5 text-brand-volt mx-auto mb-1.5" />
                  <p className="text-xs text-white font-semibold">
                    {photoBusy ? 'Processing…' : avatarUrl ? 'Change photo' : 'Upload a photo'}
                  </p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Click or drag an image here. JPG, PNG or HEIC, up to 15 MB.</p>
                </div>

                {avatarUrl && !photoBusy && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="mt-3 text-[11px] text-brand-text-muted hover:text-red-300 underline"
                  >
                    Remove photo
                  </button>
                )}
                {photoError && <p className="mt-2 text-xs text-red-400" role="alert">{photoError}</p>}
                <p className="mt-3 text-[10px] text-brand-text-muted leading-relaxed">
                  Use a clear photo of yourself{accountType === 'provider' ? ' or your logo' : ''}. It's cropped to a square and shown on your profile, quests and applications.
                </p>
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
                {saveError && <p className="text-xs text-red-400" role="alert">{saveError}</p>}
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
                    <Avatar src={avatarUrl} name={displayName} className="w-20 h-20 rounded-2xl border-2 border-brand-volt shadow-lg text-2xl" />
                    {currentProfile.verified && (
                      <span className="absolute -bottom-1 -right-1 p-1 bg-brand-bg rounded-lg border border-brand-volt/40">
                        <Verified className="w-4 h-4 text-brand-volt" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold text-white font-display">{displayName || 'Unnamed Creative'}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-brand-volt/10 text-brand-volt border border-brand-volt/20 text-[10px] font-mono uppercase font-bold">
                        {accountType === 'artist' ? 'Creative' : 'Gig Provider'}
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
                  {saveError ? <span className="text-red-400 normal-case">{saveError}</span> : 'Review your details, then publish.'}
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
