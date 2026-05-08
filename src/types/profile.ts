// Profile types for the Anera dating app

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
  userId: string;
  name: string;
  age: number;
  gender: Gender;
  bio: string;
  interests: string[];
  city: string;
  relationshipIntent: RelationshipIntent;
  isOnboarded: boolean;
  photos: ProfilePhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  name: string;
  age: number;
  gender: Gender;
  bio: string;
  interests: string[];
  city: string;
  relationshipIntent: RelationshipIntent;
}

export interface PhotoUploadResult {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
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
