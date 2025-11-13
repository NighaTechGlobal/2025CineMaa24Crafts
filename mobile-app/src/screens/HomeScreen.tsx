import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FeedPost from '../components/FeedPost';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { listPosts, toggleLike } from '../services/api';
import { colors, spacing } from '../styles/tokens';
import { getUser } from '../services/authStorage';

const GUEST_MODE_KEY = '@guest_mode';
const GUEST_ROLE_KEY = '@guest_role';

export default function HomeScreen({ navigation }: any) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      // Check if in guest mode
      const isGuestMode = await AsyncStorage.getItem(GUEST_MODE_KEY);
      
      if (isGuestMode === 'true') {
        // Get guest role
        const guestRole = await AsyncStorage.getItem(GUEST_ROLE_KEY);
        setUserRole(guestRole);
      } else {
        // Get authenticated user role
        const user = await getUser();
        setUserRole(user?.role || 'artist');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('artist'); // Default to artist
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <HomeFeed navigation={navigation} userRole={userRole} />;
}

function HomeFeed({ navigation, userRole }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const { data, loading, hasMore, loadMore, refresh } = useCursorPagination(
    async (cursor, limit) => await listPosts(cursor, limit),
    20
  );

  // Only load data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsFocused(true);
      refresh();
    });

    return unsubscribe;
  }, [navigation]);

  // Don't render if not focused yet
  if (!isFocused && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
      // Optionally refresh to get updated counts
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to comments screen or show comment modal
    console.log('Comment on post:', postId);
  };

  const renderPost = ({ item }: { item: any }) => (
    <FeedPost
      post={item}
      onLike={() => handleLike(item.id)}
      onComment={() => handleComment(item.id)}
    />
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
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderPost}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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







