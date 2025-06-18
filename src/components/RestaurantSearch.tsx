'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SearchFilters {
  location?: string
  cuisine?: string
  date?: string
  partySize?: number
}

interface RestaurantSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

const cuisineOptions = [
  'AMERICAN',
  'ITALIAN',
  'MEXICAN',
  'CHINESE',
  'JAPANESE',
  'FRENCH',
  'INDIAN',
  'THAI',
  'GREEK',
  'SPANISH',
  'OTHER',
]

export default function RestaurantSearch({ onSearch, initialFilters = {} }: RestaurantSearchProps) {
  const [location, setLocation] = useState(initialFilters.location || '')
  const [cuisine, setCuisine] = useState(initialFilters.cuisine || '')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (initialFilters.date) {
      return new Date(`${initialFilters.date}T12:00:00`)
    }
    const todayString = new Date().toISOString().split('T')[0]
    return new Date(`${todayString}T12:00:00`)
  })
  const [partySize, setPartySize] = useState(initialFilters.partySize || 2)

  const handleSearch = () => {
    onSearch({
      location: location.trim() || undefined,
      cuisine: cuisine || undefined,
      date: selectedDate?.toISOString().split('T')[0] || undefined,
      partySize: partySize,
    })
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    // Trigger search immediately when date changes
    onSearch({
      location: location.trim() || undefined,
      cuisine: cuisine || undefined,
      date: date?.toISOString().split('T')[0] || undefined,
      partySize: partySize,
    })
  }

  const handlePartySizeChangeAndSearch = (newSize: number) => {
    if (newSize >= 1 && newSize <= 20) {
      setPartySize(newSize)
      // Trigger search immediately when party size changes
      onSearch({
        location: location.trim() || undefined,
        cuisine: cuisine || undefined,
        date: selectedDate?.toISOString().split('T')[0] || undefined,
        partySize: newSize,
      })
    }
  }

  const handleCuisineSelect = (selectedCuisine: string) => {
    const newCuisine = selectedCuisine === cuisine ? '' : selectedCuisine
    setCuisine(newCuisine)
    // Trigger search immediately when cuisine changes
    onSearch({
      location: location.trim() || undefined,
      cuisine: newCuisine || undefined,
      date: selectedDate?.toISOString().split('T')[0] || undefined,
      partySize: partySize,
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Find Your Perfect Table</h2>
            <p className="text-muted-foreground">
              Search restaurants by location, cuisine, and availability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </label>
              <Input
                placeholder="City, neighborhood..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border shadow-md" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                💡 Try tomorrow or next few days to see sample reservations
              </p>
            </div>

            {/* Party Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Party Size
              </label>
              <Select
                value={partySize.toString()}
                onValueChange={(value) => handlePartySizeChangeAndSearch(parseInt(value))}
              >
                <SelectTrigger className="w-full bg-white">
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

            {/* Search Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">Search</label>
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Cuisine Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cuisine Type</label>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((cuisineOption) => (
                <Badge
                  key={cuisineOption}
                  variant={cuisine === cuisineOption ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleCuisineSelect(cuisineOption)}
                >
                  {cuisineOption.charAt(0) + cuisineOption.slice(1).toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Search filters:</span>
              <div className="flex items-center space-x-4">
                {location && <span>📍 {location}</span>}
                {cuisine && <span>🍽️ {cuisine}</span>}
                <span>📅 {selectedDate?.toLocaleDateString() || 'No date selected'}</span>
                <span>
                  👥 {partySize} {partySize === 1 ? 'person' : 'people'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
