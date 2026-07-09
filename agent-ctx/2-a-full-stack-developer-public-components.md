# Task ID 2-a — full-stack-developer (public components)

## Summary
Rewrote all 14 public-facing components for The Twenty-Fifth beachfront villa
reservation platform with the new ocean-teal / sand / coral editorial design
system and non-technical-user UX.

## Files changed
- `src/components/public/shared.tsx` — added `SectionHeading`, expanded
  `amenityIcon` map, kept `FadeUpSection` + `fadeUp`/`stagger` variants.
- `src/components/public/RoomCard.tsx` — editorial card with sharp border,
  capacity badge overlay, img-zoom hover, `RoomCardSkeleton`.
- `src/components/public/PublicNav.tsx` — sticky white/sand nav with 1px
  bottom border, Playfair wordmark + "ZAMBALES" eyebrow, coral underline
  for active link, top-slide mobile sheet with 44px tap targets.
- `src/components/public/PublicFooter.tsx` — dark ocean-teal (#0A3D4A)
  four-column footer (brand/story/socials, Explore, The Villa, Get in Touch),
  Admin Login link in bottom bar.
- `src/components/public/home/HomePage.tsx` — full editorial homepage with
  hero + floating Check Availability card, story, villa configurations,
  amenities preview, gallery teaser, stats band, pull-quote, coral CTA band.
- `src/components/public/rooms/RoomsPage.tsx` — filter chips (All / Whole
  Villa / Bedrooms), responsive 1/2/3 grid.
- `src/components/public/rooms/RoomDetailsPage.tsx` — gallery + thumbnails,
  stat tiles, sticky booking card with price preview, "Book These Dates"
  button → `book` view.
- `src/components/public/amenities/AmenitiesPage.tsx` — grouped by
  `AMENITY_CATEGORIES`, sand-colored icon circles.
- `src/components/public/gallery/GalleryPage.tsx` — masonry grid with
  varying row spans, fixed-overlay lightbox (Esc/←/→ keyboard nav,
  body-scroll lock, 150ms opacity fade only).
- `src/components/public/about/AboutPage.tsx` — hero, story, 3 narrative
  sections (alternating), stats band, location section with map placeholder
  + Get Directions link, CTA band.
- `src/components/public/faqs/FaqsPage.tsx` — plain-language FAQs grouped
  by category (Booking & Payment / The Villa / Getting There / House Rules)
  using shadcn Accordion, Messenger CTA.
- `src/components/public/contact/ContactPage.tsx` — two-column form +
  contact info card with social buttons (Instagram, Facebook, Messenger,
  WhatsApp) + Book Your Stay button.
- `src/components/public/booking/BookingFlow.tsx` — 3-step flow (Dates →
  Details → Confirm) with progress indicator, guests steppers, RHF+Zod
  validation, mobile sticky Continue bar, confirmation screen with huge
  Playfair reference number, "What happens next" 3-step timeline, .ics
  download, Messenger / call / find-my-booking buttons.
- `src/components/public/booking/FindReservation.tsx` — ref + email lookup
  with friendly error CTA, status-aware "What happens next" timeline,
  ocean-teal reservation header card.

## Key decisions
- **Guest details kept in local React state in `BookingFlow` parent** rather
  than the booking store. The foundation `useBookingStore` only holds
  dates/guests/roomId (5 fields) and we were instructed not to modify the
  foundation stores. Lifting state up to the parent keeps Step 2 → Step 3
  data flow clean without breaking the contract.
- **Booking confirmation flow is local**: on POST success, BookingFlow
  flips to the confirmation screen in-place (no view navigation). This
  avoids needing to thread the reservation object through `useViewStore.params`.
  The "booking-confirmation" view in the router simply renders BookingFlow,
  which on a fresh visit (no local `confirmed` state) starts at Step 1.
- **Reference number is whatever the API returns** (RRMS-2026-XXXXXX from
  `generateReferenceNo`). The TTF- prefix mentioned in the task brief is
  just an example format — we display the real string the server returned.
- **Lightbox uses a fixed overlay with 150ms opacity fade only** (no dialog
  animation jank). Keyboard nav + body scroll lock preserved.
- **Brand social icons (Messenger, WhatsApp)** are inline SVGs since lucide
  doesn't ship branded logos for those services.
- **Steppers** (rather than selects) for adults/children counts in Step 1
  of BookingFlow — better UX for non-technical users.
- **No layout animations anywhere** — only opacity + small y fades via
  `FadeUpSection`, per the rest-of-motion budget.
- **Sticky nav** (not fixed) so layout doesn't need top padding adjustments
  on every page.

## Lint & runtime status
- `bun run lint`: 0 errors, 0 warnings.
- Dev server returns 200 on `/`, `/api/rooms`, `/api/amenities`, `/api/gallery`.
- No "Verdara" leftovers in any public component.

## Issues encountered
- Initial BookingFlow had an empty `interface Step2Form extends GuestInfoInput {}`
  which tripped `@typescript-eslint/no-empty-object-type`. Converted to
  `type Step2Form = GuestInfoInput`.
- Removed an unnecessary `eslint-disable react-hooks/exhaustive-deps`
  directive (lint flagged as unused) by adding `booking` to the dependency
  array.

## Hand-off notes for next agent
- The `useBookingStore` does NOT store guest details (firstName etc).
  BookingFlow keeps those in component-local state. If a future agent
  wants to surface "your details" elsewhere (e.g. admin), the API will be
  the source of truth — the `POST /api/reservations` endpoint stores guest
  data in the `Guest` table.
- `PublicNav` is now sticky (not fixed). Page components don't need
  `pt-16 md:pt-20` anymore; some legacy pages still have it as a defensive
  spacer — harmless.


---

## Re-verification pass

A re-verification pass was run on the same Task ID 2-a after re-reading
the worklog and the current foundation files (`constants.ts`, `globals.css`,
`types/index.ts`, the Zustand stores, `api-client.ts`, `utils.ts`,
`validators.ts`). The pass confirmed that all 14 public-facing components
were already complete and spec-compliant from the prior pass — no code
changes were required.

### Verification checklist
- All 14 files present in `src/components/public/` (4589 LOC total).
- No "Verdara" leftovers (ripgrep across the public/ tree).
- All shadcn/ui imports used (accordion, badge, button, card, form, input,
  label, select, sheet, textarea) exist in `src/components/ui/`.
- All resort data references `RESORT_INFO` from `@/lib/constants`
  (phone, phoneRaw, email, address, addressShort, story, description,
  checkInTime, checkOutTime, social.{instagram,facebook,messenger,
  whatsapp,airbnb}).
- `useMounted()` guard used in PublicNav for client-only state.
- Motion budget respected: opacity + y fades only via `FadeUpSection`.
- BookingFlow has 3 steps + confirmation screen with all required elements
  (huge Playfair reference, PENDING.friendly status badge, 3-step
  "What happens next" timeline, .ics download, Messenger link, tel: link,
  Find My Booking, Back to home).
- FindReservation uses `BOOKING_STATUS_CONFIG[status].friendly` for the
  status badge and `/api/reservations/lookup?referenceNo=...&email=...`.
- `bun run lint` → 0 errors, 0 warnings (exit 0).
- Dev server returns 200 on `/`, `/api/rooms`, `/api/amenities`,
  `/api/gallery`.
- dev.log shows no recent errors (only a stale `void XCircle` parse error
  from a previous transient state, long since resolved).

### Conclusion
Task 2-a is complete and verified. No additional work needed.
