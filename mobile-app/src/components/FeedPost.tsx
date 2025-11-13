import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { asImageUri } from '@/utils/images';
import { safeDate } from '../utils/dates';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../styles/tokens';

const { width } = Dimensions.get('window');

interface FeedPostProps {
  post: any;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export default function FeedPost({ post, onLike, onComment, onSave, onShare }: FeedPostProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.();
  };

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri: post.profiles?.profile_photo_url || 'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {post.profiles?.first_name || ''} {post.profiles?.last_name || ''}
          </Text>
          <Text style={styles.timestamp}>{safeDate(post.created_at)}</Text>
        </View>
      </View>

      {/* Post Image */}
      {post.image ? (
        <Image
          source={{ uri: asImageUri(post.image) }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Caption */}
      {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? colors.primary : colors.text}
          />
        </TouchableOpacity>

        {onShare && (
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Feather name="share-2" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
  },
  timestamp: {
    fontSize: 12, lineHeight: 16,
    color: colors.textSecondary,
  },
  postImage: {
    width: width,
    height: width * 0.75,
    backgroundColor: colors.surface,
  },
  caption: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    marginLeft: spacing.xs,
  },
});






