import { mockUsers, mockResources, mockTransactions, mockWallets, mockCurrentUser } from "./mock-data"

// Mock Supabase client for development
export const mockSupabase = {
  auth: {
    getSession: () =>
      Promise.resolve({
        data: {
          session: {
            user: mockCurrentUser,
          },
        },
      }),
    onAuthStateChange: (callback: any) => {
      // Simulate auth state change
      setTimeout(() => callback("SIGNED_IN", { user: mockCurrentUser }), 100)
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
    signInWithPassword: ({ email, password }: any) => {
      if (email && password) {
        return Promise.resolve({ data: { user: mockCurrentUser }, error: null })
      }
      return Promise.resolve({ data: null, error: { message: "Invalid credentials" } })
    },
    signUp: ({ email, password }: any) => {
      if (email && password) {
        return Promise.resolve({ data: { user: mockCurrentUser }, error: null })
      }
      return Promise.resolve({ data: null, error: { message: "Sign up failed" } })
    },
    signOut: () => Promise.resolve({ error: null }),
  },
  from: (table: string) => ({
    select: (columns = "*") => ({
      eq: (column: string, value: any) => ({
        single: () => {
          if (table === "users") {
            const user = mockUsers.find((u) => u[column as keyof typeof u] === value)
            return Promise.resolve({ data: user || null })
          }
          if (table === "wallets") {
            const wallet = mockWallets.find((w) => w[column as keyof typeof w] === value)
            return Promise.resolve({ data: wallet || null })
          }
          return Promise.resolve({ data: null })
        },
        order: (orderColumn: string, options?: any) => ({
          limit: (limitNum: number) => {
            if (table === "resources") {
              let filtered = mockResources
              if (column && value) {
                filtered = mockResources.filter((r) => r[column as keyof typeof r] === value)
              }
              return Promise.resolve({ data: filtered.slice(0, limitNum) })
            }
            if (table === "transactions") {
              let filtered = mockTransactions
              if (column && value) {
                filtered = mockTransactions.filter((t) => t[column as keyof typeof t] === value)
              }
              const withResources = filtered.map((t) => ({
                ...t,
                resources: mockResources.find((r) => r.id === t.resource_id),
              }))
              return Promise.resolve({ data: withResources.slice(0, limitNum) })
            }
            return Promise.resolve({ data: [] })
          },
        }),
      }),
      order: (column: string, options?: any) => ({
        limit: (limitNum: number) => {
          if (table === "resources") {
            return Promise.resolve({ data: mockResources.slice(0, limitNum) })
          }
          return Promise.resolve({ data: [] })
        },
      }),
      textSearch: (column: string, query: string) => ({
        order: (orderColumn: string, options?: any) => {
          const filtered = mockResources.filter(
            (r) =>
              r.title.toLowerCase().includes(query.toLowerCase()) ||
              (r.description && r.description.toLowerCase().includes(query.toLowerCase())),
          )
          return Promise.resolve({ data: filtered })
        },
      }),
      gt: (column: string, value: any) => ({
        order: (orderColumn: string, options?: any) => {
          const filtered = mockResources.filter((r) => r[column as keyof typeof r] > value)
          return Promise.resolve({ data: filtered })
        },
      }),
    }),
    insert: (data: any) => Promise.resolve({ data, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data, error: null }),
    }),
    select: (columns: string, options?: any) => {
      if (options?.count === "exact") {
        if (table === "resources") {
          return Promise.resolve({ count: mockResources.length })
        }
        if (table === "transactions") {
          return Promise.resolve({ count: mockTransactions.length })
        }
      }

      if (table === "transactions") {
        const withResources = mockTransactions.map((t) => ({
          ...t,
          resources: mockResources.find((r) => r.id === t.resource_id),
        }))
        return Promise.resolve({ data: withResources })
      }

      return Promise.resolve({ data: [] })
    },
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => Promise.resolve({ error: null }),
      createSignedUrl: (path: string, expiresIn: number) =>
        Promise.resolve({ data: { signedUrl: `https://example.com/download/${path}` } }),
    }),
  },
}
