import { z } from "zod";

// ============================================================
// The Twenty-Fifth — Zod Validation Schemas
// ============================================================

export const availabilitySearchSchema = z
  .object({
    checkIn: z.string().min(1, "Check-in date is required"),
    checkOut: z.string().min(1, "Check-out date is required"),
    adults: z.number().int().min(1, "At least 1 adult").max(20),
    children: z.number().int().min(0).max(20),
  })
  .refine(
    (data) => new Date(data.checkOut) > new Date(data.checkIn),
    { message: "Check-out must be after check-in", path: ["checkOut"] }
  )
  .refine(
    (data) => new Date(data.checkIn) >= new Date(new Date().toDateString()),
    { message: "Check-in cannot be in the past", path: ["checkIn"] }
  );

export const guestInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long"),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  specialRequests: z.string().max(1000).optional().or(z.literal("")),
});

export const reservationCreateSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guest: guestInfoSchema,
  specialRequests: z.string().max(1000).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const roomCreateSchema = z.object({
  number: z.string().min(1, "Room number is required").max(20),
  name: z.string().min(1, "Room name is required").max(100),
  description: z.string().min(10, "Description is too short").max(2000),
  floor: z.number().int().min(0).optional(),
  view: z.string().max(50).optional().or(z.literal("")),
  pricePerNight: z.number().min(0, "Price must be positive"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  typeId: z.string().min(1, "Room type is required"),
  status: z.enum([
    "AVAILABLE",
    "RESERVED",
    "OCCUPIED",
    "CLEANING",
    "MAINTENANCE",
    "BLOCKED",
  ]),
  amenityIds: z.array(z.string()).optional(),
  imageUrls: z
    .array(
      z.object({
        // Accept either absolute URLs (https://...) or relative paths (/uploads/...)
        url: z
          .string()
          .min(1)
          .refine(
            (v) => v.startsWith("/") || /^https?:\/\//.test(v),
            "Must be a valid URL or a path starting with /"
          ),
        altText: z.string().optional().or(z.literal("")),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});

export const roomTypeCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  slug: z
    .string()
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  description: z.string().min(10, "Description is too short").max(2000),
  basePrice: z.number().min(0, "Price must be positive"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  size: z.number().min(0).optional(),
  bedConfig: z.string().max(100).optional().or(z.literal("")),
});

export const amenityCreateSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(60).optional().or(z.literal("")),
  category: z.enum(["GENERAL", "ROOM", "RESORT", "DINING", "WELLNESS"]),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const guestUpdateSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const galleryCreateSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.enum(["RESORT", "ROOMS", "DINING", "NATURE", "EVENTS"]),
  // Accept either absolute URLs (https://...) or relative paths (/uploads/...)
  url: z
    .string()
    .min(1)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//.test(v),
      "Must be a valid URL or a path starting with /"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type AvailabilitySearchInput = z.infer<typeof availabilitySearchSchema>;
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>;
export type AmenityCreateInput = z.infer<typeof amenityCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
export type GalleryCreateInput = z.infer<typeof galleryCreateSchema>;

// ──────────────────────────────────────────────────────────────────────────
// P1 — Additional validation schemas for previously-bypassed routes
// ──────────────────────────────────────────────────────────────────────────

// Public contact form (POST /api/contact)
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z.string().min(1, "Message is required").max(5000),
});

// Notification mark-read (PATCH /api/notifications)
export const notificationUpdateSchema = z
  .object({
    id: z.string().min(1).optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((d) => d.id !== undefined || d.markAllRead !== undefined, {
    message: "Provide either id or markAllRead",
  });

// Reservation status transition (PATCH /api/reservations/[id]/status)
export const reservationStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "COMPLETED",
    "CANCELLED",
    "REJECTED",
    "NO_SHOW",
  ]),
  rejectedReason: z.string().max(500).optional().or(z.literal("")),
});

// Partial room update (PATCH /api/rooms/[id]) — all fields optional
export const roomUpdateSchema = z.object({
  number: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  floor: z.number().int().min(0).optional(),
  view: z.string().max(50).optional().or(z.literal("")),
  pricePerNight: z.number().min(0).optional(),
  capacity: z.number().int().min(1).optional(),
  status: z
    .enum(["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE", "BLOCKED"])
    .optional(),
  typeId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  amenityIds: z.array(z.string()).optional(),
  imageUrls: z
    .array(
      z.object({
        url: z
          .string()
          .min(1)
          .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Invalid URL"),
        altText: z.string().optional().or(z.literal("")),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});

// Settings bulk update (PATCH /api/settings)
export const settingsUpdateSchema = z.object({
  settings: z
    .record(z.string(), z.string().max(5000))
    .refine((d) => Object.keys(d).length > 0, { message: "No settings provided" }),
});

// Admin copilot tool execution (POST /api/admin/chat/execute)
export const toolExecuteSchema = z.object({
  tool: z.string().min(1, "Tool name is required").max(60),
  args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;
export type ReservationStatusInput = z.infer<typeof reservationStatusSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type ToolExecuteInput = z.infer<typeof toolExecuteSchema>;
