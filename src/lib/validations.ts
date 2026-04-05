import { z } from "zod";

// Auth validations
export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
  isAgent: z.boolean().default(false),
});

// Contact form
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

// Review form
export const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional(),
});

// Venue creation - Step 0: Venue Details
export const venueStep0Schema = z.object({
  title: z.string().trim().min(1, "Venue title is required").max(150, "Title must be less than 150 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  date: z.string().min(1, "Available date is required").refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d >= new Date(new Date().toDateString());
  }, "Date must be today or in the future"),
  time: z.string().min(1, "Opening time is required"),
  category: z.enum(["conference", "workshop", "social", "networking", "celebration"]),
  venueType: z.enum(["hall", "beach", "grounds", "rooftop", "garden", "ballroom"]),
  maxAttendees: z.number().min(1, "Capacity must be at least 1").max(10000, "Capacity too large"),
});

// Step 1: Location
export const venueStep1Schema = z.object({
  location: z.string().trim().min(1, "Location name is required").max(200),
  address: z.string().max(300).optional(),
  city: z.string().trim().min(1, "City is required").max(100),
  region: z.string().max(100).optional(),
  mapUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

// Step 2: Pricing
export const venueStep2Schema = z.object({
  price: z.number().min(1, "Price must be at least GHS 1").max(1000000),
  propertyRef: z.string().max(50).optional(),
});

// Step 3: Owner/Agent
export const venueStep3Schema = z.object({
  agentName: z.string().max(100).optional(),
  agentPhone: z.string().max(20).optional().refine(
    (val) => !val || /^[+]?[\d\s()-]{7,20}$/.test(val),
    "Invalid phone number format"
  ),
  agentWebsite: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

// Step 4: Images
export const venueStep4Schema = z.object({
  imageUrls: z.array(z.string()).max(6, "Maximum 6 images").refine(
    (urls) => urls.every((u) => !u.trim() || /^https?:\/\/.+/.test(u)),
    "Image URLs must be valid http/https URLs"
  ),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
