import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  User, Heart, CalendarDays, Star, MapPin, Clock, Building2, Bookmark, Edit2, Save,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-16">
    <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
    <p className="text-muted-foreground font-body text-sm mb-4">{text}</p>
    <Button asChild variant="outline" className="font-body">
      <Link to="/events">Browse Venues</Link>
    </Button>
  </div>
);

const Profile = () => {
  const { user, profile, isAgent, refreshProfile } = useAuth();
  const { events, bookings, favorites, reviews, isLiked } = useEvents();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

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
  }, [bookings, events, user]);

  const favoriteVenues = useMemo(() => {
    if (!user) return [];
    const ids = favorites.map(f => f.venue_id);
    return events.filter(e => ids.includes(e.id));
  }, [favorites, events, user]);

  const likedVenues = useMemo(() => {
    if (!user) return [];
    return events.filter(e => isLiked(e.id));
  }, [events, user, isLiked]);

  const myReviews = useMemo(() => {
    if (!user) return [];
    return reviews
      .filter(r => r.user_id === user.id)
      .map(r => ({ ...r, venue: events.find(e => e.id === r.venue_id) }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, events, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body mb-4">Sign in to view your profile</p>
          <Button onClick={() => navigate("/auth")} className="font-body">Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-body text-muted-foreground">Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="mt-1 max-w-xs"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="font-body gap-1.5">
                      <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setFullName(profile?.full_name || ""); }} className="font-body">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-foreground truncate">
                      {profile?.full_name || "Unnamed User"}
                    </h1>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(true); setFullName(profile?.full_name || ""); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isAgent && <Badge variant="secondary" className="text-xs">Agent</Badge>}
                    <span className="text-xs text-muted-foreground font-body">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            {[
              { label: "Bookings", value: myBookings.length, icon: CalendarDays },
              { label: "Wishlist", value: favoriteVenues.length, icon: Bookmark },
              { label: "Reviews", value: myReviews.length, icon: Star },
              { label: "Liked", value: likedVenues.length, icon: Heart },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="font-display text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-body">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="bookings" className="font-body text-xs gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="font-body text-xs gap-1.5">
              <Bookmark className="h-3.5 w-3.5" /> Wishlist
            </TabsTrigger>
            <TabsTrigger value="reviews" className="font-body text-xs gap-1.5">
              <Star className="h-3.5 w-3.5" /> Reviews
            </TabsTrigger>
            <TabsTrigger value="likes" className="font-body text-xs gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {myBookings.length > 0 ? (
              <div className="space-y-3">
                {myBookings.map((b, i) => (
                  <motion.div key={b.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                    className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {b.venue && (
                        <Link to={`/event/${b.venue.id}`} className="sm:w-40 h-28 sm:h-auto flex-shrink-0">
                          <img src={b.venue.image} alt={b.venue.title} className="w-full h-full object-cover" />
                        </Link>
                      )}
                      <div className="p-4 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/event/${b.venue_id}`} className="font-display font-semibold hover:text-primary transition-colors">
                            {b.venue?.title || "Unknown Venue"}
                          </Link>
                          <Badge variant={b.isExpired ? "destructive" : "secondary"} className="text-[10px] flex-shrink-0">
                            {b.isExpired ? "Expired" : b.status}
                          </Badge>
                        </div>
                        {b.venue && (
                          <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {b.venue.location}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {new Date(b.booked_at).toLocaleDateString()}
                          </span>
                          {b.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Until {new Date(b.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Building2} text="No bookings yet" />
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {favoriteVenues.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteVenues.map((e, i) => (
                  <motion.div key={e.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                    <EventCard event={e} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Bookmark} text="No saved venues" />
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {myReviews.length > 0 ? (
              <div className="space-y-3">
                {myReviews.map((r, i) => (
                  <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}
                    className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/event/${r.venue_id}`} className="font-display font-semibold hover:text-primary transition-colors">
                        {r.venue?.title || "Unknown Venue"}
                      </Link>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground font-body">{r.comment}</p>}
                    <p className="text-[11px] text-muted-foreground/60 font-body">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Star} text="No reviews yet" />
            )}
          </TabsContent>

          <TabsContent value="likes">
            {likedVenues.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {likedVenues.map((e, i) => (
                  <motion.div key={e.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                    <EventCard event={e} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Heart} text="No liked venues" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
