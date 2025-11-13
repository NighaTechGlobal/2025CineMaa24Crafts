import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModernDialog, { DialogType } from '../../components/ModernDialog';
import { colors, spacing, borderRadius } from '../../styles/tokens';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../../utils/dates';

export default function ProjectDetailsFullScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message?: string;
    type?: DialogType;
    primaryLabel?: string;
    onPrimaryPress?: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
  }>({ title: '' });

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

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch project details
      // For now, using mock data
      const mockProject = {
        id: projectId,
        title: 'Film Production Project',
        description: 'We are looking for talented artists for our upcoming film production. This is a great opportunity to work with experienced professionals in the industry.',
        requirements: 'Experience in acting, dancing, or singing. Must be available for 3 months.',
        location: 'Mumbai, Maharashtra',
        department: 'Acting',
        deadline: '2025-11-15',
        status: 'open',
        // Use base64 image field only; legacy image_url removed
        image: undefined,
        author: {
          name: 'Production House Ltd.',
          avatar: 'https://via.placeholder.com/50',
        },
        created_at: '2025-10-20',
      };
      setProject(mockProject);
      
      // TODO: Check if user has already applied
      setHasApplied(false);
      setApplicationStatus(null);
    } catch (error) {
      console.error('Error loading project details:', error);
      showDialog('Error', 'Failed to load project details', 'error', {
        onPrimaryPress: () => setDialogVisible(false),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      showDialog('Required', 'Please write a cover letter', 'warning', {
        onPrimaryPress: () => setDialogVisible(false),
      });
      return;
    }

    setApplying(true);
    try {
      // TODO: Implement API call to apply to project
      console.log('Applying to project:', projectId, 'with cover letter:', coverLetter);
      
      setHasApplied(true);
      setApplicationStatus('pending');
      setShowApplyModal(false);
      setCoverLetter('');
      showDialog('Success', 'Your application has been submitted!', 'success', {
        onPrimaryPress: () => setDialogVisible(false),
      });
    } catch (error) {
      console.error('Error applying to project:', error);
      showDialog('Error', 'Failed to submit application', 'error', {
        onPrimaryPress: () => setDialogVisible(false),
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Image */}
        {asImageUri(project.image_url) ? (
          <Image
            source={{ uri: asImageUri(project.image_url)! }}
            style={styles.projectImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Project Info Card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>{project.title}</Text>

          {/* Author Info */}
          <View style={styles.authorContainer}>
            <Image
              source={{ uri: project.author.avatar }}
              style={styles.authorAvatar}
            />
            <Text style={styles.authorName}>{project.author.name}</Text>
          </View>

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>{project.status.toUpperCase()}</Text>
            </View>
            {hasApplied && applicationStatus && (
              <View style={[styles.applicationBadge, { backgroundColor: getApplicationStatusColor(applicationStatus) }]}>
                <Text style={styles.applicationStatusText}>
                  {applicationStatus.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.sectionContent}>{project.description}</Text>
          </View>

          {/* Requirements Section */}
          {project.requirements && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Requirements</Text>
              </View>
              <Text style={styles.sectionContent}>{project.requirements}</Text>
            </View>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {project.location && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{project.location}</Text>
                </View>
              </View>
            )}

            {project.department && (
              <View style={styles.detailItem}>
                <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Department</Text>
                  <Text style={styles.detailValue}>{project.department}</Text>
                </View>
              </View>
            )}

            {project.deadline && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text style={styles.detailValue}>{safeDate(project.deadline)}</Text>
                </View>
              </View>
            )}

            {project.created_at && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Posted</Text>
                  <Text style={styles.detailValue}>{safeDate(project.created_at)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      {!hasApplied && project.status === 'open' && (
        <View style={styles.applyButtonContainer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowApplyModal(true)}
          >
            <Ionicons name="paper-plane" size={20} color={colors.white} />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasApplied && (
        <View style={styles.appliedContainer}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.appliedText}>Applied</Text>
        </View>
      )}

      {/* Apply Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply to Project</Text>
              <TouchableOpacity
                onPress={() => setShowApplyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Write a cover letter explaining why you're a good fit for this project
            </Text>

            <TextInput
              style={styles.coverLetterInput}
              placeholder="Your cover letter..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={8}
              value={coverLetter}
              onChangeText={setCoverLetter}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, applying && styles.submitButtonDisabled]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={colors.white} />
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return colors.success;
    case 'closed':
      return colors.error;
    case 'in_progress':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
};

const getApplicationStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return colors.warning;
    case 'accepted':
      return colors.success;
    case 'rejected':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  projectImage: {
    width: '100%',
    height: 250,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  authorName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  applicationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  applicationStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  detailsGrid: {
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailTextContainer: {
    marginLeft: spacing.md,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  applyButtonContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  appliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  appliedText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  coverLetterInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 150,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

