import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language-specific font size adjustments
const getFontSize = (baseSize, language) => {
  const adjustments = {
    my: 0.75, // Myanmar - reduce by 25%
    zh: 0.95, // Chinese - reduce by 5%
    th: 0.95, // Thai - reduce by 5%
    en: 1.0, // English - no change
  };

  const multiplier = adjustments[language] || 1.0;
  return Math.round(baseSize * multiplier);
};

// Language-specific line height adjustments
const getLineHeight = (fontSize, language) => {
  const lineHeightMultipliers = {
    my: 1.4, // Myanmar - normal line spacing to prevent cutting
    zh: 1.3, // Chinese - normal spacing
    th: 1.3, // Thai - normal spacing
    en: 1.3, // English - normal spacing
  };

  const multiplier = lineHeightMultipliers[language] || 1.3;
  return Math.round(fontSize * multiplier);
};

// Helper function to get language-aware font sizes
export const getLanguageFontSizes = (language) => {
  const sizes = {
    // Header sizes
    headerTitle: getFontSize(20, language),
    headerSubtitle: getFontSize(16, language),

    // Body text sizes
    title: getFontSize(32, language),
    subtitle: getFontSize(18, language),
    body: getFontSize(16, language),
    bodySmall: getFontSize(14, language),
    caption: getFontSize(12, language),

    // Button sizes
    buttonText: getFontSize(16, language),
    buttonTextSmall: getFontSize(14, language),
  };

  // Add line heights
  return {
    ...sizes,
    // Line heights
    titleLineHeight: getLineHeight(sizes.title, language),
    subtitleLineHeight: getLineHeight(sizes.subtitle, language),
    bodyLineHeight: getLineHeight(sizes.body, language),
    bodySmallLineHeight: getLineHeight(sizes.bodySmall, language),
    captionLineHeight: getLineHeight(sizes.caption, language),

    // Profile specific sizes
    profileName: getFontSize(24, language),
    profileRole: getFontSize(16, language),
    profileId: getFontSize(14, language),
    sectionTitle: getFontSize(18, language),
    profileItemLabel: getFontSize(14, language),
    profileItemValue: getFontSize(16, language),

    // Feature sizes
    featureTitle: getFontSize(16, language),
    featureSubtitle: getFontSize(14, language),

    // Tile sizes
    tileTitle: getFontSize(16, language),
    tileSubtitle: getFontSize(12, language),

    // Badge sizes
    badgeText: getFontSize(10, language),
    comingSoonText: getFontSize(10, language),
  };
};

/**
 * Creates platform-specific shadow styles
 * iOS: Uses shadow properties (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
 * Android: Uses elevation property only
 */
const createPlatformShadow = (
  shadowColor,
  offset,
  opacity,
  radius,
  elevation
) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor,
      shadowOffset: offset,
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  }
  return {
    elevation,
  };
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Light theme colors - Updated according to new color structure
const lightTheme = {
  mode: 'light',
  colors: {
    // Primary Color - Navy Blue (Trust, competence, stability)
    primary: '#2c3b90', // PANTONE 7687C equivalent
    primaryRGB: '#2c3b90', // R35 G31 B32

    // Secondary Color - Red (Passion, energy, leadership)
    secondary: '#EC2227', // PANTONE 1788C equivalent
    secondaryRGB: 'rgb(236, 34, 39)', // R236 G34 B39

    // Merchandise/Brand Color
    merchandise: '#2756C6', // PANTONE 2756C equivalent

    // Tertiary Colors for UI elements
    tertiary: {
      yellow: '#FFD700', // R255 G210 B2
      beige: '#D4A574', // R209 G165 B83
      lightBlue: '#9AC4E4', // R24 G154 B214
      brown: '#8B4513', // R117 G41 B15
      darkRed: '#B22222', // R172 G68 B59
      burgundy: '#800020', // R180 G26 B40
      gray: '#A9A9A9', // R167 G169 B172
      green: '#7CB342', // R124 G197 B70
    },

    // Background and surface colors
    background: '#FAFAFA', // Light gray background
    surface: '#FFFFFF', // White surface
    surfaceSecondary: '#F5F5F5', // Secondary surface

    // Text colors
    text: '#2c3b90', // Primary navy for main text
    textSecondary: '#666666', // Gray for secondary text
    textLight: '#999999', // Light gray for tertiary text
    textOnPrimary: '#FFFFFF', // White text on primary background
    textOnSecondary: '#FFFFFF', // White text on secondary background

    // Border and divider colors
    border: '#E0E0E0', // Light gray border
    divider: '#F0F0F0', // Very light gray divider

    // Status colors using tertiary palette
    success: '#7CB342', // Green from tertiary
    warning: '#FFD700', // Yellow from tertiary
    error: '#EC2227', // Secondary red for errors
    info: '#9AC4E4', // Light blue from tertiary

    // Card and container colors
    card: '#FFFFFF',
    cardSecondary: '#F8F9FA',

    // Header colors
    headerBackground: '#2c3b90', // Primary navy
    headerText: '#FFFFFF',

    // Tab colors
    tabBackground: '#FFFFFF',
    tabActive: '#231F20', // Primary navy
    tabInactive: '#999999',

    // Shadow
    shadow: '#000000',

    // BPS-specific colors using new palette
    bpsPositive: '#7CB342', // Green for positive behavior
    bpsNegative: '#EC2227', // Red for negative behavior
    bpsSelected: '#231F20', // Primary navy for selected items
    bpsBackground: '#F8F9FA', // Light background for BPS cards

    // Additional semantic colors
    accent: '#2756C6', // Merchandise blue for accents
    highlight: '#FFD700', // Yellow for highlights
    muted: '#A9A9A9', // Gray for muted elements
  },
  shadows: {
    small: createPlatformShadow('#000', { width: 0, height: 2 }, 0.1, 4, 2),
    medium: createPlatformShadow('#000', { width: 0, height: 4 }, 0.1, 8, 4),
    large: createPlatformShadow('#000', { width: 0, height: 8 }, 0.15, 16, 8),
  },
};

// Dark theme colors - Updated according to new color structure
const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary Color - Lighter navy for dark mode visibility
    primary: '#4A4A4A', // Lighter version of navy for dark mode
    primaryRGB: 'rgb(74, 74, 74)',

    // Secondary Color - Slightly muted red for dark mode
    secondary: '#FF4444', // Slightly brighter red for dark mode visibility
    secondaryRGB: 'rgb(255, 68, 68)',

    // Merchandise/Brand Color - Lighter blue for dark mode
    merchandise: '#5577DD', // Lighter version for dark mode

    // Tertiary Colors adapted for dark mode
    tertiary: {
      yellow: '#FFE066', // Softer yellow for dark mode
      beige: '#E6B888', // Lighter beige
      lightBlue: '#B8D4F0', // Lighter blue
      brown: '#A0673A', // Lighter brown
      darkRed: '#CC5555', // Lighter red
      burgundy: '#AA4466', // Lighter burgundy
      gray: '#BBBBBB', // Lighter gray
      green: '#88CC55', // Lighter green
    },

    // Background and surface colors for dark mode
    background: '#000000', // Pure black background
    surface: '#1C1C1E', // Dark gray surface
    surfaceSecondary: '#2C2C2E', // Secondary dark surface

    // Text colors for dark mode
    text: '#FFFFFF', // White text
    textSecondary: '#AEAEB2', // Light gray for secondary text
    textLight: '#8E8E93', // Darker gray for tertiary text
    textOnPrimary: '#FFFFFF', // White text on primary
    textOnSecondary: '#FFFFFF', // White text on secondary

    // Border and divider colors for dark mode
    border: '#38383A', // Dark gray border
    divider: '#2C2C2E', // Dark divider

    // Status colors using adapted tertiary palette
    success: '#88CC55', // Lighter green for dark mode
    warning: '#FFE066', // Softer yellow for dark mode
    error: '#FF4444', // Brighter red for visibility
    info: '#B8D4F0', // Lighter blue for dark mode

    // Card and container colors
    card: '#1C1C1E',
    cardSecondary: '#2C2C2E',

    // Header colors
    headerBackground: '#1C1C1E', // Dark surface for header
    headerText: '#FFFFFF',

    // Tab colors
    tabBackground: '#1C1C1E',
    tabActive: '#4A4A4A', // Lighter primary for visibility
    tabInactive: '#8E8E93',

    // Shadow
    shadow: '#000000',

    // BPS-specific colors for dark mode
    bpsPositive: '#88CC55', // Lighter green for positive behavior
    bpsNegative: '#FF4444', // Brighter red for negative behavior
    bpsSelected: '#4A4A4A', // Lighter primary for selected items
    bpsBackground: '#2C2C2E', // Dark background for BPS cards

    // Additional semantic colors for dark mode
    accent: '#5577DD', // Lighter merchandise blue
    highlight: '#FFE066', // Softer yellow for highlights
    muted: '#8E8E93', // Muted gray for dark mode
  },
  shadows: {
    small: createPlatformShadow('#ccc', { width: 0, height: 2 }, 0.3, 4, 2),
    medium: createPlatformShadow('#ccc', { width: 0, height: 4 }, 0.3, 8, 4),
    large: createPlatformShadow('#ccc', { width: 0, height: 8 }, 0.4, 16, 8),
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('themeMode', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (mode) => {
    try {
      const isDark = mode === 'dark';
      setIsDarkMode(isDark);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
