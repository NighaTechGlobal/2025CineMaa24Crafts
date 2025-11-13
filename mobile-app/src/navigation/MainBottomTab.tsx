import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, shadows, borderRadius, spacing } from '../styles/tokens';
// Removed gradient usage; using solid purple backgrounds

import HomeScreen from '../screens/home/HomeScreen';
import MembersScreen from '../screens/members/MembersScreen';
import SchedulesScreen from '../screens/SchedulesScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import SwipeNavigator from './SwipeNavigator';

const Tab = createBottomTabNavigator();

// Wrapper to animate screen appearance like a sliding window
function SlideScreenWrapper({
  children,
  index,
  activeIndex,
  prevIndex,
  transitionMode,
}: {
  children: React.ReactNode;
  index: number;
  activeIndex: number;
  prevIndex: number;
  transitionMode: 'press' | 'swipe' | 'none';
}) {
  const translate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (index === activeIndex) {
      // Only run entrance fade/slide for press-driven transitions to avoid swipe flicker
      if (transitionMode === 'press') {
        const direction = activeIndex > prevIndex ? 1 : -1;
        translate.setValue(20 * direction);
        opacity.setValue(0);
        Animated.parallel([
          Animated.timing(translate, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // For swipe transitions, ensure full opacity and no extra entrance animation
        translate.setValue(0);
        opacity.setValue(1);
      }
    }
  }, [activeIndex, prevIndex, transitionMode]);

  const style = useMemo(
    () => ({ transform: [{ translateX: translate }], opacity }),
    [translate, opacity],
  );

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

// Custom Tab Bar with Sliding Indicator
function CustomTabBar({ state, descriptors, navigation }: any) {
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);
  const tabBarRef = useRef<View>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  const numTabs = state.routes.length;

  const updateSliderPosition = (width: number, activeIndex: number, animate: boolean = true) => {
    const widthPerTab = width / numTabs;
    tabWidth.current = widthPerTab;
    const calculatedSliderWidth = widthPerTab * 0.85; // 85% of tab width for box
    setSliderWidth(calculatedSliderWidth);
    setTabBarWidth(width);
    
    // Calculate position: center of the tab minus half slider width
    const tabCenter = activeIndex * widthPerTab + widthPerTab / 2;
    const targetPosition = tabCenter - calculatedSliderWidth / 2;
    
    if (animate && isInitialized) {
      // Animate slider position
      Animated.parallel([
        Animated.timing(sliderPosition, {
          toValue: targetPosition,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade out slightly during transition, then fade back in
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Set initial position without animation
      sliderPosition.setValue(targetPosition);
      opacity.setValue(1);
      setIsInitialized(true);
    }
  };

  // Initialize slider position when tab bar width is available or index changes
  useEffect(() => {
    if (tabBarWidth > 0) {
      const shouldAnimate = isInitialized;
      updateSliderPosition(tabBarWidth, state.index, shouldAnimate);
    }
  }, [state.index, tabBarWidth, isInitialized]);

  return (
    <View 
      ref={tabBarRef}
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: Platform.OS === 'ios' ? 20 : 12,
        height: Platform.OS === 'ios' ? 85 : 70,
        borderRadius: 40,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        overflow: 'visible',
      }}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0) {
          updateSliderPosition(width, state.index, false);
        }
      }}
    >
      {/* Tab Bar Background - solid white */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.white,
        borderRadius: 40,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }} />

      {/* Sliding Indicator - Box around icon */}
      {sliderWidth > 0 && tabBarWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 8,
            left: 0,
            width: sliderWidth,
            height: Platform.OS === 'ios' ? 60 : 50,
            transform: [{ translateX: sliderPosition }],
            zIndex: 1,
            opacity: opacity,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 20,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          />
        </Animated.View>
      )}

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Members') {
          iconName = isFocused ? 'people' : 'people-outline';
        } else if (route.name === 'Schedules') {
          iconName = isFocused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Projects') {
          iconName = isFocused ? 'briefcase' : 'briefcase-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person-circle' : 'person-circle-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 20 : 12,
              zIndex: 10,
            }}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? colors.white : colors.secondaryText} 
            />
            {options.tabBarLabel && (
              <View style={{ marginTop: 4 }}>
                {typeof label === 'string' ? (
                  <View
                    style={{
                      backgroundColor: isFocused ? colors.primary : 'transparent',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                    }}
                  >
                    {typeof options.tabBarLabel === 'function' ? (
                      options.tabBarLabel({ focused: isFocused, color: isFocused ? colors.white : 'rgba(255,255,255,0.8)', position: 'below-icon', children: label })
                    ) : (
                      <View style={{ opacity: 0, height: 0 }} />
                    )}
                  </View>
                ) : (
                  label
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainBottomTab() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevIndexRef = useRef(0);
  const [transitionMode, setTransitionMode] = useState<'press' | 'swipe' | 'none'>('none');

  const navigation = useNavigation<any>();
  const routeOrder = ['Home', 'Members', 'Schedules', 'Projects', 'Profile'];
  const navigateToIndex = (idx: number) => {
    const name = routeOrder[idx];
    if (name) {
      // Mark swipe transition when navigation triggered via SwipeNavigator
      setTransitionMode('swipe');
      navigation.navigate(name as never);
    }
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        // Keep tabs mounted and render immediately to avoid lag when swiping
        unmountOnBlur: false,
        lazy: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Members') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Schedules') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarShowLabel: false,
        // Use a solid app background to avoid perceived blank screens
        // when a child screen fails to render its own gradient.
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
      })}
      screenListeners={{
        state: (e) => {
          const idx = e.data?.state?.index ?? 0;
          prevIndexRef.current = activeIndex;
          setActiveIndex(idx);
          // Reset transition mode after state settles
          setTransitionMode('none');
        },
      }}
    >
      <Tab.Screen name="Home">
        {() => (
          <SwipeNavigator
            index={0}
            activeIndex={activeIndex}
            routeNames={routeOrder}
            navigateToIndex={navigateToIndex}
            // Allow peeking the next page while dragging
            nextContent={<MembersScreen />}
          >
            <SlideScreenWrapper index={0} activeIndex={activeIndex} prevIndex={prevIndexRef.current} transitionMode={transitionMode}>
              <HomeScreen />
            </SlideScreenWrapper>
          </SwipeNavigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Members">
        {() => (
          <SwipeNavigator
            index={1}
            activeIndex={activeIndex}
            routeNames={routeOrder}
            navigateToIndex={navigateToIndex}
            prevContent={<HomeScreen />}
            nextContent={<SchedulesScreen />}
          >
            <SlideScreenWrapper index={1} activeIndex={activeIndex} prevIndex={prevIndexRef.current} transitionMode={transitionMode}>
              <MembersScreen />
            </SlideScreenWrapper>
          </SwipeNavigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Schedules">
        {(screenProps) => (
          <SwipeNavigator
            index={2}
            activeIndex={activeIndex}
            routeNames={routeOrder}
            navigateToIndex={navigateToIndex}
            prevContent={<MembersScreen />}
            nextContent={<ProjectsScreen {...screenProps} />}
          >
            <SlideScreenWrapper index={2} activeIndex={activeIndex} prevIndex={prevIndexRef.current} transitionMode={transitionMode}>
              <SchedulesScreen {...screenProps} />
            </SlideScreenWrapper>
          </SwipeNavigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Projects">
        {(screenProps) => (
          <SwipeNavigator
            index={3}
            activeIndex={activeIndex}
            routeNames={routeOrder}
            navigateToIndex={navigateToIndex}
            prevContent={<SchedulesScreen {...screenProps} />}
            nextContent={<ProfileScreen {...screenProps} />}
          >
            <SlideScreenWrapper index={3} activeIndex={activeIndex} prevIndex={prevIndexRef.current} transitionMode={transitionMode}>
              <ProjectsScreen {...screenProps} />
            </SlideScreenWrapper>
          </SwipeNavigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(screenProps) => (
          <SwipeNavigator
            index={4}
            activeIndex={activeIndex}
            routeNames={routeOrder}
            navigateToIndex={navigateToIndex}
            prevContent={<ProjectsScreen {...screenProps} />}
          >
            <SlideScreenWrapper index={4} activeIndex={activeIndex} prevIndex={prevIndexRef.current} transitionMode={transitionMode}>
              <ProfileScreen {...screenProps} />
            </SlideScreenWrapper>
          </SwipeNavigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


