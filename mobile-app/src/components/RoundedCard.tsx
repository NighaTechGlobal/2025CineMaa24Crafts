import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';

interface RoundedCardProps {
    variant?: 'hero' | 'small' | 'large';
    title?: string;
    subtitle?: string;
    imageSource?: string;
    onPress?: () => void;
    showBookmark?: boolean;
}

const RoundedCard: React.FC<RoundedCardProps> = ({
    variant = 'small',
    title,
    subtitle,
    imageSource,
    onPress,
    showBookmark = false,
}) => {
    const getCardStyle = () => {
        switch (variant) {
            case 'hero':
                return styles.heroCard;
            case 'large':
                return styles.largeCard;
            default:
                return styles.smallCard;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'hero':
                return styles.heroText;
            case 'large':
                return styles.largeText;
            default:
                return styles.smallText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, getCardStyle()]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Card Image */}
            {imageSource ? (
                <Image source={{ uri: imageSource }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, styles.placeholderImage]} />
            )}

            {/* Bookmark Icon */}
            {showBookmark && (
                <View style={styles.bookmark}>
                    {/* In a real implementation, you would use an actual icon component */}
                    <View style={styles.bookmarkIcon} />
                </View>
            )}

            {/* Card Content */}
            <View style={styles.content}>
                {title && <Text style={[styles.title, getTextStyle()]}>{title}</Text>}
                {subtitle && <Text style={[styles.subtitle, getTextStyle()]}>{subtitle}</Text>}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6,
    },
    smallCard: {
        width: 120,
        height: 160,
    },
    largeCard: {
        width: '100%',
        height: 200,
        marginBottom: spacing.lg,
    },
    heroCard: {
        width: '100%',
        height: 280,
        marginBottom: spacing.lg,
    },
    image: {
        width: '100%',
        height: '70%',
    },
    placeholderImage: {
        backgroundColor: colors.accentInactive,
    },
    bookmark: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    bookmarkIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.secondaryText,
    },
    content: {
        padding: spacing.md,
    },
    title: {
        color: colors.primaryText,
        },
    subtitle: {
        color: colors.secondaryText,
        marginTop: spacing.xs,
    },
    smallText: {
        fontSize: fontSize.caption,
    },
    largeText: {
        fontSize: fontSize.body,
    },
    heroText: {
        fontSize: fontSize.body,
    },
});

export default RoundedCard;




