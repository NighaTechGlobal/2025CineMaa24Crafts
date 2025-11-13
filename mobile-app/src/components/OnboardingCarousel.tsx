import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, fontSize, animation } from '../styles/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingCard {
    id: number;
    title: string;
    subtitle: string;
    image?: any;
    icon?: string;
    backgroundColor?: string;
    // Use a readonly tuple to satisfy LinearGradient’s colors typing
    gradientColors?: readonly [string, string];
}

interface OnboardingCarouselProps {
    cards: OnboardingCard[];
    onDone: () => void;
}

const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
    cards,
    onDone,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / SCREEN_WIDTH);
        setActiveIndex(index);
    };

    const handleNext = () => {
        if (activeIndex < cards.length - 1) {
            const nextIndex = activeIndex + 1;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * SCREEN_WIDTH,
                animated: true,
            });
            setActiveIndex(nextIndex);
        } else {
            onDone();
        }
    };

    const handleSkip = () => {
        onDone();
    };

    const renderPagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {cards.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === activeIndex && styles.activePaginationDot,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>

            {/* Scrollable Carousel */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {cards.map((card) => (
                    <View key={card.id} style={styles.cardContainer}>
                        {/* Background image covering the card */}
                        {card.image ? (
                            <ImageBackground source={card.image} style={styles.backgroundImage} resizeMode="cover" />
                        ) : (
                            <LinearGradient
                                colors={card.gradientColors ?? ([colors.primaryDark, colors.primary] as const)}
                                style={styles.backgroundImage}
                            />
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {/* Pagination */}
                {renderPagination()}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <View style={styles.nextButtonGradient}>
                            <Text style={styles.nextButtonText}>
                                {activeIndex === cards.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                            <Text style={styles.nextButtonArrow}>→</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    scrollView: {
        flex: 1,
    },
    cardContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    backgroundImage: {
        width: '100%',
        height: SCREEN_HEIGHT,
        resizeMode: 'cover',
    },
    bottomSection: {
        paddingBottom: spacing.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingTop: spacing.lg,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 4,
    },
    activePaginationDot: {
        backgroundColor: colors.primary,
        width: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    skipButton: {
        padding: spacing.md,
    },
    skipButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        },
    nextButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 25,
        backgroundColor: colors.primaryDark,
    },
    nextButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginRight: spacing.sm,
    },
    nextButtonArrow: {
        fontSize: 18,
        color: '#FFFFFF',
        },
});

export default OnboardingCarousel;




