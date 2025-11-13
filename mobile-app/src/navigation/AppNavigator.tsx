import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
// Use solid purple background instead of gradient overlay
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthenticated as checkIsAuthenticated, clearAuthData } from '../services/authStorage';
import { getAuthProfile } from '../services/api';
import MainBottomTab from './MainBottomTab';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ArtistSignupSteps from '../screens/ArtistSignupSteps';
import RecruiterSignupSteps from '../screens/RecruiterSignupSteps';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';
import CreateProjectScreen from '../screens/projects/CreateProjectScreen';
import UpdateProjectScreen from '../screens/projects/UpdateProjectScreen';
import CreateScheduleScreen from '../screens/schedules/CreateScheduleScreen';
import ProjectDetailsScreen from '../screens/projects/ProjectDetailsScreen';
import ArtistProjectDetailScreen from '../screens/projects/ArtistProjectDetailScreen';
import MemberProfileScreen from '../screens/members/MemberProfileScreen';
import MyDevicesScreen from '../screens/profile/MyDevicesScreen';
import { colors } from '../styles/tokens';
import { useAuth } from '../providers/AuthProvider';
// Removed role-based dashboards; use existing main flow which renders
// artist vs recruiter experiences via Home screens and tabs

const Stack = createStackNavigator();

const ONBOARDING_KEY = '@has_seen_onboarding';

// 🔧 DEV HELPER: Uncomment the line below to reset onboarding and see full flow
// AsyncStorage.removeItem(ONBOARDING_KEY);

export default function AppNavigator() {
  const { loading: authLoading, mode, profile } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      const seenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(!!seenOnboarding);
    } catch (error) {
      if (__DEV__) console.error('Onboarding initialization error:', error);
    }
  };

  const markOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Always start at Main (bottom tabs) for authenticated users;
  // Home tab decides artist vs recruiter experience based on stored role
  const initialAppRoute = 'Main';
  const initialAuthRoute = 'Splash';

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {/* App-wide solid purple background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
        {mode !== 'none' ? (
          <Stack.Navigator
            initialRouteName={initialAppRoute}
            screenOptions={{
              headerTransparent: true,
              headerTitleStyle: { color: colors.white },
              headerTintColor: colors.white,
              headerShadowVisible: false,
              cardStyle: { backgroundColor: 'transparent' },
            }}
          >
            {/* Existing main app routes */}
            <Stack.Screen name="Main" component={MainBottomTab} options={{ headerShown: false }} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={({ route }: any) => ({ title: route.params?.name || 'Chat' })} />
            <Stack.Screen name="ChatList" component={ChatListScreen as any} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateProject" component={CreateProjectScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UpdateProject" component={UpdateProjectScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ArtistProjectDetail" component={ArtistProjectDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MemberProfile" component={MemberProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MyDevices" component={MyDevicesScreen} options={{ headerShown: true, title: 'My Devices' }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            initialRouteName={initialAuthRoute}
            screenOptions={{
              headerTransparent: true,
              headerTitleStyle: { color: colors.white },
              headerTintColor: colors.white,
              headerShadowVisible: false,
              cardStyle: { backgroundColor: 'transparent' },
            }}
          >
            {/* Auth flow */}
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            {/* Signup routes for new users (navigated from LoginScreen after OTP verification) */}
            <Stack.Screen name="ArtistSignup" component={ArtistSignupSteps as any} options={{ headerShown: false }} />
            <Stack.Screen name="RecruiterSignup" component={RecruiterSignupSteps as any} options={{ headerShown: false }} />
          </Stack.Navigator>
        )}
      </View>
    </NavigationContainer>
  );
}

