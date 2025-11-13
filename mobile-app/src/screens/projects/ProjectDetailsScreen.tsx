import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../styles/tokens';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../../utils/dates';
import { getPost, getProjectApplications, updateApplicationStatus, removeApplication, getAuthProfile, deletePost } from '../../services/api';
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
    maa_associative_number?: string;
  };
}

export default function ProjectDetailsScreen({ route, navigation }: any) {
  const { projectId, project: initialProject, userRole: routeUserRole, refresh } = route.params || {};
  const [project, setProject] = useState<any>(initialProject || null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(routeUserRole || null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'info' as DialogType,
    primaryLabel: 'OK',
    onPrimaryPress: undefined as undefined | (() => void),
    secondaryLabel: undefined as undefined | string,
    onSecondaryPress: undefined as undefined | (() => void),
  });

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
    loadUserProfile();
    loadProjectDetails();
  }, [projectId]);

  // Refresh when navigating back from removing artist
  useEffect(() => {
    if (refresh) {
      loadProjectDetails();
    }
  }, [refresh]);

  const loadUserProfile = async () => {
    if (!userRole) {
      try {
        const response = await getAuthProfile();
        setUserRole(response.profile?.role || null);
        setCurrentUserProfile(response.profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  };

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      // Load project details if not provided
      if (!project) {
        const projectData = await getPost(projectId);
        setProject(projectData);
      }

      // Load applications
      const response = await getProjectApplications(projectId, undefined, 50);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error loading project details:', error);
      showDialog('Error', 'Failed to load project details', 'error', {
        primaryLabel: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  const projectImageUri = asImageUri(project?.image_url);

  const confirmDeleteProject = () => {
    if (!project?.id) return;
    showDialog(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      'warning',
      {
        primaryLabel: 'Delete',
        onPrimaryPress: async () => {
          try {
            await deletePost(project.id);
            setDialogVisible(false);
            navigation.goBack();
          } catch (e) {
            setDialogVisible(false);
            showDialog('Error', 'Failed to delete project. Please try again.', 'error', {
              primaryLabel: 'OK',
              onPrimaryPress: () => setDialogVisible(false),
            });
          }
        },
        secondaryLabel: 'Cancel',
        onSecondaryPress: () => setDialogVisible(false),
      },
    );
  };

  const navigateToUpdate = () => {
    if (!project?.id) return;
    setMenuOpen(false);
    navigation.navigate('UpdateProject', { projectId, project });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjectDetails();
    setRefreshing(false);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      // Refresh applications
      await loadProjectDetails();
      showDialog('Success', `Application ${newStatus}`, 'success', {
        primaryLabel: 'OK',
        onPrimaryPress: () => setDialogVisible(false),
      });
    } catch (error) {
      console.error('Error updating application:', error);
      showDialog('Error', 'Failed to update application status', 'error', {
        primaryLabel: 'OK',
      });
    }
  };

  const handleViewProfile = (application: Application) => {
    if (userRole === 'recruiter') {
      // Recruiters see detailed view with remove button
      navigation.navigate('ArtistProjectDetail', {
        application: application,
        projectId: projectId,
        project: project,
      });
    } else {
      // Artists see regular profile view
      navigation.navigate('MemberProfile', { memberId: application.profiles.id });
    }
  };

  const handleAddMore = (department: string) => {
    // Navigate to members list filtered by department or show add artist modal
    showDialog('Add More Artists', `Add more ${department} artists to this project`, 'info', {
      secondaryLabel: 'Cancel',
      onSecondaryPress: () => setDialogVisible(false),
      primaryLabel: 'Browse Members',
      onPrimaryPress: () => {
        setDialogVisible(false);
        navigation.navigate('Members', { filterDepartment: department });
      },
    });
  };

  // Group applications by department
  const groupedApplications = useMemo(() => {
    const grouped: { [key: string]: Application[] } = {};
    
    applications.forEach((app) => {
      const department = app.profiles.department || 'Other';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(app);
    });
    
    return grouped;
  }, [applications]);

  const departments = Object.keys(groupedApplications).sort();

  const renderArtistCard = (item: Application) => {
    const profile = item.profiles;
    const statusColor =
      item.status === 'accepted'
        ? colors.success
        : item.status === 'rejected'
        ? colors.error
        : colors.warning;

    return (
      <TouchableOpacity
        style={styles.artistCard}
        onPress={() => handleViewProfile(item)}
      >
        <Image
          source={{
            uri: profile.profile_pic || 'https://via.placeholder.com/60',
          }}
          style={styles.artistAvatar}
        />
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>
            {profile.first_name} {profile.last_name || ''}
          </Text>
          {profile.city && profile.state && (
            <Text style={styles.artistLocation}>
              {profile.city}, {profile.state}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDepartmentSection = (department: string, apps: Application[]) => {
    return (
      <View key={department} style={styles.departmentSection}>
        <View style={styles.departmentHeader}>
          <Text style={styles.departmentTitle}>{department}</Text>
          <Text style={styles.departmentCount}>({apps.length})</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.artistsContainer}
          nestedScrollEnabled
        >
          {apps.map((app) => (
            <View key={app.id} style={styles.artistWrapper}>
              {renderArtistCard(app)}
            </View>
          ))}
          
          {/* Add More Button - Only for recruiters */}
          {userRole === 'recruiter' && (
            <TouchableOpacity
              style={styles.addMoreCard}
              onPress={() => handleAddMore(department)}
            >
              <View style={styles.addMoreButton}>
                <Ionicons name="add" size={32} color={colors.primary} />
              </View>
              <Text style={styles.addMoreLabel}>Add More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading && !project) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image Area (always reserved) */}
        <View style={styles.projectImageContainer}>
          <TouchableOpacity style={styles.backBtnOverlay} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          {userRole === 'recruiter' && (
            <>
              <TouchableOpacity style={styles.menuBtnOverlay} onPress={() => setMenuOpen((prev) => !prev)}>
                <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
              </TouchableOpacity>
              {menuOpen && (
                <View style={styles.menuDropdown}>
                  <TouchableOpacity style={styles.menuItem} onPress={navigateToUpdate}>
                    <Ionicons name="create-outline" size={20} color={colors.text} />
                    <Text style={styles.menuText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={confirmDeleteProject}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={[styles.menuText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          {projectImageUri ? (
            <Image
              source={{ uri: projectImageUri }}
              style={styles.projectImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.projectImagePlaceholder} />
          )}
          {project?.title ? (
            <View style={styles.projectImageOverlay}>
              <Text style={styles.projectTitle}>{project.title}</Text>
            </View>
          ) : null}
        </View>

        {/* Project Info */}
        {project && (
          <View style={styles.projectInfoSection}>
            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}
            <View style={styles.projectMeta}>
              {project.department && (
                <View style={styles.metaItem}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{project.department}</Text>
                </View>
              )}
              {project.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{project.location}</Text>
                </View>
              )}
              {project.deadline && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    Deadline: {safeDate(project.deadline)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Artists by Department */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No applications yet</Text>
          </View>
        ) : (
          <View style={styles.artistsSection}>
            <Text style={styles.sectionTitle}>
              Artists ({applications.length})
            </Text>
            
            {departments.map((dept) => renderDepartmentSection(dept, groupedApplications[dept]))}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  projectImageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  backBtnOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    left: spacing.md,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  menuBtnOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.xl + 40 : spacing.lg + 40,
    right: spacing.md,
    zIndex: 3,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  menuText: {
    marginLeft: spacing.xs,
    fontSize: 16,
    color: colors.text,
  },
  projectImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  projectImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.lg,
  },
  projectTitle: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '700',
  },
  projectInfoSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  projectDescription: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.md,
  },
  projectMeta: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
  },
  artistsSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.lg,
    marginHorizontal: spacing.md,
  },
  departmentSection: {
    marginBottom: spacing.xl,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  departmentTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  departmentCount: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  artistsContainer: {
    paddingHorizontal: spacing.md,
    paddingRight: spacing.lg,
  },
  artistWrapper: {
    marginRight: spacing.md,
  },
  artistCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: 140,
    alignItems: 'center',
    ...shadows.small,
  },
  artistAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  artistInfo: {
    alignItems: 'center',
    flex: 1,
  },
  artistName: {
    fontSize: 14, lineHeight: 20,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  artistLocation: {
    fontSize: 12, lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: 10, lineHeight: 12,
    color: colors.white,
    fontWeight: '600',
  },
  addMoreCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    ...shadows.small,
  },
  addMoreButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryVeryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  addMoreLabel: {
    fontSize: 14, lineHeight: 20,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

