import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Event } from "@/lib/types";
import { sampleEvents } from "@/lib/sample-events";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Booking {
  id: string;
  venue_id: string;
  user_id: string;
  booked_at: string;
  expires_at: string | null;
  status: string;
}

interface Favorite {
  id: string;
  venue_id: string;
  user_id: string;
}

interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface EventContextType {
  events: Event[];
  loading: boolean;
  bookings: Booking[];
  favorites: Favorite[];
  reviews: Review[];
  addEvent: (event: Omit<Event, "id">) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => Event | undefined;
  toggleLike: (id: string) => void;
  rateEvent: (id: string, rating: number) => void;
  bookVenue: (id: string) => Promise<boolean>;
  cancelBooking: (venueId: string) => Promise<boolean>;
  getBookingForVenue: (venueId: string) => Booking | undefined;
  isMyBooking: (venueId: string) => boolean;
  toggleFavorite: (venueId: string) => Promise<void>;
  isFavorited: (venueId: string) => boolean;
  addReview: (venueId: string, rating: number, comment: string) => Promise<boolean>;
  getReviewsForVenue: (venueId: string) => Review[];
  hasReviewed: (venueId: string) => boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch bookings from database
  const fetchBookings = useCallback(async () => {
    const { data } = await supabase.from("bookings").select("*");
    if (data) {
      setBookings(data as Booking[]);
      setEvents(prev => prev.map(e => {
        const booking = data.find((b: any) => b.venue_id === e.id && b.status === "active");
        const isExpired = booking?.expires_at && new Date(booking.expires_at) < new Date();
        if (booking && !isExpired) {
          return { ...e, marketStatus: "booked" as const };
        }
        return { ...e, marketStatus: "available" as const };
      }));
    }
  }, []);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id);
    if (data) setFavorites(data as Favorite[]);
  }, [user]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    const { data } = await supabase.from("reviews").select("*");
    if (data) setReviews(data as Review[]);
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchReviews();
  }, [fetchBookings, fetchReviews]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addEvent = useCallback((event: Omit<Event, "id">) => {
    const newEvent: Event = { ...event, id: crypto.randomUUID() };
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const deleteEvent = useCallback((id: string) => {
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

    const expiresAt = new Date(event.date + "T23:59:59").toISOString();

    const { error } = await supabase.from("bookings").insert({
      venue_id: id,
      user_id: user.id,
      expires_at: expiresAt,
      status: "active",
    } as any);

    if (error) return false;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, marketStatus: "booked" as const, orders: 1 } : e
      )
    );
    await fetchBookings();
    return true;
  }, [events, user, fetchBookings]);

  const cancelBooking = useCallback(async (venueId: string): Promise<boolean> => {
    if (!user) return false;
    const booking = bookings.find(b => b.venue_id === venueId && b.user_id === user.id && b.status === "active");
    if (!booking) return false;

    const { error } = await supabase.from("bookings").delete().eq("id", booking.id);
    if (error) return false;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === venueId ? { ...e, marketStatus: "available" as const, orders: 0 } : e
      )
    );
    await fetchBookings();
    return true;
  }, [user, bookings, fetchBookings]);

  const getBookingForVenue = useCallback((venueId: string) => {
    return bookings.find(b => b.venue_id === venueId && b.status === "active");
  }, [bookings]);

  const isMyBooking = useCallback((venueId: string) => {
    if (!user) return false;
    return bookings.some(b => b.venue_id === venueId && b.user_id === user.id && b.status === "active");
  }, [user, bookings]);

  // Favorites
  const toggleFavorite = useCallback(async (venueId: string) => {
    if (!user) return;
    const existing = favorites.find(f => f.venue_id === venueId);
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
    } else {
      await supabase.from("favorites").insert({ venue_id: venueId, user_id: user.id } as any);
    }
    await fetchFavorites();
  }, [user, favorites, fetchFavorites]);

  const isFavorited = useCallback((venueId: string) => {
    return favorites.some(f => f.venue_id === venueId);
  }, [favorites]);

  // Reviews
  const addReview = useCallback(async (venueId: string, rating: number, comment: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("reviews").insert({
      venue_id: venueId,
      user_id: user.id,
      rating,
      comment: comment || null,
    } as any);
    if (error) return false;
    await fetchReviews();
    rateEvent(venueId, rating);
    return true;
  }, [user, fetchReviews, rateEvent]);

  const getReviewsForVenue = useCallback((venueId: string) => {
    return reviews.filter(r => r.venue_id === venueId);
  }, [reviews]);

  const hasReviewed = useCallback((venueId: string) => {
    if (!user) return false;
    return reviews.some(r => r.venue_id === venueId && r.user_id === user.id);
  }, [user, reviews]);

  return (
    <EventContext.Provider value={{
      events, loading, bookings, favorites, reviews,
      addEvent, deleteEvent, getEvent,
      toggleLike, rateEvent, bookVenue, cancelBooking, getBookingForVenue, isMyBooking,
      toggleFavorite, isFavorited,
      addReview, getReviewsForVenue, hasReviewed,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};
