// Swipe and Match types for the Anera dating app

export type SwipeAction = "like" | "pass" | "superlike";

export interface Swipe {
  id: string;
  fromUserId: string;
  toUserId: string;
  action: SwipeAction;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  // Populated from API
  profile?: DiscoverProfile;
}

export interface DiscoverProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  city: string;
  relationshipIntent: string;
  isOnboarded: boolean;
  photos: { id: string; url: string; order: number; isPrimary: boolean }[];
  createdAt: string;
  updatedAt: string;
  // Computed fields
  compatibilityScore?: number;
  sharedInterests?: string[];
  distance?: string;
  isVerified?: boolean;
}

export interface SwipeResult {
  success: boolean;
  action: SwipeAction;
  targetUserId: string;
  isMatch: boolean;
  match?: Match;
}

export interface DiscoverResponse {
  profiles: DiscoverProfile[];
  hasMore: boolean;
}
