import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WORKFLOW_COLUMNS } from "@/lib/packages";
import { Shield, Trash2, UserPlus, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: string[];
}

interface Bk {
  id: string;
  venue_id: string;
  workflow_status: string;
  event_date: string | null;
  event_type: string | null;
  guest_count: number | null;
  total_estimate: number | null;
  user_id: string;
}

const SuperAdmin = () => {
  const { user, isSuperAdmin, loading } = useAuth();
  const { events } = useEvents();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [bookings, setBookings] = useState<Bk[]>([]);
  const [busy, setBusy] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");

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
          supabase.from("bookings").select("id, venue_id, workflow_status, event_date, event_type, guest_count, total_estimate, user_id"),
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
    if (email === "mpromisenuel@gmail.com") return toast.error("Cannot revoke the root superadmin");
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin" as any);
      if (error) throw error;
      toast.success("Admin access revoked");
      fetchAll();
    } catch (e: any) {
      toast.error("Failed to revoke", { description: e?.message });
    }
  };

  const overrideStatus = async (b: Bk, key: string) => {
    try {
      const { error } = await supabase.from("bookings").update({ workflow_status: key } as any).eq("id", b.id);
      if (error) throw error;
      toast.success(`Booking moved to ${key}`);
      fetchAll();
    } catch (e: any) {
      toast.error("Override failed", { description: e?.message });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Force-delete this booking?")) return;
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Booking deleted");
      fetchAll();
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message });
    }
  };

  const stats = {
    users: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    venues: events.length,
    bookings: bookings.length,
    revenue: bookings.reduce((s, b) => s + Number(b.total_estimate || 0), 0),
  };

  const venueTitle = (id: string) => events.find((e) => e.id === id)?.title || "Unknown venue";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Superadmin Console</h1>
            <p className="text-sm text-muted-foreground font-body">Global control over users, bookings & analytics.</p>
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

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-2 sm:inline-flex sm:w-auto w-full">
            <TabsTrigger value="users">Admins & Users</TabsTrigger>
            <TabsTrigger value="bookings">Booking Overrides</TabsTrigger>
          </TabsList>

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
                <Button onClick={promoteToAdmin} className="w-full sm:w-auto">Promote</Button>
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
                      <tr><td colSpan={4} className="p-6"><Skeleton className="h-16" /></td></tr>
                    )}
                    {!busy && users.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users found.</td></tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-border">
                        <td className="px-4 py-3 font-body">{u.full_name || "—"}</td>
                        <td className="px-4 py-3 font-body text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                            {u.roles.map((r) => (
                              <Badge key={r} variant={r === "superadmin" ? "default" : "secondary"} className="text-[10px]">{r}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.roles.includes("admin") && (
                            <Button size="sm" variant="ghost" onClick={() => revokeAdmin(u.id, u.email)} className="text-destructive gap-1">
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

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {busy && <Skeleton className="h-40" />}
            {!busy && bookings.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">No bookings yet.</Card>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((b) => (
                <Card key={b.id} className="p-4 space-y-3">
                  <p className="font-display font-semibold line-clamp-1">{venueTitle(b.venue_id)}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 font-body">
                    <p>{b.event_date || "No date"} · {b.event_type || "—"}</p>
                    <p>{b.guest_count || 0} guests · GHS {Number(b.total_estimate || 0).toLocaleString()}</p>
                  </div>
                  <Select value={b.workflow_status} onValueChange={(v) => overrideStatus(b, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_COLUMNS.map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => deleteBooking(b.id)} className="w-full text-destructive gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Force delete
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdmin;
