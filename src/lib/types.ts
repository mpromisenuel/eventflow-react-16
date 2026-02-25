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
  status: "upcoming" | "ongoing" | "completed";
}

export type EventCategory = "conference" | "workshop" | "social" | "networking" | "celebration";

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
