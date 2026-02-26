import React, { createContext, useContext, useState, useCallback } from "react";
// Event context provider for global event state management
import { Event } from "@/lib/types";
import { sampleEvents } from "@/lib/sample-events";

interface EventContextType {
  events: Event[];
  addEvent: (event: Omit<Event, "id">) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => Event | undefined;
  toggleLike: (id: string) => void;
  rateEvent: (id: string, rating: number) => void;
  orderEvent: (id: string, quantity: number) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>(sampleEvents);

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

  const orderEvent = useCallback((id: string, quantity: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, orders: e.orders + quantity, attendees: Math.min(e.attendees + quantity, e.maxAttendees) }
          : e
      )
    );
  }, []);

  return (
    <EventContext.Provider value={{ events, addEvent, deleteEvent, getEvent, toggleLike, rateEvent, orderEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};
