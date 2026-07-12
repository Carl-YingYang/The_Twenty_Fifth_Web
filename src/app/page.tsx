"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useViewStore } from "@/store/useViewStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingStore } from "@/store/useBookingStore";

// Always-loaded shell components (tiny, needed for first paint)
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ConciergeChat } from "@/components/public/chatbot/ConciergeChat";
import { HomePage } from "@/components/public/home/HomePage";

// Lazy-loaded public components (compiled on demand to keep dev memory low)
const AboutPage = lazy(() => import("@/components/public/about/AboutPage").then(m => ({ default: m.AboutPage })));
const RoomsPage = lazy(() => import("@/components/public/rooms/RoomsPage").then(m => ({ default: m.RoomsPage })));
const RoomDetailsPage = lazy(() => import("@/components/public/rooms/RoomDetailsPage").then(m => ({ default: m.RoomDetailsPage })));
const AmenitiesPage = lazy(() => import("@/components/public/amenities/AmenitiesPage").then(m => ({ default: m.AmenitiesPage })));
const GalleryPage = lazy(() => import("@/components/public/gallery/GalleryPage").then(m => ({ default: m.GalleryPage })));
const FaqsPage = lazy(() => import("@/components/public/faqs/FaqsPage").then(m => ({ default: m.FaqsPage })));
const ContactPage = lazy(() => import("@/components/public/contact/ContactPage").then(m => ({ default: m.ContactPage })));
const BookingFlow = lazy(() => import("@/components/public/booking/BookingFlow").then(m => ({ default: m.BookingFlow })));
const FindReservation = lazy(() => import("@/components/public/booking/FindReservation").then(m => ({ default: m.FindReservation })));

// Lazy-loaded admin components (only compiled when admin logs in)
const AdminLogin = lazy(() => import("@/components/admin/AdminLogin").then(m => ({ default: m.AdminLogin })));
const DashboardAdmin = lazy(() => import("@/components/admin/DashboardAdmin").then(m => ({ default: m.DashboardAdmin })));
const BookingsAdmin = lazy(() => import("@/components/admin/BookingsAdmin").then(m => ({ default: m.BookingsAdmin })));
const CalendarAdmin = lazy(() => import("@/components/admin/CalendarAdmin").then(m => ({ default: m.CalendarAdmin })));
const RoomsAdmin = lazy(() => import("@/components/admin/RoomsAdmin").then(m => ({ default: m.RoomsAdmin })));
const GuestsAdmin = lazy(() => import("@/components/admin/GuestsAdmin").then(m => ({ default: m.GuestsAdmin })));
const AmenitiesAdmin = lazy(() => import("@/components/admin/AmenitiesAdmin").then(m => ({ default: m.AmenitiesAdmin })));
const GalleryAdmin = lazy(() => import("@/components/admin/GalleryAdmin").then(m => ({ default: m.GalleryAdmin })));
const ReportsAdmin = lazy(() => import("@/components/admin/ReportsAdmin").then(m => ({ default: m.ReportsAdmin })));
const SettingsAdmin = lazy(() => import("@/components/admin/SettingsAdmin").then(m => ({ default: m.SettingsAdmin })));

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

function LazyFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Loading…
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  // Hydration guard: stores use skipHydration, so we must rehydrate after mount.
  // Until then, render a stable shell that matches SSR to prevent the
  // blank-white-screen hydration error on mobile devices.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Manually rehydrate all persisted stores on the client.
    useViewStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useBookingStore.persist.rehydrate();
    // P0 security: after rehydration, honor ?view=admin-login (or other
    // allow-listed views) from the URL. This is how admins now reach the
    // login screen — the public footer button has been removed.
    useViewStore.getState().initFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // Stable loading shell shown during SSR + first client render (matches server output).
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            The Twenty-Fifth
          </span>
        </div>
      </div>
    );
  }

  return <AppShell />;
}

function AppShell() {
  const { view } = useViewStore();

  const isAdminView = ADMIN_VIEWS.has(view);
  const isLogin = view === "admin-login";

  // Login is a standalone full-screen page
  if (isLogin) {
    return (
      <main className="min-h-screen">
        <Suspense fallback={<LazyFallback />}>
          <AdminLogin />
        </Suspense>
      </main>
    );
  }

  // Admin views share the AdminLayout shell (which handles auth gating internally)
  if (isAdminView) {
    return (
      <main className="min-h-screen">
        <Suspense fallback={<LazyFallback />}>
          {renderAdminView(view)}
        </Suspense>
      </main>
    );
  }

  // Public website — nav + content + footer, footer sticky to bottom
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <Suspense fallback={<LazyFallback />}>
          {renderPublicView(view)}
        </Suspense>
      </main>
      <PublicFooter />
      <ConciergeChat />
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
