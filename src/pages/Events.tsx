import { useState, useMemo } from "react";
import { useEvents } from "@/context/EventContext";
import { EventCategory, categoryLabels, VenueType, venueTypeLabels } from "@/lib/types";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, CalendarDays, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const categories: (EventCategory | "all")[] = [
  "all", "conference", "workshop", "social", "networking", "celebration",
];

const venueTypes: (VenueType | "all")[] = [
  "all", "hall", "beach", "grounds", "rooftop", "garden", "ballroom",
];

const regions = ["all", "Greater Accra", "Eastern Region"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Events = () => {
  const { events } = useEvents();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");
  const [activeVenueType, setActiveVenueType] = useState<VenueType | "all">("all");
  const [activeRegion, setActiveRegion] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "booked">("all");

  const maxPrice = useMemo(() => Math.max(...events.map(e => e.price), 10000), [events]);

  const filtered = useMemo(() => {
    let result = events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.city.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || e.category === activeCategory;
      const matchesVenueType = activeVenueType === "all" || e.venueType === activeVenueType;
      const matchesRegion = activeRegion === "all" || e.region === activeRegion;
      const matchesPrice = e.price >= priceRange[0] && e.price <= priceRange[1];
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "available" && e.marketStatus === "available") ||
        (statusFilter === "booked" && e.marketStatus !== "available");
      return matchesSearch && matchesCategory && matchesVenueType && matchesRegion && matchesPrice && matchesStatus;
    });

    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [events, search, activeCategory, activeVenueType, activeRegion, priceRange, sortBy, statusFilter]);

  const hasActiveFilters = activeCategory !== "all" || activeVenueType !== "all" || activeRegion !== "all" || priceRange[0] > 0 || priceRange[1] < maxPrice || statusFilter !== "all";

  const clearFilters = () => {
    setActiveCategory("all");
    setActiveVenueType("all");
    setActiveRegion("all");
    setPriceRange([0, maxPrice]);
    setStatusFilter("all");
    setSortBy("default");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="bg-primary py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            Browse Venues
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-primary-foreground/80 font-body mt-3 max-w-lg mx-auto text-sm">
            Explore event rental spaces — halls, beaches, grounds, rooftops and more.
          </motion.p>
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {/* Search & Filter Toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search venues, locations, cities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body" />
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px] font-body text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="font-body text-xs gap-1.5"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-destructive" />}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="border border-border rounded-xl p-5 space-y-5 bg-card">
                {/* Category */}
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-2">Category</p>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                      <Button key={cat} size="sm" variant={activeCategory === cat ? "default" : "outline"} onClick={() => setActiveCategory(cat)} className="font-body text-xs capitalize">
                        {cat === "all" ? "All" : categoryLabels[cat]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Venue Type */}
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-2">Venue Type</p>
                  <div className="flex gap-2 flex-wrap">
                    {venueTypes.map((vt) => (
                      <Button key={vt} size="sm" variant={activeVenueType === vt ? "default" : "outline"} onClick={() => setActiveVenueType(vt)} className="font-body text-xs capitalize">
                        {vt === "all" ? "All" : venueTypeLabels[vt]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Region & Status */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-body font-medium text-muted-foreground mb-2">Region</p>
                    <Select value={activeRegion} onValueChange={setActiveRegion}>
                      <SelectTrigger className="font-body text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(r => (
                          <SelectItem key={r} value={r}>{r === "all" ? "All Regions" : r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-body font-medium text-muted-foreground mb-2">Availability</p>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="font-body text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="available">Available Only</SelectItem>
                        <SelectItem value="booked">Booked Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-2">
                    Price Range: GHS {priceRange[0].toLocaleString()} — GHS {priceRange[1].toLocaleString()}
                  </p>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="font-body text-xs gap-1 text-destructive">
                    <X className="h-3 w-3" /> Clear All Filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-muted-foreground font-body mb-6">{filtered.length} venue{filtered.length !== 1 ? "s" : ""} found</p>

        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <motion.div key={event.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground font-body">No venues found. Try adjusting your filters.</p>
          </div>
        )}
      </section>

      <footer className="border-t border-border bg-foreground text-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /><span className="font-display text-lg font-bold">Eventful Rentals</span></div>
            <div className="flex gap-8 text-sm font-body opacity-70">
              <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
              <Link to="/about" className="hover:opacity-100 transition-opacity">About</Link>
              <Link to="/events" className="hover:opacity-100 transition-opacity">Venues</Link>
              <Link to="/contact" className="hover:opacity-100 transition-opacity">Contact</Link>
            </div>
            <p className="text-xs font-body opacity-50">© 2026 Eventful Rentals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Events;
