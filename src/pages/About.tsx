import Navbar from "@/components/Navbar";
import { CalendarDays, Users, Award, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const team = [
  { name: "Sarah Chen", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" },
  { name: "Marcus Johnson", role: "Head of Partnerships", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { name: "Amira Patel", role: "Creative Director", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
  { name: "David Kim", role: "Tech Lead", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
];

const values = [
  { icon: Heart, title: "Connecting Spaces & People", description: "We believe every great event starts with the perfect venue. We connect venue owners with organisers seamlessly." },
  { icon: Users, title: "Community First", description: "Building bridges between venue owners and event organisers through trust, transparency and shared success." },
  { icon: Award, title: "Quality Venues Only", description: "Every listing is reviewed to ensure renters get accurate information and exceptional spaces." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="bg-primary py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display text-4xl md:text-5xl xl:text-6xl font-bold text-primary-foreground">
            About Eventful Rentals
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-primary-foreground/80 font-body mt-4 max-w-2xl mx-auto text-base leading-relaxed">
            We're Ghana's go-to marketplace for discovering and advertising event rental venues. Whether you own a stunning beachfront, a spacious garden, or a modern hall — we help you reach the right audience.
          </motion.p>
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">
              Founded in 2024, Eventful Rentals started with a simple idea: finding the perfect event venue in Ghana shouldn't be a hassle. We saw venue owners struggling to reach the right audience and event organisers spending hours searching for the right space.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">
              Today, we connect hundreds of venue owners with thousands of renters — from wedding planners to corporate event organisers — making it easy to find, compare, and book event spaces across the country.
            </p>
            <div className="flex gap-8 mt-8">
              {[{ v: "120+", l: "Venues Listed" }, { v: "3.5K", l: "Happy Renters" }, { v: "98%", l: "Satisfaction Rate" }].map((s, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                  <span className="font-display text-3xl font-bold text-primary">{s.v}</span>
                  <p className="text-xs text-muted-foreground font-body mt-1">{s.l}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative rounded-xl overflow-hidden h-80">
            <img src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80" alt="Event venue" className="h-full w-full object-cover" />
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-12">Our Values</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-12">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((m, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -6 }} className="text-center group">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-2 border-border group-hover:border-primary transition-colors">
                <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
              </div>
              <h3 className="font-display font-semibold">{m.name}</h3>
              <p className="text-sm text-muted-foreground font-body">{m.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary-foreground mb-4">Have a Venue? List It Today</h2>
          <p className="text-primary-foreground/70 font-body mb-6 max-w-md mx-auto text-sm">Join hundreds of venue owners who trust Eventful Rentals to connect them with the right renters.</p>
          <Button variant="secondary" className="font-body gap-2" asChild>
            <Link to="/events">Browse Venues <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </motion.section>

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

export default About;
