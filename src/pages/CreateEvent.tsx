import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import { EventCategory, VenueType, categoryLabels, venueTypeLabels } from "@/lib/types";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, MapPin, Building2, Users, DollarSign, User, Phone, Globe, ImagePlus, X, Plus, Tag, Map,
} from "lucide-react";

const defaultImages: Record<EventCategory, string> = {
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  workshop: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  social: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  networking: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  celebration: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const CreateEvent = () => {
  const navigate = useNavigate();
  const { addEvent } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "social" as EventCategory,
    venueType: "grounds" as VenueType,
    maxAttendees: 50,
    price: 0,
    address: "",
    city: "",
    region: "Greater Accra",
    propertyRef: "",
    agentName: "",
    agentPhone: "",
    agentWebsite: "",
    mapUrl: "",
    amenities: "",
    inclusions: "",
    extraFees: "",
  });

  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const set = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAddImageField = () => {
    if (imageUrls.length < 6) setImageUrls([...imageUrls, ""]);
  };

  const handleRemoveImageField = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, value: string) => {
    const updated = [...imageUrls];
    updated[index] = value;
    setImageUrls(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Please sign in", description: "You must be logged in to list a venue.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const validImages = imageUrls.filter((url) => url.trim());
    const fallback = defaultImages[form.category];
    const images = validImages.length > 0 ? validImages : [fallback];

    await addEvent({
      title: form.title,
      description: form.description,
      date: form.date,
      time: form.time,
      location: form.location,
      category: form.category,
      venueType: form.venueType,
      maxAttendees: form.maxAttendees,
      price: form.price,
      address: form.address || form.location,
      city: form.city,
      region: form.region,
      propertyRef: form.propertyRef || undefined,
      agentName: form.agentName || undefined,
      agentPhone: form.agentPhone || undefined,
      agentWebsite: form.agentWebsite || undefined,
      mapUrl: form.mapUrl || undefined,
      amenities: form.amenities ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      inclusions: form.inclusions ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : ["Grounds only"],
      extraFees: form.extraFees ? form.extraFees.split(",").map((s) => s.trim()).filter(Boolean) : [],
      attendees: 0,
      image: images[0],
      images,
      status: "upcoming",
      likes: 0,
      liked: false,
      rating: 0,
      ratingCount: 0,
      orders: 0,
      marketStatus: "available",
      lastUpdated: new Date().toISOString().split("T")[0],
    });

    toast({ title: "Venue listed!", description: "Your venue is now live on the marketplace." });
    navigate("/events");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            List a Venue for Rent
          </h1>
          <p className="text-muted-foreground font-body text-sm mb-10">
            Fill in the details below to advertise your event space. All fields marked with * are required.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-10 font-body">
          {/* Section: Basic Info */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Venue Details
            </h2>
            <div>
              <Label htmlFor="title">Venue / Listing Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Give your venue a memorable name" required />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the venue — what's included, the vibe, amenities, capacity, and anything renters should know..." rows={5} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Available From *</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="time">Opening Time *</Label>
                <Input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Best Suited For *</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoryLabels) as EventCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Venue Type *</Label>
                <Select value={form.venueType} onValueChange={(v) => set("venueType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(venueTypeLabels) as VenueType[]).map((vt) => (
                      <SelectItem key={vt} value={vt}>{venueTypeLabels[vt]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max">Max Capacity *</Label>
                <Input id="max" type="number" min={1} value={form.maxAttendees} onChange={(e) => set("maxAttendees", parseInt(e.target.value) || 1)} required />
              </div>
            </div>
          </motion.section>

          {/* Section: Location */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <MapPin className="h-5 w-5 text-primary" /> Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location Name *</Label>
                <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Ashiyie, off Adenta-Dodowa Road" required />
              </div>
              <div>
                <Label htmlFor="address">Full Address</Label>
                <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City / Area *</Label>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Adenta Municipal" required />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Greater Accra" />
              </div>
              <div>
                <Label htmlFor="mapUrl">Map URL</Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="mapUrl" value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} placeholder="Google Maps link" className="pl-10" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section: Pricing & Property */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <DollarSign className="h-5 w-5 text-primary" /> Rental Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Rental Price (GHS) *</Label>
                <Input id="price" type="number" min={0} value={form.price} onChange={(e) => set("price", parseInt(e.target.value) || 0)} required />
              </div>
              <div>
                <Label htmlFor="propertyRef">Property Reference</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="propertyRef" value={form.propertyRef} onChange={(e) => set("propertyRef", e.target.value)} placeholder="e.g. 29419" className="pl-10" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section: Agent / Owner */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <User className="h-5 w-5 text-primary" /> Owner / Agent
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="agentName">Name</Label>
                <Input id="agentName" value={form.agentName} onChange={(e) => set("agentName", e.target.value)} placeholder="e.g. Property Hub Arena Gh" />
              </div>
              <div>
                <Label htmlFor="agentPhone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="agentPhone" value={form.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} placeholder="+233241761723" className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="agentWebsite">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="agentWebsite" value={form.agentWebsite} onChange={(e) => set("agentWebsite", e.target.value)} placeholder="https://..." className="pl-10" />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section: Images */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={5} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <ImagePlus className="h-5 w-5 text-primary" /> Venue Images
            </h2>
            <p className="text-xs text-muted-foreground">Add up to 6 image URLs. Leave blank to use a default image based on category.</p>
            <div className="space-y-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={url}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    placeholder={`Image URL ${i + 1}`}
                    className="flex-1"
                  />
                  {imageUrls.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveImageField(i)} className="shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {imageUrls.length < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddImageField} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add another image
                </Button>
              )}
            </div>
            {imageUrls.some((u) => u.trim()) && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imageUrls.filter((u) => u.trim()).map((u, i) => (
                  <img key={i} src={u} alt={`Preview ${i + 1}`} className="h-20 w-28 rounded-md object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />
                ))}
              </div>
            )}
          </motion.section>

          {/* Section: Amenities & Inclusions */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={6} className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Building2 className="h-5 w-5 text-primary" /> Amenities & Inclusions
            </h2>
            <div>
              <Label htmlFor="amenities">Amenities (comma separated)</Label>
              <Input id="amenities" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Parking, Power Supply, Water, Security, Restrooms, Stage Area" />
            </div>
            <div>
              <Label htmlFor="inclusions">What's Included in Rental (comma separated)</Label>
              <Input id="inclusions" value={form.inclusions} onChange={(e) => set("inclusions", e.target.value)} placeholder="Grounds only, Basic lighting" />
            </div>
            <div>
              <Label htmlFor="extraFees">Extra Fees (comma separated)</Label>
              <Input id="extraFees" value={form.extraFees} onChange={(e) => set("extraFees", e.target.value)} placeholder="Chairs at GHS 5 each, Tables at GHS 15 each, Canopies at GHS 80 each" />
            </div>
          </motion.section>

          {/* Submit */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7} className="flex gap-4 pt-4">
            <Button type="submit" size="lg" className="font-body gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> List Venue
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} className="font-body">
              Cancel
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
