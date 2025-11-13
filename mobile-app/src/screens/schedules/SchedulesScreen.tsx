import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { 
  listSchedules, 
  createSchedule, 
  updateScheduleMemberStatus,
  getRecruiterProjects 
} from '../../services/api';
import { supabase } from '../../services/supabase';
import { useDialog } from '../../hooks/useDialog';

interface Schedule {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  member_status?: string;
  status?: string;
  projects?: {
    id: string;
    title: string;
  };
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  applications_count?: number;
  created_at: string;
}

const SchedulesScreen: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);
  const { showDialog, hideDialog, DialogPortal } = useDialog();
  
  // Recruiter-specific state
  const [recruiterProjects, setRecruiterProjects] = useState<Project[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load schedules and projects when role is determined
  useEffect(() => {
    if (userRole && userProfile) {
      loadSchedules();
      if (userRole === 'recruiter') {
        loadRecruiterProjects();
      }
    }
  }, [userRole, userProfile, selectedProject]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadRecruiterProjects = async () => {
    try {
      const projects = await getRecruiterProjects();
      setRecruiterProjects(projects || []);
    } catch (error) {
      console.error('Error loading recruiter projects:', error);
    }
  };

  const loadSchedules = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      let response;
      if (userRole === 'recruiter') {
        // Recruiters can filter by project
        if (selectedProject) {
          response = await listSchedules(undefined, 50, undefined, selectedProject.id);
        } else {
          // Show all schedules for all their projects
          response = await listSchedules(undefined, 50);
        }
      } else {
        // Artists see schedules they're assigned to
        response = await listSchedules(undefined, 50, userProfile.id);
      }
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showDialog({
        title: 'Error',
        message: 'Failed to load schedules.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  // Handle accept/decline schedule (artist only)
  const handleUpdateStatus = async (scheduleId: string, status: string) => {
    try {
      await updateScheduleMemberStatus(scheduleId, userProfile.id, status);
      setSchedules(prev =>
        prev.map(schedule =>
          schedule.id === scheduleId
            ? { ...schedule, member_status: status }
            : schedule
        )
      );
      showDialog({
        title: 'Success',
        message: `Schedule ${status}.`,
        type: 'success',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } catch (error) {
      console.error('Error updating schedule status:', error);
      showDialog({
        title: 'Error',
        message: 'Failed to update schedule status.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    }
  };

  // Handle create schedule (recruiter only)
  const handleCreateSchedule = () => {
    if (recruiterProjects.length === 0) {
      showDialog({
        title: 'No Projects',
        message: 'Create a project before adding schedules.',
        type: 'info',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }
    setShowCreateModal(true);
  };

  // Handle FAB press for recruiters
  const handleFABPress = () => {
    if (recruiterProjects.length === 0) {
      showDialog({
        title: 'No Projects',
        message: 'Create a project first before adding schedules.',
        type: 'info',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }
    setShowProjectSelector(true);
  };

  // Get status style
  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'confirmed':
        return { backgroundColor: colors.success };
      case 'pending':
        return { backgroundColor: colors.warning };
      case 'declined':
      case 'cancelled':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.textSecondary };
    }
  };

  // Render schedule item
  const renderSchedule = ({ item }: { item: Schedule }) => {
    const isArtist = userRole === 'artist';
    const status = isArtist ? item.member_status : item.status;
    const isPending = status?.toLowerCase() === 'pending';

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={styles.statusText}>
              {status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.projects && (
          <Text style={styles.projectName}>📂 {item.projects.title}</Text>
        )}

        <View style={styles.scheduleDetails}>
          <Text style={styles.detailText}>
            📅 {new Date(item.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.detailText}>
            🕒 {item.start_time} - {item.end_time}
          </Text>
          {item.location && (
            <Text style={styles.detailText}>📍 {item.location}</Text>
          )}
        </View>

        {isArtist && isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleUpdateStatus(item.id, 'accepted')}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleUpdateStatus(item.id, 'declined')}
            >
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>
          {userRole === 'recruiter' 
            ? selectedProject 
              ? 'No Schedules for This Project'
              : 'No Schedules Yet' 
            : 'No Schedules Yet'}
        </Text>
        <Text style={styles.emptyText}>
          {userRole === 'recruiter'
            ? selectedProject
              ? 'Create schedules for this project using the + button'
              : 'Select a project and create schedules using the + button'
            : 'You haven\'t been assigned to any schedules yet'}
        </Text>
      </View>
    );
  };

  // Project Selector Modal
  const renderProjectSelector = () => (
    <Modal
      visible={showProjectSelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProjectSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Project</Text>
          <ScrollView style={styles.projectList}>
            {recruiterProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.projectItem,
                  selectedProject?.id === project.id && styles.selectedProjectItem
                ]}
                onPress={() => {
                  setSelectedProject(project);
                  setShowProjectSelector(false);
                  setShowCreateModal(true);
                }}
              >
                <View>
                  <Text style={styles.projectItemTitle}>{project.title}</Text>
                  {project.description && (
                    <Text style={styles.projectItemDescription} numberOfLines={1}>
                      {project.description}
                    </Text>
                  )}
                </View>
                {project.applications_count !== undefined && (
                  <Text style={styles.applicantsCount}>
                    {project.applications_count} applicants
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowProjectSelector(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!userRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter header for recruiters */}
      {userRole === 'recruiter' && recruiterProjects.length > 0 && (
        <View style={styles.filterHeader}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setSelectedProject(null);
              loadSchedules();
            }}
          >
            <Text style={styles.filterButtonText}>
              {selectedProject ? `📂 ${selectedProject.title}` : '📋 All Projects'}
            </Text>
            <Text style={styles.filterIcon}>{selectedProject ? '✕' : '▼'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Schedules list */}
      <FlatList
        data={schedules}
        renderItem={renderSchedule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.schedulesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={<View style={{ height: spacing.xl }} />}
      />

      {/* FAB for recruiters */}
      {userRole === 'recruiter' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFABPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Modals */}
      {renderProjectSelector()}

      {/* Modern dialog overlay */}
      <DialogPortal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  filterHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    flex: 1,
  },
  filterIcon: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  schedulesList: {
    padding: spacing.lg,
    paddingTop: spacing.lg + spacing.md, // Extra space below header title
    paddingBottom: spacing.xxl + 60,
  },
  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 14, lineHeight: 20,
    color: colors.white,
    },
  description: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  projectName: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    marginBottom: spacing.md,
    },
  scheduleDetails: {
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
    paddingTop: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  projectList: {
    maxHeight: '70%',
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedProjectItem: {
    backgroundColor: colors.primaryLight,
  },
  projectItemTitle: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectItemDescription: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
  },
  applicantsCount: {
    fontSize: 14, lineHeight: 20,
    color: colors.primary,
    },
  modalCloseButton: {
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCloseButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    },
});

export default SchedulesScreen;







