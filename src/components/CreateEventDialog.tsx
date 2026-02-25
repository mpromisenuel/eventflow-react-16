import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/context/EventContext";
import { EventCategory, categoryLabels } from "@/lib/types";
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
  social: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
  networking: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
  celebration: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
};

const CreateEventDialog = () => {
  const [open, setOpen] = useState(false);
  const { addEvent } = useEvents();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "social" as EventCategory,
    maxAttendees: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      ...form,
      attendees: 0,
      image: defaultImages[form.category],
      status: "upcoming",
    });
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      category: "social",
      maxAttendees: 50,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Give your event a name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this event about?"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Where will it be held?"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as EventCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as EventCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max">Max Attendees</Label>
              <Input
                id="max"
                type="number"
                min={1}
                value={form.maxAttendees}
                onChange={(e) => setForm({ ...form, maxAttendees: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
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
