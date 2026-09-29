/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryOption, UserProfile } from './types';

export const ARTIST_CATEGORIES: CategoryOption[] = [
  // Music & Audio
  { id: 'cat_music_production', name: 'Music Production', group: 'Music & Audio', description: 'Beats, arrangements and full productions across genres' },
  { id: 'cat_stereo_mix', name: 'Mixing & Mastering', group: 'Music & Audio', description: 'Release-ready mixes, masters and stem deliveries' },
  { id: 'cat_session_musician', name: 'Session Musician', group: 'Music & Audio', description: 'Studio and live instrumental performance' },
  { id: 'cat_vocalist', name: 'Vocalist & Songwriter', group: 'Music & Audio', description: 'Lead and backing vocals, toplines and lyrics' },
  { id: 'cat_composer', name: 'Composer (Film, Game & Ads)', group: 'Music & Audio', description: 'Original scores, jingles and sonic branding' },
  { id: 'cat_sound_design', name: 'Sound Design & Podcast Editing', group: 'Music & Audio', description: 'SFX, audio post-production and podcast editing' },
  { id: 'cat_dj', name: 'DJ', group: 'Music & Audio', description: 'Club, private, brand and wedding DJ sets' },
  { id: 'cat_foh_live_sound', name: 'Live Sound Engineer', group: 'Music & Audio', description: 'Front-of-house, monitors and event audio' },
  // Photo & Video
  { id: 'cat_photo_portrait', name: 'Portrait & Event Photography', group: 'Photo & Video', description: 'Headshots, weddings, parties and live events' },
  { id: 'cat_photo_product', name: 'Product & Commercial Photography', group: 'Photo & Video', description: 'E-commerce, food, fashion and brand campaigns' },
  { id: 'cat_videography', name: 'Videography', group: 'Photo & Video', description: 'Shooting brand films, events, music videos and interviews' },
  { id: 'cat_video_editing', name: 'Video Editing', group: 'Photo & Video', description: 'Short-form, long-form, YouTube and ad edits' },
  { id: 'cat_motion', name: 'Motion Graphics & Animation', group: 'Photo & Video', description: '2D/3D animation, titles and explainer videos' },
  { id: 'cat_color_drone', name: 'Colour Grading & Drone', group: 'Photo & Video', description: 'Colour correction, grading and aerial footage' },
  // Design & Illustration
  { id: 'cat_brand_design', name: 'Brand & Graphic Design', group: 'Design & Illustration', description: 'Logos, identities, packaging and print' },
  { id: 'cat_illustration', name: 'Illustration', group: 'Design & Illustration', description: 'Editorial, book, character and merch illustration' },
  { id: 'cat_uiux', name: 'UI/UX & Web Design', group: 'Design & Illustration', description: 'App and website design, prototypes and design systems' },
  { id: 'cat_3d', name: '3D & CGI', group: 'Design & Illustration', description: '3D modelling, product renders and visualisation' },
  { id: 'cat_fine_art', name: 'Fine Art & Murals', group: 'Design & Illustration', description: 'Commissions, murals and live painting' },
  // Writing & Content
  { id: 'cat_copywriting', name: 'Copywriting', group: 'Writing & Content', description: 'Ads, websites, emails and brand voice' },
  { id: 'cat_scriptwriting', name: 'Scriptwriting', group: 'Writing & Content', description: 'Scripts for video, film, podcasts and ads' },
  { id: 'cat_social_media', name: 'Social Media Management', group: 'Writing & Content', description: 'Content calendars, posting and community' },
  { id: 'cat_ugc', name: 'UGC & Content Creation', group: 'Writing & Content', description: 'Creator-style videos and photos for brands' },
  { id: 'cat_editing', name: 'Editing & Proofreading', group: 'Writing & Content', description: 'Books, articles, scripts and marketing copy' },
  // Performance & Events
  { id: 'cat_actor', name: 'Acting', group: 'Performance & Events', description: 'Film, commercial, theatre and brand content roles' },
  { id: 'cat_dancer', name: 'Dance & Choreography', group: 'Performance & Events', description: 'Performers and choreographers for shows and videos' },
  { id: 'cat_host', name: 'Host & MC', group: 'Performance & Events', description: 'Event hosting, presenting and livestreams' },
  { id: 'cat_voice', name: 'Voice Acting & Voiceover', group: 'Performance & Events', description: 'Commercials, animation, audiobooks and e-learning' },
  { id: 'cat_model', name: 'Modelling', group: 'Performance & Events', description: 'Fashion, commercial and brand shoots' },
  { id: 'cat_live_performer', name: 'Live Entertainment', group: 'Performance & Events', description: 'Comedians, magicians, bands and roaming acts' },
  // Fashion & Beauty
  { id: 'cat_makeup', name: 'Makeup Artistry', group: 'Fashion & Beauty', description: 'Bridal, editorial, film and SFX makeup' },
  { id: 'cat_hair', name: 'Hair Styling', group: 'Fashion & Beauty', description: 'Editorial, bridal and on-set hair' },
  { id: 'cat_wardrobe', name: 'Wardrobe Styling', group: 'Fashion & Beauty', description: 'Styling for shoots, shows, events and talent' },
  { id: 'cat_fashion_design', name: 'Fashion Design & Tailoring', group: 'Fashion & Beauty', description: 'Custom pieces, costumes and alterations' }
];

export const PROVIDER_CATEGORIES: CategoryOption[] = [
  // Brands & Businesses
  { id: 'prov_brand_campaign', name: 'Brand Campaigns', group: 'Brands & Businesses', description: 'Photo, video and design for launches and campaigns' },
  { id: 'prov_social_content', name: 'Social & UGC Content', group: 'Brands & Businesses', description: 'Ongoing content for social channels and ads' },
  { id: 'prov_small_business', name: 'Small Business Marketing', group: 'Brands & Businesses', description: 'Logos, websites, menus, product photos' },
  { id: 'prov_ecommerce', name: 'E-commerce & Product', group: 'Brands & Businesses', description: 'Product photography, listings and packaging' },
  // Media & Entertainment
  { id: 'prov_film_tv', name: 'Film, TV & Streaming', group: 'Media & Entertainment', description: 'Crew, cast, post-production and scoring' },
  { id: 'prov_music_release', name: 'Music Releases & Tours', group: 'Media & Entertainment', description: 'Producers, musicians, videos and artwork' },
  { id: 'prov_podcast', name: 'Podcasts & YouTube', group: 'Media & Entertainment', description: 'Editing, thumbnails, scripts and hosting' },
  { id: 'prov_games', name: 'Games & Interactive', group: 'Media & Entertainment', description: 'Art, animation, audio and voice' },
  { id: 'prov_publishing', name: 'Publishing', group: 'Media & Entertainment', description: 'Illustration, editing and cover design' },
  // Events
  { id: 'prov_weddings', name: 'Weddings & Private Events', group: 'Events', description: 'Photographers, DJs, makeup and entertainment' },
  { id: 'prov_corporate', name: 'Corporate Events', group: 'Events', description: 'Hosts, AV, photo/video and performers' },
  { id: 'prov_festivals', name: 'Concerts & Festivals', group: 'Events', description: 'Performers, crew and event content' },
  // Agencies & Studios
  { id: 'prov_agency_overflow', name: 'Agency Overflow', group: 'Agencies & Studios', description: 'Freelancers to extend your in-house team' },
  { id: 'prov_production_company', name: 'Production Company Crew', group: 'Agencies & Studios', description: 'Shoot days, crew and post-production' }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: '',
  accountType: 'artist',
  displayName: '',
  handle: '',
  roleHeadline: '',
  bio: '',
  location: '',
  avatarUrl: '',
  selectedCategories: [],
  credits: [],
  gear: [],
  createdAt: ''
};
