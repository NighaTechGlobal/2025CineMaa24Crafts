import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/tokens';

interface PremiumModalProps {
    visible: boolean;
    userType: 'artist' | 'recruiter';
    onClose: () => void;
    onUpgrade: () => void;
    onSkip: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
    visible,
    userType,
    onClose,
    onUpgrade,
    onSkip,
}) => {
    // Get title, price and benefits based on user type
    const getTitle = () => {
        return userType === 'artist'
            ? 'Upgrade to Artist Premium'
            : 'Upgrade to Recruiter Premium';
    };

    const getPrice = () => {
        return userType === 'artist' ? '₹1,200' : '₹3,600';
    };

    const getBenefits = () => {
        if (userType === 'artist') {
            return [
                'Priority job alerts',
                'Verified badge',
                'Featured listing top 5',
                'Contact reveal',
                'Priority support'
            ];
        } else {
            return [
                'Priority talent search',
                'Direct inbox',
                'Bulk messaging',
                'Verified company badge',
                'Advanced analytics'
            ];
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={[colors.primary, '#7b3bbf']}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={28} color={colors.white} />
                    </TouchableOpacity>

                    {/* Premium Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                            style={styles.iconGradient}
                        >
                            <Ionicons 
                                name={userType === 'artist' ? 'star' : 'trophy'} 
                                size={80} 
                                color={colors.white} 
                            />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{getTitle()}</Text>
                    <Text style={styles.subtitle}>Unlock Premium Features</Text>

                    {/* Price Card */}
                    <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Only</Text>
                        <Text style={styles.price}>{getPrice()}</Text>
                        <Text style={styles.pricePeriod}>per year</Text>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <Text style={styles.benefitsTitle}>What You'll Get:</Text>
                        {getBenefits().map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <View style={styles.checkIconContainer}>
                                    <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                                </View>
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.upgradeButton} 
                            onPress={onUpgrade}
                            activeOpacity={0.8}
                        >
                        <LinearGradient
                                colors={[colors.white, colors.surfaceLight]}
                                style={styles.upgradeGradient}
                            >
                                <Ionicons 
                                    name="diamond" 
                                    size={20} 
                                    color={colors.primary} 
                                />
                                <Text style={[styles.upgradeButtonText, { color: colors.primary }]}>Upgrade Now</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.skipButton} 
                            onPress={onSkip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.xl,
        paddingTop: 60,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: spacing.lg,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        alignSelf: 'center',
        marginBottom: spacing.xl,
    },
    iconGradient: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        lineHeight: 36,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.white,
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: spacing.xl,
    },
    priceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    priceLabel: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.white,
        opacity: 0.8,
    },
    price: {
        fontSize: 48,
        lineHeight: 56,
        color: colors.white,
        marginVertical: spacing.xs,
    },
    pricePeriod: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.white,
        opacity: 0.8,
    },
    benefitsContainer: {
        marginBottom: spacing.xxxl,
    },
    benefitsTitle: {
        fontSize: 18,
        lineHeight: 24,
        color: colors.white,
        marginBottom: spacing.lg,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    checkIconContainer: {
        marginRight: spacing.md,
    },
    benefitText: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.white,
        flex: 1,
    },
    buttonContainer: {
        gap: spacing.md,
    },
    upgradeButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    upgradeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    upgradeButtonText: {
        fontSize: 18,
        lineHeight: 24,
    },
    skipButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.white,
        opacity: 0.7,
    },
});

export default PremiumModal;




