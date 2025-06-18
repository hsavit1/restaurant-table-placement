import { addMinutes, format, isAfter, isBefore } from 'date-fns'
import { prisma } from './prisma'
import type { AvailabilitySlot } from './types'

export async function calculateAvailability(
  restaurantId: string,
  date: string,
  partySize: number
): Promise<AvailabilitySlot[]> {
  // Get restaurant with tables and operating hours
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: true,
      operatingHours: true,
      turnTimeRules: {
        where: {
          partySizeMin: { lte: partySize },
          partySizeMax: { gte: partySize },
        },
      },
      reservations: {
        where: {
          reservationTime: {
            gte: new Date(`${date}T00:00:00`),
            lt: new Date(`${date}T23:59:59`),
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    },
  })

  if (!restaurant) {
    return []
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date(date).getDay()

  // Find operating hours for this day
  const operatingHour = restaurant.operatingHours.find((oh) => oh.dayOfWeek === dayOfWeek)

  if (!operatingHour) {
    return [] // Restaurant closed on this day
  }

  // Get turn time for this party size
  const turnTimeRule = restaurant.turnTimeRules[0]
  const turnTime = turnTimeRule?.turnTimeInMinutes || 120 // Default 2 hours

  // Generate time slots (every 30 minutes)
  const slots: AvailabilitySlot[] = []

  // Parse the date and time components manually to avoid timezone issues
  const dateParts = date.split('-').map(Number)
  const openTimeParts = operatingHour.openTime.split(':').map(Number)
  const closeTimeParts = operatingHour.closeTime.split(':').map(Number)

  // Validate date and time parsing
  if (dateParts.length !== 3 || openTimeParts.length !== 2 || closeTimeParts.length !== 2) {
    console.error(
      `Invalid date or time format: date=${date}, openTime=${operatingHour.openTime}, closeTime=${operatingHour.closeTime}`
    )
    return []
  }

  const [year, month, day] = dateParts
  const [openHour, openMinute] = openTimeParts
  const [closeHour, closeMinute] = closeTimeParts

  // Additional validation
  if (year < 2020 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) {
    console.error(`Invalid date values: year=${year}, month=${month}, day=${day}`)
    return []
  }

  if (
    openHour < 0 ||
    openHour > 23 ||
    openMinute < 0 ||
    openMinute > 59 ||
    closeHour < 0 ||
    closeHour > 23 ||
    closeMinute < 0 ||
    closeMinute > 59
  ) {
    console.error(
      `Invalid time values: openHour=${openHour}, openMinute=${openMinute}, closeHour=${closeHour}, closeMinute=${closeMinute}`
    )
    return []
  }

  const openTime = new Date(year, month - 1, day, openHour, openMinute)
  const closeTime = new Date(year, month - 1, day, closeHour, closeMinute)

  // Validate constructed dates
  if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) {
    console.error(
      `Invalid constructed dates: openTime=${openTime.toISOString()}, closeTime=${closeTime.toISOString()}`
    )
    return []
  }

  // Generate slots every 30 minutes
  let currentTime = openTime
  const lastBookingTime = addMinutes(closeTime, -turnTime)

  // Debug logging for infinite loop prevention (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Generating slots for restaurant ${restaurantId} on ${date}:`)
    console.log(`Open time: ${openTime.toISOString()}, Close time: ${closeTime.toISOString()}`)
    console.log(`Last booking time: ${lastBookingTime.toISOString()}, Turn time: ${turnTime}min`)
  }

  // Safety check to prevent infinite loops
  if (isAfter(openTime, closeTime)) {
    console.warn(
      `Invalid time configuration for restaurant ${restaurantId}: openTime (${openTime.toISOString()}) after closeTime (${closeTime.toISOString()})`
    )
    return []
  }

  if (isAfter(openTime, lastBookingTime)) {
    console.warn(
      `Cannot generate slots for restaurant ${restaurantId}: openTime (${openTime.toISOString()}) after lastBookingTime (${lastBookingTime.toISOString()}). Turn time ${turnTime}min is too long for operating hours.`
    )
    return []
  }

  // Additional check for reasonable turn time
  if (turnTime <= 0 || turnTime > 480) {
    // Max 8 hours
    console.warn(`Invalid turn time for restaurant ${restaurantId}: ${turnTime} minutes`)
    return []
  }

  let slotCount = 0
  const maxSlots = 30 // Conservative safety limit to prevent infinite loops

  // Add debugging for problematic restaurants
  const isProblematicRestaurant = [
    'cmc3k641k001n14lz7q1yie9d',
    'cmc3k641f000p14lzg8gfyjzy',
  ].includes(restaurantId)

  if (isProblematicRestaurant && process.env.NODE_ENV === 'development') {
    console.log(`🚨 DEBUGGING PROBLEMATIC RESTAURANT: ${restaurantId}`)
    console.log(`Date: ${date}, Day of week: ${dayOfWeek}`)
    console.log(`Operating hours: ${operatingHour.openTime} - ${operatingHour.closeTime}`)
    console.log(`Turn time: ${turnTime} minutes`)
    console.log(`Current time: ${currentTime.toISOString()}`)
    console.log(`Last booking time: ${lastBookingTime.toISOString()}`)
  }

  while (
    (isBefore(currentTime, lastBookingTime) ||
      currentTime.getTime() === lastBookingTime.getTime()) &&
    slotCount < maxSlots
  ) {
    const timeString = format(currentTime, 'HH:mm')
    const slotEndTime = addMinutes(currentTime, turnTime)

    // Find available tables for this time slot
    const availableTable = findAvailableTableForSlot(
      restaurant.tables,
      restaurant.reservations,
      currentTime,
      slotEndTime,
      partySize
    )

    slots.push({
      time: timeString,
      available: availableTable !== null,
      tableId: availableTable || undefined,
    })

    currentTime = addMinutes(currentTime, 30)
    slotCount++

    // Additional safety check
    if (slotCount >= maxSlots) {
      console.error(
        `Infinite loop prevented: Generated ${maxSlots} slots for restaurant ${restaurantId}`
      )
      break
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`Generated ${slotCount} time slots for restaurant ${restaurantId}`)
  }

  return slots
}

function findAvailableTableForSlot(
  tables: Array<{ id: string; capacityMin: number; capacityMax: number; isJoinable: boolean }>,
  reservations: Array<{ tableId: string | null; reservationTime: Date; turnTimeUsed: number }>,
  slotStartTime: Date,
  slotEndTime: Date,
  partySize: number
): string | null {
  // First, try to find a single table that can accommodate the party
  // Prefer tables where the party size is within the ideal range
  for (const table of tables) {
    if (table.capacityMin <= partySize && table.capacityMax >= partySize) {
      if (isTableAvailable(table, reservations, slotStartTime, slotEndTime)) {
        return table.id
      }
    }
  }

  // If no ideal table found, try larger tables that can still accommodate the party
  for (const table of tables) {
    if (partySize <= table.capacityMax) {
      if (isTableAvailable(table, reservations, slotStartTime, slotEndTime)) {
        return table.id
      }
    }
  }

  // If no single table works, try joinable table combinations
  const joinableTables = tables.filter((table) => table.isJoinable)

  // Try all possible combinations of 2 joinable tables
  for (let i = 0; i < joinableTables.length; i++) {
    for (let j = i + 1; j < joinableTables.length; j++) {
      const table1 = joinableTables[i]
      const table2 = joinableTables[j]

      // Check if combined capacity can accommodate the party
      const minCombinedCapacity = table1.capacityMin + table2.capacityMin
      const maxCombinedCapacity = table1.capacityMax + table2.capacityMax

      if (minCombinedCapacity <= partySize && partySize <= maxCombinedCapacity) {
        // Check if both tables are available
        const table1Available = isTableAvailable(table1, reservations, slotStartTime, slotEndTime)
        const table2Available = isTableAvailable(table2, reservations, slotStartTime, slotEndTime)

        if (table1Available && table2Available) {
          // Return the first table ID as the primary table (the booking system can handle joining logic)
          return table1.id
        }
      }
    }
  }

  return null
}

function isTableAvailable(
  table: { id: string; capacityMin: number; capacityMax: number; isJoinable: boolean },
  reservations: Array<{ tableId: string | null; reservationTime: Date; turnTimeUsed: number }>,
  slotStartTime: Date,
  slotEndTime: Date
): boolean {
  const conflictingReservations = reservations.filter((reservation) => {
    if (reservation.tableId !== table.id) return false

    const reservationStart = reservation.reservationTime
    const reservationEnd = addMinutes(reservationStart, reservation.turnTimeUsed)

    // Check for overlap: two time ranges overlap if one starts before the other ends
    return isBefore(slotStartTime, reservationEnd) && isAfter(slotEndTime, reservationStart)
  })

  return conflictingReservations.length === 0
}

export async function findAvailableTable(
  restaurantId: string,
  reservationTime: Date,
  partySize: number,
  turnTime: number
): Promise<string | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: true,
      reservations: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    },
  })

  if (!restaurant) return null

  const slotEndTime = addMinutes(reservationTime, turnTime)

  // Use the same logic as the availability calculation
  return findAvailableTableForSlot(
    restaurant.tables,
    restaurant.reservations,
    reservationTime,
    slotEndTime,
    partySize
  )
}
