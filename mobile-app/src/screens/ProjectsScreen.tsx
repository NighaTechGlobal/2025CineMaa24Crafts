import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { listProjects, getMyApplications, listPosts, getAuthProfile } from '../services/api';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../utils/dates';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';
import HeaderBar from '../components/HeaderBar';

export default function ProjectsScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Always attempt to load projects when screen is focused
  useEffect(() => {
    if (isFocused) {
      loadProjects();
    }
  }, [isFocused, userRole, userProfile]);

  const loadUserProfile = async () => {
    try {
      const response = await getAuthProfile();
      setUserProfile(response.profile);
      setUserRole(response.profile?.role || null);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      if (userRole === 'recruiter' && userProfile) {
        // Recruiters see their own projects
        const response = await listPosts(undefined, 50, userProfile.id);
        setProjects(response.data || []);
      } else if (userRole === 'artist') {
        // Artists see projects they've applied to
        const response = await getMyApplications(undefined, 50);
        const appliedProjects = response.data?.map((app: any) => ({
          ...app.posts,
          applicationStatus: app.status,
          appliedAt: app.applied_at,
        })) || [];
        setProjects(appliedProjects);
      } else {
        // Unknown role or not yet loaded: show empty state without blocking UI
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    (navigation as any).navigate('CreateProject');
  };

  const handleProjectPress = (project: any) => {
    navigation.navigate('ProjectDetails', {
      projectId: project.id,
      project: project,
      userRole: userRole,
    });
  };

  const renderProject = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      {item?.image_url ? (
        <Image
          source={{ uri: asImageUri(item.image_url) }}
          style={styles.poster}
          resizeMode="cover"
        />
      ) : null}
      
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.projectDates}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            {safeDate(item.start_date)} - {safeDate(item.end_date)}
          </Text>
        </View>

        {item.profiles && (
          <Text style={styles.createdBy}>
            By: {item.profiles.first_name} {item.profiles.last_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="briefcase-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={styles.emptyText}>No projects found</Text>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <HeaderBar 
        title="Projects" 
        rightIconName="chatbubble-ellipses-outline"
        onRightPress={() => (navigation as any).navigate('ChatList')}
      />
      {/* Show a spinner only while the first page is loading; otherwise render empty state */}
      {(loading && projects.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {/* FAB for creating new project - only for recruiters */}
      {userRole === 'recruiter' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateProject}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      )}
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
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 30 : 24,
    flexGrow: 1,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  poster: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  projectInfo: {
    padding: spacing.md,
  },
  projectTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  projectDescription: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  createdBy: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
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
});







