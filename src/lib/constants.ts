import type {
  BookingStatus,
  RoomStatus,
} from "@/types";

// ============================================================
// RRMS — Application Constants
// ============================================================

export const RESORT_INFO = {
  name: "Verdara Resort",
  tagline: "A Sanctuary Between Forest & Sea",
  description:
    "Nestled where the rainforest meets the coast, Verdara Resort offers an immersive luxury escape — private villas, farm-to-table dining, and curated wellness experiences.",
  email: "stay@verdararesort.com",
  phone: "+63 (2) 8888 4400",
  address: "Coastal Road, Brgy. Luyang, San Juan, Batangas, Philippines",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
  },
};

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus | string,
  { label: string; color: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Pending",
    color: "#F59E0B",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#38A169",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  CHECKED_IN: {
    label: "Checked In",
    color: "#1F6F50",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "#718096",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  REJECTED: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  NO_SHOW: {
    label: "No Show",
    color: "#9F1239",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
};

export const ROOM_STATUS_CONFIG: Record<
  RoomStatus | string,
  { label: string; color: string; bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    label: "Available",
    color: "#16A34A",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  RESERVED: {
    label: "Reserved",
    color: "#F59E0B",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  OCCUPIED: {
    label: "Occupied",
    color: "#1F6F50",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-600",
  },
  CLEANING: {
    label: "Cleaning",
    color: "#0EA5E9",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "#DC2626",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  BLOCKED: {
    label: "Blocked",
    color: "#4B5563",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

export const CALENDAR_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#16A34A",
  RESERVED: "#F59E0B",
  OCCUPIED: "#1F6F50",
  CLEANING: "#0EA5E9",
  MAINTENANCE: "#DC2626",
  BLOCKED: "#4B5563",
};

export const ADMIN_NAV = [
  { view: "admin-dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { view: "admin-bookings", label: "Bookings", icon: "CalendarCheck" },
  { view: "admin-calendar", label: "Calendar", icon: "CalendarDays" },
  { view: "admin-rooms", label: "Rooms", icon: "BedDouble" },
  { view: "admin-guests", label: "Guests", icon: "Users" },
  { view: "admin-amenities", label: "Amenities", icon: "Sparkles" },
  { view: "admin-gallery", label: "Gallery", icon: "Images" },
  { view: "admin-reports", label: "Reports", icon: "BarChart3" },
  { view: "admin-settings", label: "Settings", icon: "Settings" },
] as const;

export const PUBLIC_NAV = [
  { view: "home", label: "Home" },
  { view: "rooms", label: "Rooms" },
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
  { value: "RESORT", label: "Resort" },
  { value: "ROOM", label: "Room" },
  { value: "DINING", label: "Dining" },
  { value: "WELLNESS", label: "Wellness" },
  { value: "GENERAL", label: "General" },
] as const;

export const ADMIN_CREDENTIALS = {
  email: "admin@verdararesort.com",
  password: "verdara2025",
};
