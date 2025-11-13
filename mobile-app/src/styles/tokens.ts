export const colors = {
  // Modern Purple Theme - Inspired by contemporary apps (Linear, Notion, Arc)
  primary: '#8B3A8E',
  primaryDark: '#6B1B8D',
  primaryLight: '#A855D6',
  primaryVeryLight: '#DDD6FE',
  primaryUltraLight: '#F5F3FF',

  secondary: '#A855D6',
  secondaryLight: '#C084FC',

  accent: '#EC4899', // Pink accent
  accentLight: '#F472B6',
  accentOrange: '#FB923C',

  // Modern Neutral Palette
  background: '#FAFAFA', // Off-white background (modern apps use subtle grays)
  cardBackground: '#FFFFFF',
  gradStart: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceLight: '#F9FAFB',
  surfaceDark: '#F3F4F6',
  surfaceElevated: '#FFFFFF', // Elevated cards

  // Text Colors - Modern hierarchy
  text: '#111827', // Almost black for primary text
  primaryText: '#111827',
  secondaryText: '#6B7280', // Medium gray
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textMuted: '#D1D5DB',
  textWhite: '#FFFFFF',

  // UI Elements - Softer borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F3F4F6',
  accentActive: '#8B3A8E',
  accentInactive: '#E5E7EB',

  // Status Colors - Modern vivid palette
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Gradients - Subtle and modern
  gradientPurple: ['#8B3A8E', '#A855D6'] as const,
  gradientApp: ['#FAFAFA', '#FFFFFF'] as const,
  gradientPurpleToWhite: ['#F5F3FF', '#FFFFFF'] as const,
  gradientLightPurple: ['#F5F3FF', '#FAFAFA'] as const,
  gradientWhite: ['#FFFFFF', '#FAFAFA'] as const,
  gradientAccent: ['#8B3A8E', '#A855D6'] as const,
  gradientPink: ['#EC4899', '#F472B6'] as const,
  gradientOrange: ['#FB923C', '#FDBA74'] as const,
  gradientCard: ['#FFFFFF', '#FAFAFA'] as const,

  // Special
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Overlays - Modern glassmorphism
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  overlayWhite: 'rgba(255, 255, 255, 0.9)',
  overlayGlass: 'rgba(255, 255, 255, 0.7)', // Glassmorphism effect
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Simple fontSize values - NO complex objects that can cause casting errors
export const fontSize = {
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 16,
  bodyLarge: 18,
  button: 16,
  caption: 14,
  small: 12,
};

export const borderRadius = {
  xs: 6,      // Slightly rounder for modern feel
  sm: 10,
  md: 16,     // Increased for modern card design
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
};

export const shadows = {
  // Modern shadow system - Softer, more natural shadows
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  colored: {
    shadowColor: '#8B3A8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const animation = {
  // Modern spring-based timing
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  verySlow: 600,
  spring: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  pagination: {
    inactiveScale: 0.9,
    activeScale: 1,
  },
  cardHover: {
    scale: 0.98,
    duration: 150,
  },
};

// Uppercase aliases for backward compatibility
export const COLORS = colors;
export const SPACING = spacing;
export const RADIUS = borderRadius;
export const SHADOWS = shadows;
export const ANIMATION = animation;
export const TYPOGRAPHY = fontSize;
export const FONT_SIZE = fontSize;
