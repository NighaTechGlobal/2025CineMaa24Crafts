import { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { listSchedules, updateScheduleMemberStatus, getAuthProfile } from '../services/api';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';
import HeaderBar from '../components/HeaderBar';

export default function SchedulesScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);

  const { data, loading, hasMore, loadMore, refresh } = useCursorPagination(
    async (cursor, limit) => {
      if (!profile) return { data: [], nextCursor: null };
      return await listSchedules(cursor, limit, profile.id);
    },
    20
  );

  const handleCreateSchedule = () => {
    (navigation as any).navigate('CreateSchedule');
  };

  useEffect(() => {
    if (isFocused && !hasLoaded) {
      loadProfile();
      setHasLoaded(true);
    }
  }, [isFocused]);

  useEffect(() => {
    if (profile) {
      refresh();
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await getAuthProfile();
      setProfile(response.profile);
      setUserRole(response.profile?.role || null);
      console.log('SchedulesScreen - Profile loaded:', response.profile?.role);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdateStatus = async (scheduleId: string, status: string) => {
    if (!profile) return;

    try {
      await updateScheduleMemberStatus(scheduleId, profile.id, status);
      refresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const renderSchedule = ({ item }: { item: any }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <Text style={styles.scheduleTitle}>{item.title || 'Untitled Schedule'}</Text>
      </View>

      <Text style={styles.scheduleDescription}>{item.description}</Text>

      <View style={styles.scheduleDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString()} {item.start_time ? `• ${item.start_time}` : ''}
          </Text>
        </View>

        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
      </View>

      {profile?.role === 'artist' && (
        <View style={styles.actions}>
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
        <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={styles.emptyText}>No schedules found</Text>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <HeaderBar 
        title="Schedules" 
        rightIconName="chatbubble-ellipses-outline"
        onRightPress={() => (navigation as any).navigate('ChatList')}
      />
        {/* Show a spinner only while the first page is loading; otherwise render empty state */}
        {(loading && data.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading schedules...</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={renderSchedule}
            keyExtractor={(item: any, index: number) => item?.id ?? String(index)}
            onEndReached={() => hasMore && loadMore()}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={loading && data.length === 0}
                onRefresh={refresh}
                colors={[colors.primary]}
              />
            }
            ListFooterComponent={renderFooter}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                {profile ? (
                  <Text style={styles.emptyText}>No schedules found</Text>
                ) : (
                  <Text style={styles.emptyText}>Profile not loaded yet. Pull to refresh.</Text>
                )}
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      {/* FAB for creating new schedule - Only for recruiters */}
      {userRole === 'recruiter' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateSchedule}
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
    position: 'relative',
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
  gradient: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 30 : 24,
    flexGrow: 1,
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduleTitle: {
    fontSize: 24,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  scheduleDescription: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scheduleDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
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








