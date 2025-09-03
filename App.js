import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';

// Teacher Screens
import TeacherScreen from './src/screens/TeacherScreen';
import TeacherProfile from './src/screens/TeacherProfile';
import TeacherTimetable from './src/screens/TeacherTimetable';
import TeacherAttendanceScreen from './src/screens/TeacherAttendanceScreen';
import TeacherBPS from './src/screens/TeacherBPS';
import TeacherHomeworkScreen from './src/screens/TeacherHomeworkScreen';
import TeacherHomeworkDetailScreen from './src/screens/TeacherHomeworkDetailScreen';
import TeacherHomeworkCreateScreen from './src/screens/TeacherHomeworkCreateScreen';
import TeacherMessagingScreen from './src/screens/TeacherMessagingScreen';
import TeacherHealthScreen from './src/screens/TeacherHealthScreen';
import TeacherPickupScreen from './src/screens/TeacherPickupScreen';
import TeacherQRScannerScreen from './src/screens/TeacherQRScannerScreen';

// Homeroom Screens
import HomeroomScreen from './src/screens/HomeroomScreen';
import HomeroomStudentsScreen from './src/screens/HomeroomStudentsScreen';
import HomeroomStudentProfile from './src/screens/HomeroomStudentProfile';
import HomeroomDisciplineScreen from './src/screens/HomeroomDisciplineScreen';
import HomeroomAttendanceDetailsScreen from './src/screens/HomeroomAttendanceDetailsScreen';

// Parent/Student Screens
import ParentScreen from './src/screens/ParentScreen';
import StudentScreen from './src/screens/StudentScreen';
import StudentProfileScreen from './src/screens/StudentProfileScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import GradesScreen from './src/screens/GradesScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import AssignmentDetailScreen from './src/screens/AssignmentDetailScreen';
import StudentHomeworkDetailScreen from './src/screens/StudentHomeworkDetailScreen';
import BehaviorScreen from './src/screens/BehaviorScreen';
import StudentMessagingScreen from './src/screens/StudentMessagingScreen';
import ParentMessagingScreen from './src/screens/ParentMessagingScreen';
import StudentCreateConversationScreen from './src/screens/StudentCreateConversationScreen';
import StudentHealthScreen from './src/screens/StudentHealthScreen';
import ParentPickupRequestScreen from './src/screens/ParentPickupRequestScreen';

// Guardian Screens
import AddGuardianScreen from './src/screens/AddGuardianScreen';
import GuardianAutoLoginScreen from './src/screens/GuardianAutoLoginScreen';
import GuardianDashboardScreen from './src/screens/GuardianDashboardScreen';
import GuardianDetailScreen from './src/screens/GuardianDetailScreen';
import GuardianLoginScreen from './src/screens/GuardianLoginScreen';
import GuardianManagementScreen from './src/screens/GuardianManagementScreen';
import GuardianPickupRequestScreen from './src/screens/GuardianPickupRequestScreen';
import GuardianProfileCompletionScreen from './src/screens/GuardianProfileCompletionScreen';
import GuardianProfileEditScreen from './src/screens/GuardianProfileEditScreen';
import GuardianQRScannerFallbackScreen from './src/screens/GuardianQRScannerFallbackScreen';
import GuardianQRScannerScreen from './src/screens/GuardianQRScannerScreen';

// Shared Screens
import ConversationScreen from './src/screens/ConversationScreen';
import CreateConversationScreen from './src/screens/CreateConversationScreen';
import EditHealthInfoScreen from './src/screens/EditHealthInfoScreen';
import CreateHealthRecordScreen from './src/screens/CreateHealthRecordScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import UserCalendarScreen from './src/screens/UserCalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import FAQScreen from './src/screens/FAQScreen';
import WorkspaceScreen from './src/screens/WorkspaceScreen';

// Report Screens
import StudentReportsScreen from './src/screens/StudentReportsScreen';
import StaffReportsScreen from './src/screens/StaffReportsScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { MessagingProvider } from './src/contexts/MessagingContext';
import {
  requestUserPermission,
  notificationListener,
  getDeviceToken,
  setupLocalNotifications,
  setNavigationRef,
} from './src/utils/messaging';
import { getDemoCredentials } from './src/services/authService';
import performanceMonitor, {
  wrapWithTimeout,
} from './src/utils/performanceMonitor';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = React.useRef();

  useEffect(() => {
    console.log('🚀 APP LAUNCH: Starting app initialization...');
    console.log('📱 Platform:', Platform.OS);
    console.log('⏰ Launch time:', new Date().toISOString());
    console.log(
      '🔧 React Native version:',
      Platform.constants?.reactNativeVersion || 'Unknown'
    );

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Log demo credentials for easy access
    console.log('\n🎭 DEMO MODE CREDENTIALS:');
    console.log('========================');
    const demoCredentials = getDemoCredentials();
    Object.entries(demoCredentials).forEach(([type, creds]) => {
      console.log(
        `${type.toUpperCase()}: ${creds.username} / ${creds.password}`
      );
    });
    console.log('========================\n');

    // We don't need to check login status here anymore
    // as we'll check it when the user taps on the Teacher button
    // in the HomeScreen

    // Request notification permissions and setup Firebase messaging
    const setupFirebase = async () => {
      try {
        console.log('🔥 FIREBASE SETUP: Starting Firebase initialization...');
        console.log('📱 Platform:', Platform.OS);

        // iOS-specific setup with shorter timeouts
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS: Starting iOS-specific Firebase setup...');

          // Request permission with timeout for iOS
          console.log('🔔 iOS: Requesting user permission with timeout...');
          try {
            await wrapWithTimeout(
              requestUserPermission,
              15000, // 15 second timeout for iOS permission request
              'iOS Permission Request'
            );
          } catch (permissionError) {
            console.warn(
              '⚠️ iOS: Permission request timed out or failed:',
              permissionError
            );
            // Continue without permissions on iOS
          }

          // Setup local notifications with timeout
          console.log('📲 iOS: Setting up local notifications...');
          try {
            await wrapWithTimeout(
              setupLocalNotifications,
              10000, // 10 second timeout
              'iOS Local Notifications'
            );
          } catch (notificationError) {
            console.warn(
              '⚠️ iOS: Local notifications setup failed:',
              notificationError
            );
          }

          // Get device token with timeout (iOS specific)
          console.log('🎫 iOS: Getting device token...');
          try {
            const token = await wrapWithTimeout(
              getDeviceToken,
              20000, // 20 second timeout for iOS device token
              'iOS Device Token'
            );

            if (token) {
              console.log('✅ iOS: APNS TOKEN RECEIVED');
              console.log('🔗 iOS: Token length:', token.length);
            } else {
              console.log('❌ iOS: No token received');
            }
          } catch (tokenError) {
            console.warn('⚠️ iOS: Device token retrieval failed:', tokenError);
          }
        } else {
          // Android setup (original flow)
          console.log('🤖 Android: Starting Android Firebase setup...');

          await requestUserPermission();
          await setupLocalNotifications();

          const token = await getDeviceToken();
          if (token) {
            console.log('✅ Android: FCM TOKEN RECEIVED:', token);
            console.log('🔗 Android: Token length:', token.length);
          }
        }

        // Setup notification listeners (common for both platforms)
        console.log('👂 LISTENERS: Setting up notification listeners...');
        notificationListener();

        // Set navigation reference for programmatic navigation from notifications
        console.log(
          '🧭 NAVIGATION: Navigation reference will be set when container is ready...'
        );

        console.log('✅ FIREBASE SETUP: Complete');
      } catch (error) {
        console.error('❌ FIREBASE SETUP ERROR:', error);
        console.error('🔍 Error details:', error.message);
        console.error('📊 Error stack:', error.stack);

        // Platform-specific error handling
        if (Platform.OS === 'ios') {
          console.error(
            '🍎 iOS: Firebase setup failed - this is common on iOS due to stricter permissions'
          );
        }

        // Continue with app initialization even if notifications fail
      }
    };

    // Run initialization tasks with timeout protection
    const initialize = async () => {
      console.log('🏁 INITIALIZATION: Starting app initialization sequence...');
      const startTime = Date.now();

      try {
        // Wrap Firebase setup with timeout protection
        await wrapWithTimeout(
          setupFirebase,
          30000, // 30 second timeout
          'Firebase Setup'
        );

        const endTime = Date.now();
        console.log(`⚡ INITIALIZATION: Complete in ${endTime - startTime}ms`);
        console.log('🎬 SPLASH: Waiting for splash screen animation...');

        // We'll let the splash screen animation control when to transition
        // The splash screen will call handleAnimationComplete when done
      } catch (error) {
        console.error('❌ INITIALIZATION: Failed with error:', error);

        // Continue with app initialization even if some parts fail
        const endTime = Date.now();
        console.log(
          `⚡ INITIALIZATION: Completed with errors in ${endTime - startTime}ms`
        );

        // Still proceed to show the app
        console.log('🎬 SPLASH: Proceeding despite initialization errors...');
      }
    };

    initialize();
  }, []);

  const handleAnimationComplete = () => {
    console.log('🎬 SPLASH COMPLETE: Animation finished');
    console.log('🏠 NAVIGATION: Transitioning to main app...');
    console.log('⏰ App ready time:', new Date().toISOString());
    setIsLoading(false);
  };

  // For development only - display the FCM token
  // const DevTokenDisplay = () => {
  //   if (!fcmToken) return null;
  //   return (
  //     <View style={styles.tokenContainer}>
  //       <Text style={styles.tokenTitle}>FCM Token (Dev Only):</Text>
  //       <Text style={styles.tokenText}>{fcmToken}</Text>
  //     </View>
  //   );
  // };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <SplashScreen onAnimationComplete={handleAnimationComplete} />
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NotificationProvider>
              <MessagingProvider>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    console.log(
                      '🧭 NAVIGATION: NavigationContainer is ready, setting reference...'
                    );
                    // Add a small delay to ensure navigation is fully initialized
                    setTimeout(() => {
                      setNavigationRef(navigationRef.current);
                    }, 100);
                  }}
                >
                  <StatusBar style='auto' />
                  <Stack.Navigator
                    initialRouteName='Home'
                    screenOptions={{ headerShown: false }}
                  >
                    {/* Core Screens */}
                    <Stack.Screen name='Home' component={HomeScreen} />
                    <Stack.Screen name='Login' component={LoginScreen} />

                    {/* Teacher Screens */}
                    <Stack.Screen
                      name='TeacherScreen'
                      component={TeacherScreen}
                    />
                    <Stack.Screen
                      name='TeacherProfile'
                      component={TeacherProfile}
                    />
                    <Stack.Screen
                      name='TeacherTimetable'
                      component={TeacherTimetable}
                    />
                    <Stack.Screen
                      name='TeacherAttendance'
                      component={TeacherAttendanceScreen}
                    />
                    <Stack.Screen name='TeacherBPS' component={TeacherBPS} />
                    <Stack.Screen
                      name='TeacherHomework'
                      component={TeacherHomeworkScreen}
                    />
                    <Stack.Screen
                      name='TeacherHomeworkDetail'
                      component={TeacherHomeworkDetailScreen}
                    />
                    <Stack.Screen
                      name='TeacherHomeworkCreate'
                      component={TeacherHomeworkCreateScreen}
                    />
                    <Stack.Screen
                      name='TeacherMessagingScreen'
                      component={TeacherMessagingScreen}
                    />
                    <Stack.Screen
                      name='TeacherHealthScreen'
                      component={TeacherHealthScreen}
                    />
                    <Stack.Screen
                      name='TeacherPickupScreen'
                      component={TeacherPickupScreen}
                    />
                    <Stack.Screen
                      name='TeacherQRScannerScreen'
                      component={TeacherQRScannerScreen}
                    />

                    {/* Homeroom Screens */}
                    <Stack.Screen
                      name='HomeroomScreen'
                      component={HomeroomScreen}
                    />
                    <Stack.Screen
                      name='HomeroomStudentsScreen'
                      component={HomeroomStudentsScreen}
                    />
                    <Stack.Screen
                      name='HomeroomStudentProfile'
                      component={HomeroomStudentProfile}
                    />
                    <Stack.Screen
                      name='HomeroomDisciplineScreen'
                      component={HomeroomDisciplineScreen}
                    />
                    <Stack.Screen
                      name='HomeroomAttendanceDetails'
                      component={HomeroomAttendanceDetailsScreen}
                    />

                    {/* Parent/Student Screens */}
                    <Stack.Screen
                      name='ParentScreen'
                      component={ParentScreen}
                    />
                    <Stack.Screen
                      name='StudentScreen'
                      component={StudentScreen}
                    />
                    <Stack.Screen
                      name='StudentProfileScreen'
                      component={StudentProfileScreen}
                    />
                    <Stack.Screen
                      name='TimetableScreen'
                      component={TimetableScreen}
                    />
                    <Stack.Screen
                      name='GradesScreen'
                      component={GradesScreen}
                    />
                    <Stack.Screen
                      name='AttendanceScreen'
                      component={AttendanceScreen}
                    />
                    <Stack.Screen
                      name='AssignmentsScreen'
                      component={AssignmentsScreen}
                    />
                    <Stack.Screen
                      name='AssignmentDetail'
                      component={AssignmentDetailScreen}
                    />
                    <Stack.Screen
                      name='StudentHomeworkDetail'
                      component={StudentHomeworkDetailScreen}
                    />
                    <Stack.Screen
                      name='BehaviorScreen'
                      component={BehaviorScreen}
                    />
                    <Stack.Screen
                      name='StudentMessagingScreen'
                      component={StudentMessagingScreen}
                    />
                    <Stack.Screen
                      name='ParentMessagingScreen'
                      component={ParentMessagingScreen}
                    />
                    <Stack.Screen
                      name='StudentCreateConversationScreen'
                      component={StudentCreateConversationScreen}
                    />
                    <Stack.Screen
                      name='StudentHealthScreen'
                      component={StudentHealthScreen}
                    />
                    <Stack.Screen
                      name='ParentPickupRequestScreen'
                      component={ParentPickupRequestScreen}
                    />

                    {/* Guardian Screens */}
                    <Stack.Screen
                      name='AddGuardianScreen'
                      component={AddGuardianScreen}
                    />
                    <Stack.Screen
                      name='GuardianAutoLoginScreen'
                      component={GuardianAutoLoginScreen}
                    />
                    <Stack.Screen
                      name='GuardianDashboardScreen'
                      component={GuardianDashboardScreen}
                    />
                    <Stack.Screen
                      name='GuardianDetailScreen'
                      component={GuardianDetailScreen}
                    />
                    <Stack.Screen
                      name='GuardianLoginScreen'
                      component={GuardianLoginScreen}
                    />
                    <Stack.Screen
                      name='GuardianManagementScreen'
                      component={GuardianManagementScreen}
                    />
                    <Stack.Screen
                      name='GuardianPickupRequestScreen'
                      component={GuardianPickupRequestScreen}
                    />
                    <Stack.Screen
                      name='GuardianProfileCompletionScreen'
                      component={GuardianProfileCompletionScreen}
                    />
                    <Stack.Screen
                      name='GuardianProfileEditScreen'
                      component={GuardianProfileEditScreen}
                    />
                    <Stack.Screen
                      name='GuardianQRScannerFallbackScreen'
                      component={GuardianQRScannerFallbackScreen}
                    />
                    <Stack.Screen
                      name='GuardianQRScannerScreen'
                      component={GuardianQRScannerScreen}
                    />

                    {/* Shared Screens */}
                    <Stack.Screen
                      name='ConversationScreen'
                      component={ConversationScreen}
                    />
                    <Stack.Screen
                      name='CreateConversationScreen'
                      component={CreateConversationScreen}
                    />
                    <Stack.Screen
                      name='EditHealthInfoScreen'
                      component={EditHealthInfoScreen}
                    />
                    <Stack.Screen
                      name='CreateHealthRecordScreen'
                      component={CreateHealthRecordScreen}
                    />
                    <Stack.Screen name='Calendar' component={CalendarScreen} />
                    <Stack.Screen
                      name='UserCalendar'
                      component={UserCalendarScreen}
                    />
                    <Stack.Screen
                      name='SettingsScreen'
                      component={SettingsScreen}
                    />
                    <Stack.Screen
                      name='NotificationScreen'
                      component={NotificationScreen}
                    />
                    <Stack.Screen
                      name='LibraryScreen'
                      component={LibraryScreen}
                    />
                    <Stack.Screen name='AboutUs' component={AboutUsScreen} />
                    <Stack.Screen name='Contacts' component={ContactsScreen} />
                    <Stack.Screen name='FAQ' component={FAQScreen} />
                    <Stack.Screen
                      name='WorkspaceScreen'
                      component={WorkspaceScreen}
                    />

                    {/* Report Screens */}
                    <Stack.Screen
                      name='StudentReports'
                      component={StudentReportsScreen}
                    />
                    <Stack.Screen
                      name='StaffReports'
                      component={StaffReportsScreen}
                    />
                    <Stack.Screen
                      name='ReportDetail'
                      component={ReportDetailScreen}
                    />
                  </Stack.Navigator>
                  {/* <DevTokenDisplay /> */}
                </NavigationContainer>
              </MessagingProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tokenContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  tokenTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    color: 'white',
    fontSize: 10,
  },
});
