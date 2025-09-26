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
    // Check if we're using phone-specific styles (smaller tiles)
    if (additionalStyle?.width && additionalStyle.width < 180) return 30;
    return 28;
  };

  // Check if we're using phone-specific small tiles
  const isPhoneSmallTile =
    additionalStyle?.width && additionalStyle.width < 180;

  // Get tile container styles - use existing responsive styles from parent component
  const getTileStyles = () => [
    // Use phone-specific styles for small tiles, otherwise use regular styles
    isPhoneSmallTile
      ? styles?.phoneActionTile || styles?.actionTile || styles?.menuItem
      : styles?.actionTile || styles?.menuItem, // Use actionTile for TeacherScreen, menuItem for ParentScreen
    // Only apply backgroundColor if using actionTile style (TeacherScreen)
    (styles?.actionTile || styles?.phoneActionTile) && {
      backgroundColor: disabled ? '#B0B0B0' : backgroundColor,
    },
    disabled && (styles?.disabledTile || styles?.disabledMenuItem),
    !isPhoneSmallTile &&
      isIPadDevice &&
      (styles?.iPadActionTile || styles?.iPadMenuItem),
    !isPhoneSmallTile &&
      isIPadDevice &&
      isLandscape &&
      (styles?.iPadLandscapeActionTile3Col || styles?.iPadLandscapeMenuItem),
    !isPhoneSmallTile &&
      isTabletDevice &&
      (styles?.tabletActionTile || styles?.tabletMenuItem),
    !isPhoneSmallTile &&
      isTabletDevice &&
      isLandscape &&
      (styles?.tabletLandscapeActionTile3Col ||
        styles?.tabletLandscapeMenuItem),
    additionalStyle,
  ];

  // Get icon container styles - support both tile and menu icon containers
  const getIconContainerStyles = () => [
    // Use phone-specific styles for small tiles
    isPhoneSmallTile
      ? styles?.phoneTileIconContainer ||
        styles?.tileIconContainer ||
        styles?.menuIconContainer
      : styles?.tileIconContainer || styles?.menuIconContainer,
    !isPhoneSmallTile &&
      isIPadDevice &&
      (styles?.iPadTileIconContainer || styles?.iPadMenuIconContainer),
    !isPhoneSmallTile &&
      isIPadDevice &&
      isLandscape &&
      (styles?.iPadLandscapeTileIconContainer3Col ||
        styles?.iPadLandscapeMenuIconContainer),
    !isPhoneSmallTile &&
      isTabletDevice &&
      (styles?.tabletTileIconContainer || styles?.tabletMenuIconContainer),
    !isPhoneSmallTile &&
      isTabletDevice &&
      isLandscape &&
      (styles?.tabletLandscapeTileIconContainer3Col ||
        styles?.tabletLandscapeMenuIconContainer),
  ];

  // Get title styles - use existing responsive styles from TeacherScreen
  const getTitleStyles = () => [
    // Use phone-specific styles for small tiles
    isPhoneSmallTile
      ? styles?.phoneTileTitle || styles?.tileTitle
      : styles?.tileTitle,
    !isPhoneSmallTile && isIPadDevice && styles?.iPadTileTitle,
    !isPhoneSmallTile &&
      isIPadDevice &&
      isLandscape &&
      styles?.iPadLandscapeTileTitle3Col,
    !isPhoneSmallTile && isTabletDevice && styles?.tabletTileTitle,
    !isPhoneSmallTile &&
      isTabletDevice &&
      isLandscape &&
      styles?.tabletLandscapeTileTitle3Col,
  ];

  // Get subtitle styles - use existing responsive styles from TeacherScreen
  const getSubtitleStyles = () => [
    // Use phone-specific styles for small tiles
    isPhoneSmallTile
      ? styles?.phoneTileSubtitle || styles?.tileSubtitle
      : styles?.tileSubtitle,
    !isPhoneSmallTile && isIPadDevice && styles?.iPadTileSubtitle,
    !isPhoneSmallTile &&
      isIPadDevice &&
      isLandscape &&
      styles?.iPadLandscapeTileSubtitle3Col,
    !isPhoneSmallTile && isTabletDevice && styles?.tabletTileSubtitle,
    !isPhoneSmallTile &&
      isTabletDevice &&
      isLandscape &&
      styles?.tabletLandscapeTileSubtitle3Col,
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
