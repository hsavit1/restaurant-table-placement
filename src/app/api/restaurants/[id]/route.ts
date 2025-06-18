import { type NextRequest, NextResponse } from 'next/server'
import { calculateAvailability } from '@/lib/availability'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const partySize = parseInt(searchParams.get('partySize') || '2')

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        tables: true,
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        turnTimeRules: true,
        cancellationPolicy: true,
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    let availability = null
    if (date) {
      // Add timeout protection for availability calculation
      const availabilityPromise = calculateAvailability(restaurant.id, date, partySize)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Availability calculation timeout')), 5000)
      )

      try {
        const availabilitySlots = await Promise.race([availabilityPromise, timeoutPromise])
        availability = {
          hasAvailability: availabilitySlots.some((slot) => slot.available),
          availableSlots: availabilitySlots,
        }
      } catch (error) {
        console.error(`Availability calculation failed for restaurant ${restaurant.id}:`, error)
        // Return empty availability on timeout/error
        availability = {
          hasAvailability: false,
          availableSlots: [],
        }
      }
    }

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        availability,
      },
    })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
