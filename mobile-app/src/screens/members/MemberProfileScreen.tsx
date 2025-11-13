import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking, Modal, RefreshControl } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../styles/tokens';
import { getProfile, getAuthProfile, createConversation, listProjects, listSchedules, listConversations, getRecruiterProjects, addProjectMember } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '../../hooks/useDialog';

interface MemberProfileScreenProps {
  route: any;
  navigation: any;
}

const MemberProfileScreen = ({ route, navigation }: MemberProfileScreenProps) => {
  const { memberId, profile: memberFromList } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<any>(memberFromList || null);
  const [current, setCurrent] = useState<any>(null);
  const [projectsCount, setProjectsCount] = useState<number | null>(null);
  const [schedulesCount, setSchedulesCount] = useState<number | null>(null);
  const [conversationsCount, setConversationsCount] = useState<number | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);
  const { showDialog, hideDialog, DialogPortal } = useDialog();
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [{ profile: authProfile }, profileData] = await Promise.all([
        getAuthProfile(),
        getProfile(memberId),
      ]);
      setCurrent(authProfile);
      const artist = Array.isArray(profileData?.artist_profiles) ? (profileData.artist_profiles?.[0] || {}) : (profileData?.artist_profiles || {});
      const recruiter = Array.isArray(profileData?.recruiter_profiles) ? (profileData.recruiter_profiles?.[0] || {}) : (profileData?.recruiter_profiles || {});
      const department = artist?.department ?? recruiter?.department ?? profileData?.department ?? null;
      const bio = artist?.bio ?? recruiter?.bio ?? profileData?.bio ?? null;
      setMember({
        ...profileData,
        department,
        bio,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [memberId]);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      if (!member?.id) return;
      try {
        const [convRes, schedRes, projRes] = await Promise.all([
          listConversations(member.id, undefined, 20).catch(() => ({ data: [] })),
          // listSchedules signature: (cursor?, limit=20, profileId?, projectId?)
          // We pass profileId to get schedules related to this member
          listSchedules(undefined, 20, member.id).catch(() => ({ data: [] })),
          member.role === 'recruiter'
            ? listProjects(undefined, 20, member.id).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);
        if (!active) return;
        setConversationsCount(Array.isArray((convRes as any).data) ? (convRes as any).data.length : 0);
        setSchedulesCount(Array.isArray((schedRes as any).data) ? (schedRes as any).data.length : 0);
        setProjectsCount(Array.isArray((projRes as any).data) ? (projRes as any).data.length : 0);
      } catch (e) {
        // Silently ignore stats errors; keep UI responsive
      }
    };
    loadStats();
    return () => { active = false; };
  }, [member?.id, member?.role]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const openInviteModal = async () => {
    try {
      const list = await getRecruiterProjects();
      setMyProjects(Array.isArray(list) ? list : []);
      setInviteModalVisible(true);
    } catch (e) {
      console.warn('Failed to load recruiter projects', e);
      showDialog({
        title: 'Error',
        message: 'Unable to load your projects.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    }
  };

  const handleInviteToProject = async (projectId: string) => {
    if (!member?.id) return;
    setInviting(true);
    try {
      await addProjectMember(projectId, member.id);
      showDialog({
        title: 'Invitation Sent',
        message: 'The artist was invited to your project.',
        type: 'success',
        primaryLabel: 'OK',
        onPrimaryPress: () => {
          hideDialog();
          setInviteModalVisible(false);
        },
      });
    } catch (e) {
      showDialog({
        title: 'Failed to Invite',
        message: 'Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } finally {
      setInviting(false);
    }
  };

  const canChat = useMemo(() => {
    if (!current || !member) return false;
    const isCurrentRecruiter = current.role === 'recruiter';
    const isCurrentArtist = current.role === 'artist';
    const isTargetArtist = member.role === 'artist';
    if (isCurrentRecruiter) return true;
    if (isCurrentArtist && isTargetArtist) return true;
    return false;
  }, [current, member]);

  const handleChat = async () => {
    try {
      if (!current || !member) return;
      const conv = await createConversation({
        is_group: false,
        member_ids: [current.id, member.id],
      });
      navigation.navigate('ChatRoom', {
        conversationId: conv.id,
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Chat',
      });
    } catch (e) {
      showDialog({
        title: 'Chat Error',
        message: 'Unable to start chat. Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    }
  };

  const openLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      showDialog({
        title: 'Open Link Failed',
        message: 'Unable to open link.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !member) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown User';
  const location = [member.city, member.state].filter(Boolean).join(', ');
  const isPremium = !!member.premium_until;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          {canChat && (
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.white} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.profileHeader}>
          {member.profile_pic ? (
            <Image source={{ uri: member.profile_pic }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{member.first_name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileRole}>{member.role?.charAt(0).toUpperCase() + member.role?.slice(1)}</Text>
          <View style={styles.badgesRow}>
            {member.department && (
              <View style={styles.badgeChip}>
                <Ionicons name="briefcase-outline" size={14} color={colors.white} />
                <Text style={styles.badgeText}>{member.department}</Text>
              </View>
            )}
            {member.maa_associative_number && (
              <View style={[styles.badgeChip, styles.badgeAccent]}>
                <Ionicons name="ribbon-outline" size={14} color={colors.white} />
                <Text style={styles.badgeText}>MAA</Text>
              </View>
            )}
            {isPremium && (
              <View style={[styles.badgeChip, styles.badgePremium]}>
                <Ionicons name="star" size={14} color={colors.white} />
                <Text style={styles.badgeText}>Premium</Text>
              </View>
            )}
          </View>
          {isPremium && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>⭐ Premium</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <Text style={styles.statLabel}>Conversations</Text>
              <Text style={styles.statValue}>{conversationsCount ?? '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={styles.statLabel}>Schedules</Text>
              <Text style={styles.statValue}>{schedulesCount ?? '—'}</Text>
            </View>
            {member.role === 'recruiter' && (
              <View style={styles.statCard}>
                <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
                <Text style={styles.statLabel}>Projects</Text>
                <Text style={styles.statValue}>{projectsCount ?? '—'}</Text>
              </View>
            )}
          </View>
        </View>

        {member.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bodyText}>{member.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          {member.department && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoText}>{member.department}</Text>
              </View>
            </View>
          )}

          {member.gender && (
            <View style={styles.infoRow}>
              <Ionicons name="transgender-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoText}>{member.gender}</Text>
              </View>
            </View>
          )}

          {location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoText}>{location}</Text>
              </View>
            </View>
          )}

          {member.maa_associative_number && (
            <View style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>MAA Associative Number</Text>
                <Text style={styles.infoText}>{member.maa_associative_number}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {member.users?.email && (
            <TouchableOpacity style={styles.infoRow} onPress={() => openLink(`mailto:${member.users.email}`)}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoText}>{member.users.email}</Text>
              </View>
            </TouchableOpacity>
          )}

          {member.users?.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={() => openLink(`tel:${member.users.phone}`)}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoText}>{member.users.phone}</Text>
              </View>
            </TouchableOpacity>
          )}

          {member.alt_phone && (
            <TouchableOpacity style={styles.infoRow} onPress={() => openLink(`tel:${member.alt_phone}`)}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Alternate Phone</Text>
                <Text style={styles.infoText}>{member.alt_phone}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {Array.isArray(member.profile_social_links) && member.profile_social_links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social</Text>
            {member.profile_social_links.map((link: any) => (
              <TouchableOpacity key={link.id} style={styles.infoRow} onPress={() => openLink(link.url)}>
                <Ionicons name="link-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{link.platform}</Text>
                  <Text style={styles.infoText} numberOfLines={1}>{link.url}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {current?.role === 'recruiter' && (
          <TouchableOpacity style={styles.inviteButton} onPress={openInviteModal}>
            <Ionicons name="person-add-outline" size={18} color={colors.white} />
            <Text style={styles.inviteButtonText}>Invite to Project</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {/* Invite to Project Modal */}
      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a Project</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {myProjects.length === 0 && (
                <Text style={styles.modalEmpty}>No projects found. Create a project first.</Text>
              )}
              {myProjects.map((p: any) => (
                <TouchableOpacity key={p.id} style={styles.projectItem} onPress={() => handleInviteToProject(p.id)} disabled={inviting}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectTitle} numberOfLines={1}>{p.title}</Text>
                    {p.applications_count != null && (
                      <Text style={styles.projectMeta}>{p.applications_count} applications</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setInviteModalVisible(false)} disabled={inviting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modern dialog overlay */}
      <DialogPortal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.primary,
  },
  backButton: { padding: spacing.sm, borderRadius: borderRadius.full },
  headerTitle: { fontSize: fontSize.h3, color: colors.white, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  chatButtonText: { color: colors.white, fontSize: fontSize.caption },
  content: { flex: 1 },
  profileHeader: { alignItems: 'center', padding: spacing.lg },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, marginBottom: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 44, color: colors.white },
  profileName: { fontSize: fontSize.h3, color: colors.primaryText, fontWeight: '700', marginBottom: spacing.xs },
  profileRole: { fontSize: fontSize.body, color: colors.secondaryText },
  verifiedBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  verifiedText: { fontSize: fontSize.caption, color: colors.white },
  badgesRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  badgeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeText: { color: colors.white, fontSize: fontSize.caption },
  badgeAccent: { backgroundColor: colors.accentActive },
  badgePremium: { backgroundColor: '#7C3AED' },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  sectionTitle: { fontSize: fontSize.body, color: colors.text, marginBottom: spacing.md },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginRight: spacing.sm },
  statLabel: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs },
  statValue: { fontSize: fontSize.h4, color: colors.text, fontWeight: '700', marginTop: spacing.xs },
  bodyText: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  infoContent: { marginLeft: spacing.sm, flex: 1 },
  infoLabel: { fontSize: fontSize.caption, color: colors.textSecondary },
  infoText: { fontSize: fontSize.body, color: colors.text },
  inviteButton: {
    alignSelf: 'center',
    marginVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  inviteButtonText: { fontSize: fontSize.body, color: colors.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  modalTitle: { fontSize: fontSize.h4, color: colors.text, fontWeight: '700', marginBottom: spacing.md },
  modalEmpty: { fontSize: fontSize.body, color: colors.textSecondary, marginVertical: spacing.md },
  projectItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  projectTitle: { fontSize: fontSize.body, color: colors.text },
  projectMeta: { fontSize: fontSize.caption, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  modalCancel: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  modalCancelText: { color: colors.primary, fontSize: fontSize.body },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text },
  retryButton: { marginTop: spacing.md, backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.full },
  retryText: { color: colors.white },
});

export default MemberProfileScreen;
