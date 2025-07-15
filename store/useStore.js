
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      profile: null,
      wallet: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setWallet: (wallet) => set({ wallet }),
      
      // Clear user data on logout
      clearUser: () => set({ 
        user: null, 
        profile: null, 
        wallet: null,
        userResources: [],
        userTransactions: [],
        userDownloads: [],
        userBookmarks: []
      }),

      // Resources state
      resources: [],
      featuredResources: [],
      trendingResources: [],
      forYouResources: [],
      selectedResource: null,
      userResources: [],
      setResources: (resources) => set({ resources }),
      setFeaturedResources: (featuredResources) => set({ featuredResources }),
      setTrendingResources: (trendingResources) => set({ trendingResources }),
      setForYouResources: (forYouResources) => set({ forYouResources }),
      setSelectedResource: (resource) => set({ selectedResource: resource }),
      setUserResources: (userResources) => set({ userResources }),

      // Search state
      searchQuery: '',
      searchResults: [],
      searchFilters: {
        department: '',
        level: '',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSearchFilters: (filters) => set(state => ({
        searchFilters: { ...state.searchFilters, ...filters }
      })),

      // Transaction state
      userTransactions: [],
      setUserTransactions: (transactions) => set({ userTransactions: transactions }),
      addTransaction: (transaction) => set(state => ({
        userTransactions: [transaction, ...state.userTransactions]
      })),

      // Downloads state
      userDownloads: [],
      setUserDownloads: (downloads) => set({ userDownloads: downloads }),
      addDownload: (download) => set(state => ({
        userDownloads: [download, ...state.userDownloads]
      })),

      // Bookmarks state
      userBookmarks: [],
      setUserBookmarks: (bookmarks) => set({ userBookmarks: bookmarks }),
      addBookmark: (bookmark) => set(state => ({
        userBookmarks: [bookmark, ...state.userBookmarks]
      })),
      removeBookmark: (resourceId) => set(state => ({
        userBookmarks: state.userBookmarks.filter(b => b.resource_id !== resourceId)
      })),

      // Reviews state
      userReviews: [],
      setUserReviews: (reviews) => set({ userReviews: reviews }),
      addReview: (review) => set(state => ({
        userReviews: [review, ...state.userReviews]
      })),
      updateReview: (reviewId, updates) => set(state => ({
        userReviews: state.userReviews.map(r => 
          r.id === reviewId ? { ...r, ...updates } : r
        )
      })),

      // Loading states
      loading: false,
      uploading: false,
      processing: false,
      setLoading: (loading) => set({ loading }),
      setUploading: (uploading) => set({ uploading }),
      setProcessing: (processing) => set({ processing }),

      // Navigation state
      currentScreen: 'home',
      navigationHistory: ['home'],
      setCurrentScreen: (screen) => set(state => ({
        currentScreen: screen,
        navigationHistory: [...state.navigationHistory, screen]
      })),

      // Modal states
      showAddFundsModal: false,
      showShareModal: false,
      setShowAddFundsModal: (show) => set({ showAddFundsModal: show }),
      setShowShareModal: (show) => set({ showShareModal: show }),

      // Error state
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Notification state
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set(state => ({
        notifications: [{ 
          id: Date.now(), 
          timestamp: new Date().toISOString(),
          ...notification 
        }, ...state.notifications]
      })),
      removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      // App settings
      settings: {
        theme: 'light',
        notifications: true,
        autoDownload: false,
        language: 'en'
      },
      setSettings: (settings) => set(state => ({
        settings: { ...state.settings, ...settings }
      })),

      // Helper functions
      isResourceBookmarked: (resourceId) => {
        const { userBookmarks } = get()
        return userBookmarks.some(b => b.resource_id === resourceId)
      },

      isResourceDownloaded: (resourceId) => {
        const { userDownloads } = get()
        return userDownloads.some(d => d.resource_id === resourceId)
      },

      hasUserReviewed: (resourceId) => {
        const { userReviews } = get()
        return userReviews.some(r => r.resource_id === resourceId)
      },

      getUserReviewForResource: (resourceId) => {
        const { userReviews } = get()
        return userReviews.find(r => r.resource_id === resourceId)
      },

      canAffordResource: (price) => {
        const { wallet } = get()
        return wallet && wallet.balance >= price
      },

      getResourcesByDepartment: (department) => {
        const { resources } = get()
        return resources.filter(r => r.department === department)
      },

      getResourcesByLevel: (level) => {
        const { resources } = get()
        return resources.filter(r => r.level === level)
      },

      getFreeResources: () => {
        const { resources } = get()
        return resources.filter(r => r.price === 0)
      },

      getPaidResources: () => {
        const { resources } = get()
        return resources.filter(r => r.price > 0)
      },

      // Update wallet balance
      updateWalletBalance: (newBalance) => set(state => ({
        wallet: state.wallet ? { ...state.wallet, balance: newBalance } : null
      })),

      // Add funds to wallet
      addFunds: (amount) => set(state => ({
        wallet: state.wallet ? {
          ...state.wallet,
          balance: state.wallet.balance + amount
        } : null
      })),

      // Deduct funds from wallet
      deductFunds: (amount) => set(state => ({
        wallet: state.wallet ? {
          ...state.wallet,
          balance: Math.max(0, state.wallet.balance - amount)
        } : null
      }))
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        settings: state.settings,
        searchFilters: state.searchFilters
      })
    }
  )
)

export default useStore
