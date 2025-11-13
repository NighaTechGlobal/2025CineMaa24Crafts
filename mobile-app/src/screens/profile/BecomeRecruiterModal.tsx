import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../styles/tokens';

interface BecomeRecruiterModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (recruiterData: any) => void;
}

const BecomeRecruiterModal: React.FC<BecomeRecruiterModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [companyName, setCompanyName] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyLogo, setCompanyLogo] = useState('');

    const handleSubmit = () => {
        const recruiterData = {
            companyName,
            companyPhone,
            companyEmail,
            companyLogo,
        };

        onSubmit(recruiterData);
        // Reset form
        setCompanyName('');
        setCompanyPhone('');
        setCompanyEmail('');
        setCompanyLogo('');
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
                    <Text style={styles.headerTitle}>Become a Recruiter</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Company Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={companyName}
                            onChangeText={setCompanyName}
                            placeholder="Enter company name"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Company Phone</Text>
                        <TextInput
                            style={styles.input}
                            value={companyPhone}
                            onChangeText={setCompanyPhone}
                            placeholder="Enter company phone"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Company Email</Text>
                        <TextInput
                            style={styles.input}
                            value={companyEmail}
                            onChangeText={setCompanyEmail}
                            placeholder="Enter company email"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Company Logo</Text>
                        <TouchableOpacity style={styles.logoUpload}>
                            <Text style={styles.logoUploadText}>Upload logo</Text>
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
                        style={[styles.button, styles.submitButton]}
                        onPress={handleSubmit}
                        disabled={!companyName}
                    >
                        <Text style={styles.buttonText}>Submit</Text>
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
    label: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.sm,
        },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.body,
        color: colors.primaryText,
        backgroundColor: colors.surface,
    },
    logoUpload: {
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        backgroundColor: colors.white,
        alignItems: 'center',
    },
    logoUploadText: {
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
    submitButton: {
        backgroundColor: colors.gradStart,
    },
    buttonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
    textArea: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.body,
        color: colors.primaryText,
        backgroundColor: colors.surface,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        color: colors.error,
        fontSize: fontSize.body,
        marginTop: spacing.xs,
    },
});

export default BecomeRecruiterModal;






