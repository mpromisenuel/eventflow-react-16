export const EVENT_TYPES = [
  { value: "corporate_seminar", label: "Corporate Seminar", baseMultiplier: 1.2 },
  { value: "wedding", label: "Wedding", baseMultiplier: 1.5 },
  { value: "birthday", label: "Birthday Party", baseMultiplier: 1.0 },
  { value: "conference", label: "Conference", baseMultiplier: 1.3 },
  { value: "social", label: "Social Gathering", baseMultiplier: 1.0 },
] as const;

type Addon = { id: string; label: string; price: number; perGuest?: boolean };
export const ADDONS: Addon[] = [
  { id: "sound", label: "Sound System", price: 1500 },
  { id: "catering", label: "Catering (per guest)", price: 85, perGuest: true },
  { id: "decor", label: "Decorations", price: 2500 },
  { id: "photography", label: "Photography", price: 1800 },
  { id: "security", label: "Security Team", price: 1200 },
  { id: "lighting", label: "Stage Lighting", price: 900 },
];

export const TASK_TEMPLATES = [
  { title: "Send deposit invoice", offsetDays: -14 },
  { title: "Confirm caterer", offsetDays: -4 },
  { title: "Confirm sound system delivery", offsetDays: -2 },
  { title: "Coordinate with decorator", offsetDays: -3 },
  { title: "Set up sound system", offsetHours: -3 },
  { title: "On-site coordination walkthrough", offsetHours: -2 },
  { title: "Final venue cleanup", offsetHours: 4 },
];

export type AddonId = string;

export function calcQuote(opts: { basePrice: number; eventType: string; guests: number; addonIds: string[] }) {
  const mult = EVENT_TYPES.find(t => t.value === opts.eventType)?.baseMultiplier ?? 1;
  const venueCost = opts.basePrice * mult;
  const addonsCost = opts.addonIds.reduce((sum, id) => {
    const a = ADDONS.find(x => x.id === id);
    if (!a) return sum;
    return sum + (a.perGuest ? a.price * opts.guests : a.price);
  }, 0);
  return { venueCost, addonsCost, total: venueCost + addonsCost };
}

export const WORKFLOW_COLUMNS = [
  { key: "inquiry", label: "Inquiry" },
  { key: "deposit_paid", label: "Deposit Paid" },
  { key: "in_planning", label: "In Planning" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
] as const;
