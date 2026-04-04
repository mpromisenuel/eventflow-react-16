import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Favorites = () => {
  const { events, favorites } = useEvents();
  const { user } = useAuth();

  const favoriteVenues = useMemo(() => {
    if (!user) return [];
    const favVenueIds = favorites.map(f => f.venue_id);
    return events.filter(e => favVenueIds.includes(e.id));
  }, [user, favorites, events]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Wishlist</h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            {favoriteVenues.length} saved venue{favoriteVenues.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {favoriteVenues.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteVenues.map((event, i) => (
              <motion.div key={event.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body mb-4">
              {user ? "You haven't saved any venues yet" : "Sign in to save venues to your wishlist"}
            </p>
            <Button asChild className="font-body gap-2">
              <Link to="/events">Browse Venues</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
