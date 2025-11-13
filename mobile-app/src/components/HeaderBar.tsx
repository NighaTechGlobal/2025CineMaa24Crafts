import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// Removed gradient in favor of solid purple background
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../styles/tokens';

interface HeaderBarProps {
  title: string;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  rightIconName,
  onRightPress,
  leftIconName,
  onLeftPress,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.leftArea}>
          {leftIconName && (
            <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
              <Ionicons name={leftIconName} size={22} color={colors.white} />
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.rightArea}>
          {rightIconName && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Ionicons name={rightIconName} size={22} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: 16,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.h4,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
});

export default HeaderBar;