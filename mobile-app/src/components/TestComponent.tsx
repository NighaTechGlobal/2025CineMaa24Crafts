import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../styles/tokens';

const TestComponent: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>24Krafts UI is working!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gradStart,
    },
    text: {
        fontSize: fontSize.body,
        color: colors.primaryText,
    },
});

export default TestComponent;




