import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format time string from 24-hour format (HH:mm) to 12-hour format with AM/PM
 * @param time - Time string in HH:mm format (e.g., "14:30")
 * @returns Formatted time string with AM/PM (e.g., "2:30 PM")
 */
export function formatTimeWithAmPm(time: string): string {
  if (!time || typeof time !== 'string') {
    console.warn('formatTimeWithAmPm received invalid time:', time)
    return 'Invalid time'
  }

  const timeParts = time.split(':')
  if (timeParts.length !== 2) {
    console.warn('formatTimeWithAmPm received unexpected format:', time)
    return time // Return original if not in HH:mm format
  }

  const [hours, minutes] = timeParts.map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    console.warn('formatTimeWithAmPm received non-numeric time parts:', time, { hours, minutes })
    return time // Return original if not valid numbers
  }

  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Get general operating hours display (shows typical hours instead of today-specific)
 * @param operatingHours - Array of operating hours
 * @returns Formatted hours string showing general schedule
 */
export function formatOperatingHours(
  operatingHours: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
  }>
): string {
  if (!operatingHours || operatingHours.length === 0) {
    return 'Hours not available'
  }

  // Group hours by time ranges to show consolidated schedule
  const hoursByRange = new Map<string, number[]>()

  operatingHours.forEach((hours) => {
    // Validate hours object has required properties
    if (!hours || !hours.openTime || !hours.closeTime || typeof hours.dayOfWeek !== 'number') {
      console.warn('Invalid operating hours object:', hours)
      return
    }

    const timeRange = `${formatTimeWithAmPm(hours.openTime)} - ${formatTimeWithAmPm(hours.closeTime)}`
    if (!hoursByRange.has(timeRange)) {
      hoursByRange.set(timeRange, [])
    }
    hoursByRange.get(timeRange)?.push(hours.dayOfWeek)
  })

  // If all days have the same hours, show "Daily"
  if (hoursByRange.size === 1) {
    const [timeRange, days] = Array.from(hoursByRange.entries())[0]
    if (days.length === 7) {
      return `Daily ${timeRange}`
    }
  }

  // For now, show the most common hours or first available
  const [mostCommonRange] = Array.from(hoursByRange.entries())[0]
  return mostCommonRange
}
