import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RestaurantDetails from '@/components/RestaurantDetails'
import { prisma } from '@/lib/prisma'

interface RestaurantPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string; partySize?: string }>
}

async function getRestaurant(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: { name: 'asc' },
      },
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
      turnTimeRules: {
        orderBy: { partySizeMin: 'asc' },
      },
      cancellationPolicy: true,
    },
  })

  return restaurant
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const { id } = await params
  const { date, partySize } = await searchParams

  const restaurant = await getRestaurant(id)

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<RestaurantDetailsSkeleton />}>
          <RestaurantDetails
            restaurant={restaurant}
            searchDate={date}
            partySize={partySize ? parseInt(partySize) : 2}
          />
        </Suspense>
      </div>
    </div>
  )
}

function RestaurantDetailsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        {/* Header */}
        <div className="relative h-64 bg-gray-200"></div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>

              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
