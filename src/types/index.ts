// ============================================================
// RRMS — Shared TypeScript Types
// ============================================================

export type View =
  // Public
  | "home"
  | "about"
  | "rooms"
  | "room-details"
  | "amenities"
  | "gallery"
  | "faqs"
  | "contact"
  | "book"
  | "booking-confirmation"
  | "find-reservation"
  // Admin
  | "admin-login"
  | "admin-dashboard"
  | "admin-bookings"
  | "admin-rooms"
  | "admin-guests"
  | "admin-calendar"
  | "admin-reports"
  | "admin-amenities"
  | "admin-gallery"
  | "admin-settings"
  | "admin-profile";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

export type RoomStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "OCCUPIED"
  | "CLEANING"
  | "MAINTENANCE"
  | "BLOCKED";

export type AmenityCategory =
  | "GENERAL"
  | "ROOM"
  | "RESORT"
  | "DINING"
  | "WELLNESS";

export type UserRole = "ADMIN" | "STAFF" | "SUPER_ADMIN";

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  capacity: number;
  size: number | null;
  bedConfig: string | null;
}

export interface RoomImage {
  id: string;
  roomId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: AmenityCategory | string;
  description: string | null;
}

export interface Room {
  id: string;
  number: string;
  name: string;
  description: string;
  floor: number | null;
  view: string | null;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus | string;
  typeId: string;
  isActive: boolean;
  type?: RoomType;
  images?: RoomImage[];
  amenities?: Amenity[];
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  reservationCount?: number;
  createdAt: string;
}

export interface ReservationRoom {
  id: string;
  roomId: string;
  pricePerNight: number;
  subtotal: number;
  room?: Room;
}

export interface Reservation {
  id: string;
  referenceNo: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  totalAmount: number;
  status: BookingStatus | string;
  specialRequests: string | null;
  source: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  guest?: Guest;
  rooms?: ReservationRoom[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string | null;
}

export interface DashboardStats {
  arrivalsToday: number;
  departuresToday: number;
  pendingReservations: number;
  availableRooms: number;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
  revenueToday: number;
  recentBookings: Reservation[];
  todayTimeline: {
    arrivals: Reservation[];
    departures: Reservation[];
  };
}

export interface CalendarCell {
  roomId: string;
  roomNumber: string;
  roomName: string;
  date: string;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "BLOCKED";
  reservationId?: string;
  referenceNo?: string;
  guestName?: string;
}

export interface ReportSummary {
  totalReservations: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  rejected: number;
  noShow: number;
  totalRevenue: number;
  occupancyRate: number;
  mostBookedRoom: { name: string; count: number } | null;
  monthlyData: { month: string; reservations: number; revenue: number }[];
  weeklyData: { week: string; reservations: number }[];
  guestStats: {
    total: number;
    newThisMonth: number;
    returning: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface AvailabilitySearch {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export interface AvailableRoom extends Room {
  isAvailable: boolean;
  totalPrice: number;
  nights: number;
}
