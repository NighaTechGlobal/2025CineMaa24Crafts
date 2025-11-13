import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing, borderRadius, shadows } from '../styles/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');
const minSide = Math.min(width, height);
const circleSize1 = Math.round(minSide * 0.6);
const circleSize2 = Math.round(minSide * 0.5);
const logoBgSize = Math.round(minSide * 0.22);
const logoSize = Math.round(minSide * 0.16);

type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Welcome: undefined;
    Login: undefined;
    ArtistSignup: undefined;
    RecruiterSignup: undefined;
    Main: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();

    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.3)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Complex entrance animation
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 40,
                friction: 8,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Shimmer effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const timer = setTimeout(() => {
            navigation.navigate('Onboarding');
        }, 2500);
        return () => clearTimeout(timer);
    }, [navigation]);

    const shimmerTranslate = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primaryLight, colors.primary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative circles */}
            <Animated.View style={[styles.circle, styles.circle1, { opacity: fade, transform: [{ scale }], width: circleSize1, height: circleSize1, borderRadius: circleSize1 / 2 }]} />
            <Animated.View style={[styles.circle, styles.circle2, { opacity: fade, transform: [{ scale }], width: circleSize2, height: circleSize2, borderRadius: circleSize2 / 2 }]} />

            <Animated.View style={{ opacity: fade, alignItems: 'center', transform: [{ scale: logoScale }] }}>
                {/* Logo container with glassmorphism */}
                <View style={styles.logoContainer}>
                    <View style={[styles.logoBackground, { width: logoBgSize, height: logoBgSize, borderRadius: logoBgSize / 2 }]}>
                        <Image source={require('../assets/logo.png')} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
                    </View>
                    
                    {/* Shimmer overlay */}
                    <Animated.View
                        style={[
                            styles.shimmerOverlay,
                            {
                                width: logoBgSize,
                                transform: [{ translateX: shimmerTranslate }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>

                <Text style={styles.title}>24Krafts</Text>
                <Text style={styles.subtitle}>Movie Industry Hub</Text>
                
                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: shimmer.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0.3, 1, 0.3],
                                }),
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: shimmer.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [1, 0.3, 1],
                                }),
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: shimmer.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0.3, 1, 0.3],
                                }),
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle1: {
        top: -height * 0.12,
        left: -width * 0.12,
    },
    circle2: {
        bottom: -height * 0.1,
        right: -width * 0.1,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: spacing.xl,
        overflow: 'hidden',
        borderRadius: borderRadius.xxl,
    },
    logoBackground: {
        borderRadius: borderRadius.xxl,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.xl,
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    title: {
        fontSize: 42,
        fontWeight: '700',
        color: colors.white,
        marginTop: spacing.lg,
        letterSpacing: -1,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: spacing.xs,
        letterSpacing: 1,
    },
    loadingContainer: {
        flexDirection: 'row',
        marginTop: spacing.xxxl,
        gap: spacing.sm,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.white,
    },
});

export default SplashScreen;






