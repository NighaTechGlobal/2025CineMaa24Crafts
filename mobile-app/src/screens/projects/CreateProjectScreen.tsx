import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Picker removed in favor of custom multi-select
import { colors, spacing, borderRadius } from '../../styles/tokens';
import { createPost } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';
import HeaderBar from '../../components/HeaderBar';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import { useDialog } from '../../hooks/useDialog';

const DEPARTMENT_OPTIONS = [
  'Acting', 'Direction', 'Cinematography', 'Editing', 'Sound',
  'Art Dept', 'Makeup', 'Costume', 'VFX', 'Production', 'Others',
];

export default function CreateProjectScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    departments: [] as string[],
    caption: '',
    image: '',
  });
  const { showDialog, hideDialog, DialogPortal } = useDialog();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showDialog({
        title: 'Validation Error',
        message: 'Project title is required.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    if (!formData.departments || formData.departments.length === 0) {
      showDialog({
        title: 'Validation Error',
        message: 'Please select at least one department.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    if (!formData.image) {
      showDialog({
        title: 'Validation Error',
        message: 'Project image is required.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        department: formData.departments.join(', '),
        departments: formData.departments,
        caption: formData.caption,
        image: formData.image,
      };
      await createPost(payload);
      showDialog({
        title: 'Project Created',
        message: 'Your project has been created successfully.',
        type: 'success',
        primaryLabel: 'Great',
        onPrimaryPress: () => {
          hideDialog();
          navigation.goBack();
        },
      });
    } catch (error: any) {
      console.error('Create project error:', error);
      showDialog({
        title: 'Create Failed',
        message: error.response?.data?.message || 'Failed to create project. Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={colors.gradientApp}
      style={styles.container}
    >
      <HeaderBar
        title="Create Project"
        leftIconName="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleChange('title', value)}
            placeholder="Enter project title"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department *</Text>
          <MultiSelectDropdown
            options={["ALL", ...DEPARTMENT_OPTIONS]}
            selected={formData.departments}
            onChange={(values: string[]) => handleChange('departments', values)}
            placeholder="Select Departments"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Describe the project"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.requirements}
            onChangeText={(value) => handleChange('requirements', value)}
            placeholder="Enter requirements (e.g., experience, skills)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(value) => handleChange('location', value)}
            placeholder="Enter location (e.g., Mumbai, Maharashtra)"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.input}
            value={formData.caption}
            onChangeText={(value) => handleChange('caption', value)}
            placeholder="Add a caption or hashtags"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Image *</Text>
          <ImageUploader
            value={formData.image}
            onChange={(base64: string) => handleChange('image', base64)}
            placeholder="Upload Project Poster"
            shape="rectangle"
            aspectRatio={[16, 9]}
            size={200}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Create Project</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <DialogPortal />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 130 : 110,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.accentInactive,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Picker styles removed
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

