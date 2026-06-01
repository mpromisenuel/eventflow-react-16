import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Vendor { id: string; name: string; category: string; phone: string|null; email: string|null; website: string|null; notes: string|null; user_id: string; }
interface Bk { id: string; venue_id: string; event_date: string|null; event_type: string|null; workflow_status: string; }
interface Task { id: string; booking_id: string; title: string; due_at: string|null; completed: boolean; sort_order: number; }
interface EV { id: string; booking_id: string; vendor_id: string; role: string|null; }

const VENDOR_CATEGORIES = ["photographer","decorator","caterer","baker","sound","security","other"];

const Vendors = () => {
  const { user, isAdmin, isAgent, loading } = useAuth();
  const { events } = useEvents();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bookings, setBookings] = useState<Bk[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evs, setEvs] = useState<EV[]>([]);
  const [form, setForm] = useState({ name: "", category: "other", phone: "", email: "", website: "", notes: "" });
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [newTask, setNewTask] = useState({ title: "", due: "" });
  const [assign, setAssign] = useState({ vendor_id: "", role: "" });

  const refresh = async () => {
    const [v, b, t, e] = await Promise.all([
      supabase.from("vendors" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, venue_id, event_date, event_type, workflow_status").order("event_date"),
      supabase.from("event_tasks" as any).select("*").order("sort_order"),
      supabase.from("event_vendors" as any).select("*"),
    ]);
    setVendors((v.data as any) || []);
    setBookings((b.data as any) || []);
    setTasks((t.data as any) || []);
    setEvs((e.data as any) || []);
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin && !isAgent) return <Navigate to="/" replace />;

  const addVendor = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("vendors" as any).insert({ ...form, user_id: user.id } as any);
    if (error) return toast.error(error.message);
    setForm({ name: "", category: "other", phone: "", email: "", website: "", notes: "" });
    toast.success("Vendor added");
    refresh();
  };

  const deleteVendor = async (id: string) => {
    await supabase.from("vendors" as any).delete().eq("id", id);
    refresh();
  };

  const addTask = async () => {
    if (!selectedBooking || !newTask.title) return;
    const { error } = await supabase.from("event_tasks" as any).insert({
      booking_id: selectedBooking,
      title: newTask.title,
      due_at: newTask.due ? new Date(newTask.due).toISOString() : null,
      created_by: user.id,
      sort_order: tasks.filter(t => t.booking_id === selectedBooking).length,
    } as any);
    if (error) return toast.error(error.message);
    setNewTask({ title: "", due: "" });
    refresh();
  };

  const toggleTask = async (t: Task) => {
    await supabase.from("event_tasks" as any).update({ completed: !t.completed } as any).eq("id", t.id);
    refresh();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("event_tasks" as any).delete().eq("id", id);
    refresh();
  };

  const assignVendor = async () => {
    if (!selectedBooking || !assign.vendor_id) return;
    const { error } = await supabase.from("event_vendors" as any).insert({
      booking_id: selectedBooking,
      vendor_id: assign.vendor_id,
      role: assign.role || null,
      created_by: user.id,
    } as any);
    if (error) return toast.error(error.message);
    setAssign({ vendor_id: "", role: "" });
    refresh();
  };

  const unassign = async (id: string) => {
    await supabase.from("event_vendors" as any).delete().eq("id", id);
    refresh();
  };

  const bookingLabel = (b: Bk) => {
    const v = events.find(e => e.id === b.venue_id);
    return `${v?.title || "Venue"} — ${b.event_date || "no date"} (${b.workflow_status})`;
  };

  const bookingTasks = tasks.filter(t => t.booking_id === selectedBooking);
  const bookingVendors = evs.filter(e => e.booking_id === selectedBooking);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="font-display text-3xl font-bold mb-2">Vendors & Tasks</h1>
        <p className="text-muted-foreground mb-6">Manage suppliers and event-day checklists.</p>

        <Tabs defaultValue="directory">
          <TabsList>
            <TabsTrigger value="directory">Vendor Directory</TabsTrigger>
            <TabsTrigger value="event">Per-Event Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Add Vendor</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{VENDOR_CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Website</Label><Input value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
                <div className="sm:col-span-2"><Button onClick={addVendor}><Plus className="h-4 w-4 mr-1"/>Save Vendor</Button></div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <Card key={v.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{v.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={()=>deleteVendor(v.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    {v.phone && <p className="text-sm">📞 {v.phone}</p>}
                    {v.email && <p className="text-sm">✉️ {v.email}</p>}
                    {v.website && <p className="text-sm truncate">🔗 {v.website}</p>}
                    {v.notes && <p className="text-xs text-muted-foreground pt-1">{v.notes}</p>}
                  </CardContent>
                </Card>
              ))}
              {vendors.length === 0 && <p className="text-muted-foreground text-sm">No vendors yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="event" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Select an event</CardTitle></CardHeader>
              <CardContent>
                <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                  <SelectTrigger><SelectValue placeholder="Pick a booking"/></SelectTrigger>
                  <SelectContent>
                    {bookings.map(b => <SelectItem key={b.id} value={b.id}>{bookingLabel(b)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedBooking && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Task Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="New task…" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}/>
                      <Input type="datetime-local" value={newTask.due} onChange={e=>setNewTask({...newTask,due:e.target.value})}/>
                      <Button onClick={addTask}><Plus className="h-4 w-4"/></Button>
                    </div>
                    <ul className="space-y-2">
                      {bookingTasks.map(t => (
                        <li key={t.id} className="flex items-center gap-2 p-2 rounded border">
                          <Checkbox checked={t.completed} onCheckedChange={()=>toggleTask(t)}/>
                          <div className="flex-1">
                            <p className={t.completed ? "line-through text-muted-foreground text-sm" : "text-sm"}>{t.title}</p>
                            {t.due_at && <p className="text-[11px] text-muted-foreground">Due {format(new Date(t.due_at),"PPp")}</p>}
                          </div>
                          <Button size="icon" variant="ghost" onClick={()=>deleteTask(t.id)}><Trash2 className="h-4 w-4"/></Button>
                        </li>
                      ))}
                      {bookingTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Assigned Vendors</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={assign.vendor_id} onValueChange={v=>setAssign({...assign,vendor_id:v})}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Vendor"/></SelectTrigger>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Role" value={assign.role} onChange={e=>setAssign({...assign,role:e.target.value})}/>
                      <Button onClick={assignVendor}><Plus className="h-4 w-4"/></Button>
                    </div>
                    <ul className="space-y-2">
                      {bookingVendors.map(ev => {
                        const v = vendors.find(x=>x.id===ev.vendor_id);
                        return (
                          <li key={ev.id} className="flex items-center gap-2 p-2 rounded border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{v?.name || "Vendor"}</p>
                              <p className="text-[11px] text-muted-foreground">{ev.role || v?.category}</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={()=>unassign(ev.id)}><Trash2 className="h-4 w-4"/></Button>
                          </li>
                        );
                      })}
                      {bookingVendors.length === 0 && <p className="text-sm text-muted-foreground">None assigned.</p>}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Vendors;
