import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';

const { width, height } = Dimensions.get('window');
const minSide = Math.min(width, height);
const decorSize1 = Math.round(minSide * 0.65);
const decorSize2 = Math.round(minSide * 0.55);
const logoCardSize = Math.round(minSide * 0.18);
const logoImgSize = Math.round(minSide * 0.14);
const topPad = Math.max(height * 0.02, spacing.lg);
const bottomPad = Math.max(height * 0.08, spacing.xl);
const logoMarginBottom = Math.round(minSide * 0.04);


export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Complex entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleGetStarted = () => {
    // Navigate to Login screen
    navigation.navigate('Login');
  };


  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />

      {/* Modern mesh gradient circles */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle1,
          { width: decorSize1, height: decorSize1, borderRadius: decorSize1 / 2, transform: [{ rotate: spin }, { scale: 1.2 }] },
        ]}
      >
        <View style={[styles.circleGradient, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeCircle,
          styles.circle2,
          { width: decorSize2, height: decorSize2, borderRadius: decorSize2 / 2, transform: [{ rotate: spin }, { scale: 0.8 }] },
        ]}
      >
        <View style={[styles.circleGradient, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]} />
      </Animated.View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
          }}
        >
        {/* Modern Logo Card */}
        <View style={[styles.logoContainer, { marginBottom: logoMarginBottom }]}>
          <View style={[styles.logoGradient, { width: logoCardSize, height: logoCardSize, borderRadius: logoCardSize / 2 }]}>
            <Image source={require('../assets/logo.png')} style={{ width: logoImgSize, height: logoImgSize }} resizeMode="contain" />
          </View>
        </View>

        {/* Modern Welcome Text */}
        <Text style={styles.title}>Welcome to{'\n'}24Krafts</Text>
        <Text style={styles.subtitle}>
          Your Gateway to Movie Industry{'\n'}Connect • Collaborate • Create
        </Text>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <FeatureCard
            icon="people"
            title="Connect"
            description="Network with industry professionals"
            delay={200}
          />
          <FeatureCard
            icon="briefcase"
            title="Opportunities"
            description="Find exciting projects and roles"
            delay={400}
          />
          <FeatureCard
            icon="calendar"
            title="Organize"
            description="Manage schedules effortlessly"
            delay={600}
          />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <View style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={22} color={colors.primary} />
          </View>
        </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
    </View>
  );
}

const FeatureCard = ({
  icon,
  title,
  description,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={28} color={colors.primary} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
  },
  circle1: {
    top: -height * 0.12,
    right: -width * 0.12,
  },
  circle2: {
    bottom: -height * 0.15,
    left: -width * 0.15,
  },
  circleGradient: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
  },
  logoGradient: {
    borderRadius: borderRadius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: spacing.xl * 1.5,
    letterSpacing: 0.3,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    minHeight: 92,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.small,
  },
  featureTextContainer: {
    flex: 1,
    paddingLeft: spacing.sm,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.white,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  button: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.xl,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.primary,
    letterSpacing: 0.5,
  },
});







