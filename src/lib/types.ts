export type VenueType = "hall" | "beach" | "grounds" | "rooftop" | "garden" | "ballroom";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  attendees: number;
  maxAttendees: number;
  image: string;
  images: string[];
  status: "upcoming" | "ongoing" | "completed";
  likes: number;
  liked: boolean;
  rating: number;
  ratingCount: number;
  price: number;
  orders: number;
  // Comprehensive fields
  venueType: VenueType;
  propertyRef?: string;
  agentName?: string;
  agentPhone?: string;
  agentWebsite?: string;
  amenities: string[];
  inclusions: string[];
  extraFees?: string[];
  address: string;
  city: string;
  region: string;
  mapUrl?: string;
  marketStatus: "available" | "booked" | "sold-out";
  lastUpdated: string;
}

export type EventCategory = "conference" | "workshop" | "social" | "networking" | "celebration";

export const venueTypeLabels: Record<VenueType, string> = {
  hall: "Hall / Indoor",
  beach: "Beach",
  grounds: "Spacious Grounds",
  rooftop: "Rooftop",
  garden: "Garden",
  ballroom: "Ballroom",
};

export const categoryColors: Record<EventCategory, string> = {
  conference: "bg-primary/10 text-primary",
  workshop: "bg-accent/10 text-accent",
  social: "bg-warm/10 text-warm",
  networking: "bg-terracotta/10 text-terracotta",
  celebration: "bg-gold/20 text-foreground",
};

export const categoryLabels: Record<EventCategory, string> = {
  conference: "Conference",
  workshop: "Workshop",
  social: "Social",
  networking: "Networking",
  celebration: "Celebration",
};
