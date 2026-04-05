import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, Phone, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { contactSchema } from "@/lib/validations";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="bg-primary py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            Get in Touch
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-primary-foreground/80 font-body mt-3 max-w-lg mx-auto text-sm">
            Have a question about listing or renting a venue? We'd love to hear from you.
          </motion.p>
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="font-display text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "hello@eventfulrentals.com" },
                { icon: Phone, label: "Phone", value: "+233 241 761 723" },
                { icon: MapPin, label: "Office", value: "East Legon Bawaleshie\nGreater Accra, Ghana" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-sm">{item.label}</p>
                    <p className="text-muted-foreground font-body text-sm whitespace-pre-line">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="mt-10 rounded-xl overflow-hidden h-48 border border-border">
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" alt="Our office" className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
            <h2 className="font-display text-2xl font-semibold mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-body font-medium mb-1 block">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={`font-body ${errors.name ? "border-destructive" : ""}`} />
                  {errors.name && <p className="text-xs text-destructive font-body mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-body font-medium mb-1 block">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={`font-body ${errors.email ? "border-destructive" : ""}`} />
                  {errors.email && <p className="text-xs text-destructive font-body mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-body font-medium mb-1 block">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" className={`font-body ${errors.subject ? "border-destructive" : ""}`} />
                {errors.subject && <p className="text-xs text-destructive font-body mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label className="text-sm font-body font-medium mb-1 block">Message</label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us more..." rows={5} className={`font-body ${errors.message ? "border-destructive" : ""}`} />
                {errors.message && <p className="text-xs text-destructive font-body mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" className="font-body gap-2 w-full sm:w-auto">
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </motion.div>
        </div>
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

export default Contact;
