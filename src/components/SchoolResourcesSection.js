import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendarAlt,
  faInfoCircle,
  faEnvelope,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SchoolResourcesSection({
  navigation,
  showCalendar = true,
}) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const styles = createStyles(theme, fontSizes);

  // Generic handler for school resources (About Us, Contacts, FAQ)
  const handleSchoolResourcePress = async (screenName) => {
    try {
      console.log(
        `🏠 SCHOOL_RESOURCES: Accessing ${screenName} (public access)`
      );

      // School resources are publicly accessible - no login required
      // Navigate directly to the screen with public access mode
      navigation.navigate(screenName, { publicAccess: true });
    } catch (error) {
      console.error(
        `❌ SCHOOL_RESOURCES: Error accessing ${screenName}:`,
        error
      );
      Alert.alert(
        'Navigation Error',
        `Unable to access ${screenName}. Please try again.`,
        [
          {
            text: 'Try Again',
            onPress: () => handleSchoolResourcePress(screenName),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleCalendarPress = async () => {
    try {
      // Check for direct login userData first
      const userData = await AsyncStorage.getItem('userData');

      // Check for student accounts in parent system
      const studentAccountsStr = await AsyncStorage.getItem('studentAccounts');
      const selectedStudentStr = await AsyncStorage.getItem('selectedStudent');

      console.log('📅 SCHOOL_RESOURCES: Calendar access check:', {
        hasUserData: !!userData,
        hasStudentAccounts: !!studentAccountsStr,
        hasSelectedStudent: !!selectedStudentStr,
      });

      // If there's direct login data, use it
      if (userData) {
        try {
          const userToUse = JSON.parse(userData);
          console.log('✅ SCHOOL_RESOURCES: Using direct login userData:', {
            userType: userToUse.userType,
            username: userToUse.username,
          });
          // Navigate to branch-only calendar
          navigation.navigate('CalendarScreen', { mode: 'branch-only' });
          return;
        } catch (parseError) {
          console.error(
            '❌ SCHOOL_RESOURCES: Error parsing userData:',
            parseError
          );
        }
      }

      // If no direct login, check for student accounts
      if (studentAccountsStr) {
        try {
          const studentAccounts = JSON.parse(studentAccountsStr);
          if (studentAccounts.length > 0) {
            console.log(
              '✅ SCHOOL_RESOURCES: Using first student account for calendar'
            );
            await AsyncStorage.setItem(
              'calendarUserData',
              JSON.stringify(studentAccounts[0])
            );
            navigation.navigate('CalendarScreen', { mode: 'branch-only' });
            return;
          }
        } catch (parseError) {
          console.error(
            '❌ SCHOOL_RESOURCES: Error parsing studentAccounts:',
            parseError
          );
        }
      }

      // If there's a previously selected student, use it
      if (selectedStudentStr) {
        try {
          const selectedStudent = JSON.parse(selectedStudentStr);
          console.log(
            '✅ SCHOOL_RESOURCES: Using previously selected student:',
            selectedStudent.name
          );
          await AsyncStorage.setItem('calendarUserData', selectedStudentStr);
          navigation.navigate('CalendarScreen', { mode: 'branch-only' });
          return;
        } catch (parseError) {
          console.error(
            '❌ SCHOOL_RESOURCES: Error parsing selectedStudent:',
            parseError
          );
        }
      }

      // No user data found - show options
      console.log(
        '❌ SCHOOL_RESOURCES: No user data found, showing login/add student options'
      );
      Alert.alert(t('accessCalendar'), t('calendarAccessMessage'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('addStudent'),
          onPress: () => navigation.navigate('ParentScreen'),
        },
        {
          text: t('login'),
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      console.error('❌ SCHOOL_RESOURCES: Error accessing calendar:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to access calendar. This might be due to data issues.',
        [
          {
            text: 'Try Again',
            onPress: () => handleCalendarPress(),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('schoolResources')}</Text>
      <View style={styles.resourcesContainer}>
        {showCalendar && (
          <TouchableOpacity
            style={styles.resourceButton}
            onPress={handleCalendarPress}
          >
            <View
              style={[
                styles.resourceIconContainer,
                { backgroundColor: 'rgba(88, 86, 214, 0.1)' },
              ]}
            >
              <FontAwesomeIcon icon={faCalendarAlt} size={16} color='#5856D6' />
            </View>
            <Text
              style={styles.resourceText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('calendar')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.resourceButton}
          onPress={() => handleSchoolResourcePress('AboutUsScreen')}
        >
          <View
            style={[
              styles.resourceIconContainer,
              { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
            ]}
          >
            <FontAwesomeIcon icon={faInfoCircle} size={16} color='#34C759' />
          </View>
          <Text
            style={styles.resourceText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('aboutUs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceButton}
          onPress={() => handleSchoolResourcePress('ContactsScreen')}
        >
          <View
            style={[
              styles.resourceIconContainer,
              { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
            ]}
          >
            <FontAwesomeIcon icon={faEnvelope} size={16} color='#FF3B30' />
          </View>
          <Text
            style={styles.resourceText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('contactUs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resourceButton}
          onPress={() => handleSchoolResourcePress('FAQScreen')}
        >
          <View
            style={[
              styles.resourceIconContainer,
              { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
            ]}
          >
            <FontAwesomeIcon
              icon={faQuestionCircle}
              size={16}
              color='#FF9500'
            />
          </View>
          <Text
            style={styles.resourceText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t('faq')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme, fontSizes) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginVertical: 10,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 15,
      alignSelf: 'flex-start',
      lineHeight: fontSizes.subtitleLineHeight,
    },
    resourcesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 5,
      gap: 15,
    },
    resourceButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
      flex: 1,
      minHeight: 60,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.small,
      elevation: 3,
    },
    resourceIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    resourceText: {
      fontSize: fontSizes.small,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: fontSizes.smallLineHeight || fontSizes.small * 1.2,
    },
  });
