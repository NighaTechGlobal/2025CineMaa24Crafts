import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../styles/tokens';
import { listPosts, getMyApplications, getProjectApplications } from '../../services/api';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../../utils/dates';
import { supabase } from '../../services/supabase';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useDialog } from '../../hooks/useDialog';

interface Project {
  id: string;
  title: string;
  description: string;
  image?: string; // base64 image
  location?: string;
  department?: string;
  deadline?: string;
  status?: string;
  applications_count?: number;
  created_at: string;
  author_profile_id?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}

const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const { showDialog, hideDialog, DialogPortal } = useDialog();

  // Fetch user profile
  useEffect(() => {
    if (isFocused) {
      loadUserProfile();
    }
  }, [isFocused]);

  // Load projects when role is determined
  useEffect(() => {
    if (isFocused && userRole) {
      loadProjects();
    }
  }, [isFocused, userRole]);

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

  // Fetch projects based on role
  const loadProjects = async () => {
    if (!userRole || !userProfile) return;

    setLoading(true);
    try {
      if (userRole === 'recruiter') {
        // Recruiters see their own projects
        const response = await listPosts(undefined, 50, userProfile.id);
        setProjects(response.data || []);
      } else {
        // Artists see ALL projects they've applied to
        const response = await getMyApplications(undefined, 50);
        setApplications(response.data || []);
        const appliedProjects = response.data?.map((app: any) => ({
          ...app.posts,
          applicationStatus: app.status,
          appliedAt: app.applied_at,
        })) || [];
        setProjects(appliedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showDialog({
        title: 'Error',
        message: 'Failed to load projects.',
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
    await loadProjects();
    setRefreshing(false);
  };

  // Handle create project navigation (recruiter only)
  const handleCreateProject = () => {
    (navigation as any).navigate('CreateProject');
  };

  // Handle project press
  const handleProjectPress = async (project: Project) => {
    if (userRole === 'recruiter') {
      // Navigate to project details with applicants
      (navigation as any).navigate('ProjectDetails', { 
        projectId: project.id,
        project: project 
      });
    } else {
      // Artists see project details
      (navigation as any).navigate('ProjectView', { 
        projectId: project.id,
        project: project 
      });
    }
  };

  // Render project item
  const renderProject = ({ item }: { item: any }) => {
    const imageUrl = asImageUri(item.image);
    const statusColor = item.status === 'open' ? '#22c55e' : 
                       item.status === 'completed' ? colors.textSecondary : 
                       '#f59e0b';
    
    // Application status colors for artists
    const appStatusColor = item.applicationStatus === 'accepted' ? '#22c55e' :
                          item.applicationStatus === 'rejected' ? '#ef4444' :
                          '#f59e0b';

    return (
      <TouchableOpacity 
        style={styles.projectCard}
        onPress={() => handleProjectPress(item)}
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl! }} 
            style={styles.projectImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🎬</Text>
          </View>
        )}

        <View style={styles.projectContent}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {item.title || 'Untitled Project'}
          </Text>
          
          {item.description && (
            <Text style={styles.projectDescription} numberOfLines={3}>
              {item.description}
            </Text>
          )}

          <View style={styles.projectMeta}>
            {item.department && (
              <Text style={styles.metaText}>📂 {item.department}</Text>
            )}
            {item.location && (
              <Text style={styles.metaText}>📍 {item.location}</Text>
            )}
          </View>

          {userRole === 'recruiter' ? (
            <View style={styles.recruiterInfo}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>
                  {item.status?.toUpperCase() || 'DRAFT'}
                </Text>
              </View>
              {item.applications_count !== undefined && (
                <Text style={styles.applicationsCount}>
                  {item.applications_count} applicant{item.applications_count !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.artistInfo}>
              {item.applicationStatus && (
                <View style={[styles.applicationBadge, { backgroundColor: appStatusColor }]}>
                  <Text style={styles.applicationStatusText}>
                    {item.applicationStatus?.toUpperCase()}
                  </Text>
                </View>
              )}
              {item.appliedAt && (
                <Text style={styles.appliedText}>
                  Applied: {safeDate(item.appliedAt)}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {userRole === 'recruiter' ? '📋' : '🎬'}
        </Text>
        <Text style={styles.emptyTitle}>
          {userRole === 'recruiter' 
            ? 'No Projects Yet' 
            : 'No Active Projects'}
        </Text>
        <Text style={styles.emptyText}>
          {userRole === 'recruiter'
            ? 'Create your first project using the + button below'
            : 'You haven\'t applied to any projects yet. Check the Home feed for opportunities!'}
        </Text>
      </View>
    );
  };

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
      {/* Projects list */}
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.projectsList}
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
          onPress={handleCreateProject}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

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
  projectsList: {
    paddingTop: spacing.lg, // Space below header title
    paddingBottom: spacing.xxl + 60, // Extra padding for FAB
  },
  projectCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.border,
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  projectContent: {
    padding: spacing.lg,
  },
  projectTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  projectDescription: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  projectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
  },
  recruiterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
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
  applicationsCount: {
    fontSize: 14, lineHeight: 20,
    color: colors.primary,
    },
  artistInfo: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  applicationStatusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  appliedText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
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
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.white,
    },
});

export default ProjectsScreen;







