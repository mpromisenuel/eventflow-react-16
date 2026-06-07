import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar, Users } from "lucide-react";

type T = {
  id: string;
  event_type: string | null;
  event_date: string | null;
  guest_count: number | null;
  workflow_status: string;
  addons: any;
  venues?: { title: string | null } | null;
};

const TicketsPanel = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("id, event_type, event_date, guest_count, workflow_status, addons, venues!left(title)")
        .eq("user_id", user.id)
        .in("workflow_status", ["approved", "active", "ongoing", "deposit_paid", "completed"])
        .order("event_date", { ascending: true });
      setTickets((data as any) || []);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Ticket className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-body text-sm">
          You don't have any active tickets yet. Once your event is approved by an admin,
          your QR ticket will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((t) => {
        const name = t.addons?.eventName || t.venues?.title || t.event_type || "Event";
        const payload = JSON.stringify({ booking_id: t.id, user: user?.id });
        return (
          <Card key={t.id} className="overflow-hidden">
            <CardHeader className="pb-3 bg-primary text-primary-foreground">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-base line-clamp-2">{name}</CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {t.workflow_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-center bg-white p-3 rounded">
                <QRCodeSVG value={payload} size={140} level="M" />
              </div>
              <div className="text-xs font-body space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t.event_date ? new Date(t.event_date).toLocaleDateString() : "Date TBD"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t.guest_count || 0} guests
                </div>
                <p className="font-mono text-[10px] truncate pt-1">#{t.id}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TicketsPanel;
