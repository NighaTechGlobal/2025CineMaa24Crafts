import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { uploadFile } from '../services/api';

export interface ImagePickerResult {
  uri: string;
  url?: string;
  base64?: string;
  canceled: boolean;
}

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos!'
      );
      return false;
    }
  }
  return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need photo library permissions to select images!'
      );
      return false;
    }
  }
  return true;
};

/**
 * Pick an image from library
 */
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? 0.8,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        canceled: false,
      };
    }

    return { uri: '', canceled: true };
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

/**
 * Take a photo with camera
 */
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePickerResult | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        canceled: false,
      };
    }

    return { uri: '', canceled: true };
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo');
    return null;
  }
};

/**
 * Show option to pick from library or take photo
 */
export const showImagePickerOptions = (): Promise<'library' | 'camera' | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add your photo',
      [
        {
          text: 'Take Photo',
          onPress: () => resolve('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => resolve('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
};

/**
 * Pick and upload image to Supabase
 */
export const pickAndUploadImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  bucket?: string;
  preferBase64?: boolean;
}): Promise<string | null> => {
  try {
    const choice = await showImagePickerOptions();
    if (!choice) return null;

    let result: ImagePickerResult | null = null;

    if (choice === 'camera') {
      result = await takePhoto(options);
    } else {
      result = await pickImage(options);
    }

    if (!result || result.canceled || !result.uri) {
      return null;
    }

    // If preferBase64, return base64 directly (useful for unauthenticated flows)
    if (options?.preferBase64) {
      if ((result as any).base64) {
        return (result as any).base64 as string;
      }
      const FileSystem = require('expo-file-system/legacy');
      const base64Direct = await FileSystem.readAsStringAsync(result.uri, { encoding: 'base64' });
      return base64Direct;
    }

    // Upload to backend, otherwise
    const formData = new FormData();
    
    // Create file object
    const filename = result.uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: result.uri,
      name: filename,
      type,
    } as any);

    try {
      const uploadResult = await uploadFile(formData);
      if (uploadResult) {
        const url = uploadResult.publicUrl || uploadResult.url || uploadResult.image;
        if (url) return url as string;
      }
      throw new Error('Upload failed');
    } catch (e: any) {
      // Fallback for unauthenticated signup flows: return local base64
      try {
        const FileSystem = require('expo-file-system/legacy');
        const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: 'base64' });
        return base64;
      } catch (readErr) {
        throw e;
      }
    }
  } catch (error) {
    console.error('Error picking and uploading image:', error);
    Alert.alert('Error', 'Failed to upload image. Please try again.');
    return null;
  }
};

/**
 * Compress image URI (for optimization before upload)
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.7
): Promise<string> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri;
  }
};

