import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../styles/tokens';

const MessagesScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>Your conversations will appear here</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cardBackground,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    title: {
        fontSize: fontSize.body,
        color: colors.primaryText,
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: fontSize.body,
        color: colors.secondaryText,
        textAlign: 'center',
    },
});

export default MessagesScreen;






