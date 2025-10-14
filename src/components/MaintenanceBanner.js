import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTools,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MaintenanceBanner = ({ type = 'warning', message, customStyle }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const styles = createStyles(theme);

  // Default titles (short)
  const defaultTitles = {
    warning: 'Under Maintenance',
    info: 'Maintenance',
    error: 'Service Unavailable',
  };

  // Default messages (detailed)
  const defaultMessages = {
    warning:
      t('maintenanceWarning') ||
      'System upgrade in progress. You will be informed by school authorities when the service is available. We apologize for the inconvenience.',
    info: t('maintenanceInfo') || 'Scheduled maintenance in progress.',
    error: t('maintenanceError') || 'Service temporarily unavailable.',
  };

  const bannerConfig = {
    warning: {
      backgroundColor: '#FF9500',
      icon: faTools,
      iconColor: '#fff',
    },
    info: {
      backgroundColor: '#007AFF',
      icon: faTools,
      iconColor: '#fff',
    },
    error: {
      backgroundColor: '#FF3B30',
      icon: faExclamationTriangle,
      iconColor: '#fff',
    },
  };

  const config = bannerConfig[type] || bannerConfig.warning;
  const displayTitle = defaultTitles[type];
  const displayMessage = message || defaultMessages[type];

  return (
    <View style={[styles.overlay, customStyle]}>
      <View style={styles.backdrop} />
      <View
        style={[
          styles.bannerContainer,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        <View style={styles.iconContainer}>
          <FontAwesomeIcon
            icon={config.icon}
            size={80}
            color={config.iconColor}
          />
        </View>
        <Text style={styles.bannerTitle}>{displayTitle}</Text>
        <Text style={styles.bannerText}>{displayMessage}</Text>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      elevation: 99999,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
    },
    bannerContainer: {
      width: SCREEN_WIDTH * 0.85,
      maxWidth: 500,
      paddingVertical: 50,
      paddingHorizontal: 30,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 20,
    },
    iconContainer: {
      marginBottom: 30,
      padding: 20,
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    bannerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    bannerText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#fff',
      textAlign: 'center',
      lineHeight: 26,
      opacity: 0.95,
    },
  });

export default MaintenanceBanner;
