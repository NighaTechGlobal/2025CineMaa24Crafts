import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, shadows } from '../styles/tokens';

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(prev => !prev);

  const isSelected = (value: string) => selected.includes(value);

  const handleSelect = (value: string) => {
    let next = [...selected];

    // Handle ALL as a special value: exclusive selection
    if (value === 'ALL') {
      next = ['ALL'];
    } else {
      // If ALL is currently selected, remove it
      next = next.filter(v => v !== 'ALL');
      if (isSelected(value)) {
        next = next.filter(v => v !== value);
      } else {
        next.push(value);
      }
    }

    onChange(next);
  };

  const displayText = selected.length > 0 ? selected.join(', ') : (placeholder || 'Select');

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={toggle} activeOpacity={0.85}>
        <Text style={styles.selectorText} numberOfLines={1}>{displayText}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.secondaryText} />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <ScrollView
            style={{ maxHeight: 300 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {options.map((opt) => {
              const selectedItem = isSelected(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.item, selectedItem && styles.itemSelected]}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.itemText, selectedItem && styles.itemTextSelected]}>
                    {opt}
                  </Text>
                  {selectedItem && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentInactive,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentInactive,
    ...shadows.small,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemSelected: {
    backgroundColor: colors.primaryVeryLight,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});

export default MultiSelectDropdown;