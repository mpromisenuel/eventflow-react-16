import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { categoryColors, categoryLabels } from "@/lib/types";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarDays, MapPin, Users, Trash2, Heart, Star,
  ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

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
          <h2 className="font-display text-2xl">Event not found</h2>
          <Link to="/" className="text-primary mt-4 inline-block font-body">← Back to events</Link>
        </div>
      </div>
    );
  }

  const images = event.images?.length > 0 ? event.images : [event.image];
  const eventDate = new Date(event.date + "T" + event.time);
  const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);
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
    toast({ title: "Thanks for rating!", description: `You gave this event ${rating} stars.` });
  };

  const handleOrder = () => {
    if (quantity > spotsLeft) {
      toast({ title: "Not enough spots", description: `Only ${spotsLeft} spots remaining.`, variant: "destructive" });
      return;
    }
    orderEvent(event.id, quantity);
    toast({ title: "Order placed!", description: `You've booked ${quantity} ticket${quantity > 1 ? "s" : ""} for $${quantity * event.price}.` });
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image carousel */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img src={images[currentImage]} alt={event.title} className="h-full w-full object-cover transition-all duration-500" />
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
          <Badge className={`${categoryColors[event.category]} border-none mb-3 font-body`}>
            {categoryLabels[event.category]}
          </Badge>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground max-w-3xl">
            {event.title}
          </h1>
        </div>
      </div>

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
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold mb-3">About this event</h2>
              <p className="text-muted-foreground font-body leading-relaxed">{event.description}</p>
            </div>

            {/* Rating section */}
            <div className="border border-border rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Rate This Event</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={hasRated}
                      onMouseEnter={() => !hasRated && setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="transition-transform hover:scale-110 disabled:cursor-default"
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
                    </button>
                  ))}
                </div>
                <div className="font-body">
                  <span className="text-lg font-semibold">{event.rating}</span>
                  <span className="text-sm text-muted-foreground"> / 5 ({event.ratingCount} reviews)</span>
                </div>
              </div>
              {hasRated && (
                <p className="text-sm text-primary font-body mt-2">Thank you for your rating!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
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
                <span className="text-2xl font-display font-bold text-primary">${event.price}</span>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                <div className="font-body">
                  <p className="font-medium text-sm">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(eventDate, "h:mm a")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <p className="font-body text-sm font-medium">{event.location}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="font-body text-sm">
                    <span className="font-medium">{event.attendees}</span> / {event.maxAttendees} attending
                  </p>
                </div>
                <Progress value={fillPercent} className="h-2" />
                <p className="text-xs text-muted-foreground font-body">{spotsLeft} spots remaining</p>
              </div>

              {/* Order section */}
              <div className="border-t border-border pt-5 space-y-4">
                <h3 className="font-display text-sm font-semibold">Book Tickets</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-body font-semibold text-lg w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.min(spotsLeft, quantity + 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-body ml-auto">
                    Total: <span className="font-semibold text-foreground">${quantity * event.price}</span>
                  </span>
                </div>
                <Button className="w-full font-body gap-2" onClick={handleOrder} disabled={spotsLeft === 0}>
                  <ShoppingCart className="h-4 w-4" />
                  {spotsLeft === 0 ? "Sold Out" : "Place Order"}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full font-body text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
