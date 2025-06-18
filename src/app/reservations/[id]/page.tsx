'use client'

import { format } from 'date-fns'
import { Calendar, CheckCircle, Clock, MapPin, Phone, Users, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import CancelReservationDialog from '@/components/CancelReservationDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Reservation {
  id: string
  reservationTime: string
  partySize: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
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
    description?: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    email: string
    website?: string
    cuisine: string
    profileImageUrl?: string
    bannerImageUrl?: string
  }
  table: {
    id: string
    name: string
  }
}

interface ReservationPageProps {
  params: Promise<{ id: string }>
}

export default function ReservationPage({ params }: ReservationPageProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/reservations/${resolvedParams.id}`)

        if (!response.ok) {
          throw new Error('Reservation not found')
        }

        const data = await response.json()
        setReservation(data.reservation)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [params])

  const handleCancelReservation = (success: boolean) => {
    if (success && reservation) {
      setReservation({ ...reservation, status: 'CANCELLED' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reservation details...</p>
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reservation Not Found</h3>
          <p className="text-muted-foreground mb-6">
            {error || 'The reservation could not be found.'}
          </p>
          <Link href="/reservations">
            <Button variant="outline">Back to Reservations</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    NO_SHOW: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Reservation Confirmed</CardTitle>
              <p className="text-muted-foreground">Your table has been successfully reserved</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status */}
              <div className="text-center">
                <Badge className={statusColors[reservation.status]}>
                  {reservation.status.charAt(0) + reservation.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              {/* Reservation Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">
                        {format(new Date(reservation.reservationTime), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-muted-foreground">
                        {format(new Date(reservation.reservationTime), 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Party Size</p>
                      <p className="text-muted-foreground">
                        {reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>

                  {reservation.table && (
                    <div className="flex items-center">
                      <div className="h-5 w-5 mr-3 bg-muted-foreground rounded flex items-center justify-center">
                        <span className="text-xs text-white font-bold">T</span>
                      </div>
                      <div>
                        <p className="font-medium">Table</p>
                        <p className="text-muted-foreground">{reservation.table.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {reservation.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium mb-2">Special Requests</p>
                    <p className="text-muted-foreground text-sm">{reservation.notes}</p>
                  </div>
                )}
              </div>

              {/* Restaurant Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Restaurant Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-lg">{reservation.restaurant.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {reservation.restaurant.cuisine.charAt(0) +
                        reservation.restaurant.cuisine.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        {reservation.restaurant.address}
                        <br />
                        {reservation.restaurant.city}, {reservation.restaurant.state}{' '}
                        {reservation.restaurant.zipCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{reservation.restaurant.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Number */}
              <div className="text-center bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
                <p className="font-mono text-lg font-semibold">
                  {reservation.id.slice(-8).toUpperCase()}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Link href="/restaurants" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Book Another Table
                    </Button>
                  </Link>
                  <Link href={`/restaurants/${reservation.restaurant.id}`} className="flex-1">
                    <Button className="w-full">View Restaurant</Button>
                  </Link>
                </div>

                {/* Cancel Reservation */}
                {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                  <div className="border-t pt-4">
                    <CancelReservationDialog
                      reservationId={reservation.id}
                      restaurantName={reservation.restaurant.name}
                      reservationTime={reservation.reservationTime}
                      partySize={reservation.partySize}
                      turnTimeUsed={reservation.turnTimeUsed}
                      customerEmail={reservation.user.email}
                      customerName={reservation.user.name}
                      onCancel={handleCancelReservation}
                      trigger={
                        <Button
                          variant="outline"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel This Reservation
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>

              {/* Important Notes */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Please arrive on time for your reservation. If you need to cancel or modify your
                  booking, please contact the restaurant directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
