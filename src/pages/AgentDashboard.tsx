import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TicketsPanel from "@/components/TicketsPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import {
  CalendarDays, Plus, Trash2, Users, Sparkles, CalendarPlus, Pencil, CalendarIcon, Ticket, CheckCircle2,
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

type Lifecycle = "pending" | "active" | "completed";

// Map raw workflow_status values into the 3-tier lifecycle
const toLifecycle = (s: string | null | undefined): Lifecycle => {
  const v = (s || "").toLowerCase();
  if (["completed", "cancelled"].includes(v)) return "completed";
  if (["confirmed", "active", "ongoing"].includes(v)) return "active";
  return "pending";
};

const lifecycleStyles: Record<Lifecycle, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  completed: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300",
};

const lifecycleLabel: Record<Lifecycle, string> = {
  pending: "Pending",
  active: "Active / Ongoing",
  completed: "Completed",
};

const AgentDashboard = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PlannedEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit dialog state
  const [editing, setEditing] = useState<PlannedEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGuests, setEditGuests] = useState<number | "">("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editStatus, setEditStatus] = useState<Lifecycle>("pending");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, event_type, event_date, guest_count, workflow_status, total_estimate, notes, addons, venue_id, venues!left(title)")
        .order("created_at", { ascending: false });
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

  const eventName = (e: PlannedEvent) =>
    (e.addons?.eventName as string) || e.venues?.title || e.event_type || "Untitled Event";

  const openEdit = (e: PlannedEvent) => {
    setEditing(e);
    setEditName(eventName(e));
    setEditGuests(e.guest_count ?? "");
    setEditDate(e.event_date ? new Date(e.event_date) : undefined);
    setEditStatus(toLifecycle(e.workflow_status));
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) {
      toast.error("Event name is required");
      return;
    }
    if (!editDate) {
      toast.error("Please pick a scheduled date");
      return;
    }
    setSaving(true);
    const id = editing.id;
    const newAddons = { ...(editing.addons || {}), eventName: editName.trim() };
    const isoDate = format(editDate, "yyyy-MM-dd");
    const guests = typeof editGuests === "number" ? editGuests : Number(editGuests) || 0;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          addons: newAddons,
          guest_count: guests,
          event_date: isoDate,
          workflow_status: editStatus,
        })
        .eq("id", id);
      if (error) throw error;

      // Optimistic local update
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === id
            ? {
                ...ev,
                addons: newAddons,
                guest_count: guests,
                event_date: isoDate,
                workflow_status: editStatus,
              }
            : ev,
        ),
      );
      toast.success("Event updated successfully");
      setEditing(null);
    } catch (e: any) {
      toast.error("Could not update event", {
        description: e.message || "Database connection issue. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const target = pendingDelete;
    setEvents((prev) => prev.filter((e) => e.id !== target.id));
    setPendingDelete(null);
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", target.id);
      if (error) throw error;
      toast.success("Event successfully removed.");
    } catch (e: any) {
      toast.error("Could not delete event", { description: e.message });
      fetchEvents();
    } finally {
      setDeleting(false);
    }
  };

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
              const lc = toLifecycle(e.workflow_status);
              return (
                <Card key={e.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {eventName(e)}
                      </CardTitle>
                      <Badge className={`${lifecycleStyles[lc]} border-0 whitespace-nowrap`}>
                        {lifecycleLabel[lc]}
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
                    <div className="pt-3 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-2"
                        onClick={() => openEdit(e)}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 px-2"
                        onClick={() => setPendingDelete(e)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Update Event Details</DialogTitle>
            <DialogDescription>
              Modify the event information below and save your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Event Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Annual Gala Dinner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-guests">Guest Count</Label>
              <Input
                id="edit-guests"
                type="number"
                min={0}
                value={editGuests}
                onChange={(e) =>
                  setEditGuests(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Number of guests"
              />
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Lifecycle Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Lifecycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active / Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
