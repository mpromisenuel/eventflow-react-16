import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { useEvents } from "@/context/EventContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Availability = () => {
  const { events } = useEvents();
  const [venueId, setVenueId] = useState<string>("");
  const [booked, setBooked] = useState<{ event_date: string; workflow_status: string }[]>([]);

  useEffect(() => {
    if (!venueId) return;
    supabase.from("bookings").select("event_date, workflow_status")
      .eq("venue_id", venueId).not("event_date", "is", null)
      .then(({ data }) => setBooked((data as any) || []));
  }, [venueId]);

  const bookedDates = useMemo(() =>
    booked.filter(b => !["completed","cancelled"].includes(b.workflow_status))
      .map(b => new Date(b.event_date + "T00:00:00")),
    [booked]
  );

  const venue = events.find(e => e.id === venueId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-2">Check Venue Availability</h1>
        <p className="text-muted-foreground mb-8">See which dates are already booked before you inquire.</p>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <Card>
            <CardHeader><CardTitle>Pick a venue</CardTitle></CardHeader>
            <CardContent>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger><SelectValue placeholder="Select a venue" /></SelectTrigger>
                <SelectContent>
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {venue && (
                <div className="mt-4 text-sm space-y-1">
                  <p className="font-medium">{venue.title}</p>
                  <p className="text-muted-foreground">{venue.location}</p>
                  <p className="text-muted-foreground">Booked dates: {bookedDates.length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Availability Calendar
                <div className="flex gap-2 text-xs">
                  <Badge variant="destructive">Booked</Badge>
                  <Badge className="bg-green-600">Free</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={bookedDates}
                onSelect={() => {}}
                modifiers={{ booked: bookedDates }}
                modifiersClassNames={{ booked: "bg-destructive text-destructive-foreground" }}
                className="p-3 pointer-events-auto"
              />
              {venueId && bookedDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Next booked:</p>
                  <ul className="text-sm space-y-1">
                    {bookedDates.slice(0,5).map((d,i) => (
                      <li key={i}>• {format(d, "PPP")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Availability;
