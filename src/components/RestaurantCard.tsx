'use client'

import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RestaurantWithAvailability } from '@/lib/types'
import { formatOperatingHours, formatTimeWithAmPm } from '@/lib/utils'
import BookingDialog from './BookingDialog'

interface RestaurantCardProps {
  restaurant: RestaurantWithAvailability
  searchDate: string
  partySize: number
}

const cuisineColors = {
  ITALIAN: 'bg-red-100 text-red-800',
  MEXICAN: 'bg-orange-100 text-orange-800',
  CHINESE: 'bg-yellow-100 text-yellow-800',
  INDIAN: 'bg-purple-100 text-purple-800',
  FRENCH: 'bg-blue-100 text-blue-800',
  JAPANESE: 'bg-pink-100 text-pink-800',
  THAI: 'bg-green-100 text-green-800',
  GREEK: 'bg-cyan-100 text-cyan-800',
  SPANISH: 'bg-amber-100 text-amber-800',
  AMERICAN: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-neutral-100 text-neutral-800',
}

export default function RestaurantCard({
  restaurant,
  searchDate,
  partySize: initialPartySize,
}: RestaurantCardProps) {
  const [currentPartySize, setCurrentPartySize] = useState(initialPartySize)
  const [availability, setAvailability] = useState(restaurant.availability?.availableSlots || [])
  const [loading, setLoading] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>('')

  const availableSlots = availability.filter((slot) => slot.available)
  const hasAvailability = availableSlots.length > 0

  const fetchAvailability = useCallback(
    async (partySize: number) => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/restaurants/${restaurant.id}?date=${searchDate}&partySize=${partySize}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailability(data.restaurant.availability?.availableSlots || [])
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    },
    [restaurant.id, searchDate]
  )

  useEffect(() => {
    if (currentPartySize !== initialPartySize) {
      fetchAvailability(currentPartySize)
    }
  }, [currentPartySize, initialPartySize, fetchAvailability])

  const handlePartySizeChange = (value: string) => {
    setCurrentPartySize(parseInt(value))
  }

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time)
    setShowBookingDialog(true)
  }

  const handleBookNow = () => {
    // Use the first available time slot for "Book Now"
    if (availableSlots.length > 0) {
      setSelectedTime(availableSlots[0].time)
      setShowBookingDialog(true)
    }
  }

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{restaurant.name}</CardTitle>
              <Badge className={cuisineColors[restaurant.cuisine] || cuisineColors.OTHER}>
                {restaurant.cuisine.charAt(0) + restaurant.cuisine.slice(1).toLowerCase()}
              </Badge>
            </div>
            {restaurant.profileImageUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden ml-4">
                <img
                  src={restaurant.profileImageUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-4">
          {restaurant.description && (
            <p className="text-muted-foreground mb-4 line-clamp-2">{restaurant.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {restaurant.address}, {restaurant.city}, {restaurant.state}
              </span>
            </div>

            <div className="flex items-center text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{restaurant.phone}</span>
            </div>

            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatOperatingHours(restaurant.operatingHours || [])}</span>
            </div>
          </div>

          {/* Party Size Selector */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Party Size</span>
              </div>
              <Select value={currentPartySize.toString()} onValueChange={handlePartySizeChange}>
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(`${searchDate}T00:00:00`), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Availability Section */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Available Times</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {loading
                  ? 'Loading...'
                  : `${availableSlots.length} of ${availability.length} slots available`}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            ) : availability.length > 0 ? (
              <div>
                <div className="grid grid-cols-4 gap-1 mb-2 max-h-32 overflow-y-auto">
                  {availability.map((slot, index) =>
                    slot.available ? (
                      <button
                        title="Book Now"
                        key={index}
                        onClick={() => handleTimeSlotClick(slot.time)}
                        className="text-xs justify-center bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 cursor-pointer transition-colors w-full py-1 px-2 rounded"
                      >
                        {formatTimeWithAmPm(slot.time)}
                      </button>
                    ) : (
                      <div
                        key={index}
                        title="Unavailable"
                        className="text-xs justify-center bg-gray-100 text-gray-400 border border-gray-200 opacity-60 cursor-not-allowed w-full py-1 px-2 rounded text-center"
                      >
                        {formatTimeWithAmPm(slot.time)}
                      </div>
                    )
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-100 border border-green-200 rounded mr-1"></div>
                    <span className="text-muted-foreground">Available (click to book)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded mr-1"></div>
                    <span className="text-muted-foreground">Unavailable</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <span className="text-sm">No time slots available for this date</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            <Link
              href={`/restaurants/${restaurant.id}?date=${searchDate}&partySize=${currentPartySize}`}
              className="flex-1"
            >
              <Button
                title="View Restaurant"
                variant="default"
                className="w-full hover:bg-blue-200 cursor-pointer"
              >
                View Restaurant
              </Button>
            </Link>
            {hasAvailability && (
              <Button
                title="Book Now"
                onClick={handleBookNow}
                className="flex-1 hover:bg-blue-200 cursor-pointer"
              >
                Book Now
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <BookingDialog
        isOpen={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          phone: restaurant.phone,
          cancellationPolicy: null,
        }}
        reservationDate={searchDate}
        reservationTime={selectedTime}
        partySize={currentPartySize}
      />
    </>
  )
}
