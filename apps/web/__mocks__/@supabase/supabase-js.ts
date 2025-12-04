/**
 * Mock do cliente Supabase para testes
 */

import { MockSupabaseClient } from '../../__tests__/helpers/mock-supabase'

export const createClient = jest.fn(() => {
  return new MockSupabaseClient()
})

export default {
  createClient,
}

