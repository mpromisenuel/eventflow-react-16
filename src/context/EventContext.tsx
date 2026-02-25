import React, { createContext, useContext, useState, useCallback } from "react";
import { Event } from "@/lib/types";
import { sampleEvents } from "@/lib/sample-events";

interface EventContextType {
  events: Event[];
  addEvent: (event: Omit<Event, "id">) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => Event | undefined;
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

  return (
    <EventContext.Provider value={{ events, addEvent, deleteEvent, getEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};
