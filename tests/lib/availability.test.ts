import { Cuisine, ReservationStatus } from '@prisma/client'
import { beforeEach, describe, expect, it } from 'vitest'
import { calculateAvailability } from '@/lib/availability'
import { prisma } from '../../src/lib/prisma'
import { prismaMock } from '../setup'

describe('calculateAvailability', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    prismaMock.restaurant.findUnique.mockReset()
  })

  const mockRestaurant = {
    id: 'restaurant-1',
    name: 'Test Restaurant',
    description: 'Test description',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    phone: '555-0123',
    email: 'test@test.com',
    website: 'https://test.com',
    cuisine: Cuisine.AMERICAN,
    profileImageUrl: null,
    bannerImageUrl: null,
    ownerId: 'owner-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tables: [
      {
        id: 'table-1',
        name: 'T1',
        capacityMin: 2,
        capacityMax: 4,
        isJoinable: false,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'table-2',
        name: 'T2',
        capacityMin: 2,
        capacityMax: 4,
        isJoinable: false,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    operatingHours: [
      {
        id: 'hours-1',
        dayOfWeek: 0, // Sunday (2024-01-15 is a Sunday)
        openTime: '17:00',
        closeTime: '22:00',
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    turnTimeRules: [
      {
        id: 'rule-1',
        partySizeMin: 1,
        partySizeMax: 4,
        turnTimeInMinutes: 90,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    reservations: [],
  }

  it('should return empty array when restaurant not found', async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(null)

    const result = await calculateAvailability('nonexistent', '2024-01-15', 2)

    expect(result).toEqual([])
  })

  it('should return empty array when restaurant is closed on the requested day', async () => {
    const restaurantClosedOnMonday = {
      ...mockRestaurant,
      operatingHours: [], // No operating hours for Monday
    }

    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantClosedOnMonday)

    // Monday 2024-01-16 (day after Sunday)
    const result = await calculateAvailability('restaurant-1', '2024-01-16', 2)

    expect(result).toEqual([])
  })

  it('should generate available time slots when no reservations exist', async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(mockRestaurant)

    // Monday 2024-01-15 - restaurant is open 17:00-22:00, turn time 90 min
    // Should generate slots: 17:00, 17:30, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30
    // Last booking time = 22:00 - 90min = 20:30
    const result = await calculateAvailability('restaurant-1', '2024-01-15', 2)

    expect(result).toHaveLength(8) // 17:00 to 20:30 in 30-min intervals
    expect(result[0]).toEqual({
      time: '17:00',
      available: true,
      tableId: 'table-1',
    })
    expect(result[7]).toEqual({
      time: '20:30',
      available: true,
      tableId: 'table-1',
    })

    // All slots should be available
    expect(result.every((slot) => slot.available)).toBe(true)
  })

  it('should mark time slots as unavailable when there are conflicting reservations', async () => {
    const testDate = '2024-01-15' // Sunday
    // Create reservation time in local timezone to match slot calculation
    const reservationTime = new Date(2024, 0, 15, 19, 0) // 7 PM local time

    const restaurantWithReservation = {
      ...mockRestaurant,
      reservations: [
        {
          id: 'reservation-1',
          userId: 'user-1',
          restaurantId: 'restaurant-1',
          tableId: 'table-1',
          reservationTime: reservationTime,
          partySize: 2,
          status: ReservationStatus.CONFIRMED,
          notes: 'Test reservation',
          turnTimeUsed: 90, // 90 minutes = 1.5 hours
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantWithReservation)

    const result = await calculateAvailability('restaurant-1', testDate, 2)

    // Find slots that should conflict with the 19:00-20:30 reservation
    const slot19_00 = result.find((slot) => slot.time === '19:00')
    const slot19_30 = result.find((slot) => slot.time === '19:30')
    const slot20_00 = result.find((slot) => slot.time === '20:00')
    const slot20_30 = result.find((slot) => slot.time === '20:30')

    // Table T1 is reserved 19:00-20:30, but table T2 should still be available
    // So all slots should remain available (using table T2)
    expect(slot19_00?.available).toBe(true) // Should use table T2
    expect(slot19_30?.available).toBe(true) // Should use table T2
    expect(slot20_00?.available).toBe(true) // Should use table T2
    expect(slot20_30?.available).toBe(true) // Both tables available after reservation ends

    // Verify that the correct table is assigned
    expect(slot19_00?.tableId).toBe('table-2') // Should assign table T2 since T1 is busy

    // Earlier slots should be available (both tables free)
    const slot17_00 = result.find((slot) => slot.time === '17:00')
    const slot17_30 = result.find((slot) => slot.time === '17:30')
    const slot18_00 = result.find((slot) => slot.time === '18:00')
    const slot18_30 = result.find((slot) => slot.time === '18:30')

    expect(slot17_00?.available).toBe(true) // Should use table-1 (first available)
    expect(slot17_30?.available).toBe(true) // Should use table-1 (first available)
    expect(slot18_00?.available).toBe(true) // Should use table-2 (T1 conflicts with later reservation)
    expect(slot18_30?.available).toBe(true) // Should use table-2 (T1 conflicts with later reservation)
  })

  it('should handle party size filtering correctly', async () => {
    const restaurantWithSmallTables = {
      ...mockRestaurant,
      tables: [
        {
          id: 'table-small',
          name: 'Small Table',
          capacityMin: 1,
          capacityMax: 2, // Can only seat 2 people
          isJoinable: false,
          restaurantId: 'restaurant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantWithSmallTables)

    // Request for party of 4 - should have no available slots
    const result = await calculateAvailability('restaurant-1', '2024-01-15', 4)

    expect(result.every((slot) => slot.available === false)).toBe(true)
  })

  it('should only consider PENDING and CONFIRMED reservations for conflicts', async () => {
    const testDate = '2024-01-15'
    const reservationTime = new Date(2024, 0, 15, 19, 0) // 7 PM local time

    const restaurantWithCancelledReservation = {
      ...mockRestaurant,
      reservations: [
        {
          id: 'reservation-cancelled',
          userId: 'user-1',
          restaurantId: 'restaurant-1',
          tableId: 'table-1',
          reservationTime: reservationTime,
          partySize: 2,
          status: ReservationStatus.CANCELLED, // This should not cause conflicts
          notes: 'Cancelled reservation',
          turnTimeUsed: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantWithCancelledReservation)

    const result = await calculateAvailability('restaurant-1', testDate, 2)

    // All slots should be available since the reservation is cancelled
    expect(result.every((slot) => slot.available)).toBe(true)
  })

  it('should handle timezone and date boundary issues correctly', async () => {
    const testDate = '2024-01-15'

    // Create reservations at different times to test date boundary handling
    const reservationsOnDifferentDays = {
      ...mockRestaurant,
      reservations: [
        {
          id: 'reservation-previous-day',
          userId: 'user-1',
          restaurantId: 'restaurant-1',
          tableId: 'table-1',
          reservationTime: new Date('2024-01-14T23:00:00.000Z'), // Previous day
          partySize: 2,
          status: ReservationStatus.CONFIRMED,
          notes: 'Previous day reservation',
          turnTimeUsed: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'reservation-next-day',
          userId: 'user-2',
          restaurantId: 'restaurant-1',
          tableId: 'table-2',
          reservationTime: new Date('2024-01-16T01:00:00.000Z'), // Next day
          partySize: 2,
          status: ReservationStatus.CONFIRMED,
          notes: 'Next day reservation',
          turnTimeUsed: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    prismaMock.restaurant.findUnique.mockResolvedValue(reservationsOnDifferentDays)

    const result = await calculateAvailability('restaurant-1', testDate, 2)

    // All slots should be available since no reservations are on the target date
    expect(result.every((slot) => slot.available)).toBe(true)
  })
})

describe('Table joining functionality', () => {
  it('should find available joined tables for party of 11', async () => {
    // Create a test restaurant with joinable tables
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant',
        description: 'Test description',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        phone: '555-0123',
        email: 'test@test.com',
        cuisine: 'ITALIAN',
        ownerId: 'test-owner',
        operatingHours: {
          create: {
            dayOfWeek: 1, // Monday
            openTime: '11:00',
            closeTime: '22:00',
          },
        },
        tables: {
          create: [
            { name: 'P3', capacityMin: 4, capacityMax: 6, isJoinable: true },
            { name: 'P4', capacityMin: 4, capacityMax: 6, isJoinable: true },
            { name: 'P5', capacityMin: 6, capacityMax: 10, isJoinable: false },
          ],
        },
        turnTimeRules: {
          create: {
            partySizeMin: 1,
            partySizeMax: 15,
            turnTimeInMinutes: 120,
          },
        },
      },
    })

    // Test availability for party of 11 on a Monday
    const availability = await calculateAvailability(
      restaurant.id,
      '2025-06-16', // A Monday
      11
    )

    // Should find available slots since P3 + P4 can accommodate 8-12 people
    const availableSlots = availability.filter((slot) => slot.available)
    expect(availableSlots.length).toBeGreaterThan(0)

    // Clean up
    await prisma.restaurant.delete({
      where: { id: restaurant.id },
    })
  })

  it('should not find availability when joinable tables are already booked', async () => {
    // Create a test restaurant with joinable tables
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant 2',
        description: 'Test description',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        phone: '555-0124',
        email: 'test2@test.com',
        cuisine: 'ITALIAN',
        ownerId: 'test-owner',
        operatingHours: {
          create: {
            dayOfWeek: 1, // Monday
            openTime: '11:00',
            closeTime: '22:00',
          },
        },
        tables: {
          create: [
            { name: 'P3', capacityMin: 4, capacityMax: 6, isJoinable: true },
            { name: 'P4', capacityMin: 4, capacityMax: 6, isJoinable: true },
          ],
        },
        turnTimeRules: {
          create: {
            partySizeMin: 1,
            partySizeMax: 15,
            turnTimeInMinutes: 120,
          },
        },
      },
    })

    // Get table IDs
    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id },
    })

    // Book one of the joinable tables
    await prisma.reservation.create({
      data: {
        userId: 'test-user',
        restaurantId: restaurant.id,
        tableId: tables[0].id,
        reservationTime: new Date('2025-06-16T18:00:00'),
        partySize: 4,
        status: 'CONFIRMED',
        turnTimeUsed: 120,
      },
    })

    // Test availability for party of 11 on the same day
    const availability = await calculateAvailability(restaurant.id, '2025-06-16', 11)

    // Should not find the 6pm slot available since one table is booked
    const sixPmSlot = availability.find((slot) => slot.time === '18:00')
    expect(sixPmSlot?.available).toBe(false)

    // Clean up
    await prisma.restaurant.delete({
      where: { id: restaurant.id },
    })
  })
})
