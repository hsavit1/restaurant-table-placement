import { Cuisine, ReservationStatus } from '@prisma/client'
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it } from 'vitest'
import * as appHandler from '@/app/api/reservations/[id]/route'
import { prismaMock } from '../setup'

describe('/api/reservations/[id]', () => {
  beforeEach(() => {
    prismaMock.reservation.findUnique.mockReset()
    prismaMock.reservation.update.mockReset()
  })

  const mockReservation = {
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
      password: 'hashed_password',
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
      cancellationPolicy: {
        id: 'policy-1',
        restaurantId: 'restaurant-1',
        hoursBeforeNoFee: 24,
        feePercentage: null,
        fixedFeeAmount: null,
        notes: 'Free cancellation up to 24 hours before',
        allowOnlineCancellation: true,
        updatedAt: new Date(),
      },
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
  }

  describe('GET /api/reservations/[id]', () => {
    it('should return a single reservation', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(mockReservation)

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.reservation.id).toBe('reservation-1')
          expect(data.reservation.restaurant.name).toBe('The Gourmet Place')
        },
      })

      expect(prismaMock.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: 'reservation-1' },
        include: {
          restaurant: true,
          user: true,
          table: true,
        },
      })
    })

    it('should return 404 when reservation not found', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null)

      await testApiHandler({
        appHandler,
        params: { id: 'nonexistent' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(404)
          const data = await res.json()
          expect(data.error).toBe('Reservation not found')
        },
      })
    })
  })

  describe('PATCH /api/reservations/[id] - Cancel Reservation', () => {
    it('should successfully cancel a confirmed reservation', async () => {
      const futureReservation = {
        ...mockReservation,
        reservationTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      }

      prismaMock.reservation.findUnique.mockResolvedValue(futureReservation)
      prismaMock.reservation.update.mockResolvedValue({
        ...futureReservation,
        status: ReservationStatus.CANCELLED,
      })

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.reservation.status).toBe(ReservationStatus.CANCELLED)
          expect(data.message).toBe('Reservation cancelled successfully')
        },
      })

      expect(prismaMock.reservation.update).toHaveBeenCalledWith({
        where: { id: 'reservation-1' },
        data: {
          status: 'CANCELLED',
          updatedAt: expect.any(Date),
        },
        include: {
          restaurant: true,
          user: true,
          table: true,
        },
      })
    })

    it('should return 400 for invalid action', async () => {
      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'invalid' }),
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Invalid action. Only "cancel" is supported.')
        },
      })
    })

    it('should return 404 when reservation not found', async () => {
      prismaMock.reservation.findUnique.mockResolvedValue(null)

      await testApiHandler({
        appHandler,
        params: { id: 'nonexistent' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(404)
          const data = await res.json()
          expect(data.error).toBe('Reservation not found')
        },
      })
    })

    it('should return 400 when reservation is already cancelled', async () => {
      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      }

      prismaMock.reservation.findUnique.mockResolvedValue(cancelledReservation)

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Reservation is already cancelled')
        },
      })
    })

    it('should return 400 when reservation is completed', async () => {
      const completedReservation = {
        ...mockReservation,
        status: ReservationStatus.COMPLETED,
      }

      prismaMock.reservation.findUnique.mockResolvedValue(completedReservation)

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Cannot cancel a completed reservation')
        },
      })
    })

    it('should return 403 when online cancellation is not allowed', async () => {
      const reservationWithNoOnlineCancellation = {
        ...mockReservation,
        restaurant: {
          ...mockReservation.restaurant,
          cancellationPolicy: {
            ...mockReservation.restaurant.cancellationPolicy!,
            allowOnlineCancellation: false,
          },
        },
      }

      prismaMock.reservation.findUnique.mockResolvedValue(reservationWithNoOnlineCancellation)

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(403)
          const data = await res.json()
          expect(data.error).toBe(
            'Online cancellation is not allowed for this restaurant. Please contact the restaurant directly.'
          )
          expect(data.restaurantPhone).toBe('555-0100')
        },
      })
    })

    it('should return 400 when cancellation is too late (within cancellation window)', async () => {
      const nearFutureReservation = {
        ...mockReservation,
        reservationTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        restaurant: {
          ...mockReservation.restaurant,
          cancellationPolicy: {
            ...mockReservation.restaurant.cancellationPolicy!,
            hoursBeforeNoFee: 24,
          },
        },
      }

      prismaMock.reservation.findUnique.mockResolvedValue(nearFutureReservation)

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Reservations must be cancelled at least 24 hours in advance')
          expect(data.cancellationPolicy.hoursBeforeNoFee).toBe(24)
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.reservation.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await testApiHandler({
        appHandler,
        params: { id: 'reservation-1' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'cancel' }),
          })

          expect(res.status).toBe(500)
          const data = await res.json()
          expect(data.error).toBe('Internal server error')
        },
      })
    })
  })
}) 