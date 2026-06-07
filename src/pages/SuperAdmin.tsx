import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { WORKFLOW_COLUMNS, EVENT_TYPES } from "@/lib/packages";
import {
  Shield,
  Trash2,
  UserPlus,
  Pencil,
  ArrowRight,
  Sparkles,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: string[];
}

interface Bk {
  id: string;
  venue_id: string | null;
  workflow_status: string;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  total_estimate: number | null;
  user_id: string;
  addons: any;
}

type StageKey = "pending_review" | "get_quote" | "customized" | "active" | "completed";

const STAGES: { key: StageKey; label: string; accent: string; ring: string; chip: string; match: string[] }[] = [
  {
    key: "pending_review",
    label: "Pending Admin Review",
    accent: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900",
    ring: "ring-yellow-300/60",
    chip: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200",
    match: ["pending_review", "pending"],
  },
  {
    key: "get_quote",
    label: "Approved / Quote",
    accent: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    ring: "ring-amber-300/60",
    chip: "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200",
    match: ["inquiry", "get_quote", "quote", "approved"],
  },
  {
    key: "customized",
    label: "Customized Event",
    accent: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900",
    ring: "ring-violet-300/60",
    chip: "bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-200",
    match: ["customized", "in_planning", "deposit_paid"],
  },
  {
    key: "active",
    label: "Active / Ongoing",
    accent: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    ring: "ring-blue-300/60",
    chip: "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200",
    match: ["active", "ongoing"],
  },
  {
    key: "completed",
    label: "Completed",
    accent: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
    ring: "ring-emerald-300/60",
    chip: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200",
    match: ["completed", "archived"],
  },
];

const toStage = (status: string): StageKey => {
  const s = (status || "").toLowerCase();
  const found = STAGES.find((st) => st.match.includes(s));
  return found?.key ?? "pending_review";
};

const AESTHETICS = ["Modern Minimal", "Classic Elegant", "Boho Chic", "Rustic Garden", "Black Tie Glam", "Tropical"];
const SEATING = ["Round Tables", "Long Banquet", "Theater Style", "Lounge / Mixed", "U-Shape", "Cocktail Standing"];
const MEALS = ["Buffet", "Plated", "Finger Foods", "Family Style", "Food Stations"];
const BAR_OPTS = ["No Bar", "Soft Drinks Only", "Beer & Wine", "Full Open Bar", "Premium Top Shelf"];
const DESSERT_OPTS = ["No Dessert", "Wedding/Event Cake", "Dessert Table", "Plated Dessert", "Live Dessert Station"];

const SuperAdmin = () => {
  const { user, isSuperAdmin, loading } = useAuth();
  const { events } = useEvents();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [bookings, setBookings] = useState<Bk[]>([]);
  const [busy, setBusy] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [activeStage, setActiveStage] = useState<StageKey>("get_quote");
  const [editing, setEditing] = useState<Bk | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!loading && user && !isSuperAdmin) {
      toast.error("Permission Denied", {
        description: "You don't have access to the Superadmin area.",
      });
      navigate("/", { replace: true });
    }
  }, [loading, user, isSuperAdmin, navigate]);

  const fetchAll = async () => {
    setBusy(true);
    try {
      const [{ data: profs, error: pe }, { data: roles, error: re }, { data: bks, error: be }] =
        await Promise.all([
          supabase.from("profiles").select("id, email, full_name"),
          supabase.from("user_roles").select("user_id, role"),
          supabase
            .from("bookings")
            .select("id, venue_id, workflow_status, event_date, event_type, guest_count, total_estimate, user_id, addons")
            .order("created_at", { ascending: false }),
        ]);
      if (pe || re || be) throw pe || re || be;
      const roleMap = new Map<string, string[]>();
      (roles || []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) || [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      setUsers((profs || []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) || [] })));
      setBookings((bks as any) || []);
    } catch (e: any) {
      toast.error("Failed to load data", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchAll();
  }, [isSuperAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return null;

  const promoteToAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return toast.error("Enter an email first");
    try {
      const target = users.find((u) => u.email?.toLowerCase() === email);
      if (!target) return toast.error("No user with that email has signed up");
      if (target.roles.includes("admin")) return toast.info("Already an admin");
      const { error } = await supabase.from("user_roles").insert({ user_id: target.id, role: "admin" as any });
      if (error) throw error;
      toast.success(`${email} promoted to admin`);
      setNewAdminEmail("");
      fetchAll();
    } catch (e: any) {
      toast.error("Promotion failed", { description: e?.message });
    }
  };

  const revokeAdmin = async (uid: string, email: string | null) => {
    if (email?.toLowerCase() === "davitorlele@gmail.com") return toast.error("Cannot revoke the root superadmin");
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin" as any);
      if (error) throw error;
      toast.success("Admin access revoked");
      fetchAll();
    } catch (e: any) {
      toast.error("Failed to revoke", { description: e?.message });
    }
  };

  // Pipeline: change stage with optimistic update
  const changeStage = async (b: Bk, newStatus: string, friendly: string) => {
    const prev = b.workflow_status;
    setBookings((curr) => curr.map((x) => (x.id === b.id ? { ...x, workflow_status: newStatus } : x)));
    try {
      const { error } = await supabase.from("bookings").update({ workflow_status: newStatus } as any).eq("id", b.id);
      if (error) throw error;
      toast.success(`Status updated to ${friendly}`);
    } catch (e: any) {
      setBookings((curr) => curr.map((x) => (x.id === b.id ? { ...x, workflow_status: prev } : x)));
      toast.error("Could not update status", { description: e?.message });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Force-delete this booking?")) return;
    const prev = bookings;
    setBookings((curr) => curr.filter((b) => b.id !== id));
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Booking deleted");
    } catch (e: any) {
      setBookings(prev);
      toast.error("Delete failed", { description: e?.message });
    }
  };

  const openEdit = (b: Bk) => {
    const a = (b.addons && typeof b.addons === "object" ? b.addons : {}) as any;
    setEditing(b);
    setEditForm({
      eventName: a.eventName || "",
      event_date: b.event_date || "",
      event_type: b.event_type || "wedding",
      guest_count: b.guest_count || 0,
      total_estimate: b.total_estimate || 0,
      workflow_status: b.workflow_status,
      // design
      aesthetic: a.aesthetic || "",
      palette: a.palette || "",
      seating: a.seating || "",
      theme: a.theme || "",
      // catering
      mealType: a.mealType || "",
      bar: a.bar || "",
      dessert: a.dessert || "",
      // service
      coordinators: a.coordinators ?? 0,
      waiters: a.waiters ?? 0,
      security: a.security ?? 0,
      avTechs: a.avTechs ?? 0,
      // special
      vipHandling: !!a.vipHandling,
      valet: !!a.valet,
      accessibility: !!a.accessibility,
      customRequest: a.customRequest || "",
    });
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    setSavingEdit(true);
    const prevAddons = (editing.addons && typeof editing.addons === "object" ? editing.addons : {}) as any;
    const mergedAddons = {
      ...prevAddons,
      eventName: editForm.eventName,
      aesthetic: editForm.aesthetic,
      palette: editForm.palette,
      seating: editForm.seating,
      theme: editForm.theme,
      mealType: editForm.mealType,
      bar: editForm.bar,
      dessert: editForm.dessert,
      coordinators: Number(editForm.coordinators) || 0,
      waiters: Number(editForm.waiters) || 0,
      security: Number(editForm.security) || 0,
      avTechs: Number(editForm.avTechs) || 0,
      vipHandling: !!editForm.vipHandling,
      valet: !!editForm.valet,
      accessibility: !!editForm.accessibility,
      customRequest: editForm.customRequest,
    };
    const patch: any = {
      event_date: editForm.event_date || null,
      event_type: editForm.event_type,
      guest_count: Number(editForm.guest_count) || 0,
      total_estimate: Number(editForm.total_estimate) || 0,
      workflow_status: editForm.workflow_status,
      addons: mergedAddons,
    };
    try {
      const { error } = await supabase.from("bookings").update(patch).eq("id", editing.id);
      if (error) throw error;
      setBookings((curr) => curr.map((x) => (x.id === editing.id ? { ...x, ...patch } : x)));
      toast.success("Event specifications updated successfully.");
      setEditing(null);
      setEditForm(null);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const stats = {
    users: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    venues: events.length,
    bookings: bookings.length,
    revenue: bookings.reduce((s, b) => s + Number(b.total_estimate || 0), 0),
  };

  const venueTitle = (id: string | null) => (id ? events.find((e) => e.id === id)?.title || "Custom Plan" : "Custom Plan");

  // Group bookings by pipeline stage
  const grouped = useMemo(() => {
    const map: Record<StageKey, Bk[]> = { pending_review: [], get_quote: [], customized: [], active: [], completed: [] };
    bookings.forEach((b) => map[toStage(b.workflow_status)].push(b));
    return map;
  }, [bookings]);

  const renderCard = (b: Bk) => {
    const stage = toStage(b.workflow_status);
    const a = (b.addons && typeof b.addons === "object" ? b.addons : {}) as any;
    const name = a.eventName || venueTitle(b.venue_id);
    return (
      <motion.div
        key={b.id}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <Card className="p-3 sm:p-4 space-y-3 border bg-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm sm:text-base line-clamp-1">{name}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-1">
                {b.event_type || "—"} · {b.event_date || "No date"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openEdit(b)}
              className="h-7 w-7 shrink-0"
              aria-label="Edit event"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-body">
            <Badge variant="secondary" className="font-normal">
              {b.guest_count || 0} guests
            </Badge>
            <Badge variant="secondary" className="font-normal">
              GHS {Number(b.total_estimate || 0).toLocaleString()}
            </Badge>
          </div>

          {stage === "pending_review" && (
            <Button
              size="sm"
              className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => changeStage(b, "approved", "Approved")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Approve Event
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {stage === "get_quote" && (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => changeStage(b, "customized", "Customized Event")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Customize Event
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {stage === "customized" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => changeStage(b, "active", "Active / Ongoing")}
            >
              Move to Active <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {stage === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => changeStage(b, "completed", "Completed")}
            >
              Mark Completed <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          <button
            onClick={() => deleteBooking(b.id)}
            className="text-[11px] text-destructive hover:underline w-full text-left font-body"
          >
            Force delete
          </button>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6"
        >
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Superadmin Console</h1>
            <p className="text-sm text-muted-foreground font-body">
              Global control over users, bookings & operational pipeline.
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {busy
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            : Object.entries({
                "Total Users": stats.users,
                Admins: stats.admins,
                Venues: stats.venues,
                Bookings: stats.bookings,
                "Revenue (GHS)": stats.revenue.toLocaleString(),
              }).map(([k, v]) => (
                <Card key={k} className="p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">{k}</p>
                  <p className="font-display text-2xl font-bold mt-1">{v}</p>
                </Card>
              ))}
        </div>

        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="grid grid-cols-3 sm:inline-flex sm:w-auto w-full">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="users">Admins & Users</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
          </TabsList>

          {/* ============ PIPELINE ============ */}
          <TabsContent value="pipeline" className="mt-4">
            {busy ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground font-body">
                No events have been planned yet. Once users submit the planning wizard, they will appear here.
              </Card>
            ) : (
              <>
                {/* Mobile: tab bar of stages */}
                <div className="lg:hidden -mx-1 mb-4 overflow-x-auto">
                  <div className="flex gap-2 px-1 min-w-max">
                    {STAGES.map((s) => {
                      const count = grouped[s.key].length;
                      const isActive = activeStage === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setActiveStage(s.key)}
                          className={cn(
                            "px-3 py-2 rounded-full text-xs font-medium font-body border whitespace-nowrap transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-card border-border hover:bg-muted"
                          )}
                        >
                          {s.label} <span className="opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile lane (single active) */}
                <div className="lg:hidden">
                  {STAGES.filter((s) => s.key === activeStage).map((s) => (
                    <div key={s.key} className={cn("rounded-xl border-2 p-3", s.accent)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", s.chip)}>
                            {s.label}
                          </span>
                          <span className="text-xs text-muted-foreground font-body">
                            {grouped[s.key].length} event{grouped[s.key].length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {grouped[s.key].length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-6 font-body">
                              No events in this stage.
                            </p>
                          ) : (
                            grouped[s.key].map(renderCard)
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: 4 vertical lanes */}
                <div className="hidden lg:grid grid-cols-4 gap-4">
                  {STAGES.map((s) => (
                    <div
                      key={s.key}
                      className={cn("rounded-xl border-2 p-3 flex flex-col min-h-[400px]", s.accent)}
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", s.chip)}>
                          {s.label}
                        </span>
                        <span className="text-xs text-muted-foreground font-body">
                          {grouped[s.key].length}
                        </span>
                      </div>
                      <div className="space-y-3 flex-1">
                        <AnimatePresence mode="popLayout">
                          {grouped[s.key].length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-10 font-body">
                              No events here.
                            </p>
                          ) : (
                            grouped[s.key].map(renderCard)
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ============ USERS ============ */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Promote user to admin
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="user@email.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={promoteToAdmin} className="w-full sm:w-auto">
                  Promote
                </Button>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-4 py-3 font-display text-xs uppercase">Name</th>
                      <th className="px-4 py-3 font-display text-xs uppercase">Email</th>
                      <th className="px-4 py-3 font-display text-xs uppercase">Roles</th>
                      <th className="px-4 py-3 font-display text-xs uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {busy && (
                      <tr>
                        <td colSpan={4} className="p-6">
                          <Skeleton className="h-16" />
                        </td>
                      </tr>
                    )}
                    {!busy && users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-border">
                        <td className="px-4 py-3 font-body">{u.full_name || "—"}</td>
                        <td className="px-4 py-3 font-body text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.length === 0 && (
                              <span className="text-xs text-muted-foreground">none</span>
                            )}
                            {u.roles.map((r) => (
                              <Badge
                                key={r}
                                variant={r === "superadmin" ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.roles.includes("admin") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => revokeAdmin(u.id, u.email)}
                              className="text-destructive gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Revoke admin
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ============ OVERRIDES ============ */}
          <TabsContent value="overrides" className="space-y-3 mt-4">
            {busy && <Skeleton className="h-40" />}
            {!busy && bookings.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">No bookings yet.</Card>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((b) => (
                <Card key={b.id} className="p-4 space-y-3">
                  <p className="font-display font-semibold line-clamp-1">{venueTitle(b.venue_id)}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 font-body">
                    <p>
                      {b.event_date || "No date"} · {b.event_type || "—"}
                    </p>
                    <p>
                      {b.guest_count || 0} guests · GHS {Number(b.total_estimate || 0).toLocaleString()}
                    </p>
                  </div>
                  <Select
                    value={b.workflow_status}
                    onValueChange={(v) => changeStage(b, v, v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_COLUMNS.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="customized">Customized</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBooking(b.id)}
                    className="w-full text-destructive gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Force delete
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Edit Sheet ===== */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && (setEditing(null), setEditForm(null))}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit Event
            </SheetTitle>
            <SheetDescription className="font-body">
              Overwrite any field from the planning wizard. Changes save directly to the backend.
            </SheetDescription>
          </SheetHeader>

          {editForm && (
            <div className="mt-6 space-y-6">
              {/* Basic */}
              <Section title="Basic">
                <Field label="Event Name">
                  <Input
                    value={editForm.eventName}
                    onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })}
                  />
                </Field>
                <Field label="Event Type">
                  <Select
                    value={editForm.event_type}
                    onValueChange={(v) => setEditForm({ ...editForm, event_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Guest Count">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.guest_count}
                    onChange={(e) => setEditForm({ ...editForm, guest_count: e.target.value })}
                  />
                </Field>
                <Field label="Event Date">
                  <Input
                    type="date"
                    value={editForm.event_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                  />
                </Field>
                <Field label="Total Estimate (GHS)">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.total_estimate}
                    onChange={(e) => setEditForm({ ...editForm, total_estimate: e.target.value })}
                  />
                </Field>
                <Field label="Pipeline Stage">
                  <Select
                    value={editForm.workflow_status}
                    onValueChange={(v) => setEditForm({ ...editForm, workflow_status: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquiry">Get Quote</SelectItem>
                      <SelectItem value="customized">Customized Event</SelectItem>
                      <SelectItem value="active">Active / Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Theme / Vision" full>
                  <Textarea
                    rows={2}
                    value={editForm.theme}
                    onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                  />
                </Field>
              </Section>

              {/* Design */}
              <Section title="Design & Theme">
                <Field label="Aesthetic">
                  <Select
                    value={editForm.aesthetic}
                    onValueChange={(v) => setEditForm({ ...editForm, aesthetic: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose aesthetic" /></SelectTrigger>
                    <SelectContent>
                      {AESTHETICS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Seating">
                  <Select
                    value={editForm.seating}
                    onValueChange={(v) => setEditForm({ ...editForm, seating: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose seating" /></SelectTrigger>
                    <SelectContent>
                      {SEATING.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Color Palette" full>
                  <Input
                    value={editForm.palette}
                    onChange={(e) => setEditForm({ ...editForm, palette: e.target.value })}
                    placeholder="e.g. Ivory & Gold"
                  />
                </Field>
              </Section>

              {/* Catering */}
              <Section title="Catering">
                <Field label="Meal Type">
                  <Select
                    value={editForm.mealType}
                    onValueChange={(v) => setEditForm({ ...editForm, mealType: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose meal" /></SelectTrigger>
                    <SelectContent>
                      {MEALS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Bar Package">
                  <Select
                    value={editForm.bar}
                    onValueChange={(v) => setEditForm({ ...editForm, bar: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose bar" /></SelectTrigger>
                    <SelectContent>
                      {BAR_OPTS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Dessert" full>
                  <Select
                    value={editForm.dessert}
                    onValueChange={(v) => setEditForm({ ...editForm, dessert: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose dessert" /></SelectTrigger>
                    <SelectContent>
                      {DESSERT_OPTS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Section>

              {/* Service */}
              <Section title="Service Staff">
                <Field label="Coordinators">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.coordinators}
                    onChange={(e) => setEditForm({ ...editForm, coordinators: e.target.value })}
                  />
                </Field>
                <Field label="Waiters">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.waiters}
                    onChange={(e) => setEditForm({ ...editForm, waiters: e.target.value })}
                  />
                </Field>
                <Field label="Security">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.security}
                    onChange={(e) => setEditForm({ ...editForm, security: e.target.value })}
                  />
                </Field>
                <Field label="A/V Techs">
                  <Input
                    type="number"
                    min={0}
                    value={editForm.avTechs}
                    onChange={(e) => setEditForm({ ...editForm, avTechs: e.target.value })}
                  />
                </Field>
              </Section>

              {/* Special */}
              <Section title="Special Provisions">
                <ToggleRow
                  label="VIP Handling"
                  checked={editForm.vipHandling}
                  onChange={(v) => setEditForm({ ...editForm, vipHandling: v })}
                />
                <ToggleRow
                  label="Valet Parking"
                  checked={editForm.valet}
                  onChange={(v) => setEditForm({ ...editForm, valet: v })}
                />
                <ToggleRow
                  label="Accessibility Support"
                  checked={editForm.accessibility}
                  onChange={(v) => setEditForm({ ...editForm, accessibility: v })}
                />
                <Field label="Custom Request" full>
                  <Textarea
                    rows={3}
                    value={editForm.customRequest}
                    onChange={(e) => setEditForm({ ...editForm, customRequest: e.target.value })}
                  />
                </Field>
              </Section>
            </div>
          )}

          <SheetFooter className="mt-6 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setEditForm(null);
              }}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving…" : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
      {title}
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) => (
  <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
    <Label className="text-xs font-body">{label}</Label>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
    <Label className="font-body text-sm">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default SuperAdmin;
