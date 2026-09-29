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
  
  // Gig Provider specific
  organizationName?: string;
  orgType?: string;
  budgetTier?: 'tier_under_5k' | 'tier_5k_25k' | 'tier_25k_100k' | 'tier_100k_plus';
  verifiedEscrowFunded?: boolean;
  activeQuestsCount?: number;
  hiringGoals?: string[];

  /** Set only by a SideQuests admin, never by the user. */
  verified?: boolean;
  createdAt: string;
}

