import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, borderRadius } from '../../styles/tokens';
import HeaderBar from '../../components/HeaderBar';
import { createSchedule, getRecruiterProjects } from '../../services/api';
import { useDialog } from '../../hooks/useDialog';

export default function CreateScheduleScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    project_id: '',
  });
  const { showDialog, hideDialog, DialogPortal } = useDialog();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getRecruiterProjects();
      // Backend returns array directly, not wrapped in data property
      const projectsArray = Array.isArray(response) ? response : (response?.data || []);
      setProjects(projectsArray);
    } catch (error) {
      console.error('Error loading projects:', error);
      showDialog({
        title: 'Error Loading Projects',
        message: 'Failed to load your projects. You can still create a schedule without selecting a project.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      // Don't block the form if projects fail to load - it's optional
      setProjects([]);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.project_id) {
      showDialog({
        title: 'Validation Error',
        message: 'Please select a project.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    if (!formData.title.trim()) {
      showDialog({
        title: 'Validation Error',
        message: 'Schedule title is required.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    if (!formData.date.trim()) {
      showDialog({
        title: 'Validation Error',
        message: 'Date is required.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    if (!formData.location.trim()) {
      showDialog({
        title: 'Validation Error',
        message: 'Location is required.',
        type: 'warning',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        location: formData.location,
        project_id: formData.project_id, // Required field
      };

      await createSchedule(scheduleData);
      showDialog({
        title: 'Schedule Created',
        message: 'Your schedule has been created successfully.',
        type: 'success',
        primaryLabel: 'Great',
        onPrimaryPress: () => {
          hideDialog();
          navigation.goBack();
        },
      });
    } catch (error: any) {
      console.error('Create schedule error:', error);
      showDialog({
        title: 'Create Failed',
        message: error.response?.data?.message || 'Failed to create schedule. Please try again.',
        type: 'error',
        primaryLabel: 'OK',
        onPrimaryPress: hideDialog,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={styles.container}
    >
      <HeaderBar
        title="Create Schedule"
        leftIconName="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.project_id}
              onValueChange={(value) => {
                handleChange('project_id', value);
                setSelectedProject(value);
              }}
              style={styles.picker}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Select a project" value="" />
              {projects.map((project) => (
                <Picker.Item
                  key={project.id}
                  label={project.title}
                  value={project.id}
                />
              ))}
            </Picker>
          </View>
          {projects.length === 0 && (
            <Text style={styles.helperText}>
              Loading projects... Please create a project first if you don't have any.
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Schedule Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleChange('title', value)}
            placeholder="Enter schedule title"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Describe the schedule"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => handleChange('date', value)}
            placeholder="YYYY-MM-DD (e.g., 2024-12-31)"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeGroup}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={formData.start_time}
              onChangeText={(value) => handleChange('start_time', value)}
              placeholder="HH:MM"
              placeholderTextColor={colors.text}
            />
          </View>

          <View style={styles.timeGroup}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              value={formData.end_time}
              onChangeText={(value) => handleChange('end_time', value)}
              placeholder="HH:MM"
              placeholderTextColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(value) => handleChange('location', value)}
            placeholder="Enter location"
            placeholderTextColor={colors.textSecondary}
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
            <Text style={styles.submitButtonText}>Create Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {/* Modern dialog overlay */}
      <DialogPortal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timeGroup: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentInactive,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 50 : 50,
    color: colors.text,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
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
