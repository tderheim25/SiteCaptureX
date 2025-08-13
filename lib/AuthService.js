import { supabase } from './supabase' 
 
 export class AuthService { 
   // Sign up with email and password 
   static async signUp(email, password, userData) { 
     try { 
       const { data, error } = await supabase.auth.signUp({ 
         email, 
         password, 
         options: { 
           data: { 
             username: userData.username, 
             full_name: userData.fullName, 
             avatar_url: userData.avatarUrl || null 
             // Role will default to 'user' in the database trigger 
           } 
         } 
       }) 
 
       if (error) throw error 
       return { user: data.user, session: data.session } 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Sign in with email and password 
   static async signIn(email, password) { 
     try { 
       const { data, error } = await supabase.auth.signInWithPassword({ 
         email, 
         password 
       }) 
 
       if (error) throw error 
       return { user: data.user, session: data.session } 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Sign out 
   static async signOut() { 
     try { 
       const { error } = await supabase.auth.signOut() 
       if (error) throw error 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Get current user 
   static async getCurrentUser() { 
     try { 
       const { data: { user }, error } = await supabase.auth.getUser() 
       if (error) throw error 
       return user 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Update user profile 
   static async updateProfile(updates) { 
     try { 
       const user = await this.getCurrentUser() 
       if (!user) throw new Error('No user found') 
 
       const { data, error } = await supabase 
         .from('profiles') 
         .update({ 
           ...updates, 
           updated_at: new Date().toISOString() 
         }) 
         .eq('id', user.id) 
         .select() 
 
       if (error) throw error 
       return data[0] 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Get user profile 
   static async getProfile(userId) { 
     try { 
       // Try to fetch a single profile if it exists
       const { data, error } = await supabase 
         .from('profiles') 
         .select('*') 
         .eq('id', userId) 
         .maybeSingle() 
 
       if (error) {
         if (error.message.includes('relation "public.profiles" does not exist') || 
             error.message.includes('Could not find the table')) {
           throw new Error('Database not initialized. Please run the database setup scripts in Supabase.')
         }
         throw error
       }

       // If no profile exists yet, create one with best-available metadata
       if (!data) {
         let username
         let fullName
         try {
           const currentUser = await this.getCurrentUser()
           if (currentUser && currentUser.id === userId) {
             const meta = currentUser.user_metadata || {}
             const email = currentUser.email || ''
             username = meta.username || (email ? email.split('@')[0] : undefined)
             fullName = meta.full_name || meta.fullName
           }
         } catch (_) {
           // ignore metadata fetch errors; will create minimal profile
         }

         const payload = { id: userId, role: 'user', updated_at: new Date().toISOString() }
         if (username !== undefined) payload.username = username
         if (fullName !== undefined) payload.full_name = fullName

         const { data: inserted, error: insertError } = await supabase
           .from('profiles')
           .upsert(payload, { onConflict: 'id' })
           .select()
           .single()

         if (insertError) throw insertError
         return inserted
       }

       return data 
     } catch (error) { 
       const msg = error?.message || ''
       if (
         msg.includes('relation "public.profiles" does not exist') ||
         msg.includes('Could not find the table') ||
         msg.includes('Database not initialized')
       ) {
         // Suppress noisy logs when DB isn't initialized
       } else {
         console.error('Error loading user profile:', msg)
       }
       throw new Error(error.message) 
     } 
   } 
 
   // Listen to auth changes 
   static onAuthStateChange(callback) { 
     return supabase.auth.onAuthStateChange(callback) 
   } 
 
   // Get user role 
   static async getUserRole(userId) { 
     try { 
       const { data, error } = await supabase 
         .from('profiles') 
         .select('role') 
         .eq('id', userId) 
         .maybeSingle() 
 
       if (error) throw error 
       return data?.role || 'user' 
     } catch (error) { 
       console.error('Error checking user role:', error.message)
       throw new Error(error.message) 
     } 
   } 
 
   // Check if user has specific role or higher 
   static async hasRole(requiredRole) { 
     try { 
       const currentUser = await this.getCurrentUser()
       if (!currentUser) return false
       
       const userRole = await this.getUserRole(currentUser.id)
       
       // Role hierarchy: admin > manager > user
       const roleHierarchy = { 'user': 1, 'manager': 2, 'admin': 3 }
       const userLevel = roleHierarchy[userRole] || 1
       const requiredLevel = roleHierarchy[requiredRole] || 1
       
       return userLevel >= requiredLevel 
     } catch (error) { 
       console.error('Error checking user role:', error.message)
       return false 
     } 
   } 
 
   // Update user role (admin only) 
   static async updateUserRole(userId, newRole) { 
     try {
       // First check if current user is admin
       const currentUser = await this.getCurrentUser()
       if (!currentUser) throw new Error('Not authenticated')
       
       const currentProfile = await this.getProfile(currentUser.id)
       if (currentProfile.role !== 'admin') {
         throw new Error('Only administrators can update user roles')
       }

       const { data, error } = await supabase 
         .from('profiles') 
         .update({ role: newRole, updated_at: new Date().toISOString() }) 
         .eq('id', userId) 
         .select('id, role') 
 
       if (error) throw error 
       if (!data || data.length === 0) {
         throw new Error('Update failed: not authorized by RLS or user not found. Ensure admin update policy exists.')
       }
       return data[0] 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Get all users (admin/manager only) 
   static async getAllUsers() { 
     try { 
       const { data, error } = await supabase 
         .from('profiles') 
         .select('*') 
         .order('created_at', { ascending: false }) 
 
       if (error) {
         if (error.message.includes('relation "public.profiles" does not exist') || 
             error.message.includes('Could not find the table')) {
           throw new Error('Database not initialized. Please run the database setup scripts in Supabase. See DATABASE_SETUP.md for instructions.')
         }
         throw error
       }
       
       return data || []
     } catch (error) { 
       const msg = error?.message || ''
       if (
         msg.includes('relation "public.profiles" does not exist') ||
         msg.includes('Could not find the table') ||
         msg.includes('Database not initialized')
       ) {
         // Suppress noisy logs when DB isn't initialized
       } else {
         console.error('Error loading users:', msg)
       }
       throw new Error(error.message) 
     } 
   } 

   static async getSites() {
     try {
       const { data, error } = await supabase
         .from('sites')
         .select('*')
         .order('created_at', { ascending: false })
       if (error) throw error
       return data || []
     } catch (error) {
       const msg = error?.message || ''
       if (
         msg.includes('relation "public.sites" does not exist') ||
         msg.includes('Could not find the table')
       ) {
         throw new Error('Sites table is missing. Please run the DB setup for sites.')
       }
       throw error
     }
   }

   static async addSite({ name, address, status = 'active', project_code }) {
     try {
       const payload = {
         name,
         address,
         status,
         project_code,
       }
       const { data, error } = await supabase
         .from('sites')
         .insert(payload)
         .select()
         .single()
       if (error) throw error
       return data
     } catch (error) {
       throw new Error(error.message)
     }
   }
 }