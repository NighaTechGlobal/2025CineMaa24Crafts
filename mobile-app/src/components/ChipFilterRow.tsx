import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';

interface ChipFilterRowProps {
    filters?: string[];
    onFilterSelect?: (filter: string) => void;
}

const ChipFilterRow: React.FC<ChipFilterRowProps> = ({
    filters = ['Must-See', 'Hidden Gem', 'Food & Cafe'],
    onFilterSelect,
}) => {
    const [activeFilter, setActiveFilter] = useState(filters[0]);

    const handleFilterPress = (filter: string) => {
        setActiveFilter(filter);
        onFilterSelect?.(filter);
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {filters.map((filter, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.chip,
                        filter === activeFilter && styles.activeChip,
                    ]}
                    onPress={() => handleFilterPress(filter)}
                >
                    <Text
                        style={[
                            styles.chipText,
                            filter === activeFilter && styles.activeChipText,
                        ]}
                    >
                        {filter}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.accentInactive,
        borderWidth: 1,
        borderColor: colors.accentInactive,
    },
    activeChip: {
        backgroundColor: colors.accentActive,
        borderColor: colors.accentActive,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    chipText: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
    },
    activeChipText: {
        color: colors.primaryText,
        },
});

export default ChipFilterRow;




