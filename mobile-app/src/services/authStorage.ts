import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';
const SESSION_KEY = '@session_id';

export interface UserData {
  id: string;
  phone: string;
  email?: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Store JWT token
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    if (__DEV__) console.error('Error storing token:', error);
    throw error;
  }
};

/**
 * Get JWT token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Remove JWT token
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error removing token:', error);
    throw error;
  }
};

/**
 * Store user data
 */
export const storeUser = async (user: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    if (__DEV__) console.error('Error storing user:', error);
    throw error;
  }
};

/**
 * Get user data
 */
export const getUser = async (): Promise<UserData | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    if (__DEV__) console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Remove user data
 */
export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error removing user:', error);
    throw error;
  }
};

/**
 * Clear all auth data (logout)
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      removeToken(),
      removeUser(),
      removeSessionId(),
    ]);
  } catch (error) {
    if (__DEV__) console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  const sessionId = await getSessionId();
  return !!token || !!sessionId;
};

/**
 * Store session id for Session-based auth
 */
export const storeSessionId = async (sessionId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
  } catch (error) {
    if (__DEV__) console.error('Error storing session id:', error);
    throw error;
  }
};

/**
 * Get stored session id
 */
export const getSessionId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error getting session id:', error);
    return null;
  }
};

/**
 * Remove session id (logout)
 */
export const removeSessionId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    if (__DEV__) console.error('Error removing session id:', error);
    throw error;
  }
};

