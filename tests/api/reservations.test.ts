import { Cuisine, ReservationStatus } from '@prisma/client'
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it } from 'vitest'
import * as appHandler from '@/app/api/reservations/route'
import { prismaMock } from '../setup'

describe('/api/reservations', () => {
  beforeEach(() => {
    prismaMock.reservation.findMany.mockReset()
    prismaMock.reservation.create.mockReset()
  })

  const mockReservations = [
    {
      id: 'reservation-1',
      userId: 'user-1',
      restaurantId: 'restaurant-1',
      tableId: 'table-1',
      reservationTime: new Date('2024-01-15T19:00:00.000Z'),
      partySize: 2,
      status: ReservationStatus.CONFIRMED,
      notes: 'Anniversary dinner',
      turnTimeUsed: 90,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      restaurant: {
        id: 'restaurant-1',
        name: 'The Gourmet Place',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        cuisine: Cuisine.AMERICAN,
        phone: '555-0100',
        email: 'info@gourmet.com',
        website: 'https://gourmet.com',
        description: 'Fine dining',
        profileImageUrl: null,
        bannerImageUrl: null,
        ownerId: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      table: {
        id: 'table-1',
        name: 'T1',
        capacityMin: 2,
        capacityMax: 4,
        isJoinable: false,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: 'reservation-2',
      userId: 'user-2',
      restaurantId: 'restaurant-2',
      tableId: 'table-2',
      reservationTime: new Date('2024-01-16T20:00:00.000Z'),
      partySize: 4,
      status: ReservationStatus.PENDING,
      notes: 'Birthday celebration',
      turnTimeUsed: 120,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0124',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      restaurant: {
        id: 'restaurant-2',
        name: "Luigi's Pizzeria",
        address: '456 Oak Ave',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        cuisine: Cuisine.ITALIAN,
        phone: '555-0200',
        email: 'info@luigis.com',
        website: 'https://luigis.com',
        description: 'Authentic Italian',
        profileImageUrl: null,
        bannerImageUrl: null,
        ownerId: 'owner-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      table: {
        id: 'table-2',
        name: 'P1',
        capacityMin: 2,
        capacityMax: 6,
        isJoinable: false,
        restaurantId: 'restaurant-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ]

  describe('GET /api/reservations', () => {
    it('should return all reservations when no query parameters provided', async () => {
      prismaMock.reservation.findMany.mockResolvedValue(mockReservations)

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.reservations).toHaveLength(2)
          expect(data.reservations[0].id).toBe('reservation-1')
          expect(data.reservations[1].id).toBe('reservation-2')
        },
      })

      expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          restaurant: true,
          table: true,
          user: true,
        },
        orderBy: {
          reservationTime: 'desc',
        },
      })
    })

    it('should filter reservations by restaurant ID', async () => {
      const filteredReservations = [mockReservations[0]]
      prismaMock.reservation.findMany.mockResolvedValue(filteredReservations)

      await testApiHandler({
        appHandler,
        url: '/api/reservations?restaurantId=restaurant-1',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.reservations).toHaveLength(1)
          expect(data.reservations[0].restaurantId).toBe('restaurant-1')
        },
      })

      expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
        where: {
          restaurantId: 'restaurant-1',
        },
        include: {
          user: true,
          restaurant: true,
          table: true,
        },
        orderBy: {
          reservationTime: 'desc',
        },
      })
    })

    it('should filter reservations by user ID', async () => {
      const filteredReservations = [mockReservations[1]]
      prismaMock.reservation.findMany.mockResolvedValue(filteredReservations)

      await testApiHandler({
        appHandler,
        url: '/api/reservations?userId=user-2',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.reservations).toHaveLength(1)
          expect(data.reservations[0].userId).toBe('user-2')
        },
      })

      expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
        },
        include: {
          user: true,
          restaurant: true,
          table: true,
        },
        orderBy: {
          reservationTime: 'desc',
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.reservation.findMany.mockRejectedValue(new Error('Database connection failed'))

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(500)
          const data = await res.json()
          expect(data.error).toBe('Internal server error')
        },
      })
    })
  })

  describe('POST /api/reservations', () => {
    const newReservation = {
      userId: 'user-3',
      restaurantId: 'restaurant-1',
      reservationTime: '2024-01-20T19:30:00.000Z',
      partySize: 3,
      notes: 'Business dinner',
    }

    it('should return 404 when restaurant not found', async () => {
      // Mock restaurant not found
      prismaMock.restaurant.findUnique.mockResolvedValue(null)

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newReservation),
          })

          expect(res.status).toBe(404)
          const data = await res.json()
          expect(data.error).toBe('Restaurant not found')
        },
      })
    })

    it('should return 400 when required fields are missing', async () => {
      const incompleteReservation = {
        userId: 'user-3',
        restaurantId: 'restaurant-1',
        // Missing tableId, reservationTime, partySize
      }

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(incompleteReservation),
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Missing required fields')
        },
      })

      expect(prismaMock.reservation.create).not.toHaveBeenCalled()
    })

    it('should return 404 when restaurant not found for creation', async () => {
      // Don't mock restaurant - it will return null
      prismaMock.restaurant.findUnique.mockResolvedValue(null)

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newReservation),
          })

          expect(res.status).toBe(404)
          const data = await res.json()
          expect(data.error).toBe('Restaurant not found')
        },
      })
    })
  })
})
