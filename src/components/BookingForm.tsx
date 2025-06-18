'use client'

import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTimeWithAmPm } from '@/lib/utils'

interface BookingFormProps {
  restaurant: {
    id: string
    name: string
    address: string
    city: string
    state: string
    phone: string
    tables: Array<{
      id: string
      name: string
      capacityMin: number
      capacityMax: number
    }>
    turnTimeRules: Array<{
      partySizeMin: number
      partySizeMax: number
      turnTimeInMinutes: number
    }>
    cancellationPolicy: {
      hoursBeforeNoFee: number | null
      allowOnlineCancellation: boolean
      notes: string | null
    } | null
  }
  initialDate: string
  initialTime: string
  initialPartySize: number
}

interface BookingData {
  name: string
  email: string
  phone: string
  notes: string
}

export default function BookingForm({
  restaurant,
  initialDate,
  initialTime,
  initialPartySize,
}: BookingFormProps) {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const reservationDateTime = `${initialDate}T${initialTime}:00`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // For demo purposes, we'll use a mock user ID
      // In a real app, this would come from authentication
      const mockUserId = 'user_demo_123'

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId,
          restaurantId: restaurant.id,
          reservationTime: reservationDateTime,
          partySize: initialPartySize,
          notes: bookingData.notes || undefined,
          // Include guest information in notes for demo
          guestInfo: {
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      const result = await response.json()
      setSuccess(true)

      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        router.push(`/reservations/${result.reservation.id}`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingData = (field: keyof BookingData, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Reservation Confirmed!</h2>
          <p className="text-muted-foreground mb-4">
            Your table has been reserved at {restaurant.name}
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to confirmation page...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Reservation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reservation Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Your Reservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{format(new Date(initialDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatTimeWithAmPm(initialTime)}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {initialPartySize} {initialPartySize === 1 ? 'person' : 'people'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>{restaurant.name}</strong>
                <br />
                {restaurant.address}, {restaurant.city}, {restaurant.state}
              </p>
            </div>
          </div>

          {/* Guest Information */}
          <div>
            <h3 className="font-semibold mb-4">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={bookingData.name}
                  onChange={(e) => updateBookingData('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => updateBookingData('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  value={bookingData.phone}
                  onChange={(e) => updateBookingData('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Special Requests (Optional)
            </label>
            <textarea
              value={bookingData.notes}
              onChange={(e) => updateBookingData('notes', e.target.value)}
              placeholder="Any special requests, dietary restrictions, or celebrations?"
              className="w-full h-24 px-3 py-2 border border-input rounded-md bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Policies */}
          {restaurant.cancellationPolicy && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Cancellation Policy</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {restaurant.cancellationPolicy.hoursBeforeNoFee && (
                      <p>
                        Free cancellation up to {restaurant.cancellationPolicy.hoursBeforeNoFee}{' '}
                        hours before your reservation.
                      </p>
                    )}
                    {restaurant.cancellationPolicy.notes && (
                      <p>{restaurant.cancellationPolicy.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !bookingData.name || !bookingData.email || !bookingData.phone}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirming Reservation...
              </>
            ) : (
              'Confirm Reservation'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By confirming your reservation, you agree to the restaurant&apos;s terms and
            cancellation policy.
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
