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
       const { data, error } = await supabase 
         .from('profiles') 
         .select('*') 
         .eq('id', userId) 
         .single() 
 
       if (error) throw error 
       return data 
     } catch (error) { 
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
         .rpc('get_user_role', { user_id: userId }) 
 
       if (error) throw error 
       return data 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Check if user has specific role or higher 
   static async hasRole(requiredRole) { 
     try { 
       const { data, error } = await supabase 
         .rpc('user_has_role', { required_role: requiredRole }) 
 
       if (error) throw error 
       return data 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 
   // Update user role (admin only) 
   static async updateUserRole(userId, newRole) { 
     try { 
       const { data, error } = await supabase 
         .from('profiles') 
         .update({ role: newRole, updated_at: new Date().toISOString() }) 
         .eq('id', userId) 
         .select() 
 
       if (error) throw error 
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
 
       if (error) throw error 
       return data 
     } catch (error) { 
       throw new Error(error.message) 
     } 
   } 
 }