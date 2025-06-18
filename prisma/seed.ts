// Dorsia Restaurant Reservation Platform Prisma Seed Script
// Version: 1.0
// Description: Populates the database with mock data for development and testing.

import { PrismaClient, Cuisine, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Create Users (Optional, if you want to associate owners or make reservations) ---
  
  // Create the demo user used by the booking components
  const demoUser = await prisma.user.upsert({
    where: { id: 'user_demo_123' },
    update: {},
    create: {
      id: 'user_demo_123',
      email: 'demo@dorsia.com',
      name: 'Demo User',
      password: 'password123', // In a real app, hash this!
    },
  });
  console.log(`Created demo user: ${demoUser.email}`);

  const user1 = await prisma.user.upsert({
    where: { email: 'owner1@example.com' },
    update: {},
    create: {
      email: 'owner1@example.com',
      name: 'Alice Owner',
      password: 'password123', // In a real app, hash this!
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'diner@example.com' },
    update: {},
    create: {
      email: 'diner@example.com',
      name: 'Bob Diner',
      password: 'password123', // In a real app, hash this!
    },
  });

  // Create additional users for more realistic data
  const user3 = await prisma.user.upsert({
    where: { email: 'owner2@example.com' },
    update: {},
    create: {
      email: 'owner2@example.com',
      name: 'Chef Marco Romano',
      password: 'password123',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'diner2@example.com' },
    update: {},
    create: {
      email: 'diner2@example.com',
      name: 'Sarah Johnson',
      password: 'password123',
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'diner3@example.com' },
    update: {},
    create: {
      email: 'diner3@example.com',
      name: 'Michael Chen',
      password: 'password123',
    },
  });

  console.log(`Created users ...`);

  // --- Create Restaurants ---
  const restaurant1 = await prisma.restaurant.create({
    data: {
      name: 'The Gourmet Place',
      description: 'Exquisite dining experience with a modern twist on classic dishes.',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '212-555-0100',
      email: 'contact@thegourmetplace.com',
      website: 'https://thegourmetplace.com',
      cuisine: Cuisine.FRENCH,
      profileImageUrl: 'https://example.com/profiles/gourmet.jpg',
      bannerImageUrl: 'https://example.com/banners/gourmet_banner.jpg',
      ownerId: user1.id, // Link to an owner user
      // Operating Hours
      operatingHours: {
        create: [
          // Weekdays 5 PM - 10 PM
          { dayOfWeek: 1, openTime: '17:00', closeTime: '22:00' }, // Monday
          { dayOfWeek: 2, openTime: '17:00', closeTime: '22:00' }, // Tuesday
          { dayOfWeek: 3, openTime: '17:00', closeTime: '22:00' }, // Wednesday
          { dayOfWeek: 4, openTime: '17:00', closeTime: '22:00' }, // Thursday
          { dayOfWeek: 5, openTime: '17:00', closeTime: '23:00' }, // Friday (later)
          // Weekends 12 PM - 11 PM
          { dayOfWeek: 6, openTime: '12:00', closeTime: '23:00' }, // Saturday
          { dayOfWeek: 0, openTime: '12:00', closeTime: '21:00' }, // Sunday (earlier)
        ],
      },
      // Tables
      tables: {
        create: [
          { name: 'T1', capacityMin: 2, capacityMax: 2, isJoinable: false },
          { name: 'T2', capacityMin: 2, capacityMax: 2, isJoinable: true },
          { name: 'T3', capacityMin: 2, capacityMax: 2, isJoinable: true },
          { name: 'T4', capacityMin: 4, capacityMax: 4, isJoinable: false },
          { name: 'T5', capacityMin: 4, capacityMax: 6, isJoinable: true },
          { name: 'T6', capacityMin: 6, capacityMax: 8, isJoinable: false },
          { name: 'Bar 1', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Bar 2', capacityMin: 1, capacityMax: 1, isJoinable: false },
        ],
      },
      // Turn Time Rules
      turnTimeRules: {
        create: [
          { partySizeMin: 1, partySizeMax: 2, turnTimeInMinutes: 90 },
          { partySizeMin: 3, partySizeMax: 4, turnTimeInMinutes: 120 },
          { partySizeMin: 5, partySizeMax: 8, turnTimeInMinutes: 150 },
        ],
      },
      // Cancellation Policy
      cancellationPolicy: {
        create: {
          hoursBeforeNoFee: 24,
          feePercentage: null,
          fixedFeeAmount: 25.00, // $25 per person if not cancelled in time
          notes: 'A fee of $25 per person applies for cancellations within 24 hours or no-shows.',
          allowOnlineCancellation: true,
        },
      },
    },
  });

  const restaurant2 = await prisma.restaurant.create({
    data: {
      name: 'Luigi\'s Pizzeria',
      description: 'Authentic Italian pizza and pasta in a family-friendly atmosphere.',
      address: '456 Oak Ave',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      phone: '718-555-0200',
      email: 'info@luigispizza.com',
      website: 'https://luigispizza.com',
      cuisine: Cuisine.ITALIAN,
      ownerId: user1.id, // Can be the same or different owner
      operatingHours: {
        create: [
          { dayOfWeek: 1, openTime: '11:00', closeTime: '22:00' },
          { dayOfWeek: 2, openTime: '11:00', closeTime: '22:00' },
          { dayOfWeek: 3, openTime: '11:00', closeTime: '22:00' },
          { dayOfWeek: 4, openTime: '11:00', closeTime: '22:00' },
          { dayOfWeek: 5, openTime: '11:00', closeTime: '23:30' },
          { dayOfWeek: 6, openTime: '11:00', closeTime: '23:30' },
          { dayOfWeek: 0, openTime: '12:00', closeTime: '21:00' },
        ],
      },
      tables: {
        create: [
          { name: 'P1', capacityMin: 2, capacityMax: 4 },
          { name: 'P2', capacityMin: 2, capacityMax: 4 },
          { name: 'P3', capacityMin: 4, capacityMax: 6, isJoinable: true },
          { name: 'P4', capacityMin: 4, capacityMax: 6, isJoinable: true },
          { name: 'P5', capacityMin: 6, capacityMax: 10 },
        ],
      },
      turnTimeRules: {
        create: [
          { partySizeMin: 1, partySizeMax: 4, turnTimeInMinutes: 75 },
          { partySizeMin: 5, partySizeMax: 10, turnTimeInMinutes: 100 },
        ],
      },
      cancellationPolicy: {
        create: {
          hoursBeforeNoFee: 4,
          notes: 'Please cancel at least 4 hours in advance.',
          allowOnlineCancellation: true,
        },
      },
      // Special Period (e.g., closed for a holiday)
      specialPeriods: {
        create: [{
          name: 'Closed for Thanksgiving',
          startDate: new Date(new Date().getFullYear(), 10, 28), // Approx Thanksgiving
          endDate: new Date(new Date().getFullYear(), 10, 29),
          isBlackout: true,
          notes: 'We will be closed for the Thanksgiving holiday.',
        }],
      },
    },
  });

  // Create more restaurants for diverse testing
  const restaurant3 = await prisma.restaurant.create({
    data: {
      name: 'Sakura Sushi',
      description: 'Premium Japanese sushi bar with omakase experience.',
      address: '789 Park Ave',
      city: 'Manhattan',
      state: 'NY',
      zipCode: '10075',
      phone: '212-555-0300',
      email: 'reservations@sakurasushi.com',
      website: 'https://sakurasushi.com',
      cuisine: Cuisine.JAPANESE,
      ownerId: user3.id,
      operatingHours: {
        create: [
          { dayOfWeek: 2, openTime: '18:00', closeTime: '22:00' }, // Tuesday
          { dayOfWeek: 3, openTime: '18:00', closeTime: '22:00' }, // Wednesday
          { dayOfWeek: 4, openTime: '18:00', closeTime: '22:00' }, // Thursday
          { dayOfWeek: 5, openTime: '18:00', closeTime: '23:00' }, // Friday
          { dayOfWeek: 6, openTime: '17:00', closeTime: '23:00' }, // Saturday
        ],
      },
      tables: {
        create: [
          { name: 'Counter 1', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Counter 2', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Counter 3', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Counter 4', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Counter 5', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Counter 6', capacityMin: 1, capacityMax: 1, isJoinable: false },
          { name: 'Table 1', capacityMin: 2, capacityMax: 4, isJoinable: false },
          { name: 'Table 2', capacityMin: 2, capacityMax: 4, isJoinable: false },
        ],
      },
      turnTimeRules: {
        create: [
          { partySizeMin: 1, partySizeMax: 2, turnTimeInMinutes: 105 }, // Longer for omakase
          { partySizeMin: 3, partySizeMax: 4, turnTimeInMinutes: 120 },
        ],
      },
      cancellationPolicy: {
        create: {
          hoursBeforeNoFee: 48,
          fixedFeeAmount: 75.00, // High-end restaurant, higher fee
          notes: 'Premium omakase experience requires 48-hour notice for cancellations. $75 per person fee applies for late cancellations.',
          allowOnlineCancellation: true,
        },
      },
    },
  });

  const restaurant4 = await prisma.restaurant.create({
    data: {
      name: 'Spice Garden',
      description: 'Authentic Indian cuisine with traditional spices and modern presentation.',
      address: '321 Curry Lane',
      city: 'Queens',
      state: 'NY',
      zipCode: '11375',
      phone: '718-555-0400',
      email: 'hello@spicegarden.com',
      website: 'https://spicegarden.com',
      cuisine: Cuisine.INDIAN,
      ownerId: user3.id,
      operatingHours: {
        create: [
          { dayOfWeek: 0, openTime: '12:00', closeTime: '22:00' }, // Sunday
          { dayOfWeek: 1, openTime: '17:00', closeTime: '22:00' }, // Monday
          { dayOfWeek: 2, openTime: '17:00', closeTime: '22:00' }, // Tuesday
          { dayOfWeek: 3, openTime: '17:00', closeTime: '22:00' }, // Wednesday
          { dayOfWeek: 4, openTime: '17:00', closeTime: '22:00' }, // Thursday
          { dayOfWeek: 5, openTime: '17:00', closeTime: '23:00' }, // Friday
          { dayOfWeek: 6, openTime: '12:00', closeTime: '23:00' }, // Saturday
        ],
      },
      tables: {
        create: [
          { name: 'T1', capacityMin: 2, capacityMax: 4, isJoinable: true },
          { name: 'T2', capacityMin: 2, capacityMax: 4, isJoinable: true },
          { name: 'T3', capacityMin: 4, capacityMax: 6, isJoinable: true },
          { name: 'T4', capacityMin: 4, capacityMax: 6, isJoinable: true },
          { name: 'T5', capacityMin: 6, capacityMax: 8, isJoinable: false },
          { name: 'T6', capacityMin: 8, capacityMax: 12, isJoinable: false }, // Large family table
        ],
      },
      turnTimeRules: {
        create: [
          { partySizeMin: 1, partySizeMax: 4, turnTimeInMinutes: 90 },
          { partySizeMin: 5, partySizeMax: 8, turnTimeInMinutes: 105 },
          { partySizeMin: 9, partySizeMax: 12, turnTimeInMinutes: 120 },
        ],
      },
      cancellationPolicy: {
        create: {
          hoursBeforeNoFee: 6,
          notes: 'Please cancel at least 6 hours in advance to avoid charges.',
          allowOnlineCancellation: true,
        },
      },
      specialPeriods: {
        create: [{
          name: 'Diwali Special Menu',
          startDate: new Date(new Date().getFullYear(), 10, 1), // Early November
          endDate: new Date(new Date().getFullYear(), 10, 15),
          isBlackout: false,
          notes: 'Special Diwali menu available during this period.',
        }],
      },
    },
  });

  console.log(`Created restaurants with tables, hours, rules, and policies ...`);

  // Fetch tables for creating reservations
  const restaurant1Tables = await prisma.table.findMany({
    where: { restaurantId: restaurant1.id },
  });

  const restaurant2Tables = await prisma.table.findMany({
    where: { restaurantId: restaurant2.id },
  });

  const restaurant3Tables = await prisma.table.findMany({
    where: { restaurantId: restaurant3.id },
  });

  const restaurant4Tables = await prisma.table.findMany({
    where: { restaurantId: restaurant4.id },
  });

  // --- Create Sample Reservations ---
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0); // 7 PM tomorrow

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(18, 30, 0, 0); // 6:30 PM

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(20, 0, 0, 0); // 8 PM next week

  // Reservation at The Gourmet Place
  await prisma.reservation.create({
    data: {
      userId: user2.id,
      restaurantId: restaurant1.id,
      tableId: restaurant1Tables.find((t) => t.name === 'T1')?.id,
      reservationTime: tomorrow,
      partySize: 2,
      status: ReservationStatus.CONFIRMED,
      notes: 'Anniversary dinner, window seat if possible.',
      turnTimeUsed: 90,
    },
  });

  // Reservation at Luigi's Pizzeria  
  await prisma.reservation.create({
    data: {
      userId: user4.id,
      restaurantId: restaurant2.id,
      tableId: restaurant2Tables.find((t) => t.name === 'P1')?.id,
      reservationTime: dayAfterTomorrow,
      partySize: 4,
      status: ReservationStatus.PENDING,
      notes: 'Family dinner with kids.',
      turnTimeUsed: 75,
    },
  });

  // Reservation at Sakura Sushi (omakase)
  await prisma.reservation.create({
    data: {
      userId: user5.id,
      restaurantId: restaurant3.id,
      tableId: restaurant3Tables.find((t) => t.name === 'Counter 1')?.id,
      reservationTime: nextWeek,
      partySize: 1,
      status: ReservationStatus.CONFIRMED,
      notes: 'First time omakase experience, no dietary restrictions.',
      turnTimeUsed: 105,
    },
  });

  // Large party reservation at Spice Garden
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7 || 7);
  nextFriday.setHours(19, 30, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: user2.id,
      restaurantId: restaurant4.id,
      tableId: restaurant4Tables.find((t) => t.name === 'T6')?.id,
      reservationTime: nextFriday,
      partySize: 10,
      status: ReservationStatus.CONFIRMED,
      notes: 'Corporate dinner, vegetarian options needed for 3 guests.',
      turnTimeUsed: 120,
    },
  });

  // Past reservation (completed)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(18, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: user4.id,
      restaurantId: restaurant1.id,
      tableId: restaurant1Tables.find((t) => t.name === 'T4')?.id,
      reservationTime: yesterday,
      partySize: 4,
      status: ReservationStatus.COMPLETED,
      notes: 'Birthday celebration.',
      turnTimeUsed: 120,
    },
  });

  // Cancelled reservation
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(20, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: user5.id,
      restaurantId: restaurant2.id,
      tableId: restaurant2Tables.find((t) => t.name === 'P3')?.id,
      reservationTime: lastWeek,
      partySize: 6,
      status: ReservationStatus.CANCELLED,
      notes: 'Event cancelled due to weather.',
      turnTimeUsed: 100,
    },
  });

  // Add more reservations for today to demonstrate table utilization
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  // Create reservations throughout the day at The Gourmet Place
  const todayReservations = [
    // Lunch reservations
    { time: '12:00', partySize: 2, table: 'T1', user: user2.id, status: ReservationStatus.COMPLETED, turnTime: 90 },
    { time: '12:30', partySize: 4, table: 'T4', user: user4.id, status: ReservationStatus.COMPLETED, turnTime: 120 },
    { time: '13:00', partySize: 2, table: 'T2', user: user5.id, status: ReservationStatus.COMPLETED, turnTime: 90 },
    
    // Afternoon reservations
    { time: '14:30', partySize: 6, table: 'T6', user: user2.id, status: ReservationStatus.COMPLETED, turnTime: 150 },
    
    // Dinner reservations
    { time: '17:30', partySize: 2, table: 'T1', user: user4.id, status: ReservationStatus.CONFIRMED, turnTime: 90 },
    { time: '18:00', partySize: 4, table: 'T5', user: user5.id, status: ReservationStatus.CONFIRMED, turnTime: 120 },
    { time: '18:30', partySize: 2, table: 'T2', user: user2.id, status: ReservationStatus.CONFIRMED, turnTime: 90 },
    { time: '19:00', partySize: 8, table: 'T6', user: user4.id, status: ReservationStatus.CONFIRMED, turnTime: 150 },
    { time: '20:00', partySize: 4, table: 'T4', user: user5.id, status: ReservationStatus.CONFIRMED, turnTime: 120 },
    { time: '20:30', partySize: 2, table: 'T3', user: user2.id, status: ReservationStatus.CONFIRMED, turnTime: 90 },
    { time: '21:00', partySize: 1, table: 'Bar 1', user: user4.id, status: ReservationStatus.CONFIRMED, turnTime: 60 },
    { time: '21:00', partySize: 1, table: 'Bar 2', user: user5.id, status: ReservationStatus.CONFIRMED, turnTime: 60 },
  ];

  for (const reservation of todayReservations) {
    const [hours, minutes] = reservation.time.split(':').map(Number);
    const reservationDate = new Date(today);
    reservationDate.setHours(hours, minutes, 0, 0);

    const table = restaurant1Tables.find(t => t.name === reservation.table);
    if (table) {
      await prisma.reservation.create({
        data: {
          userId: reservation.user,
          restaurantId: restaurant1.id,
          tableId: table.id,
          reservationTime: reservationDate,
          partySize: reservation.partySize,
          status: reservation.status,
          notes: `Table utilization demo - ${reservation.time}`,
          turnTimeUsed: reservation.turnTime,
        },
      });
    }
  }

  // Add some reservations for Luigi's Pizzeria today as well
  const luigiReservations = [
    { time: '12:00', partySize: 4, table: 'P1', user: user2.id, status: ReservationStatus.COMPLETED, turnTime: 75 },
    { time: '13:30', partySize: 6, table: 'P3', user: user4.id, status: ReservationStatus.COMPLETED, turnTime: 100 },
    { time: '18:00', partySize: 4, table: 'P2', user: user5.id, status: ReservationStatus.CONFIRMED, turnTime: 75 },
    { time: '19:00', partySize: 8, table: 'P5', user: user2.id, status: ReservationStatus.CONFIRMED, turnTime: 100 },
    { time: '20:00', partySize: 6, table: 'P4', user: user4.id, status: ReservationStatus.CONFIRMED, turnTime: 100 },
  ];

  for (const reservation of luigiReservations) {
    const [hours, minutes] = reservation.time.split(':').map(Number);
    const reservationDate = new Date(today);
    reservationDate.setHours(hours, minutes, 0, 0);

    const table = restaurant2Tables.find(t => t.name === reservation.table);
    if (table) {
      await prisma.reservation.create({
        data: {
          userId: reservation.user,
          restaurantId: restaurant2.id,
          tableId: table.id,
          reservationTime: reservationDate,
          partySize: reservation.partySize,
          status: reservation.status,
          notes: `Pizza demo - ${reservation.time}`,
          turnTimeUsed: reservation.turnTime,
        },
      });
    }
  }

  console.log(`Created sample reservations including today's utilization data...`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });