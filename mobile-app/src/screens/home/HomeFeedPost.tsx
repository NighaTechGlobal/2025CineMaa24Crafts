import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { asImageUri } from '@/utils/images';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';
import { Post } from '../../services/postsApi';

interface HomeFeedPostProps {
    post: Post;
    onPostPress: (postId: string) => void;
    onAuthorPress: (authorId: string) => void;
}

const HomeFeedPost: React.FC<HomeFeedPostProps> = ({
    post,
    onPostPress,
    onAuthorPress,
}) => {
    // Animation values
    const translateY = useSharedValue(0);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value }
            ],
        };
    });

    // Handle post press (for lift effect and navigation)
    const handlePostPressIn = () => {
        translateY.value = withTiming(-6, { duration: 70 });
    };

    const handlePostPressOut = () => {
        translateY.value = withTiming(0, { duration: 70 });
    };

    const handlePostPress = () => {
        console.log('HomeFeedPost: Pressing post with ID:', post.id);
        console.log('HomeFeedPost: Full post object:', JSON.stringify(post, null, 2));
        onPostPress(post.id);
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Unknown';
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    // Render caption with mentions/hashtags
    const renderCaption = () => {
        if (!post.caption) return null;
        
        const words = post.caption.split(' ');
        const captionWords = words.slice(0, 20); // Show first 20 words

        return (
            <Text style={styles.caption}>
                <Text style={styles.authorName}>{post.author.name}</Text>{' '}
                {captionWords.map((word, index) => (
                    <Text
                        key={index}
                        style={
                            word.startsWith('#') || word.startsWith('@')
                                ? styles.mention
                                : styles.captionText
                        }
                    >
                        {word}{' '}
                    </Text>
                ))}
                {words.length > 20 && (
                    <Text style={styles.seeMore}>
                        ...
                    </Text>
                )}
            </Text>
        );
    };

    return (
        <TouchableOpacity
            onPress={handlePostPress}
            onPressIn={handlePostPressIn}
            onPressOut={handlePostPressOut}
            activeOpacity={0.95}
            // Make touch feel more forgiving during vertical scrolls
            pressRetentionOffset={{ top: 24, left: 24, right: 24, bottom: 24 }}
            delayPressIn={20}
        >
            <Animated.View style={[styles.container, animatedStyle]}>
                {/* Post header */}
                <View style={styles.postHeader}>
                    <TouchableOpacity
                        style={styles.authorContainer}
                        onPress={() => onAuthorPress(post.author.id)}
                    >
                        <Image source={{ uri: post.author.avatarUrl }} style={styles.avatar} />
                        <View>
                            <View style={styles.authorNameContainer}>
                                <Text style={styles.authorName}>{post.author.name}</Text>
                                {post.author.isVerified && (
                                    <View style={styles.verifiedBadge} />
                                )}
                            </View>
                            <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Post image or reserved space */}
                {post.image ? (
                    <Image source={{ uri: asImageUri(post.image) }} style={styles.postImage} resizeMode="cover" />
                ) : (
                    <View style={styles.postImagePlaceholder} />
                )}

                {/* Post content */}
                <View style={styles.postContent}>
                    {renderCaption()}
                </View>

                {/* View Details */}
                <View style={styles.viewDetailsContainer}>
                    <Text style={styles.viewDetailsText}>Tap to view project details →</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.white,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: spacing.md,
        backgroundColor: colors.surfaceLight,
    },
    authorNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorName: {
        fontSize: fontSize.body,
        color: colors.text,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    verifiedBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.primary,
        marginLeft: 6,
    },
    timestamp: {
        fontSize: fontSize.small,
        color: colors.textLight,
        marginTop: 2,
    },
    postContent: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    postImage: {
        width: '100%',
        height: 320,
        backgroundColor: colors.surfaceLight,
    },
    postImagePlaceholder: {
        width: '100%',
        height: 320,
        backgroundColor: colors.surfaceLight,
    },
    viewDetailsContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.surfaceLight,
        borderTopWidth: 0,
    },
    viewDetailsText: {
        fontSize: fontSize.caption,
        color: colors.primary,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    caption: {
        marginBottom: 0,
        lineHeight: 22,
    },
    captionText: {
        fontSize: fontSize.body,
        color: colors.text,
        lineHeight: 22,
    },
    mention: {
        fontSize: fontSize.body,
        color: colors.primary,
        fontWeight: '600',
    },
    seeMore: {
        fontSize: fontSize.body,
        color: colors.textLight,
    },
});

export default HomeFeedPost;






