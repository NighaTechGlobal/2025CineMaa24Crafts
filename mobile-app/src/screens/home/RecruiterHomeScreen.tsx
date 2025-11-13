import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../styles/tokens';
import HomeFeedPost from './HomeFeedPost';
import { fetchPosts, Post } from '../../services/postsApi';
import { getAuthProfile, listPosts, listSchedules } from '../../services/api';
import HeaderBar from '../../components/HeaderBar';

const RecruiterHomeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [posts, setPosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [projectCount, setProjectCount] = useState<number>(0);
    const [scheduleCount, setScheduleCount] = useState<number>(0);

    // Fetch posts
    const loadPosts = async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            console.log(`Loading posts with refresh=${refresh}, page=${page}`);
            const newPosts = await fetchPosts(refresh ? 0 : page * 10, 10);
            console.log(`Received ${newPosts.length} posts`);
            if (refresh) {
                setPosts(newPosts);
                setPage(1);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
                setPage(prev => prev + 1);
            }
            console.log(`Total posts now: ${posts.length}`);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    // Load initial posts
    useEffect(() => {
        console.log('Loading initial posts');
        loadPosts();
    }, []);

    // Load dashboard stats (projects and schedules)
    const loadStats = async () => {
        try {
            const profileResp = await getAuthProfile();
            const profileId = profileResp?.profile?.id;

            if (!profileId) {
                console.warn('RecruiterHomeScreen: No profile ID found for auth user');
                return;
            }

            // Projects created by this recruiter
            try {
                const projectsResp = await listPosts(undefined, 100, profileId);
                const count = (projectsResp?.data || []).length;
                setProjectCount(count);
            } catch (e) {
                console.error('Error loading project count:', e);
            }

            // Schedules for this recruiter
            // Backend is expected to scope schedules to current recruiter when no filters are provided
            try {
                const schedulesResp = await listSchedules(undefined, 100);
                const sCount = (schedulesResp?.data || []).length;
                setScheduleCount(sCount);
            } catch (e) {
                console.error('Error loading schedule count:', e);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // Handle refresh
    const onRefresh = () => {
        console.log('Refreshing posts and stats');
        loadPosts(true);
        loadStats();
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
        console.log(`View project details ${postId}`);
        if (!postId || postId === 'undefined') {
            console.error('Invalid post ID:', postId);
            return;
        }
        // Navigate to project details with applicants view for recruiters
        (navigation as any).navigate('ProjectDetails', {
            projectId: postId,
            userRole: 'recruiter',
        });
    };

    // Handle author press
    const handleAuthorPress = (authorId: string) => {
        if (__DEV__) console.log(`View author ${authorId}`);
        // TODO: Navigate to author profile
    };

    // Handle create project (recruiter only)
    const handleCreateProject = () => {
        console.log('Create new project');
        (navigation as any).navigate('CreateProject');
    };

    // Handle view members (recruiter only)
    const handleViewMembers = () => {
        console.log('View members - navigating to Members tab');
        // Navigate to Members tab in the tab navigator
        (navigation as any).navigate('Members');
    };

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
                // Improve vertical scroll responsiveness and avoid horizontal swipes
                directionalLockEnabled
                scrollEventThrottle={16}
            >
                {/* Quick Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dashboard</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{projectCount}</Text>
                            <Text style={styles.statLabel}>Total Projects</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{scheduleCount}</Text>
                            <Text style={styles.statLabel}>Total Schedules</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <View style={{ height: spacing.md }} />
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity style={styles.quickActionCard} onPress={handleCreateProject}>
                            <View style={styles.quickActionIcon}>
                                <Text style={styles.quickActionIconText}>➕</Text>
                            </View>
                            <Text style={styles.quickActionText}>Create Project</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.quickActionCard} onPress={handleViewMembers}>
                            <View style={styles.quickActionIcon}>
                                <Text style={styles.quickActionIconText}>👥</Text>
                            </View>
                            <Text style={styles.quickActionText}>View Members</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Feed Header */}
                <View style={styles.feedHeader}>
                    <Text style={styles.feedTitle}>All Posts</Text>
                </View>

                {/* Posts */}
                {posts.length > 0 ? (
                    posts.map((post, index) => (
                        <View key={post.id} style={index !== posts.length - 1 ? styles.postSpacing : null}>
                            <HomeFeedPost
                                post={post}
                                onPostPress={handlePostPress}
                                onAuthorPress={handleAuthorPress}
                            />
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No posts yet</Text>
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
    // headerBanner removed in favor of shared HeaderBar
    headerTitle: {
        fontSize: fontSize.h4,
        fontWeight: '800',
        color: colors.primaryText,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: fontSize.caption,
        color: colors.secondaryText,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 4 : 2,
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
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flex: 1,
        ...shadows.medium,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: fontSize.small,
        fontWeight: '500',
        color: colors.secondaryText,
        textAlign: 'left',
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
        fontSize: 26,
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

export default RecruiterHomeScreen;





