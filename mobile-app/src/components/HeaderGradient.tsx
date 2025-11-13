import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../styles/tokens';

const { width } = Dimensions.get('window');

interface HeaderGradientProps {
    children?: React.ReactNode;
}

const HeaderGradient: React.FC<HeaderGradientProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            <View style={styles.gradient} />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.gradStart,
    },
});

export default HeaderGradient;




