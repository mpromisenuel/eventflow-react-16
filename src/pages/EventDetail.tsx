import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { categoryColors, categoryLabels, venueTypeLabels } from "@/lib/types";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft, CalendarDays, MapPin, Users, Trash2, Heart, Star,
  ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus,
  Phone, Globe, Building2, Tag, Clock, CheckCircle2, AlertCircle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getEvent, deleteEvent, toggleLike, rateEvent, orderEvent } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();
  const event = getEvent(id || "");

  const [currentImage, setCurrentImage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [hasRated, setHasRated] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-2xl">Venue not found</h2>
          <Link to="/" className="text-primary mt-4 inline-block font-body">← Back to venues</Link>
        </div>
      </div>
    );
  }

  const images = event.images?.length > 0 ? event.images : [event.image];
  const eventDate = new Date(event.date + "T" + event.time);
  const fillPercent = Math.round((event.orders / event.maxAttendees) * 100);
  const spotsLeft = event.maxAttendees - event.attendees;

  const handleDelete = () => {
    deleteEvent(event.id);
    navigate("/");
  };

  const handleRate = (rating: number) => {
    if (hasRated) return;
    setUserRating(rating);
    rateEvent(event.id, rating);
    setHasRated(true);
    toast({ title: "Thanks for rating!", description: `You gave this venue ${rating} stars.` });
  };

  const handleOrder = () => {
    if (quantity > spotsLeft) {
      toast({ title: "Not enough availability", description: `Only ${spotsLeft} slots remaining.`, variant: "destructive" });
      return;
    }
    orderEvent(event.id, quantity);
    toast({ title: "Booking confirmed!", description: `You've booked ${quantity} slot${quantity > 1 ? "s" : ""} for GHS ${quantity * event.price}.` });
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-64 md:h-[420px] overflow-hidden"
      >
        <motion.img
          key={currentImage}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={images[currentImage]}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent" />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImage ? "bg-primary-foreground w-6" : "bg-primary-foreground/50"}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${categoryColors[event.category]} border-none font-body`}>
              {categoryLabels[event.category]}
            </Badge>
            <Badge variant="outline" className="bg-background/80 font-body text-xs">
              {venueTypeLabels[event.venueType]}
            </Badge>
            <Badge
              variant="outline"
              className={`font-body text-xs ${
                event.marketStatus === "available"
                  ? "bg-primary/20 text-primary-foreground border-primary/30"
                  : "bg-destructive/20 text-primary-foreground border-destructive/30"
              }`}
            >
              {event.marketStatus === "available" ? "Available" : event.marketStatus === "booked" ? "Booked" : "Sold Out"}
            </Badge>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground max-w-3xl">
            {event.title}
          </h1>
        </div>
      </motion.div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10">
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to venues
        </Link>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <h2 className="font-display text-xl font-semibold mb-3">About this venue</h2>
              <p className="text-muted-foreground font-body leading-relaxed">{event.description}</p>
            </motion.div>

            {/* Property Details */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Property Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm font-body">
                {event.propertyRef && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Property Ref:</span>
                    <span className="font-medium">{event.propertyRef}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{event.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{venueTypeLabels[event.venueType]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{event.marketStatus}</span>
                </div>
              </div>
            </motion.div>

            {/* Location & Address */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Location Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm font-body">
                <div>
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-medium">{event.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">City / Area</p>
                  <p className="font-medium">{event.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Region</p>
                  <p className="font-medium">{event.region}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Country</p>
                  <p className="font-medium">Ghana</p>
                </div>
              </div>
            </motion.div>

            {/* What's Included */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">What's Included</h3>
              <div className="flex flex-wrap gap-2">
                {event.inclusions.map((item, i) => (
                  <Badge key={i} variant="secondary" className="font-body text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> {item}
                  </Badge>
                ))}
              </div>
              {event.extraFees && event.extraFees.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-body text-sm font-semibold mb-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-gold" /> Extra Fees
                    </h4>
                    <ul className="space-y-1.5">
                      {event.extraFees.map((fee, i) => (
                        <li key={i} className="text-sm text-muted-foreground font-body flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                          {fee}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </motion.div>

            {/* Amenities */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">Amenities & Facilities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.amenities.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-2 text-sm font-body p-2 rounded-lg bg-muted/50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    {a}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Rating section */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="border border-border rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Rate This Venue</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={hasRated}
                      onMouseEnter={() => !hasRated && setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="transition-transform disabled:cursor-default"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoverRating || userRating)
                            ? "fill-gold text-gold"
                            : star <= Math.round(event.rating)
                            ? "fill-gold/30 text-gold/50"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <div className="font-body">
                  <span className="text-lg font-semibold">{event.rating}</span>
                  <span className="text-sm text-muted-foreground"> / 5 ({event.ratingCount} reviews)</span>
                </div>
              </div>
              {hasRated && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-primary font-body mt-2">
                  Thank you for your rating!
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 sticky top-20">
              {/* Like */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLike(event.id)}
                  className={`font-body gap-2 ${event.liked ? "border-destructive text-destructive" : ""}`}
                >
                  <Heart className={`h-4 w-4 ${event.liked ? "fill-destructive" : ""}`} />
                  {event.liked ? "Liked" : "Like"} ({event.likes})
                </Button>
                <span className="text-2xl font-display font-bold text-primary">GHS {event.price}</span>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                <div className="font-body">
                  <p className="font-medium text-sm">Available from {format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">Rental period negotiable</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="font-body">
                  <p className="text-sm font-medium">{event.location}</p>
                  <p className="text-xs text-muted-foreground">{event.city}, {event.region}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="font-body text-sm">
                    Capacity: <span className="font-medium">{event.maxAttendees}</span> · {event.orders} bookings
                  </p>
                </div>
                <Progress value={fillPercent} className="h-2" />
                <p className="text-xs text-muted-foreground font-body">{spotsLeft > 0 ? `${spotsLeft} slots available` : "Fully booked"}</p>
              </div>

              {/* Booking section */}
              <div className="border-t border-border pt-5 space-y-4">
                <h3 className="font-display text-sm font-semibold">Book This Venue</h3>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-body font-semibold text-lg w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(spotsLeft, quantity + 1))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-body ml-auto">
                    Total: <span className="font-semibold text-foreground">GHS {quantity * event.price}</span>
                  </span>
                </div>
                <Button className="w-full font-body gap-2" onClick={handleOrder} disabled={spotsLeft === 0}>
                  <ShoppingCart className="h-4 w-4" />
                  {spotsLeft === 0 ? "Fully Booked" : "Book Now"}
                </Button>
              </div>

              <Separator />

              {/* Agent Info */}
              {event.agentName && (
                <div className="space-y-3">
                  <h3 className="font-display text-sm font-semibold">Listed By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-body">
                      <p className="text-sm font-medium">{event.agentName}</p>
                      {event.agentPhone && (
                        <a href={`tel:${event.agentPhone}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                          <Phone className="h-3 w-3" /> {event.agentPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  {event.agentWebsite && (
                    <a
                      href={event.agentWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-body"
                    >
                      <Globe className="h-3 w-3" /> Visit Website
                    </a>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full font-body text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Remove Listing
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
