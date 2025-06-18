'use client'

import { format } from 'date-fns'
import { AlertCircle, Calendar, Clock, Loader2, MapPin, Phone, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import CancelReservationDialog from '@/components/CancelReservationDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Reservation {
  id: string
  reservationTime: string
  partySize: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes?: string
  turnTimeUsed: number
  user: {
    id: string
    name: string
    email: string
  }
  restaurant: {
    id: string
    name: string
    address: string
    city: string
    state: string
    phone: string
  }
  table: {
    id: string
    name: string
  }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reservations')

      if (!response.ok) {
        throw new Error('Failed to fetch reservations')
      }

      const data = await response.json()
      setReservations(data.reservations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleCancelReservation = (success: boolean) => {
    if (success) {
      fetchReservations() // Refresh the list
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleRetry = () => {
    fetchReservations()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-muted-foreground">Loading reservations...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Reservations</h1>
          <p className="text-muted-foreground">
            Manage and view all restaurant reservations in the system
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">No reservations found</h3>
              <p className="text-muted-foreground">
                There are currently no reservations in the system.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{reservation.restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Table {reservation.table.name}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status.charAt(0) + reservation.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(reservation.reservationTime), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(reservation.reservationTime), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {reservation.partySize}{' '}
                          {reservation.partySize === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{reservation.turnTimeUsed} min duration</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Guest Information</h4>
                          <p className="text-sm text-muted-foreground">
                            <strong>{reservation.user.name}</strong>
                            <br />
                            {reservation.user.email}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Restaurant Details</h4>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              {reservation.restaurant.address}
                              <br />
                              {reservation.restaurant.city}, {reservation.restaurant.state}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {reservation.restaurant.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                      {reservation.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium text-sm mb-2">Special Notes</h4>
                          <p className="text-sm text-muted-foreground">{reservation.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-end space-x-2">
                        {(reservation.status === 'PENDING' ||
                          reservation.status === 'CONFIRMED') && (
                          <CancelReservationDialog
                            reservationId={reservation.id}
                            restaurantName={reservation.restaurant.name}
                            reservationTime={reservation.reservationTime}
                            onCancel={handleCancelReservation}
                            partySize={reservation.partySize}
                            turnTimeUsed={reservation.turnTimeUsed}
                            customerEmail={reservation.user.email}
                            customerName={reservation.user.name}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
