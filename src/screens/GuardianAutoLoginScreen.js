/**
 * Guardian Auto Login Screen
 * Handles automatic login for guardians with stored credentials
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import guardianStorageService from '../services/guardianStorageService';

const GuardianAutoLoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        console.log('🔄 GUARDIAN AUTO-LOGIN: Checking stored guardian data...');
        
        // Get stored guardian data
        const guardianData = await guardianStorageService.getStoredGuardianData();
        
        if (guardianData) {
          console.log('✅ GUARDIAN AUTO-LOGIN: Found valid guardian data');
          console.log('✅ GUARDIAN AUTO-LOGIN: Guardian:', guardianData.guardian?.name);
          console.log('✅ GUARDIAN AUTO-LOGIN: Child:', guardianData.child?.name);
          
          // Navigate to guardian dashboard with stored data
          navigation.replace('GuardianDashboard', {
            authCode: guardianData.authCode,
            guardian: guardianData.guardian,
            child: guardianData.child,
          });
        } else {
          console.log('❌ GUARDIAN AUTO-LOGIN: No valid guardian data found');
          // Navigate to guardian login screen
          navigation.replace('GuardianLogin');
        }
      } catch (error) {
        console.error('❌ GUARDIAN AUTO-LOGIN: Error during auto-login:', error);
        // On error, navigate to guardian login screen
        navigation.replace('GuardianLogin');
      }
    };

    // Add a small delay to show the loading screen
    const timer = setTimeout(performAutoLogin, 1000);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('checkingCredentials')}</Text>
        <Text style={styles.subText}>{t('pleaseWait')}</Text>
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
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
      textAlign: 'center',
    },
    subText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default GuardianAutoLoginScreen;
