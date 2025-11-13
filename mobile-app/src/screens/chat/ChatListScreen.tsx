import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { listConversations, getAuthProfile, listProfiles, createConversation } from '../../services/api';
import { colors, spacing, borderRadius, shadows } from '../../styles/tokens';
import HeaderBar from '../../components/HeaderBar';

export default function ChatListScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerMembers, setPickerMembers] = useState<any[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');
  
  const { data, loading, hasMore, loadMore, refresh } = useCursorPagination(
    async (cursor, limit) => {
      if (!profile) return { data: [], nextCursor: null };
      return await listConversations(profile.id, cursor, limit);
    },
    20
  );

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      refresh();
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await getAuthProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const canChatWith = (target: any) => {
    if (!profile) return false;
    const isSelf = target.user_id === profile.user_id;
    const isCurrentRecruiter = profile.role === 'recruiter';
    const isCurrentArtist = profile.role === 'artist';
    if (isSelf) return false;
    if (isCurrentRecruiter) return true;
    if (isCurrentArtist) return target.role === 'artist';
    return false;
  };

  const openPicker = async () => {
    setPickerVisible(true);
    if (pickerMembers.length === 0) {
      await loadPickerMembers();
    }
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerQuery('');
  };

  const loadPickerMembers = async () => {
    try {
      setPickerLoading(true);
      const roleFilter = profile?.role === 'artist' ? 'artist' : undefined;
      const resp = await listProfiles(undefined, 50, roleFilter);
      setPickerMembers(resp.data || []);
    } catch (e) {
      console.warn('Failed to load members for picker', e);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleStartChatWith = async (member: any) => {
    if (!profile) return;
    try {
      const conv = await createConversation({
        is_group: false,
        member_ids: [profile.id, member.id],
      });
      closePicker();
      const name = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chat';
      navigation.navigate('ChatRoom', { conversationId: conv.id, name });
    } catch (e) {
      console.error('Error starting chat:', e);
    }
  };

  const handleConversationPress = (conversation: any) => {
    const otherMembers = conversation.conversation_members?.filter(
      (m: any) => m.profile_id !== profile?.id
    );
    const conversationName = conversation.is_group
      ? conversation.name
      : otherMembers?.[0]?.profiles
      ? `${otherMembers[0].profiles.first_name} ${otherMembers[0].profiles.last_name}`
      : 'Chat';

    navigation.navigate('ChatRoom', {
      conversationId: conversation.id,
      name: conversationName,
    });
  };

  const renderConversation = ({ item }: { item: any }) => {
    const lastMessage = item.last_message;
    const unreadCount = item.unread_count || 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
      >
        <Image
          source={{
            uri: 'https://via.placeholder.com/50',
          }}
          style={styles.avatar}
        />
        
        <View style={styles.conversationInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.conversationName}>
              {item.is_group ? item.name : 'Chat'}
            </Text>
            {lastMessage && (
              <Text style={styles.timestamp}>
                {new Date(lastMessage.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
          
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage?.content || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={styles.emptyText}>No conversations yet</Text>
        <Text style={styles.emptySubtext}>Start a conversation to get connected</Text>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <HeaderBar title="Chats" />
      <FlatList
        data={data}
        renderItem={renderConversation}
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
        contentContainerStyle={data.length === 0 ? styles.emptyListContent : styles.listContent}
      />

      {/* New Chat FAB */}
      {profile && (
        <TouchableOpacity style={styles.fab} onPress={openPicker} accessibilityLabel="Start new chat">
          <Ionicons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Contact Picker Modal */}
      {pickerVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Start New Chat</Text>
              <TouchableOpacity onPress={closePicker} accessibilityLabel="Close picker">
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.searchHint}>
                {profile?.role === 'artist' ? 'Showing artists only' : 'Showing all members'}
              </Text>
            </View>

            {pickerLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading contacts…</Text>
              </View>
            ) : (
              <FlatList
                data={(pickerMembers || [])
                  .filter((m: any) => canChatWith(m))
                  .filter((m: any) => {
                    if (!pickerQuery.trim()) return true;
                    const q = pickerQuery.toLowerCase();
                    const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
                    return name.includes(q) || (m.city || '').toLowerCase().includes(q) || (m.state || '').toLowerCase().includes(q);
                  })}
                keyExtractor={(item: any, idx: number) => `${item.id}-${idx}`}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity style={styles.memberRow} onPress={() => handleStartChatWith(item)}>
                    {item.profile_photo_url ? (
                      <Image source={{ uri: item.profile_photo_url }} style={styles.memberAvatar} />
                    ) : (
                      <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]}>
                        <Text style={styles.memberAvatarText}>{item.first_name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    <View style={styles.memberInfoBox}>
                      <Text style={styles.memberNameText} numberOfLines={1}>
                        {`${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown'}
                      </Text>
                      <Text style={styles.memberMetaText} numberOfLines={1}>
                        {(item.role === 'recruiter' ? '💼 Recruiter' : '🎭 Artist')}
                        {item.city || item.state ? ` • ${[item.city, item.state].filter(Boolean).join(', ')}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyListBox}>
                    <Text style={styles.emptyText}>No contacts available</Text>
                    <Text style={styles.emptySubtext}>Try refreshing or adjusting filters</Text>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: spacing.lg }}
              />
            )}

            {/* Search input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Search</Text>
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Type name/city/state…"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInputBox}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingTop: Platform.OS === 'ios' ? 30 : 24,
    paddingBottom: Platform.OS === 'ios' ? 130 : 110,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 30 : 24,
    paddingBottom: Platform.OS === 'ios' ? 130 : 110,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12, lineHeight: 16,
    color: colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: 12, lineHeight: 16,
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
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchHint: {
    fontSize: 12,
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
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: colors.white,
    fontSize: 16,
  },
  memberInfoBox: {
    flex: 1,
  },
  memberNameText: {
    fontSize: 16,
    color: colors.text,
  },
  memberMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyListBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputContainer: {
    marginTop: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  searchInputBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInputText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});






