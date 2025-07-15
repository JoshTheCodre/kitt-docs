
import { supabase } from './supabase'
import type { Database } from './supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Resource = Tables['resources']['Row']
type Transaction = Tables['transactions']['Row']
type Wallet = Tables['wallets']['Row']

export class DatabaseService {
  // User operations
  static async createUser(userData: Tables['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateUser(id: string, updates: Tables['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Wallet operations
  static async getUserWallet(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  static async updateWalletBalance(userId: string, balance: number) {
    const { data, error } = await supabase
      .from('wallets')
      .update({ balance })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Resource operations
  static async getAllResources() {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name),
        reviews(rating)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getFeaturedResources() {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name),
        reviews(rating)
      `)
      .eq('featured', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getTrendingResources() {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name),
        reviews(rating)
      `)
      .order('download_count', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data
  }

  static async getResourcesByDepartment(department: string, userDepartment?: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name),
        reviews(rating)
      `)
      .eq('department', userDepartment || department)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getResourceById(id: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name, email),
        reviews(rating, comment, user_id, users(name))
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createResource(resourceData: Tables['resources']['Insert']) {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getUserResources(userId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        reviews(rating)
      `)
      .eq('uploader_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Search operations
  static async searchResources(query: string, filters: any = {}) {
    let queryBuilder = supabase
      .from('resources')
      .select(`
        *,
        uploader:users(name),
        reviews(rating)
      `)

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (filters.department) {
      queryBuilder = queryBuilder.eq('department', filters.department)
    }

    if (filters.level) {
      queryBuilder = queryBuilder.eq('level', filters.level)
    }

    const { data, error } = await queryBuilder
      .order(filters.sortBy || 'created_at', { 
        ascending: filters.sortOrder === 'ASC' 
      })

    if (error) throw error
    return data
  }

  // Transaction operations
  static async processTransaction(buyerId: string, resourceId: string, amount: number) {
    const { data, error } = await supabase
      .rpc('process_transaction', {
        p_buyer_id: buyerId,
        p_resource_id: resourceId,
        p_amount: amount
      })
    
    if (error) throw error
    return data
  }

  static async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        resource:resources(title, file_type)
      `)
      .eq('buyer_id', userId)
      .order('timestamp', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Download operations
  static async getUserDownloads(userId: string) {
    const { data, error } = await supabase
      .from('downloads')
      .select(`
        *,
        resource:resources(*)
      `)
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async addDownload(userId: string, resourceId: string) {
    const { data, error } = await supabase
      .from('downloads')
      .insert({ user_id: userId, resource_id: resourceId })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Review operations
  static async addReview(userId: string, resourceId: string, rating: number, comment?: string) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        resource_id: resourceId,
        rating,
        comment
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        resource:resources(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Bookmark operations
  static async getUserBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        resource:resources(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async addBookmark(userId: string, resourceId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, resource_id: resourceId })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async removeBookmark(userId: string, resourceId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
    
    if (error) throw error
    return true
  }
}

export default DatabaseService
