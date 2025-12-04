/**
 * Mock completo de next/navigation para testes
 */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}))

export const usePathname = jest.fn(() => '/')

export const useSearchParams = jest.fn(() => new URLSearchParams())

export const useParams = jest.fn(() => ({}))

export const notFound = jest.fn()

export const redirect = jest.fn((url: string) => {
  throw new Error(`Redirect to ${url}`)
})

