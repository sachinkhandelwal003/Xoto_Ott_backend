/**
 * In-memory mock data store for local development.
 * Used when MongoDB is not connected.
 * Replace all data here with real MongoDB queries in production.
 */

import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockContent {
  id: string;
  title: string;
  type: 'movie' | 'series';
  description: string | null;
  thumbnail: string | null;
  bannerImage: string | null;
  genres: string[];
  year: number | null;
  rating: string | null;
  status: 'published' | 'draft' | 'processing' | 'moderation' | 'rejected';
  hlsUrl: string | null;
  videoQualities?: Array<{
    quality: '144p' | '360p' | '480p' | '720p' | '1080p';
    url: string;
    size: number;
  }>;
  planRequired: 'free' | 'basic' | 'standard' | 'premium';
  duration: number | null;
  views: number;
  isNewContent: boolean;
  imdbRating?: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface MockEpisode {
  id: string;
  contentId: string;
  season: number;
  episode: number;
  title: string;
  description: string | null;
  hlsUrl: string | null;
  duration: number | null;
  thumbnail: string | null;
  views: number;
  createdAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  subscriptionPlan: 'free' | 'basic' | 'standard' | 'premium';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'expired';
  status: 'active' | 'banned';
  banReason: string | null;
  watchlistCount: number;
  totalWatchTime: number;
  createdAt: string;
  lastLogin: string | null;
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  contentCount: number;
}

export interface MockActivity {
  id: string;
  type: 'user_signup' | 'content_uploaded' | 'content_published' | 'stream_started' | 'subscription_changed';
  message: string;
  createdAt: string;
  meta: Record<string, unknown>;
}

export interface MockAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'moderator';
  password: string; // plaintext for dev only — use bcrypt in production
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

let contents: MockContent[] = [
  {
    id: 'c1', title: 'Neon Prophecy', type: 'movie',
    description: 'In a dystopian megacity, a rogue detective uncovers a conspiracy threatening the last free city on Earth.',
    thumbnail: 'https://picsum.photos/seed/neon-prophecy/300/450',
    bannerImage: 'https://picsum.photos/seed/neon-prophecy-banner/1920/1080',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    year: 2024, rating: 'TV-MA', status: 'published',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
      { quality: '480p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 409600 },
      { quality: '720p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 819200 },
      { quality: '1080p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 1638400 },
    ],
    planRequired: 'basic',
    duration: 7560, views: 1847293, isNewContent: true, imdbRating: 8.2,
    createdAt: daysAgo(90), updatedAt: daysAgo(85),
  },
  {
    id: 'c2', title: 'The Last Heist', type: 'movie',
    description: 'A legendary thief comes out of retirement for one final job that goes catastrophically wrong.',
    thumbnail: 'https://picsum.photos/seed/last-heist/300/450',
    bannerImage: 'https://picsum.photos/seed/last-heist-banner/1920/1080',
    genres: ['Crime', 'Thriller'],
    year: 2024, rating: 'TV-14', status: 'published',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', size: 98765 },
      { quality: '360p', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', size: 197530 },
      { quality: '480p', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', size: 395060 },
      { quality: '720p', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', size: 790120 },
      { quality: '1080p', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', size: 1580240 },
    ],
    planRequired: 'premium',
    duration: 6840, views: 2341120, isNewContent: true, imdbRating: 7.5,
    createdAt: daysAgo(60), updatedAt: daysAgo(55),
  },
  {
    id: 'c3', title: 'Echoes of Tomorrow', type: 'movie',
    description: 'A quantum physicist accidentally fragments the timeline and must repair reality before it collapses.',
    thumbnail: 'https://picsum.photos/seed/echoes-tomorrow/300/450',
    bannerImage: 'https://picsum.photos/seed/echoes-tomorrow-banner/1920/1080',
    genres: ['Sci-Fi', 'Drama'],
    year: 2024, rating: 'PG-13', status: 'published',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
      { quality: '480p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 409600 },
    ],
    planRequired: 'free',
    duration: 8100, views: 1234, isNewContent: true, imdbRating: 6.8,
    createdAt: daysAgo(14), updatedAt: daysAgo(2),
  },
  {
    id: 'c4', title: 'Blood Protocol', type: 'movie',
    description: 'Deep inside a biotech corporation, a whistleblower discovers experiments that should never have begun.',
    thumbnail: 'https://picsum.photos/seed/blood-protocol/300/450',
    bannerImage: 'https://picsum.photos/seed/blood-protocol-banner/1920/1080',
    genres: ['Horror', 'Thriller'],
    year: 2023, rating: 'TV-MA', status: 'published',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
      { quality: '480p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 409600 },
      { quality: '720p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 819200 },
    ],
    planRequired: 'standard',
    duration: 5940, views: 987456, isNewContent: false, imdbRating: 7.1,
    createdAt: daysAgo(180), updatedAt: daysAgo(175),
  },
  {
    id: 'c5', title: 'Coastal Dreams', type: 'movie',
    description: 'Two strangers meet at a small coastal town and discover their lives are more intertwined than chance.',
    thumbnail: 'https://picsum.photos/seed/coastal-dreams/300/450',
    bannerImage: 'https://picsum.photos/seed/coastal-dreams-banner/1920/1080',
    genres: ['Romance', 'Drama'],
    year: 2024, rating: 'PG-13', status: 'published',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
    ],
    planRequired: 'free',
    duration: 5400, views: 45678, isNewContent: true, imdbRating: 6.2,
    createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
  {
    id: 'c6', title: 'Grid Zero', type: 'series',
    description: 'An elite cyber-response unit battles a shadowy hacker collective threatening to bring down global infrastructure.',
    thumbnail: 'https://picsum.photos/seed/grid-zero/300/450',
    bannerImage: 'https://picsum.photos/seed/grid-zero-banner/1920/1080',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    year: 2024, rating: 'TV-MA', status: 'published',
    hlsUrl: null,
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
      { quality: '480p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 409600 },
      { quality: '720p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 819200 },
      { quality: '1080p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 1638400 },
    ],
    planRequired: 'premium',
    duration: null, views: 4521037, isNewContent: true, imdbRating: 8.7,
    createdAt: daysAgo(120), updatedAt: daysAgo(7),
  },
  {
    id: 'c7', title: 'The Frontier', type: 'series',
    description: 'Stranded colonists on Mars fight for survival as rescue missions repeatedly fail.',
    thumbnail: 'https://picsum.photos/seed/frontier/300/450',
    bannerImage: 'https://picsum.photos/seed/frontier-banner/1920/1080',
    genres: ['Sci-Fi', 'Drama'],
    year: 2023, rating: 'TV-14', status: 'published',
    hlsUrl: null,
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
      { quality: '480p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 409600 },
      { quality: '720p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 819200 },
    ],
    planRequired: 'standard',
    duration: null, views: 3128440, isNewContent: false, imdbRating: 7.9,
    createdAt: daysAgo(365), updatedAt: daysAgo(30),
  },
  {
    id: 'c8', title: 'Dark Inheritance', type: 'series',
    description: 'A family of lawyers unravels a decades-long criminal conspiracy hidden within their own firm.',
    thumbnail: 'https://picsum.photos/seed/dark-inheritance/300/450',
    bannerImage: 'https://picsum.photos/seed/dark-inheritance-banner/1920/1080',
    genres: ['Crime', 'Drama'],
    year: 2024, rating: 'TV-MA', status: 'published',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    videoQualities: [
      { quality: '144p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 102400 },
      { quality: '360p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', size: 204800 },
    ],
    planRequired: 'basic',
    duration: 2700, views: 5678, isNewContent: true, imdbRating: 7.3,
    createdAt: daysAgo(7), updatedAt: daysAgo(1),
  },
];

let episodes: MockEpisode[] = [
  // Grid Zero — Season 1
  { id: 'e1', contentId: 'c6', season: 1, episode: 1, title: 'Zero Day', description: 'The team is assembled.', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2700, thumbnail: 'https://picsum.photos/seed/grid-zero-e1/300/450', views: 1204330, createdAt: daysAgo(120) },
  { id: 'e2', contentId: 'c6', season: 1, episode: 2, title: 'The Phantom Signal', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2580, thumbnail: 'https://picsum.photos/seed/grid-zero-e2/300/450', views: 1187290, createdAt: daysAgo(113) },
  { id: 'e3', contentId: 'c6', season: 1, episode: 3, title: 'Dark Nodes', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2640, thumbnail: 'https://picsum.photos/seed/grid-zero-e3/300/450', views: 1098470, createdAt: daysAgo(106) },
  { id: 'e4', contentId: 'c6', season: 1, episode: 4, title: 'Ghost Protocol', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2700, thumbnail: 'https://picsum.photos/seed/grid-zero-e4/300/450', views: 1030947, createdAt: daysAgo(99) },
  // Grid Zero — Season 2
  { id: 'e5', contentId: 'c6', season: 2, episode: 1, title: 'Reboot', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2880, thumbnail: 'https://picsum.photos/seed/grid-zero-e5/300/450', views: 876230, createdAt: daysAgo(30) },
  { id: 'e6', contentId: 'c6', season: 2, episode: 2, title: 'Distributed', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2760, thumbnail: 'https://picsum.photos/seed/grid-zero-e6/300/450', views: 823410, createdAt: daysAgo(23) },
  // The Frontier — Season 1
  { id: 'e7', contentId: 'c7', season: 1, episode: 1, title: 'Red Dust', description: 'The colony receives no response.', hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 3000, thumbnail: 'https://picsum.photos/seed/frontier-e1/300/450', views: 948220, createdAt: daysAgo(365) },
  { id: 'e8', contentId: 'c7', season: 1, episode: 2, title: 'Oxygen', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2820, thumbnail: 'https://picsum.photos/seed/frontier-e2/300/450', views: 914500, createdAt: daysAgo(358) },
  { id: 'e9', contentId: 'c7', season: 1, episode: 3, title: 'The Long Night', description: null, hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', duration: 2940, thumbnail: 'https://picsum.photos/seed/frontier-e3/300/450', views: 882370, createdAt: daysAgo(351) },
];

let users: MockUser[] = [
  { id: 'u1', email: 'alice@example.com', name: 'Alice Chen', avatar: null, subscriptionPlan: 'premium', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 47, totalWatchTime: 84600, createdAt: daysAgo(365), lastLogin: daysAgo(1) },
  { id: 'u2', email: 'bob@example.com', name: 'Bob Martinez', avatar: null, subscriptionPlan: 'standard', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 23, totalWatchTime: 36000, createdAt: daysAgo(180), lastLogin: daysAgo(3) },
  { id: 'u3', email: 'carol@example.com', name: 'Carol White', avatar: null, subscriptionPlan: 'basic', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 12, totalWatchTime: 18000, createdAt: daysAgo(90), lastLogin: daysAgo(7) },
  { id: 'u4', email: 'david@example.com', name: 'David Kim', avatar: null, subscriptionPlan: 'premium', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 61, totalWatchTime: 126000, createdAt: daysAgo(730), lastLogin: daysAgo(0) },
  { id: 'u5', email: 'eve@example.com', name: 'Eve Johnson', avatar: null, subscriptionPlan: 'free', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 5, totalWatchTime: 7200, createdAt: daysAgo(14), lastLogin: daysAgo(2) },
  { id: 'u6', email: 'frank@example.com', name: 'Frank Thompson', avatar: null, subscriptionPlan: 'standard', subscriptionStatus: 'cancelled', status: 'active', banReason: null, watchlistCount: 18, totalWatchTime: 28800, createdAt: daysAgo(200), lastLogin: daysAgo(30) },
  { id: 'u7', email: 'grace@example.com', name: 'Grace Liu', avatar: null, subscriptionPlan: 'premium', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 34, totalWatchTime: 72000, createdAt: daysAgo(120), lastLogin: daysAgo(1) },
  { id: 'u8', email: 'henry@example.com', name: 'Henry Brown', avatar: null, subscriptionPlan: 'basic', subscriptionStatus: 'expired', status: 'active', banReason: null, watchlistCount: 8, totalWatchTime: 12600, createdAt: daysAgo(60), lastLogin: daysAgo(15) },
  { id: 'u9', email: 'isla@example.com', name: 'Isla Rivera', avatar: null, subscriptionPlan: 'free', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 3, totalWatchTime: 3600, createdAt: daysAgo(5), lastLogin: daysAgo(1) },
  { id: 'u10', email: 'james@example.com', name: 'James Walker', avatar: null, subscriptionPlan: 'standard', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 29, totalWatchTime: 54000, createdAt: daysAgo(300), lastLogin: daysAgo(0) },
  { id: 'u11', email: 'kate@example.com', name: 'Kate Patel', avatar: null, subscriptionPlan: 'premium', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 52, totalWatchTime: 108000, createdAt: daysAgo(500), lastLogin: daysAgo(2) },
  { id: 'u12', email: 'liam@example.com', name: 'Liam Scott', avatar: null, subscriptionPlan: 'free', subscriptionStatus: 'active', status: 'active', banReason: null, watchlistCount: 2, totalWatchTime: 1800, createdAt: daysAgo(2), lastLogin: daysAgo(0) },
];

let categories: MockCategory[] = [
  { id: 'cat1', name: 'Action', slug: 'action', contentCount: 18 },
  { id: 'cat2', name: 'Drama', slug: 'drama', contentCount: 24 },
  { id: 'cat3', name: 'Sci-Fi', slug: 'sci-fi', contentCount: 16 },
  { id: 'cat4', name: 'Thriller', slug: 'thriller', contentCount: 21 },
  { id: 'cat5', name: 'Comedy', slug: 'comedy', contentCount: 11 },
  { id: 'cat6', name: 'Horror', slug: 'horror', contentCount: 9 },
  { id: 'cat7', name: 'Romance', slug: 'romance', contentCount: 7 },
  { id: 'cat8', name: 'Crime', slug: 'crime', contentCount: 14 },
  { id: 'cat9', name: 'Documentary', slug: 'documentary', contentCount: 6 },
];

const activities: MockActivity[] = [
  { id: 'a1', type: 'user_signup', message: 'Liam Scott joined with a free plan', createdAt: daysAgo(0), meta: { userId: 'u12' } },
  { id: 'a2', type: 'stream_started', message: 'Grid Zero S2E2 streaming started — 847 active viewers', createdAt: daysAgo(0), meta: { contentId: 'c6' } },
  { id: 'a3', type: 'content_uploaded', message: 'Coastal Dreams uploaded — processing pending', createdAt: daysAgo(1), meta: { contentId: 'c5' } },
  { id: 'a4', type: 'subscription_changed', message: 'Frank Thompson cancelled Standard subscription', createdAt: daysAgo(1), meta: { userId: 'u6' } },
  { id: 'a5', type: 'user_signup', message: 'Isla Rivera joined with a free plan', createdAt: daysAgo(2), meta: { userId: 'u9' } },
  { id: 'a6', type: 'content_published', message: 'Grid Zero S2E2 published successfully', createdAt: daysAgo(2), meta: { contentId: 'c6' } },
  { id: 'a7', type: 'stream_started', message: 'Neon Prophecy streaming started — 1,204 active viewers', createdAt: daysAgo(2), meta: { contentId: 'c1' } },
  { id: 'a8', type: 'user_signup', message: 'Kate Patel upgraded to Premium plan', createdAt: daysAgo(3), meta: { userId: 'u11' } },
  { id: 'a9', type: 'content_uploaded', message: 'Dark Inheritance Season 1 drafts uploaded', createdAt: daysAgo(4), meta: { contentId: 'c8' } },
  { id: 'a10', type: 'stream_started', message: 'The Frontier S1E1 streaming started — 634 active viewers', createdAt: daysAgo(4), meta: { contentId: 'c7' } },
  { id: 'a11', type: 'subscription_changed', message: 'Alice Chen renewed Premium plan', createdAt: daysAgo(5), meta: { userId: 'u1' } },
  { id: 'a12', type: 'content_published', message: 'The Last Heist approved and published', createdAt: daysAgo(5), meta: { contentId: 'c2' } },
  { id: 'a13', type: 'user_signup', message: 'Eve Johnson joined with a free plan', createdAt: daysAgo(7), meta: { userId: 'u5' } },
  { id: 'a14', type: 'stream_started', message: 'The Last Heist streaming started — 2,047 active viewers', createdAt: daysAgo(7), meta: { contentId: 'c2' } },
  { id: 'a15', type: 'content_uploaded', message: 'Echoes of Tomorrow master file uploaded', createdAt: daysAgo(8), meta: { contentId: 'c3' } },
];

// Dev admin accounts (plaintext passwords — FOR LOCAL DEVELOPMENT ONLY)
export const adminUsers: MockAdminUser[] = [
  { id: 'admin-1', email: 'admin@streamvault.com', name: 'StreamVault Admin', role: 'superadmin', password: 'admin123' },
  { id: 'admin-2', email: 'editor@streamvault.com', name: 'Content Editor', role: 'moderator', password: 'editor123' },
];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

// Content
export function getAllContent(filters: {
  type?: string; status?: string; genre?: string; search?: string; page?: number; limit?: number;
}) {
  let items = [...contents];
  if (filters.type) items = items.filter(c => c.type === filters.type);
  if (filters.status) items = items.filter(c => c.status === filters.status);
  if (filters.genre) items = items.filter(c => c.genres.includes(filters.genre!));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(c => c.title.toLowerCase().includes(q));
  }
  const total = items.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  return { items: items.slice(offset, offset + limit), total, page, limit };
}

export function getContentById(id: string): MockContent | undefined {
  return contents.find(c => c.id === id);
}

export function createContent(data: Partial<MockContent>): MockContent {
  const item: MockContent = {
    id: uuidv4(),
    title: data.title ?? 'Untitled',
    type: (data.type as MockContent['type']) ?? 'movie',
    description: data.description ?? null,
    thumbnail: data.thumbnail ?? null,
    bannerImage: data.bannerImage ?? null,
    genres: data.genres ?? [],
    year: data.year ?? null,
    rating: data.rating ?? null,
    status: (data.status as MockContent['status']) ?? 'draft',
    hlsUrl: data.hlsUrl ?? null,
    videoQualities: data.videoQualities ?? [],
    planRequired: data.planRequired ?? 'free',
    duration: data.duration ?? null,
    views: 0,
    isNewContent: data.isNewContent ?? true,
    imdbRating: data.imdbRating,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  contents.push(item);
  return item;
}

export function updateContent(id: string, data: Partial<MockContent>): MockContent | undefined {
  const idx = contents.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  contents[idx] = { ...contents[idx], ...data, updatedAt: new Date().toISOString() };
  return contents[idx];
}

export function deleteContent(id: string): boolean {
  const idx = contents.findIndex(c => c.id === id);
  if (idx === -1) return false;
  contents.splice(idx, 1);
  return true;
}

// Episodes
export function getEpisodesForContent(contentId: string): MockEpisode[] {
  return episodes.filter(e => e.contentId === contentId);
}

export function createEpisode(contentId: string, data: Partial<MockEpisode>): MockEpisode {
  const ep: MockEpisode = {
    id: uuidv4(),
    contentId,
    season: data.season ?? 1,
    episode: data.episode ?? 1,
    title: data.title ?? 'Episode',
    description: data.description ?? null,
    hlsUrl: data.hlsUrl ?? null,
    duration: data.duration ?? null,
    thumbnail: data.thumbnail ?? null,
    views: 0,
    createdAt: new Date().toISOString(),
  };
  episodes.push(ep);
  return ep;
}

export function updateEpisode(id: string, data: Partial<MockEpisode>): MockEpisode | undefined {
  const idx = episodes.findIndex(e => e.id === id);
  if (idx === -1) return undefined;
  episodes[idx] = { ...episodes[idx], ...data };
  return episodes[idx];
}

export function deleteEpisode(id: string): boolean {
  const idx = episodes.findIndex(e => e.id === id);
  if (idx === -1) return false;
  episodes.splice(idx, 1);
  return true;
}

// Users
export function getAllUsers(filters: {
  search?: string; plan?: string; page?: number; limit?: number;
}) {
  let items = [...users];
  if (filters.plan) items = items.filter(u => u.subscriptionPlan === filters.plan);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const total = items.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  return { items: items.slice(offset, offset + limit), total, page, limit };
}

export function getUserById(id: string): MockUser | undefined {
  return users.find(u => u.id === id);
}

export function updateUser(id: string, data: Partial<MockUser>): MockUser | undefined {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return undefined;
  users[idx] = { ...users[idx], ...data };
  return users[idx];
}

export function deleteUser(id: string): boolean {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
}

// Categories
export function getAllCategories(): MockCategory[] {
  return [...categories];
}

export function createCategory(data: { name: string; slug?: string }): MockCategory {
  const cat: MockCategory = {
    id: uuidv4(),
    name: data.name,
    slug: data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-'),
    contentCount: 0,
  };
  categories.push(cat);
  return cat;
}

export function updateCategory(id: string, data: Partial<MockCategory>): MockCategory | undefined {
  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  categories[idx] = { ...categories[idx], ...data };
  return categories[idx];
}

export function deleteCategory(id: string): boolean {
  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return false;
  categories.splice(idx, 1);
  return true;
}

// Analytics
export function getDashboardStats() {
  const subBreakdown = users.reduce(
    (acc, u) => {
      if (u.subscriptionStatus === 'active') acc[u.subscriptionPlan]++;
      return acc;
    },
    { free: 0, basic: 0, standard: 0, premium: 0 }
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const newUsersToday = users.filter(u => new Date(u.createdAt) >= today).length;
  const newContentThisWeek = contents.filter(c => new Date(c.createdAt) >= weekAgo).length;

  return {
    totalUsers: users.length,
    totalContent: contents.length,
    totalEpisodes: episodes.length,
    activeStreams: 847,
    totalViews: contents.reduce((acc, c) => acc + c.views, 0),
    newUsersToday,
    newContentThisWeek,
    subscriptionBreakdown: subBreakdown,
  };
}

export function getTopContent(limit = 10): Array<{ id: string; title: string; type: string; views: number; thumbnail: string | null }> {
  return [...contents]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map(c => ({ id: c.id, title: c.title, type: c.type, views: c.views, thumbnail: c.thumbnail }));
}

export function getRecentActivities(limit = 20): MockActivity[] {
  return [...activities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
