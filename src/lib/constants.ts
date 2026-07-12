import type {
  BookingStatus,
  RoomStatus,
} from "@/types";

// ============================================================
// THE TWENTY-FIFTH — Application Constants
// All resort data is REAL, sourced from the resort's official
// Facebook (facebook.com/the25thinzambales), Instagram
// (@thetwentyfifthzambales), and Airbnb listing.
// ============================================================

export const RESORT_INFO = {
  name: "The Twenty-Fifth",
  shortName: "The 25th",
  tagline: "A luxurious beachfront villa in Zambales awaits.",
  story:
    "Shaped by the ocean, softened by coastal pine — you're not just booking a villa, you're creating space for connection.",
  description:
    "An exclusive private beachfront villa in Botolan, Zambales. With four bedrooms, an infinity pool overlooking the sea, a fully equipped kitchen, and direct beach access — The Twenty-Fifth is perfect for group or family getaways, celebrations, and quiet escapes.",
  email: "stay@the25thinzambales.com",
  phone: "+63 969 601 4369",
  phoneRaw: "+639696014369",
  address: "Panan, Botolan, Zambales, Philippines",
  addressShort: "Panan, Botolan, Zambales",
  // Resort-ish check-in/out (typical PH villa policy)
  checkInTime: "14:00",
  checkOutTime: "12:00",
  // Whole-villa capacity from Airbnb listing
  maxGuests: 25,
  bedrooms: 4,
  beds: 21,
  baths: 5.5,
  social: {
    instagram: "https://www.instagram.com/thetwentyfifthzambales",
    instagramHandle: "@thetwentyfifthzambales",
    facebook: "https://www.facebook.com/the25thinzambales",
    facebookHandle: "The 25th in Zambales",
    website: "https://the25thinzambales.com",
    messenger: "https://m.me/the25thinzambales",
    whatsapp: "https://wa.me/639696014369",
    airbnb: "https://www.airbnb.com/rooms/1634697640593448410",
  },
};

// Plain-language booking status — designed for non-technical users.
// "label" = short admin-facing word; "friendly" = guest-facing phrase.
export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus | string,
  {
    label: string;
    friendly: string;
    description: string;
    color: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  PENDING: {
    label: "Pending",
    friendly: "We're reviewing your request",
    description: "We've received your booking and will confirm it shortly.",
    color: "#D9943C",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    friendly: "Your stay is confirmed",
    description: "Your dates are locked in. See you at the beach!",
    color: "#2E8B6F",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  CHECKED_IN: {
    label: "Checked In",
    friendly: "Guests have arrived",
    description: "Your group is currently enjoying the villa.",
    color: "#0E5A6F",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-600",
  },
  COMPLETED: {
    label: "Completed",
    friendly: "Stay finished",
    description: "This stay has wrapped up. Thanks for visiting!",
    color: "#6B7A7E",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
  CANCELLED: {
    label: "Cancelled",
    friendly: "Booking cancelled",
    description: "This reservation was cancelled by the guest or resort.",
    color: "#C0392B",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  REJECTED: {
    label: "Declined",
    friendly: "We couldn't accommodate this request",
    description: "Unfortunately the dates weren't available.",
    color: "#9F1239",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
  NO_SHOW: {
    label: "No Show",
    friendly: "Guests didn't arrive",
    description: "The reserved dates passed without check-in.",
    color: "#9F1239",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
};

export const ROOM_STATUS_CONFIG: Record<
  RoomStatus | string,
  { label: string; friendly: string; color: string; bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    label: "Open",
    friendly: "Available to book",
    color: "#2E8B6F",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  RESERVED: {
    label: "Reserved",
    friendly: "Held for an upcoming stay",
    color: "#D9943C",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  OCCUPIED: {
    label: "Occupied",
    friendly: "Guests currently staying",
    color: "#0E5A6F",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-600",
  },
  CLEANING: {
    label: "Cleaning",
    friendly: "Being tidied for the next guests",
    color: "#4DBFD4",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  MAINTENANCE: {
    label: "Maintenance",
    friendly: "Briefly offline for upkeep",
    color: "#C0392B",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  BLOCKED: {
    label: "Blocked",
    friendly: "Not available",
    color: "#6B7A7E",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
};

export const CALENDAR_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#2E8B6F",
  RESERVED: "#D9943C",
  OCCUPIED: "#0E5A6F",
  CLEANING: "#4DBFD4",
  MAINTENANCE: "#C0392B",
  BLOCKED: "#6B7A7E",
};

// Plain-language admin nav for non-technical staff.
export const ADMIN_NAV = [
  { view: "admin-dashboard", label: "Today", icon: "LayoutDashboard" },
  { view: "admin-bookings", label: "Reservations", icon: "CalendarCheck" },
  { view: "admin-calendar", label: "Calendar", icon: "CalendarDays" },
  { view: "admin-rooms", label: "The Villa", icon: "Home" },
  { view: "admin-guests", label: "Guests", icon: "Users" },
  { view: "admin-amenities", label: "Amenities", icon: "Sparkles" },
  { view: "admin-gallery", label: "Photos", icon: "Images" },
  { view: "admin-reports", label: "Reports", icon: "BarChart3" },
  { view: "admin-settings", label: "Settings", icon: "Settings" },
] as const;

// Public nav — fewer, clearer items.
export const PUBLIC_NAV = [
  { view: "home", label: "Home" },
  { view: "rooms", label: "The Villa" },
  { view: "amenities", label: "Amenities" },
  { view: "gallery", label: "Gallery" },
  { view: "about", label: "About" },
  { view: "faqs", label: "FAQs" },
  { view: "contact", label: "Contact" },
] as const;

export const GALLERY_CATEGORIES = [
  "ALL",
  "RESORT",
  "ROOMS",
  "DINING",
  "NATURE",
  "EVENTS",
] as const;

export const AMENITY_CATEGORIES = [
  { value: "RESORT", label: "Villa & Grounds" },
  { value: "ROOM", label: "Bedrooms" },
  { value: "DINING", label: "Kitchen & Dining" },
  { value: "WELLNESS", label: "Wellness" },
  { value: "GENERAL", label: "General" },
] as const;

// NOTE: Admin credentials are NO LONGER hardcoded here.
// P0 security: the admin user is provisioned by `prisma/seed.ts` using
// ADMIN_SEED_PASSWORD from the environment. Sign in at ?view=admin-login.
