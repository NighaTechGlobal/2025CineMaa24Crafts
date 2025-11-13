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
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { listProfiles } from '../services/api';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';

export default function MembersScreen() {
  const isFocused = useIsFocused();
  const [hasLoaded, setHasLoaded] = useState(false);
  const { data, loading, hasMore, loadMore, refresh } = useCursorPagination(
    async (cursor, limit) => await listProfiles(cursor, limit),
    20
  );

  useEffect(() => {
    if (isFocused && !hasLoaded) {
      refresh();
      setHasLoaded(true);
    }
  }, [isFocused]);

  const renderMember = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.memberCard}>
      <Image
        source={{
          uri: item.profile_photo_url || 'https://via.placeholder.com/60',
        }}
        style={styles.avatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.name}>
          {item.first_name || ''} {item.last_name || ''}
        </Text>
        <Text style={styles.department}>{item.department || 'N/A'}</Text>
        <Text style={styles.location}>
          {item.city}, {item.state}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
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
        <Text style={styles.emptyText}>No members found</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderMember}
        keyExtractor={(item: any) => item.id}
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
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  department: {
    fontSize: 16, lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    fontSize: 12, lineHeight: 16,
    color: colors.white,
    textTransform: 'capitalize',
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
});








