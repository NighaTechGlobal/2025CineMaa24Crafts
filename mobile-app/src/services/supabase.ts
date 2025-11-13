import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be defined in .env file'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to get current user
// NOTE: This requires Supabase Auth session which is separate from our JWT auth
// For JWT-authenticated requests, use getAuthProfile() from api.ts instead
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // This is expected if using JWT auth instead of Supabase Auth
      if (__DEV__) console.log('No Supabase Auth session - using JWT auth instead');
      return null;
    }
    return user;
  } catch (error) {
    if (__DEV__) console.log('Error getting current user:', error);
    return null;
  }
};

// Helper to get current profile
// NOTE: This requires Supabase Auth session which is separate from our JWT auth
// For JWT-authenticated requests, use getAuthProfile() from api.ts instead
export const getCurrentProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      if (__DEV__) console.log('No Supabase user - this is expected when using JWT auth');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.log('Error getting current profile:', error);
    return null;
  }
};
