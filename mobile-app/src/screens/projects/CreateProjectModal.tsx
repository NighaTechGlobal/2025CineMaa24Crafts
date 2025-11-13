import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';

interface CreateProjectModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (projectData: any) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    visible,
    onClose,
    onCreate,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [poster, setPoster] = useState('');
    const [team, setTeam] = useState<string[]>([]);

    const handleCreate = () => {
        const projectData = {
            title,
            description,
            startDate,
            endDate,
            poster,
            team,
        };

        onCreate(projectData);
        // Reset form
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setPoster('');
        setTeam([]);
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
                    <Text style={styles.headerTitle}>Create Project</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter project title"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter project description"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.formRow}>
                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>Start Date *</Text>
                            <TextInput
                                style={styles.input}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>

                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>End Date *</Text>
                            <TextInput
                                style={styles.input}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Poster</Text>
                        <TouchableOpacity style={styles.posterUpload}>
                            <Text style={styles.posterUploadText}>Upload poster</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Team</Text>
                        <TouchableOpacity style={styles.teamSelect}>
                            <Text style={styles.teamSelectText}>Select team members</Text>
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
                        disabled={!title || !startDate || !endDate}
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
        height: 100,
        textAlignVertical: 'top',
    },
    posterUpload: {
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'center',
    },
    posterUploadText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    teamSelect: {
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'center',
    },
    teamSelectText: {
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

export default CreateProjectModal;






