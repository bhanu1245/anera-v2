// Profile types for the Anera dating app.
//
// Updated in M6 to the V2 shape defined by BACKEND-SCHEMA.md §2. The MVP
// fields this replaces are recorded in §2.1: `name` became `displayName`,
// `relationshipIntent` became `intent`, and the stored `age` integer became
// `birthDate` — because a stored age "is wrong the day after it's written".
// Age now arrives derived from the server and is never sent back.

/**
 * The gender and intent value sets are UNRATIFIED (`OQ-B07`, and `OQ-P01`,
 * which asks whether the non-dating intents survive). The server validates
 * both structurally and does not police the value set. These types describe
 * what the current UI offers, not an approved vocabulary.
 */
export type Gender = "male" | "female" | "non-binary" | "other";
export type RelationshipIntent = "casual" | "serious" | "networking" | "friendship" | "not-sure";

export interface ProfilePhoto {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface Profile {
  id: string;
  displayName: string;
  /** Calendar date, `YYYY-MM-DD`. */
  birthDate: string;
  /** Derived server-side from `birthDate`; never stored, never submitted. */
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  city: string;
  intent: string;
  isOnboarded: boolean;
  /**
   * Always empty in M6. Photo upload was removed pending a media-storage
   * decision (`IG-18`); the field remains because the `photos` table does.
   */
  photos: ProfilePhoto[];
  createdAt: string;
  updatedAt: string;
}

/** What the profile form submits. `age` is absent by design — it is derived. */
export interface ProfileFormData {
  displayName: string;
  birthDate: string;
  gender: string;
  bio: string;
  interests: string[];
  city: string;
  intent: string;
}

// Image validation constants
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PHOTOS: 6,
  MIN_DIMENSION: 200,
  MAX_DIMENSION: 4096,
  ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  THUMBNAIL_SIZE: 800,
  QUALITY: 0.8,
} as const;

// Available interests for selection
export const AVAILABLE_INTERESTS = [
  "Travel", "Music", "Photography", "Cooking", "Fitness",
  "Reading", "Movies", "Art", "Gaming", "Hiking",
  "Yoga", "Dancing", "Coffee", "Wine", "Pets",
  "Sports", "Tech", "Fashion", "Food", "Nature",
  "Writing", "Cycling", "Swimming", "Meditation", "Gardening",
] as const;

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

export const RELATIONSHIP_INTENT_OPTIONS: { value: RelationshipIntent; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "serious", label: "Serious Relationship" },
  { value: "networking", label: "Networking" },
  { value: "friendship", label: "Friendship" },
  { value: "not-sure", label: "Not Sure Yet" },
];
