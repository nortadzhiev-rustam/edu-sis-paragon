/**
 * Authentication Service
 * Uses dummy data for development and testing
 */

import { Config, buildApiUrl } from '../config/env';
import { getLoginDeviceInfo } from '../utils/deviceInfo';
import SchoolConfigService from './schoolConfigService';

/**
 * Get the appropriate storage key for user data based on user type
 * @param {string} userType - The type of user (teacher, parent, student)
 * @returns {string} - The storage key to use
 */
export const getUserDataStorageKey = (userType) => {
  switch (userType) {
    case 'teacher':
      return Config.STORAGE_KEYS.TEACHER_USER_DATA;
    case 'parent':
      return Config.STORAGE_KEYS.PARENT_USER_DATA;
    case 'student':
      return Config.STORAGE_KEYS.STUDENT_USER_DATA;
    default:
      // Fallback to generic key for backward compatibility
      return Config.STORAGE_KEYS.USER_DATA;
  }
};

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

// Demo mode credentials
const DEMO_CREDENTIALS = {
  TEACHER: {
    username: 'demo_teacher',
    password: 'demo2025',
  },
  STUDENT: {
    username: 'demo_student',
    password: 'demo2025',
  },
  PARENT: {
    username: 'demo_parent',
    password: 'demo2025',
  },
};

// Demo user data with comprehensive information
const demoTeacherData = {
  id: 'DEMO_T001',
  username: 'demo_teacher',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@demo.edu',
  authCode: 'DEMO_AUTH_T001',
  userType: 'teacher',
  is_teacher: true,
  is_homeroom: true,
  photo: null,
  role: 'Senior Teacher',
  branches: [
    {
      branch_id: 1,
      branch_name: 'Main Campus',
      branch_code: 'MC',
    },
    {
      branch_id: 2,
      branch_name: 'Secondary Campus',
      branch_code: 'SC',
    },
  ],
  permissions: {
    can_take_attendance: true,
    can_manage_bps: true,
    can_create_homework: true,
    can_delete_bps: true,
    can_view_all_students: true,
    can_send_notifications: true,
  },
  subjects: ['Mathematics', 'Physics'],
  homeroom_class: 'Grade 10A',
  roles: [
    {
      role_id: 1,
      role_name: 'Senior Teacher',
      branch_id: 1,
      branch_name: 'Main Campus',
    },
    {
      role_id: 2,
      role_name: 'Mathematics Department Head',
      branch_id: 1,
      branch_name: 'Main Campus',
    },
    {
      role_id: 3,
      role_name: 'Subject Teacher',
      branch_id: 2,
      branch_name: 'Secondary Campus',
    },
  ],
  demo_mode: true,
};

const demoStudentData = {
  id: 'DEMO_S001',
  username: 'demo_student',
  name: 'Alex Chen',
  email: 'alex.chen@demo.edu',
  authCode: 'DEMO_AUTH_S001',
  userType: 'student',
  is_student: true,
  photo: null,
  student_id: 'STU2024001',
  grade: '10',
  class: 'Grade 10A',
  branch: {
    branch_id: 1,
    branch_name: 'Main Campus',
    branch_code: 'MC',
  },
  homeroom_teacher: 'Sarah Johnson',
  demo_mode: true,
};

const demoParentData = {
  id: 'DEMO_P001',
  username: 'demo_parent',
  name: 'Michael Chen',
  email: 'michael.chen@demo.com',
  authCode: 'DEMO_AUTH_P001',
  userType: 'parent',
  is_parent: true,
  photo: null,
  children: [
    {
      id: 'DEMO_S001',
      name: 'Alex Chen',
      student_id: 'STU2024001',
      grade: '10',
      class: 'Grade 10A',
      branch_name: 'Main Campus',
      authCode: 'DEMO_AUTH_S001',
    },
  ],
  demo_mode: true,
};

// Dummy data for development (when USE_DUMMY_DATA is true)
const dummyTeachers = [
  {
    id: 'T001',
    username: 'teacher1',
    password: 'password123',
    name: 'John Teacher',
    authCode: 'AUTH_T001',
    userType: 'teacher',
  },
];

const dummyStudents = [
  {
    id: 'S001',
    username: 'student1',
    password: 'password123',
    name: 'Jane Student',
    authCode: 'AUTH_S001',
    userType: 'student',
  },
];

// Demo mode detection functions
const isDemoCredentials = (username, password, userType) => {
  const demoCredential = DEMO_CREDENTIALS[userType.toUpperCase()];
  return (
    demoCredential &&
    username === demoCredential.username &&
    password === demoCredential.password
  );
};

const getDemoUserData = (userType) => {
  switch (userType.toLowerCase()) {
    case 'teacher':
      return { ...demoTeacherData };
    case 'student':
      return { ...demoStudentData };
    case 'parent':
      return { ...demoParentData };
    default:
      return null;
  }
};

// Helper functions for dummy data
const findTeacher = (username, password) => {
  return dummyTeachers.find(
    (teacher) => teacher.username === username && teacher.password === password
  );
};

const findStudent = (username, password) => {
  return dummyStudents.find(
    (student) => student.username === username && student.password === password
  );
};

// Helper function to encode string to base64
const encodeToBase64 = (str) => {
  if (typeof btoa === 'function') {
    return btoa(str);
  } else if (typeof Buffer === 'function') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  throw new Error('No available method for base64 encoding');
};

/**
 * Teacher login API call using new staff login endpoint
 * @param {string} username - Teacher's username
 * @param {string} password - Teacher's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const teacherLogin = async (username, password, deviceToken) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Check for demo mode credentials first
  if (isDemoCredentials(username, password, 'teacher')) {
    console.log('🎭 DEMO MODE: Teacher login detected');

    // Set up demo school configuration
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        username,
        'teacher'
      );
      await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
      console.log(
        '🏫 DEMO MODE: School configuration saved:',
        schoolConfig.name
      );
    } catch (schoolError) {
      console.error('❌ DEMO MODE: School detection error:', schoolError);
    }

    const demoData = getDemoUserData('teacher');
    return demoData;
  }

  if (USE_DUMMY_DATA) {
    const teacher = findTeacher(username, password);

    if (teacher) {
      return teacher;
    } else {
      return null;
    }
  } else {
    try {
      // Get device information
      const deviceInfo = await getLoginDeviceInfo();
      console.log('🔍 AUTH DEBUG: Device info collected:', deviceInfo);

      // Use the API for real authentication
      console.log('🔍 AUTH DEBUG: Raw device token:', deviceToken);
      console.log('🔍 AUTH DEBUG: Device token type:', typeof deviceToken);
      console.log(
        '🔍 AUTH DEBUG: Device token constructor:',
        deviceToken?.constructor?.name
      );
      console.log(
        '🔍 AUTH DEBUG: Device token toString():',
        deviceToken?.toString()
      );
      console.log(
        '🔍 AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      // Check if deviceToken is a Future or Promise
      if (
        deviceToken &&
        typeof deviceToken === 'object' &&
        deviceToken.constructor
      ) {
        console.error(
          '❌ AUTH ERROR: Device token appears to be an object/Future instead of string!'
        );
        console.error('🔍 Constructor name:', deviceToken.constructor.name);
        console.error('🔍 Object keys:', Object.keys(deviceToken));

        // If it's a Promise/Future, try to await it
        if (typeof deviceToken.then === 'function') {
          console.log('🔄 AUTH: Attempting to await the device token...');
          try {
            deviceToken = await deviceToken;
            console.log(
              '✅ AUTH: Successfully awaited device token:',
              deviceToken
            );
          } catch (awaitError) {
            console.error('❌ AUTH: Failed to await device token:', awaitError);
            deviceToken = ''; // Use empty string as fallback
          }
        }
      }

      // Final validation: ensure deviceToken is a string
      if (deviceToken && typeof deviceToken !== 'string') {
        console.error(
          '❌ AUTH ERROR: Device token is still not a string after processing!'
        );
        console.error('🔍 Final type:', typeof deviceToken);
        console.error('🔍 Final value:', deviceToken);
        deviceToken = String(deviceToken); // Force convert to string
        console.log('🔄 AUTH: Forced conversion to string:', deviceToken);
      }

      // Use raw FCM token directly (no Base64 encoding needed)
      console.log('🔍 AUTH DEBUG: Using raw FCM token for API call');
      console.log('🔍 AUTH DEBUG: Raw token length:', deviceToken.length);

      // Validate token doesn't contain "Future" or "Instance" (indicates Promise issues)
      let finalToken = deviceToken;
      if (deviceToken.includes('Future') || deviceToken.includes('Instance')) {
        console.error(
          '❌ AUTH ERROR: Token contains Future/Instance - this indicates the original token was not a string!'
        );
        console.error('🔍 Problematic token:', deviceToken);
        // Use empty token as fallback and continue with login
        console.log('🔄 AUTH: Using empty token as fallback and continuing...');
        finalToken = '';
        console.log('🔄 AUTH: Proceeding with empty token');
      }

      const apiUrl = buildApiUrl(Config.API_ENDPOINTS.STAFF_LOGIN);

      console.log('🔍 TEACHER LOGIN: Using new staff login endpoint:', apiUrl);

      // Add timeout and better error handling
      const controller = new AbortController();
      const authTimeout = Config.NETWORK.AUTH_TIMEOUT || Config.NETWORK.TIMEOUT;
      const timeoutId = setTimeout(() => {
        console.log(
          `⏰ TEACHER LOGIN: Request timed out after ${authTimeout}ms`
        );
        controller.abort();
      }, authTimeout);

      const response = await fetch(apiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          deviceToken: finalToken,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel,
          deviceBrand: deviceInfo.deviceBrand,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          appVersion: deviceInfo.appVersion,
          isEmulator: deviceInfo.isEmulator,
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();

        // Debug: Log the actual API response
        console.log('🔍 TEACHER LOGIN API RESPONSE:', data);
        console.log('🔍 TEACHER LOGIN API RESPONSE TYPE:', typeof data);

        // Check if the API returned an error in the response body
        if (data === 0 || data === '0' || data === null || data === false) {
          console.log(
            '❌ TEACHER LOGIN: API returned invalid credentials (data is 0/null/false)'
          );
          return null;
        }

        // Check if the response has an error field
        if (data && data.error) {
          console.log(
            '❌ TEACHER LOGIN: API returned error in response body:',
            data.error
          );
          return null;
        }

        // Check if the response indicates invalid credentials or failure
        if (
          data &&
          (data.message === 'Invalid credentials' ||
            data.status === 'error' ||
            data.success === false)
        ) {
          console.log(
            '❌ TEACHER LOGIN: API returned invalid credentials or failed authentication'
          );
          return null;
        }

        // For the new staff login endpoint, check for success field
        if (data && data.success !== true) {
          console.log(
            '❌ TEACHER LOGIN: API response indicates failure:',
            data.message || 'Unknown error'
          );
          return null;
        }

        // Validate that we have the expected response structure
        console.log('🔍 TEACHER LOGIN: Checking required fields...');
        const authCode = data.auth_code || data.authCode;
        const userId = data.user_id || data.userId || data.id;
        const userName = data.user_name || data.userName || data.name;

        console.log('🔍 auth_code present:', !!authCode, 'value:', authCode);
        console.log('🔍 user_id present:', !!userId, 'value:', userId);
        console.log('🔍 user_name present:', !!userName, 'value:', userName);
        console.log('🔍 success field:', data.success);
        console.log('🔍 message field:', data.message);

        if (!authCode || !userId || !userName) {
          console.log(
            '❌ TEACHER LOGIN: API response missing required fields (auth_code, user_id, user_name)'
          );
          console.log('🔍 Available fields:', Object.keys(data));
          return null;
        }

        console.log('✅ TEACHER LOGIN: Valid credentials, detecting school...');

        // Skip school detection for now to prevent login hanging
        console.log(
          '⏭️ TEACHER LOGIN: Skipping school detection to prevent hanging'
        );

        // Use default school configuration
        try {
          const defaultSchoolConfig = {
            schoolId: 'default',
            name: 'Default School',
            domain: 'default.edu',
            hasGoogleWorkspace: false,
          };
          await SchoolConfigService.saveCurrentSchoolConfig(
            defaultSchoolConfig
          );
          console.log('🏫 TEACHER LOGIN: Default school configuration saved');
        } catch (schoolError) {
          console.error(
            '❌ TEACHER LOGIN: Failed to save default school config:',
            schoolError
          );
          // Continue with login even if school config fails
        }

        // Transform API response to match expected user data format
        // Determine homeroom status from API data
        const rolesArray = Array.isArray(data.roles) ? data.roles : [];
        const hasHomeroomRole = rolesArray.some((role) => {
          const name = (role.role_name || role.name || '').toLowerCase();
          return (
            name.includes('homeroom') ||
            name.includes('home room') ||
            name.includes('class teacher') ||
            name.includes('class in-charge') ||
            name.includes('class incharge')
          );
        });
        const inferredIsHomeroom =
          Boolean(data.is_homeroom) ||
          Boolean(data.homeroom_class) ||
          hasHomeroomRole;

        const transformedUserData = {
          // Core user information
          id: userId,
          username: data.username || username,
          name: userName,
          email: data.email,
          authCode: authCode,
          userType: 'teacher', // Force to 'teacher' for teacher login (LoginScreen expects this)
          mobile_phone: data.mobile_phone,
          photo: data.photo,

          // Staff-specific information
          is_teacher: true,
          is_staff: true,
          role: data.staff_details?.profession_position || 'Staff Member',
          staff_category_id: data.staff_details?.staff_category_id,
          staff_category_name: data.staff_details?.staff_category_name,
          profession_position: data.staff_details?.profession_position,

          // Branch information
          branch: data.branch,
          branches: data.accessible_branches || [data.branch],
          accessible_branches: data.accessible_branches,

          // Roles and permissions
          roles: data.roles || [],

          // Homeroom flag inferred from roles/fields
          is_homeroom: inferredIsHomeroom,
          homeroom_class: data.homeroom_class,

          // Original API response for reference
          originalResponse: data,

          // API user type for reference
          apiUserType: data.user_type,
        };

        console.log('🔍 TEACHER LOGIN: Transformed user data:', {
          id: transformedUserData.id,
          name: transformedUserData.name,
          userType: transformedUserData.userType,
          authCode: transformedUserData.authCode ? '[PRESENT]' : '[MISSING]',
          hasRoles: transformedUserData.roles?.length > 0,
          hasBranch: !!transformedUserData.branch,
        });

        return transformedUserData;
      } else {
        console.log(
          '❌ TEACHER LOGIN: API returned non-200 status:',
          response.status
        );
        return null;
      }
    } catch (error) {
      console.error('❌ TEACHER LOGIN ERROR:', error);
      console.error('🔍 Error message:', error.message);
      console.error('📊 Error code:', error.code);
      console.error('🌐 Network error:', error.name);
      console.error('📱 Device info available:', !!deviceInfo);
      console.error('🔑 Device token available:', !!deviceToken);
      console.error('🔗 API URL:', apiUrl);

      // Check if this is a timeout error
      if (error.name === 'AbortError') {
        console.error('⏰ TEACHER LOGIN: Request was aborted (likely timeout)');
        console.error(`⏰ Timeout was set to: ${authTimeout}ms`);
        return {
          error: true,
          errorType: 'TimeoutError',
          errorMessage: `Authentication request timed out after ${
            authTimeout / 1000
          } seconds. Please check your internet connection and try again.`,
          errorCode: 'TIMEOUT',
          timestamp: new Date().toISOString(),
        };
      }

      // Return error details for debugging
      return {
        error: true,
        errorType: error.name || 'NetworkError',
        errorMessage: error.message || 'Unknown error',
        errorCode: error.code,
        timestamp: new Date().toISOString(),
      };
    }
  }
};

/**
 * Student login API call
 * @param {string} username - Student's username
 * @param {string} password - Student's password
 * @param {string} deviceToken - Firebase device token
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const studentLogin = async (username, password, deviceToken) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Check for demo mode credentials first
  if (isDemoCredentials(username, password, 'student')) {
    console.log('🎭 DEMO MODE: Student login detected');

    // Set up demo school configuration
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        username,
        'student'
      );
      await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
      console.log(
        '🏫 DEMO MODE: School configuration saved:',
        schoolConfig.name
      );
    } catch (schoolError) {
      console.error('❌ DEMO MODE: School detection error:', schoolError);
    }

    const demoData = getDemoUserData('student');
    return demoData;
  }

  if (USE_DUMMY_DATA) {
    const student = findStudent(username, password);

    if (student) {
      return student;
    } else {
      return null;
    }
  } else {
    try {
      // Get device information
      const deviceInfo = await getLoginDeviceInfo();
      console.log('🔍 STUDENT AUTH DEBUG: Device info collected:', deviceInfo);

      // Use the API for real authentication
      console.log('🔍 STUDENT AUTH DEBUG: Raw device token:', deviceToken);
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token type:',
        typeof deviceToken
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token constructor:',
        deviceToken?.constructor?.name
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token toString():',
        deviceToken?.toString()
      );
      console.log(
        '🔍 STUDENT AUTH DEBUG: Device token length:',
        deviceToken?.length || 0
      );

      // Check if deviceToken is a Future or Promise
      if (
        deviceToken &&
        typeof deviceToken === 'object' &&
        deviceToken.constructor
      ) {
        console.error(
          '❌ STUDENT AUTH ERROR: Device token appears to be an object/Future instead of string!'
        );
        console.error('🔍 Constructor name:', deviceToken.constructor.name);
        console.error('🔍 Object keys:', Object.keys(deviceToken));

        // If it's a Promise/Future, try to await it
        if (typeof deviceToken.then === 'function') {
          console.log(
            '🔄 STUDENT AUTH: Attempting to await the device token...'
          );
          try {
            deviceToken = await deviceToken;
            console.log(
              '✅ STUDENT AUTH: Successfully awaited device token:',
              deviceToken
            );
          } catch (awaitError) {
            console.error(
              '❌ STUDENT AUTH: Failed to await device token:',
              awaitError
            );
            deviceToken = ''; // Use empty string as fallback
          }
        }
      }

      // Final validation: ensure deviceToken is a string
      if (deviceToken && typeof deviceToken !== 'string') {
        console.error(
          '❌ STUDENT AUTH ERROR: Device token is still not a string after processing!'
        );
        console.error('🔍 Final type:', typeof deviceToken);
        console.error('🔍 Final value:', deviceToken);
        deviceToken = String(deviceToken); // Force convert to string
        console.log(
          '🔄 STUDENT AUTH: Forced conversion to string:',
          deviceToken
        );
      }

      // Use raw FCM token directly (no Base64 encoding needed)
      console.log('🔍 STUDENT AUTH DEBUG: Using raw FCM token for API call');
      console.log(
        '🔍 STUDENT AUTH DEBUG: Raw token length:',
        deviceToken.length
      );

      // Validate token doesn't contain "Future" or "Instance" (indicates Promise issues)
      let finalToken = deviceToken;
      if (deviceToken.includes('Future') || deviceToken.includes('Instance')) {
        console.error(
          '❌ STUDENT AUTH ERROR: Token contains Future/Instance - this indicates the original token was not a string!'
        );
        console.error('🔍 Problematic token:', deviceToken);
        console.log(
          '🔄 STUDENT AUTH: Using empty token as fallback and continuing...'
        );
        finalToken = '';
        console.log('🔄 STUDENT AUTH: Proceeding with empty token');
      }

      const apiUrl = buildApiUrl(
        Config.API_ENDPOINTS.CHECK_STUDENT_CREDENTIALS,
        {
          username,
          password,
          deviceType: deviceInfo.deviceType,
          deviceToken: finalToken,
          deviceName: deviceInfo.deviceName,
          deviceModel: deviceInfo.deviceModel,
          deviceBrand: deviceInfo.deviceBrand,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          appVersion: deviceInfo.appVersion,
          isEmulator: deviceInfo.isEmulator,
        }
      );

      console.log('🔍 STUDENT AUTH DEBUG: API URL:', apiUrl);

      // Add timeout and better error handling
      const controller = new AbortController();
      const authTimeout = Config.NETWORK.AUTH_TIMEOUT || Config.NETWORK.TIMEOUT;
      const timeoutId = setTimeout(() => {
        console.log(
          `⏰ STUDENT LOGIN: Request timed out after ${authTimeout}ms`
        );
        controller.abort();
      }, authTimeout);

      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();

        // Debug: Log the actual API response
        console.log('🔍 STUDENT LOGIN API RESPONSE:', data);
        console.log('🔍 STUDENT LOGIN API RESPONSE TYPE:', typeof data);

        // Check if the API returned an error (0 means invalid credentials)
        if (data === 0 || data === '0' || data === null || data === false) {
          console.log(
            '❌ STUDENT LOGIN: API returned invalid credentials (data is 0/null/false)'
          );
          return null;
        }

        // Check if the response has an error field
        if (data && data.error) {
          console.log(
            '❌ STUDENT LOGIN: API returned error in response body:',
            data.error
          );
          return null;
        }

        // Check if the response indicates invalid credentials or failure
        if (
          data &&
          (data.message === 'Invalid credentials' ||
            data.status === 'error' ||
            data.success === false ||
            !data.success)
        ) {
          console.log(
            '❌ STUDENT LOGIN: API returned invalid credentials or failed authentication'
          );
          return null;
        }

        // Validate that we have the expected response structure
        if (!data.auth_code || !data.user_id || !data.user_name) {
          console.log(
            '❌ STUDENT LOGIN: API response missing required fields (auth_code, user_id, user_name)'
          );
          return null;
        }

        console.log('✅ STUDENT LOGIN: Valid credentials, detecting school...');

        // Skip school detection for now to prevent login hanging
        console.log(
          '⏭️ STUDENT LOGIN: Skipping school detection to prevent hanging'
        );

        // Use default school configuration
        try {
          const defaultSchoolConfig = {
            schoolId: 'default',
            name: 'Default School',
            domain: 'default.edu',
            hasGoogleWorkspace: false,
          };
          await SchoolConfigService.saveCurrentSchoolConfig(
            defaultSchoolConfig
          );
          console.log('🏫 STUDENT LOGIN: Default school configuration saved');
        } catch (schoolError) {
          console.error(
            '❌ STUDENT LOGIN: Failed to save default school config:',
            schoolError
          );
          // Continue with login even if school config fails
        }

        // Transform API response to match expected user data format
        const transformedUserData = {
          // Core user information
          id: data.user_id,
          username: data.username || username,
          name: data.user_name,
          email: data.email,
          authCode: data.auth_code,
          userType: 'student', // For backward compatibility with existing code
          mobile_phone: data.mobile_phone,
          photo: data.photo,

          // Student-specific information
          is_student: true,
          student_id: data.student_details?.student_id,
          grade: data.student_details?.grade,
          class: data.student_details?.class,
          section: data.student_details?.section,

          // Branch information
          branch: data.branch,
          branches: data.accessible_branches || [data.branch],
          accessible_branches: data.accessible_branches,

          // Roles and permissions (if any for students)
          roles: data.roles || [],

          // Original API response for reference
          originalResponse: data,
        };

        return transformedUserData;
      } else {
        console.log(
          '❌ STUDENT LOGIN: API returned non-200 status:',
          response.status
        );
        return null;
      }
    } catch (error) {
      console.error('❌ STUDENT LOGIN ERROR:', error);
      console.error('🔍 Error message:', error.message);
      console.error('📊 Error code:', error.code);
      console.error('🌐 Network error:', error.name);
      console.error('📱 Device info available:', !!deviceInfo);
      console.error('🔑 Device token available:', !!deviceToken);
      console.error('🔗 API URL:', apiUrl);

      // Check if this is a timeout error
      if (error.name === 'AbortError') {
        console.error('⏰ STUDENT LOGIN: Request was aborted (likely timeout)');
        console.error(`⏰ Timeout was set to: ${authTimeout}ms`);
        return {
          error: true,
          errorType: 'TimeoutError',
          errorMessage: `Authentication request timed out after ${
            authTimeout / 1000
          } seconds. Please check your internet connection and try again.`,
          errorCode: 'TIMEOUT',
          timestamp: new Date().toISOString(),
        };
      }

      // Return error details for debugging
      return {
        error: true,
        errorType: error.name || 'NetworkError',
        errorMessage: error.message || 'Unknown error',
        errorCode: error.code,
        timestamp: new Date().toISOString(),
      };
    }
  }
};

/**
 * Unified login function that handles both student and parent authentication
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @param {string} deviceToken - Firebase device token
 * @param {string} deviceType - Device type (default: 'ios')
 * @param {string} deviceName - Device name (default: 'Mobile Device')
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - User data or null if login fails
 */
export const unifiedLogin = async (
  username,
  password,
  deviceToken,
  deviceType = 'ios',
  deviceName = 'Mobile Device',
  options = {}
) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Check for demo mode credentials first
  if (isDemoCredentials(username, password, 'student')) {
    console.log('🎭 DEMO MODE: Student login detected via unified login');

    // Set up demo school configuration
    try {
      const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
        username,
        'student'
      );
      await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
      console.log(
        '🏫 DEMO MODE: School configuration saved:',
        schoolConfig.name
      );
    } catch (schoolError) {
      console.error('❌ DEMO MODE: School detection error:', schoolError);
    }

    const demoData = getDemoUserData('student');
    return demoData;
  }

  if (USE_DUMMY_DATA) {
    // Try to find student first
    const student = findStudent(username, password);
    if (student) {
      return student;
    }

    // If not found as student, could add parent dummy data logic here
    return null;
  } else {
    try {
      // Use the unified login endpoint that handles both students and parents
      console.log('🔍 UNIFIED LOGIN: Using /mobile-api/login/ endpoint');

      // Get device information
      const deviceInfo = await getLoginDeviceInfo();
      console.log('🔍 UNIFIED LOGIN: Device info collected:', deviceInfo);

      // Prepare device token
      let finalToken = deviceToken;
      if (typeof deviceToken !== 'string') {
        finalToken = String(deviceToken);
      }
      if (finalToken.includes('Future') || finalToken.includes('Instance')) {
        console.warn(
          '⚠️ UNIFIED LOGIN: Invalid token detected, using empty token'
        );
        finalToken = '';
      }

      // Prepare request body for POST
      const requestBody = {
        username,
        password,
        deviceType: deviceInfo.deviceType,
        deviceToken: finalToken,
        deviceName: deviceInfo.deviceName,
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        isEmulator: deviceInfo.isEmulator,
      };

      const apiUrl = buildApiUrl(Config.API_ENDPOINTS.UNIFIED_LOGIN);
      console.log('🔍 UNIFIED LOGIN: API URL:', apiUrl);
      console.log('🔍 UNIFIED LOGIN: Request body:', {
        username: requestBody.username,
        password: '[HIDDEN]',
        deviceType: requestBody.deviceType,
        deviceName: requestBody.deviceName,
        hasToken: !!requestBody.deviceToken,
      });

      // Add timeout and better error handling
      const controller = new AbortController();
      const authTimeout = Config.NETWORK.AUTH_TIMEOUT || Config.NETWORK.TIMEOUT;
      const timeoutId = setTimeout(() => {
        console.error(
          `⏰ UNIFIED LOGIN: Request timed out after ${authTimeout}ms`
        );
        controller.abort();
      }, authTimeout);

      const response = await fetch(apiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();

        console.log('🔍 UNIFIED LOGIN API RESPONSE:', data);
        console.log('🔍 UNIFIED LOGIN API RESPONSE TYPE:', typeof data);

        // Check if the API returned an error
        if (data === 0 || data === '0' || data === null || data === false) {
          console.log('❌ UNIFIED LOGIN: API returned invalid credentials');
          return null;
        }

        if (data && data.error) {
          console.log('❌ UNIFIED LOGIN: API returned error:', data.error);
          return null;
        }

        // Validate response structure
        if (!data.auth_code || !data.user_id || !data.user_name) {
          console.log('❌ UNIFIED LOGIN: API response missing required fields');
          return null;
        }

        // Detect user type from API response
        const userType =
          data.user_type || (data.is_student ? 'student' : 'parent');
        console.log('🔍 UNIFIED LOGIN: Detected user type:', userType);

        // Set up school configuration
        try {
          const schoolConfig = await SchoolConfigService.detectSchoolFromLogin(
            username,
            userType
          );
          await SchoolConfigService.saveCurrentSchoolConfig(schoolConfig);
          console.log(
            '🏫 UNIFIED LOGIN: School configuration saved:',
            schoolConfig.name
          );
        } catch (schoolError) {
          console.error(
            '❌ UNIFIED LOGIN: School detection error:',
            schoolError
          );
        }

        // Transform API response to match expected user data format
        const transformedUserData = {
          // Core user information
          id: data.user_id,
          username: data.username || username,
          name: data.user_name,
          email: data.email,
          authCode: data.auth_code,
          userType: userType,
          mobile_phone: data.mobile_phone,
          photo: data.photo,

          // Branch information
          branch: data.branch,
          branches: data.accessible_branches || [data.branch],
          accessible_branches: data.accessible_branches,

          // User-specific information
          is_student: data.is_student || userType === 'student',
          is_parent: data.is_parent || userType === 'parent',

          // Student-specific information (if applicable)
          student_id: data.student_details?.student_id,
          grade: data.student_details?.grade,
          class: data.student_details?.class,
          section: data.student_details?.section,

          // Parent-specific information (if applicable)
          children: data.children || [],

          // Academic information
          academic_info: data.academic_info,

          // Roles and permissions
          roles: data.roles || [],

          // Original API response for reference
          originalResponse: data,
        };

        console.log('🔍 UNIFIED LOGIN: Transformed user data:', {
          id: transformedUserData.id,
          name: transformedUserData.name,
          userType: transformedUserData.userType,
          authCode: transformedUserData.authCode ? '[PRESENT]' : '[MISSING]',
          hasChildren: transformedUserData.children?.length > 0,
        });

        return transformedUserData;
      } else {
        console.log(
          '❌ UNIFIED LOGIN: API returned non-200 status:',
          response.status
        );
        return null;
      }
    } catch (error) {
      console.error('❌ UNIFIED LOGIN: Error during login:', error);
      return null;
    }
  }
};

/**
 * Get user data from AsyncStorage, trying user-type-specific key first
 * @param {string} userType - The type of user (teacher, parent, student)
 * @param {Object} AsyncStorage - AsyncStorage instance
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUserData = async (userType, AsyncStorage) => {
  try {
    // First try user-type-specific key
    const storageKey = getUserDataStorageKey(userType);
    let userData = await AsyncStorage.getItem(storageKey);
    let actualStorageKey = storageKey;

    // If not found, try generic key for backward compatibility
    if (!userData) {
      userData = await AsyncStorage.getItem('userData');
      actualStorageKey = 'userData';
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('✅ AUTH: userData retrieved from AsyncStorage:', {
        userType: parsed.userType,
        username: parsed.username,
        hasAuthCode: !!(parsed.authCode || parsed.auth_code),
        storageKey: actualStorageKey,
        requestedUserType: userType,
      });
      return parsed;
    }

    console.log(
      `ℹ️ AUTH: No userData found for ${userType} (checked ${storageKey} and userData)`
    );
    return null;
  } catch (error) {
    console.error('❌ AUTH: Failed to get userData:', error);
    return null;
  }
};

/**
 * Get all logged-in users from AsyncStorage
 * @param {Object} AsyncStorage - AsyncStorage instance
 * @returns {Promise<Object>} - Object with user types as keys and user data as values
 */
export const getAllLoggedInUsers = async (AsyncStorage) => {
  try {
    const users = {};
    const userTypes = ['teacher', 'parent', 'student'];

    for (const userType of userTypes) {
      const userData = await getUserData(userType, AsyncStorage);
      if (userData) {
        users[userType] = userData;
      }
    }

    console.log('📊 AUTH: Found logged-in users:', Object.keys(users));
    return users;
  } catch (error) {
    console.error('❌ AUTH: Failed to get all logged-in users:', error);
    return {};
  }
};

/**
 * Get the most recently active user (from generic userData key)
 * @param {Object} AsyncStorage - AsyncStorage instance
 * @returns {Promise<Object|null>} - Most recent user data or null
 */
export const getMostRecentUser = async (AsyncStorage) => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('📱 AUTH: Most recent user:', {
        userType: parsed.userType,
        username: parsed.username,
      });
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('❌ AUTH: Failed to get most recent user:', error);
    return null;
  }
};

/**
 * Save user data to AsyncStorage using user-type-specific storage key
 * @param {Object} userData - User data to save
 * @param {Object} AsyncStorage - AsyncStorage instance
 * @returns {Promise<boolean>} - Success status
 */
export const saveUserData = async (userData, AsyncStorage) => {
  try {
    const userDataString = JSON.stringify(userData);
    const storageKey = getUserDataStorageKey(userData.userType);

    // Save to user-type-specific key
    await AsyncStorage.setItem(storageKey, userDataString);

    // Smart handling of generic 'userData' key to prevent overwriting other user types
    let shouldUpdateGenericKey = true;

    try {
      const existingGenericData = await AsyncStorage.getItem('userData');
      if (existingGenericData) {
        const existingParsed = JSON.parse(existingGenericData);

        // Don't overwrite if it's a different user type
        if (
          existingParsed.userType &&
          existingParsed.userType !== userData.userType
        ) {
          console.log(
            `🔒 AUTH: Preserving existing ${existingParsed.userType} data in generic key, not overwriting with ${userData.userType} data`
          );
          shouldUpdateGenericKey = false;
        }
      }
    } catch (parseError) {
      console.warn(
        '⚠️ AUTH: Error parsing existing userData, will overwrite:',
        parseError
      );
      // If we can't parse existing data, it's safe to overwrite
      shouldUpdateGenericKey = true;
    }

    // Only update generic key if it's safe to do so
    if (shouldUpdateGenericKey) {
      await AsyncStorage.setItem('userData', userDataString);
      console.log(
        `✅ AUTH: Updated generic 'userData' key with ${userData.userType} data`
      );
    } else {
      console.log(
        `ℹ️ AUTH: Skipped updating generic 'userData' key to preserve existing user session`
      );
    }

    console.log('✅ AUTH: userData saved to AsyncStorage:', {
      userType: userData.userType,
      username: userData.username,
      hasAuthCode: !!userData.authCode,
      dataLength: userDataString.length,
      storageKey: storageKey,
      updatedGenericKey: shouldUpdateGenericKey,
    });
    return true;
  } catch (error) {
    console.error('❌ AUTH: Failed to save userData:', error);
    return false;
  }
};

/**
 * Get demo mode credentials for display purposes
 * @returns {Object} Demo credentials object
 */
export const getDemoCredentials = () => {
  return {
    teacher: {
      username: DEMO_CREDENTIALS.TEACHER.username,
      password: DEMO_CREDENTIALS.TEACHER.password,
      description: 'Full teacher access with all features',
    },
    student: {
      username: DEMO_CREDENTIALS.STUDENT.username,
      password: DEMO_CREDENTIALS.STUDENT.password,
      description: 'Student view with grades, attendance, and homework',
    },
    parent: {
      username: DEMO_CREDENTIALS.PARENT.username,
      password: DEMO_CREDENTIALS.PARENT.password,
      description: 'Parent dashboard with child monitoring features',
    },
  };
};

/**
 * Check if user is in demo mode
 * @param {Object} userData - User data object
 * @returns {boolean} True if user is in demo mode
 */
export const isDemoMode = (userData) => {
  return userData && userData.demo_mode === true;
};

/**
 * Validate authentication response structure
 * @param {Object} data - API response data
 * @returns {boolean} True if response has valid structure
 */
export const validateAuthResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for error conditions
  if (data === 0 || data === '0' || data === null || data === false) {
    return false;
  }

  if (data.error || data.success === false || !data.success) {
    return false;
  }

  if (data.message === 'Invalid credentials' || data.status === 'error') {
    return false;
  }

  // Check for required fields
  if (!data.auth_code || !data.user_id || !data.user_name) {
    return false;
  }

  return true;
};

/**
 * Transform API authentication response to standardized user data format
 * @param {Object} apiResponse - Raw API response
 * @param {string} username - Username used for login
 * @param {string} userType - Type of user ('teacher', 'student', 'staff')
 * @returns {Object} Transformed user data
 */
export const transformAuthResponse = (
  apiResponse,
  username,
  userType = 'staff'
) => {
  const data = apiResponse;

  const baseUserData = {
    // Core user information
    id: data.user_id,
    username: data.username || username,
    name: data.user_name,
    email: data.email,
    authCode: data.auth_code,
    userType: userType,
    mobile_phone: data.mobile_phone,
    photo: data.photo,

    // Branch information
    branch: data.branch,
    branches: data.accessible_branches || [data.branch],
    accessible_branches: data.accessible_branches,

    // Roles and permissions
    roles: data.roles || [],

    // Original API response for reference
    originalResponse: data,
  };

  // Add user-type specific information
  if (userType === 'teacher' || userType === 'staff') {
    return {
      ...baseUserData,
      // Staff/Teacher-specific information
      is_teacher: true,
      is_staff: true,
      role: data.staff_details?.profession_position || 'Staff Member',
      staff_category_id: data.staff_details?.staff_category_id,
      staff_category_name: data.staff_details?.staff_category_name,
      profession_position: data.staff_details?.profession_position,
    };
  } else if (userType === 'student') {
    return {
      ...baseUserData,
      // Student-specific information
      is_student: true,
      student_id: data.student_details?.student_id,
      grade: data.student_details?.grade,
      class: data.student_details?.class,
      section: data.student_details?.section,
    };
  }

  return baseUserData;
};

/**
 * Log authentication response for debugging
 * @param {Object} response - API response
 * @param {string} userType - Type of user attempting login
 * @param {string} username - Username used for login
 */
export const logAuthResponse = (response, userType, username) => {
  console.log(`🔍 ${userType.toUpperCase()} LOGIN API RESPONSE:`, {
    success: response?.success,
    message: response?.message,
    user_id: response?.user_id,
    user_name: response?.user_name,
    user_type: response?.user_type,
    auth_code: response?.auth_code ? '[PRESENT]' : '[MISSING]',
    branch: response?.branch?.branch_name,
    roles_count: response?.roles?.length || 0,
    accessible_branches_count: response?.accessible_branches?.length || 0,
    staff_details: response?.staff_details ? '[PRESENT]' : '[MISSING]',
    student_details: response?.student_details ? '[PRESENT]' : '[MISSING]',
    username: username,
    timestamp: new Date().toISOString(),
  });
};
