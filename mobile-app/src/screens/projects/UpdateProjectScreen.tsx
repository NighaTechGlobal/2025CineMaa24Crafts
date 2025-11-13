import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/tokens';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import HeaderBar from '../../components/HeaderBar';
import { updatePost } from '../../services/api';
import { useDialog } from '../../hooks/useDialog';

const DEPARTMENT_OPTIONS = [
  'Acting', 'Direction', 'Cinematography', 'Editing', 'Sound',
  'Art Dept', 'Makeup', 'Costume', 'VFX', 'Production', 'Others',
];

export default function UpdateProjectScreen({ route, navigation }: any) {
  const { projectId, project } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    requirements: project?.requirements || '',
    location: project?.location || '',
    departments: (project?.departments as string[]) || (project?.department ? String(project?.department).split(',').map(s => s.trim()).filter(Boolean) : []),
    caption: project?.caption || '',
  });
  const { showDialog, hideDialog, DialogPortal } = useDialog();

  useEffect(() => {
    if (project) {
      setFormData({
        title: project?.title || '',
        description: project?.description || '',
        requirements: project?.requirements || '',
        location: project?.location || '',
        departments: (project?.departments as string[]) || (project?.department ? String(project?.department).split(',').map(s => s.trim()).filter(Boolean) : []),
        caption: project?.caption || '',
      });
    }
  }, [project]);

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

    setLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        caption: formData.caption,
      };
      if (formData.departments && formData.departments.length > 0) {
        payload.departments = formData.departments;
        payload.department = formData.departments.join(', ');
      }
      await updatePost(projectId, payload);
      showDialog({
        title: 'Project Updated',
        message: 'Changes saved successfully.',
        type: 'success',
        primaryLabel: 'OK',
        onPrimaryPress: () => {
          hideDialog();
          navigation.goBack();
        },
      });
    } catch (error: any) {
      showDialog({
        title: 'Update Failed',
        message: error?.response?.data?.message || 'Failed to update project. Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Update Project" leftIconName="arrow-back" onLeftPress={() => navigation.goBack()} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput style={styles.input} value={formData.title} onChangeText={(v) => handleChange('title', v)} placeholder="Enter project title" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Departments</Text>
          <MultiSelectDropdown options={["ALL", ...DEPARTMENT_OPTIONS]} selected={formData.departments} onChange={(vals: string[]) => handleChange('departments', vals)} placeholder="Select Departments" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(v) => handleChange('description', v)} placeholder="Describe the project" placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Requirements</Text>
          <TextInput style={[styles.input, styles.textArea]} value={formData.requirements} onChangeText={(v) => handleChange('requirements', v)} placeholder="Enter requirements" placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={formData.location} onChangeText={(v) => handleChange('location', v)} placeholder="Enter location" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput style={styles.input} value={formData.caption} onChangeText={(v) => handleChange('caption', v)} placeholder="Add a caption" placeholderTextColor={colors.textSecondary} />
        </View>

        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
      <DialogPortal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: Platform.OS === 'ios' ? 130 : 110 },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.accentInactive },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.white, fontSize: 18, fontWeight: '600' },
});

