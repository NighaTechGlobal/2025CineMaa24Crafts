import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';
import { asImageUri } from '@/utils/images';
import { getAuthProfile } from '../../services/api';
// removed direct clearAuthData usage; handled by AuthProvider.logout
import { useAuth } from '../../providers/AuthProvider';
import { useDialog } from '../../hooks/useDialog';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const { showDialog, hideDialog, DialogPortal } = useDialog();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await getAuthProfile();
            setProfile(response.profile);
            setUser(response.user);
        } catch (error) {
            console.error('Error loading profile:', error);
            showDialog('Error', 'Failed to load profile', 'error', {
                primaryLabel: 'OK',
            });
        } finally {
            setLoading(false);
        }
    };

    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadProfile();
        } finally {
            setRefreshing(false);
        }
    };

    // Handle become recruiter
    const handleBecomeRecruiter = () => {
        console.log('Become recruiter');
        showDialog({
            title: 'Become a Recruiter',
            message: 'This feature will be available soon!',
            type: 'info',
            primaryLabel: 'Got it',
            onPrimaryPress: hideDialog,
        });
    };

    // Handle edit profile
    const handleEditProfile = () => {
        if (profile) {
            (navigation as any).navigate('EditProfile', { profile });
        }
    };

    // Handle logout
    const handleLogout = async () => {
        showDialog({
            title: 'Logout',
            message: 'Are you sure you want to logout?',
            type: 'warning',
            primaryLabel: 'Logout',
            onPrimaryPress: async () => {
                hideDialog();
                await logout();
            },
            secondaryLabel: 'Cancel',
            onSecondaryPress: hideDialog,
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.accentActive} />
                <Text style={styles.loadingText}>Loading Profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Profile not found</Text>
            </View>
        );
    }

    // Check if user is recruiter
    const isRecruiter = profile.role === 'recruiter';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentActive} />}
            >
                {/* Profile header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profilePhotoContainer}>
                        <Image 
                            source={{ uri: asImageUri(profile.profile_pic) || 'https://via.placeholder.com/150' }} 
                            style={styles.profilePhoto} 
                        />
                        <View style={[styles.roleBadge, isRecruiter && styles.recruiterBadge]}> 
                            <Ionicons 
                                name={isRecruiter ? 'briefcase' : 'person'} 
                                size={16} 
                                color={colors.white} 
                            />
                        </View>
                    </View>
                    <Text style={styles.profileName}>
                        {profile.first_name} {profile.last_name}
                    </Text>
                    <Text style={styles.profileRole}>{profile.role?.toUpperCase()}</Text>
                </View>

                {/* Profile details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={20} color={colors.accentActive} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>

                    {user?.email && (
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="mail-outline" size={16} color={colors.secondaryText} />
                                <Text style={styles.detailLabel}>Email</Text>
                            </View>
                            <Text style={styles.detailValue}>{user.email}</Text>
                        </View>
                    )}

                    {user?.phone && (
                        <View style={styles.detailRow}>
                            <View style={styles.detailLabelContainer}>
                                <Ionicons name="call-outline" size={16} color={colors.secondaryText} />
                                <Text style={styles.detailLabel}>Phone</Text>
                            </View>
                            <Text style={styles.detailValue}>{user.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statCard}>
                        <Ionicons name="briefcase-outline" size={28} color={colors.accentActive} />
                        <Text style={styles.statValue}>
                            {isRecruiter ? 'Projects' : 'Applied'}
                        </Text>
                        <Text style={styles.statLabel}>0</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar-outline" size={28} color={colors.accentActive} />
                        <Text style={styles.statValue}>Schedules</Text>
                        <Text style={styles.statLabel}>0</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="star-outline" size={28} color={colors.accentActive} />
                        <Text style={styles.statValue}>Rating</Text>
                        <Text style={styles.statLabel}>5.0</Text>
                    </View>
                </View>

                {/* Action buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => (navigation as any).navigate('MyDevices')}
                    >
                        <Ionicons name="notifications-outline" size={20} color={colors.primaryText} />
                        <Text style={styles.actionButtonText}>My Devices</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleEditProfile}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.primaryText} />
                        <Text style={styles.actionButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.primaryText} />
                        <Text style={styles.actionButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Become Recruiter button (artist only) */}
            {!isRecruiter && (
                <TouchableOpacity
                    style={styles.becomeRecruiterButton}
                    onPress={handleBecomeRecruiter}
                >
                    <Text style={styles.becomeRecruiterButtonText}>Become a Recruiter</Text>
                </TouchableOpacity>
            )}

            {/* Themed dialog overlay */}
            <DialogPortal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cardBackground,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
    header: {
        height: 60,
        backgroundColor: colors.gradStart,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
    },
    headerTitle: {
        fontSize: fontSize.h3,
        fontWeight: '600',
        color: colors.primaryText,
    },
    content: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: colors.cardBackground,
    },
    profilePhotoContainer: {
        position: 'relative',
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        marginBottom: spacing.md,
        ...shadows.medium,
        borderWidth: 4,
        borderColor: colors.accentActive,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    roleBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.accentActive,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.gradStart,
    },
    recruiterBadge: {
        backgroundColor: '#8b5cf6',
    },
    profileName: {
        fontSize: fontSize.h2,
        fontWeight: 'bold',
        color: colors.primaryText,
        marginBottom: spacing.xs,
    },
    profileRole: {
        fontSize: fontSize.caption,
        color: colors.accentActive,
        fontWeight: '600',
        letterSpacing: 1,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: fontSize.caption,
        color: colors.secondaryText,
        marginTop: spacing.xs,
    },
    statLabel: {
        fontSize: fontSize.h3,
        fontWeight: '600',
        color: colors.primaryText,
        marginTop: spacing.xs,
    },
    section: {
        padding: spacing.lg,
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: fontSize.body,
        fontWeight: '600',
        color: colors.primaryText,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingVertical: spacing.sm,
    },
    detailLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    detailLabel: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    detailValue: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        flex: 1,
        textAlign: 'right',
    },
    actionsContainer: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        fontWeight: '600',
    },
    becomeRecruiterButton: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        left: spacing.xl,
        backgroundColor: colors.accentActive,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    becomeRecruiterButtonText: {
        fontSize: fontSize.body,
        fontWeight: '600',
        color: colors.white,
    },
    bottomSpacing: {
        height: spacing.xxl,
    },
});

export default ProfileScreen;






