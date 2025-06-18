import { endOfDay, startOfDay } from 'date-fns'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/restaurants/[id]/tables
 *
 * Fetches table utilization data for a restaurant on a specific date.
 * Returns all tables and their reservations for the given day.
 *
 * Query Parameters:
 * - date: ISO date string (required)
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing restaurant ID
 * @returns Table utilization data with reservations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const queryDate = new Date(date)
    if (Number.isNaN(queryDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Get restaurant with tables
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        tables: {
          orderBy: { name: 'asc' },
          include: {
            reservations: {
              where: {
                reservationTime: {
                  gte: startOfDay(queryDate),
                  lte: endOfDay(queryDate),
                },
                status: {
                  in: ['CONFIRMED', 'PENDING'],
                },
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                reservationTime: 'asc',
              },
            },
          },
        },
        operatingHours: {
          where: {
            dayOfWeek: queryDate.getDay(),
          },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Transform the data to include utilization information
    const tablesWithUtilization = restaurant.tables.map((table) => ({
      id: table.id,
      name: table.name,
      capacityMin: table.capacityMin,
      capacityMax: table.capacityMax,
      isJoinable: table.isJoinable,
      reservations: table.reservations.map((reservation) => ({
        id: reservation.id,
        reservationTime: reservation.reservationTime,
        partySize: reservation.partySize,
        status: reservation.status,
        notes: reservation.notes,
        turnTimeUsed: reservation.turnTimeUsed,
        user: {
          name: reservation.user.name,
          email: reservation.user.email,
        },
      })),
    }))

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        operatingHours: restaurant.operatingHours,
        tables: tablesWithUtilization,
      },
    })
  } catch (error) {
    console.error('Error fetching table utilization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
