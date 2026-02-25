import { useState, useMemo } from "react";
import { useEvents } from "@/context/EventContext";
import { EventCategory, categoryLabels } from "@/lib/types";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const categories: (EventCategory | "all")[] = [
  "all",
  "conference",
  "workshop",
  "social",
  "networking",
  "celebration",
];

const Index = () => {
  const { events } = useEvents();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || e.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, search, activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
              Create moments
              <br />
              that <span className="text-gradient">matter</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 font-body max-w-md">
              Plan, discover, and attend extraordinary events. From intimate
              workshops to grand celebrations.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="glass rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-body"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? "default" : "secondary"}
                onClick={() => setActiveCategory(cat)}
                className="font-body text-xs capitalize"
              >
                {cat === "all" ? "All" : categoryLabels[cat]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Events grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Upcoming Events
            </h2>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <div key={event.id} style={{ animationDelay: `${i * 100}ms` }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground font-body">
              No events found. Try adjusting your filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
