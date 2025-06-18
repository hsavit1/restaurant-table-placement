import type { Prisma } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'
import { findAvailableTable } from '@/lib/availability'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Reservation POST endpoint started ===')

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
      console.log('Request body parsed:', {
        restaurantId: body.restaurantId,
        reservationTime: body.reservationTime,
        partySize: body.partySize,
        userId: body.userId,
        hasNotes: !!body.notes,
        autoConfirm: body.autoConfirm,
      })
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { restaurantId, reservationTime, partySize, notes, userId, autoConfirm } = body

    // Validate required fields
    const missingFields = []
    if (!restaurantId) missingFields.push('restaurantId')
    if (!reservationTime) missingFields.push('reservationTime')
    if (!partySize) missingFields.push('partySize')
    if (!userId) missingFields.push('userId')

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate data types and ranges
    if (typeof partySize !== 'number' || partySize < 1 || partySize > 20) {
      console.error('Invalid party size:', partySize)
      return NextResponse.json(
        { error: 'Party size must be a number between 1 and 20' },
        { status: 400 }
      )
    }

    // Validate reservation time
    let reservationDateTime
    try {
      reservationDateTime = new Date(reservationTime)
      if (Number.isNaN(reservationDateTime.getTime())) {
        throw new Error('Invalid date')
      }
      console.log('Parsed reservation time:', reservationDateTime.toISOString())
    } catch (dateError) {
      console.error('Invalid reservation time format:', reservationTime, dateError)
      return NextResponse.json({ error: 'Invalid reservation time format' }, { status: 400 })
    }

    // Check if reservation time is in the past
    if (reservationDateTime < new Date()) {
      console.error('Reservation time is in the past:', reservationDateTime)
      return NextResponse.json({ error: 'Reservation time cannot be in the past' }, { status: 400 })
    }

    console.log('=== Fetching restaurant data ===')
    // Get restaurant and turn time rules
    let restaurant
    try {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          turnTimeRules: {
            where: {
              partySizeMin: { lte: partySize },
              partySizeMax: { gte: partySize },
            },
          },
        },
      })
      console.log('Restaurant query result:', {
        found: !!restaurant,
        restaurantId: restaurant?.id,
        turnTimeRulesCount: restaurant?.turnTimeRules?.length || 0,
      })
    } catch (dbError) {
      console.error('Database error fetching restaurant:', dbError)
      return NextResponse.json(
        { error: 'Database error while fetching restaurant' },
        { status: 500 }
      )
    }

    if (!restaurant) {
      console.error('Restaurant not found:', restaurantId)
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Get turn time for this party size
    const turnTimeRule = restaurant.turnTimeRules[0]
    const turnTime = turnTimeRule?.turnTimeInMinutes || 120 // Default 2 hours
    console.log('Turn time determined:', {
      ruleFound: !!turnTimeRule,
      turnTime,
      partySize,
    })

    console.log('=== Checking table availability ===')
    // Find available table
    let tableId
    try {
      tableId = await findAvailableTable(restaurantId, reservationDateTime, partySize, turnTime)
      console.log('Availability check result:', {
        tableId,
        hasAvailableTable: !!tableId,
      })
    } catch (availabilityError) {
      console.error('Error in availability check:', availabilityError)
      return NextResponse.json({ error: 'Error checking table availability' }, { status: 500 })
    }

    if (!tableId) {
      console.log('No available tables found for:', {
        restaurantId,
        reservationTime: reservationDateTime.toISOString(),
        partySize,
        turnTime,
      })
      return NextResponse.json(
        { error: 'No available tables for the requested time' },
        { status: 409 }
      )
    }

    console.log('=== Creating reservation ===')
    // Create reservation
    let reservation
    try {
      reservation = await prisma.reservation.create({
        data: {
          userId,
          restaurantId,
          tableId,
          reservationTime: reservationDateTime,
          partySize,
          notes,
          turnTimeUsed: turnTime,
          status: autoConfirm ? 'CONFIRMED' : 'PENDING',
        },
        include: {
          restaurant: true,
          table: true,
          user: true,
        },
      })
      console.log('Reservation created successfully:', {
        reservationId: reservation.id,
        tableId: reservation.tableId,
        reservationTime: reservation.reservationTime.toISOString(),
        status: reservation.status,
        autoConfirm: autoConfirm,
      })
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
      const errorCode =
        dbError && typeof dbError === 'object' && 'code' in dbError
          ? (dbError as { code: string }).code
          : undefined

      console.error('Database error creating reservation:', {
        error: dbError,
        errorMessage,
        errorCode,
      })

      // Handle specific Prisma errors
      if (errorCode === 'P2002') {
        return NextResponse.json(
          { error: 'Reservation conflict - table may have been booked by another user' },
          { status: 409 }
        )
      }

      if (errorCode === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference - user, restaurant, or table not found' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Database error while creating reservation' },
        { status: 500 }
      )
    }

    console.log('=== Reservation POST endpoint completed successfully ===')
    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error: unknown) {
    console.error('=== Unexpected error in reservation POST endpoint ===')
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error instanceof Error ? error.constructor.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const restaurantId = searchParams.get('restaurantId')

    // Build where clause - if no filters provided, fetch all reservations
    const where: Prisma.ReservationWhereInput = {}
    if (userId) where.userId = userId
    if (restaurantId) where.restaurantId = restaurantId

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        restaurant: true,
        table: true,
        user: true,
      },
      orderBy: { reservationTime: 'desc' },
    })

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
