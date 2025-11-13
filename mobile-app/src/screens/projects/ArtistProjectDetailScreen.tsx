import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../styles/tokens';
import { removeApplication, updateApplicationStatus } from '../../services/api';
import { safeDate } from '../../utils/dates';
import ModernDialog, { DialogType } from '../../components/ModernDialog';

interface Application {
  id: string;
  cover_letter?: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    department?: string;
    city?: string;
    state?: string;
    alt_phone?: string;
    phone?: string;
    email?: string;
    maa_associative_number?: string;
    role?: string;
  };
}

export default function ArtistProjectDetailScreen({ route, navigation }: any) {
  const { application, projectId, project } = route.params;
  const [removing, setRemoving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'info' as DialogType,
    primaryLabel: 'OK',
    onPrimaryPress: undefined as undefined | (() => void),
    secondaryLabel: undefined as undefined | string,
    onSecondaryPress: undefined as undefined | (() => void),
  });
  const profile = application.profiles;

  const showDialog = (
    title: string,
    message: string,
    type: DialogType = 'info',
    opts?: {
      primaryLabel?: string;
      onPrimaryPress?: () => void;
      secondaryLabel?: string;
      onSecondaryPress?: () => void;
    }
  ) => {
    setDialogConfig({
      title,
      message,
      type,
      primaryLabel: opts?.primaryLabel ?? 'OK',
      onPrimaryPress: opts?.onPrimaryPress,
      secondaryLabel: opts?.secondaryLabel,
      onSecondaryPress: opts?.onSecondaryPress,
    });
    setDialogVisible(true);
  };

  const handleRemove = () => {
    showDialog(
      'Remove Artist',
      `Are you sure you want to remove ${profile.first_name} ${profile.last_name || ''} from this project?`,
      'warning',
      {
        secondaryLabel: 'Cancel',
        onSecondaryPress: () => setDialogVisible(false),
        primaryLabel: 'Remove',
        onPrimaryPress: async () => {
          setDialogVisible(false);
          setRemoving(true);
          try {
            await removeApplication(application.id);
            showDialog('Success', 'Artist removed from project', 'success', {
              primaryLabel: 'OK',
              onPrimaryPress: () => {
                setDialogVisible(false);
                navigation.navigate('ProjectDetails', {
                  projectId: projectId,
                  project: project,
                  userRole: 'recruiter',
                  refresh: true,
                });
              },
            });
          } catch (error: any) {
            console.error('Error removing artist:', error);
            showDialog('Error', 'Failed to remove artist from project', 'error', {
              primaryLabel: 'OK',
              onPrimaryPress: () => setDialogVisible(false),
            });
          } finally {
            setRemoving(false);
          }
        },
      }
    );
  };

  const handleApprove = () => {
    showDialog(
      'Approve Application',
      `Approve ${profile.first_name} ${profile.last_name || ''} for this project?`,
      'warning',
      {
        secondaryLabel: 'Cancel',
        onSecondaryPress: () => setDialogVisible(false),
        primaryLabel: 'Approve',
        onPrimaryPress: async () => {
          setDialogVisible(false);
          setApproving(true);
          try {
            await updateApplicationStatus(application.id, 'accepted');
            showDialog('Success', 'Application approved', 'success', {
              primaryLabel: 'OK',
              onPrimaryPress: () => {
                setDialogVisible(false);
                navigation.navigate('ProjectDetails', {
                  projectId: projectId,
                  project: project,
                  userRole: 'recruiter',
                  refresh: true,
                });
              },
            });
          } catch (error: any) {
            console.error('Error approving application:', error);
            showDialog('Error', 'Failed to approve application', 'error', {
              primaryLabel: 'OK',
              onPrimaryPress: () => setDialogVisible(false),
            });
          } finally {
            setApproving(false);
          }
        },
      }
    );
  };

  const statusColor =
    application.status === 'accepted'
      ? colors.success
      : application.status === 'rejected'
        ? colors.error
        : colors.warning;

  return (
    <View
      style={styles.container}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Artist Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={{
              uri: profile.profile_photo_url || 'https://via.placeholder.com/120',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name || ''}
          </Text>
          {profile.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {application.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>

          {profile.department && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoText}>{profile.department}</Text>
              </View>
            </View>
          )}

          {profile.maa_associative_number && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>MAA Associative Number</Text>
                <Text style={styles.infoText}>{profile.maa_associative_number}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Contact Information */}
        {(profile.city || profile.state || profile.alt_phone || profile.phone || profile.email) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            {profile.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoText}>{profile.email}</Text>
                </View>
              </View>
            )}

            {profile.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoText}>{profile.phone}</Text>
                </View>
              </View>
            )}

            {profile.alt_phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Alternate Phone</Text>
                  <Text style={styles.infoText}>{profile.alt_phone}</Text>
                </View>
              </View>
            )}

            {(profile.city || profile.state) && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoText}>
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Application Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Applied On</Text>
              <Text style={styles.infoText}>{safeDate(application.created_at)}</Text>
            </View>
          </View>

          {application.cover_letter && (
            <View style={styles.coverLetterContainer}>
              <Text style={styles.coverLetterLabel}>Cover Letter</Text>
              <Text style={styles.coverLetterText}>{application.cover_letter}</Text>
            </View>
          )}
        </View>

        {/* Approve Button (shown when not yet accepted) */}
        {application.status !== 'accepted' && (
          <TouchableOpacity
            style={[styles.approveButton, approving && styles.approveButtonDisabled]}
            onPress={handleApprove}
            disabled={approving}
          >
            {approving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                <Text style={styles.approveButtonText}>Approve Application</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Remove Button */}
        <TouchableOpacity
          style={[styles.removeButton, removing && styles.removeButtonDisabled]}
          onPress={handleRemove}
          disabled={removing}
        >
          {removing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={styles.removeButtonText}>Remove from Project</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      flex: 1,
    },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackBtn: {
    position: 'absolute',
    left: spacing.md,
    top: Platform.OS === 'ios' ? 50 : 30,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  name: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  roleText: {
    fontSize: 14,
    color: colors.white,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  coverLetterContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  coverLetterLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  coverLetterText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.small,
  },
  removeButtonDisabled: {
    opacity: 0.6,
  },
  removeButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.small,
  },
  approveButtonDisabled: {
    opacity: 0.6,
  },
  approveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});

