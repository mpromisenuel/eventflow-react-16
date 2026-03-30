import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Event } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface EventContextType {
  events: Event[];
  loading: boolean;
  addEvent: (event: Omit<Event, "id">) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => Event | undefined;
  toggleLike: (id: string) => void;
  rateEvent: (id: string, rating: number) => void;
  bookVenue: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Map DB row to frontend Event type
function mapRow(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    location: row.location,
    category: row.category,
    attendees: 0,
    maxAttendees: row.max_attendees,
    image: row.image,
    images: row.images || [],
    status: row.status as Event["status"],
    likes: row.likes ?? 0,
    liked: false,
    rating: Number(row.rating) || 0,
    ratingCount: row.rating_count ?? 0,
    price: Number(row.price) || 0,
    orders: row.market_status === "booked" ? 1 : 0,
    venueType: row.venue_type,
    propertyRef: row.property_ref ?? undefined,
    agentName: row.agent_name ?? undefined,
    agentPhone: row.agent_phone ?? undefined,
    agentWebsite: row.agent_website ?? undefined,
    amenities: row.amenities || [],
    inclusions: row.inclusions || [],
    extraFees: row.extra_fees || [],
    address: row.address,
    city: row.city,
    region: row.region,
    mapUrl: row.map_url ?? undefined,
    marketStatus: row.market_status as Event["marketStatus"],
    lastUpdated: row.updated_at?.split("T")[0] ?? new Date().toISOString().split("T")[0],
  };
}

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvents(data.map(mapRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const addEvent = useCallback(async (event: Omit<Event, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("venues").insert({
      user_id: user.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      max_attendees: event.maxAttendees,
      image: event.image,
      images: event.images,
      status: event.status,
      price: event.price,
      venue_type: event.venueType,
      property_ref: event.propertyRef || null,
      agent_name: event.agentName || null,
      agent_phone: event.agentPhone || null,
      agent_website: event.agentWebsite || null,
      amenities: event.amenities,
      inclusions: event.inclusions,
      extra_fees: event.extraFees || [],
      address: event.address,
      city: event.city,
      region: event.region,
      map_url: event.mapUrl || null,
      market_status: event.marketStatus,
    });
    if (!error) await fetchVenues();
  }, [user, fetchVenues]);

  const deleteEvent = useCallback(async (id: string) => {
    await supabase.from("venues").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events]
  );

  const toggleLike = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, liked: !e.liked, likes: e.liked ? e.likes - 1 : e.likes + 1 }
          : e
      )
    );
  }, []);

  const rateEvent = useCallback((id: string, rating: number) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newCount = e.ratingCount + 1;
        const newRating = (e.rating * e.ratingCount + rating) / newCount;
        return { ...e, rating: Math.round(newRating * 10) / 10, ratingCount: newCount };
      })
    );
  }, []);

  const bookVenue = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    const event = events.find((e) => e.id === id);
    if (!event || event.marketStatus !== "available") return false;

    const { error } = await supabase.from("bookings").insert({
      venue_id: id,
      user_id: user.id,
    });

    if (error) return false;

    // The trigger updates market_status to 'booked', refresh locally
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, marketStatus: "booked" as const, orders: 1 } : e
      )
    );
    return true;
  }, [user, events]);

  return (
    <EventContext.Provider value={{ events, loading, addEvent, deleteEvent, getEvent, toggleLike, rateEvent, bookVenue, refetch: fetchVenues }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};
