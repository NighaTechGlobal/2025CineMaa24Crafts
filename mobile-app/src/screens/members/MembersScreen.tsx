import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows } from '../../styles/tokens';
import HeaderBar from '../../components/HeaderBar';
import { listProfiles, createConversation, getAuthProfile } from '../../services/api';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '../../hooks/useDialog';

interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  role: string;
  department?: string;
  profile_photo_url?: string;
  city?: string;
  state?: string;
  is_premium?: boolean;
  created_at: string;
}

const MembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { showDialog, hideDialog, DialogPortal } = useDialog();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'artist' | 'recruiter' | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'artist' | 'recruiter'>('all');
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Fetch only when screen is focused
  useEffect(() => {
    if (isFocused) {
      loadUserProfile();
      // Load members immediately on focus
      loadMembers(true);
    }
  }, [isFocused]);

  // Reload members when filter changes (only if focused)
  useEffect(() => {
    if (userRole !== null && isFocused) {
      loadMembers(true);
    }
  }, [filterRole, isFocused]);

  // Filter members based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => {
        const fullName = `${member.first_name} ${member.last_name || ''}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
          fullName.includes(query) ||
          member.department?.toLowerCase().includes(query) ||
          member.city?.toLowerCase().includes(query)
        );
      });
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const loadUserProfile = async () => {
    try {
      // Prefer backend-authenticated profile so gating works for session/JWT auth
      const auth = await getAuthProfile();
      const profile = auth?.profile || null;
      if (profile) {
        setUserProfile(profile);
        setUserRole(profile.role as 'artist' | 'recruiter');
        return;
      }

      // Fallback to Supabase auth (in case running in environments with Supabase session)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (sbProfile) {
          setUserProfile(sbProfile);
          setUserRole(sbProfile.role as 'artist' | 'recruiter');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadMembers = async (refresh: boolean = false) => {
    if (loading || (!hasMore && !refresh)) return;

    setLoading(true);
    try {
      const roleFilter = filterRole !== 'all' ? filterRole : undefined;
      console.debug('[MembersScreen] listProfiles call', {
        refresh,
        cursor: refresh ? undefined : cursor,
        limit: 20,
        roleFilter,
        isFocused,
      });
      const response = await listProfiles(
        refresh ? undefined : cursor,
        20,
        roleFilter
      );

      if (refresh) {
        setMembers(response.data || []);
        setFilteredMembers(response.data || []);
        setCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);
      } else {
        const newMembers = [...members, ...(response.data || [])];
        setMembers(newMembers);
        setFilteredMembers(newMembers);
        setCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      if (refresh) {
        showDialog({
          title: 'Load Failed',
          message: 'Failed to load members. Please try again.',
          type: 'error',
          primaryLabel: 'OK',
          onPrimaryPress: hideDialog,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCursor(undefined);
    setHasMore(true);
    await loadMembers(true);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (hasMore && !loading) {
      loadMembers();
    }
  };

  // Handle member press
  const handleMemberPress = (member: Member) => {
    (navigation as any).navigate('MemberProfile', { 
      memberId: member.id,
      profile: member 
    });
  };

  // Chat gating rules:
  // - Recruiters: can chat with anyone except themselves
  // - Artists: can chat with artists only (not recruiters), and not themselves
  const canInitiateChatWith = (target: Member) => {
    if (!userProfile) return false;
    const isSelf = target.user_id === userProfile.user_id;
    const isCurrentRecruiter = userProfile.role === 'recruiter';
    const isCurrentArtist = userProfile.role === 'artist';
    if (isSelf) return false;
    if (isCurrentRecruiter) return true;
    if (isCurrentArtist) return target.role === 'artist';
    return false;
  };

  const openOptions = (member: Member) => {
    setSelectedMember(member);
    setOptionsVisible(true);
  };

  const closeOptions = () => {
    setOptionsVisible(false);
    setSelectedMember(null);
  };

  const handleChat = async () => {
    if (!selectedMember || !userProfile) return;
    try {
      const conv = await createConversation({
        is_group: false,
        member_ids: [userProfile.id, selectedMember.id],
      });
      closeOptions();
      (navigation as any).navigate('ChatRoom', {
        conversationId: conv.id,
        name: `${selectedMember.first_name} ${selectedMember.last_name || ''}`.trim() || 'Chat',
      });
    } catch (e) {
      console.error('Error starting chat:', e);
      showDialog({
        title: 'Chat Error',
        message: 'Unable to start chat. Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    }
  };

  const handleDetails = () => {
    if (!selectedMember) return;
    closeOptions();
    handleMemberPress(selectedMember);
  };

  // Render member item
  const renderMember = ({ item }: { item: Member }) => {
    const fullName = `${item.first_name} ${item.last_name || ''}`.trim();
    const roleIcon = item.role === 'recruiter' ? '💼' : '🎭';
    const premiumBadge = item.is_premium ? '⭐' : null;
    const showChatOption = canInitiateChatWith(item);

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => handleMemberPress(item)}
      >
        <View style={styles.memberContent}>
          {item.profile_pic ? (
            <Image 
              source={{ uri: item.profile_pic }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.first_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}

          <View style={styles.memberInfo}>
            <View style={styles.memberNameContainer}>
              <Text style={styles.memberName}>{fullName}</Text>
              {premiumBadge && (
                <Text style={styles.premiumBadge}>{premiumBadge}</Text>
              )}
            </View>
            
            <View style={styles.memberDetails}>
              <Text style={styles.roleText}>
                {roleIcon} {item.role?.charAt(0).toUpperCase() + item.role?.slice(1)}
              </Text>
              {item.department && (
                <Text style={styles.departmentText}>
                  📂 {item.department}
                </Text>
              )}
            </View>

            {(item.city || item.state) && (
              <Text style={styles.locationText}>
                📍 {[item.city, item.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel={`Options for ${fullName}`}
          style={styles.kebabButton}
          onPressIn={(e: any) => {
            // Capture tap coordinates to anchor the popover near the kebab button
            const { pageX, pageY } = e.nativeEvent || {};
            if (pageX && pageY) {
              setMenuPosition({ x: pageX, y: pageY });
            }
          }}
          onPress={() => openOptions(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading && members.length === 0) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>No Members Found</Text>
        <Text style={styles.emptyText}>
          {searchQuery 
            ? 'Try adjusting your search query'
            : 'There are no members to display'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || members.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Removed blocking check - load members even without role

  return (
    <LinearGradient
      colors={colors.gradientApp}
      style={styles.container}
    >
      <HeaderBar 
        title="Members" 
        rightIconName="chatbubble-ellipses-outline"
        onRightPress={() => (navigation as any)?.navigate?.('ChatList')}
      />
      {/* Initial loading overlay to prevent blank state */}
      {loading && members.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
      <View style={styles.contentWrapper}>
        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'all' && styles.filterTabActive]}
          onPress={() => {
            setFilterRole('all');
            setMembers([]);
            setCursor(undefined);
            setHasMore(true);
          }}
        >
          <View style={styles.filterTabContent}>
            <Text style={[styles.filterTabIcon, filterRole === 'all' && styles.filterTabIconActive]}>👥</Text>
            <Text style={[styles.filterTabLabel, filterRole === 'all' && styles.filterTabLabelActive]}>All</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'artist' && styles.filterTabActive]}
          onPress={() => {
            setFilterRole('artist');
            setMembers([]);
            setCursor(undefined);
            setHasMore(true);
          }}
        >
          <View style={styles.filterTabContent}>
            <Text style={[styles.filterTabIcon, filterRole === 'artist' && styles.filterTabIconActive]}>🎭</Text>
            <Text style={[styles.filterTabLabel, filterRole === 'artist' && styles.filterTabLabelActive]}>Artists</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterRole === 'recruiter' && styles.filterTabActive]}
          onPress={() => {
            setFilterRole('recruiter');
            setMembers([]);
            setCursor(undefined);
            setHasMore(true);
          }}
        >
          <View style={styles.filterTabContent}>
            <Text style={[styles.filterTabIcon, filterRole === 'recruiter' && styles.filterTabIconActive]}>💼</Text>
            <Text style={[styles.filterTabLabel, filterRole === 'recruiter' && styles.filterTabLabelActive]}>Recruiters</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Members list */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.membersList}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      {/* Options modal anchored near the kebab button */}
      <Modal
        transparent
        animationType="fade"
        visible={optionsVisible}
        onRequestClose={closeOptions}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeOptions}>
          {(() => {
            const windowHeight = Dimensions.get('window').height;
            const baseTop = (menuPosition?.y ?? windowHeight / 2) - 30;
            const clampedTop = Math.max(spacing.md, Math.min(baseTop, windowHeight - 160));
            return (
              <View style={[styles.optionsPopover, { top: clampedTop }]}> 
                {selectedMember && canInitiateChatWith(selectedMember) && (
                  <TouchableOpacity style={styles.optionItem} onPress={handleChat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                    <Text style={styles.optionText}>Chat</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.optionItem} onPress={handleDetails}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                  <Text style={styles.optionText}>Details</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </TouchableOpacity>
      </Modal>
      {/* Modern dialog overlay */}
      <DialogPortal />
      </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: 0,
  },
  searchInput: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabIcon: {
    fontSize: 20, lineHeight: 24,
    color: colors.text,
    marginBottom: 4,
  },
  filterTabIconActive: {
    color: colors.white,
  },
  filterTabLabel: {
    fontSize: 14, lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  filterTabLabelActive: {
    color: colors.white,
  },
  membersList: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kebabButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  memberName: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
    marginRight: spacing.xs,
  },
  premiumBadge: {
    fontSize: 16,
  },
  memberDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  roleText: {
    fontSize: 14, lineHeight: 20,
    color: colors.primary,
    },
  departmentText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
  },
  locationText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
  },
  optionsPopover: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  optionsSheet: {
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  optionText: {
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
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
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
});

export default MembersScreen;






