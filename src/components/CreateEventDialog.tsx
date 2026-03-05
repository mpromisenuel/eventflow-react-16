import { useState } from "react";
import { useEvents } from "@/context/EventContext";
import { EventCategory, VenueType, categoryLabels, venueTypeLabels } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const defaultImages: Record<EventCategory, string> = {
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  workshop: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  social: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  networking: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  celebration: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
};

const CreateEventDialog = () => {
  const [open, setOpen] = useState(false);
  const { addEvent } = useEvents();

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
    agentName: "",
    agentPhone: "",
    amenities: "",
    inclusions: "",
    extraFees: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const img = defaultImages[form.category];
    addEvent({
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
      agentName: form.agentName || undefined,
      agentPhone: form.agentPhone || undefined,
      amenities: form.amenities ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      inclusions: form.inclusions ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : ["Grounds only"],
      extraFees: form.extraFees ? form.extraFees.split(",").map((s) => s.trim()).filter(Boolean) : [],
      attendees: 0,
      image: img,
      images: [img],
      status: "upcoming",
      likes: 0,
      liked: false,
      rating: 0,
      ratingCount: 0,
      orders: 0,
      marketStatus: "available",
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    setForm({
      title: "", description: "", date: "", time: "", location: "",
      category: "social", venueType: "grounds", maxAttendees: 50, price: 0,
      address: "", city: "", region: "Greater Accra",
      agentName: "", agentPhone: "", amenities: "", inclusions: "", extraFees: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-body">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          {/* Basic Info */}
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Give your event a name" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the venue, what's included, the vibe..." rows={4} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="location">Location Name</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Ashiyie, off Adenta-Dodowa Road" required />
            </div>
            <div>
              <Label htmlFor="address">Full Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City / Area</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Adenta Municipal" required />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Greater Accra" />
            </div>
          </div>

          {/* Category & Venue */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as EventCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as EventCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Venue Type</Label>
              <Select value={form.venueType} onValueChange={(v) => setForm({ ...form, venueType: v as VenueType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(venueTypeLabels) as VenueType[]).map((vt) => (
                    <SelectItem key={vt} value={vt}>{venueTypeLabels[vt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max">Max Attendees</Label>
              <Input id="max" type="number" min={1} value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: parseInt(e.target.value) || 1 })} required />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Agent Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="agentName">Agent / Organizer Name</Label>
              <Input id="agentName" value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} placeholder="e.g. Property Hub Arena Gh" />
            </div>
            <div>
              <Label htmlFor="agentPhone">Agent Phone</Label>
              <Input id="agentPhone" value={form.agentPhone} onChange={(e) => setForm({ ...form, agentPhone: e.target.value })} placeholder="+233241761723" />
            </div>
          </div>

          {/* Amenities & Inclusions */}
          <div>
            <Label htmlFor="amenities">Amenities (comma separated)</Label>
            <Input id="amenities" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="Parking, Power, Water, Security, Restrooms" />
          </div>
          <div>
            <Label htmlFor="inclusions">What's Included (comma separated)</Label>
            <Input id="inclusions" value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Grounds only, Basic lighting" />
          </div>
          <div>
            <Label htmlFor="extraFees">Extra Fees (comma separated)</Label>
            <Input id="extraFees" value={form.extraFees} onChange={(e) => setForm({ ...form, extraFees: e.target.value })} placeholder="Chairs at GHS 5 each, Tables at GHS 15 each" />
          </div>

          <Button type="submit" className="w-full">
            Create Event
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
