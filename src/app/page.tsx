'use client'

import { AlertCircle, ChefHat, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import RestaurantCard from '@/components/RestaurantCard'
import RestaurantSearch from '@/components/RestaurantSearch'
import { Button } from '@/components/ui/button'
import type { RestaurantWithAvailability } from '@/lib/types'

interface SearchFilters {
  location?: string
  cuisine?: string
  date?: string
  partySize?: number
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<RestaurantWithAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    date: new Date().toISOString().split('T')[0],
    partySize: 2,
  })

  const fetchRestaurants = useCallback(async (filters: SearchFilters) => {
    setLoading(true)
    setError(null)
    setCurrentFilters(filters)

    try {
      const params = new URLSearchParams()

      if (filters.location) params.set('city', filters.location)
      if (filters.cuisine) params.set('cuisine', filters.cuisine)
      if (filters.date) params.set('date', filters.date)
      if (filters.partySize) params.set('partySize', filters.partySize.toString())

      const response = await fetch(`/api/restaurants?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }

      const data = await response.json()
      setRestaurants(data.restaurants || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load restaurants on component mount
  useEffect(() => {
    fetchRestaurants(currentFilters)
  }, []) // Only run on mount

  const handleRetry = () => {
    fetchRestaurants(currentFilters)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <ChefHat className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Mini Dorsia</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover exceptional restaurants and book your perfect table in seconds. Experience fine
            dining like never before.
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <RestaurantSearch onSearch={fetchRestaurants} initialFilters={currentFilters} />
        </div>
      </div>

      {/* Restaurant Results */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-muted-foreground">Loading restaurants...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRetry} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && restaurants.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or exploring different locations and cuisines.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Try a broader location search</p>
                  <p>• Remove cuisine filters</p>
                  <p>• Check a different date</p>
                  <p>• Adjust your party size</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && restaurants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {currentFilters.location || currentFilters.cuisine
                    ? `${restaurants.length} Restaurant${restaurants.length !== 1 ? 's' : ''} Found`
                    : `Featured Restaurants`}
                </h2>
                <p className="text-muted-foreground">
                  Showing availability for {currentFilters.partySize}{' '}
                  {currentFilters.partySize === 1 ? 'person' : 'people'}
                  {currentFilters.date &&
                    ` on ${new Date(`${currentFilters.date}T12:00:00`).toLocaleDateString()}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    searchDate={currentFilters.date || new Date().toISOString().split('T')[0]}
                    partySize={currentFilters.partySize || 2}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Mini Dorsia</h3>
            <p className="text-gray-400 mb-4">Your gateway to exceptional dining experiences</p>
            <p className="text-sm text-gray-500">© 2025 Mini Dorsia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
