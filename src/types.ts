/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GigCategory } from './categories';
export type { GigCategory } from './categories';

export interface Creative {
  id: string;
  name: string;
  /** The creative vertical this person mainly works in. */
  role: GigCategory;
  roleLabel: string;
  avatarUrl: string;
  bio: string;
  verified: boolean;
  rating: number;
  tags: string[];
  credits: string[];
  gear: string[];
  hourlyRate: number;
  location: string;
  verifiedCreditsCount: number;
  socialLinks?: SocialLink[];
  proofItems?: ProofItem[];
}

export interface Quest {
  id: string;
  title: string;
  clientUid?: string;
  clientName: string;
  clientAvatar: string;
  category: GigCategory;
  budget: number;
  deadline: string;
  description: string;
  requirements: string[];
  milestones: {
    id: string;
    title: string;
    amount: number;
    status: 'escrowed' | 'submitted' | 'released';
  }[];
  status: 'open' | 'active' | 'completed';
  applied?: boolean;
  hiredUid?: string;
  createdAt?: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'declined';

export interface Application {
  id: string;
  questId: string;
  questTitle: string;
  clientUid: string;
  applicantUid: string;
  applicantName: string;
  applicantAvatar?: string;
  applicantHeadline?: string;
  proposalText: string;
  bidAmount: number;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Task {
  id: string;
  questId: string;
  questTitle: string;
  clientName: string;
  artistName: string;
  category: string;
  totalBudget: number;
  escrowBalance: number;
  releasedAmount: number;
  status: 'active' | 'completed';
  role: 'artist' | 'client';
  currentMilestoneIndex: number;
  milestones: {
    id: string;
    title: string;
    amount: number;
    status: 'escrowed' | 'submitted' | 'released';
    submittedFile?: string;
    submittedFileName?: string;
    submittedAt?: string;
  }[];
  messages: {
    id: string;
    sender: 'artist' | 'client';
    text: string;
    time: string;
  }[];
  files: {
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    uploadedBy: 'artist' | 'client';
    url: string;
  }[];
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  author: string;
  authorRole: string;
  summary: string;
  content: string[];
  image: string;
}

export type AccountType = 'artist' | 'provider';

export interface CategoryOption {
  id: string;
  name: string;
  group: string;
  description: string;
  iconName?: string;
}

export type SocialPlatform =
  | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'linkedin' | 'behance' | 'soundcloud' | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  /** Username for social platforms, full https URL for 'website'. */
  handle: string;
}

export interface ProofItem {
  id: string;
  type: 'image' | 'video';
  /** Download URL in our Storage bucket. */
  url: string;
  /** Storage path: users/{uid}/proof/{id}.{ext} */
  path: string;
  caption: string;
  skill: string;
  durationSec?: number;
  isCover?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  accountType: AccountType;
  displayName: string;
  handle: string;
  roleHeadline: string;
  bio: string;
  location: string;
  avatarUrl: string;
  selectedCategories: string[];
  
  // Artist specific
  hourlyRate?: number;
  credits?: string[];
  gear?: string[];
  experienceLevel?: 'emerging' | 'intermediate' | 'tour_veteran' | 'grammy_platinum';
  availability?: 'available' | 'booked_soon' | 'tour_only' | 'remote_only';
  portfolioLinks?: {
    spotify?: string;
    soundcloud?: string;
    instagram?: string;
    website?: string;
  };
  /** Social accounts shown as buttons on the profile (any account type). */
  socialLinks?: SocialLink[];
  /** Photos and short videos that prove the creative's skills (max 8). */
  proofItems?: ProofItem[];
  
  // Gig Provider specific
  organizationName?: string;
  orgType?: string;
  budgetTier?: 'tier_under_5k' | 'tier_5k_25k' | 'tier_25k_100k' | 'tier_100k_plus';
  verifiedEscrowFunded?: boolean;
  activeQuestsCount?: number;
  hiringGoals?: string[];

  /** Set only by a SideQuests admin, never by the user. */
  verified?: boolean;
  /** Set by the server once Stripe payouts are ready (creatives). */
  payoutsReady?: boolean;
  createdAt: string;
}


// ---------------------------------------------------------------------------
// Contracts (created when a gig provider hires a creative)
// ---------------------------------------------------------------------------

/**
 * setup     – gig provider is editing the milestones
 * proposed  – terms sent, waiting for the creative to accept
 * awaiting_payment – creative accepted; gig provider pays via Stripe (server activates)
 * active    – work in progress
 * completed – every milestone approved
 * cancelled – called off before work started
 */
export type ContractStatus = 'setup' | 'proposed' | 'awaiting_payment' | 'active' | 'completed' | 'cancelled';

export interface Contract {
  id: string;
  questId: string;
  questTitle: string;
  category: string;
  clientUid: string;
  clientName: string;
  clientAvatar?: string;
  creativeUid: string;
  creativeName: string;
  creativeAvatar?: string;
  participants: string[];
  totalAmount: number;
  status: ContractStatus;
  changeRequest?: string;
  /** Set by the server (Stripe) only. */
  paymentStatus?: 'processing' | 'paid' | 'failed' | 'needs_review';
  fundedAmountCents?: number;
  feeAmountCents?: number;
  releasedAmountCents?: number;
  /** 'creative_total' (current): 3% of the total, deducted from the final payout. Older: 'creative' (3% per payout), 'provider' (paid on top). */
  feeModel?: 'creative_total' | 'creative' | 'provider';
  platformFeesCents?: number;
  /** Set by the server: when the contract was marked complete. */
  completedAt?: string;
  /** Set by the server: uids that have left a review for this contract. */
  reviewedBy?: string[];
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageBy?: string;
}

export type MilestoneStatus = 'pending' | 'submitted' | 'changes_requested' | 'approved';

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  order: number;
  status: MilestoneStatus;
  submissionNote?: string;
  submittedAt?: string;
  feedback?: string;
  reviewedAt?: string;
  /** Set by the server when the milestone's money is released. */
  transferId?: string;
  paidAt?: string;
  /** Set by the server: what the creative received and the fee kept. */
  payoutCents?: number;
  feeCents?: number;
  /** How many times the gig provider asked for changes. */
  revisionCount?: number;
}

export interface ContractFile {
  name: string;
  size: number;
  contentType: string;
  path: string;
}

export interface ContractMessage {
  id: string;
  senderUid: string;
  senderName: string;
  type: 'text' | 'file' | 'system';
  text: string;
  file?: ContractFile;
  createdAt: Date | null;
}


// ---------------------------------------------------------------------------
// Reviews and track record (written by the server only)
// ---------------------------------------------------------------------------

export type ReviewerRole = 'provider' | 'creative';

export interface Review {
  id: string;
  contractId: string;
  questTitle: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerAvatar?: string;
  /** Role of the person writing the review. */
  reviewerRole: ReviewerRole;
  revieweeUid: string;
  overall: number;
  categories: Record<string, number>;
  tags: string[];
  note: string;
  wouldWorkAgain: boolean;
  createdAt: string;
  released: boolean;
  releasedAt?: string;
}

export type TrackLevel = 'New' | 'Rising' | 'Trusted' | 'Top rated';

export interface RoleStats {
  completedContracts: number;
  ratingAvg: number | null;
  ratingCount: number;
  categoryAvgs: Record<string, number>;
  tagCounts: Record<string, number>;
  wouldWorkAgainPct: number | null;
  /** Creatives: distinct clients who hired them more than once. Providers: creatives they rehired. */
  repeatPartners: number;
  distinctPartners: number;
  avgRevisionRounds: number | null;
  /** Providers only: average hours from submission to approval. */
  avgApprovalHours: number | null;
  level: TrackLevel;
  badges: { id: string; name: string; rule: string }[];
}

export interface PublicStats {
  asCreative?: RoleStats;
  asProvider?: RoleStats;
  updatedAt: string;
}
