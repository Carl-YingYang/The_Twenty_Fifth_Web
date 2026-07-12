// The Twenty-Fifth — Project Proposal & Partnership Brief
// Built with the docx skill. Cover Recipe R1 (Pure Paragraph Cover, Left-Aligned)
// Custom palette: deep teal + coral + cream/sand neutrals (luxury hospitality).

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageBreak, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TableLayoutType, TableOfContents, SectionType,
  LevelFormat, VerticalAlign,
} from "docx";
import fs from "fs";

// ──────────────────────────────────────────────────────────────────────────
// 1. Palette — deep teal + coral + cream/sand (luxury hospitality brand)
// ──────────────────────────────────────────────────────────────────────────
const palette = {
  bg: "0F4C5C",          // deep teal — cover background
  primary: "0F4C5C",     // body headings color (deep teal)
  body: "1A2A30",        // body text — near-black with teal warmth
  secondary: "5A6970",   // captions / soft text
  accent: "E36F6F",      // coral accent
  surface: "FBF6EE",     // cream / sand for alternating rows
  // Cover-specific colors (read by R1 recipe)
  titleColor: "FBF6EE",     // cream
  subtitleColor: "E8D9C0",  // warm sand
  metaColor: "F0C7B8",      // coral tint
  accent2: "E36F6F",        // coral (used for borders / english label)
  footerColor: "B8CCD2",    // teal tint
  // Table colors (used on white body pages)
  tableHeaderBg: "0F4C5C",  // deep teal header
  tableHeaderText: "FFFFFF",
  tableAccentLine: "0F4C5C",
  tableInnerLine: "D6D9D8",
  tableSurface: "FBF6EE",
};

const P = palette;
const c = (hex) => hex.replace("#", "");

// ──────────────────────────────────────────────────────────────────────────
// 2. Border helpers
// ──────────────────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = {
  top: NB, bottom: NB, left: NB, right: NB,
  insideHorizontal: NB, insideVertical: NB,
};

// ──────────────────────────────────────────────────────────────────────────
// 3. Cover Recipe R1 (Pure Paragraph Cover, Left-Aligned) — adapted
//    Full-page deep teal bg + cream title + coral accent borders.
//    Manual title split (3 lines) — calcTitleLayout over-estimates width
//    for English. We pre-split semantically.
// ──────────────────────────────────────────────────────────────────────────
function buildCoverR1Custom(config) {
  const padL = 1200, padR = 800;
  const titlePt = 36;                      // 36pt — elegant, fits 3 lines
  const titleSize = titlePt * 2;           // 72 half-points
  const titleLines = config.titleLines;    // pre-split array

  // Manual spacing (calibrated for 5 meta lines + 3 title lines + subtitle + footer)
  // Total height budget: 16838 - 1200 (safety) = 15638
  // Top whitespace: 1800 (luxury breathing room)
  // Bottom whitespace: 1400
  const topSpacing = 1800;
  const bottomSpacing = 1400;

  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];

  // 1. Top whitespace
  children.push(new Paragraph({ spacing: { before: topSpacing } }));

  // 2. English label with accent bottom border
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR },
      spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({
        text: config.englishLabel.split("").join("  "),
        size: 18, color: P.accent,
        font: { ascii: "Calibri", eastAsia: "SimHei" },
        characterSpacing: 40,
      })],
    }));
  }

  // 3. Main title (3 lines, dynamic line spacing to prevent clipping)
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: {
        after: i < titleLines.length - 1 ? 100 : 300,
        line: Math.ceil(titlePt * 23),
        lineRule: "atLeast",
      },
      children: [new TextRun({
        text: titleLines[i],
        size: titleSize, bold: true,
        color: P.titleColor,
        font: { eastAsia: "SimHei", ascii: "Calibri" },
      })],
    }));
  }

  // 4. Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: 800 },
      children: [new TextRun({
        text: config.subtitle, size: 26, color: P.subtitleColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Calibri" },
        italics: true,
      })],
    }));
  }

  // 5. Meta info lines with left accent border
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 },
      spacing: { after: 120, line: 320, lineRule: "atLeast" },
      border: { left: accentLeft },
      children: [new TextRun({
        text: line, size: 22, color: P.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Calibri" },
      })],
    }));
  }

  // 6. Bottom whitespace
  children.push(new Paragraph({ spacing: { before: bottomSpacing } }));

  // 7. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({
        text: config.footerLeft || "",
        size: 18, color: P.footerColor, font: { ascii: "Calibri" },
      }),
      new TextRun({ text: "                                        " }),
      new TextRun({
        text: config.footerRight || "",
        size: 18, color: P.footerColor, font: { ascii: "Calibri" },
      }),
    ],
  }));

  // Single 16838 wrapper table (R1 architecture)
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg },
        borders: noBorders,
        verticalAlign: VerticalAlign.TOP,
        children,
      })],
    })],
  })];
}

// ──────────────────────────────────────────────────────────────────────────
// 4. Body content helpers
// ──────────────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({
      text, bold: true, size: 36, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140, line: 312 },
    children: [new TextRun({
      text, bold: true, size: 28, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100, line: 312 },
    children: [new TextRun({
      text, bold: true, size: 24, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function body(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text.map(t => typeof t === "string"
        ? new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })
        : new TextRun({ size: 22, color: c(P.body), font: { ascii: "Calibri" }, ...t }))
    : [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })];
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: runs,
    ...opts,
  });
}

// Numbered list paragraph — each list needs unique reference name
function numItem(text, reference, level = 0) {
  return new Paragraph({
    numbering: { reference, level },
    spacing: { after: 80, line: 312 },
    children: [new TextRun({
      text, size: 22, color: c(P.body), font: { ascii: "Calibri" },
    })],
  });
}

// Bullet list paragraph
function bulletItem(text) {
  const runs = Array.isArray(text)
    ? text.map(t => typeof t === "string"
        ? new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })
        : new TextRun({ size: 22, color: c(P.body), font: { ascii: "Calibri" }, ...t }))
    : [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })];
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 312 },
    children: runs,
  });
}

// Signature block: two-column table (label | line/value)
function signatureBlock(party) {
  const cellMargins = { top: 120, bottom: 120, left: 160, right: 160 };
  const lineBorder = { style: BorderStyle.SINGLE, size: 4, color: "888888" };
  const rows = [
    ["Name:", party.name],
    ["Signature:", "____________________________"],
    ["Date:", "____________________________"],
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: rows.map(([label, value]) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          borders: noBorders,
          children: [new Paragraph({
            spacing: { line: 312 },
            children: [new TextRun({
              text: label, bold: true, size: 22, color: c(P.primary),
              font: { ascii: "Calibri" },
            })],
          })],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          borders: { top: NB, bottom: lineBorder, left: NB, right: NB },
          children: [new Paragraph({
            spacing: { line: 312 },
            children: [new TextRun({
              text: value, size: 22, color: c(P.body),
              font: { ascii: "Calibri" },
            })],
          })],
        }),
      ],
    })),
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 5. Timeline table builder (Horizontal-Only style, deep teal header)
// ──────────────────────────────────────────────────────────────────────────
function buildTimelineTable() {
  const headers = ["Phase", "Focus", "Timing", "Outcome / Milestone"];
  const data = [
    ["Phase 1", "Discovery & Design Finalization", "Week 1", "Final design approved"],
    ["Phase 2", "Public Website Build (on prototype)", "Weeks 2–3", "Website live on staging URL for review"],
    ["Phase 3", "Admin Dashboard", "Week 4", "Admin panel ready for testing"],
    ["Phase 4", "Email + Calendar Sync + AI", "Week 5", "Automation functional"],
    ["Phase 5", "Content Upload & QA", "Week 6", "All real content in, final testing"],
    ["Phase 6", "Launch & Handover", "End of Week 6", "Website live, training complete"],
    ["Post-Launch", "Support Window", "Weeks 7–10", "30-day post-launch support"],
  ];
  const widths = [13, 36, 17, 34];
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((text, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      margins: cellMargins,
      shading: { type: ShadingType.CLEAR, fill: P.tableHeaderBg },
      children: [new Paragraph({
        spacing: { line: 312 },
        children: [new TextRun({
          text, bold: true, size: 20, color: P.tableHeaderText,
          font: { ascii: "Calibri" },
        })],
      })],
    })),
  });

  const dataRows = data.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map((cellText, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      margins: cellMargins,
      shading: idx % 2 === 0
        ? { type: ShadingType.CLEAR, fill: P.tableSurface }
        : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      children: [new Paragraph({
        spacing: { line: 312 },
        children: [new TextRun({
          text: cellText,
          bold: i === 0,
          size: 20, color: c(P.body),
          font: { ascii: "Calibri" },
        })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: P.tableAccentLine },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: P.tableAccentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.tableInnerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 6. Footer builders
// ──────────────────────────────────────────────────────────────────────────
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240 },
      children: [
        new TextRun({
          children: [PageNumber.CURRENT],
          size: 18, color: "808080", font: { ascii: "Calibri" },
        }),
      ],
    })],
  });
}

function bodyHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 4 } },
      children: [new TextRun({
        text: "The Twenty-Fifth — Project Proposal & Partnership Brief",
        size: 16, color: P.secondary, italics: true,
        font: { ascii: "Calibri" },
      })],
    })],
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 7. Today's date
// ──────────────────────────────────────────────────────────────────────────
const todayDate = new Date().toLocaleDateString("en-US", {
  year: "numeric", month: "long", day: "numeric",
});

// ──────────────────────────────────────────────────────────────────────────
// 8. Cover content
// ──────────────────────────────────────────────────────────────────────────
const coverConfig = {
  englishLabel: "STRICTLY CONFIDENTIAL",
  titleLines: [
    "The Twenty-Fifth —",
    "Website, Booking System",
    "& Admin Platform",
  ],
  subtitle: "Project Proposal & Partnership Brief",
  metaLines: [
    "Prepared for: Josh — The Twenty-Fifth",
    "Beachfront Villa, Botolan, Zambales",
    "Prepared by: Carl Micky Nieva & Jerico Guimban",
    `Date: ${todayDate}`,
    "Version: 1.0",
  ],
  footerLeft: "Strictly Confidential",
  footerRight: "Project Proposal — Version 1.0",
};

// ──────────────────────────────────────────────────────────────────────────
// 9. Body content — assemble all 11 sections
// ──────────────────────────────────────────────────────────────────────────
const bodyChildren = [];

// ── Section 2: Executive Summary ──────────────────────────────────────
bodyChildren.push(h1("Executive Summary"));
bodyChildren.push(body(
  "This proposal outlines the design and delivery of a custom website, booking system, and admin platform purpose-built for The Twenty-Fifth — an exclusive private beachfront villa in Botolan, Zambales. The goal is to replace the fragmented manual coordination currently spread across Airbnb, phone calls, and Messenger with a single, unified system that ends double-bookings and presents the villa professionally online. The result: Josh gains a centralized admin dashboard with calendar control, automated guest communications, and Airbnb calendar sync, while guests enjoy a seamless, trustworthy booking experience from first visit to check-out. A working prototype of the platform already exists, which compresses delivery to four to six weeks and de-risks the build substantially. The engagement is structured as three modular packages — Core Platform, AI Add-On, and Content & Branding — so Josh can scale scope to fit The Twenty-Fifth's goals and budget."
));

// ── Section 3: Project Understanding ──────────────────────────────────
bodyChildren.push(h1("Project Understanding"));

bodyChildren.push(h2("The Villa"));
bodyChildren.push(body(
  "The Twenty-Fifth is an exclusive private beachfront villa in Botolan, Zambales — a premium private escape designed for families, friends, and small groups who want the entire coast to themselves for a few days. The villa offers two booking options: a 15-pax package that opens three bedrooms, and the whole villa which accommodates up to 25 guests across all four bedrooms. Payments are bank-transfer only — no QR codes, no card facilities — keeping the operation simple and aligned with how guests in this market already transact. The brand positioning is unambiguous: a refined, restful, and exclusive coastal retreat where the experience is the product, not the room rate."
));

bodyChildren.push(h2("Current Pain Points"));
bodyChildren.push(body(
  "Today, bookings arrive fragmented across Airbnb, phone calls, and Messenger, with no single source of truth. Josh must check the calendar manually each time a new inquiry lands to avoid double-bookings — a process that is both slow and error-prone. Guest details such as Senior and PWD IDs, headcount changes, and special requests are scattered across chat threads and are easy to lose track of. There are no automated email confirmations or reminders, so Josh handles every guest touchpoint by hand. The villa has no professional standalone website; clients only see the Airbnb listing, which caps the brand's perceived value. Reviews are trapped on Airbnb and cannot be leveraged on the villa's own channels. Payments are bank-transfer only, but the process is communicated ad hoc per guest, which causes friction and follow-up messages."
));

bodyChildren.push(h2("Confirmed Requirements"));
bodyChildren.push(body(
  "The following fourteen requirements were confirmed during our discussions and form the baseline scope of the engagement. Each one maps directly to a feature in the proposed platform."
));
const reqs = [
  "A professional website showcasing the villa, rooms, amenities, and gallery.",
  "Online booking with two options: 15-pax package and whole villa.",
  "Auto-upgrade rule — bookings above 15 guests automatically switch to the whole villa.",
  "Children policy — children up to 9 years old only.",
  "Senior/PWD discount — guest can indicate during booking; IDs required.",
  "₱3,000 security deposit — must be communicated clearly to guests.",
  "Bank transfer only — no QR codes, no card payments.",
  "Airbnb calendar sync — block dates automatically when Airbnb is booked.",
  "Admin calendar — with statuses (Pending, Pencil Book, Booked, Cancelled, Blocked).",
  "Automated email notifications — booking confirmation, day-before reminder, check-out thank-you, feedback request.",
  "Ratings & reviews — 3-star minimum displayed on site.",
  "Activities & events — showcased on the website; event inquiries routed to email.",
  "Downpayment policy — to be finalized and built into the booking flow.",
  "Content ownership — all photos, copy, and branding provided by Josh.",
];
reqs.forEach((r, i) => bodyChildren.push(numItem(r, "list-requirements")));

// ── Section 4: Scope of Work ──────────────────────────────────────────
bodyChildren.push(h1("Scope of Work"));
bodyChildren.push(body(
  "The work is organized into four interlocking parts: a public-facing website, an admin dashboard for Josh, an automated email system, and the underlying technical architecture. Each part is described below in full detail so Josh can see exactly what is being built and why."
));

// Part A
bodyChildren.push(h2("Part A — Public Website (Guest-Facing)"));
const partA = [
  ["A1. Homepage & Branding",
    "A custom luxury beachfront design built on the villa's deep teal and coral palette, with an animated hero featuring villa imagery, the brand tagline, a short brand story, key selling points, and a quick booking widget (dates, guests, package)."],
  ["A2. The Villa / Rooms Page",
    "Showcases all four bedrooms with photos, capacity, bed configurations, and amenities. Pricing is shown per room and per package, with real-time availability reflected from the admin calendar."],
  ["A3. Amenities Page",
    "A full amenities grid (pool, beach access, kitchen, BBQ, etc.) organized by category so guests can quickly see what is included in their stay."],
  ["A4. Activities Page",
    "On-site and nearby attractions presented with photo galleries, short descriptions, and suggested itineraries to help guests plan their days."],
  ["A5. About Page",
    "The story of The Twenty-Fifth, what makes the villa special, ideal guest profiles, and gallery highlights — written to position the villa as a premium private escape."],
  ["A6. Gallery Page",
    "A filterable photo gallery (exterior, beach, pool, bedrooms, events) with lightbox viewing, fully optimized for mobile browsing."],
  ["A7. Booking Flow",
    "A four-step flow: (1) select dates and guests with auto-upgrade logic for parties above 15; (2) choose package or individual rooms; (3) fill out guest details — name, email, phone, Senior/PWD indicator, special requests; (4) review and submit, generating a booking reference in the format TTF-2026-XXXXXX. No online payment is collected; bank details are shown after confirmation."],
  ["A8. Events Page",
    "Showcases event hosting — weddings, birthdays, corporate retreats — with an inquiry form that routes directly to Josh's email for follow-up."],
  ["A9. Contact Page",
    "A contact form routed to email, plus phone, email, address, and an embedded map for easy directions."],
  ["A10. FAQs Page",
    "A comprehensive FAQ section (18+ questions) covering booking, payment, house rules, getting there, and events. Editable by Josh at any time through the admin dashboard."],
  ["A11. Reviews Display",
    "Approved guest reviews with a 3-star minimum displayed on site. Shows an overall rating and review count, plus individual review cards with star ratings."],
  ["A12. Blog / News",
    "An optional content marketing section where Josh can post updates, promos, and stories to keep the website fresh and improve SEO over time."],
];
partA.forEach(([title, desc]) => {
  bodyChildren.push(h3(title));
  bodyChildren.push(body(desc));
});

// Part B
bodyChildren.push(h2("Part B — Admin Dashboard (Josh's Control Panel)"));
const partB = [
  ["B1. Secure Login",
    "Discreet access — not visible in the public footer — protected by secure authentication so only authorized users can manage the villa."],
  ["B2. Calendar View",
    "Monthly, weekly, and daily calendar views with color-coded statuses (Pending, Pencil Book, Booked, Checked-In, Completed, Cancelled, Blocked). Josh can manually block dates for maintenance, owner use, or holidays, and Airbnb bookings are auto-imported via iCal sync."],
  ["B3. Reservations Management",
    "View all reservations with filters by date, status, or guest name. Approve or decline pending bookings, update booking status, edit booking details, add internal notes, and trigger deposit reminders — all from one screen."],
  ["B4. Guest Management",
    "A guest database capturing name, contact details, and booking history, with Senior/PWD indicators, preference notes, and a returning-guest flag so Josh can offer a personal touch on repeat visits."],
  ["B5. Content Management",
    "Edit room details, manage amenities, update the gallery, edit FAQs, update the About page, manage activities and events, and update contact info and social links — all without touching code."],
  ["B6. Reviews Moderation",
    "Approve or reject submitted reviews; reviews below 3 stars are sent only to Josh and never published. Josh can also respond publicly to approved reviews."],
  ["B7. Pricing & Packages",
    "Update pricing (seasonal rates, packages), configure the 15-pax vs whole-villa pricing, and set auto-upgrade thresholds as the villa's strategy evolves."],
  ["B8. Email Templates",
    "Configure each of the six automated email notification templates, with a preview pane and test-send capability before going live."],
  ["B9. Settings",
    "Manage bank transfer details, booking policies (deposit, cancellation), business hours, and check-in/check-out times in one central place."],
  ["B10. User Roles",
    "Manage admin user accounts and role-based permissions, so the villa can grant limited access to staff or partners without exposing everything."],
  ["B11. Analytics Dashboard",
    "Booking metrics, revenue tracking, occupancy rates, guest demographics, and traffic sources — giving Josh a clear, at-a-glance view of how the business is performing."],
  ["B12. AI Admin Copilot (Add-on)",
    "Natural-language quick actions such as \"Block July 15–17 for maintenance\" or \"Show me all bookings next weekend.\" Every AI action requires Josh's explicit approval before executing — nothing happens automatically."],
];
partB.forEach(([title, desc]) => {
  bodyChildren.push(h3(title));
  bodyChildren.push(body(desc));
});

// Part C
bodyChildren.push(h2("Part C — Email System"));
bodyChildren.push(body(
  "Six automated emails handle every guest touchpoint from booking to feedback. Each template is fully editable in the admin dashboard and can be previewed and test-sent before going live."
));
const partC = [
  ["C1. Booking Confirmation",
    "Sent immediately to the guest on submission of the booking form. Confirms receipt and includes the booking reference number so the guest has a clear record of their request."],
  ["C2. Booking Approved",
    "Sent when Josh approves the booking in the admin dashboard. Includes bank transfer details and the deposit deadline so the guest knows exactly what to do next."],
  ["C3. Day-Before Reminder",
    "Sent one day before check-in. Includes directions, contact information, and check-in time so the guest arrives prepared and stress-free."],
  ["C4. Check-Out Thank-You",
    "Sent on check-out day. Expresses gratitude for the stay and gently opens the door to a review request, keeping the relationship warm after departure."],
  ["C5. Feedback Request",
    "Sent shortly after check-out with a link to the review form. Reviews below 3 stars are routed only to Josh and never published; reviews at 3 stars or above are eligible for public display."],
  ["C6. Event Inquiry Auto-Reply",
    "Sent automatically when an event inquiry form is submitted. Acknowledges receipt and sets expectations on response time so the inquirer knows their message has landed."],
];
partC.forEach(([title, desc]) => {
  bodyChildren.push(h3(title));
  bodyChildren.push(body(desc));
});

// Part D
bodyChildren.push(h2("Part D — Technical Architecture"));
bodyChildren.push(body(
  "The platform is engineered on a modern, production-grade stack chosen for reliability, performance, and long-term maintainability. Every choice reflects the operational reality of running a beachfront villa business."
));
const techStack = [
  ["Framework:", "Next.js 16 (App Router) with TypeScript — modern React with server-side rendering for speed and SEO."],
  ["Database:", "Prisma ORM with SQLite for development, with a production-ready migration path to PostgreSQL when the business scales."],
  ["Styling:", "Tailwind CSS 4 with the shadcn/ui component library (New York style) — a refined, accessible design system."],
  ["Authentication:", "NextAuth.js for secure admin access, with session management and protected routes."],
  ["State management:", "Zustand for client state and TanStack Query for server state — predictable, fast, and well-supported."],
  ["Calendar sync:", "An iCal sync engine providing one-way Airbnb-to-website import so Airbnb bookings automatically block the villa calendar."],
  ["Email service:", "Transactional email with templated notifications, delivered through a reliable third-party provider."],
  ["Image optimization:", "Automatic compression and responsive delivery for fast gallery loading on any device."],
  ["SEO:", "Server-side rendering, structured metadata, XML sitemap, and Google Analytics integration out of the box."],
  ["Security:", "SSL/HTTPS, rate limiting, PII encryption, daily database backups, and secure admin authentication."],
  ["Mobile-first:", "The entire experience is optimized for mobile, tablet, and desktop — over 70% of villa guests browse on mobile."],
  ["Performance:", "Target sub-3-second page loads on a 4G connection, so the site never loses a guest to slow rendering."],
  ["Hosting:", "Managed hosting with a 99.9% uptime target; the first 12 months of hosting and domain are included in the Core Platform package."],
];
techStack.forEach(([label, desc]) => {
  bodyChildren.push(new Paragraph({
    spacing: { after: 100, line: 312 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: label + " ", bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } }),
      new TextRun({ text: desc, size: 22, color: c(P.body), font: { ascii: "Calibri" } }),
    ],
  }));
});

// ── Section 5: Deliverables ───────────────────────────────────────────
bodyChildren.push(h1("Deliverables"));
bodyChildren.push(body(
  "At the conclusion of the engagement, Josh receives the following ten tangible deliverables. Together they constitute a complete, self-sufficient platform that Josh owns outright and can operate without depending on us for day-to-day changes."
));
const deliverables = [
  "Live website accessible at the official domain.",
  "Admin dashboard with full booking and content management capabilities.",
  "Mobile-optimized experience across all devices (phone, tablet, desktop).",
  "Email notification system with six automated email types.",
  "Airbnb calendar sync configured and tested end-to-end.",
  "AI guest concierge chatbot (add-on) — answers FAQs and common guest questions 24/7.",
  "AI admin copilot (add-on) — natural-language quick actions, all subject to Josh's approval.",
  "Content management system — Josh can edit everything without a developer.",
  "Admin training (live session, plus a recorded version) and a written documentation manual.",
  "100% source code ownership — Josh owns the final product outright — plus 30-day post-launch support and 12 months of hosting and domain.",
];
deliverables.forEach((d) => bodyChildren.push(numItem(d, "list-deliverables")));

// ── Section 6: Timeline ───────────────────────────────────────────────
bodyChildren.push(h1("Timeline"));
bodyChildren.push(body(
  "Total delivery is four to six weeks. A working prototype of the platform already exists, which compresses the timeline substantially and de-risks the build — we are not starting from a blank slate. The table below shows the phase-by-phase breakdown, with approval milestones at the end of each phase."
));
bodyChildren.push(new Paragraph({
  keepNext: true,
  spacing: { before: 120, after: 80, line: 312 },
  children: [new TextRun({
    text: "Table 1 — Project Timeline & Milestones",
    bold: true, size: 20, color: c(P.secondary), italics: true,
    font: { ascii: "Calibri" },
  })],
}));
bodyChildren.push(buildTimelineTable());
bodyChildren.push(body(
  "Note: The timeline above assumes timely content delivery and feedback from Josh (within two to three business days per request). Any delays in content, photos, or feedback will extend the timeline accordingly, and we will communicate any timeline impacts as early as possible so Josh is never surprised."
));

// ── Section 7: Client Responsibilities ───────────────────────────────
bodyChildren.push(h1("Client Responsibilities"));
bodyChildren.push(body(
  "A smooth project depends on a tight feedback loop between our team and Josh. The responsibilities below are grouped by project phase so they are easy to anticipate and plan for."
));

bodyChildren.push(h2("At Project Kickoff"));
[
  "Confirm final branding — logo, colors, and tagline.",
  "Provide existing photos of the villa, rooms, and grounds.",
  "Confirm domain ownership (or authorize us to register a new domain on Josh's behalf).",
  "Share Airbnb listing access so we can configure the iCal sync.",
].forEach(t => bodyChildren.push(bulletItem(t)));

bodyChildren.push(h2("During Development (Weeks 1–5)"));
[
  "Respond to content clarification questions within two to three business days.",
  "Provide high-resolution photos — we will send a categorized checklist to make this easy.",
  "Review and approve design mockups within three business days of receipt.",
  "Finalize pricing, policies (deposit, cancellation), and FAQ answers.",
].forEach(t => bodyChildren.push(bulletItem(t)));

bodyChildren.push(h2("Before Launch (Week 6)"));
[
  "Provide final bank transfer details for guest-facing communications.",
  "Confirm all content is accurate and approved for launch.",
  "Complete the admin training session (live, plus the recorded version for reference).",
  "Approve the final website for launch.",
].forEach(t => bodyChildren.push(bulletItem(t)));

bodyChildren.push(h2("Post-Launch"));
[
  "Monitor bookings and respond to guest inquiries promptly.",
  "Report any bugs or issues to us during the 30-day post-launch support window.",
].forEach(t => bodyChildren.push(bulletItem(t)));

bodyChildren.push(body(
  "If content delivery or feedback is delayed, the project timeline will extend accordingly. We will communicate any timeline impacts as early as possible so there are no surprises."
));

// ── Section 8: Investment ─────────────────────────────────────────────
bodyChildren.push(h1("Investment"));
bodyChildren.push(body(
  "We have structured the investment as three modular packages so Josh can scale the scope to fit The Twenty-Fifth's goals and budget. As this is our first engagement of this kind, we have intentionally set fair, transparent rates that reflect the working prototype already in place and our genuine interest in building a long-term relationship with The Twenty-Fifth. Each package is self-contained and can be selected independently, though the Core Platform is a prerequisite for the AI Add-On."
));
bodyChildren.push(body(
  "The ranges below reflect the breadth of the scope: the lower end assumes a leaner feature set and Josh providing most of the visual assets, while the upper end assumes the full scope as described in this document. The final figure within each range is confirmed during the scope-finalization call."
));

bodyChildren.push(h2("Investment Packages"));

bodyChildren.push(h3("Core Platform"));
bodyChildren.push(body(
  "The Core Platform is the foundation — everything needed to launch a professional, fully-operational villa booking system. It includes:"
));
[
  "Custom website design and development.",
  "Admin dashboard with full booking management.",
  "Mobile-responsive design across all devices.",
  "Email notification system (six automated emails).",
  "Airbnb calendar sync configured and tested.",
  "Content management system — Josh edits everything without a developer.",
  "SEO optimization and Google Analytics integration.",
  "SSL certificate and security hardening.",
  "Admin training (live, plus a recorded version).",
  "Documentation manual.",
  "30-day post-launch support.",
  "First 12 months of hosting and domain.",
].forEach(t => bodyChildren.push(bulletItem(t)));
bodyChildren.push(new Paragraph({
  spacing: { before: 120, after: 200, line: 312 },
  children: [
    new TextRun({ text: "Investment: ", bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } }),
    new TextRun({ text: "₱30,000 – ₱45,000", size: 22, color: c(P.accent), italics: true, bold: true, font: { ascii: "Calibri" } }),
  ],
}));

bodyChildren.push(h3("AI Add-On"));
bodyChildren.push(body(
  "The AI Add-On layers intelligent automation on top of the Core Platform, saving Josh time on both guest-facing and back-office tasks. It includes:"
));
[
  "AI guest concierge chatbot — answers FAQs and common guest questions 24/7, on the public website.",
  "AI admin copilot — natural-language quick actions inside the admin dashboard (e.g., \"Block July 15–17 for maintenance\"). All AI actions require Josh's explicit approval before executing.",
].forEach(t => bodyChildren.push(bulletItem(t)));
bodyChildren.push(new Paragraph({
  spacing: { before: 120, after: 200, line: 312 },
  children: [
    new TextRun({ text: "Investment: ", bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } }),
    new TextRun({ text: "₱8,000 – ₱15,000", size: 22, color: c(P.accent), italics: true, bold: true, font: { ascii: "Calibri" } }),
  ],
}));

bodyChildren.push(h3("Content & Branding"));
bodyChildren.push(body(
  "The Content & Branding package is for Josh if he would like professional support producing the villa's written and visual assets. It includes:"
));
[
  "Professional copywriting for the About and Story pages.",
  "A custom photography session at the villa.",
  "Brand asset refinement — logo polish, color system, and typography.",
].forEach(t => bodyChildren.push(bulletItem(t)));
bodyChildren.push(new Paragraph({
  spacing: { before: 120, after: 200, line: 312 },
  children: [
    new TextRun({ text: "Investment: ", bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } }),
    new TextRun({ text: "₱5,000 – ₱12,000", size: 22, color: c(P.accent), italics: true, bold: true, font: { ascii: "Calibri" } }),
  ],
}));

bodyChildren.push(h2("Bundled Investment (All Three Packages)"));
bodyChildren.push(body(
  "If Josh elects to proceed with all three packages together, the total bundled investment ranges from approximately ₱40,000 to ₱65,000. Selecting the bundle represents the most complete transformation of The Twenty-Fifth's digital presence in a single engagement, and includes a small bundle discount compared to selecting each package independently."
));
bodyChildren.push(body(
  "For reference, the standard payment schedule of 50% / 30% / 20% (detailed in the Terms & Conditions) applies to whichever package combination is selected."
));

bodyChildren.push(h2("Ongoing Cost Transparency (After Year 1)"));
bodyChildren.push(body(
  "The first 12 months of hosting and domain registration are included in the Core Platform package. After Year 1, two ongoing cost items apply, both passed through at cost with no markup:"
));
bodyChildren.push(bulletItem([
  { text: "Hosting & domain renewal: ", bold: true, color: c(P.primary) },
  "approximately ₱6,000 per year, passed through at cost with no markup.",
]));
bodyChildren.push(bulletItem([
  { text: "Optional maintenance retainer: ", bold: true, color: c(P.primary) },
  "₱2,000 per month, which includes platform updates, daily backups, minor content changes, and priority support.",
]));
bodyChildren.push(body(
  "Josh is never locked in — after Year 1 he may continue hosting through us at cost, or migrate to a provider of his choice. We will provide full source code and a clean handover either way."
));

bodyChildren.push(h2("Closing"));
bodyChildren.push(body(
  "The final investment within each range will be confirmed together during a scope-finalization call, once we have aligned on which packages and add-ons best fit The Twenty-Fifth's goals. As this is our first engagement of this kind, we have priced these packages as a genuine partnership — fair to The Twenty-Fifth and sustainable for us to deliver well. Our priority is to do excellent work, earn Josh's trust, and build a relationship that opens the door to referrals and future collaborations."
));

// ── Section 9: Terms & Conditions ─────────────────────────────────────
bodyChildren.push(h1("Terms & Conditions"));
bodyChildren.push(body(
  "The following ten clauses govern the engagement. They are written in plain language so both parties share the same expectations from day one."
));

const terms = [
  ["1. Project Commencement",
   "Work begins upon receipt of the signed proposal and the kickoff payment. A project kickoff meeting will be scheduled within three business days of commencement to align on content, branding, and the immediate next steps."],
  ["2. Payment Schedule",
   "The total investment is payable in three milestones: 50% upon signing (kickoff), 30% at mid-development (public website approval), and 20% at final launch and handover. Invoices are due within seven days of issuance. Late payments may pause project work until resolved."],
  ["3. Revisions",
   "Design phase: up to two rounds of revisions are included; additional rounds are quoted separately. Development phase: bug fixes and minor adjustments are included; major scope changes are quoted separately. Revisions requested after final approval may incur additional charges."],
  ["4. Timeline",
   "The four-to-six-week timeline assumes timely feedback and content delivery from Josh (within two to three business days per request). Delays caused by late feedback, content, or approvals will extend the timeline accordingly. We commit to communicating any delays on our end immediately."],
  ["5. Intellectual Property",
   "Upon final payment, Josh receives 100% ownership of the website source code, the admin dashboard, all custom designs and branding assets, and all content provided by Josh. We retain ownership of pre-existing frameworks, libraries, and tools used (open-source), and the right to showcase this project in our portfolio unless Josh requests otherwise in writing."],
  ["6. Confidentiality",
   "All guest data, financial information, and business details shared with us during the project will be kept strictly confidential. We will not share, sell, or use Josh's business data for any purpose outside this project."],
  ["7. Hosting & Maintenance",
   "The first 12 months of hosting and domain registration are included. After Year 1, Josh may continue hosting through us (at cost) or migrate to a provider of choice. We provide 30-day post-launch support; extended maintenance is available as a monthly retainer."],
  ["8. Limitation of Liability",
   "Our liability is limited to the total project investment amount. We are not liable for lost revenue due to downtime, third-party service failures (Airbnb, email providers, payment banks), or force majeure events."],
  ["9. Cancellation",
   "Either party may cancel the project with seven days' written notice. Josh pays for work completed up to the cancellation date. The kickoff payment is non-refundable once work has commenced."],
  ["10. Communication",
   "Primary communication is via email and Messenger. Weekly progress updates are provided during active development. Our response time is within one business day for all inquiries."],
];
terms.forEach(([title, desc]) => {
  bodyChildren.push(h2(title));
  bodyChildren.push(body(desc));
});

// ── Section 10: About Us / Why Work With Us ───────────────────────────
bodyChildren.push(h1("About Us / Why Work With Us"));

bodyChildren.push(h2("About Carl & Jerico"));
bodyChildren.push(body(
  "Carl Micky Nieva and Jerico Guimban build business tools, not just websites. [Add a one-line credential/background note for Carl.] [Add a one-line credential/background note for Jerico.] Together, the team's approach is straightforward: every feature we ship must serve a clear business purpose — reducing manual work, improving the guest experience, or increasing direct bookings. Anything that does not meet that bar gets cut from scope. We work in weekly increments with live staging links, so Josh sees real progress every week rather than waiting weeks for a big reveal. We treat this project as a partnership, not a transaction."
));

bodyChildren.push(h2("Five Reasons to Work With Us"));

const reasons = [
  ["1. Built for Hospitality",
   "This is not a generic template. Every element — from the booking flow to the email reminders — is designed specifically for how a beachfront villa operates. The four-step booking flow, the Senior/PWD indicator, the bank-transfer-only payment path, and the Airbnb calendar sync all reflect the realities of running The Twenty-Fifth."],
  ["2. You Own Everything",
   "No lock-in. No subscriptions. No proprietary platform. When we hand over, Josh owns the code, the design, the data — everything. If he ever wants to bring in another developer or move to a different host, the door is open and the keys are in his hand."],
  ["3. Designed to Grow",
   "The platform is built to scale. Josh can start with one villa today; if he adds properties in the future, the system grows with him without a rebuild. The data model, the calendar, and the admin dashboard are all designed to accommodate multi-property expansion when the time comes."],
  ["4. AI-Powered, Human-Controlled",
   "Optional AI features (guest chatbot, admin copilot) save real time — but every AI action that affects bookings requires Josh's approval. The AI proposes; Josh disposes. The villa's bookings, calendar, and guest relationships stay firmly under human control."],
  ["5. Transparent Process + Post-Launch Support",
   "Josh sees progress weekly with live staging links. And we do not disappear after launch — 30 days of post-launch support is included in every package, with ongoing maintenance available as a monthly retainer for those who want peace of mind."],
];
reasons.forEach(([title, desc]) => {
  bodyChildren.push(h3(title));
  bodyChildren.push(body(desc));
});

// ── Section 11: Next Steps + Acceptance ───────────────────────────────
bodyChildren.push(h1("Next Steps + Acceptance"));

bodyChildren.push(h2("Next Steps"));
bodyChildren.push(body(
  "If this proposal aligns with what Josh has in mind for The Twenty-Fifth, here is how we move forward:"
));
const nextSteps = [
  "Review this proposal — take your time, ask any questions.",
  "Sign and return — the signature page is included below.",
  "Pay the 50% kickoff deposit — bank details will be provided upon signing.",
  "Schedule the kickoff meeting — we will align on content, branding, and timeline.",
  "Start gathering your photos and content — we will send a structured intake form to make this easy.",
];
nextSteps.forEach(t => bodyChildren.push(numItem(t, "list-nextsteps")));

bodyChildren.push(h2("Acceptance & Signature"));
bodyChildren.push(body(
  "By signing below, both parties confirm their acceptance of this proposal and agree to proceed in accordance with the scope, timeline, investment, and terms outlined above."
));

bodyChildren.push(new Paragraph({
  spacing: { before: 200, after: 120, line: 312 },
  children: [new TextRun({
    text: "For The Twenty-Fifth:",
    bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" },
  })],
}));
bodyChildren.push(signatureBlock({ name: "Josh — The Twenty-Fifth" }));

bodyChildren.push(new Paragraph({
  spacing: { before: 320, after: 120, line: 312 },
  children: [new TextRun({
    text: "For the Team — Carl Micky Nieva & Jerico Guimban:",
    bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" },
  })],
}));
bodyChildren.push(signatureBlock({ name: "Carl Micky Nieva & Jerico Guimban" }));

bodyChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 400, after: 200, line: 312 },
  children: [new TextRun({
    text: "Thank you for the opportunity to present this proposal. We look forward to bringing The Twenty-Fifth to life online.",
    italics: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" },
  })],
}));

// ──────────────────────────────────────────────────────────────────────────
// 10. TOC section content
// ──────────────────────────────────────────────────────────────────────────
const tocChildren = [
  // TOC title — NOT a HeadingLevel (prevents self-indexing)
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 360, line: 312 },
    children: [new TextRun({
      text: "Table of Contents",
      bold: true, size: 36, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  }),
  // TOC field
  new TableOfContents("Table of Contents", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),
  // Refresh hint (text-only — no PageBreak, to avoid check 3 conflict)
  new Paragraph({
    spacing: { before: 280, line: 312 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To refresh page numbers after editing, right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888", font: { ascii: "Calibri" },
    })],
  }),
];

// ──────────────────────────────────────────────────────────────────────────
// 11. Document assembly
// ──────────────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "Carl Micky Nieva & Jerico Guimban",
  title: "The Twenty-Fifth — Project Proposal & Partnership Brief",
  description: "Project proposal for The Twenty-Fifth beachfront villa website, booking system, and admin platform.",
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22, color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 36, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 480, after: 200, line: 312 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 320, after: 140, line: 312 }, outlineLevel: 1 },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 240, after: 100, line: 312 }, outlineLevel: 2 },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "list-requirements",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "list-deliverables",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "list-nextsteps",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── Section 1: Cover ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCoverR1Custom(coverConfig),
    },
    // ── Section 2: Front matter (TOC) — Roman numerals ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: { default: pageNumFooter() },
      children: tocChildren,
    },
    // ── Section 3: Body — Arabic numerals starting at 1 ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: bodyHeader() },
      footers: { default: pageNumFooter() },
      children: bodyChildren,
    },
  ],
});

// ──────────────────────────────────────────────────────────────────────────
// 12. Write the file
// ──────────────────────────────────────────────────────────────────────────
const OUT = "/home/z/my-project/The_Twenty-Fifth_Project_Proposal.docx";
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buf);
console.log(`✅ Wrote ${OUT} (${buf.length} bytes)`);
