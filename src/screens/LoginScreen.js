import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceToken } from '../utils/messaging';
import { logDeviceInfo } from '../utils/deviceInfo';
import {
  debugLogin,
  quickNetworkTest,
  formatDebugInfo,
} from '../utils/loginDebugger';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  unifiedLogin,
  teacherLogin,
  studentLogin,
  saveUserData,
} from '../services';
import {isIPad} from "../utils/deviceDetection";
import { Config } from '../config/env';
import { useTheme, getLanguageFontSizes } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import useThemeLogo from '../hooks/useThemeLogo';
import {createMediumShadow, createSmallShadow} from '../utils/commonStyles';
import { updateLastLogin } from '../services/deviceService';
import { SchoolResourcesSection } from '../components';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const fontSizes = getLanguageFontSizes(currentLanguage);
  const logoSource = useThemeLogo();
  const IsIPadDevice = isIPad();
  // Get parameters from route
  const routeLoginType = route.params?.loginType;
  const isAddingStudent = route.params?.isAddingStudent || false;

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Login type state (teacher or student)
  const [loginType, setLoginType] = useState(routeLoginType || 'student');
  const [deviceToken, setDeviceToken] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const styles = createStyles(theme, fontSizes, IsIPadDevice);

  useEffect(() => {
    // Get device token and log device info when component mounts
    const fetchDeviceToken = async () => {
      try {
        // Log device information for debugging
        await logDeviceInfo();

        // Get device token
        const token = await getDeviceToken();
        setDeviceToken(token || '');

        console.log(
          '📱 LOGIN: Device token initialized:',
          token ? 'available' : 'not available'
        );

        if (!token) {
          console.warn(
            '⚠️ LOGIN: No device token available, login may still work'
          );
          // Don't block login if device token is not available
          // The API should handle missing device tokens gracefully
        }
      } catch (error) {
        console.error('❌ LOGIN: Failed to get device token:', error);
        console.log('🔄 LOGIN: Proceeding without device token');
        // Set empty token to allow login attempt
        setDeviceToken('');
      }
    };

    fetchDeviceToken();
  }, []);

  // Debug functions
  const handleDebugLogin = async () => {
    try {
      setLoading(true);
      const debug = await debugLogin(username, password);
      setDebugInfo(debug);
      setShowDebugInfo(true);

      Alert.alert(
        'Debug Information',
        `Found ${debug.issues.length} issues. ${
          debug.issues.length > 0
            ? 'Check console for details.'
            : 'No issues detected.'
        }`,
        [
          { text: 'OK' },
          {
            text: 'Copy Debug Info',
            onPress: () => {
              // In a real app, you'd copy to clipboard
              console.log('📋 DEBUG INFO TO COPY:\n', formatDebugInfo(debug));
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Debug Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNetworkTest = async () => {
    try {
      const result = await quickNetworkTest();
      Alert.alert('Network Test', result.message, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Network Test Error', error.message);
    }
  };

  // Handle login based on selected type
  const handleUserLogin = async (username, password) => {
    setLoading(true);

    try {
      let userData;

      if (loginType === 'teacher') {
        userData = await teacherLogin(username, password, deviceToken);
      } else {
        // For student/parent login, use unifiedLogin
        userData = await unifiedLogin(
          username,
          password,
          deviceToken,
          Platform.OS === 'ios' ? 'ios' : 'android',
          `${Platform.OS} Device`
        );
      }

      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      Alert.alert(t('error'), t('networkError'));
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), t('pleaseEnterCredentials'));
      return;
    }

    const userData = await handleUserLogin(username, password);

    // Debug: Log what we received from login
    console.log('🔍 LOGIN DEBUG: userData received:', userData);
    console.log('🔍 LOGIN DEBUG: userData type:', typeof userData);
    console.log('🔍 LOGIN DEBUG: userData is null:', userData === null);
    console.log('🔍 LOGIN DEBUG: userData has error:', userData?.error);

    if (userData && !userData.error) {
      // Handle successful login

      // If adding a student account
      if (isAddingStudent) {
        // Save to student accounts list
        try {
          const existingStudentsJSON = await AsyncStorage.getItem(
            'studentAccounts'
          );
          const existingStudents = existingStudentsJSON
            ? JSON.parse(existingStudentsJSON)
            : [];

          // Check if student already exists (prevent duplicates)
          const studentExists = existingStudents.some(
            (student) =>
              student.id === userData.id ||
              student.username === userData.username ||
              (student.authCode && student.authCode === userData.authCode)
          );

          if (studentExists) {
            Alert.alert(t('duplicateStudent'), t('studentAccountExists'));
            return;
          }

          // Add the new student account
          existingStudents.push(userData);

          // Save updated list
          await AsyncStorage.setItem(
            'studentAccounts',
            JSON.stringify(existingStudents)
          );

          // Update last login timestamp for the newly added student
          console.log(
            '⏰ LOGIN: Updating last login for newly added student...'
          );
          try {
            const authCode = userData.authCode || userData.auth_code;
            if (authCode) {
              const updateResult = await updateLastLogin(authCode);
              if (updateResult.success) {
                console.log(
                  '✅ LOGIN: Last login updated successfully for new student'
                );
              } else {
                console.warn(
                  '⚠️ LOGIN: Failed to update last login for new student:',
                  updateResult.error
                );
                // Continue with navigation even if update fails
              }
            } else {
              console.warn('⚠️ LOGIN: No auth code found for new student');
            }
          } catch (updateError) {
            console.error(
              '❌ LOGIN: Error updating last login for new student:',
              updateError
            );
            // Continue with navigation even if update fails
          }

          // Note: FCM token remains active for all users on device
          // Backend will handle user-specific notification routing
          console.log(
            '✅ STUDENT ADD: Student added, FCM remains active for notifications'
          );

          // Navigate back to parent screen
          Alert.alert(t('success'), t('studentAccountAdded'));
          navigation.goBack();
        } catch (error) {
          Alert.alert(t('error'), t('failedToSaveStudent'));
        }
      } else {
        // Normal login flow - check families policy compliance first
        await handleComplianceCheck(userData);

        // Note: FCM token remains active, backend handles user-specific routing
        console.log(
          '✅ LOGIN: User logged in, notifications will be routed by backend'
        );
      }
    } else {
      // Handle login failure with detailed error information
      let errorMessage = t('incorrectCredentials');

      if (userData?.error) {
        console.log('🔍 LOGIN DEBUG: Error details received:', userData);

        // Provide more specific error messages based on error type
        switch (userData.errorType) {
          case 'TypeError':
            errorMessage = t('networkConnectionError');
            break;
          case 'NetworkError':
            errorMessage = t('unableToConnectServer');
            break;
          case 'TimeoutError':
            errorMessage = t('connectionTimeout');
            break;
          default:
            errorMessage = `${t('loginFailed')}: ${
              userData.errorMessage || t('unknownError')
            }`;
        }

        // Log detailed error for debugging
        console.error('🚨 LOGIN FAILURE DETAILS:', {
          errorType: userData.errorType,
          errorMessage: userData.errorMessage,
          errorCode: userData.errorCode,
          timestamp: userData.timestamp,
          username: username ? 'provided' : 'missing',
          deviceToken: deviceToken ? 'available' : 'missing',
        });
      }

      Alert.alert(t('loginFailed'), errorMessage);
    }
  };

  // Handle compliance checking for users
  const handleComplianceCheck = async (userData) => {
    try {
      // Proceed with user login
      await proceedWithLogin(userData);
    } catch (error) {
      console.error('Login error:', error);
      await proceedWithLogin(userData);
    }
  };

  // Proceed with normal login flow after compliance is verified
  const proceedWithLogin = async (userData) => {
    try {
      // Save user data to AsyncStorage
      console.log('💾 LOGIN: Saving user data to AsyncStorage...');
      const saveResult = await saveUserData(userData, AsyncStorage);
      console.log('💾 LOGIN: Save result:', saveResult);

      // Verify the data was saved
      const savedData = await AsyncStorage.getItem('userData');
      console.log('🔍 LOGIN: Verification - data saved:', !!savedData);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('🔍 LOGIN: Verification - saved data structure:', {
          userType: parsed.userType,
          name: parsed.name || parsed.user_name,
          hasAuthCode: !!(parsed.authCode || parsed.auth_code),
        });
      }

      // Update last login timestamp after successful login
      console.log(
        '⏰ LOGIN: Updating last login timestamp after successful login...'
      );
      try {
        const authCode = userData.authCode || userData.auth_code;
        if (authCode) {
          const updateResult = await updateLastLogin(authCode);
          if (updateResult.success) {
            console.log('✅ LOGIN: Last login updated successfully');
          } else {
            console.warn(
              '⚠️ LOGIN: Failed to update last login:',
              updateResult.error
            );
            // Continue with navigation even if update fails
          }
        } else {
          console.warn(
            '⚠️ LOGIN: No auth code found in user data for last login update'
          );
        }
      } catch (updateError) {
        console.error('❌ LOGIN: Error updating last login:', updateError);
        // Continue with navigation even if update fails
      }

      // Navigate based on user type
      const userName = userData.name || userData.user_name || 'User';
      const userType = userData.userType || userData.user_type || 'student';

      console.log(
        `✅ LOGIN: ${userType} ${userName} logged in successfully, navigating to appropriate screen`
      );

      // Navigate to appropriate screen based on user type
      console.log(
        `🧭 LOGIN: Attempting to navigate based on user type: ${userType}...`
      );
      try {
        if (userType === 'teacher') {
          navigation.replace('TeacherScreen', { userData });
          console.log(
            '✅ LOGIN: Navigation to TeacherScreen initiated successfully'
          );
        } else if (userType === 'parent') {
          navigation.replace('ParentScreen');
          console.log(
            '✅ LOGIN: Navigation to ParentScreen initiated successfully'
          );
        } else {
          navigation.replace('StudentScreen');
          console.log(
            '✅ LOGIN: Navigation to StudentScreen initiated successfully'
          );
        }
      } catch (navError) {
        console.error('❌ LOGIN: Navigation error:', navError);
        Alert.alert(t('error'), 'Navigation failed: ' + navError.message);
        return;
      }

      // Show success message after navigation
      setTimeout(() => {
        const welcomeMessage =
          userType === 'parent'
            ? t('welcomeParentMessage')?.replace('{name}', userName) ||
              t('welcomeMessage').replace('{name}', userName)
            : t('welcomeMessage').replace('{name}', userName);

        Alert.alert(t('loginSuccessful'), welcomeMessage);
      }, 500);
    } catch (error) {
      console.error('Login completion error:', error);
      Alert.alert(t('error'), t('failedToCompleteLogin'));
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(t('forgotPassword'), t('forgotPasswordMessage'), [  { text: t('ok') } ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.Image
          source={logoSource}
          style={styles.logo}
          resizeMode='contain'
        />

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.formContainer}
        >
          <Text style={styles.title}>
            {isAddingStudent
              ? t('addStudentAccount')
              : loginType === 'teacher'
              ? 'Teacher Login'
              : 'Parent or Student Login'}
          </Text>

          {/* Login Type Selector - only show if not adding student and no specific route type */}
          {!isAddingStudent && !routeLoginType && (
            <View style={styles.loginTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'teacher' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('teacher')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'teacher' && styles.activeLoginTypeText,
                  ]}
                >
                  {t('teacher')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginTypeButton,
                  loginType === 'student' && styles.activeLoginType,
                ]}
                onPress={() => setLoginType('student')}
              >
                <Text
                  style={[
                    styles.loginTypeText,
                    loginType === 'student' && styles.activeLoginTypeText,
                  ]}
                >
                  {t('student')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder={t('username')}
            placeholderTextColor={theme.colors.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
          />

          <TextInput
            style={styles.input}
            placeholder={t('password')}
            placeholderTextColor={theme.colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>

          {/* Guardian Login Button - only show for student/parent login */}
          {loginType !== 'teacher' && (
            <TouchableOpacity
              style={styles.guardianLoginButton}
              onPress={() => navigation.navigate('GuardianLogin')}
            >
              <Text style={styles.guardianLoginButtonText}>
                {t('guardianLogin')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Debug Information for App Review */}
          {Config.DEV.ENABLE_DEBUG_MODE && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info (App Review)</Text>
              <Text style={styles.debugText}>
                API URL: {Config.API_BASE_URL}
              </Text>
              <Text style={styles.debugText}>
                Device Token: {deviceToken ? 'Available' : 'Not Available'}
              </Text>
              <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
              <Text style={styles.debugText}>
                Dummy Data: {Config.DEV.USE_DUMMY_DATA ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.debugText}>
                Network Timeout: {Config.NETWORK.TIMEOUT}ms
              </Text>

              {/* Debug Action Buttons */}
              <View style={styles.debugButtonsContainer}>
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={handleQuickNetworkTest}
                  disabled={loading}
                >
                  <Text style={styles.debugButtonText}>Test Network</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={handleDebugLogin}
                  disabled={loading}
                >
                  <Text style={styles.debugButtonText}>Debug Login</Text>
                </TouchableOpacity>
              </View>

              {debugInfo && showDebugInfo && (
                <View style={styles.debugInfoContainer}>
                  <Text style={styles.debugInfoTitle}>
                    Debug Results ({debugInfo.issues.length} issues)
                  </Text>
                  <ScrollView
                    style={styles.debugInfoScroll}
                    nestedScrollEnabled
                  >
                    <Text style={styles.debugInfoText}>
                      {formatDebugInfo(debugInfo)}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>
        </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme, fontSizes, isIPadDevice) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      alignItems: 'center',
      marginTop: 100,
    },
    backButton: {
      position: 'absolute',
      top: 0,
      left: 20,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
      logo: {
          width: isIPadDevice ? Math.min(width * 0.3, 300) : width * 0.9,
          height: isIPadDevice ? Math.min(height * 0.12, 150) : height * 0.15,
          // marginTop: isIPadDevice ? height * 0.03 : height * 0.001,
          marginBottom: isIPadDevice ? responsiveSpacing.lg : 10,
          padding: 20,
          ...createMediumShadow(theme),
      },
    formContainer: {
      width: '100%',
      paddingHorizontal: 30,
      marginTop: height * 0.05,
    },
    title: {
      fontSize: fontSizes.headerTitle,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 30,
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    },
    input: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      marginBottom: 15,
      paddingHorizontal: 15,
      fontSize: fontSizes.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loginButton: {
      width: '100%',
      height: 50,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
      ...createSmallShadow(theme),
    },
    loginButtonText: {
      color: '#fff',
      fontSize: fontSizes.buttonText,
      fontWeight: '600',
    },
    guardianLoginButton: {
      width: '100%',
      height: 50,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.mode === 'dark' ? '#fff' : theme.colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    guardianLoginButtonText: {
      color: theme.mode === 'dark' ? '#fff' : theme.colors.primary,
      fontSize: fontSizes.buttonText,
      fontWeight: '600',
    },
    forgotPassword: {
      marginTop: 15,
      alignItems: 'center',
    },
    forgotPasswordText: {
      color: theme.mode === 'dark' ? '#fff' : theme.colors.primary,
      fontSize: fontSizes.bodySmall,
    },

    debugContainer: {
      marginTop: 20,
      padding: 15,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    debugTitle: {
      fontSize: fontSizes.small,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    debugText: {
      fontSize: fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    debugButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      gap: 10,
    },
    debugButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    debugButtonText: {
      color: '#fff',
      fontSize: fontSizes.small,
      fontWeight: '600',
    },
    debugInfoContainer: {
      marginTop: 10,
      padding: 10,
      backgroundColor: theme.colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    debugInfoTitle: {
      fontSize: fontSizes.small,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    debugInfoScroll: {
      maxHeight: 200,
    },
    debugInfoText: {
      fontSize: fontSizes.small - 1,
      color: theme.colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      lineHeight: 16,
    },
    schoolResourcesContainer: {
      width: '100%',
      paddingHorizontal: 30,
      marginTop: 30,
      marginBottom: 20,
    },
    loginTypeContainer: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: 20,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.colors.cardBackground,
    },
    loginTypeButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    activeLoginType: {
      backgroundColor: theme.colors.primary,
    },
    loginTypeText: {
      fontSize: fontSizes.medium,
      color: theme.colors.text,
      fontWeight: '500',
    },
    activeLoginTypeText: {
      color: '#fff',
      fontWeight: '600',
    },
  });
