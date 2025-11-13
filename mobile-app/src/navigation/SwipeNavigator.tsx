import React, { useMemo, useEffect } from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import { colors } from '../styles/tokens';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  index: number; // current tab index for this screen
  activeIndex: number; // currently active tab index
  routeNames: string[]; // ordered route names in bottom tabs
  navigateToIndex: (idx: number) => void; // navigation callback
  threshold?: number; // swipe threshold in px
  prevContent?: React.ReactNode; // optional content to the left for peeking
  nextContent?: React.ReactNode; // optional content to the right for peeking
};

const { width: windowWidth } = Dimensions.get('window');

export default function SwipeNavigator({
  children,
  index,
  activeIndex,
  routeNames,
  navigateToIndex,
  threshold,
  prevContent,
  nextContent,
}: Props) {
  const translateX = useSharedValue(0);
  const velocityX = useSharedValue(0);

  const isFirst = useMemo(() => index === 0, [index]);
  const isLast = useMemo(() => index === routeNames.length - 1, [index, routeNames.length]);
  const hasPrev = !!prevContent;
  const hasNext = !!nextContent;

  const onNavigatePrev = () => {
    const target = Math.max(0, activeIndex - 1);
    if (target !== activeIndex) navigateToIndex(target);
  };
  const onNavigateNext = () => {
    const target = Math.min(routeNames.length - 1, activeIndex + 1);
    if (target !== activeIndex) navigateToIndex(target);
  };

  const startX = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .enabled(activeIndex === index)
    .activeOffsetX([-4, 4])
    .activeOffsetY([-6, 6])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      let x = startX.value + e.translationX;
      // Edge resistance: damp movement when swiping where no sibling exists
      if ((!hasPrev || isFirst) && x > 0) {
        x = x * 0.2; // damp right swipe if no previous
      }
      if ((!hasNext || isLast) && x < 0) {
        x = x * 0.2; // damp left swipe if no next
      }
      // lightweight clamp to avoid jitter when gesture exceeds screen width
      const maxDrag = windowWidth;
      if (x > maxDrag) x = maxDrag;
      if (x < -maxDrag) x = -maxDrag;
      translateX.value = x;
      velocityX.value = e.velocityX;
    })
    .onEnd(() => {
      const x = translateX.value;
      const vx = velocityX.value;
      const velocityTrigger = 800;
      const thresholdPx = threshold ?? Math.max(60, Math.floor(windowWidth * 0.15));
      const goPrev = (x > thresholdPx || vx > velocityTrigger) && !isFirst;
      const goNext = (x < -thresholdPx || vx < -velocityTrigger) && !isLast;
      if (goPrev) {
        translateX.value = withTiming(windowWidth, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished) {
            runOnJS(onNavigatePrev)();
          }
        });
      } else if (goNext) {
        translateX.value = withTiming(-windowWidth, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        }, (finished) => {
          if (finished) {
            runOnJS(onNavigateNext)();
          }
        });
      } else {
        translateX.value = withTiming(0, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  // Single page layout (peeking disabled)
  const pagesCount = 1 + (hasPrev ? 1 : 0) + (hasNext ? 1 : 0);
  const initialOffset = hasPrev ? -windowWidth : 0;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + initialOffset }],
  }));

  // Reset translate when this page becomes active to avoid residual offset
  useEffect(() => {
    translateX.value = 0;
  }, [activeIndex, index]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, { width: windowWidth * pagesCount }, animatedStyle]}>
        {hasPrev && <View style={styles.page}>{prevContent}</View>}
        <View style={styles.page}>{children}</View>
        {hasNext && <View style={styles.page}>{nextContent}</View>}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
    backgroundColor: colors.background,
    alignItems: 'stretch',
  },
  page: {
    width: windowWidth,
    flex: 1,
    flexShrink: 0,
    height: '100%',
  },
});
