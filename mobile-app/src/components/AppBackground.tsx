import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../styles/tokens';

interface AppBackgroundProps {
  children?: React.ReactNode;
}

/**
 * Centralized app background component
 * Uses solid background color to match the wallet app design
 */
export const AppBackground: React.FC<AppBackgroundProps> = ({ children }) => {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryVeryLight }]}
    >
      {children}
    </View>
  );
};

export default AppBackground;

