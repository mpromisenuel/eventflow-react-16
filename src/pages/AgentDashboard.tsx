import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CalendarDays, Plus, Trash2, Users, Sparkles, CalendarPlus,
} from "lucide-react";

type PlannedEvent = {
  id: string;
  event_type: string | null;
  event_date: string | null;
  guest_count: number | null;
  workflow_status: string | null;
  total_estimate: number | null;
  notes: string | null;
  addons: any;
  venue_id: string;
  venues?: { title: string | null } | null;
};

const statusColor: Record<string, string> = {
  inquiry: "bg-muted text-foreground",
  basic: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  design: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  catering: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  service: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  confirmed: "bg-primary/15 text-primary",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

const AgentDashboard = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PlannedEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, event_type, event_date, guest_count, workflow_status, total_estimate, notes, addons, venue_id, venues(title)")
        .order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      setEvents((data as any) || []);
    } catch (e: any) {
      toast.error("Failed to load events", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const target = pendingDelete;
    // Optimistic removal
    setEvents((prev) => prev.filter((e) => e.id !== target.id));
    setPendingDelete(null);
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", target.id);
      if (error) throw error;
      toast.success("Event successfully removed.");
    } catch (e: any) {
      toast.error("Could not delete event", { description: e.message });
      // Rollback
      fetchEvents();
    } finally {
      setDeleting(false);
    }
  };

  const eventName = (e: PlannedEvent) =>
    (e.addons?.eventName as string) || e.venues?.title || e.event_type || "Untitled Event";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Planned Events
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Welcome back, {profile?.full_name || user?.email || "Agent"}
            </p>
          </div>
          <Button asChild className="font-body gap-2">
            <Link to="/plan-my-event">
              <Plus className="h-4 w-4" /> Plan New Event
            </Link>
          </Button>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body mb-4">No events planned yet</p>
            <Button asChild className="font-body gap-2">
              <Link to="/plan-my-event">
                <CalendarPlus className="h-4 w-4" /> Plan Your First Event
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => {
              const status = (e.workflow_status || "inquiry").toLowerCase();
              return (
                <Card key={e.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {eventName(e)}
                      </CardTitle>
                      <Badge className={`${statusColor[status] || statusColor.inquiry} capitalize border-0`}>
                        {status}
                      </Badge>
                    </div>
                    {e.event_type && (
                      <p className="text-xs text-muted-foreground font-body capitalize">
                        {e.event_type}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 flex-1 text-sm font-body">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {e.event_date ? new Date(e.event_date).toLocaleDateString() : "Date TBD"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {e.guest_count ? `${e.guest_count} guests` : "Guest count TBD"}
                    </div>
                    {e.total_estimate ? (
                      <div className="text-xs text-muted-foreground">
                        Est. GHS {Number(e.total_estimate).toLocaleString()}
                      </div>
                    ) : null}
                    <div className="pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 px-2"
                        onClick={() => setPendingDelete(e)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDelete ? eventName(pendingDelete) : ""}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentDashboard;
