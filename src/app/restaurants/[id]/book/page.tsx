import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import BookingForm from '@/components/BookingForm'
import { prisma } from '@/lib/prisma'

interface BookingPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string; time?: string; partySize?: string }>
}

async function getRestaurant(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: true,
      turnTimeRules: {
        orderBy: { partySizeMin: 'asc' },
      },
      cancellationPolicy: true,
    },
  })

  return restaurant
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { id } = await params
  const { date, time, partySize } = await searchParams

  const restaurant = await getRestaurant(id)

  if (!restaurant) {
    notFound()
  }

  const bookingDate = date || new Date().toISOString().split('T')[0]
  const bookingTime = time || '19:00'
  const bookingPartySize = partySize ? parseInt(partySize) : 2

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Complete Your Reservation</h1>
            <p className="text-muted-foreground">
              You&apos;re booking a table at {restaurant.name}
            </p>
          </div>

          <Suspense fallback={<BookingFormSkeleton />}>
            <BookingForm
              restaurant={restaurant}
              initialDate={bookingDate}
              initialTime={bookingTime}
              initialPartySize={bookingPartySize}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function BookingFormSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
      <div className="space-y-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div>
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div>
          <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>

        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}
