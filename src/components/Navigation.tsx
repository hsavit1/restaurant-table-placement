'use client'

import { ChefHat } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Dorsia</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Home
            </Link>
            <Link
              href="/reservations"
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === '/reservations' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Reservations
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
