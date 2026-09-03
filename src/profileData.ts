/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryOption, UserProfile } from './types';

export const ARTIST_CATEGORIES: CategoryOption[] = [
  // Audio Engineering & Post
  {
    id: 'cat_dolby_atmos',
    name: 'Dolby Atmos & Spatial Mix',
    group: 'Audio Engineering & Post',
    description: '7.1.4 immersive audio and spatial binaural rendering for Apple Music & Tidal'
  },
  {
    id: 'cat_stereo_mix',
    name: 'Stereo Mixing & Analog Summing',
    group: 'Audio Engineering & Post',
    description: 'High-end console mixing, dynamic separation, and balanced master bus processing'
  },
  {
    id: 'cat_mastering',
    name: 'Mastering & Stem Delivery',
    group: 'Audio Engineering & Post',
    description: 'Precision loudness optimization, dynamic range control, and DDP/streaming delivery'
  },
  {
    id: 'cat_vocal_tuning',
    name: 'Vocal Tuning & Processing',
    group: 'Audio Engineering & Post',
    description: 'Melodyne pitch correction, VocAlign phase alignment, and layered vocal chains'
  },
  {
    id: 'cat_foh_live_sound',
    name: 'Live Sound & FOH Engineer',
    group: 'Audio Engineering & Post',
    description: 'Front of House mixing, d&b/L-Acoustics system tuning, and wireless RF coordination'
  },
  {
    id: 'cat_tracking_eng',
    name: 'Studio Tracking Engineer',
    group: 'Audio Engineering & Post',
    description: 'Multi-mic drum tracking, preamp gain-staging, and high-fidelity live room recording'
  },

  // Music Production
  {
    id: 'cat_hiphop_prod',
    name: 'Hip-Hop & Trap Production',
    group: 'Music Production',
    description: 'Punchy 808s, rhythmic drum programming, sample flipping, and modern beats'
  },
  {
    id: 'cat_pop_rnb',
    name: 'Pop & Modern R&B',
    group: 'Music Production',
    description: 'Lush chord voicing, acoustic-electronic hybrid arrangements, and radio-ready sound'
  },
  {
    id: 'cat_electronic_edm',
    name: 'Electronic / EDM / Synthwave',
    group: 'Music Production',
    description: 'Serum/Vital sound design, modular synthesis, drops, and club-tailored sound'
  },
  {
    id: 'cat_cinematic_score',
    name: 'Cinematic & Orchestral Score',
    group: 'Music Production',
    description: 'Hollywood-grade string libraries, brass dynamics, trailer cues, and film themes'
  },
  {
    id: 'cat_afrobeat_global',
    name: 'Afrobeat & Global Grooves',
    group: 'Music Production',
    description: 'Polyrhythmic percussion, highlife guitar riffs, log drums, and syncopated grooves'
  },
  {
    id: 'cat_indie_rock',
    name: 'Indie Rock & Alternative',
    group: 'Music Production',
    description: 'Live guitar textures, fuzz pedals, dynamic drum performances, and raw energy'
  },

  // Live Performance & Touring
  {
    id: 'cat_music_director',
    name: 'Music Director (MD)',
    group: 'Live Performance & Touring',
    description: 'Arranging live tour sets, band transitions, click/cue stems, and stage direction'
  },
  {
    id: 'cat_keys_synth',
    name: 'Session Keys & Synth Player',
    group: 'Live Performance & Touring',
    description: 'Prophet/Nord/MainStage performance, piano improvisation, and vocoder patches'
  },
  {
    id: 'cat_drums_percussion',
    name: 'Touring Drummer & Hybrid Kit',
    group: 'Live Performance & Touring',
    description: 'Roland SPD-SX sample triggering, solid pocket groove, and click-track precision'
  },
  {
    id: 'cat_bass_synthbass',
    name: 'Bass Guitar & Synth Bass',
    group: 'Live Performance & Touring',
    description: 'Moog Minitaur sub-bass, 5-string slap & fingerstyle, and in-ear monitoring lock'
  },
  {
    id: 'cat_guitarist',
    name: 'Lead & Rhythm Guitarist',
    group: 'Live Performance & Touring',
    description: 'Quad Cortex / Helix amp modeling, acoustic fingerpicking, and solo virtuosity'
  },
  {
    id: 'cat_playback_eng',
    name: 'Playback & Ableton Rig Tech',
    group: 'Live Performance & Touring',
    description: 'Redundant dual PlayAUDIO12 systems, SMPTE timecode sync, and MIDI patch automation'
  },

  // Songwriting & Arranging
  {
    id: 'cat_toplining',
    name: 'Toplining & Melodic Hooks',
    group: 'Songwriting & Arranging',
    description: 'Catchy vocal melodies, chorus hooks, and memorable phrasing for chart records'
  },
  {
    id: 'cat_lyric_writing',
    name: 'Lyric Writing & Polish',
    group: 'Songwriting & Arranging',
    description: 'Storytelling, emotional resonance, rhyming schemes, and concept development'
  },
  {
    id: 'cat_string_horn_arr',
    name: 'String & Horn Section Arranging',
    group: 'Songwriting & Arranging',
    description: 'Score notation, voicing distributions, and conductor sheet preparation'
  }
];

export const PROVIDER_CATEGORIES: CategoryOption[] = [
  // Live & Touring
  {
    id: 'prov_arena_tour',
    name: 'Arena & Stadium Tours',
    group: 'Live & Touring Productions',
    description: 'Seeking verified touring band members, FOH engineers, and playback operators'
  },
  {
    id: 'prov_festival_stage',
    name: 'Festival & Headline Bookings',
    group: 'Live & Touring Productions',
    description: 'Contracting session talent, live backing vocalists, and musical directors'
  },
  {
    id: 'prov_club_theater',
    name: 'Club & Theater Tours',
    group: 'Live & Touring Productions',
    description: 'Mid-scale touring packages, tour managers, and multi-instrumentalists'
  },

  // Record Labels & Studio Releases
  {
    id: 'prov_major_label',
    name: 'Major Label Album Releases',
    group: 'Studio & Commercial Releases',
    description: 'Commercial mix engineers, Dolby Atmos specialists, and platinum producers'
  },
  {
    id: 'prov_indie_ep',
    name: 'Indie Artist EP / Single Rollout',
    group: 'Studio & Commercial Releases',
    description: 'End-to-end production, acoustic tracking, and budget-friendly polish'
  },
  {
    id: 'prov_remote_mixing',
    name: 'Remote Stem Mixing & Mastering',
    group: 'Studio & Commercial Releases',
    description: 'Fast-turnaround mix revisions, analog hardware summing, and stem deliverable packs'
  },

  // Sync, Media & Game Audio
  {
    id: 'prov_game_audio',
    name: 'Video Game Soundtrack & SFX',
    group: 'Sync, Film & Game Audio',
    description: 'Interactive audio layers, adaptive combat themes, and Foley sound design'
  },
  {
    id: 'prov_film_doc',
    name: 'Film, TV & Documentary Scoring',
    group: 'Sync, Film & Game Audio',
    description: 'Orchestral composition, emotion-driven cues, and quick director revision cycles'
  },
  {
    id: 'prov_commercial_brand',
    name: 'Commercial & Brand Sonic Identity',
    group: 'Sync, Film & Game Audio',
    description: 'Bespoke mnemonic audio logos, 30s ad scoring, and social media sound assets'
  },

  // Technical Operations & Playback
  {
    id: 'prov_playback_ops',
    name: 'Redundant Playback Systems',
    group: 'Technical Operations',
    description: 'Hiring PlayAUDIO12/Ableton live rigs and timecode automation engineers'
  },
  {
    id: 'prov_vocal_tuning_stems',
    name: 'Vocal Stem Pitch & Time Correction',
    group: 'Technical Operations',
    description: 'High-volume Melodyne / VocAlign editing for recording artists'
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user_default',
  accountType: 'artist',
  displayName: 'Devon Thorne',
  handle: '@devonthorne',
  roleHeadline: 'Live Music Director & Dolby Atmos Mix Engineer',
  bio: 'Touring MD and Atmos mix specialist with 8+ years behind the console. Touring with major pop & electronic acts, running fail-safe redundant playback rigs and hybrid synth setups.',
  location: 'Nashville, TN / Los Angeles, CA',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=400&fit=crop',
  selectedCategories: [
    'cat_dolby_atmos',
    'cat_stereo_mix',
    'cat_music_director',
    'cat_keys_synth',
    'cat_playback_eng'
  ],
  hourlyRate: 135,
  credits: [
    'Music Director - Neon Horizons US Tour (2025)',
    'Dolby Atmos Mix - Solaris EP (Over 40M Streams)',
    'Keyboardist & Playback - Live Red Rocks Amphitheatre'
  ],
  gear: [
    'Nord Stage 4 + Sequential Take 5',
    'iConnectivity PlayAUDIO12 Dual Redundant Rig',
    'Genelec 8330A 7.1.4 Atmos Setup',
    'UAD Apollo x16 & Neve 1073 Preamp'
  ],
  experienceLevel: 'tour_veteran',
  availability: 'available',
  portfolioLinks: {
    spotify: 'https://open.spotify.com/artist/example',
    soundcloud: 'https://soundcloud.com/example',
    instagram: 'https://instagram.com/example'
  },
  createdAt: '2026-01-15'
};
