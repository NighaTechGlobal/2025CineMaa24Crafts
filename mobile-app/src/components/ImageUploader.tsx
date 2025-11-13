import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';
import { pickAndUploadImage } from '../utils/imagePicker';
import { asImageUri } from '@/utils/images';

interface ImageUploaderProps {
  value?: string; // base64 image string
  onChange: (base64: string) => void;
  placeholder?: string;
  aspectRatio?: [number, number];
  shape?: 'square' | 'circle' | 'rectangle';
  size?: number;
  preferBase64?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  placeholder = 'Add Photo',
  aspectRatio = [1, 1],
  shape = 'circle',
  size = 120,
  preferBase64 = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = async () => {
    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setUploading(true);
    try {
      const base64 = await pickAndUploadImage({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
        preferBase64,
      });

      if (base64) {
        onChange(base64);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const containerStyle = [
    styles.container,
    shape === 'circle' && styles.circleContainer,
    shape === 'square' && styles.squareContainer,
    shape === 'rectangle' && styles.rectangleContainer,
    { width: size, height: size },
  ];

  const imageStyle = [
    styles.image,
    shape === 'circle' && styles.circleImage,
    shape === 'square' && styles.squareImage,
    shape === 'rectangle' && styles.rectangleImage,
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {value ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: asImageUri(value)! }} style={imageStyle} />
            {!uploading && (
              <View style={styles.editBadge}>
                <LinearGradient
                  colors={colors.gradientAccent}
                  style={styles.editBadgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="camera" size={16} color={colors.white} />
                </LinearGradient>
              </View>
            )}
          </View>
        ) : (
          <LinearGradient
            colors={[colors.primaryLight + '40', colors.primary + '20']}
            style={[styles.placeholder, imageStyle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={40} color={colors.primary} />
                <Text style={styles.placeholderText}>{placeholder}</Text>
              </>
            )}
          </LinearGradient>
        )}

        {uploading && value && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    ...shadows.medium,
  },
  circleContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  squareContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  rectangleContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  circleImage: {
    borderRadius: 9999,
  },
  squareImage: {
    borderRadius: borderRadius.lg,
  },
  rectangleImage: {
    borderRadius: borderRadius.md,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14, lineHeight: 20,
    color: colors.primary,
    marginTop: spacing.sm,
    },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  editBadgeGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  uploadingText: {
    fontSize: 14, lineHeight: 20,
    color: colors.white,
    marginTop: spacing.sm,
    },
});





