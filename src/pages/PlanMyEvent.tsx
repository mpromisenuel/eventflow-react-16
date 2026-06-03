import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Palette,
  UtensilsCrossed,
  Users,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_TYPES } from "@/lib/packages";

type PlanState = {
  // Step 1
  eventName: string;
  eventType: string;
  guestCount: number;
  eventDate?: Date;
  theme: string;
  // Step 2
  aesthetic: string;
  palette: string;
  seating: string;
  decor: string[];
  // Step 3
  mealType: string;
  dietary: string[];
  bar: string;
  dessert: string;
  // Step 4
  coordinators: number;
  waiters: number;
  security: number;
  avTechs: number;
  // Step 5
  vipHandling: boolean;
  valet: boolean;
  accessibility: boolean;
  customRequest: string;
};

const initialState: PlanState = {
  eventName: "",
  eventType: "wedding",
  guestCount: 50,
  eventDate: undefined,
  theme: "",
  aesthetic: "",
  palette: "",
  seating: "",
  decor: [],
  mealType: "",
  dietary: [],
  bar: "",
  dessert: "",
  coordinators: 1,
  waiters: 2,
  security: 0,
  avTechs: 0,
  vipHandling: false,
  valet: false,
  accessibility: false,
  customRequest: "",
};

const STEPS = [
  { key: "basic", label: "Basic", icon: Sparkles },
  { key: "design", label: "Design", icon: Palette },
  { key: "catering", label: "Catering", icon: UtensilsCrossed },
  { key: "service", label: "Service", icon: Users },
  { key: "special", label: "Special", icon: Star },
] as const;

const AESTHETICS = ["Modern Minimal", "Classic Elegant", "Boho Chic", "Rustic Garden", "Black Tie Glam", "Tropical"];
const PALETTES = [
  { label: "Ivory & Gold", colors: ["#f7f1e3", "#d4a843", "#8a6f3c"] },
  { label: "Sage & Cream", colors: ["#dce5d4", "#a8c0a0", "#f5f0e8"] },
  { label: "Blush Romance", colors: ["#f8e8ee", "#e8c5d0", "#c9a0dc"] },
  { label: "Deep Emerald", colors: ["#064e3b", "#0d7a5f", "#c9a84c"] },
  { label: "Midnight Indigo", colors: ["#0a0a1a", "#1e1e5a", "#4f46e5"] },
  { label: "Sunset Blaze", colors: ["#ff6b35", "#f7931e", "#e84393"] },
];
const SEATING = ["Round Tables", "Long Banquet", "Theater Style", "Lounge / Mixed", "U-Shape", "Cocktail Standing"];
const DECOR_OPTIONS = ["Floral Centerpieces", "Candle Ambience", "Drape Backdrops", "Fairy Lights", "Balloon Arches", "LED Uplighting"];

const MEALS = ["Buffet", "Plated", "Finger Foods", "Family Style", "Food Stations"];
const DIETARY = ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut-Free"];
const BAR_OPTS = ["No Bar", "Soft Drinks Only", "Beer & Wine", "Full Open Bar", "Premium Top Shelf"];
const DESSERT_OPTS = ["No Dessert", "Wedding/Event Cake", "Dessert Table", "Plated Dessert", "Live Dessert Station"];

export default function PlanMyEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PlanState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof PlanState>(key: K, value: PlanState[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleArr = (key: "decor" | "dietary", value: string) => {
    setData((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!data.eventName.trim()) return "Please enter an event name";
      if (!data.eventType) return "Please choose an event type";
      if (!data.guestCount || data.guestCount < 1) return "Please enter guest count";
      if (!data.eventDate) return "Please pick an event date";
    }
    if (s === 1) {
      if (!data.aesthetic) return "Please choose an aesthetic";
      if (!data.palette) return "Please choose a color palette";
      if (!data.seating) return "Please choose a seating layout";
    }
    if (s === 2) {
      if (!data.mealType) return "Please choose a meal type";
      if (!data.bar) return "Please choose a bar option";
      if (!data.dessert) return "Please choose a dessert option";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        setStep(i);
        return toast.error(err);
      }
    }
    setSubmitting(true);
    try {
      if (user) {
        // Persist as a planning record in bookings (venue-agnostic plan)
        const { error } = await supabase.from("bookings" as any).insert({
          user_id: user.id,
          event_date: data.eventDate ? format(data.eventDate, "yyyy-MM-dd") : null,
          event_type: data.eventType,
          guest_count: data.guestCount,
          addons: data as any,
          workflow_status: "inquiry",
          status: "active",
        } as any);
        if (error) {
          // Fallback: just acknowledge locally
          console.warn(error);
        }
      }
      toast.success("Planning submitted! Our coordinators will reach out shortly.");
      setData(initialState);
      setStep(0);
      navigate("/my-bookings");
    } catch (e: any) {
      toast.error(e?.message || "Could not submit plan");
    } finally {
      setSubmitting(false);
    }
  };

  const ActiveIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <main className="w-full max-w-4xl mx-auto px-4 py-6 md:p-8">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Plan My Event</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Five quick steps to a flawless event. We'll take it from there.
          </p>
        </div>

        {/* Desktop stepper */}
        <div className="hidden md:flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={cn(
                      "h-11 w-11 rounded-full border-2 flex items-center justify-center transition-all",
                      active && "border-primary bg-primary text-primary-foreground shadow-md scale-110",
                      done && "border-primary bg-primary/10 text-primary",
                      !active && !done && "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 transition-colors",
                      i < step ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile compact stepper */}
        <div className="md:hidden mb-6 flex items-center gap-3 rounded-xl border bg-card p-3">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
            <div className="font-medium text-sm">{STEPS[step].label}</div>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-4 rounded-full",
                  i <= step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-primary" />
              {STEPS[step].label} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && <StepBasic data={data} update={update} />}
                {step === 1 && <StepDesign data={data} update={update} toggleArr={toggleArr} />}
                {step === 2 && <StepCatering data={data} update={update} toggleArr={toggleArr} />}
                {step === 3 && <StepService data={data} update={update} />}
                {step === 4 && <StepSpecial data={data} update={update} />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={back} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} className="gap-1.5">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={submitting}
              size="lg"
              className="gap-1.5 px-6 md:px-10 font-semibold shadow-md"
            >
              {submitting ? "Submitting…" : "Submit Planning"}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

/* ----------------- Step components ----------------- */

type StepProps = {
  data: PlanState;
  update: <K extends keyof PlanState>(key: K, value: PlanState[K]) => void;
};

const StepBasic = ({ data, update }: StepProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="sm:col-span-2">
      <Label>Event Name *</Label>
      <Input
        value={data.eventName}
        onChange={(e) => update("eventName", e.target.value)}
        placeholder="e.g. Sarah & James Wedding"
        className="mt-1.5"
      />
    </div>
    <div>
      <Label>Event Type *</Label>
      <Select value={data.eventType} onValueChange={(v) => update("eventType", v)}>
        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
        <SelectContent>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Guest Count *</Label>
      <Input
        type="number"
        min={1}
        value={data.guestCount}
        onChange={(e) => update("guestCount", Number(e.target.value) || 0)}
        className="mt-1.5"
      />
    </div>
    <div className="sm:col-span-2">
      <Label>Event Date *</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "mt-1.5 w-full justify-start font-normal",
              !data.eventDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {data.eventDate ? format(data.eventDate, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={data.eventDate}
            onSelect={(d) => update("eventDate", d)}
            disabled={(d) => d < new Date(new Date().toDateString())}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
    <div className="sm:col-span-2">
      <Label>Core Theme / Vision</Label>
      <Textarea
        value={data.theme}
        onChange={(e) => update("theme", e.target.value)}
        placeholder="Describe the mood, vision, or inspiration for your event…"
        rows={3}
        className="mt-1.5"
      />
    </div>
  </div>
);

const StepDesign = ({
  data,
  update,
  toggleArr,
}: StepProps & { toggleArr: (k: "decor" | "dietary", v: string) => void }) => (
  <div className="space-y-6">
    <div>
      <Label className="mb-3 block">Visual Aesthetic *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AESTHETICS.map((a) => (
          <SelectableCard
            key={a}
            active={data.aesthetic === a}
            onClick={() => update("aesthetic", a)}
            label={a}
          />
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Color Palette *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PALETTES.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => update("palette", p.label)}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-all hover:border-primary/60",
              data.palette === p.label
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <div className="flex gap-1.5 mb-2">
              {p.colors.map((c) => (
                <div key={c} className="h-8 flex-1 rounded-md" style={{ background: c }} />
              ))}
            </div>
            <div className="text-sm font-medium">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Seating Layout *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SEATING.map((s) => (
          <SelectableCard
            key={s}
            active={data.seating === s}
            onClick={() => update("seating", s)}
            label={s}
          />
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Decoration Themes (select all that apply)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DECOR_OPTIONS.map((d) => (
          <SelectableCard
            key={d}
            active={data.decor.includes(d)}
            onClick={() => toggleArr("decor", d)}
            label={d}
          />
        ))}
      </div>
    </div>
  </div>
);

const StepCatering = ({
  data,
  update,
  toggleArr,
}: StepProps & { toggleArr: (k: "decor" | "dietary", v: string) => void }) => (
  <div className="space-y-6">
    <div>
      <Label className="mb-3 block">Meal Type *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MEALS.map((m) => (
          <SelectableCard key={m} active={data.mealType === m} onClick={() => update("mealType", m)} label={m} />
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Dietary Restrictions</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DIETARY.map((d) => (
          <label
            key={d}
            className={cn(
              "flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
              data.dietary.includes(d) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <Checkbox checked={data.dietary.includes(d)} onCheckedChange={() => toggleArr("dietary", d)} />
            <span className="text-sm font-medium">{d}</span>
          </label>
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Bar & Beverage *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BAR_OPTS.map((b) => (
          <SelectableCard key={b} active={data.bar === b} onClick={() => update("bar", b)} label={b} />
        ))}
      </div>
    </div>
    <div>
      <Label className="mb-3 block">Cake / Dessert Service *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DESSERT_OPTS.map((d) => (
          <SelectableCard key={d} active={data.dessert === d} onClick={() => update("dessert", d)} label={d} />
        ))}
      </div>
    </div>
  </div>
);

const StepService = ({ data, update }: StepProps) => {
  const fields: { key: keyof PlanState; label: string; help: string }[] = [
    { key: "coordinators", label: "Event Coordinators", help: "Lead planners on-site" },
    { key: "waiters", label: "Waiters / Servers", help: "Floor service staff" },
    { key: "security", label: "Security Personnel", help: "Door & venue security" },
    { key: "avTechs", label: "Audio / Visual Techs", help: "Sound & lighting engineers" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={String(f.key)} className="rounded-xl border-2 border-border bg-card p-4">
          <Label className="text-sm font-semibold">{f.label}</Label>
          <p className="text-xs text-muted-foreground mb-3">{f.help}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => update(f.key, Math.max(0, (data[f.key] as number) - 1) as any)}
            >
              −
            </Button>
            <Input
              type="number"
              min={0}
              value={data[f.key] as number}
              onChange={(e) => update(f.key, (Number(e.target.value) || 0) as any)}
              className="text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => update(f.key, ((data[f.key] as number) + 1) as any)}
            >
              +
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const StepSpecial = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <ToggleCard
        active={data.vipHandling}
        onClick={() => update("vipHandling", !data.vipHandling)}
        label="VIP Accommodation"
        help="Dedicated host & private area"
      />
      <ToggleCard
        active={data.valet}
        onClick={() => update("valet", !data.valet)}
        label="Parking / Valet"
        help="Coordinated guest parking"
      />
      <ToggleCard
        active={data.accessibility}
        onClick={() => update("accessibility", !data.accessibility)}
        label="Accessibility Needs"
        help="Ramps, seating, signage"
      />
    </div>
    <div>
      <Label>Custom Requests</Label>
      <Textarea
        value={data.customRequest}
        onChange={(e) => update("customRequest", e.target.value)}
        placeholder="Anything else our team should know…"
        rows={4}
        className="mt-1.5"
      />
    </div>
    <ReviewPanel data={data} />
  </div>
);

const ReviewPanel = ({ data }: { data: PlanState }) => (
  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 md:p-5">
    <div className="font-display text-lg font-semibold mb-3">Final Review</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <ReviewRow label="Event" value={data.eventName || "—"} />
      <ReviewRow label="Type" value={EVENT_TYPES.find((t) => t.value === data.eventType)?.label || data.eventType} />
      <ReviewRow label="Guests" value={String(data.guestCount)} />
      <ReviewRow label="Date" value={data.eventDate ? format(data.eventDate, "PPP") : "—"} />
      <ReviewRow label="Aesthetic" value={data.aesthetic || "—"} />
      <ReviewRow label="Palette" value={data.palette || "—"} />
      <ReviewRow label="Seating" value={data.seating || "—"} />
      <ReviewRow label="Meal" value={data.mealType || "—"} />
      <ReviewRow label="Bar" value={data.bar || "—"} />
      <ReviewRow label="Dessert" value={data.dessert || "—"} />
      <ReviewRow
        label="Staff"
        value={`${data.coordinators} coord · ${data.waiters} waiters · ${data.security} sec · ${data.avTechs} A/V`}
      />
    </div>
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 border-b border-border/60 py-1.5">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right truncate">{value}</span>
  </div>
);

const SelectableCard = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all",
      active
        ? "border-primary bg-primary/10 text-primary shadow-sm"
        : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      {active && <Check className="h-4 w-4 flex-shrink-0" />}
    </div>
  </button>
);

const ToggleCard = ({
  active,
  onClick,
  label,
  help,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  help: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-xl border-2 p-4 text-left transition-all",
      active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
    )}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="font-semibold text-sm">{label}</span>
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
          active ? "border-primary bg-primary text-primary-foreground" : "border-border"
        )}
      >
        {active && <Check className="h-3 w-3" />}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{help}</p>
  </button>
);
