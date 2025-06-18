import { Cuisine } from '@prisma/client'
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it } from 'vitest'
import * as appHandler from '@/app/api/restaurants/route'
import { prismaMock } from '../setup'

describe('/api/restaurants', () => {
  beforeEach(() => {
    prismaMock.restaurant.findMany.mockReset()
  })

  const mockRestaurants = [
    {
      id: 'restaurant-1',
      name: 'Test Restaurant 1',
      description: 'A great place to eat',
      address: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0123',
      email: 'test1@test.com',
      website: 'https://test1.com',
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
          dayOfWeek: 1,
          openTime: '17:00',
          closeTime: '22:00',
          restaurantId: 'restaurant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 'restaurant-2',
      name: 'Test Restaurant 2',
      description: 'Another great place',
      address: '456 Oak Ave',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0124',
      email: 'test2@test.com',
      website: 'https://test2.com',
      cuisine: Cuisine.ITALIAN,
      profileImageUrl: null,
      bannerImageUrl: null,
      ownerId: 'owner-2',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tables: [
        {
          id: 'table-2',
          name: 'T2',
          capacityMin: 2,
          capacityMax: 6,
          isJoinable: false,
          restaurantId: 'restaurant-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      operatingHours: [
        {
          id: 'hours-2',
          dayOfWeek: 1,
          openTime: '18:00',
          closeTime: '23:00',
          restaurantId: 'restaurant-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ]

  describe('GET /api/restaurants', () => {
    it('should require date parameter', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toBe('Date is required')
        },
      })
    })

    it('should return restaurants with pagination when date is provided', async () => {
      prismaMock.restaurant.findMany.mockResolvedValue(mockRestaurants)
      prismaMock.restaurant.count.mockResolvedValue(2)

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?date=2024-01-15',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.restaurants).toHaveLength(2)
          expect(data.restaurants[0].name).toBe('Test Restaurant 1')
          expect(data.restaurants[1].name).toBe('Test Restaurant 2')
          expect(data.pagination.total).toBe(2)
          expect(data.pagination.hasMore).toBe(false)
        },
      })
    })

    it('should filter restaurants by date and party size', async () => {
      // Mock that both restaurants have availability
      prismaMock.restaurant.findMany.mockResolvedValue(mockRestaurants)
      prismaMock.restaurant.count.mockResolvedValue(2)

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?date=2024-01-15&partySize=2',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.restaurants).toBeDefined()
          expect(Array.isArray(data.restaurants)).toBe(true)
          expect(data.pagination).toBeDefined()
        },
      })
    })

    it('should filter restaurants by cuisine', async () => {
      const italianRestaurants = [mockRestaurants[1]] // Only Italian restaurant
      prismaMock.restaurant.findMany.mockResolvedValue(italianRestaurants)
      prismaMock.restaurant.count.mockResolvedValue(1)

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?cuisine=ITALIAN&date=2024-01-15',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.restaurants).toHaveLength(1)
          expect(data.restaurants[0].cuisine).toBe('ITALIAN')
          expect(data.pagination.total).toBe(1)
        },
      })
    })

    it('should search restaurants by name', async () => {
      const searchResults = [mockRestaurants[0]] // Only first restaurant matches
      prismaMock.restaurant.findMany.mockResolvedValue(searchResults)
      prismaMock.restaurant.count.mockResolvedValue(1)

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?query=Test%20Restaurant%201&date=2024-01-15',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.restaurants).toHaveLength(1)
          expect(data.restaurants[0].name).toBe('Test Restaurant 1')
          expect(data.pagination.total).toBe(1)
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.restaurant.findMany.mockRejectedValue(new Error('Database connection failed'))

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?date=2024-01-15',
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

    it('should return empty array when no restaurants match filters', async () => {
      prismaMock.restaurant.findMany.mockResolvedValue([])
      prismaMock.restaurant.count.mockResolvedValue(0)

      await testApiHandler({
        appHandler,
        url: '/api/restaurants?cuisine=CHINESE&date=2024-01-15&partySize=10',
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.restaurants).toEqual([])
          expect(data.pagination.total).toBe(0)
        },
      })
    })
  })
})
