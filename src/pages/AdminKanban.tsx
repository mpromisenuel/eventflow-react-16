import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const { user, isAdmin, isAgent, isSuperAdmin, loading } = useAuth();
  const { events } = useEvents();
  const [bookings, setBookings] = useState<Bk[] | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchBookings = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.from("bookings")
        .select("id, venue_id, workflow_status, event_date, event_type, guest_count, total_estimate")
        .order("event_date", { ascending: true });
      if (error) throw error;
      setBookings((data as any) || []);
    } catch (e: any) {
      toast.error("Failed to load bookings", { description: e?.message });
      setBookings([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (user) fetchBookings(); }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin && !isAgent && !isSuperAdmin) return <Navigate to="/" replace />;

  const move = async (b: Bk, dir: -1 | 1) => {
    const idx = WORKFLOW_COLUMNS.findIndex(c => c.key === b.workflow_status);
    const next = WORKFLOW_COLUMNS[idx + dir];
    if (!next) return;
    try {
      const { error } = await supabase.from("bookings")
        .update({ workflow_status: next.key } as any).eq("id", b.id);
      if (error) throw error;
      toast.success(`Moved to ${next.label}`);
      fetchBookings();
    } catch (e: any) {
      toast.error("Update failed", { description: e?.message });
    }
  };

  const venueTitle = (id: string) => events.find(e => e.id === id)?.title || "Unknown venue";

  const renderCard = (b: Bk, col: typeof WORKFLOW_COLUMNS[number]) => (
    <Card key={b.id} className="p-3 space-y-2">
      <p className="text-sm font-medium line-clamp-1">{venueTitle(b.venue_id)}</p>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{b.event_date || "No date"}</p>
        <p>{b.event_type || "—"} · {b.guest_count || 0} guests</p>
        <p className="text-primary font-medium">GHS {Number(b.total_estimate || 0).toLocaleString()}</p>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7"
          disabled={WORKFLOW_COLUMNS[0].key === col.key}
          onClick={() => move(b, -1)}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7"
          disabled={WORKFLOW_COLUMNS[WORKFLOW_COLUMNS.length - 1].key === col.key}
          onClick={() => move(b, 1)}>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );

  const list = bookings ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-10">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Event Pipeline</h1>
        <p className="text-muted-foreground mb-6 text-sm">Track every booking from inquiry to completion.</p>

        {busy && bookings === null && (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        )}

        {bookings !== null && (
          <>
            {/* Mobile: swipeable tabs */}
            <div className="md:hidden">
              <Tabs defaultValue={WORKFLOW_COLUMNS[0].key}>
                <TabsList className="w-full overflow-x-auto flex justify-start no-scrollbar">
                  {WORKFLOW_COLUMNS.map(col => {
                    const count = list.filter(b => (b.workflow_status || "inquiry") === col.key).length;
                    return (
                      <TabsTrigger key={col.key} value={col.key} className="flex-shrink-0 gap-1.5 text-xs">
                        {col.label}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {WORKFLOW_COLUMNS.map(col => {
                  const items = list.filter(b => (b.workflow_status || "inquiry") === col.key);
                  return (
                    <TabsContent key={col.key} value={col.key} className="space-y-2 mt-3">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">No bookings in {col.label.toLowerCase()}.</p>
                      ) : items.map(b => renderCard(b, col))}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>

            {/* Desktop: kanban grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {WORKFLOW_COLUMNS.map(col => {
                const items = list.filter(b => (b.workflow_status || "inquiry") === col.key);
                return (
                  <div key={col.key} className="bg-muted/40 rounded-lg p-3 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map(b => renderCard(b, col))}
                      {items.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminKanban;
