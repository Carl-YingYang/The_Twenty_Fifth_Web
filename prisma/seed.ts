import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const db = new PrismaClient();

// Unsplash image URLs — luxury resort imagery
const IMG = {
  heroForest:
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80",
  heroVilla:
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80",
  heroPool:
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=80",
  deluxeVilla1:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  deluxeVilla2:
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  beachfrontSuite1:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  beachfrontSuite2:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  gardenVilla1:
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
  gardenVilla2:
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  poolVilla1:
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
  poolVilla2:
    "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?auto=format&fit=crop&w=1200&q=80",
  presidential1:
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
  presidential2:
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
  dining:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  spa:
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  pool:
    "https://images.unsplash.com/photo-1575340122733-83724d2756c0?auto=format&fit=crop&w=1200&q=80",
  beach:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  forest:
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  lounge:
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  yoga:
    "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=1200&q=80",
  bar:
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80",
  exterior:
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  night:
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  sunset:
    "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=1200&q=80",
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
  gym:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
  interior:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  bathroom:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
};

async function main() {
  console.log("🌱 Seeding Verdara Resort database...");

  // ---------- Admin user ----------
  const passwordHash = await hashPassword("verdara2025");
  const admin = await db.user.upsert({
    where: { email: "admin@verdararesort.com" },
    update: { passwordHash },
    create: {
      email: "admin@verdararesort.com",
      passwordHash,
      name: "Resort Administrator",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  const staff = await db.user.upsert({
    where: { email: "frontdesk@verdararesort.com" },
    update: {},
    create: {
      email: "frontdesk@verdararesort.com",
      passwordHash: await hashPassword("verdara2025"),
      name: "Front Desk Team",
      role: "STAFF",
      isActive: true,
    },
  });
  console.log(`  ✓ Staff user: ${staff.email}`);

  // ---------- Room Types ----------
  const roomTypes = await Promise.all([
    db.roomType.upsert({
      where: { slug: "deluxe-villa" },
      update: {},
      create: {
        name: "Deluxe Villa",
        slug: "deluxe-villa",
        description:
          "A serene retreat nestled in the rainforest canopy, featuring a private lanai, handcrafted teak furnishings, and panoramic forest views. Perfect for couples seeking tranquility.",
        basePrice: 12500,
        capacity: 2,
        size: 48,
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
          "Wake to the sound of waves in this elegant beachfront suite, with floor-to-ceiling windows opening directly onto a private terrace overlooking the cove.",
        basePrice: 18500,
        capacity: 3,
        size: 65,
        bedConfig: "1 King + 1 Sofa Bed",
      },
    }),
    db.roomType.upsert({
      where: { slug: "garden-villa" },
      update: {},
      create: {
        name: "Garden Villa",
        slug: "garden-villa",
        description:
          "A family-friendly villa surrounded by tropical gardens, with a spacious living area, outdoor shower, and direct access to the resort's nature trails.",
        basePrice: 9800,
        capacity: 4,
        size: 55,
        bedConfig: "2 Queen Beds",
      },
    }),
    db.roomType.upsert({
      where: { slug: "pool-villa" },
      update: {},
      create: {
        name: "Pool Villa",
        slug: "pool-villa",
        description:
          "An expansive private villa with its own infinity plunge pool, sun deck, and butler service. The epitome of rainforest luxury.",
        basePrice: 28000,
        capacity: 4,
        size: 95,
        bedConfig: "1 King + 1 Twin",
      },
    }),
    db.roomType.upsert({
      where: { slug: "presidential-villa" },
      update: {},
      create: {
        name: "Presidential Villa",
        slug: "presidential-villa",
        description:
          "Our flagship residence — a two-story villa with private pool, chef's kitchen, dedicated butler, and 270-degree views of forest and sea. The ultimate Verdara experience.",
        basePrice: 65000,
        capacity: 6,
        size: 220,
        bedConfig: "2 King + 2 Twin",
      },
    }),
  ]);
  console.log(`  ✓ ${roomTypes.length} room types`);

  // ---------- Amenities ----------
  const amenitiesData = [
    { name: "Infinity Pool", slug: "infinity-pool", icon: "Waves", category: "RESORT", description: "Heated infinity pool overlooking the cove" },
    { name: "Private Beach", slug: "private-beach", icon: "Umbrella", category: "RESORT", description: "Exclusive sandy cove access" },
    { name: "Forest Spa", slug: "forest-spa", icon: "Flower2", category: "WELLNESS", description: "Open-air spa pavilions in the rainforest" },
    { name: "Yoga Pavilion", slug: "yoga-pavilion", icon: "Sparkles", category: "WELLNESS", description: "Daily sunrise and sunset classes" },
    { name: "Fitness Center", slug: "fitness-center", icon: "Dumbbell", category: "WELLNESS", description: "24-hour equipped gym" },
    { name: "Farm Restaurant", slug: "farm-restaurant", icon: "UtensilsCrossed", category: "DINING", description: "Farm-to-table fine dining" },
    { name: "Beach Bar", slug: "beach-bar", icon: "Wine", category: "DINING", description: "Sunset cocktails by the shore" },
    { name: "Breakfast Included", slug: "breakfast-included", icon: "Coffee", category: "DINING", description: "Complimentary tropical breakfast" },
    { name: "Free Wi-Fi", slug: "free-wifi", icon: "Wifi", category: "ROOM", description: "High-speed fiber throughout" },
    { name: "Air Conditioning", slug: "air-conditioning", icon: "Wind", category: "ROOM", description: "Individual climate control" },
    { name: "Smart TV", slug: "smart-tv", icon: "Tv", category: "ROOM", description: "55-inch 4K smart television" },
    { name: "Minibar", slug: "minibar", icon: "GlassWater", category: "ROOM", description: "Stocked with local spirits and refreshments" },
    { name: "Private Balcony", slug: "private-balcony", icon: "DoorOpen", category: "ROOM", description: "Outdoor lanai with seating" },
    { name: "Rain Shower", slug: "rain-shower", icon: "ShowerHead", category: "ROOM", description: "Premium bath amenities" },
    { name: "Coffee Machine", slug: "coffee-machine", icon: "Coffee", category: "ROOM", description: "Espresso machine with local beans" },
    { name: "In-Room Safe", slug: "in-room-safe", icon: "Lock", category: "ROOM", description: "Electronic laptop safe" },
    { name: "Concierge", slug: "concierge", icon: "BellRing", category: "RESORT", description: "24-hour concierge service" },
    { name: "Valet Parking", slug: "valet-parking", icon: "Car", category: "RESORT", description: "Complimentary valet service" },
    { name: "Airport Transfer", slug: "airport-transfer", icon: "Plane", category: "RESORT", description: "Private car transfer on request" },
    { name: "Nature Trails", slug: "nature-trails", icon: "TreePine", category: "RESORT", description: "Guided rainforest walks" },
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

  // ---------- Rooms ----------
  const roomsData = [
    // Deluxe Villas (DV)
    { number: "DV-101", name: "Canopy Drift", type: "deluxe-villa", price: 12500, floor: 1, view: "Forest", status: "AVAILABLE", imgs: [IMG.deluxeVilla1, IMG.interior, IMG.bathroom] },
    { number: "DV-102", name: "Emerald Nest", type: "deluxe-villa", price: 12500, floor: 1, view: "Forest", status: "OCCUPIED", imgs: [IMG.deluxeVilla2, IMG.interior, IMG.bathroom] },
    { number: "DV-201", name: "Treetop Haven", type: "deluxe-villa", price: 13000, floor: 2, view: "Forest", status: "AVAILABLE", imgs: [IMG.deluxeVilla1, IMG.interior, IMG.bathroom] },
    { number: "DV-202", name: "Mosswood Suite", type: "deluxe-villa", price: 13000, floor: 2, view: "Forest", status: "CLEANING", imgs: [IMG.deluxeVilla2, IMG.interior, IMG.bathroom] },
    // Beachfront Suites (BS)
    { number: "BS-301", name: "Coral Horizon", type: "beachfront-suite", price: 18500, floor: 1, view: "Ocean", status: "AVAILABLE", imgs: [IMG.beachfrontSuite1, IMG.interior, IMG.bathroom] },
    { number: "BS-302", name: "Tidewater Suite", type: "beachfront-suite", price: 18500, floor: 1, view: "Ocean", status: "RESERVED", imgs: [IMG.beachfrontSuite2, IMG.interior, IMG.bathroom] },
    { number: "BS-401", name: "Seabreeze Penthouse", type: "beachfront-suite", price: 21000, floor: 2, view: "Ocean", status: "AVAILABLE", imgs: [IMG.beachfrontSuite1, IMG.interior, IMG.bathroom] },
    // Garden Villas (GV)
    { number: "GV-501", name: "Hibiscus Villa", type: "garden-villa", price: 9800, floor: 1, view: "Garden", status: "AVAILABLE", imgs: [IMG.gardenVilla1, IMG.interior, IMG.bathroom] },
    { number: "GV-502", name: "Orchid Villa", type: "garden-villa", price: 9800, floor: 1, view: "Garden", status: "AVAILABLE", imgs: [IMG.gardenVilla2, IMG.interior, IMG.bathroom] },
    { number: "GV-503", name: "Bougainvillea Villa", type: "garden-villa", price: 10200, floor: 1, view: "Garden", status: "MAINTENANCE", imgs: [IMG.gardenVilla1, IMG.interior, IMG.bathroom] },
    // Pool Villas (PV)
    { number: "PV-601", name: "Lagoon Sanctuary", type: "pool-villa", price: 28000, floor: 1, view: "Pool", status: "AVAILABLE", imgs: [IMG.poolVilla1, IMG.interior, IMG.bathroom] },
    { number: "PV-602", name: "Cascade Villa", type: "pool-villa", price: 29500, floor: 1, view: "Pool", status: "OCCUPIED", imgs: [IMG.poolVilla2, IMG.interior, IMG.bathroom] },
    // Presidential (PR)
    { number: "PR-701", name: "The Verdara Residence", type: "presidential-villa", price: 65000, floor: 1, view: "Ocean & Forest", status: "AVAILABLE", imgs: [IMG.presidential1, IMG.presidential2, IMG.interior] },
  ];

  const roomTypeMap = new Map(roomTypes.map((rt) => [rt.slug, rt.id]));
  const amenityMap = new Map(amenities.map((a) => [a.slug, a.id]));

  const roomAmenityAssignment: Record<string, string[]> = {
    "deluxe-villa": ["free-wifi", "air-conditioning", "smart-tv", "minibar", "private-balcony", "rain-shower", "coffee-machine", "in-room-safe", "breakfast-included"],
    "beachfront-suite": ["free-wifi", "air-conditioning", "smart-tv", "minibar", "private-balcony", "rain-shower", "coffee-machine", "in-room-safe", "breakfast-included", "private-beach"],
    "garden-villa": ["free-wifi", "air-conditioning", "smart-tv", "minibar", "private-balcony", "rain-shower", "coffee-machine", "in-room-safe", "breakfast-included", "nature-trails"],
    "pool-villa": ["free-wifi", "air-conditioning", "smart-tv", "minibar", "private-balcony", "rain-shower", "coffee-machine", "in-room-safe", "breakfast-included", "concierge", "infinity-pool"],
    "presidential-villa": ["free-wifi", "air-conditioning", "smart-tv", "minibar", "private-balcony", "rain-shower", "coffee-machine", "in-room-safe", "breakfast-included", "concierge", "valet-parking", "airport-transfer", "infinity-pool", "private-beach", "butler"],
  };

  for (const r of roomsData) {
    const typeId = roomTypeMap.get(r.type)!;
    const existing = await db.room.findUnique({ where: { number: r.number } });
    if (existing) {
      await db.roomImage.deleteMany({ where: { roomId: existing.id } });
      await db.roomAmenity.deleteMany({ where: { roomId: existing.id } });
      await db.room.update({
        where: { id: existing.id },
        data: {
          name: r.name,
          description: `${r.name} — a signature ${r.type.replace("-", " ")} experience at Verdara Resort, thoughtfully designed with natural materials, premium linens, and seamless indoor-outdoor living.`,
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
          description: `${r.name} — a signature ${r.type.replace("-", " ")} experience at Verdara Resort, thoughtfully designed with natural materials, premium linens, and seamless indoor-outdoor living.`,
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
    { title: "Sunset Over the Cove", category: "NATURE", url: IMG.sunset },
    { title: "Infinity Pool at Dusk", category: "RESORT", url: IMG.pool },
    { title: "Private Beach Access", category: "RESORT", url: IMG.beach },
    { title: "Rainforest Canopy Walk", category: "NATURE", url: IMG.forest },
    { title: "Farm-to-Table Dining", category: "DINING", url: IMG.dining },
    { title: "Forest Spa Pavilion", category: "RESORT", url: IMG.spa },
    { title: "Beach Bar Sunsets", category: "DINING", url: IMG.bar },
    { title: "Yoga at Dawn", category: "RESORT", url: IMG.yoga },
    { title: "Deluxe Villa Interior", category: "ROOMS", url: IMG.deluxeVilla1 },
    { title: "Beachfront Suite Terrace", category: "ROOMS", url: IMG.beachfrontSuite1 },
    { title: "Pool Villa at Night", category: "ROOMS", url: IMG.poolVilla2 },
    { title: "Presidential Residence", category: "ROOMS", url: IMG.presidential1 },
    { title: "Tropical Breakfast Spread", category: "DINING", url: IMG.breakfast },
    { title: "Resort Lounge", category: "RESORT", url: IMG.lounge },
    { title: "Oceanfront Exterior", category: "RESORT", url: IMG.exterior },
    { title: "Verdara at Twilight", category: "NATURE", url: IMG.night },
    { title: "Fitness Center", category: "RESORT", url: IMG.gym },
    { title: "Elegant Bath Suite", category: "ROOMS", url: IMG.bathroom },
  ];

  await db.gallery.deleteMany({});
  for (let i = 0; i < galleryData.length; i++) {
    await db.gallery.create({
      data: { ...galleryData[i], sortOrder: i },
    });
  }
  console.log(`  ✓ ${galleryData.length} gallery items`);

  // ---------- Settings ----------
  const settingsData = [
    { key: "resort.name", value: "Verdara Resort", category: "GENERAL" },
    { key: "resort.tagline", value: "A Sanctuary Between Forest & Sea", category: "GENERAL" },
    { key: "resort.email", value: "stay@verdararesort.com", category: "GENERAL" },
    { key: "resort.phone", value: "+63 (2) 8888 4400", category: "GENERAL" },
    { key: "resort.address", value: "Coastal Road, Brgy. Luyang, San Juan, Batangas, Philippines", category: "GENERAL" },
    { key: "resort.checkInTime", value: "15:00", category: "OPERATIONS" },
    { key: "resort.checkOutTime", value: "11:00", category: "OPERATIONS" },
    { key: "resort.taxRate", value: "12", category: "FINANCE" },
    { key: "resort.serviceCharge", value: "5", category: "FINANCE" },
    { key: "resort.currency", value: "PHP", category: "FINANCE" },
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

  const sampleGuests = [
    { firstName: "Maria", lastName: "Santos", email: "maria.santos@email.com", phone: "+63 917 555 0101", city: "Manila", country: "Philippines" },
    { firstName: "James", lastName: "Carter", email: "james.carter@email.com", phone: "+1 415 555 0182", city: "San Francisco", country: "USA" },
    { firstName: "Yuki", lastName: "Tanaka", email: "yuki.tanaka@email.com", phone: "+81 90 5555 0199", city: "Tokyo", country: "Japan" },
    { firstName: "Sofia", lastName: "Garcia", email: "sofia.garcia@email.com", phone: "+63 918 555 0144", city: "Cebu", country: "Philippines" },
    { firstName: "Liam", lastName: "O'Brien", email: "liam.obrien@email.com", phone: "+353 87 555 0177", city: "Dublin", country: "Ireland" },
    { firstName: "Anika", lastName: "Sharma", email: "anika.sharma@email.com", phone: "+91 98 555 01662", city: "Mumbai", country: "India" },
    { firstName: "David", lastName: "Chen", email: "david.chen@email.com", phone: "+65 9 555 0188", city: "Singapore", country: "Singapore" },
    { firstName: "Elena", lastName: "Rossi", email: "elena.rossi@email.com", phone: "+39 333 555 0199", city: "Milan", country: "Italy" },
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
    { guestIdx: 0, roomNumber: "DV-102", checkIn: lastWeek, checkOut: lastWeekOut, adults: 2, children: 0, status: "COMPLETED", source: "WEBSITE", checkedInAt: lastWeek, checkedOutAt: lastWeekOut },
    { guestIdx: 1, roomNumber: "PV-602", checkIn: todayStr, checkOut: dayAfter, adults: 2, children: 1, status: "CHECKED_IN", source: "WEBSITE", checkedInAt: todayStr },
    { guestIdx: 2, roomNumber: "BS-302", checkIn: tomorrow, checkOut: inThreeDays, adults: 2, children: 0, status: "CONFIRMED", source: "WEBSITE", confirmedAt: todayStr },
    { guestIdx: 3, roomNumber: "DV-202", checkIn: inThreeDays, checkOut: inFiveDays, adults: 2, children: 0, status: "PENDING", source: "WEBSITE" },
    { guestIdx: 4, roomNumber: "GV-501", checkIn: tomorrow, checkOut: dayAfter, adults: 4, children: 0, status: "PENDING", source: "WALK_IN" },
    { guestIdx: 5, roomNumber: "DV-101", checkIn: inFiveDays, checkOut: new Date(todayStr.getTime() + 7 * 86400000), adults: 2, children: 0, status: "CONFIRMED", source: "WEBSITE", confirmedAt: todayStr },
    { guestIdx: 6, roomNumber: "BS-301", checkIn: lastWeek, checkOut: lastWeekOut, adults: 2, children: 2, status: "CANCELLED", source: "WEBSITE", cancelledAt: lastWeek },
    { guestIdx: 7, roomNumber: "PR-701", checkIn: new Date(todayStr.getTime() + 10 * 86400000), checkOut: new Date(todayStr.getTime() + 13 * 86400000), adults: 4, children: 2, status: "CONFIRMED", source: "PHONE", confirmedAt: todayStr },
  ];

  let resCount = 0;
  for (const rd of reservationsData) {
    const guest = guests[rd.guestIdx];
    const room = rooms.find((r) => r.number === rd.roomNumber);
    if (!room) continue;
    const nights = Math.round((rd.checkOut.getTime() - rd.checkIn.getTime()) / 86400000);
    const total = room.pricePerNight * nights;
    const refNo = `RRMS-2025-${String(1000 + resCount).padStart(6, "0")}`;

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
        title: `New Reservation ${refNo}`,
        message: `${guest.firstName} ${guest.lastName} booked ${room.name}`,
        type: "BOOKING",
        isRead: rd.status !== "PENDING",
      },
    }).catch(() => {});

    resCount++;
  }
  console.log(`  ✓ ${resCount} sample reservations`);

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: admin@verdararesort.com / verdara2025");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
