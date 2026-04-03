import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  CalendarDays, MapPin, Building2, Heart, Clock,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const MyBookings = () => {
  const { events, bookings } = useEvents();
  const { user } = useAuth();

  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings
      .filter(b => b.user_id === user.id)
      .map(b => ({
        ...b,
        venue: events.find(e => e.id === b.venue_id),
        isExpired: b.expires_at ? new Date(b.expires_at) < new Date() : false,
      }))
      .sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime());
  }, [user, bookings, events]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            {myBookings.length} booking{myBookings.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {myBookings.length > 0 ? (
          <div className="space-y-4">
            {myBookings.map((b, i) => (
              <motion.div
                key={b.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {b.venue && (
                    <Link to={`/event/${b.venue.id}`} className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                      <img src={b.venue.image} alt={b.venue.title} className="w-full h-full object-cover" />
                    </Link>
                  )}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/event/${b.venue_id}`} className="font-display text-lg font-semibold hover:text-primary transition-colors">
                          {b.venue?.title || "Unknown Venue"}
                        </Link>
                        {b.venue && (
                          <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {b.venue.location}
                          </p>
                        )}
                      </div>
                      <Badge variant={b.isExpired ? "destructive" : b.status === "active" ? "secondary" : "outline"} className="text-xs flex-shrink-0">
                        {b.isExpired ? "Expired" : b.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Booked: {new Date(b.booked_at).toLocaleDateString()}
                      </span>
                      {b.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(b.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {b.venue && (
                      <p className="text-sm font-body font-semibold text-primary">
                        GHS {b.venue.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body mb-4">You haven't booked any venues yet</p>
            <Button asChild className="font-body gap-2">
              <Link to="/events">Browse Venues</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
