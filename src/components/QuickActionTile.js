import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { isIPad, isTablet } from '../utils/deviceDetection';

/**
 * QuickActionTile Component
 *
 * A reusable tile component for teacher dashboard quick actions.
 * Uses the existing responsive grid system from TeacherScreen.
 *
 * @param {Object} props
 * @param {string} props.title - The main title text
 * @param {string} props.subtitle - The subtitle text
 * @param {Object} props.icon - FontAwesome icon object
 * @param {string} props.backgroundColor - Background color for the tile
 * @param {string} props.iconColor - Color for the icon (default: '#fff')
 * @param {Function} props.onPress - Callback function when tile is pressed
 * @param {Object} props.styles - Styles object from parent component (TeacherScreen)
 * @param {boolean} props.disabled - Whether the tile is disabled
 * @param {React.ReactNode} props.badge - Optional badge component (e.g., "Coming Soon")
 * @param {boolean} props.isLandscape - Whether device is in landscape orientation
 * @param {Object} props.additionalStyle - Additional styles for the tile container
 */
const QuickActionTile = ({
  title,
  subtitle,
  icon,
  backgroundColor,
  iconColor = '#fff',
  onPress,
  styles, // Use styles from parent component
  disabled = false,
  badge,
  isLandscape = false, // This will be passed from parent component
  additionalStyle = {},
}) => {
  const isIPadDevice = isIPad();
  const isTabletDevice = isTablet();

  // Use the passed isLandscape prop instead of detecting internally
  // This ensures immediate updates when orientation changes

  // Calculate responsive icon size
  const getIconSize = () => {
    if (isIPadDevice && isLandscape) return 35;
    if (isTabletDevice && isLandscape) return 35;
    if (isIPadDevice) return 35;
    if (isTabletDevice) return 35;
    return 28;
  };

  // Get tile container styles - use existing responsive styles from parent component
  const getTileStyles = () => [
    styles?.actionTile || styles?.menuItem, // Use actionTile for TeacherScreen, menuItem for ParentScreen
    // Only apply backgroundColor if using actionTile style (TeacherScreen)
    styles?.actionTile && {
      backgroundColor: disabled ? '#B0B0B0' : backgroundColor,
    },
    disabled && (styles?.disabledTile || styles?.disabledMenuItem),
    isIPadDevice && (styles?.iPadActionTile || styles?.iPadMenuItem),
    isIPadDevice &&
      isLandscape &&
      (styles?.iPadLandscapeActionTile3Col || styles?.iPadLandscapeMenuItem),
    isTabletDevice && (styles?.tabletActionTile || styles?.tabletMenuItem),
    isTabletDevice &&
      isLandscape &&
      (styles?.tabletLandscapeActionTile3Col ||
        styles?.tabletLandscapeMenuItem),
    additionalStyle,
  ];

  // Get icon container styles - support both tile and menu icon containers
  const getIconContainerStyles = () => [
    // Try tile icon containers first (for TeacherScreen)
    styles?.tileIconContainer || styles?.menuIconContainer,
    isIPadDevice &&
      (styles?.iPadTileIconContainer || styles?.iPadMenuIconContainer),
    isIPadDevice &&
      isLandscape &&
      (styles?.iPadLandscapeTileIconContainer3Col ||
        styles?.iPadLandscapeMenuIconContainer),
    isTabletDevice &&
      (styles?.tabletTileIconContainer || styles?.tabletMenuIconContainer),
    isTabletDevice &&
      isLandscape &&
      (styles?.tabletLandscapeTileIconContainer3Col ||
        styles?.tabletLandscapeMenuIconContainer),
  ];

  // Get title styles - use existing responsive styles from TeacherScreen
  const getTitleStyles = () => [
    styles?.tileTitle,
    isIPadDevice && styles?.iPadTileTitle,
    isIPadDevice && isLandscape && styles?.iPadLandscapeTileTitle3Col,
    isTabletDevice && styles?.tabletTileTitle,
    isTabletDevice && isLandscape && styles?.tabletLandscapeTileTitle3Col,
  ];

  // Get subtitle styles - use existing responsive styles from TeacherScreen
  const getSubtitleStyles = () => [
    styles?.tileSubtitle,
    isIPadDevice && styles?.iPadTileSubtitle,
    isIPadDevice && isLandscape && styles?.iPadLandscapeTileSubtitle3Col,
    isTabletDevice && styles?.tabletTileSubtitle,
    isTabletDevice && isLandscape && styles?.tabletLandscapeTileSubtitle3Col,
  ];

  return (
    <TouchableOpacity
      style={getTileStyles()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <View style={getIconContainerStyles()}>
        <FontAwesomeIcon icon={icon} size={getIconSize()} color={iconColor} />
      </View>

      <Text style={getTitleStyles()}>{title}</Text>

      <Text style={getSubtitleStyles()}>{subtitle}</Text>

      {badge && badge}
    </TouchableOpacity>
  );
};

export default QuickActionTile;
