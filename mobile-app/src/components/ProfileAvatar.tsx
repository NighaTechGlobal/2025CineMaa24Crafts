import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface ProfileAvatarProps {
  profile: {
    profile_photo_url?: string | null;
    artist_profiles?: Array<{ profile_pic?: string | null }> | { profile_pic?: string | null };
    recruiter_profiles?: Array<{ profile_pic?: string | null }> | { profile_pic?: string | null };
  };
  size?: number;
  style?: any;
}

/**
 * ProfileAvatar Component
 * 
 * Displays user profile picture from multiple possible sources:
 * 1. profile_photo_url (base profiles table)
 * 2. artist_profiles.profile_pic (new users: Storage URL, old users: NULL)
 * 3. recruiter_profiles.profile_pic (new users: Storage URL, old users: NULL)
 * 4. Default avatar (fallback for NULL values)
 * 
 * Usage:
 * <ProfileAvatar profile={userProfile} size={50} />
 */
export function ProfileAvatar({ profile, size = 50, style }: ProfileAvatarProps) {
  // Helper to get profile_pic from artist or recruiter profiles
  const getProfilePic = () => {
    // Check artist_profiles
    if (profile.artist_profiles) {
      const artistProfiles = Array.isArray(profile.artist_profiles)
        ? profile.artist_profiles
        : [profile.artist_profiles];
      const profilePic = artistProfiles[0]?.profile_pic;
      if (profilePic) return profilePic;
    }

    // Check recruiter_profiles
    if (profile.recruiter_profiles) {
      const recruiterProfiles = Array.isArray(profile.recruiter_profiles)
        ? profile.recruiter_profiles
        : [profile.recruiter_profiles];
      const profilePic = recruiterProfiles[0]?.profile_pic;
      if (profilePic) return profilePic;
    }

    return null;
  };

  // Try multiple sources for profile picture
  const profilePicUrl =
    profile.profile_photo_url || 
    getProfilePic() ||
    null;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={
          profilePicUrl
            ? { uri: profilePicUrl }
            : require('../assets/default-avatar.png') // Default for old users or no photo
        }
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  image: {
    backgroundColor: '#F0F0F0',
  },
});
