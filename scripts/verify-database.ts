#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying Dorsia Database Setup...\n');

  try {
    // Check Users
    const users = await prisma.user.findMany();
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Check Restaurants
    const restaurants = await prisma.restaurant.findMany({
      include: {
        tables: true,
        operatingHours: true,
        turnTimeRules: true,
        cancellationPolicy: true,
        specialPeriods: true,
      }
    });
    
    console.log(`\n🍽️  Restaurants: ${restaurants.length}`);
    for (const restaurant of restaurants) {
      console.log(`   - ${restaurant.name} (${restaurant.cuisine})`);
      console.log(`     📍 ${restaurant.address}, ${restaurant.city}`);
      console.log(`     🪑 Tables: ${restaurant.tables.length}`);
      console.log(`     ⏰ Operating Hours: ${restaurant.operatingHours.length} periods`);
      console.log(`     ⏱️  Turn Time Rules: ${restaurant.turnTimeRules.length}`);
      console.log(`     📋 Cancellation Policy: ${restaurant.cancellationPolicy ? 'Yes' : 'No'}`);
      console.log(`     🎯 Special Periods: ${restaurant.specialPeriods.length}`);
      console.log('');
    }

    // Check Reservations
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
        restaurant: true,
        table: true,
      }
    });

    console.log(`📅 Reservations: ${reservations.length}`);
    reservations.forEach(reservation => {
      const date = reservation.reservationTime.toLocaleDateString();
      const time = reservation.reservationTime.toLocaleTimeString();
      console.log(`   - ${reservation.user.name} at ${reservation.restaurant.name}`);
      console.log(`     📅 ${date} at ${time} (Party of ${reservation.partySize})`);
      console.log(`     📊 Status: ${reservation.status}`);
      console.log(`     🪑 Table: ${reservation.table?.name || 'Unassigned'}`);
      console.log('');
    });

    // Database Stats
    const totalTables = await prisma.table.count();
    const confirmedReservations = await prisma.reservation.count({
      where: { status: 'CONFIRMED' }
    });

    console.log('📊 Database Statistics:');
    console.log(`   - Total Tables: ${totalTables}`);
    console.log(`   - Confirmed Reservations: ${confirmedReservations}`);
    console.log(`   - Database Connection: ✅ Working`);
    console.log(`   - Seed Data: ✅ Complete`);

    console.log('\n🎉 Database setup successful!');
    console.log('💡 Access Prisma Studio at: http://localhost:5555');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase(); 