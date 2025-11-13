import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../styles/tokens';
import { useKeyboardAware } from '../hooks/useKeyboardAware';

interface SearchPillProps {
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

const SearchPill: React.FC<SearchPillProps> = ({
    placeholder = 'Find places, food, Trips...',
    onFocus,
    onBlur
}) => {
    const { isKeyboardVisible } = useKeyboardAware();

    return (
        <View style={[styles.container, isKeyboardVisible && styles.containerFocused]}>
            {/* Search Icon */}
            <TouchableOpacity style={styles.icon}>
                {/* In a real implementation, you would use an actual icon component */}
                <View style={styles.iconPlaceholder} />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.secondaryText}
                onFocus={onFocus}
                onBlur={onBlur}
            />

            {/* Microphone Icon */}
            <TouchableOpacity style={styles.icon}>
                {/* In a real implementation, you would use an actual icon component */}
                <View style={styles.iconPlaceholder} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        shadowColor: colors.primaryText,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.md,
    },
    containerFocused: {
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    icon: {
        padding: spacing.xs,
    },
    iconPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.secondaryText,
    },
    input: {
        flex: 1,
        fontSize: fontSize.body,
        color: colors.primaryText,
        paddingHorizontal: spacing.sm,
    },
});

export default SearchPill;




