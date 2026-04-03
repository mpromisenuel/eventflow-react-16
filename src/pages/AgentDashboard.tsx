import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  CalendarDays, Plus, LayoutGrid, Building2, Users, MapPin, BarChart3,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const AgentDashboard = () => {
  const { events, bookings } = useEvents();
  const { user, profile } = useAuth();

  // In a full app, venues would be filtered by agent_user_id
  // For now, show all venues as manageable by agents
  const myVenues = events;
  const activeBookings = bookings.filter(b => b.status === "active");
  const totalRevenue = myVenues.reduce((sum, v) => {
    const isBooked = bookings.some(b => b.venue_id === v.id && b.status === "active");
    return sum + (isBooked ? v.price : 0);
  }, 0);

  const stats = [
    { icon: Building2, label: "Total Venues", value: myVenues.length },
    { icon: CalendarDays, label: "Active Bookings", value: activeBookings.length },
    { icon: BarChart3, label: "Revenue (GHS)", value: totalRevenue.toLocaleString() },
    { icon: Users, label: "Total Capacity", value: myVenues.reduce((s, v) => s + v.maxAttendees, 0) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Agent Dashboard
              </h1>
              <p className="text-muted-foreground font-body text-sm mt-1">
                Welcome back, {profile?.full_name || "Agent"}
              </p>
            </div>
            <Button asChild className="font-body gap-2">
              <Link to="/create-event">
                <Plus className="h-4 w-4" /> List New Venue
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Bookings */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mb-10"
        >
          <h2 className="font-display text-xl font-semibold mb-4">Recent Bookings</h2>
          {activeBookings.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Venue</th>
                    <th className="text-left p-3 font-medium">Booked At</th>
                    <th className="text-left p-3 font-medium">Expires</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBookings.map((b) => {
                    const venue = events.find(e => e.id === b.venue_id);
                    const isExpired = b.expires_at && new Date(b.expires_at) < new Date();
                    return (
                      <tr key={b.id} className="border-t border-border">
                        <td className="p-3">
                          <Link to={`/event/${b.venue_id}`} className="text-primary hover:underline">
                            {venue?.title || b.venue_id}
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(b.booked_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3">
                          <Badge variant={isExpired ? "destructive" : "secondary"} className="text-xs">
                            {isExpired ? "Expired" : "Active"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground font-body text-sm">No active bookings yet.</p>
          )}
        </motion.div>

        {/* My Venues */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <h2 className="font-display text-xl font-semibold mb-4">My Venues</h2>
          {myVenues.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myVenues.map((event, i) => (
                <motion.div key={event.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-body mb-4">You haven't listed any venues yet</p>
              <Button asChild className="font-body gap-2">
                <Link to="/create-event"><Plus className="h-4 w-4" /> List Your First Venue</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AgentDashboard;
