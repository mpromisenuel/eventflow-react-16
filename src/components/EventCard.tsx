import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Event, categoryColors, categoryLabels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const eventDate = new Date(event.date + "T" + event.time);
  const spotsLeft = event.maxAttendees - event.attendees;

  return (
    <Link to={`/event/${event.id}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          <Badge
            className={`absolute top-3 left-3 ${categoryColors[event.category]} border-none font-body text-xs`}
          >
            {categoryLabels[event.category]}
          </Badge>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-lg font-semibold text-primary-foreground leading-tight line-clamp-2">
              {event.title}
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2 font-body">
            {event.description}
          </p>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground font-body">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span>{format(eventDate, "MMM d, yyyy · h:mm a")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>
                {event.attendees} attending · {spotsLeft} spots left
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
