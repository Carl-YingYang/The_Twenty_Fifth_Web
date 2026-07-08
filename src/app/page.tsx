"use client";

import { useViewStore } from "@/store/useViewStore";
import { AnimatePresence, motion } from "framer-motion";

// Public components
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HomePage } from "@/components/public/home/HomePage";
import { AboutPage } from "@/components/public/about/AboutPage";
import { RoomsPage } from "@/components/public/rooms/RoomsPage";
import { RoomDetailsPage } from "@/components/public/rooms/RoomDetailsPage";
import { AmenitiesPage } from "@/components/public/amenities/AmenitiesPage";
import { GalleryPage } from "@/components/public/gallery/GalleryPage";
import { FaqsPage } from "@/components/public/faqs/FaqsPage";
import { ContactPage } from "@/components/public/contact/ContactPage";
import { BookingFlow } from "@/components/public/booking/BookingFlow";
import { FindReservation } from "@/components/public/booking/FindReservation";

// Admin components
import { AdminLogin } from "@/components/admin/AdminLogin";
import { DashboardAdmin } from "@/components/admin/DashboardAdmin";
import { BookingsAdmin } from "@/components/admin/BookingsAdmin";
import { CalendarAdmin } from "@/components/admin/CalendarAdmin";
import { RoomsAdmin } from "@/components/admin/RoomsAdmin";
import { GuestsAdmin } from "@/components/admin/GuestsAdmin";
import { AmenitiesAdmin } from "@/components/admin/AmenitiesAdmin";
import { GalleryAdmin } from "@/components/admin/GalleryAdmin";
import { ReportsAdmin } from "@/components/admin/ReportsAdmin";
import { SettingsAdmin } from "@/components/admin/SettingsAdmin";

const ADMIN_VIEWS = new Set([
  "admin-dashboard",
  "admin-bookings",
  "admin-calendar",
  "admin-rooms",
  "admin-guests",
  "admin-amenities",
  "admin-gallery",
  "admin-reports",
  "admin-settings",
]);

export default function Home() {
  const { view } = useViewStore();

  const isAdminView = ADMIN_VIEWS.has(view);
  const isLogin = view === "admin-login";

  // Login is a standalone full-screen page
  if (isLogin) {
    return (
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key="admin-login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminLogin />
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // Admin views share the AdminLayout shell (which handles auth gating internally)
  if (isAdminView) {
    return (
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderAdminView(view)}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // Public website — nav + content + footer, footer sticky to bottom
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderPublicView(view)}
          </motion.div>
        </AnimatePresence>
      </main>
      <PublicFooter />
    </div>
  );
}

function renderPublicView(view: string) {
  switch (view) {
    case "home":
      return <HomePage />;
    case "about":
      return <AboutPage />;
    case "rooms":
      return <RoomsPage />;
    case "room-details":
      return <RoomDetailsPage />;
    case "amenities":
      return <AmenitiesPage />;
    case "gallery":
      return <GalleryPage />;
    case "faqs":
      return <FaqsPage />;
    case "contact":
      return <ContactPage />;
    case "book":
      return <BookingFlow />;
    case "booking-confirmation":
      return <BookingFlow />;
    case "find-reservation":
      return <FindReservation />;
    default:
      return <HomePage />;
  }
}

function renderAdminView(view: string) {
  switch (view) {
    case "admin-dashboard":
      return <DashboardAdmin />;
    case "admin-bookings":
      return <BookingsAdmin />;
    case "admin-calendar":
      return <CalendarAdmin />;
    case "admin-rooms":
      return <RoomsAdmin />;
    case "admin-guests":
      return <GuestsAdmin />;
    case "admin-amenities":
      return <AmenitiesAdmin />;
    case "admin-gallery":
      return <GalleryAdmin />;
    case "admin-reports":
      return <ReportsAdmin />;
    case "admin-settings":
      return <SettingsAdmin />;
    default:
      return <DashboardAdmin />;
  }
}
