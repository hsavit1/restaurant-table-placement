'use client'

import { addMinutes, format, parseISO, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import type { TableReservation, TableUtilizationData, TableWithReservations } from '@/lib/types'
import CancelReservationDialog from './CancelReservationDialog'

interface TableUtilizationProps {
  restaurantId: string
  date: string
  onDateChange?: (date: string) => void
}

/**
 * TableUtilization Component
 *
 * Displays table utilization throughout the day with a time slider.
 * Shows which tables are reserved and by whom at any given time.
 *
 * Features:
 * - Interactive time slider (15-minute increments)
 * - Visual table layout with reservation status
 * - Reservation details on hover/click
 * - Operating hours awareness
 *
 * @param restaurantId - ID of the restaurant
 * @param date - Date to show utilization for (ISO string)
 */
export default function TableUtilization({
  restaurantId,
  date,
  onDateChange,
}: TableUtilizationProps) {
  const [utilizationData, setUtilizationData] = useState<TableUtilizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(720) // 12:00 PM in minutes from midnight
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(parseISO(date))

  // Sync with external date changes
  useEffect(() => {
    setSelectedDate(parseISO(date))
  }, [date])

  // Fetch table utilization data
  const fetchUtilizationData = async () => {
    setLoading(true)
    try {
      const currentDateString = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/restaurants/${restaurantId}/tables?date=${currentDateString}`
      )
      if (response.ok) {
        const data = await response.json()
        setUtilizationData(data)
      }
    } catch (error) {
      console.error('Error fetching table utilization:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUtilizationData()
  }, [restaurantId, selectedDate])

  // Handle reservation cancellation
  const handleReservationCancel = (success: boolean) => {
    if (success) {
      fetchUtilizationData() // Refresh the data
    }
  }

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate)
      const dateString = format(newDate, 'yyyy-MM-dd')
      onDateChange?.(dateString)
    }
  }

  // Convert minutes from midnight to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
  }

  // Get operating hours for the day
  const getOperatingHours = () => {
    if (!utilizationData?.restaurant.operatingHours.length) {
      return { open: 480, close: 1320 } // Default 8 AM to 10 PM
    }

    const hours = utilizationData.restaurant.operatingHours[0]
    const [openHour, openMin] = hours.openTime.split(':').map(Number)
    const [closeHour, closeMin] = hours.closeTime.split(':').map(Number)

    return {
      open: openHour * 60 + openMin,
      close: closeHour * 60 + closeMin,
    }
  }

  // Check if a table is reserved at the current time
  const isTableReserved = (table: TableWithReservations): TableReservation | null => {
    const currentDateTime = addMinutes(startOfDay(selectedDate), currentTime)

    for (const reservation of table.reservations) {
      const reservationStart = new Date(reservation.reservationTime)
      const reservationEnd = addMinutes(reservationStart, reservation.turnTimeUsed)

      if (currentDateTime >= reservationStart && currentDateTime < reservationEnd) {
        return reservation
      }
    }

    return null
  }

  // Get table status and styling
  const getTableStatus = (table: TableWithReservations) => {
    const reservation = isTableReserved(table)

    if (reservation) {
      return {
        status: 'reserved',
        className: 'bg-red-100 border-red-300 text-red-800',
        reservation,
      }
    }

    return {
      status: 'available',
      className: 'bg-green-100 border-green-300 text-green-800',
      reservation: null,
    }
  }

  const operatingHours = getOperatingHours()
  const sliderMin = operatingHours.open
  const sliderMax = operatingHours.close

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Table Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!utilizationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Table Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load table utilization data.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Table Utilization
        </CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {minutesToTime(currentTime)}
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[200px] justify-start text-left font-normal bg-white hover:bg-gray-50"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>{selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border shadow-lg" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="bg-white rounded-md"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Use the time slider below to see table reservations throughout
            the day. Hover over tables to see reservation details instantly!
          </p>
        </div>

        {/* Time Slider */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-gray-600 flex-shrink-0">{minutesToTime(sliderMin)}</span>
            <span className="text-lg font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full mx-2">
              {minutesToTime(currentTime)}
            </span>
            <span className="text-gray-600 flex-shrink-0">{minutesToTime(sliderMax)}</span>
          </div>
          <div className="px-2 py-3">
            <div className="relative h-8 flex items-center">
              {/* Custom slider track */}
              <div className="w-full h-2 bg-gray-300 rounded-full relative overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                  style={{
                    width: `${((currentTime - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
                  }}
                />
              </div>
              {/* Radix slider (functional) */}
              <Slider                  
                value={[currentTime]}
                onValueChange={(value) => setCurrentTime(value[0])}
                min={sliderMin}
                max={sliderMax}
                step={15} // 15-minute increments
                
                className="absolute inset-0 w-full [&>span[data-slider-track]]:h-2 [&>span[data-slider-track]]:bg-transparent [&>span[data-slider-range]]:bg-transparent [&>span[data-slider-thumb]]:w-5 [&>span[data-slider-thumb]]:h-5 [&>span[data-slider-thumb]]:bg-blue-600 [&>span[data-slider-thumb]]:border-2 [&>span[data-slider-thumb]]:border-white [&>span[data-slider-thumb]]:shadow-lg"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">
              📍 Drag to view reservations at different times
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Reserved</span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {utilizationData.restaurant.tables.map((table) => {
            const { className, reservation } = getTableStatus(table)
            const isHovered = hoveredTable === table.id

            return (
              <div key={table.id} className="relative">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${className} ${
                    selectedTable === table.id ? 'ring-2 ring-blue-500' : ''
                  } ${isHovered ? 'z-10' : ''}`}
                  title={
                    reservation
                      ? `Click to cancel reservation for ${reservation.user.name || 'Guest'}`
                      : 'Available table'
                  }
                  onClick={() => {
                    // If table is reserved, open cancel dialog
                    if (reservation) {
                      const button = document.getElementById(`cancel-trigger-${reservation.id}`)
                      if (button) {
                        button.click()
                      }
                    } else {
                      // Otherwise, just toggle selection
                      setSelectedTable(selectedTable === table.id ? null : table.id)
                    }
                  }}
                  onMouseEnter={() => setHoveredTable(table.id)}
                  onMouseLeave={() => setHoveredTable(null)}
                >
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-sm truncate">{table.name}</h3>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {table.capacityMin}-{table.capacityMax}
                        </span>
                      </div>

                      {reservation ? (
                        <div className="space-y-1 min-h-0">
                          <Badge variant="secondary" className="text-xs truncate max-w-full">
                            {reservation.user.name || 'Guest'}
                          </Badge>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="truncate">Party of {reservation.partySize}</div>
                            <div className="text-xs leading-tight">
                              {format(new Date(reservation.reservationTime), 'h:mm a')} -{' '}
                              {format(
                                addMinutes(
                                  new Date(reservation.reservationTime),
                                  reservation.turnTimeUsed
                                ),
                                'h:mm a'
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-white bg-red-600 bg-opacity-80 rounded px-2 py-1 text-center mt-2">
                            Click to cancel
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-green-700 text-center py-1">Available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20 w-64 max-w-sm">
                    <Card className="bg-gray-900 text-white border-gray-700 shadow-xl">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">
                            {table.name} - Reservations Today
                          </h4>

                          {table.reservations.length === 0 ? (
                            <p className="text-xs text-gray-300">No reservations for today</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {table.reservations.map((res) => {
                                const isCurrentReservation = res === reservation
                                return (
                                  <div
                                    key={res.id}
                                    className={`p-2 rounded text-xs ${
                                      isCurrentReservation
                                        ? 'bg-red-800 bg-opacity-50 border border-red-600'
                                        : 'bg-gray-800 bg-opacity-50'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium">
                                          {res.user.name || 'Guest'}
                                        </div>
                                        <div className="text-gray-300">
                                          Party of {res.partySize}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium">
                                          {format(new Date(res.reservationTime), 'h:mm a')}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          {res.turnTimeUsed} min
                                        </div>
                                      </div>
                                    </div>
                                    {isCurrentReservation && (
                                      <div className="mt-1 text-xs text-red-300">
                                        Currently dining
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Tooltip Arrow */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Reservation Details Panel */}
        {selectedTable && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              {(() => {
                const table = utilizationData.restaurant.tables.find((t) => t.id === selectedTable)
                if (!table) return null

                const reservation = isTableReserved(table)

                return (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      {/* <Calendar className="h-4 w-4" /> */}
                      {table.name} - Reservations Today
                    </h4>

                    {table.reservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No reservations for today</p>
                    ) : (
                      <div className="space-y-2">
                        {table.reservations.map((res) => (
                          <div
                            key={res.id}
                            className={`p-2 rounded border text-sm ${
                              res === reservation
                                ? 'bg-red-100 border-red-300'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{res.user.name || 'Guest'}</div>
                                <div className="text-muted-foreground">
                                  Party of {res.partySize}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {format(new Date(res.reservationTime), 'h:mm a')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {res.turnTimeUsed} min
                                </div>
                              </div>
                            </div>
                            {res.notes && (
                              <div className="mt-1 text-xs text-muted-foreground italic">
                                &ldquo;{res.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </CardContent>

      {/* Cancel Reservation Dialogs - One for each reservation */}
      {utilizationData.restaurant.tables.map((table) =>
        table.reservations.map((reservation) => (
          <CancelReservationDialog
            key={`cancel-dialog-${reservation.id}`}
            reservationId={reservation.id}
            restaurantName={utilizationData.restaurant.name}
            reservationTime={
              typeof reservation.reservationTime === 'string'
                ? reservation.reservationTime
                : reservation.reservationTime.toISOString()
            }
            partySize={reservation.partySize}
            turnTimeUsed={reservation.turnTimeUsed}
            customerEmail={reservation.user.email}
            customerName={reservation.user.name || 'Guest'}
            onCancel={handleReservationCancel}
            trigger={
              <button
                id={`cancel-trigger-${reservation.id}`}
                style={{ display: 'none' }}
                aria-hidden="true"
              />
            }
          />
        ))
      )}
    </Card>
  )
}
