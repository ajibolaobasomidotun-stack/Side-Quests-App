/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Creative, Quest, Task, Article } from './types';

export const INITIAL_CREATIVES: Creative[] = [
  {
    id: 'c1',
    name: 'Marcus Vane',
    role: 'md',
    roleLabel: 'Music Director & Multi-Instrumentalist',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&fit=crop',
    bio: 'Music Director for stadium tours and high-stakes broadcast events. Specializing in live synthesizers, keyboard programming, dynamic backing track synchronization, and vocal arrangement.',
    verified: true,
    rating: 4.9,
    tags: ['Live Touring', 'Backing Tracks', 'Synth Programming', 'Band Leader'],
    credits: [
      'Music Director - Nova Echo World Tour (2025)',
      'Keyboardist - Grammys Live Band Performance (2024)',
      'Arranger - Luna Eclipse EP (Platinum)'
    ],
    gear: [
      'Sequential Prophet-6',
      'iConnectivity PlayAUDIO12 redundant playback rig',
      'Nord Stage 4',
      'UAD Apollo x8p'
    ],
    hourlyRate: 120,
    location: 'Los Angeles, CA',
    verifiedCreditsCount: 14
  },
  {
    id: 'c2',
    name: 'Elena Rostova',
    role: 'engineer',
    roleLabel: 'Dolby Atmos Mixing & Mastering Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&h=400&fit=crop',
    bio: 'Grammy-nominated mix engineer focused on Dolby Atmos immersive audio and high-fidelity mastering. Re-defining spatial sonic environments for modern electronic, ambient, and pop productions.',
    verified: true,
    rating: 5.0,
    tags: ['Dolby Atmos', 'Analog Summing', 'Stereo Mix', 'Stem Mastering'],
    credits: [
      'Mix Engineer - Hyperion Ambient LP (Grammy Nominated)',
      'Dolby Atmos Mix - Zenith Electro Pop Album',
      'Mastering Engineer - Cobalt Sounds Single (Gold)'
    ],
    gear: [
      '7.1.4 Genelec Smart Active Monitor System',
      'SSL Fusion Master Processor',
      'Dangerous Music 2-BUS+',
      'Burl Mothership DA Converter'
    ],
    hourlyRate: 150,
    location: 'London, UK',
    verifiedCreditsCount: 28
  },
  {
    id: 'c3',
    name: 'Devon Sinclair',
    role: 'producer',
    roleLabel: 'Cinematic Beatmaker & Creative Director',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop',
    bio: 'Platinum producer synthesizing dark, atmospheric trap rhythms with cinematic orchestral textures. Crafting bespoke sound design, custom sample packs, and sonic branding for global labels.',
    verified: true,
    rating: 4.8,
    tags: ['Beat Production', 'Orchestration', 'Sound Design', 'A&R Consulting'],
    credits: [
      'Producer - Midnight Eclipse LP (2x Platinum)',
      'Co-Composer - Netflix Series "The Grid"',
      'Sample Designer - Splice Exclusive Signature Series'
    ],
    gear: [
      'Moog One Polyphonic Synthesizer',
      'MPC X Special Edition',
      'Focal Trio6 Be Monitors',
      'Native Instruments Komplete Ultimate'
    ],
    hourlyRate: 95,
    location: 'Atlanta, GA',
    verifiedCreditsCount: 19
  },
  {
    id: 'c4',
    name: 'Sarah Chen',
    role: 'musician',
    roleLabel: 'Experimental Electric Violinist',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&fit=crop',
    bio: 'Session violinist merging classical training with heavy effects, loopers, and guitar amplifiers. Creating bespoke emotional string pads and high-energy solos for modern cinematic and electronic works.',
    verified: true,
    rating: 4.9,
    tags: ['Electric Violin', 'Looping', 'Swell Pads', 'Cinematic Solos'],
    credits: [
      'Lead Violinist - Echoes of Time (Orchestral Tour)',
      'Guest Artist - Neon Horizon (Cyberpunk Game OST)',
      'String Arranger - Velvet Waves Indie EP'
    ],
    gear: [
      'Bridge Lyra 5-String Electric Violin',
      'Hologram Electronics Microcosm',
      'Strymon BigSky Reverberation Pedal',
      'Kemper Profiler Stage'
    ],
    hourlyRate: 110,
    location: 'New York, NY',
    verifiedCreditsCount: 11
  }
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'Main Stage MD for Synth-Pop Arena Tour',
    clientName: 'Aether Records',
    clientAvatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=100&h=100&fit=crop',
    category: 'Live Performance',
    budget: 15000,
    deadline: 'Aug 25, 2026',
    description: 'Seeking an expert Music Director to lead synth programming, redundant playback setup, and live rehearsals for a 12-city arena tour. Must have extensive experience with iConnectivity redundant playback rigs and MIDI clock synchronization for synchronized live visual projections.',
    requirements: [
      'Minimum 5 years MD experience for global arena/theater level touring',
      'Expertise in Ableton Live 11/12 Suite & Playback redundancy systems',
      'Ability to coordinate rehearsals, schedule band members, and arrange tracks',
      'Willingness to travel for a 4-week rehearsal period in Chicago'
    ],
    milestones: [
      { id: 'm1_1', title: 'Ableton Session Prep & Track Editing', amount: 4500, status: 'escrowed' },
      { id: 'm1_2', title: '2-Week Production Rehearsals Approval', amount: 5500, status: 'escrowed' },
      { id: 'm1_3', title: 'Dress Rehearsal and Tour Boot Complete', amount: 5000, status: 'escrowed' }
    ],
    status: 'open'
  },
  {
    id: 'q2',
    title: 'Dolby Atmos Mix & Spatial Master for 10-Track Album',
    clientName: 'SOMA Collective',
    clientAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=100&h=100&fit=crop',
    category: 'Studio Sessions',
    budget: 8500,
    deadline: 'Sep 10, 2026',
    description: 'We require a top-tier certified Dolby Atmos mix engineer to remix and spatial-master our upcoming progressive-electronic album from high-quality consolidated WAV stems. Audio will be distributed on Apple Music and Tidal Spatial Audio.',
    requirements: [
      'Atmos certified studio setup (7.1.4 minimum recommended)',
      'Delivery of ADM BWF master files matching Apple Music delivery specifications',
      'Include traditional stereo fold-down and instrumental spatial passes',
      'Two revision rounds included in the budget'
    ],
    milestones: [
      { id: 'm2_1', title: 'Tracks 1-5 Initial Atmos Rough Passes', amount: 3000, status: 'escrowed' },
      { id: 'm2_2', title: 'Tracks 6-10 Initial Atmos Rough Passes', amount: 3000, status: 'escrowed' },
      { id: 'm2_3', title: 'Final ADM BWF Delivery & Quality Pass', amount: 2500, status: 'escrowed' }
    ],
    status: 'open'
  },
  {
    id: 'q3',
    title: 'Cinematic Score Composer for Indie Cyberpunk Film',
    clientName: 'Neon Dawn Studios',
    clientAvatar: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=100&h=100&fit=crop',
    category: 'Production',
    budget: 12000,
    deadline: 'Oct 05, 2026',
    description: 'We are seeking a composer to write, perform, and mix an authentic hardware-based retro-futuristic score for a 90-minute indie sci-fi movie. Think analog modular synths, distorted drum machine patterns, and emotional bowed string highlights.',
    requirements: [
      'Demonstrated portfolio of cinematic scoring or game soundtracks',
      'Ownership of hardware analog synthesizers or premium virtual models',
      'Ability to score to picture/timecodes and deliver synchronized stems',
      'Willingness to join weekly Zoom reviews with the creative director'
    ],
    milestones: [
      { id: 'm3_1', title: 'Theme Concepts & Motifs Approved', amount: 3000, status: 'escrowed' },
      { id: 'm3_2', title: 'Act I & Act II Cue Sync Drafts Complete', amount: 5000, status: 'escrowed' },
      { id: 'm3_3', title: 'Final Mix, Master & Multi-Stem Cue Delivery', amount: 4000, status: 'escrowed' }
    ],
    status: 'open'
  },
  {
    id: 'q4',
    title: 'Session Bassist for Neo-Soul EP Recording',
    clientName: 'Glass Cabin Sounds',
    clientAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=100&h=100&fit=crop',
    category: 'Live Performance',
    budget: 3200,
    deadline: 'Aug 18, 2026',
    description: 'Looking for an ultra-groovy session bassist to record high-fidelity DI and mic’d basslines for 5 neo-soul tracks. Strong rhythmic feel, ghost notes, and smooth tone are non-negotiable. Perfect intonation and premium recording chain required.',
    requirements: [
      'High-end bass collection (e.g. Vintage P-Bass, Jazz Bass)',
      'Premium recording path: Avalon U5 or Noble DI into top converters',
      'Fast turnaround: deliver initial drafts within 4 days of file sharing',
      'Include both raw DI and colored/compressed printed tracks'
    ],
    milestones: [
      { id: 'm4_1', title: 'Tracks 1-3 Bass Takes Approved', amount: 1600, status: 'escrowed' },
      { id: 'm4_2', title: 'Tracks 4-5 Bass Takes Approved', amount: 1600, status: 'escrowed' }
    ],
    status: 'open'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    questId: 'q2',
    questTitle: 'Dolby Atmos Mix & Spatial Master',
    clientName: 'SOMA Collective',
    artistName: 'Elena Rostova (You)',
    category: 'Studio Sessions',
    totalBudget: 8500,
    escrowBalance: 5500,
    releasedAmount: 3000,
    status: 'active',
    role: 'artist',
    currentMilestoneIndex: 1,
    milestones: [
      { id: 'm2_1', title: 'Tracks 1-5 Initial Atmos Rough Passes', amount: 3000, status: 'released', submittedFile: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', submittedFileName: 'SOMA_Atmos_Roughs_Trk1-5.zip', submittedAt: 'Yesterday at 4:12 PM' },
      { id: 'm2_2', title: 'Tracks 6-10 Initial Atmos Rough Passes', amount: 3000, status: 'escrowed' },
      { id: 'm2_3', title: 'Final ADM BWF Delivery & Quality Pass', amount: 2500, status: 'escrowed' }
    ],
    messages: [
      { id: 'msg1', sender: 'client', text: 'Hey Elena! We just reviewed the first batch of mixes. Absolutely unbelievable width in the overhead surrounds!', time: 'Yesterday at 5:30 PM' },
      { id: 'msg2', sender: 'artist', text: 'Thanks so much! I used some customized spatial pan-curves to pull the ambient synth washes upwards. I am currently carving out the sub frequencies on track 7.', time: 'Yesterday at 6:15 PM' },
      { id: 'msg3', sender: 'client', text: 'Amazing, can’t wait to hear tracks 6-10! Let me know as soon as you have a draft to drop.', time: 'Today at 10:10 AM' }
    ],
    files: [
      { id: 'f1', name: 'SOMA_Atmos_Roughs_Trk1-5.zip', size: '422 MB', uploadedAt: 'Yesterday at 4:12 PM', uploadedBy: 'artist', url: '#' },
      { id: 'f2', name: 'SOMA_Tracks_Stems_WAV.zip', size: '1.8 GB', uploadedAt: '3 days ago', uploadedBy: 'client', url: '#' }
    ]
  },
  {
    id: 't2',
    questId: 'custom_1',
    questTitle: 'EP Vocal Comping & Autotune Polish',
    clientName: 'You (Studio Client)',
    artistName: 'Devon Sinclair',
    category: 'Production',
    totalBudget: 2400,
    escrowBalance: 2400,
    releasedAmount: 0,
    status: 'active',
    role: 'client',
    currentMilestoneIndex: 0,
    milestones: [
      { id: 'cm_1', title: 'Track 1 & 2 vocal alignment & manual tuning', amount: 1200, status: 'escrowed' },
      { id: 'cm_2', title: 'Track 3 vocal alignment & final backing stems', amount: 1200, status: 'escrowed' }
    ],
    messages: [
      { id: 'msg4', sender: 'artist', text: 'Hey there! Just imported the dry vocal stems. Track 1 lead vocals has a lot of headphone bleed, but I am running a de-bleed filter on it.', time: 'Today at 2:22 PM' },
      { id: 'msg5', sender: 'client', text: 'Thanks Devon! Yes, we recorded in a reflective cabin. Do your magic!', time: 'Today at 2:35 PM' },
      { id: 'msg6', sender: 'artist', text: 'Just finished Track 1 comp. Let me drop the rough comp for your review. It is super smooth!', time: '10 minutes ago' }
    ],
    files: [
      { id: 'f3', name: 'Lead_Vocal_DeBled_Comp_T1.mp3', size: '12.4 MB', uploadedAt: '10 minutes ago', uploadedBy: 'artist', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: 'f4', name: 'Vocal_Session_Dry_Stems.zip', size: '280 MB', uploadedAt: '4 hours ago', uploadedBy: 'client', url: '#' }
    ]
  }
];

export const LEARN_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Mastering the Dolby Atmos Spatial Delivery Spec',
    category: 'Engineering',
    readTime: '8 min read',
    author: 'Elena Rostova',
    authorRole: 'Atmos Specialist',
    summary: 'An elite guide to channel layouts, ADM BWF file compilation, and the Apple Music loudness matching standards.',
    content: [
      'Dolby Atmos is no longer a luxury—it is rapidly becoming the mandatory delivery format for major streaming platforms. Understanding the specific constraints of spatial audio is what separates elite engineers from the rest.',
      'Unlike traditional stereo, spatial audio is object-based. You are not mixing to a left and right speaker; you are placing sonic "objects" in a three-dimensional metadata space. The Dolby Atmos Renderer then translates this position metadata on the fly depending on the listener’s speaker array or binaural headphones.',
      'Key Metric: Apple Music requires the Spatial Audio mix to measure no louder than -18 LUFS integrated. Exceeding this will result in automatic level attenuation, which can ruin your carefully balanced transient response.',
      'Always deliver an ADM BWF (Audio Definition Model Broadcast Wave Format) file containing your bed tracks (usually 7.1.2) and up to 118 audio objects with their corresponding panning metadata.'
    ],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkYCSkvhRgRQxJjhNICtlXVynwTdPvzknbZLfJNyxAkFNQXLwiUVUUEp8zsD0J4hhDtQwUItpJzg4gCeX807LNxM3QuUryLylXSHoo_ExkusKlhLGVpjxufxIJBpXZHPpGTspIzOw5UuFF7vTmaKq8XFJDdbgaras-LedG-CLIuCRKhiqGGRX-un51NUHKGrqerDzEC5zY1muIz_7Nj0wTru8KtvZ2cFXBKHdlE0MSNnu7r452dyrx'
  },
  {
    id: 'a2',
    title: 'Redundant Ableton Live Playback Rig Architecture',
    category: 'Live Performance',
    readTime: '12 min read',
    author: 'Marcus Vane',
    authorRole: 'Music Director',
    summary: 'How to build dual-system, phase-aligned failover rigs that keep stadium shows running even if a laptop dies.',
    content: [
      'In a high-stakes stadium tour, a playback failure is a catastrophic event that can cost hundreds of thousands of dollars in broadcast delay and fan disappointment. The solution is absolute playback redundancy.',
      'An elite tour rig utilizes two identical, synchronized laptops running the same Ableton Live session. Both laptops are connected to a redundant switcher like the iConnectivity PlayAUDIO12 or Radial SW8.',
      'A continuous tone—often called a "heartbeat pilot signal"—is output from Audio Out 12 of the primary laptop. If the primary laptop crashes, the switcher detects the absence of the pilot tone and instantly switches all XLR audio lines to the secondary laptop in less than 3 milliseconds.',
      'The switch is entirely seamless to the audience, the FOH mixer, and the band’s in-ear monitors. Phase-aligning both sessions is critical to prevent a sudden shift in audio phase during failover.'
    ],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvvkfMBu5pn1kAh_kAklwd4xw8YVKSTOzp9a0gte4MT8IoVjCNrqnVzc4WpTA0DQewGaqr0GA35XLEcgIVdt0DOIGKBkKsGp5pALNPfzWFIriX66evalZLPXQeYjue-6S6IV8X0AIhTF5PZF-9gSGJMInfninIj1swQIaDIbNsGP9wUaxo9I9fE-NKp8HsiWNliMeccri_ytiPw4IHKBAQD64IWmmAw0b_8wKLz2jv7rUYaoMig0Qd'
  },
  {
    id: 'a3',
    title: 'Drafting Clear Smart Escrow Gigs: A Guide',
    category: 'Business',
    readTime: '6 min read',
    author: 'SideQuests Legal',
    authorRole: 'Protocol Team',
    summary: 'Protect your creative independence and secure your session funds prior to recording a single track.',
    content: [
      'The biggest bottleneck for freelance session producers is chasing down payments. SideQuests solves this with smart-contract escrow, but success starts with how you write your contract milestones.',
      'Never agree to a contract with a single, massive 100% payout at the very end. This leads to scope creep, unlimited revision requests, and financial vulnerability.',
      'Instead, break your gig into 3 clear, objective milestones: 1) Rhythm/Concept Phase (30% escrow release), 2) Arrangement/Tracking Pass (40% escrow release), 3) Final Deliverables & Stems (30% escrow release).',
      'By securing funds in escrow before laying down the first chord, you can focus on the art knowing the financial infrastructure is locked.'
    ],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADdQ0rH3ghpBis9Juqesk8fd5Ij1NY52kSoHoDzL1JfZ-4laaASkQkkk-EXr077OP1sxn_ck29BZ4rf-jqvTuWZSt4k9AAGBcbS_cQ3c8xDl-ga6UlAI5dL8MSCCf3hVJMCzZtZmU2xQOkfNHegYgdJsygzPCgk9Abu3v7_Z9JENx7pGv9w_SSJz2GakCerDAXLKktSJnssHyWMuGi_ZRGQLFK-E93Qo77eWbeZh9L7Q1ctvZHmvRfP-1mkPcm2D73YA'
  }
];
