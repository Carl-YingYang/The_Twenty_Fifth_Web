# Project Proposal

## The Twenty-Fifth — Beachfront Villa Booking Platform

---

**Prepared for:**
Josh — The Twenty-Fifth
Botolan, Zambales, Philippines

**Prepared by:**
[Your Name / Team Name]
[Your Email] · [Your Phone]

**Date:** July 2026

---

## Executive Summary

The Twenty-Fifth is a private beachfront villa in Botolan, Zambales, offering two booking options — a 15-pax package and the whole villa (up to 25 guests). Currently, bookings are managed manually through Airbnb, phone calls, and Messenger, which creates coordination overhead, double-booking risk, and missed follow-ups.

This proposal outlines the design and development of a **dedicated booking platform** for The Twenty-Fifth — a professional website where guests can browse, request bookings, and manage their reservations, while you (the host) get a centralized admin dashboard to manage availability, confirmations, payments, and guest communication.

The platform will **reduce manual coordination**, **eliminate double-bookings** through Airbnb calendar sync, **automate guest email reminders**, and **elevate the brand** to match the luxury experience the villa provides — all without requiring the client to learn any technical tools.

---

## Project Understanding

Based on our initial discussions, here is what we understand about the project and your goals:

### About the Villa
- A single private beachfront villa in Botolan, Zambales
- 4 bedrooms, 21 beds, 5.5 baths, sleeps up to 25 guests
- Two booking options: a 15-pax package (3 bedrooms) and the whole villa
- Amenities include an infinity pool, second dipping pool, private beachfront, full kitchen, BBQ area, and more
- Currently listed on Airbnb and managed manually

### Key Pain Points We're Solving
1. **Manual booking coordination** — inquiries come from multiple channels (Airbnb, phone, Messenger), making it hard to track
2. **Double-booking risk** — no single source of truth for availability
3. **No automated guest communication** — reminders, thank-yous, and feedback requests are all manual
4. **No professional web presence** — Airbnb listing alone doesn't convey the full luxury experience
5. **Payment coordination** — bank transfer details are communicated manually each time
6. **No centralized admin view** — calendar, guests, and revenue are scattered

### Your Stated Requirements
From our meeting, the following were specifically requested:
- Two booking options with an auto-upgrade rule (more than 15 guests → whole villa)
- Children classified as ages 9 and below
- Senior/PWD discount with ID upload
- ₱3,000 security deposit disclosure to guests
- Bank transfer as the only payment method (no QR, no cards)
- Admin calendar with blockable dates and Airbnb sync
- Automated emails: booking confirmation, day-before reminder, check-out thank-you, feedback request
- Minimum 3-star rating for published reviews
- Activities section on the website
- Events inquiries routed directly to the business email
- FAQs to be provided by you

---

## Scope of Work

We will design, develop, and deploy a complete booking platform consisting of two main parts: a **public website** (for guests) and an **admin dashboard** (for you and your staff).

### Part 1 — Public Website

#### 1.1 Homepage
- Hero section with villa imagery and tagline
- Featured amenities highlights
- Quick booking widget (dates, guests, package selection)
- About preview
- Gallery preview
- Guest reviews/testimonials
- Call-to-action sections

#### 1.2 The Villa (Rooms & Packages)
- Two booking options clearly presented:
  - **15-Pax Package** — 3 bedrooms, up to 15 guests
  - **Whole Villa** — 4 bedrooms, up to 25 guests
- Detailed descriptions, photos, and pricing for each option
- Auto-upgrade logic: if guest count exceeds 15, automatically switches to Whole Villa
- Children age classification (9 and below)

#### 1.3 Booking Flow
- Step 1: Select dates and guest count
- Step 2: Choose package (auto-recommended based on guest count)
- Step 3: Guest details form (name, email, phone, special requests, Senior/PWD info with ID upload placeholder)
- Step 4: Review and submit
- Confirmation page with reference number
- No online payment — booking is a request, confirmed manually by admin

#### 1.4 Amenities Page
- Full amenities list organized by category (Resort, Room, Dining)
- Visual icons and descriptions for each amenity

#### 1.5 Gallery
- Categorized photo gallery (Exterior, Beach, Pool, Bedrooms, Living Areas, Kitchen, Events, etc.)
- High-resolution images with captions
- Lightbox viewing

#### 1.6 About Page
- The story of The Twenty-Fifth
- What makes the villa special
- Ideal guest profiles
- History/background (optional)

#### 1.7 Activities Page
- On-site activities (swimming, BBQ, beach access, etc.)
- Nearby attractions (Mt. Pinatubo, Anawangin Cove, Liwliwa, local markets)
- Descriptions, photos, and whether free or paid

#### 1.8 Events Page
- Types of events hosted (weddings, birthdays, corporate retreats, etc.)
- Inquiry form that routes directly to the business email
- Photo gallery of past events (if available)

#### 1.9 FAQs Page
- Comprehensive FAQ section (content to be provided by you)
- Searchable and categorized

#### 1.10 Contact Page
- Contact form
- Phone, email, and address
- Map embed
- Social media links (Instagram, Facebook, Messenger, WhatsApp)

#### 1.11 Find My Booking
- Guests can look up their reservation using reference number + email
- View booking status, dates, and details

#### 1.12 AI Concierge Chatbot
- An intelligent chatbot on the website that answers guest questions 24/7
- Trained on the villa's information (amenities, policies, booking process, FAQs)
- Can help guests find information without browsing

### Part 2 — Admin Dashboard

#### 2.1 Dashboard Overview
- Key metrics: today's check-ins/check-outs, pending requests, monthly revenue, occupancy rate
- Recent bookings list
- Quick actions

#### 2.2 Reservations Management
- Full list of all bookings with filters (status, date, guest name)
- Booking detail view (guest info, dates, rooms, payment status, notes)
- Status transitions: Pending → Confirmed → Checked-In → Completed (and Cancelled, Rejected, No-Show)
- Manual booking creation (for phone/walk-in bookings)
- Senior/PWD discount tracking
- Notes and internal comments

#### 2.3 Calendar View
- Visual calendar showing all bookings
- Status colors (Pending, Pencil Book, Confirmed/Booked, Blocked, etc.)
- **Airbnb calendar sync** (iCal import — bookings from Airbnb automatically block dates)
- Manual date blocking (for maintenance, owner use, holds, holidays)
- Click on a date to see all bookings starting/ending/in-progress

#### 2.4 Guest Management
- Guest database with booking history
- Returning guest identification
- Contact details and notes
- Senior/PWD status

#### 2.5 Rooms & Packages Management
- Edit pricing, descriptions, and capacity for both packages
- Manage individual room availability and status
- Upload and organize room photos

#### 2.6 Amenities Management
- Add, edit, or remove amenities
- Organize by category
- Update descriptions and icons

#### 2.7 Gallery Management
- Upload, organize, and caption photos
- Categorize by section
- Set display order

#### 2.8 Content Management
- Edit About page content
- Edit FAQs (add, edit, reorder)
- Edit Activities and Events content
- Edit resort contact info, social links, and check-in/out times

#### 2.9 Settings
- Resort name, tagline, and branding
- Bank transfer details (displayed to guests after booking confirmation)
- Tax rates, service charges, currency
- Security deposit amount
- Email notification settings

#### 2.10 Notifications
- In-app notifications for new bookings, status changes, and pending actions
- Email notifications to admin for new bookings and events inquiries

#### 2.11 Audit Log
- Track all admin actions (who did what, when)
- Useful for accountability and troubleshooting

#### 2.12 AI Admin Copilot (Optional Enhancement)
- An AI assistant within the admin dashboard
- Can answer questions like "How many bookings do we have next weekend?" or "Show me all returning guests this year"
- Can perform approved actions (block dates, update prices) with admin confirmation
- Reduces manual clicks for common tasks

### Part 3 — Automated Email System

| Email | Trigger | Purpose |
|-------|---------|---------|
| Booking Request Confirmation | Immediately after guest submits | Confirm receipt, provide reference number, set expectations |
| Booking Approved | Admin confirms booking | Congratulate guest, provide bank transfer details, deposit deadline |
| Day-Before Reminder | 1 day before check-in | Remind guest of check-in time, send directions, contact info |
| Check-Out Thank You | On check-out day | Thank the guest, request feedback/review |
| Feedback/Review Follow-Up | After check-out email | Collect rating (3+ stars published) and testimonial |
| Event Inquiry Notification | Guest submits event form | Route to business email for manual handling |

All emails will be professionally branded with the resort logo and consistent styling.

### Part 4 — Technical Architecture

#### 4.1 Technology Stack
- **Frontend & API:** Next.js 16 (React) with TypeScript
- **Database:** PostgreSQL (Supabase) — reliable, scalable, managed
- **Hosting:** Vercel (serverless, fast, secure, auto-SSL)
- **Email Service:** Resend (serverless-friendly transactional email)
- **Calendar Sync:** Airbnb iCal import (automated, hourly)

#### 4.2 Security Measures
- Secure admin authentication with role-based access (Admin, Staff)
- Password protection with industry-standard hashing
- Protection against common web vulnerabilities (CSRF, XSS, SQL injection)
- Rate limiting to prevent abuse
- All data encrypted in transit (HTTPS) and at rest (database-level)
- Regular automated database backups

#### 4.3 Performance & Reliability
- Fast page loads (target: under 2 seconds)
- Mobile-first responsive design (works perfectly on phones, tablets, desktops)
- 99.9% uptime (hosted on enterprise-grade infrastructure)
- Content caching for speed
- SEO-optimized (Google can find and rank the website)

#### 4.4 Scalability
The platform is designed to handle growth — from the current single villa to potential future expansion (additional properties, higher booking volume) without needing a rebuild.

---

## Deliverables

Upon project completion, you will receive:

1. **Live Website** — fully functional, deployed, and accessible at your domain
2. **Admin Dashboard** — full management capabilities as described above
3. **Custom Domain Setup** — configured to your preferred domain (e.g., the25thinzambales.com)
4. **Email Automation** — all 6 automated email types configured and tested
5. **Airbnb Calendar Sync** — configured and verified
6. **Admin User Accounts** — set up for you and any staff
7. **Admin Training Session** — a 1–2 hour walkthrough (in person or via video call) on how to use the dashboard
8. **Documentation** — a simple user guide (PDF) covering common admin tasks
9. **Source Code & Ownership** — full source code transferred to you; **you own 100% of the project**
10. **30-Day Post-Launch Support** — bug fixes and adjustments included for 30 days after launch

---

## Project Timeline

The project is estimated to take **4–6 weeks** from kickoff to launch, depending on how quickly content (photos, FAQs, resort info) is provided.

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **Phase 1 — Content Gathering** | Week 1 | You complete the intake form; provide photos, logo, and resort info |
| **Phase 2 — Design Refinement** | Week 1–2 | Replace mockup content with your real branding, photos, and copy |
| **Phase 3 — Feature Finalization** | Week 2–3 | Complete booking flow, admin dashboard, calendar sync, email automation |
| **Phase 4 — Testing & QA** | Week 3–4 | Full testing of booking flow, emails, admin functions, mobile responsiveness |
| **Phase 5 — Client Review** | Week 4 | You review the live site, request adjustments |
| **Phase 6 — Launch** | Week 4–5 | Go live on your domain; admin training session |
| **Phase 7 — Post-Launch Support** | Week 5–6 (30 days) | Bug fixes, adjustments, handover of documentation |

> **Note:** A working prototype is already available for review. This means you can see and test the platform **today** — the remaining work is primarily replacing placeholder content with your real information, finalizing features, and thorough testing.

---

## Client Responsibilities

To keep the project on schedule, we'll need the following from you:

1. **Content** (via the intake form we'll provide)
   - Resort information (name, tagline, story, descriptions)
   - Contact details and social media links
   - Pricing for both packages
   - Amenities list (confirm or edit our proposed list)
   - FAQs (questions and answers)
   - House rules and policies
   - Bank transfer details
   - Business/legal info (optional)

2. **Photos**
   - High-resolution images of the villa (exterior, rooms, pool, beach, amenities, etc.)
   - Logo (if available)
   - Any past event/guest photos (for gallery/events sections)

3. **Access & Accounts**
   - Airbnb iCal link (for calendar sync)
   - Domain access (or we can help you purchase one)
   - Google Maps location pin

4. **Approvals**
   - Review and approve design within 3 business days of each milestone
   - Final review and sign-off before launch

5. **Communication**
   - A single point of contact for decisions and approvals
   - Response within 48 hours for project-related questions

---

## Investment

The project is structured as a **one-time investment** for design, development, deployment, and handover. Ongoing hosting and optional maintenance are separate (see below).

### Project Development

| Package | Description | Investment |
|---------|-------------|------------|
| **Core Platform** | Public website + booking flow + admin dashboard + calendar + email automation + Airbnb sync | ₱[X0,000] |
| **AI Add-On** *(optional)* | AI concierge chatbot for website + AI admin copilot | ₱[X0,000] |
| **Content & Photography Support** *(optional)* | Professional copywriting, photo selection/editing, gallery curation | ₱[X0,000] |

> *Final investment is based on the confirmed scope. We're happy to adjust the package to fit your budget — let's discuss.*

### What's Included
- All design, development, and testing
- Deployment to your domain
- Admin training session
- 30-day post-launch support (bug fixes and minor adjustments)
- Full source code and ownership
- Documentation

### Ongoing Costs (Third-Party, Not Marked Up)
These are direct costs from service providers, passed through at cost:

| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| Vercel (hosting) | Website & admin hosting | Free tier (sufficient) – $20/mo if upgraded |
| Supabase (database) | Database hosting | Free tier (sufficient) – $25/mo if upgraded |
| Resend (email) | Transactional emails | Free for first 3,000/mo, then $20/mo |
| Domain | Your web address (annual) | ~₱1,500/year |

> **Total ongoing cost: ₱0 to ~₱2,000/month** depending on usage. We'll recommend the most cost-effective setup.

### Optional Maintenance Retainer (Post-Launch)
After the 30-day support period, you may choose to retain us for ongoing maintenance:

| Tier | What's Included | Monthly Retainer |
|------|-----------------|------------------|
| **Basic** | Security updates, bug fixes, minor content changes (up to 2 hours/mo) | ₱[X,000]/mo |
| **Professional** | Basic + feature enhancements, performance monitoring, priority support (up to 8 hours/mo) | ₱[X,000]/mo |

> *This is optional. You can also manage the site yourself using the admin dashboard and documentation we provide.*

---

## Terms & Conditions

### Payment Schedule
- **50% deposit** upon signing this proposal (to commence work)
- **30%** upon completion of Phase 4 (Testing & QA)
- **20%** upon launch (Phase 6)

### Revisions
- Up to **2 rounds of revisions** per milestone are included
- Additional revisions billed at ₱[X00]/hour
- Major scope changes (new features not in this proposal) will be quoted separately

### Intellectual Property
- Upon final payment, **full ownership of the website, source code, and all custom work transfers to you**
- Third-party libraries and tools remain under their respective licenses
- We may showcase the project in our portfolio (with your permission)

### Confidentiality
- All business information, pricing, guest data, and operational details shared with us will be kept strictly confidential
- We will not share, sell, or use your data for any purpose outside this project

### Support Period
- **30 days of complimentary support** from the launch date, covering:
  - Bug fixes (issues caused by the code)
  - Minor content adjustments (text changes, photo swaps)
  - Questions and guidance on using the admin dashboard
- Does not cover:
  - Issues caused by third-party services (hosting, email provider, Airbnb changes)
  - New feature requests
  - Content creation or data entry
  - Issues arising from unauthorized modifications to the code

### Warranties
- The website will function as described in this proposal
- We will fix any bugs or defects reported within the 30-day support period at no cost
- We are not liable for issues caused by third-party service outages, domain expiration, or changes to external platforms (Airbnb, Supabase, Vercel, etc.)

### Project Cancellation
- Either party may cancel the project with 7 days' written notice
- Work completed up to the cancellation date is billable and payable
- Deposits are non-refundable once work has commenced

---

## About Us

[Your Name / Team Name] is a [solo developer / small team] specializing in modern web applications for the hospitality and small-business market. We build platforms that are fast, secure, and easy to manage — designed to give business owners control over their digital presence without requiring technical expertise.

### Our Approach
- **Partnership, not just service** — we work with you to understand your business, not just your requirements
- **Modern technology** — we use the same tools trusted by leading tech companies, scaled to fit your budget
- **Transparency** — you'll always know what we're doing, why, and what it costs
- **Teaching over dependency** — we want you to be able to manage your own site, not be locked into us forever

### Why Work With Us
- **Working prototype already exists** — you're not buying on faith; you can see and test the platform today
- **Built for the Philippine market** — we understand local payment habits, guest behavior, and business realities
- **AI-enhanced** — we bring modern AI capabilities (concierge chatbot, admin copilot) that most vendors don't offer
- **Fair pricing** — we charge for value, not for hours; no hidden fees, no surprise invoices
- **Long-term thinking** — we build for scalability, so your platform grows with your business

---

## Next Steps

To proceed with the project:

1. **Review this proposal** — take your time, ask any questions
2. **Confirm the scope** — let us know if you'd like to add, remove, or adjust anything
3. **Discuss the investment** — we're open to finding a package that works for your budget
4. **Sign and pay the deposit** — once agreed, sign this proposal (or a simple agreement) and pay the 50% deposit
5. **Schedule a kickoff call** — we'll walk through the intake form, timeline, and next steps
6. **Start providing content** — photos, resort info, FAQs, etc.

---

## Acceptance

By signing below, both parties agree to the terms outlined in this proposal.

**Client:**

_______________________________
Josh — The Twenty-Fifth
Date: _______________

**Service Provider:**

_______________________________
[Your Name / Team Name]
Date: _______________

---

*Thank you for the opportunity to work with you on The Twenty-Fifth. We're excited to help bring this beautiful property to life online — and to give your guests a booking experience that matches the quality of their stay.*

*— [Your Name / Team Name]*
