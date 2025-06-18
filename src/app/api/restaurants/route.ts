import { Cuisine, type Prisma } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { calculateAvailability } from '@/lib/availability'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const city = searchParams.get('city')
    const cuisineParam = searchParams.get('cuisine')
    const cuisine =
      cuisineParam &&
      cuisineParam.trim() &&
      Object.values(Cuisine).includes(cuisineParam as Cuisine)
        ? (cuisineParam as Cuisine)
        : null

    // Log invalid cuisine filter for debugging
    if (cuisineParam && cuisineParam.trim() && !cuisine) {
      console.warn(
        `Invalid cuisine filter received: "${cuisineParam}". Valid options:`,
        Object.values(Cuisine)
      )
    }
    const date = searchParams.get('date')
    const partySize = parseInt(searchParams.get('partySize') || '2')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Build where clause
    const where: Prisma.RestaurantWhereInput = {}

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (cuisine) {
      where.cuisine = cuisine
    }

    // Get restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        tables: true,
        operatingHours: true,
        turnTimeRules: true,
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    })

    // Calculate availability for each restaurant
    const restaurantsWithAvailability = await Promise.all(
      restaurants.map(async (restaurant) => {
        const availabilitySlots = await calculateAvailability(restaurant.id, date, partySize)

        return {
          ...restaurant,
          availability: {
            hasAvailability: availabilitySlots.some((slot) => slot.available),
            availableSlots: availabilitySlots,
          },
        }
      })
    )

    // Get total count for pagination
    const total = await prisma.restaurant.count({ where })

    return NextResponse.json({
      restaurants: restaurantsWithAvailability,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error searching restaurants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
