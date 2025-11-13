import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../styles/tokens';

export type DialogType = 'success' | 'error' | 'info' | 'warning';

interface ModernDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: DialogType;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

const typeIcon: Record<DialogType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
  warning: 'warning',
};

const typeColor: Record<DialogType, string> = {
  success: '#10B981',
  error: '#EF4444',
  info: '#4F46E5', // indigo accent
  warning: '#F59E0B',
};

export const ModernDialog: React.FC<ModernDialogProps> = ({
  visible,
  title,
  message,
  type = 'info',
  primaryLabel = 'OK',
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  onClose,
}) => {
  const accent = typeColor[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: accent }]}>
              <Ionicons name={typeIcon[type]} size={28} color={colors.white} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </LinearGradient>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            {secondaryLabel ? (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondaryPress || onClose}>
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: accent }]}
              onPress={onPrimaryPress || onClose}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
  },
});

export default ModernDialog;