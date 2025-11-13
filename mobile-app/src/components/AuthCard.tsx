import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';

interface AuthCardProps {
    onLoginPress?: () => void;
    onRegisterPress?: () => void;
    onRoleToggle?: (role: 'artist' | 'recruiter') => void;
}

const AuthCard: React.FC<AuthCardProps> = ({
    onLoginPress,
    onRegisterPress,
    onRoleToggle,
}) => {
    const [role, setRole] = useState<'artist' | 'recruiter'>('artist');
    const [phoneNumber, setPhoneNumber] = useState('');

    const toggleRole = () => {
        const newRole = role === 'artist' ? 'recruiter' : 'artist';
        setRole(newRole);
        onRoleToggle?.(newRole);
    };

    return (
        <View style={styles.container}>
            {/* Role Toggle */}
            <View style={styles.roleToggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.roleButton,
                        role === 'artist' && styles.activeRoleButton,
                    ]}
                    onPress={() => {
                        setRole('artist');
                        onRoleToggle?.('artist');
                    }}
                >
                    <Text
                        style={[
                            styles.roleButtonText,
                            role === 'artist' && styles.activeRoleButtonText,
                        ]}
                    >
                        Artist
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.roleButton,
                        role === 'recruiter' && styles.activeRoleButton,
                    ]}
                    onPress={toggleRole}
                >
                    <Text
                        style={[
                            styles.roleButtonText,
                            role === 'recruiter' && styles.activeRoleButtonText,
                        ]}
                    >
                        Recruiter
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerButton} onPress={onRegisterPress}>
                    <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '90%',
        maxWidth: 400,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6,
    },
    roleToggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.accentInactive,
        borderRadius: borderRadius.xl,
        padding: 4,
        marginBottom: spacing.xl,
    },
    roleButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    activeRoleButton: {
        backgroundColor: colors.gradStart,
    },
    roleButtonText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    activeRoleButtonText: {
        color: colors.primaryText,
        },
    inputContainer: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: fontSize.caption,
        color: colors.primaryText,
        marginBottom: spacing.sm,
        },
    input: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        borderBottomWidth: 1,
        borderBottomColor: colors.accentInactive,
        paddingVertical: spacing.sm,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    loginButton: {
        flex: 1,
        backgroundColor: colors.gradStart,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginRight: spacing.sm,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    loginButtonText: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        },
    registerButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.accentInactive,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    registerButtonText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        },
    inputText: {
        fontSize: fontSize.body,
        color: colors.text,
        flex: 1,
    },
    buttonText: {
        fontSize: fontSize.body,
        fontWeight: '600',
        color: colors.textWhite,
    },
    linkText: {
        fontSize: fontSize.body,
        color: colors.primary,
        textDecorationLine: 'underline',
    },
});

export default AuthCard;




