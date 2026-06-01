import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { WORKFLOW_COLUMNS } from "@/lib/packages";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

interface Bk {
  id: string;
  venue_id: string;
  workflow_status: string;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  total_estimate: number | null;
}

const AdminKanban = () => {
  const { user, isAdmin, isAgent, loading } = useAuth();
  const { events } = useEvents();
  const [bookings, setBookings] = useState<Bk[]>([]);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings")
      .select("id, venue_id, workflow_status, event_date, event_type, guest_count, total_estimate")
      .order("event_date", { ascending: true });
    setBookings((data as any) || []);
  };

  useEffect(() => { if (user) fetchBookings(); }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin && !isAgent) return <Navigate to="/" replace />;

  const move = async (b: Bk, dir: -1 | 1) => {
    const idx = WORKFLOW_COLUMNS.findIndex(c => c.key === b.workflow_status);
    const next = WORKFLOW_COLUMNS[idx + dir];
    if (!next) return;
    const { error } = await supabase.from("bookings")
      .update({ workflow_status: next.key } as any).eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success(`Moved to ${next.label}`);
    fetchBookings();
  };

  const venueTitle = (id: string) => events.find(e => e.id === id)?.title || "Unknown venue";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-2">Event Pipeline</h1>
        <p className="text-muted-foreground mb-6">Track every booking from inquiry to completion.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {WORKFLOW_COLUMNS.map(col => {
            const items = bookings.filter(b => (b.workflow_status || "inquiry") === col.key);
            return (
              <div key={col.key} className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map(b => (
                    <Card key={b.id} className="p-3 space-y-2">
                      <p className="text-sm font-medium line-clamp-1">{venueTitle(b.venue_id)}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>{b.event_date || "No date"}</p>
                        <p>{b.event_type || "—"} · {b.guest_count || 0} guests</p>
                        <p className="text-primary font-medium">GHS {Number(b.total_estimate||0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          disabled={WORKFLOW_COLUMNS[0].key === col.key}
                          onClick={() => move(b, -1)}>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          disabled={WORKFLOW_COLUMNS[WORKFLOW_COLUMNS.length-1].key === col.key}
                          onClick={() => move(b, 1)}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AdminKanban;
