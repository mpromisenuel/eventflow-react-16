import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Event, categoryColors, categoryLabels, venueTypeLabels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/context/EventContext";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const { toggleLike } = useEvents();
  const [currentImage, setCurrentImage] = useState(0);
  const images = event.images?.length > 0 ? event.images : [event.image];
  const eventDate = new Date(event.date + "T" + event.time);
  const spotsLeft = event.maxAttendees - event.attendees;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(event.id);
  };

  return (
    <Link to={`/event/${event.id}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden">
          <img src={images[currentImage]} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? "bg-primary-foreground w-3" : "bg-primary-foreground/50"}`} />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className={`${categoryColors[event.category]} border-none font-body text-xs`}>
              {categoryLabels[event.category]}
            </Badge>
            <Badge variant="outline" className="bg-background/70 font-body text-[10px] border-none">
              {venueTypeLabels[event.venueType]}
            </Badge>
          </div>

          <button onClick={handleLike} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors">
            <Heart className={`h-4 w-4 transition-colors ${event.liked ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-lg font-semibold text-primary-foreground leading-tight line-clamp-2">{event.title}</h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2 font-body">{event.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round(event.rating) ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
              ))}
              <span className="text-xs text-muted-foreground font-body ml-1">{event.rating} ({event.ratingCount})</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-body">
              <Heart className={`h-3 w-3 ${event.liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              <span className="text-muted-foreground">{event.likes}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground font-body">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span>Available from {format(eventDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Capacity: {event.maxAttendees} · {event.orders} bookings</span>
              </div>
              <span className="font-semibold text-primary text-sm">GHS {event.price}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
