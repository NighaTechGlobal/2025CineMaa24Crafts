/**
 * Reset Onboarding Script
 * 
 * This script clears the onboarding and guest mode flags from AsyncStorage
 * so you can see the full app flow from the beginning:
 * Splash → Onboarding → Welcome → Login
 * 
 * Usage:
 * 1. In your app, press 'r' in Metro to reload
 * 2. Or restart the app completely
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.multiRemove([
      '@has_seen_onboarding',
      '@guest_mode',
      '@guest_role',
    ]);
    console.log('✅ Onboarding reset successfully!');
    console.log('Reload the app to see: Splash → Onboarding → Welcome → Login');
    return true;
  } catch (error) {
    console.error('❌ Failed to reset onboarding:', error);
    return false;
  }
};

// For manual reset in development
export const clearAllAppData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All app data cleared!');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear app data:', error);
    return false;
  }
};

