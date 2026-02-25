import { useParams, Link, useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { categoryColors, categoryLabels } from "@/lib/types";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getEvent, deleteEvent } = useEvents();
  const navigate = useNavigate();
  const event = getEvent(id || "");

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-2xl">Event not found</h2>
          <Link to="/" className="text-primary mt-4 inline-block font-body">
            ← Back to events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date + "T" + event.time);
  const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);

  const handleDelete = () => {
    deleteEvent(event.id);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero image */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <Badge className={`${categoryColors[event.category]} border-none mb-3 font-body`}>
            {categoryLabels[event.category]}
          </Badge>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground max-w-3xl">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-3">About this event</h2>
              <p className="text-muted-foreground font-body leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                <div className="font-body">
                  <p className="font-medium text-sm">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(eventDate, "h:mm a")}
                  </p>
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
                <p className="text-xs text-muted-foreground font-body">
                  {event.maxAttendees - event.attendees} spots remaining
                </p>
              </div>

              <Button className="w-full font-body">RSVP Now</Button>
              <Button
                variant="outline"
                className="w-full font-body text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
