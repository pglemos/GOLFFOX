/**
 * Mock completo do Supabase Client para testes
 */

export interface MockSupabaseResponse<T = any> {
  data: T | null
  error: any | null
  count?: number | null
  status: number
  statusText: string
}

export class MockSupabaseClient {
  private data: Map<string, any[]> = new Map()
  private rpcHandlers: Map<string, Function> = new Map()
  private authHandlers: Map<string, Function> = new Map()
  private authUsers: Map<string, any> = new Map() // auth.users mock
  private storageFiles: Map<string, Map<string, Buffer>> = new Map() // bucket -> path -> file

  from(table: string) {
    return new MockSupabaseQueryBuilder(this, table)
  }

  auth = {
    signInWithPassword: jest.fn(async (credentials: { email: string; password: string }) => {
      const handler = this.authHandlers.get('signInWithPassword')
      if (handler) {
        return handler(credentials)
      }
      // Default mock
      if (credentials.password === 'wrongpass') {
        return {
          data: null,
          error: { message: 'Invalid credentials', status: 401 },
        }
      }
      return {
        data: {
          user: {
            id: 'user-1',
            email: credentials.email,
            user_metadata: {},
            app_metadata: {},
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: {
              id: 'user-1',
              email: credentials.email,
            },
          },
        },
        error: null,
      }
    }),
    signOut: jest.fn(async () => {
      const handler = this.authHandlers.get('signOut')
      if (handler) return handler()
      return { error: null }
    }),
    getUser: jest.fn(async () => {
      const handler = this.authHandlers.get('getUser')
      if (handler) return handler()
      return {
        data: {
          user: {
            id: 'user-1',
            email: 'test@test.com',
          },
        },
        error: null,
      }
    }),
    getSession: jest.fn(async () => {
      const handler = this.authHandlers.get('getSession')
      if (handler) return handler()
      return {
        data: {
          session: {
            access_token: 'mock-access-token',
            user: { id: 'user-1', email: 'test@test.com' },
          },
        },
        error: null,
      }
    }),
    admin: {
      createUser: jest.fn(async (options: { email: string; password?: string; user_metadata?: any; email_confirm?: boolean }) => {
        const handler = this.authHandlers.get('admin.createUser')
        if (handler) return handler(options)
        
        const userId = `auth-user-${Date.now()}-${Math.random()}`
        const user = {
          id: userId,
          email: options.email,
          email_confirmed_at: options.email_confirm ? new Date().toISOString() : null,
          user_metadata: options.user_metadata || {},
          app_metadata: {},
          created_at: new Date().toISOString(),
        }
        this.authUsers.set(userId, user)
        this.authUsers.set(options.email.toLowerCase(), user) // Index by email
        
        return {
          data: { user },
          error: null,
        }
      }),
      updateUserById: jest.fn(async (userId: string, updates: { email?: string; password?: string; user_metadata?: any; email_confirm?: boolean }) => {
        const handler = this.authHandlers.get('admin.updateUserById')
        if (handler) return handler(userId, updates)
        
        const user = this.authUsers.get(userId)
        if (!user) {
          return {
            data: { user: null },
            error: { message: 'User not found', status: 404 },
          }
        }
        
        const updated = {
          ...user,
          ...(updates.email && { email: updates.email }),
          ...(updates.user_metadata && { user_metadata: { ...user.user_metadata, ...updates.user_metadata } }),
          ...(updates.email_confirm && { email_confirmed_at: new Date().toISOString() }),
          updated_at: new Date().toISOString(),
        }
        this.authUsers.set(userId, updated)
        if (updates.email) {
          this.authUsers.delete(user.email.toLowerCase())
          this.authUsers.set(updates.email.toLowerCase(), updated)
        }
        
        return {
          data: { user: updated },
          error: null,
        }
      }),
      deleteUser: jest.fn(async (userId: string) => {
        const handler = this.authHandlers.get('admin.deleteUser')
        if (handler) return handler(userId)
        
        const user = this.authUsers.get(userId)
        if (!user) {
          return {
            data: { user: null },
            error: { message: 'User not found', status: 404 },
          }
        }
        
        this.authUsers.delete(userId)
        this.authUsers.delete(user.email.toLowerCase())
        
        return {
          data: { user },
          error: null,
        }
      }),
      listUsers: jest.fn(async (options?: { page?: number; perPage?: number }) => {
        const handler = this.authHandlers.get('admin.listUsers')
        if (handler) return handler(options)
        
        const users = Array.from(this.authUsers.values()).filter(u => u.id && !u.email.includes('@')) // Filter out email-indexed entries
        const page = options?.page || 1
        const perPage = options?.perPage || 1000
        const start = (page - 1) * perPage
        const end = start + perPage
        
        return {
          data: {
            users: users.slice(start, end),
            total: users.length,
          },
          error: null,
        }
      }),
      getUserById: jest.fn(async (userId: string) => {
        const handler = this.authHandlers.get('admin.getUserById')
        if (handler) return handler(userId)
        
        const user = this.authUsers.get(userId)
        if (!user) {
          return {
            data: { user: null },
            error: { message: 'User not found', status: 404 },
          }
        }
        
        return {
          data: { user },
          error: null,
        }
      }),
      getUserByEmail: jest.fn(async (email: string) => {
        const handler = this.authHandlers.get('admin.getUserByEmail')
        if (handler) return handler(email)
        
        const user = this.authUsers.get(email.toLowerCase())
        if (!user) {
          return {
            data: { user: null },
            error: { message: 'User not found', status: 404 },
          }
        }
        
        return {
          data: { user },
          error: null,
        }
      }),
    },
  }

  storage = {
    from: (bucket: string) => ({
      upload: jest.fn(async (path: string, file: Buffer | File, options?: { contentType?: string; upsert?: boolean; cacheControl?: string }) => {
        const handler = this.authHandlers.get(`storage.${bucket}.upload`)
        if (handler) return handler(path, file, options)
        
        if (!this.storageFiles.has(bucket)) {
          this.storageFiles.set(bucket, new Map())
        }
        const bucketFiles = this.storageFiles.get(bucket)!
        
        const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
        
        if (!options?.upsert && bucketFiles.has(path)) {
          return {
            data: null,
            error: { message: 'File already exists', status: 409 },
          }
        }
        
        bucketFiles.set(path, buffer)
        
        return {
          data: { path },
          error: null,
        }
      }),
      createSignedUrl: jest.fn(async (path: string, expiresIn: number) => {
        const handler = this.authHandlers.get(`storage.${bucket}.createSignedUrl`)
        if (handler) return handler(path, expiresIn)
        
        const bucketFiles = this.storageFiles.get(bucket)
        if (!bucketFiles || !bucketFiles.has(path)) {
          return {
            data: null,
            error: { message: 'File not found', status: 404 },
          }
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
        const signedUrl = `${baseUrl}/storage/v1/object/sign/${bucket}/${path}?expires=${Date.now() + expiresIn * 1000}`
        
        return {
          data: { signedUrl },
          error: null,
        }
      }),
      getPublicUrl: jest.fn((path: string) => {
        const handler = this.authHandlers.get(`storage.${bucket}.getPublicUrl`)
        if (handler) return handler(path)
        
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
        const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`
        
        return {
          data: { publicUrl },
        }
      }),
      remove: jest.fn(async (paths: string[]) => {
        const handler = this.authHandlers.get(`storage.${bucket}.remove`)
        if (handler) return handler(paths)
        
        const bucketFiles = this.storageFiles.get(bucket)
        if (!bucketFiles) {
          return {
            data: [],
            error: null,
          }
        }
        
        const removed = paths.filter(path => {
          if (bucketFiles.has(path)) {
            bucketFiles.delete(path)
            return true
          }
          return false
        })
        
        return {
          data: removed.map(path => ({ path })),
          error: null,
        }
      }),
    }),
  }

  rpc(functionName: string, params?: any) {
    const handler = this.rpcHandlers.get(functionName)
    if (handler) {
      return handler(params)
    }
    return Promise.resolve({
      data: null,
      error: { message: `RPC function ${functionName} not mocked`, code: 'PGRST116' },
    })
  }

  // Helper methods para configurar mocks
  setTableData(table: string, data: any[]) {
    this.data.set(table, data)
  }

  getTableData(table: string): any[] {
    return this.data.get(table) || []
  }

  setRPCHandler(functionName: string, handler: Function) {
    this.rpcHandlers.set(functionName, handler)
  }

  setAuthHandler(method: string, handler: Function) {
    this.authHandlers.set(method, handler)
  }

  setAuthUser(userId: string, user: any) {
    this.authUsers.set(userId, user)
    if (user.email) {
      this.authUsers.set(user.email.toLowerCase(), user)
    }
  }

  getAuthUser(userId: string) {
    return this.authUsers.get(userId)
  }

  clear() {
    this.data.clear()
    this.rpcHandlers.clear()
    this.authHandlers.clear()
    this.authUsers.clear()
    this.storageFiles.clear()
  }
}

class MockSupabaseQueryBuilder {
  constructor(private client: MockSupabaseClient, private table: string) {}

  select(columns: string = '*') {
    return new MockSupabaseQuery(this.client, this.table, 'select', columns)
  }

  insert(data: any) {
    return new MockSupabaseQuery(this.client, this.table, 'insert', undefined, data)
  }

  update(data: any) {
    return new MockSupabaseQuery(this.client, this.table, 'update', undefined, data)
  }

  delete() {
    return new MockSupabaseQuery(this.client, this.table, 'delete')
  }
}

class MockSupabaseQuery {
  private filters: Array<{ type: string; column: string; value: any }> = []
  private orderByColumn?: string
  private orderByDirection?: 'asc' | 'desc'
  private limitValue?: number
  private singleMode = false

  constructor(
    private client: MockSupabaseClient,
    private table: string,
    private operation: 'select' | 'insert' | 'update' | 'delete',
    private columns?: string,
    private data?: any
  ) {}

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value })
    return this
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, value: pattern })
    return this
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: 'ilike', column, value: pattern })
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values })
    return this
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column
    this.orderByDirection = options?.ascending !== false ? 'asc' : 'desc'
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  maybeSingle() {
    this.singleMode = true
    return this
  }

  async then<TResult1 = MockSupabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: MockSupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute()
      return onfulfilled ? onfulfilled(result) : (result as any)
    } catch (error) {
      if (onrejected) {
        return onrejected(error)
      }
      throw error
    }
  }

  private async execute(): Promise<MockSupabaseResponse> {
    const tableData = this.client.getTableData(this.table)

    if (this.operation === 'select') {
      let filtered = [...tableData]

      // Apply filters
      for (const filter of this.filters) {
        filtered = filtered.filter((row) => {
          const cellValue = row[filter.column]
          switch (filter.type) {
            case 'eq':
              return cellValue === filter.value
            case 'neq':
              return cellValue !== filter.value
            case 'gt':
              return cellValue > filter.value
            case 'gte':
              return cellValue >= filter.value
            case 'lt':
              return cellValue < filter.value
            case 'lte':
              return cellValue <= filter.value
            case 'like':
              return String(cellValue).includes(filter.value.replace('%', ''))
            case 'ilike':
              return String(cellValue).toLowerCase().includes(filter.value.replace('%', '').toLowerCase())
            case 'in':
              return filter.value.includes(cellValue)
            case 'is':
              return cellValue === filter.value
            default:
              return true
          }
        })
      }

      // Apply ordering
      if (this.orderByColumn) {
        filtered.sort((a, b) => {
          const aVal = a[this.orderByColumn!]
          const bVal = b[this.orderByColumn!]
          if (this.orderByDirection === 'desc') {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
          }
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        })
      }

      // Apply limit
      if (this.limitValue) {
        filtered = filtered.slice(0, this.limitValue)
      }

      // Apply single mode
      if (this.singleMode) {
        if (filtered.length === 0) {
          return {
            data: null,
            error: { message: 'No rows found', code: 'PGRST116' },
            status: 406,
            statusText: 'Not Acceptable',
          }
        }
        return {
          data: filtered[0],
          error: null,
          status: 200,
          statusText: 'OK',
        }
      }

      return {
        data: filtered,
        error: null,
        status: 200,
        statusText: 'OK',
        count: filtered.length,
      }
    }

    if (this.operation === 'insert') {
      const newData = Array.isArray(this.data) ? this.data : [this.data]
      const inserted = newData.map((item) => ({
        ...item,
        id: item.id || `id-${Date.now()}-${Math.random()}`,
        created_at: item.created_at || new Date().toISOString(),
      }))
      tableData.push(...inserted)
      this.client.setTableData(this.table, tableData)

      if (this.singleMode) {
        return {
          data: inserted[0],
          error: null,
          status: 201,
          statusText: 'Created',
        }
      }

      return {
        data: inserted,
        error: null,
        status: 201,
        statusText: 'Created',
      }
    }

    if (this.operation === 'update') {
      let filtered = [...tableData]
      const indices: number[] = []

      // Find matching rows
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]
        const matches = this.filters.every((filter) => {
          const cellValue = row[filter.column]
          switch (filter.type) {
            case 'eq':
              return cellValue === filter.value
            default:
              return true
          }
        })
        if (matches) {
          indices.push(i)
        }
      }

      if (indices.length === 0) {
        return {
          data: null,
          error: { message: 'No rows updated', code: 'PGRST116' },
          status: 404,
          statusText: 'Not Found',
        }
      }

      const updated = indices.map((idx) => {
        tableData[idx] = { ...tableData[idx], ...this.data, updated_at: new Date().toISOString() }
        return tableData[idx]
      })
      this.client.setTableData(this.table, tableData)

      if (this.singleMode) {
        return {
          data: updated[0],
          error: null,
          status: 200,
          statusText: 'OK',
        }
      }

      return {
        data: updated,
        error: null,
        status: 200,
        statusText: 'OK',
      }
    }

    if (this.operation === 'delete') {
      let filtered = [...tableData]
      const indices: number[] = []

      // Find matching rows
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i]
        const matches = this.filters.every((filter) => {
          const cellValue = row[filter.column]
          switch (filter.type) {
            case 'eq':
              return cellValue === filter.value
            default:
              return true
          }
        })
        if (matches) {
          indices.push(i)
        }
      }

      const deleted = indices.map((idx) => tableData[idx])
      const remaining = tableData.filter((_, idx) => !indices.includes(idx))
      this.client.setTableData(this.table, remaining)

      if (this.singleMode) {
        return {
          data: deleted[0] || null,
          error: null,
          status: 200,
          statusText: 'OK',
        }
      }

      return {
        data: deleted,
        error: null,
        status: 200,
        statusText: 'OK',
      }
    }

    return {
      data: null,
      error: { message: 'Unknown operation', code: 'UNKNOWN' },
      status: 500,
      statusText: 'Internal Server Error',
    }
  }
}

// Export singleton instance
export const mockSupabaseClient = new MockSupabaseClient()

