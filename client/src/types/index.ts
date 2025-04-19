// Message types for chat interface
export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Chat types for storing conversations
export interface Chat {
  _id: string;
  title: string;
  messages: Message[];
}

// User type for authentication
export interface User {
  id: string;
  name: string;
  email: string;
}

// Travel preferences collected during conversation
export interface TravelPreferences {
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  cuisines: string[];
  placeTypes: string[];
  specialRequirements: string[];
  personalInterests: string[];
}

// Itinerary day structure
export interface ItineraryDay {
  date: Date;
  activities: Activity[];
}

// Activity structure for itinerary
export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  category?: string;
}

interface Preferences {
  cuisines: string[];
  placeTypes: string[];
  specialRequirements: string[];
  otherInterests: string[];
}

// Full itinerary structure
export interface Itinerary {
  _id: string;
  userId: string;
  chatId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  preferences: Preferences;
  days: ItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}
