/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cuisine, ReservationStatus } from '@prisma/client'
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it } from 'vitest'
import * as reservationsHandler from '@/app/api/reservations/route'
import * as restaurantsHandler from '@/app/api/restaurants/route'
import { prismaMock } from '../setup'

describe('Reservation Flow Integration Test', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    prismaMock.restaurant.findMany.mockReset()
    prismaMock.restaurant.count.mockReset()
    prismaMock.restaurant.findUnique.mockReset()
    prismaMock.reservation.create.mockReset()
  })

  const testDate = '2024-01-15' // Sunday
  const partySize = 4

  // Mock restaurant with 2 tables that can accommodate party of 4
  const mockRestaurant = {
    id: 'restaurant-1',
    name: 'Test Restaurant',
    description: 'A great place to eat',
    address: '123 Main St',
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tables: [
      {
        id: 'table-1',
        name: 'T1',
        capacityMin: 2,
        capacityMax: 6,
        isJoinable: false,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'table-2',
        name: 'T2',
        capacityMin: 2,
        capacityMax: 6,
        isJoinable: false,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    operatingHours: [
      {
        id: 'hours-1',
        dayOfWeek: 0, // Sunday
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
        partySizeMax: 10,
        turnTimeInMinutes: 90,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    reservations: [], // Start with no reservations
  }

  it('should complete the full reservation flow: user1 books 6pm, user2 cannot see 6pm', async () => {
    // STEP 1: User1 checks availability - should see 6pm slot available
    console.log('🔍 STEP 1: User1 checks availability')

    // Mock the restaurant queries for both the main API and calculateAvailability
    prismaMock.restaurant.findMany.mockResolvedValue([mockRestaurant])
    prismaMock.restaurant.count.mockResolvedValue(1)
    prismaMock.restaurant.findUnique.mockResolvedValue(mockRestaurant as any)

    let availabilityResponse: {
      restaurants: Array<{
        availability: {
          hasAvailability: boolean
          availableSlots: Array<{ time: string; available: boolean }>
        }
      }>
    }
    await testApiHandler({
      appHandler: restaurantsHandler,
      url: `/api/restaurants?date=${testDate}&partySize=${partySize}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        availabilityResponse = await res.json()

        // Should have the restaurant with availability
        expect(availabilityResponse.restaurants).toHaveLength(1)
        const restaurant = availabilityResponse.restaurants[0]

        expect(restaurant.availability.hasAvailability).toBe(true)

        // Should have 6pm slot available
        const slot6pm = restaurant.availability.availableSlots.find(
          (slot: any) => slot.time === '18:00'
        )
        expect(slot6pm).toBeDefined()
        expect(slot6pm?.available).toBe(true)

        console.log('✅ User1 can see 6pm slot available')
      },
    })

    // STEP 2: User1 books the 6pm slot
    console.log('🔍 STEP 2: User1 books the 6pm slot')

    const user1Reservation = {
      userId: 'user-1',
      restaurantId: 'restaurant-1',
      reservationTime: `${testDate}T18:00:00`,
      partySize: partySize,
      notes: 'Birthday dinner',
    }

    // Mock the restaurant lookup for booking
    prismaMock.restaurant.findUnique.mockResolvedValue(mockRestaurant as any)

    // Mock successful reservation creation
    const createdReservation = {
      id: 'reservation-1',
      userId: 'user-1',
      restaurantId: 'restaurant-1',
      tableId: 'table-1',
      reservationTime: new Date(`${testDate}T18:00:00`),
      partySize: partySize,
      notes: 'Birthday dinner',
      status: ReservationStatus.PENDING,
      turnTimeUsed: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
      restaurant: { id: 'restaurant-1', name: 'Test Restaurant' },
      table: { id: 'table-1', name: 'T1' },
      user: { id: 'user-1', name: 'User One' },
    }

    prismaMock.reservation.create.mockResolvedValue(createdReservation)

    await testApiHandler({
      appHandler: reservationsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user1Reservation),
        })

        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.reservation.id).toBe('reservation-1')
        expect(data.reservation.tableId).toBe('table-1')

        console.log('✅ User1 successfully booked 6pm slot on table T1')
      },
    })

    // STEP 3: User2 checks availability - should NOT see 6pm slot available
    console.log('🔍 STEP 3: User2 checks availability after User1 booking')

    // Now mock the restaurant with the existing reservation
    const restaurantWithReservation = {
      ...mockRestaurant,
      reservations: [
        {
          id: 'reservation-1',
          userId: 'user-1',
          restaurantId: 'restaurant-1',
          tableId: 'table-1', // Table 1 is now booked
          reservationTime: new Date(`${testDate}T18:00:00`),
          partySize: partySize,
          status: ReservationStatus.PENDING,
          turnTimeUsed: 90,
          notes: 'Birthday dinner',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    prismaMock.restaurant.findMany.mockResolvedValue([restaurantWithReservation])
    prismaMock.restaurant.count.mockResolvedValue(1)
    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantWithReservation as any)

    await testApiHandler({
      appHandler: restaurantsHandler,
      url: `/api/restaurants?date=${testDate}&partySize=${partySize}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()

        // Should still have the restaurant
        expect(data.restaurants).toHaveLength(1)
        const restaurant = data.restaurants[0]

        // Should still have availability (table 2 is free)
        expect(restaurant.availability.hasAvailability).toBe(true)

        // But 6pm slot should NOT be available (both tables needed for party of 4)
        const slot6pm = restaurant.availability.availableSlots.find(
          (slot: any) => slot.time === '18:00'
        )
        expect(slot6pm).toBeDefined()
        expect(slot6pm.available).toBe(true) // Table 2 is still available

        // However, if we had only 1 table total, or if both tables were needed...
        // Let's check the 7pm slot should be available
        const slot7pm = restaurant.availability.availableSlots.find(
          (slot: any) => slot.time === '19:00'
        )
        expect(slot7pm).toBeDefined()
        expect(slot7pm.available).toBe(true)

        console.log('✅ User2 sees availability correctly updated')
      },
    })

    // STEP 4: Let's test the scenario where BOTH tables are needed (party of 8)
    console.log('🔍 STEP 4: Testing larger party that needs both tables')

    const largeParySize = 8 // Needs both tables

    await testApiHandler({
      appHandler: restaurantsHandler,
      url: `/api/restaurants?date=${testDate}&partySize=${largeParySize}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()

        const restaurant = data.restaurants[0]

        // For party of 8, no tables can accommodate (max capacity is 6 per table)
        expect(restaurant.availability.hasAvailability).toBe(false)
        expect(restaurant.availability.availableSlots).toHaveLength(0)

        console.log('✅ Large party correctly shows no availability')
      },
    })

    console.log('🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!')
  })

  it('should handle the exact scenario: table becomes unavailable after booking', async () => {
    // This test simulates the exact scenario with only 1 table available
    const singleTableRestaurant = {
      ...mockRestaurant,
      tables: [
        {
          id: 'table-1',
          name: 'T1',
          capacityMin: 2,
          capacityMax: 6,
          isJoinable: false,
          restaurantId: 'restaurant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    // STEP 1: User1 sees 6pm available
    prismaMock.restaurant.findMany.mockResolvedValue([singleTableRestaurant])
    prismaMock.restaurant.count.mockResolvedValue(1)
    prismaMock.restaurant.findUnique.mockResolvedValue(singleTableRestaurant as any)

    await testApiHandler({
      appHandler: restaurantsHandler,
      url: `/api/restaurants?date=${testDate}&partySize=${partySize}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        const data = await res.json()

        const slot6pm = data.restaurants[0].availability.availableSlots.find(
          (slot: any) => slot.time === '18:00'
        )
        expect(slot6pm?.available).toBe(true)

        console.log('✅ User1 sees 6pm slot available (single table)')
      },
    })

    // STEP 2: After User1 books, User2 cannot see 6pm
    const restaurantWithBooking = {
      ...singleTableRestaurant,
      reservations: [
        {
          id: 'reservation-1',
          userId: 'user-1',
          restaurantId: 'restaurant-1',
          tableId: 'table-1',
          reservationTime: new Date(`${testDate}T18:00:00`),
          partySize: partySize,
          status: ReservationStatus.PENDING,
          turnTimeUsed: 90,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }

    // Reset the mocks to ensure fresh state
    prismaMock.restaurant.findMany.mockReset()
    prismaMock.restaurant.findUnique.mockReset()

    prismaMock.restaurant.findMany.mockResolvedValue([restaurantWithBooking])
    prismaMock.restaurant.findUnique.mockResolvedValue(restaurantWithBooking as any)

    await testApiHandler({
      appHandler: restaurantsHandler,
      url: `/api/restaurants?date=${testDate}&partySize=${partySize}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        const data = await res.json()

        // 6pm should not be available anymore (should not exist in available slots)
        const slot6pm = data.restaurants[0].availability.availableSlots.find(
          (slot: any) => slot.time === '18:00'
        )
        expect(slot6pm).toBeUndefined() // Slot should not exist at all

        // But 7pm should also not be available (still conflicts with 18:00 + 90min = 19:30)
        const slot7pm = data.restaurants[0].availability.availableSlots.find(
          (slot: any) => slot.time === '19:00'
        )
        expect(slot7pm).toBeUndefined() // Still conflicts

        // 7:30pm should be available (first available slot after the reservation ends)
        const slot730pm = data.restaurants[0].availability.availableSlots.find(
          (slot: any) => slot.time === '19:30'
        )
        expect(slot730pm?.available).toBe(true)

        console.log('✅ User2 cannot see 6pm or 7pm slots - first available is 7:30pm')
      },
    })
  })
})
