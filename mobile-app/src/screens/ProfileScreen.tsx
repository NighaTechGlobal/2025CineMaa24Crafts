import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthProfile, becomeRecruiter } from '../services/api';
import { useAuth } from '../providers/AuthProvider';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';
import HeaderBar from '../components/HeaderBar';
import { asImageUri } from '@/utils/images';
import { useDialog } from '../hooks/useDialog';

type ProfileSection = 'personal' | 'professional' | 'contact';

export default function ProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');
  const { showDialog, hideDialog, DialogPortal } = useDialog();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getAuthProfile();
      setProfile(response.profile);
      setUser(response.user);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const handleBecomeRecruiter = () => {
    showDialog({
      title: 'Become a Recruiter',
      message: 'Are you sure you want to become a recruiter? You can set your company name now and update it later in Edit Profile.',
      type: 'info',
      secondaryLabel: 'Cancel',
      onSecondaryPress: hideDialog,
      primaryLabel: 'Continue',
      onPrimaryPress: async () => {
        hideDialog();
        const companyName = 'My Company';
        try {
          await becomeRecruiter(profile.id, { companyName });
          showDialog({
            title: 'Success',
            message: 'You are now a recruiter! The app will refresh.',
            type: 'success',
            primaryLabel: 'OK',
            onPrimaryPress: () => {
              hideDialog();
              loadProfile();
            },
          });
        } catch (error: any) {
          console.error('Error becoming recruiter:', error);
          showDialog({
            title: 'Error',
            message: error.response?.data?.message || 'Failed to become a recruiter. Please try again.',
            type: 'error',
            primaryLabel: 'OK',
            onPrimaryPress: hideDialog,
          });
        }
      },
    });
  };

  const handleLogout = async () => {
    showDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'warning',
      secondaryLabel: 'Cancel',
      onSecondaryPress: hideDialog,
      primaryLabel: 'Logout',
      onPrimaryPress: async () => {
        hideDialog();
        await logout();
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.text }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>Unable to load profile. Please try again.</Text>
        <TouchableOpacity 
          style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md }}
          onPress={loadProfile}
        >
          <Text style={{ color: colors.white }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="Profile" 
        rightIconName="chatbubble-ellipses-outline"
        onRightPress={() => (navigation as any).navigate('ChatList')}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
      <View style={styles.header}>
        <Image
          source={{
            uri: asImageUri(profile.profile_pic) || 'https://via.placeholder.com/120',
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {profile.first_name || ''} {profile.last_name || 'User'}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Section Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'personal' && styles.tabActive]}
          onPress={() => setActiveSection('personal')}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={activeSection === 'personal' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'personal' && styles.tabTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'professional' && styles.tabActive]}
          onPress={() => setActiveSection('professional')}
        >
          <Ionicons 
            name="briefcase-outline" 
            size={20} 
            color={activeSection === 'professional' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'professional' && styles.tabTextActive]}>
            Professional
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeSection === 'contact' && styles.tabActive]}
          onPress={() => setActiveSection('contact')}
        >
          <Ionicons 
            name="call-outline" 
            size={20} 
            color={activeSection === 'contact' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeSection === 'contact' && styles.tabTextActive]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>

      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoText}>
                {profile.first_name || 'Not provided'} {profile.last_name || ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoText}>{profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1) || 'Not provided'}</Text>
            </View>
          </View>

          {profile.gender && (
            <View style={styles.infoRow}>
              <Ionicons name="transgender-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoText}>{profile.gender}</Text>
              </View>
            </View>
          )}

          {(profile.city || profile.state) && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoText}>
                  {[profile.city, profile.state].filter(Boolean).join(', ') || 'Not provided'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Professional Information Section */}
      {activeSection === 'professional' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoText}>{profile.department || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>MAA Associative Number</Text>
              <Text style={styles.infoText}>{profile.maa_associative_number || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={20} color={colors.warning} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Premium Status</Text>
              <Text style={styles.infoText}>
                {profile.premium_until 
                  ? `Premium until ${new Date(profile.premium_until).toLocaleDateString()}`
                  : 'Not premium'}
              </Text>
            </View>
          </View>

          {profile.role && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Profile Type</Text>
                <Text style={styles.infoText}>
                  {profile.role === 'recruiter' ? 'Recruiter' : profile.role === 'artist' ? 'Artist' : profile.role}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Contact Information Section */}
      {activeSection === 'contact' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {user?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoText}>{user.phone}</Text>
              </View>
            </View>
          )}

          {profile.alt_phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Alternate Phone</Text>
                <Text style={styles.infoText}>{profile.alt_phone}</Text>
              </View>
            </View>
          )}

          {user?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoText}>{user.email}</Text>
              </View>
            </View>
          )}

          {(!user?.phone && !profile.alt_phone && !user?.email) && (
            <View style={styles.emptyInfo}>
              <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.emptyInfoText}>No contact information available</Text>
            </View>
          )}
        </View>
      )}

      {/* Become a Recruiter Button - Only for artists */}
      {profile.role === 'artist' && (
        <TouchableOpacity 
          style={styles.becomeRecruiterButton} 
          onPress={handleBecomeRecruiter}
        >
          <Ionicons name="briefcase-outline" size={20} color={colors.white} />
          <Text style={styles.becomeRecruiterText}>Become a Recruiter</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      </ScrollView>
      <DialogPortal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 30 : 24,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    textTransform: 'capitalize',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    ...shadows.small,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primaryVeryLight,
  },
  tabText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: 12, lineHeight: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 16, lineHeight: 24,
    color: colors.text,
  },
  emptyInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyInfoText: {
    fontSize: 14, lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  becomeRecruiterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.small,
  },
  becomeRecruiterText: {
    fontSize: 16, lineHeight: 24,
    color: colors.white,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16, lineHeight: 24,
    color: colors.error,
    marginLeft: spacing.sm,
    },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16, lineHeight: 24,
    color: colors.primary,
    marginLeft: spacing.sm,
    },
});


  const [refreshing, setRefreshing] = useState(false);
