export enum WatchStatus {
  Watching = 'WATCHING',
  Completed = 'COMPLETED',
  PlanToWatch = 'PLAN_TO_WATCH',
  Dropped = 'DROPPED',
  Paused = 'PAUSED',
}

export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string;
}

export interface AnimeCoverImage {
  extraLarge: string;
  color: string | null;
}

export interface AnimeBase {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage | null;
  type: string | null;
  status: string | null;
}

export interface AnimeRelationEdge {
  relationType: string;
  node: AnimeBase;
}

export interface AnimeRecommendationNode {
  rating: number;
  mediaRecommendation: AnimeBase;
}

export interface Anime {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage | null;
  bannerImage: string | null;
  description: string;
  episodes: number | null;
  status: string;
  averageScore: number | null;
  genres: string[];
  type: string;
  duration: number | null;
  startDate: { year: number; month: number; day: number } | null;
  endDate: { year: number; month: number; day: number } | null;
  season: string | null;
  seasonYear: number | null;
  studios: { nodes: { name: string }[] };
  externalLinks: { site: string; url:string }[];
  relations?: { edges: AnimeRelationEdge[] };
  recommendations?: { nodes: AnimeRecommendationNode[] };
}

export interface WatchlistItem {
  mediaListId?: number; // For mutations; optional for local-only items
  anime: Anime;
  status: WatchStatus;
  watchedEpisodes: number;
}

export interface User {
  id: number;
  name: string;
  avatar: {
    large: string;
  };
  statistics: {
    anime: {
      count: number;
      episodesWatched: number;
      minutesWatched: number;
      statuses: {
        status: WatchStatus;
        count: number;
      }[];
    }
  }
}

export interface FriendRequest {
  id: string; // Firestore document ID
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  displayName_lowercase?: string;
  email: string | null;
  anilistToken?: string | null;
}

export interface Friend {
    uid: string;
    displayName: string;
    friendshipId: string;
}


export interface AIRecommendation {
  title: string;
  reason: string;
}

export enum NotificationType {
  FriendRequest = 'FRIEND_REQUEST',
  FriendAccept = 'FRIEND_ACCEPT',
}

export interface AppNotification {
  id: string; // Firestore document ID
  uid: string; // User this notification belongs to
  type: NotificationType;
  message: string;
  fromUid?: string; // UID of user who triggered it, if applicable
  fromName?: string;
  timestamp: any; // Firestore Timestamp
  read: boolean;
}