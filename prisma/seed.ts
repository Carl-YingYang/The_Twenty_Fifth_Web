import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

// Beachfront villa imagery — ocean, sand, sunsets, tropical interiors.
const IMG = {
  // Hero / villa exterior
  heroVilla:
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80",
  heroBeach:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
  heroPool:
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80",
  heroSunset:
    "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=1920&q=80",
  // Bedrooms / interiors
  masterSuite:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  beachfrontSuite:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  gardenSuite:
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
  poolsideRoom:
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
  // Amenities
  infinityPool:
    "https://images.unsplash.com/photo-1575340122733-83724d2756c0?auto=format&fit=crop&w=1200&q=80",
  secondPool:
    "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?auto=format&fit=crop&w=1200&q=80",
  beach:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  kitchen:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
  bbq:
    "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=1200&q=80",
  dining:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  lounge:
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  terrace:
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  // Nature / scenery
  sunset:
    "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=1200&q=80",
  coastline:
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  palms:
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
  night:
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  // Details
  interior:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  bathroom:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
};

async function main() {
  console.log("🌱 Seeding The Twenty-Fifth database...");

  // ---------- Admin user ----------
  // P0 security: admin password comes from ADMIN_SEED_PASSWORD env var,
  // not hardcoded source. If the env var is missing, the seed refuses to
  // run rather than falling back to a known weak default.
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error(
      "ADMIN_SEED_PASSWORD is missing or too short (min 8 chars). Set it in .env before running db:seed."
    );
  }
  const passwordHash = await hashPassword(seedPassword);
  const admin = await db.user.upsert({
    where: { email: "stay@the25thinzambales.com" },
    update: { passwordHash },
    create: {
      email: "stay@the25thinzambales.com",
      passwordHash,
      name: "Villa Manager",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  const staff = await db.user.upsert({
    where: { email: "frontdesk@the25thinzambales.com" },
    update: {},
    create: {
      email: "frontdesk@the25thinzambales.com",
      passwordHash: await hashPassword(seedPassword),
      name: "Front Desk",
      role: "STAFF",
      isActive: true,
    },
  });
  console.log(`  ✓ Staff user: ${staff.email}`);

  // ---------- Room Types ----------
  // The Twenty-Fifth is a single beachfront villa with 4 bedrooms.
  // We model booking configurations: whole villa OR individual bedroom suites.
  const roomTypes = await Promise.all([
    db.roomType.upsert({
      where: { slug: "whole-villa" },
      update: {},
      create: {
        name: "The Whole Villa",
        slug: "whole-villa",
        description:
          "Book the entire beachfront property — all four bedrooms, both pools, the kitchen, the BBQ area, and direct beach access. Sleeps up to 25 guests. Perfect for family reunions, barkada getaways, and celebrations.",
        basePrice: 45000,
        capacity: 25,
        size: 320,
        bedConfig: "4 bedrooms · 21 beds · 5.5 baths",
      },
    }),
    db.roomType.upsert({
      where: { slug: "master-suite" },
      update: {},
      create: {
        name: "Master Suite",
        slug: "master-suite",
        description:
          "The villa's primary bedroom — a king bed, ocean-facing windows, and a private en-suite bath. Quiet, airy, and steps from the infinity pool.",
        basePrice: 12000,
        capacity: 4,
        size: 45,
        bedConfig: "1 King Bed",
      },
    }),
    db.roomType.upsert({
      where: { slug: "beachfront-suite" },
      update: {},
      create: {
        name: "Beachfront Suite",
        slug: "beachfront-suite",
        description:
          "Wake to the sound of waves. Floor-to-ceiling windows open onto a terrace with unobstructed sea views. King bed plus a sofa bed for the kids.",
        basePrice: 15000,
        capacity: 4,
        size: 50,
        bedConfig: "1 King + 1 Sofa Bed",
      },
    }),
    db.roomType.upsert({
      where: { slug: "garden-suite" },
      update: {},
      create: {
        name: "Garden Suite",
        slug: "garden-suite",
        description:
          "A calm, garden-facing bedroom with twin beds that can be joined into a king. Perfect for siblings, friends, or kids.",
        basePrice: 9500,
        capacity: 3,
        size: 38,
        bedConfig: "2 Twin Beds (or 1 King)",
      },
    }),
    db.roomType.upsert({
      where: { slug: "poolside-room" },
      update: {},
      create: {
        name: "Poolside Room",
        slug: "poolside-room",
        description:
          "Steps from the dipping pool, this breezy room has a queen bed and a private bath. Great for early-morning swims.",
        basePrice: 8500,
        capacity: 2,
        size: 32,
        bedConfig: "1 Queen Bed",
      },
    }),
  ]);
  console.log(`  ✓ ${roomTypes.length} room types`);

  // ---------- Amenities (real, based on resort's actual offerings) ----------
  const amenitiesData = [
    { name: "Private Beachfront", slug: "private-beachfront", icon: "Umbrella", category: "RESORT", description: "Direct access to a private stretch of Botolan coastline" },
    { name: "Infinity Pool", slug: "infinity-pool", icon: "Waves", category: "RESORT", description: "Oceanfront infinity pool overlooking the West Philippine Sea" },
    { name: "Second Dipping Pool", slug: "dipping-pool", icon: "Droplets", category: "RESORT", description: "A second smaller pool for kids or quiet dips" },
    { name: "Fully Equipped Kitchen", slug: "kitchen", icon: "UtensilsCrossed", category: "DINING", description: "Full-size fridge, stove, cookware, and dinnerware" },
    { name: "BBQ & Grill Area", slug: "bbq-area", icon: "Flame", category: "DINING", description: "Outdoor grill with seating for group cookouts" },
    { name: "Outdoor Lounge", slug: "outdoor-lounge", icon: "Sofa", category: "RESORT", description: "Shaded lounging area by the beach" },
    { name: "Air-Conditioned Bedrooms", slug: "ac-bedrooms", icon: "Wind", category: "ROOM", description: "All four bedrooms are fully air-conditioned" },
    { name: "Free Wi-Fi", slug: "free-wifi", icon: "Wifi", category: "ROOM", description: "High-speed internet throughout the villa" },
    { name: "Smart TV", slug: "smart-tv", icon: "Tv", category: "ROOM", description: "Netflix and streaming ready" },
    { name: "Hot & Cold Shower", slug: "hot-shower", icon: "ShowerHead", category: "ROOM", description: "All bathrooms with hot and cold water" },
    { name: "Fresh Linens & Towels", slug: "linens", icon: "BedDouble", category: "ROOM", description: "Hotel-quality linens and beach towels provided" },
    { name: "Beach Loungers", slug: "beach-loungers", icon: "Sun", category: "RESORT", description: "Sun loungers and umbrellas on the beach" },
    { name: "Parking", slug: "parking", icon: "Car", category: "RESORT", description: "Free on-site parking for guests" },
    { name: "Pet-Friendly (on request)", slug: "pet-friendly", icon: "Dog", category: "RESORT", description: "Pets welcome with prior arrangement" },
    { name: "Celebration Setup", slug: "celebration-setup", icon: "PartyPopper", category: "RESORT", description: "Decor and setup help for birthdays and events" },
    { name: "Caretaker On-Site", slug: "caretaker", icon: "UserCheck", category: "RESORT", description: "Friendly caretaker available during your stay" },
  ];

  const amenities = await Promise.all(
    amenitiesData.map((a) =>
      db.amenity.upsert({
        where: { slug: a.slug },
        update: {},
        create: a,
      })
    )
  );
  console.log(`  ✓ ${amenities.length} amenities`);

  // ---------- Rooms (the villa + its 4 bedrooms) ----------
  // Clean slate: remove any stale rooms from prior seeds (e.g. old Verdara rooms
  // with different numbers) so the catalog stays consistent.
  await db.reservationRoom.deleteMany();
  await db.roomAmenity.deleteMany();
  await db.roomImage.deleteMany();
  await db.room.deleteMany();
  const roomsData = [
    {
      number: "VILLA-01",
      name: "The Twenty-Fifth Villa",
      type: "whole-villa",
      price: 45000,
      floor: 1,
      view: "Ocean & Pool",
      status: "AVAILABLE",
      imgs: [IMG.heroVilla, IMG.infinityPool, IMG.beach, IMG.kitchen, IMG.terrace, IMG.lounge],
    },
    {
      number: "BR-01",
      name: "Master Suite",
      type: "master-suite",
      price: 12000,
      floor: 1,
      view: "Ocean",
      status: "AVAILABLE",
      imgs: [IMG.masterSuite, IMG.interior, IMG.bathroom],
    },
    {
      number: "BR-02",
      name: "Beachfront Suite",
      type: "beachfront-suite",
      price: 15000,
      floor: 1,
      view: "Ocean",
      status: "OCCUPIED",
      imgs: [IMG.beachfrontSuite, IMG.interior, IMG.bathroom],
    },
    {
      number: "BR-03",
      name: "Garden Suite",
      type: "garden-suite",
      price: 9500,
      floor: 1,
      view: "Garden",
      status: "AVAILABLE",
      imgs: [IMG.gardenSuite, IMG.interior, IMG.bathroom],
    },
    {
      number: "BR-04",
      name: "Poolside Room",
      type: "poolside-room",
      price: 8500,
      floor: 1,
      view: "Pool",
      status: "CLEANING",
      imgs: [IMG.poolsideRoom, IMG.interior, IMG.bathroom],
    },
  ];

  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.slug, rt.id]));
  const amenityMap = new Map(amenities.map((a) => [a.slug, a.id]));

  const roomAmenityAssignment: Record<string, string[]> = {
    "whole-villa": [
      "private-beachfront", "infinity-pool", "dipping-pool", "kitchen", "bbq-area",
      "outdoor-lounge", "ac-bedrooms", "free-wifi", "smart-tv", "hot-shower",
      "linens", "beach-loungers", "parking", "caretaker", "celebration-setup",
    ],
    "master-suite": ["ac-bedrooms", "free-wifi", "smart-tv", "hot-shower", "linens"],
    "beachfront-suite": ["ac-bedrooms", "free-wifi", "smart-tv", "hot-shower", "linens", "private-beachfront"],
    "garden-suite": ["ac-bedrooms", "free-wifi", "smart-tv", "hot-shower", "linens"],
    "poolside-room": ["ac-bedrooms", "free-wifi", "smart-tv", "hot-shower", "linens", "dipping-pool"],
  };

  for (const r of roomsData) {
    const typeId = roomTypeMap.get(r.type)!;
    const existing = await db.room.findUnique({ where: { number: r.number } });
    const description = `${r.name} — part of The Twenty-Fifth, an exclusive beachfront villa in Botolan, Zambales. Thoughtfully furnished with natural materials, premium linens, and seamless indoor-outdoor living.`;
    if (existing) {
      await db.roomImage.deleteMany({ where: { roomId: existing.id } });
      await db.roomAmenity.deleteMany({ where: { roomId: existing.id } });
      await db.room.update({
        where: { id: existing.id },
        data: {
          name: r.name,
          description,
          floor: r.floor,
          view: r.view,
          pricePerNight: r.price,
          capacity: roomTypes.find((rt) => rt.slug === r.type)!.capacity,
          status: r.status,
          typeId,
        },
      });
      for (let i = 0; i < r.imgs.length; i++) {
        await db.roomImage.create({
          data: {
            roomId: existing.id,
            url: r.imgs[i],
            altText: `${r.name} — view ${i + 1}`,
            isPrimary: i === 0,
            sortOrder: i,
          },
        });
      }
      const amSlugs = roomAmenityAssignment[r.type] || [];
      for (const slug of amSlugs) {
        const aid = amenityMap.get(slug);
        if (aid) {
          await db.roomAmenity.create({
            data: { roomId: existing.id, amenityId: aid },
          }).catch(() => {});
        }
      }
    } else {
      const room = await db.room.create({
        data: {
          number: r.number,
          name: r.name,
          description,
          floor: r.floor,
          view: r.view,
          pricePerNight: r.price,
          capacity: roomTypes.find((rt) => rt.slug === r.type)!.capacity,
          status: r.status,
          typeId,
          images: {
            create: r.imgs.map((url, i) => ({
              url,
              altText: `${r.name} — view ${i + 1}`,
              isPrimary: i === 0,
              sortOrder: i,
            })),
          },
        },
      });
      const amSlugs = roomAmenityAssignment[r.type] || [];
      for (const slug of amSlugs) {
        const aid = amenityMap.get(slug);
        if (aid) {
          await db.roomAmenity.create({
            data: { roomId: room.id, amenityId: aid },
          }).catch(() => {});
        }
      }
    }
  }
  console.log(`  ✓ ${roomsData.length} rooms`);

  // ---------- Gallery ----------
  const galleryData = [
    { title: "Golden Hour on the Coast", category: "NATURE", url: IMG.sunset },
    { title: "The Infinity Pool", category: "RESORT", url: IMG.infinityPool },
    { title: "Private Beach Access", category: "RESORT", url: IMG.beach },
    { title: "Coastal Palms", category: "NATURE", url: IMG.palms },
    { title: "The Kitchen", category: "DINING", url: IMG.kitchen },
    { title: "BBQ & Grill Area", category: "DINING", url: IMG.bbq },
    { title: "Dining by the Sea", category: "DINING", url: IMG.dining },
    { title: "Outdoor Lounge", category: "RESORT", url: IMG.lounge },
    { title: "Master Suite", category: "ROOMS", url: IMG.masterSuite },
    { title: "Beachfront Suite", category: "ROOMS", url: IMG.beachfrontSuite },
    { title: "Garden Suite", category: "ROOMS", url: IMG.gardenSuite },
    { title: "Poolside Room", category: "ROOMS", url: IMG.poolsideRoom },
    { title: "Sunrise Terrace", category: "RESORT", url: IMG.terrace },
    { title: "Coastline at Dusk", category: "NATURE", url: IMG.coastline },
    { title: "Tropical Breakfast", category: "DINING", url: IMG.breakfast },
    { title: "Evening by the Beach", category: "NATURE", url: IMG.night },
    { title: "The Dipping Pool", category: "RESORT", url: IMG.secondPool },
    { title: "Suite Bathroom", category: "ROOMS", url: IMG.bathroom },
  ];

  await db.gallery.deleteMany({});
  for (let i = 0; i < galleryData.length; i++) {
    await db.gallery.create({
      data: { ...galleryData[i], sortOrder: i },
    });
  }
  console.log(`  ✓ ${galleryData.length} gallery items`);

  // ---------- Settings (real resort data) ----------
  const settingsData = [
    { key: "resort.name", value: "The Twenty-Fifth", category: "GENERAL" },
    { key: "resort.tagline", value: "A luxurious beachfront villa in Zambales awaits.", category: "GENERAL" },
    { key: "resort.email", value: "stay@the25thinzambales.com", category: "GENERAL" },
    { key: "resort.phone", value: "+63 969 601 4369", category: "GENERAL" },
    { key: "resort.address", value: "Panan, Botolan, Zambales, Philippines", category: "GENERAL" },
    { key: "resort.instagram", value: "https://www.instagram.com/thetwentyfifthzambales", category: "GENERAL" },
    { key: "resort.facebook", value: "https://www.facebook.com/the25thinzambales", category: "GENERAL" },
    { key: "resort.checkInTime", value: "14:00", category: "OPERATIONS" },
    { key: "resort.checkOutTime", value: "12:00", category: "OPERATIONS" },
    { key: "resort.taxRate", value: "0", category: "FINANCE" },
    { key: "resort.serviceCharge", value: "0", category: "FINANCE" },
    { key: "resort.currency", value: "PHP", category: "FINANCE" },
    { key: "resort.maxGuests", value: "25", category: "OPERATIONS" },
  ];
  for (const s of settingsData) {
    await db.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`  ✓ ${settingsData.length} settings`);

  // ---------- Sample Reservations ----------
  const today = new Date();
  const todayStr = new Date(today.toDateString());
  const tomorrow = new Date(todayStr);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(todayStr);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const lastWeek = new Date(todayStr);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekOut = new Date(todayStr);
  lastWeekOut.setDate(lastWeekOut.getDate() - 5);
  const inThreeDays = new Date(todayStr);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const inFiveDays = new Date(todayStr);
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  const inTenDays = new Date(todayStr);
  inTenDays.setDate(inTenDays.getDate() + 10);
  const inThirteenDays = new Date(todayStr);
  inThirteenDays.setDate(inThirteenDays.getDate() + 13);

  const sampleGuests = [
    { firstName: "Maria", lastName: "Santos", email: "maria.santos@email.com", phone: "+63 917 555 0101", city: "Manila", country: "Philippines" },
    { firstName: "James", lastName: "Carter", email: "james.carter@email.com", phone: "+1 415 555 0182", city: "San Francisco", country: "USA" },
    { firstName: "Yuki", lastName: "Tanaka", email: "yuki.tanaka@email.com", phone: "+81 90 5555 0199", city: "Tokyo", country: "Japan" },
    { firstName: "Sofia", lastName: "Garcia", email: "sofia.garcia@email.com", phone: "+63 918 555 0144", city: "Cebu", country: "Philippines" },
    { firstName: "Liam", lastName: "Cruz", email: "liam.cruz@email.com", phone: "+63 919 555 0177", city: "Quezon City", country: "Philippines" },
    { firstName: "Anika", lastName: "Sharma", email: "anika.sharma@email.com", phone: "+91 98 555 01662", city: "Mumbai", country: "India" },
    { firstName: "David", lastName: "Lim", email: "david.lim@email.com", phone: "+63 920 555 0188", city: "Makati", country: "Philippines" },
    { firstName: "Elena", lastName: "Reyes", email: "elena.reyes@email.com", phone: "+63 921 555 0199", city: "Pasig", country: "Philippines" },
  ];

  const guests = [];
  for (const g of sampleGuests) {
    const existing = await db.guest.findFirst({ where: { email: g.email } });
    if (existing) {
      guests.push(existing);
    } else {
      guests.push(await db.guest.create({ data: g }));
    }
  }

  const rooms = await db.room.findMany({ include: { type: true } });

  const reservationsData = [
    { guestIdx: 0, roomNumber: "BR-02", checkIn: lastWeek, checkOut: lastWeekOut, adults: 4, children: 1, status: "COMPLETED", source: "WEBSITE", checkedInAt: lastWeek, checkedOutAt: lastWeekOut },
    { guestIdx: 1, roomNumber: "VILLA-01", checkIn: todayStr, checkOut: dayAfter, adults: 12, children: 3, status: "CHECKED_IN", source: "WEBSITE", checkedInAt: todayStr },
    { guestIdx: 2, roomNumber: "BR-01", checkIn: tomorrow, checkOut: inThreeDays, adults: 2, children: 0, status: "CONFIRMED", source: "WEBSITE", confirmedAt: todayStr },
    { guestIdx: 3, roomNumber: "BR-03", checkIn: inThreeDays, checkOut: inFiveDays, adults: 3, children: 0, status: "PENDING", source: "WEBSITE" },
    { guestIdx: 4, roomNumber: "BR-04", checkIn: tomorrow, checkOut: dayAfter, adults: 2, children: 0, status: "PENDING", source: "WALK_IN" },
    { guestIdx: 5, roomNumber: "VILLA-01", checkIn: inFiveDays, checkOut: inTenDays, adults: 20, children: 5, status: "CONFIRMED", source: "PHONE", confirmedAt: todayStr },
    { guestIdx: 6, roomNumber: "BR-02", checkIn: lastWeek, checkOut: lastWeekOut, adults: 2, children: 2, status: "CANCELLED", source: "WEBSITE", cancelledAt: lastWeek },
    { guestIdx: 7, roomNumber: "VILLA-01", checkIn: inTenDays, checkOut: inThirteenDays, adults: 15, children: 4, status: "CONFIRMED", source: "WEBSITE", confirmedAt: todayStr },
  ];

  let resCount = 0;
  for (const rd of reservationsData) {
    const guest = guests[rd.guestIdx];
    const room = rooms.find((r) => r.number === rd.roomNumber);
    if (!room) continue;
    const nights = Math.round((rd.checkOut.getTime() - rd.checkIn.getTime()) / 86400000);
    const total = room.pricePerNight * nights;
    const refNo = `TTF-2026-${String(1000 + resCount).padStart(6, "0")}`;

    const existing = await db.reservation.findUnique({ where: { referenceNo: refNo } });
    if (existing) continue;

    const reservation = await db.reservation.create({
      data: {
        referenceNo: refNo,
        guestId: guest.id,
        checkIn: rd.checkIn,
        checkOut: rd.checkOut,
        adults: rd.adults,
        children: rd.children,
        nights,
        totalAmount: total,
        status: rd.status,
        source: rd.source,
        confirmedAt: rd.confirmedAt ?? null,
        cancelledAt: rd.cancelledAt ?? null,
        checkedInAt: rd.checkedInAt ?? null,
        checkedOutAt: rd.checkedOutAt ?? null,
        specialRequests: resCount % 3 === 0 ? "Early check-in requested if possible." : null,
      },
    });
    await db.reservationRoom.create({
      data: {
        reservationId: reservation.id,
        roomId: room.id,
        pricePerNight: room.pricePerNight,
        subtotal: total,
      },
    });

    await db.notification.create({
      data: {
        userId: admin.id,
        title: `New reservation ${refNo}`,
        message: `${guest.firstName} ${guest.lastName} booked ${room.name}`,
        type: "BOOKING",
        isRead: rd.status !== "PENDING",
      },
    }).catch(() => {});

    resCount++;
  }
  console.log(`  ✓ ${resCount} sample reservations`);

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: stay@the25thinzambales.com / (the ADMIN_SEED_PASSWORD you set in .env)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
