import type { Cuisine, ReservationStatus } from '@prisma/client'

export interface Restaurant {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  website: string | null
  cuisine: Cuisine
  profileImageUrl: string | null
  bannerImageUrl: string | null
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Table {
  id: string
  restaurantId: string
  name: string
  capacityMin: number
  capacityMax: number
  isJoinable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  name: string | null
  email: string
}

export interface Reservation {
  id: string
  userId: string
  restaurantId: string
  tableId: string | null
  reservationTime: Date
  partySize: number
  status: ReservationStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
  turnTimeUsed: number
  restaurant?: Restaurant
  table?: Table
  user?: User
}

// Table utilization specific types
export interface TableReservation {
  id: string
  reservationTime: Date
  partySize: number
  status: ReservationStatus
  notes: string | null
  turnTimeUsed: number
  user: {
    name: string | null
    email: string
  }
}

export interface TableWithReservations {
  id: string
  name: string
  capacityMin: number
  capacityMax: number
  isJoinable: boolean
  reservations: TableReservation[]
}

export interface TableUtilizationData {
  restaurant: {
    id: string
    name: string
    operatingHours: OperatingHours[]
    tables: TableWithReservations[]
  }
}

export interface AvailabilitySlot {
  time: string
  available: boolean
  tableId?: string
}

export interface OperatingHours {
  id: string
  restaurantId: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  turnTime: number | null
}

export interface RestaurantWithAvailability extends Restaurant {
  availability: {
    hasAvailability: boolean
    availableSlots: AvailabilitySlot[]
  }
  tables: Table[]
  operatingHours: OperatingHours[]
}

export interface SearchFilters {
  query?: string
  city?: string
  cuisine?: Cuisine
  date: string
  time: string
  partySize: number
}

export interface CreateReservationData {
  restaurantId: string
  tableId?: string
  reservationTime: string
  partySize: number
  notes?: string
}
