import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { EventCategory, categoryLabels } from "@/lib/types";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search, CalendarDays, Users, MapPin, Sparkles, ArrowRight, LayoutGrid, Clock, Shield, Zap,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const categories: (EventCategory | "all")[] = [
  "all", "conference", "workshop", "social", "networking", "celebration",
];

const features = [
  { icon: LayoutGrid, title: "Venues for Every Occasion", description: "From intimate gatherings to large-scale celebrations — find the perfect space" },
  { icon: Shield, title: "Verified Listings & Trusted Agents", description: "Every venue is reviewed so you can book with confidence" },
  { icon: Sparkles, title: "Halls, Beaches, Gardens & More", description: "Browse a wide range of venue types across Ghana" },
  { icon: Zap, title: "Instant Enquiries & Quick Booking", description: "Connect with venue owners and secure your date in minutes" },
];

const stats = [
  { value: "120+", label: "Venues Listed" },
  { value: "3.5K", label: "Happy Renters" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

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
      <section className="relative grid lg:grid-cols-2 min-h-[520px]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-primary flex flex-col justify-center px-8 md:px-16 py-16 lg:py-24 relative"
        >
          <h1 className="font-display text-4xl md:text-5xl xl:text-6xl font-bold text-primary-foreground leading-tight">
            Find &amp; Rent<br />The Perfect Event<br />Venue
          </h1>
          <p className="text-primary-foreground/80 font-body mt-6 max-w-md text-base leading-relaxed">
            Discover stunning event spaces across Ghana — halls, beaches, gardens, rooftops and spacious grounds. List your venue or find the ideal rental for your next occasion.
          </p>
          <div className="flex items-center gap-6 mt-8">
            <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 font-body">
              <Clock className="h-4 w-4" /> How it works
            </Button>
            <button className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-body text-sm group">
              Browse Venues
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute bottom-0 right-0 flex bg-accent text-accent-foreground rounded-tl-xl overflow-hidden">
            {stats.map((stat, i) => (
              <div key={i} className={`px-6 py-4 flex items-center gap-3 ${i > 0 ? "border-l border-primary-foreground/20" : ""}`}>
                <span className="font-display text-2xl font-bold">{stat.value}</span>
                <span className="text-xs font-body leading-tight text-primary-foreground/80">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block relative overflow-hidden"
        >
          <img src={heroBg} alt="Event venue space" className="h-full w-full object-cover" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-display text-2xl md:text-3xl font-semibold text-center mb-12">
          Why Rent With Eventful
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              whileHover={{ y: -4 }}
              className="border border-border rounded-lg p-6 text-center hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-sm font-semibold mb-2 leading-snug">{f.title}</h3>
              <p className="text-xs text-muted-foreground font-body">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold">Available Venues</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{filtered.length} venue{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search venues or locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 font-body" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button key={cat} size="sm" variant={activeCategory === cat ? "default" : "outline"} onClick={() => setActiveCategory(cat)} className="font-body text-xs capitalize">
                    {cat === "all" ? "All" : categoryLabels[cat]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((event, i) => (
                <motion.div
                  key={event.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground font-body">No venues found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-0 rounded-xl overflow-hidden"
        >
          <div className="relative h-64 md:h-auto">
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" alt="Event venue" className="h-full w-full object-cover" />
          </div>
          <div className="bg-primary flex flex-col justify-center p-8 md:p-12">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary-foreground leading-snug">
              Have a Venue?<br />List It &amp; Start Earning
            </h2>
            <p className="text-primary-foreground/70 font-body mt-4 text-sm max-w-sm">
              Reach thousands of event organisers looking for the perfect space. Listing your venue is quick and free.
            </p>
            <div className="mt-6">
              <Button variant="secondary" className="font-body gap-2" asChild>
                <Link to="/create-event">List Your Venue <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span className="font-display text-lg font-bold">Eventful Rentals</span>
            </div>
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

export default Index;
