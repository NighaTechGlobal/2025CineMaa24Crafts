import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Platform, StatusBar, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../styles/tokens';
import HomeFeedPost from './HomeFeedPost';
import { fetchPosts, Post } from '../../services/postsApi';
import { getAuthProfile, listPosts, getProfile } from '../../services/api';
import HeaderBar from '../../components/HeaderBar';

type FilterType = 'relevant' | 'all';

interface PostWithDepartment extends Post {
    department?: string;
    departments?: string[];
}

type RootStackParamList = {
    PostDetail: { postId: string };
    [key: string]: any;
};

type ArtistHomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ArtistHomeScreen: React.FC = () => {
    const navigation = useNavigation<ArtistHomeScreenNavigationProp>();
    const [allPosts, setAllPosts] = useState<PostWithDepartment[]>([]);
    const [artistDepartment, setArtistDepartment] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('relevant');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const sliderPosition = useRef(new Animated.Value(0)).current;
    const [containerWidth, setContainerWidth] = useState(0);

    // Load artist profile to get department
    useEffect(() => {
        const loadArtistProfile = async () => {
            try {
                const response = await getAuthProfile();
                let dept: string | null = response.profile?.department || null;
                if (!dept && response.profile?.id) {
                    const full = await getProfile(response.profile.id);
                    const artist = Array.isArray(full?.artist_profiles)
                        ? (full.artist_profiles?.[0] || {})
                        : (full?.artist_profiles || {});
                    const recruiter = Array.isArray(full?.recruiter_profiles)
                        ? (full.recruiter_profiles?.[0] || {})
                        : (full?.recruiter_profiles || {});
                    dept = artist?.department ?? recruiter?.department ?? full?.department ?? null;
                }
                setArtistDepartment(dept);
            } catch (error) {
                console.error('Error loading artist profile:', error);
            }
        };
        loadArtistProfile();
    }, []);

    // Fetch posts with department information
    const loadPosts = async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            console.log(`Loading posts with refresh=${refresh}, page=${page}`);
            // Use listPosts API to get posts, optionally filtered by artist department when on Relevant
            const deptParam = filterType === 'relevant' && artistDepartment ? artistDepartment : undefined;
            const response = await listPosts(undefined, 10, undefined, undefined, deptParam);
            const rawPosts = response.data || [];
            
            // Transform posts to include department (base64-only image)
            const newPosts: PostWithDepartment[] = rawPosts.map((post: any) => {
                const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                return {
                    id: post.id,
                    author: {
                        id: post.author_profile_id || profile?.id || 'unknown',
                        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
                        avatarUrl: profile?.profile_pic || profile?.profile_photo_url || 'https://via.placeholder.com/40',
                        isVerified: profile?.is_premium || false,
                    },
                    image: post.image_url || undefined,
                    caption: post.caption || post.description || post.title || '',
                    savedByMe: false,
                    timestamp: post.created_at,
                    projectId: post.id,
                    department: post.department || undefined,
                    departments: Array.isArray(post.departments) ? post.departments : undefined,
                };
            });
            
            console.log(`Received ${newPosts.length} posts`);
            
            if (refresh) {
                setAllPosts(newPosts);
                setPage(1);
            } else {
                // Avoid duplicates by checking if posts already exist
                setAllPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
                setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // Load posts on first mount
    useEffect(() => {
        console.log('Loading initial posts');
        loadPosts();
    }, []);

    // Re-load when filter or artist department changes (ensures Relevant tab reflects department)
    useEffect(() => {
        if (filterType === 'relevant') {
            console.log('Filter/Department changed, refreshing relevant posts');
            loadPosts(true);
        }
    }, [filterType, artistDepartment]);

    // Handle refresh
    const onRefresh = () => {
        console.log('Refreshing posts');
        loadPosts(true);
    };

    // Handle end reached
    const onEndReached = () => {
        if (!loading) {
            console.log('Loading more posts');
            loadPosts();
        }
    };

    // Handle post press - navigate to project details
    const handlePostPress = (postId: string) => {
        console.log(`View project details with ID: ${postId}`);
        if (!postId || postId === 'undefined') {
            console.error('Invalid post ID:', postId);
            return;
        }
        navigation.navigate('PostDetail', { postId });
    };

    // Handle author press
    const handleAuthorPress = (authorId: string) => {
        if (__DEV__) console.log(`View author ${authorId}`);
        // TODO: Navigate to author profile
    };

    // Handle view schedules (artist only)
    const handleViewSchedules = () => {
        console.log('View schedules');
        (navigation as any).navigate('Schedules');
    };

    // Handle view projects (artist only)
    const handleViewProjects = () => {
        console.log('View projects');
        (navigation as any).navigate('Projects');
    };

    // Handle filter change with smooth animation
    const handleFilterChange = (newFilter: FilterType) => {
        if (containerWidth > 0) {
            // Calculate the position: each tab takes 50% of container width
            const tabWidth = containerWidth / 2;
            const targetPosition = newFilter === 'relevant' ? spacing.xs : tabWidth + spacing.xs;
            
            // Animate slider position
            Animated.timing(sliderPosition, {
                toValue: targetPosition,
                duration: 220,
                easing: (require('react-native').Easing as any).out((require('react-native').Easing as any).cubic),
                useNativeDriver: true,
            }).start();
        }
        setFilterType(newFilter);
    };

    // Filter posts based on selected filter type
    const filteredPosts = useMemo(() => {
        if (filterType !== 'relevant' || !artistDepartment) return allPosts;
        const dept = artistDepartment.toLowerCase().trim();
        return allPosts.filter((p) => {
            const tokens: string[] = (() => {
                if (Array.isArray(p.departments) && p.departments.length > 0) {
                    return p.departments.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
                }
                if (p.department) {
                    return String(p.department)
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .filter(Boolean);
                }
                return [];
            })();
            return tokens.includes(dept);
        });
    }, [allPosts, filterType, artistDepartment]);

    return (
        <View style={styles.container}>
            <HeaderBar 
                title="Home" 
                rightIconName="chatbubble-ellipses-outline"
                onRightPress={() => (navigation as any).navigate('ChatList')}
            />
            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <View style={{ height: 6 }} />
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity style={styles.quickActionCard} onPress={handleViewSchedules}>
                            <View style={styles.quickActionIcon}>
                                <Text style={styles.quickActionIconText}>📅</Text>
                            </View>
                            <Text style={styles.quickActionText}>My Schedules</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickActionCard} onPress={handleViewProjects}>
                            <View style={styles.quickActionIcon}>
                                <Text style={styles.quickActionIconText}>💼</Text>
                            </View>
                            <Text style={styles.quickActionText}>My Projects</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View 
                    style={styles.filterContainer}
                    onLayout={(e) => {
                        const { width } = e.nativeEvent.layout;
                        if (width > 0 && width !== containerWidth) {
                            setContainerWidth(width);
                            // Initialize slider position
                            if (filterType === 'relevant') {
                                sliderPosition.setValue(0);
                            } else {
                                sliderPosition.setValue(width / 2);
                            }
                        }
                    }}
                >
                    {/* Sliding indicator */}
                    {containerWidth > 0 && (
                        <Animated.View
                            style={[
                                styles.filterSlider,
                                {
                                    transform: [
                                        {
                                            translateX: sliderPosition,
                                        },
                                    ],
                                },
                            ]}
                        />
                    )}
                    <TouchableOpacity
                        style={styles.filterTab}
                        onPress={() => handleFilterChange('relevant')}
                    >
                        <Text style={[styles.filterTabText, filterType === 'relevant' && styles.filterTabTextActive]}>
                            Relevant
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.filterTab}
                        onPress={() => handleFilterChange('all')}
                    >
                        <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
                            All Jobs
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Posts */}
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => (
                        <View key={post.id} style={index !== filteredPosts.length - 1 ? styles.postSpacing : null}>
                            <HomeFeedPost
                                post={post}
                                onPostPress={handlePostPress}
                                onAuthorPress={handleAuthorPress}
                            />
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            {filterType === 'relevant' 
                                ? 'No relevant posts found' 
                                : 'No posts yet'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 16 : 12,
        paddingHorizontal: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 130 : 110,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: fontSize.h4,
        fontWeight: '700',
        color: colors.primaryText,
        marginBottom: spacing.md,
        letterSpacing: -0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        flex: 1,
        ...shadows.medium,
    },
    statValue: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: fontSize.caption,
        color: colors.secondaryText,
        textAlign: 'center',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    quickActionCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        flex: 1,
        alignItems: 'center',
        ...shadows.medium,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryUltraLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    quickActionIconText: {
        fontSize: 24,
    },
    quickActionText: {
        fontSize: fontSize.caption,
        fontWeight: '600',
        color: colors.primaryText,
        textAlign: 'center',
    },
    feedHeader: {
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    feedTitle: {
        fontSize: fontSize.h4,
        fontWeight: '700',
        color: colors.primaryText,
        letterSpacing: -0.5,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: 4,
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    filterSlider: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: (Dimensions.get('window').width - spacing.lg * 2 - 16) / 2,
        height: '100%' as any,
        backgroundColor: colors.white,
        borderRadius: borderRadius.sm,
        ...shadows.small,
        zIndex: 0,
    },
    filterTab: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    filterTabActive: {
        backgroundColor: 'transparent',
    },
    filterTabText: {
        fontSize: fontSize.caption,
        color: colors.textLight,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    postSpacing: {
        marginBottom: spacing.md,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: spacing.xl,
    },
    emptyStateText: {
        fontSize: fontSize.body,
        color: colors.textLight,
        textAlign: 'center',
    },
});

export default ArtistHomeScreen;
