/**
 * Guardian Login Screen
 * Entry point for guardians to access the pickup system
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faQrcode,
  faUserShield,
  faChild,
  faArrowRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

const { width } = Dimensions.get('window');

const GuardianLoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const styles = createStyles(theme);

  const handleScanQR = () => {
    navigation.navigate('GuardianQRScanner');
  };

  const handleManualEntry = () => {
    navigation.navigate('GuardianQRScannerFallback');
  };

  const handleBackToMain = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToMain}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.headerText}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('guardianLogin')}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <FontAwesomeIcon
              icon={faUserShield}
              size={60}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.logoText}>{t('guardianPickupSystem')}</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{t('welcomeGuardian')}</Text>
          <Text style={styles.welcomeMessage}>
            {t('guardianLoginWelcomeMessage')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <FontAwesomeIcon
              icon={faQrcode}
              size={24}
              color={theme.colors.success}
            />
            <Text style={styles.featureText}>{t('scanQrToLogin')}</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesomeIcon
              icon={faChild}
              size={24}
              color={theme.colors.success}
            />
            <Text style={styles.featureText}>
              {t('authorizedPickupAccess')}
            </Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesomeIcon
              icon={faUserShield}
              size={24}
              color={theme.colors.success}
            />
            <Text style={styles.featureText}>{t('secureAuthentication')}</Text>
          </View>
        </View>

        {/* QR Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
          <FontAwesomeIcon
            icon={faQrcode}
            size={24}
            color={theme.colors.headerText}
          />
          <Text style={styles.scanButtonText}>{t('scanQrCode')}</Text>
          <FontAwesomeIcon
            icon={faArrowRight}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>

        {/* Manual Entry Button */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualEntry}
        >
          <Text style={styles.manualButtonText}>{t('enterManually')}</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>{t('howToGetStarted')}:</Text>
          <Text style={styles.instructionStep}>
            1. {t('receiveQrFromParent')}
          </Text>
          <Text style={styles.instructionStep}>2. {t('tapScanQrButton')}</Text>
          <Text style={styles.instructionStep}>3. {t('pointCameraAtQr')}</Text>
          <Text style={styles.instructionStep}>
            4. {t('completeProfileIfNeeded')}
          </Text>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>{t('needHelp')}?</Text>
          <Text style={styles.helpText}>{t('guardianHelpMessage')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginLeft: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    welcomeSection: {
      marginBottom: 32,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    welcomeMessage: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    featuresSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 32,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    featureText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 16,
      flex: 1,
    },
    scanButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 32,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    scanButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.headerText,
      marginHorizontal: 12,
    },
    manualButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 32,
    },
    manualButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    instructionsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
    },
    instructionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    instructionStep: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 22,
    },
    helpSection: {
      backgroundColor: theme.colors.warning + '20',
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    helpTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

export default GuardianLoginScreen;
