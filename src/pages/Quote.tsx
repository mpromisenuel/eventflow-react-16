import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ADDONS, EVENT_TYPES, calcQuote, TASK_TEMPLATES } from "@/lib/packages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Quote = () => {
  const { events } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venueId, setVenueId] = useState<string>("");
  const [eventType, setEventType] = useState("wedding");
  const [guests, setGuests] = useState(50);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);

  const venue = events.find(e => e.id === venueId);
  const quote = useMemo(
    () => calcQuote({ basePrice: venue?.price ?? 0, eventType, guests, addonIds }),
    [venue, eventType, guests, addonIds]
  );

  const toggleAddon = (id: string) =>
    setAddonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submitInquiry = async () => {
    if (!user) { toast.error("Please sign in"); return navigate("/auth"); }
    if (!venue || !date) { toast.error("Pick a venue and date"); return; }
    setSubmitting(true);
    const { data: booking, error } = await supabase.from("bookings").insert({
      venue_id: venue.id,
      user_id: user.id,
      event_date: format(date, "yyyy-MM-dd"),
      event_type: eventType,
      guest_count: guests,
      addons: addonIds as any,
      total_estimate: quote.total,
      workflow_status: "inquiry",
      status: "active",
      expires_at: new Date(date.getTime() + 24*3600*1000).toISOString(),
    } as any).select().single();
    if (error || !booking) {
      toast.error(error?.message || "Could not submit inquiry");
      setSubmitting(false);
      return;
    }
    // Auto-generate tasks
    const tasks = TASK_TEMPLATES.map((t, idx) => {
      const base = new Date(date);
      if (t.offsetDays) base.setDate(base.getDate() + t.offsetDays);
      if (t.offsetHours) base.setHours(base.getHours() + t.offsetHours);
      return {
        booking_id: (booking as any).id,
        title: t.title,
        due_at: base.toISOString(),
        sort_order: idx,
        created_by: user.id,
      };
    });
    await supabase.from("event_tasks" as any).insert(tasks as any);
    toast.success("Inquiry submitted! Our team will be in touch.");
    setSubmitting(false);
    navigate("/my-bookings");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-2">Get an Instant Quote</h1>
        <p className="text-muted-foreground mb-8">Choose your venue, customise your package, and see your estimate live.</p>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card>
            <CardHeader><CardTitle>Build your event</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Venue</Label>
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger><SelectValue placeholder="Select a venue" /></SelectTrigger>
                  <SelectContent>
                    {events.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title} — GHS {e.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Guest Count</Label>
                  <Input type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div>
                <Label>Event Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate}
                      disabled={d => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="mb-2 block">Add-on Services</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ADDONS.map(a => (
                    <label key={a.id} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <Checkbox checked={addonIds.includes(a.id)} onCheckedChange={() => toggleAddon(a.id)} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{a.label}</div>
                        <div className="text-xs text-muted-foreground">GHS {a.price}{a.perGuest ? " / guest" : ""}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit sticky top-20">
            <CardHeader><CardTitle>Price Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Row label="Venue" value={quote.venueCost} />
              <Row label="Add-ons" value={quote.addonsCost} />
              <div className="border-t pt-3 flex justify-between font-display text-xl">
                <span>Total</span>
                <span className="text-primary">GHS {quote.total.toLocaleString()}</span>
              </div>
              <Button className="w-full" onClick={submitInquiry} disabled={submitting || !venueId || !date}>
                {submitting ? "Submitting…" : "Submit Inquiry"}
              </Button>
              <p className="text-[11px] text-muted-foreground">Estimates only. Final pricing confirmed by the JEP team.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span>GHS {value.toLocaleString()}</span>
  </div>
);

export default Quote;
