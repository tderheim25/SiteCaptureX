import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Get environment variables from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.REACT_APP_SUPABASE_URL || 'https://ryuzzetivvijkiribkzt.supabase.co'
const supabaseAnonKey = Constants.expoConfig?.extra?.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dXp6ZXRpdnZpamtpcmlia3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjUyMTMsImV4cCI6MjA3MDYwMTIxM30._bp9slaEqPvvVCEZghNbaflrHoQtj9wVQ5BJD3VcntY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)