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
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatTimeWithAmPm } from '@/lib/utils'

interface BookingDialogProps {
  isOpen: boolean
  onClose: () => void
  restaurant: {
    id: string
    name: string
    address: string
    city: string
    state: string
    phone: string
    cancellationPolicy: {
      hoursBeforeNoFee: number | null
      allowOnlineCancellation: boolean
      notes: string | null
    } | null
  }
  reservationDate: string
  reservationTime: string
  partySize: number
}

interface BookingData {
  name: string
  email: string
  phone: string
  notes: string
  autoConfirm: boolean
}

export default function BookingDialog({
  isOpen,
  onClose,
  restaurant,
  reservationDate,
  reservationTime,
  partySize,
}: BookingDialogProps) {
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    autoConfirm: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)

  const reservationDateTime = `${reservationDate}T${reservationTime}:00`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // For demo purposes, we'll use a mock user ID
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
          partySize: partySize,
          notes: bookingData.notes || undefined,
          autoConfirm: bookingData.autoConfirm,
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
      setReservationId(result.reservation.id)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateBookingData = (field: keyof BookingData, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    // Reset form state when closing
    setBookingData({ name: '', email: '', phone: '', notes: '', autoConfirm: true })
    setError(null)
    setSuccess(false)
    setReservationId(null)
    onClose()
  }

  const handleViewReservation = () => {
    if (reservationId) {
      window.open(`/reservations/${reservationId}`, '_blank')
    }
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>
            {success ? 'Reservation Confirmed!' : 'Complete Your Reservation'}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your table is reserved!</h3>
            <p className="text-muted-foreground mb-6">
              Your reservation at <strong>{restaurant.name}</strong> has been confirmed.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(`${reservationDate}T12:00:00`), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatTimeWithAmPm(reservationTime)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {partySize} {partySize === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleViewReservation} className="flex-1">
                View Reservation Details
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reservation Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Reservation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(`${reservationDate}T12:00:00`), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatTimeWithAmPm(reservationTime)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {partySize} {partySize === 1 ? 'person' : 'people'}
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
                className="w-full h-20 px-3 py-2 border border-input rounded-md bg-transparent text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

            {/* Auto-Confirm Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="auto-confirm"
                  checked={bookingData.autoConfirm}
                  onCheckedChange={(checked) =>
                    setBookingData((prev) => ({ ...prev, autoConfirm: checked === true }))
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor="auto-confirm"
                    className="text-sm font-medium text-blue-800 cursor-pointer"
                  >
                    Auto-confirm reservation
                  </label>
                  <p className="text-xs text-blue-600 mt-1">
                    Skip confirmation step and automatically confirm your reservation. No need to
                    pay or email verify. This is for testing purposes. You&apos;ll receive immediate
                    confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                title="Cancel Reservation"
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                title="Confirm Reservation"
                type="submit"
                disabled={loading || !bookingData.name || !bookingData.email || !bookingData.phone}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : bookingData.autoConfirm ? (
                  'Confirm Reservation Instantly'
                ) : (
                  'Confirm Reservation'
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By confirming your reservation, you agree to the restaurant&apos;s terms and
              cancellation policy.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
