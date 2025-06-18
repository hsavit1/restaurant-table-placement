import '@testing-library/jest-dom'
import type { PrismaClient } from '@prisma/client'
import { beforeEach, vi } from 'vitest'
import { type DeepMockProxy, mockDeep } from 'vitest-mock-extended'

// Create the mock outside of the factory
export const prismaMock = mockDeep<PrismaClient>()

// Mock the prisma import from our lib
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Make the mock available globally for convenience
declare global {
  // eslint-disable-next-line no-var
  var prismaMock: DeepMockProxy<PrismaClient>
}
globalThis.prismaMock = prismaMock

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks()
})
