/**
 * @fileoverview CancelReservationDialog Component
 *
 * A reusable confirmation dialog component for canceling restaurant reservations.
 *
 * Features:
 * - Confirmation dialog with warning message
 * - Loading state during cancellation
 * - Error handling and display
 * - Accessible keyboard navigation
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <CancelReservationDialog
 *   reservationId="res-123"
 *   restaurantName="The Gourmet Place"
 *   reservationTime="2024-01-15T19:00:00.000Z"
 *   partySize={4}
 *   turnTimeUsed={120}
 *   customerEmail="john@example.com"
 *   customerName="John Doe"
 *   onCancel={(success) => {
 *     if (success) {
 *       // Handle successful cancellation
 *     }
 *   }}
 *   trigger={<Button variant="destructive">Cancel Reservation</Button>}
 * />
 * ```
 */

'use client'

import { format } from 'date-fns'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface CancelReservationDialogProps {
  /** The ID of the reservation to cancel */
  reservationId: string
  /** The name of the restaurant */
  restaurantName: string
  /** The reservation time in ISO string format */
  reservationTime: string
  /** The party size for the reservation */
  partySize: number
  /** The duration of the reservation in minutes */
  turnTimeUsed: number
  /** The customer's email address */
  customerEmail: string
  /** The customer's name */
  customerName: string
  /** Callback function called after cancellation attempt */
  onCancel: (success: boolean) => void
  /** The trigger element that opens the dialog */
  trigger: ReactNode
  /** Optional custom confirmation message */
  confirmationMessage?: string
}

/**
 * CancelReservationDialog - A confirmation dialog for reservation cancellation
 *
 * This component provides a user-friendly way to cancel reservations with proper
 * confirmation and feedback. It handles the API call to cancel the reservation
 * and provides loading states and error handling.
 */
export default function CancelReservationDialog({
  reservationId,
  restaurantName,
  reservationTime,
  partySize,
  turnTimeUsed,
  customerEmail,
  customerName,
  onCancel,
  trigger,
  confirmationMessage,
}: CancelReservationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel reservation')
      }

      toast.success('Reservation cancelled successfully')
      setIsOpen(false)
      onCancel(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
      onCancel(false)
    } finally {
      setIsLoading(false)
    }
  }

  const reservationStart = new Date(reservationTime)
  const reservationEnd = new Date(reservationStart.getTime() + turnTimeUsed * 60 * 1000)

  const formattedDate = format(reservationStart, 'EEEE, MMMM d, yyyy')
  const formattedStartTime = format(reservationStart, 'h:mm a')
  const formattedEndTime = format(reservationEnd, 'h:mm a')

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[500px] bg-white">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            {confirmationMessage ||
              'Are you sure you want to cancel this reservation? This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="font-medium text-gray-900 text-lg">{restaurantName}</div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Customer</div>
                <div className="text-gray-900">{customerName}</div>
                <div className="text-gray-600">{customerEmail}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Party Size</div>
                <div className="text-gray-900">
                  {partySize} {partySize === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="font-medium text-gray-700 mb-2">Reservation Details</div>
              <div className="text-gray-900 font-medium">{formattedDate}</div>
              <div className="text-gray-600 flex items-center gap-2">
                <span>
                  {formattedStartTime} - {formattedEndTime}
                </span>
                <span className="text-xs text-gray-500">({turnTimeUsed} minutes)</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Please review the restaurant&apos;s cancellation policy. Some restaurants may charge a
            cancellation fee for last-minute cancellations.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isLoading}>
            Keep Reservation
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Reservation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
