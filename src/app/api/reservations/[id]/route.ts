import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid action. Only "cancel" is supported.' },
        { status: 400 }
      )
    }

    // Find the reservation first
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        restaurant: {
          include: {
            cancellationPolicy: true,
          },
        },
        user: true,
        table: true,
      },
    })

    if (!existingReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if reservation can be cancelled
    if (existingReservation.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Reservation is already cancelled' }, { status: 400 })
    }

    if (existingReservation.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot cancel a completed reservation' }, { status: 400 })
    }

    // Check cancellation policy if it exists
    const cancellationPolicy = existingReservation.restaurant.cancellationPolicy
    if (cancellationPolicy && !cancellationPolicy.allowOnlineCancellation) {
      return NextResponse.json(
        {
          error:
            'Online cancellation is not allowed for this restaurant. Please contact the restaurant directly.',
          restaurantPhone: existingReservation.restaurant.phone,
        },
        { status: 403 }
      )
    }

    // Check if cancellation is within allowed time frame
    if (cancellationPolicy?.hoursBeforeNoFee) {
      const hoursUntilReservation =
        (existingReservation.reservationTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)

      if (hoursUntilReservation < cancellationPolicy.hoursBeforeNoFee) {
        return NextResponse.json(
          {
            error: `Reservations must be cancelled at least ${cancellationPolicy.hoursBeforeNoFee} hours in advance`,
            cancellationPolicy: {
              hoursBeforeNoFee: cancellationPolicy.hoursBeforeNoFee,
              feePercentage: cancellationPolicy.feePercentage,
              fixedFeeAmount: cancellationPolicy.fixedFeeAmount,
              notes: cancellationPolicy.notes,
            },
          },
          { status: 400 }
        )
      }
    }

    // Update reservation status to cancelled
    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        user: true,
        table: true,
      },
    })

    return NextResponse.json({
      reservation: cancelledReservation,
      message: 'Reservation cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        restaurant: true,
        user: true,
        table: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
