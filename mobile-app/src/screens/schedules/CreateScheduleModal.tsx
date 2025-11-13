import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';

interface CreateScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (scheduleData: any) => void;
}

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
    visible,
    onClose,
    onCreate,
}) => {
    const [project, setProject] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

    const handleCreate = () => {
        const scheduleData = {
            project,
            date,
            startTime,
            endTime,
            location,
            notes,
            assignedMembers,
        };

        onCreate(scheduleData);
        // Reset form
        setProject('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setNotes('');
        setAssignedMembers([]);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Create Schedule</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Project *</Text>
                        <TextInput
                            style={styles.input}
                            value={project}
                            onChangeText={setProject}
                            placeholder="Select project"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Date *</Text>
                        <TextInput
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>

                    <View style={styles.formRow}>
                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>Start Time *</Text>
                            <TextInput
                                style={styles.input}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="HH:MM"
                            />
                        </View>

                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>End Time *</Text>
                            <TextInput
                                style={styles.input}
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="HH:MM"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Location *</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter location"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Enter notes"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Assigned Members</Text>
                        <TouchableOpacity style={styles.memberSelect}>
                            <Text style={styles.memberSelectText}>Select members</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.createButton]}
                        onPress={handleCreate}
                        disabled={!project || !date || !startTime || !endTime || !location}
                    >
                        <Text style={styles.buttonText}>Create</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cardBackground,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        backgroundColor: colors.gradStart,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
    },
    headerTitle: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
    closeButton: {
        padding: spacing.sm,
    },
    closeButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    formRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    formGroupHalf: {
        flex: 0.48,
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.sm,
        },
    input: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    memberSelect: {
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'center',
    },
    memberSelectText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.accentInactive,
    },
    button: {
        flex: 0.48,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.accentInactive,
    },
    createButton: {
        backgroundColor: colors.gradStart,
    },
    buttonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
});

export default CreateScheduleModal;






