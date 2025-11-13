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
import { colors, spacing, borderRadius } from '../../styles/tokens';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../../utils/dates';
import { getPost, applyToProject, checkApplicationStatus } from '../../services/api';

export default function ProjectViewScreen({ route, navigation }: any) {
  const { projectId, project: initialProject } = route.params;
  const [project, setProject] = useState<any>(initialProject || null);
  const [loading, setLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      // Load project details if not provided
      if (!project) {
        const projectData = await getPost(projectId);
        setProject(projectData);
      }

      // Check if user has already applied
      try {
        const status = await checkApplicationStatus(projectId);
        setApplicationStatus(status);
      } catch (error) {
        // User hasn't applied yet
        setApplicationStatus(null);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyToProject(projectId, coverLetter);
      setShowApplyModal(false);
      setCoverLetter('');
      Alert.alert('Success', 'Application submitted successfully');
      // Reload to get updated status
      await loadProjectDetails();
    } catch (error: any) {
      console.error('Error applying to project:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = () => {
    if (!applicationStatus) return colors.primary;
    switch (applicationStatus.status) {
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getStatusText = () => {
    if (!applicationStatus) return 'Apply Now';
    switch (applicationStatus.status) {
      case 'accepted':
        return 'Accepted ✓';
      case 'rejected':
        return 'Not Selected';
      case 'pending':
        return 'Applied - Pending';
      default:
        return 'Apply Now';
    }
  };

  if (loading && !project) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Project Header */}
        {project && (
          <View style={styles.projectCard}>
            {asImageUri(project.image_url) ? (
              <Image
                source={{ uri: asImageUri(project.image_url)! }}
                style={styles.projectImage}
              />
            ) : null}
            <View style={styles.projectInfo}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              
              {project.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{project.description}</Text>
                </View>
              )}

              {/* Project Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Details</Text>
                
                {project.department && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Department:</Text>
                    <Text style={styles.detailValue}>{project.department}</Text>
                  </View>
                )}

                {project.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{project.location}</Text>
                  </View>
                )}

                {project.deadline && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Deadline:</Text>
                    <Text style={styles.detailValue}>{safeDate(project.deadline)}</Text>
                  </View>
                )}

                {project.budget && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Budget:</Text>
                    <Text style={styles.detailValue}>₹{project.budget}</Text>
                  </View>
                )}
              </View>

              {/* Recruiter Info */}
              {project.profiles && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Posted By</Text>
                  <View style={styles.recruiterInfo}>
                    <Text style={styles.recruiterName}>
                      {project.profiles.first_name} {project.profiles.last_name || ''}
                    </Text>
                    {project.profiles.company_name && (
                      <Text style={styles.companyName}>{project.profiles.company_name}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Apply Button */}
      {project && !applicationStatus && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: getStatusColor() }]}
            onPress={() => setShowApplyModal(true)}
          >
            <Text style={styles.applyButtonText}>{getStatusText()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Badge */}
      {applicationStatus && (
        <View style={styles.footer}>
          <View
            style={[styles.statusButton, { backgroundColor: getStatusColor() }]}
          >
            <Text style={styles.statusButtonText}>{getStatusText()}</Text>
          </View>
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
            <Text style={styles.modalTitle}>Apply to Project</Text>
            
            <Text style={styles.modalLabel}>Cover Letter (Optional)</Text>
            <TextInput
              style={styles.coverLetterInput}
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Tell the recruiter why you're a good fit..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowApplyModal(false)}
                disabled={applying}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleApply}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: colors.surface,
  },
  projectImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.border,
  },
  projectInfo: {
    padding: spacing.lg,
  },
  projectTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    flex: 1,
  },
  recruiterInfo: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  recruiterName: {
    fontSize: 24,
    color: colors.text,
  },
  companyName: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    },
  statusButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.sm,
    },
  coverLetterInput: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 120,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    },
});







