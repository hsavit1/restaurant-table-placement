'use client'

import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChefHat,
  Clock,
  CreditCard,
  Globe,
  MapPin,
  Phone,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AvailabilitySlot } from '@/lib/types'
import { formatTimeWithAmPm } from '@/lib/utils'
import BookingDialog from './BookingDialog'
import TableUtilization from './TableUtilization'

interface RestaurantDetailsProps {
  restaurant: {
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
    cuisine: string
    profileImageUrl: string | null
    bannerImageUrl: string | null
    tables: Array<{
      id: string
      name: string
      capacityMin: number
      capacityMax: number
      isJoinable: boolean
    }>
    operatingHours: Array<{
      dayOfWeek: number
      openTime: string
      closeTime: string
    }>
    turnTimeRules: Array<{
      partySizeMin: number
      partySizeMax: number
      turnTimeInMinutes: number
    }>
    cancellationPolicy: {
      hoursBeforeNoFee: number | null
      feePercentage: number | null
      fixedFeeAmount: number | null
      allowOnlineCancellation: boolean
      notes: string | null
    } | null
  }
  searchDate?: string
  partySize: number
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function RestaurantDetails({
  restaurant,
  searchDate,
  partySize: initialPartySize,
}: RestaurantDetailsProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [date, setDate] = useState<Date>(() => {
    if (searchDate) {
      return new Date(`${searchDate}T12:00:00`)
    }
    // Create today's date using the same method as the main page
    const todayString = new Date().toISOString().split('T')[0]
    return new Date(`${todayString}T12:00:00`)
  })
  const [currentPartySize, setCurrentPartySize] = useState(initialPartySize)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>('')

  const fetchAvailability = useCallback(
    async (dateObj: Date, partySize: number) => {
      setLoadingAvailability(true)
      try {
        const dateString = format(dateObj, 'yyyy-MM-dd')
        const response = await fetch(
          `/api/restaurants/${restaurant.id}?date=${dateString}&partySize=${partySize}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailability(data.restaurant.availability?.availableSlots || [])
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoadingAvailability(false)
      }
    },
    [restaurant.id]
  )

  useEffect(() => {
    fetchAvailability(date, currentPartySize)
  }, [date, currentPartySize, fetchAvailability])

  const availableSlots = availability.filter((slot) => slot.available)

  // Check individual tables first
  const suitableIndividualTables = restaurant.tables.filter(
    (table) => table.capacityMin <= currentPartySize && table.capacityMax >= currentPartySize
  )

  // Check if table joining can accommodate the party
  const canJoinTables = (() => {
    const joinableTables = restaurant.tables.filter((table) => table.isJoinable)

    // Try all possible combinations of 2 joinable tables
    for (let i = 0; i < joinableTables.length; i++) {
      for (let j = i + 1; j < joinableTables.length; j++) {
        const table1 = joinableTables[i]
        const table2 = joinableTables[j]

        const minCombinedCapacity = table1.capacityMin + table2.capacityMin
        const maxCombinedCapacity = table1.capacityMax + table2.capacityMax

        if (minCombinedCapacity <= currentPartySize && currentPartySize <= maxCombinedCapacity) {
          return true
        }
      }
    }
    return false
  })()

  // For display purposes, show if we have availability either through individual tables or joining
  const hasTableCapacity = suitableIndividualTables.length > 0 || canJoinTables

  const handlePartySizeChange = (newSize: number) => {
    if (newSize >= 1 && newSize <= 20) {
      setCurrentPartySize(newSize)
    }
  }

  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
    }
  }

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time)
    setShowBookingDialog(true)
  }

  const handleBookTable = () => {
    // Use the first available time slot for general booking
    if (availableSlots.length > 0) {
      setSelectedTime(availableSlots[0].time)
      setShowBookingDialog(true)
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden">
          {/* Hero Section */}
          <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
            {restaurant.bannerImageUrl ? (
              <img
                src={restaurant.bannerImageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <ChefHat className="h-16 w-16 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <Badge className="bg-white text-black">
                {restaurant.cuisine.charAt(0) + restaurant.cuisine.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {restaurant.description && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">About</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {restaurant.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Contact & Location</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{restaurant.address}</p>
                          <p className="text-muted-foreground">
                            {restaurant.city}, {restaurant.state} {restaurant.zipCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                        <p>{restaurant.phone}</p>
                      </div>
                      {restaurant.website && (
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
                          <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Hours</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {restaurant.operatingHours.map((hours) => (
                      <div key={hours.dayOfWeek} className="flex justify-between py-2">
                        <span className="font-medium">{dayNames[hours.dayOfWeek]}</span>
                        <span className="text-muted-foreground">
                          {formatTimeWithAmPm(hours.openTime)} -{' '}
                          {formatTimeWithAmPm(hours.closeTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Layout */}
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Table Layout</h2>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Current party size: {currentPartySize}</strong> - Tables highlighted
                      in green can accommodate your party.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {restaurant.tables.map((table) => (
                      <div
                        key={table.id}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          (
                            table.capacityMin <= currentPartySize &&
                              table.capacityMax >= currentPartySize
                          ) || (canJoinTables && table.isJoinable)
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold">{table.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {table.capacityMin === table.capacityMax
                              ? `${table.capacityMin} seats`
                              : `${table.capacityMin}-${table.capacityMax} seats`}
                          </p>
                          {table.isJoinable && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Joinable
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="inline-block w-3 h-3 bg-green-200 rounded mr-2"></span>
                    Tables suitable for party of {currentPartySize} (
                    {hasTableCapacity
                      ? suitableIndividualTables.length > 0
                        ? suitableIndividualTables.length
                        : 'via joining'
                      : '0'}{' '}
                    available)
                  </p>
                </div>

                {/* Policies */}
                {restaurant.cancellationPolicy && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Cancellation Policy</h2>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                        <div className="space-y-2">
                          {restaurant.cancellationPolicy.hoursBeforeNoFee && (
                            <p>
                              Free cancellation up to{' '}
                              {restaurant.cancellationPolicy.hoursBeforeNoFee} hours before your
                              reservation.
                            </p>
                          )}
                          {restaurant.cancellationPolicy.feePercentage && (
                            <p>
                              Cancellation fee: {restaurant.cancellationPolicy.feePercentage}% of
                              total bill
                            </p>
                          )}
                          {restaurant.cancellationPolicy.fixedFeeAmount && (
                            <p>Cancellation fee: ${restaurant.cancellationPolicy.fixedFeeAmount}</p>
                          )}
                          {restaurant.cancellationPolicy.notes && (
                            <p className="text-sm">{restaurant.cancellationPolicy.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Utilization with Fixed Styling */}
                <div className="w-full">
                  <TableUtilization
                    restaurantId={restaurant.id}
                    date={format(date, 'yyyy-MM-dd')}
                    onDateChange={(dateString) => setDate(new Date(dateString))}
                  />
                </div>

                {/* Operating Hours Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today&apos;s Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const todayDayOfWeek = date.getDay()
                      const todayHours = restaurant.operatingHours.find(
                        (oh) => oh.dayOfWeek === todayDayOfWeek
                      )

                      if (!todayHours) {
                        return <p className="text-sm text-muted-foreground">Closed today</p>
                      }

                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(':').map(Number)
                        const period = hours >= 12 ? 'PM' : 'AM'
                        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
                      }

                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatTime(todayHours.openTime)} - {formatTime(todayHours.closeTime)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {format(date, 'EEEE')}
                          </Badge>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Reservation Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {/* <Calendar className="h-5 w-5 mr-2" /> */}
                      Check Availability & Book
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10 bg-white hover:bg-gray-50"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>{format(date, 'PPP')}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-white border shadow-lg"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleCalendarSelect}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="bg-white rounded-md"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Party Size Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Party Size</label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Number of guests</span>
                        </div>
                        <Select
                          value={currentPartySize.toString()}
                          onValueChange={(value) => handlePartySizeChange(parseInt(value))}
                        >
                          <SelectTrigger className="w-[120px] bg-white">
                            <SelectValue placeholder="Select party size" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size} {size === 1 ? 'person' : 'people'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Availability Display */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Available times for {format(date, 'MMM d, yyyy')}
                        </p>
                        {!hasTableCapacity && (
                          <Badge variant="destructive" className="text-xs">
                            No suitable tables
                          </Badge>
                        )}
                      </div>

                      {loadingAvailability ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Checking availability...
                          </p>
                        </div>
                      ) : !hasTableCapacity ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                          <p className="text-sm text-orange-600 font-medium">
                            No tables available for {currentPartySize} guests
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your party size or selecting a different date
                          </p>
                        </div>
                      ) : availability.length > 0 ? (
                        <div>
                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-3 flex justify-between">
                              <span>
                                {availableSlots.length} of {availability.length} slots available
                              </span>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-100 border border-green-200 rounded mr-1"></div>
                                  <span>Available (click to book)</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded mr-1"></div>
                                  <span>Unavailable</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
                              {availability.map((slot, index) =>
                                slot.available ? (
                                  <button
                                    key={index}
                                    onClick={() => handleTimeSlotClick(slot.time)}
                                    className="w-full text-xs bg-green-50 border border-green-200 text-green-800 hover:bg-green-100 hover:border-green-300 transition-colors py-1 px-2 rounded"
                                  >
                                    {formatTimeWithAmPm(slot.time)}
                                  </button>
                                ) : (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="w-full text-xs bg-gray-50 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                                  >
                                    {formatTimeWithAmPm(slot.time)}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                          {availableSlots.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <Button onClick={handleBookTable} className="w-full">
                                Book Table for {currentPartySize}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm text-red-600 font-medium">No available times</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try selecting a different date
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <ChefHat className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">{restaurant.cuisine} Cuisine</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">{restaurant.tables.length} Tables Total</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-3 bg-green-200 rounded"></div>
                      <span className="text-sm">
                        {hasTableCapacity
                          ? (() => {
                              const individualCount = suitableIndividualTables.length
                              const joiningCount = canJoinTables ? 1 : 0
                              const totalOptions = individualCount + joiningCount

                              if (totalOptions === 0)
                                return `0 tables available for ${currentPartySize} guests`

                              if (individualCount > 0 && joiningCount > 0) {
                                return `${totalOptions} tables available for ${currentPartySize} guests (${joiningCount} via joining)`
                              } else if (individualCount > 0) {
                                return `${individualCount} table${individualCount === 1 ? '' : 's'} available for ${currentPartySize} guests`
                              } else {
                                return `1 table available for ${currentPartySize} guests (via joining)`
                              }
                            })()
                          : `0 tables available for ${currentPartySize} guests`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">
                        {restaurant.cancellationPolicy?.allowOnlineCancellation
                          ? 'Online cancellation available'
                          : 'Call to cancel'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
          cancellationPolicy: restaurant.cancellationPolicy,
        }}
        reservationDate={format(date, 'yyyy-MM-dd')}
        reservationTime={selectedTime}
        partySize={currentPartySize}
      />
    </>
  )
}
