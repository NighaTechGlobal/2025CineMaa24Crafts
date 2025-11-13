import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../styles/tokens';

interface FloatingBottomNavProps {
    onHomePress?: () => void;
    onSearchPress?: () => void;
    onCenterPress?: () => void;
    onProfilePress?: () => void;
    onNotificationsPress?: () => void;
}

const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
    onHomePress,
    onSearchPress,
    onCenterPress,
    onProfilePress,
    onNotificationsPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                {/* Left Icons */}
                <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
                    <View style={styles.iconPlaceholder} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={onSearchPress}>
                    <View style={styles.iconPlaceholder} />
                </TouchableOpacity>

                {/* Center CTA */}
                <TouchableOpacity
                    style={styles.centerCTA}
                    onPress={onCenterPress}
                    activeOpacity={0.8}
                >
                    <View style={styles.ctaInner} />
                </TouchableOpacity>

                {/* Right Icons */}
                <TouchableOpacity style={styles.navItem} onPress={onNotificationsPress}>
                    <View style={styles.iconPlaceholder} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={onProfilePress}>
                    <View style={styles.iconPlaceholder} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        right: spacing.lg,
        alignItems: 'center',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6,
        width: '100%',
    },
    navItem: {
        padding: spacing.sm,
        minWidth: 40,
        alignItems: 'center',
    },
    centerCTA: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primaryText,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        marginHorizontal: spacing.md,
    },
    ctaInner: {
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: colors.white,
    },
    iconPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.secondaryText,
    },
});

export default FloatingBottomNav;




