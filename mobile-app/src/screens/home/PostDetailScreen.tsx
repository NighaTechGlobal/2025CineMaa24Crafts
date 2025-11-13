import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../../utils/dates';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';
import { getPost, checkApplicationStatus, applyToProject } from '../../services/api';
import { getUser } from '../../services/authStorage';
import ModernDialog from '../../components/ModernDialog';

interface PostDetailScreenProps {
    route: any;
    navigation: any;
}

const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ route, navigation }) => {
    const { postId } = route.params;
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState<{
        title: string;
        message?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
        primaryLabel?: string;
        onPrimaryPress?: () => void;
        secondaryLabel?: string;
        onSecondaryPress?: () => void;
    }>({ title: '' });

    const showDialog = (cfg: {
        title: string;
        message?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
        primaryLabel?: string;
        onPrimaryPress?: () => void;
        secondaryLabel?: string;
        onSecondaryPress?: () => void;
    }) => {
        setDialogConfig(cfg);
        setDialogVisible(true);
    };

    useEffect(() => {
        loadPostAndApplicationStatus();
    }, [postId]);

    const loadPostAndApplicationStatus = async () => {
        try {
            setLoading(true);
            const user = await getUser();
            setUserRole(user?.role || 'artist');

            console.log('PostDetailScreen: Loading post with ID:', postId);
            console.log('PostDetailScreen: postId type:', typeof postId);
            console.log('PostDetailScreen: route.params:', JSON.stringify(route.params, null, 2));

            // Load post details
            const postData = await getPost(postId);
            console.log('PostDetailScreen: Post data loaded:', postData);
            setPost(postData);

            // Check if artist has already applied (only for artists)
            if (user?.role === 'artist') {
                try {
                    const statusData = await checkApplicationStatus(postId);
                    setHasApplied(statusData.hasApplied);
                    setApplicationStatus(statusData.application?.status || null);
                } catch (appError) {
                    console.error('Error checking application status:', appError);
                    // Continue even if this fails
                }
            }
        } catch (error: any) {
            console.error('Error loading post:', error);
            console.error('Error details:', error.response?.data);
            showDialog({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to load project details. Please try again.',
                type: 'error',
                primaryLabel: 'OK',
                onPrimaryPress: () => setDialogVisible(false),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (hasApplied) {
            showDialog({
                title: 'Already Applied',
                message: 'You have already applied to this project',
                type: 'info',
                primaryLabel: 'OK',
                onPrimaryPress: () => setDialogVisible(false),
            });
            return;
        }

        showDialog({
            title: 'Apply to Project',
            message: 'Are you sure you want to apply to this project?',
            type: 'info',
            secondaryLabel: 'Cancel',
            onSecondaryPress: () => setDialogVisible(false),
            primaryLabel: 'Apply',
            onPrimaryPress: async () => {
                setDialogVisible(false);
                setApplying(true);
                try {
                    await applyToProject(postId);
                    showDialog({
                        title: 'Success',
                        message: 'Application submitted successfully!',
                        type: 'success',
                        primaryLabel: 'OK',
                        onPrimaryPress: () => setDialogVisible(false),
                    });
                    setHasApplied(true);
                    setApplicationStatus('pending');
                } catch (error: any) {
                    console.error('Apply error:', error);
                    showDialog({
                        title: 'Error',
                        message: error.response?.data?.message || 'Failed to submit application',
                        type: 'error',
                        primaryLabel: 'OK',
                        onPrimaryPress: () => setDialogVisible(false),
                    });
                } finally {
                    setApplying(false);
                }
            },
        });
    };

    // Use shared, resilient formatter
    const formatDate = (dateString: string) => safeDate(dateString);

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.accentActive} />
                <Text style={styles.loadingText}>Loading project details...</Text>
            </View>
        );
    }

    if (!post) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Project not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const author = post.profiles;
    const statusColor = hasApplied
        ? applicationStatus === 'accepted'
            ? colors.accentActive
            : applicationStatus === 'rejected'
            ? '#ef4444'
            : '#f59e0b'
        : colors.accentActive;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Project Details</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image */}
                {asImageUri(post.image_url || post.image) ? (
                    <Image source={{ uri: asImageUri(post.image_url || post.image)! }} style={styles.image} />
                ) : null}

                {/* Author Info */}
                <View style={styles.authorSection}>
                    <Image
                        source={{ uri: author?.profile_photo_url || 'https://via.placeholder.com/50' }}
                        style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>
                            {author?.first_name} {author?.last_name}
                        </Text>
                        <Text style={styles.authorRole}>{author?.role}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{post.title}</Text>

                {/* Department & Location */}
                <View style={styles.tagsContainer}>
                    {post.department && (
                        <View style={styles.tag}>
                            <Ionicons name="briefcase-outline" size={16} color={colors.accentActive} />
                            <Text style={styles.tagText}>{post.department}</Text>
                        </View>
                    )}
                    {post.location && (
                        <View style={styles.tag}>
                            <Ionicons name="location-outline" size={16} color={colors.accentActive} />
                            <Text style={styles.tagText}>{post.location}</Text>
                        </View>
                    )}
                </View>

                {/* Description Section */}
                {post.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.sectionText}>{post.description}</Text>
                    </View>
                )}

                {/* Requirements Section */}
                {post.requirements && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Requirements</Text>
                        <Text style={styles.sectionText}>{post.requirements}</Text>
                    </View>
                )}

                {/* Caption Section */}
                {post.caption && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>
                        <Text style={styles.sectionText}>{post.caption}</Text>
                    </View>
                )}

                {/* Deadline */}
                {post.deadline && (
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} />
                        <Text style={styles.infoText}>Deadline: {formatDate(post.deadline)}</Text>
                    </View>
                )}

                {/* Status */}
                <View style={styles.infoRow}>
                    <Ionicons name="flag-outline" size={20} color={colors.secondaryText} />
                    <Text style={styles.infoText}>
                        Status: <Text style={[styles.statusBadge, { color: statusColor }]}>{post.status?.toUpperCase()}</Text>
                    </Text>
                </View>

                {/* Application Status (if artist has applied) */}
                {userRole === 'artist' && hasApplied && (
                    <View style={[styles.applicationStatusCard, { borderLeftColor: statusColor }]}>
                        <Text style={styles.applicationStatusTitle}>Your Application</Text>
                        <Text style={[styles.applicationStatusText, { color: statusColor }]}>
                            {applicationStatus === 'pending' && 'Application is under review'}
                            {applicationStatus === 'accepted' && 'Congratulations! Your application was accepted'}
                            {applicationStatus === 'rejected' && 'Application was not accepted'}
                        </Text>
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Apply Button: show 'Applied' when already applied */}
            {userRole === 'artist' && post.status === 'open' && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.applyButton,
                            (hasApplied || applying) && styles.applyButtonDisabled,
                        ]}
                        onPress={handleApply}
                        disabled={hasApplied || applying}
                    >
                        {applying ? (
                            <ActivityIndicator color={colors.primaryText} />
                        ) : (
                            <>
                                <Ionicons
                                    name={hasApplied ? 'checkmark-circle' : 'paper-plane'}
                                    size={20}
                                    color={colors.primaryText}
                                />
                                <Text style={styles.applyButtonText}>
                                    {hasApplied ? 'Applied' : 'Apply Now'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        {/* Modern dialog overlay */}
        <ModernDialog
            visible={dialogVisible}
            title={dialogConfig.title}
            message={dialogConfig.message}
            type={dialogConfig.type}
            primaryLabel={dialogConfig.primaryLabel}
            onPrimaryPress={dialogConfig.onPrimaryPress}
            secondaryLabel={dialogConfig.secondaryLabel}
            onSecondaryPress={dialogConfig.onSecondaryPress}
            onClose={() => setDialogVisible(false)}
        />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.gradStart,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSize.h3,
        color: colors.primaryText,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: colors.accentInactive,
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    authorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.md,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        fontWeight: '600',
    },
    authorRole: {
        fontSize: fontSize.caption,
        color: colors.secondaryText,
        textTransform: 'capitalize',
    },
    title: {
        fontSize: fontSize.h2,
        color: colors.primaryText,
        fontWeight: 'bold',
        padding: spacing.lg,
        paddingBottom: spacing.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gradStart,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    tagText: {
        fontSize: fontSize.caption,
        color: colors.accentActive,
        marginLeft: spacing.xs,
    },
    section: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    sectionTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    sectionText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    infoText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        marginLeft: spacing.sm,
    },
    statusBadge: {
        fontWeight: '600',
    },
    applicationStatusCard: {
        margin: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.md,
        borderLeftWidth: 4,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    applicationStatusTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    applicationStatusText: {
        fontSize: fontSize.body,
        fontWeight: '500',
    },
    footer: {
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: colors.accentInactive,
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accentActive,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    applyButtonDisabled: {
        backgroundColor: colors.accentInactive,
    },
    applyButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    errorText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    backButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.md,
    },
    backButtonText: {
        fontSize: fontSize.body,
        color: colors.accentActive,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: spacing.xl,
    },
});

export default PostDetailScreen;

