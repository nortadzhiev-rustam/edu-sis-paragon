/**
 * Staff Service
 * Handles new staff/teacher API endpoints as per TEACHER_STAFF_API.md
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from './authService';

// Helper function to get auth code from storage (supports user-type-specific storage)
const getAuthCode = async () => {
  try {
    // Try user-type-specific storage keys first
    const userTypes = ['teacher', 'parent', 'student'];
    for (const userType of userTypes) {
      const userData = await getUserData(userType, AsyncStorage);
      if (userData) {
        const authCode = userData.authCode || userData.auth_code;
        if (authCode) {
          console.log(`👥 STAFF SERVICE: Using ${userType} auth code`);
          return authCode;
        }
      }
    }

    // Fallback to generic userData for backward compatibility
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const authCode = user.authCode || user.auth_code;
      if (authCode) {
        console.log('👥 STAFF SERVICE: Using generic auth code');
        return authCode;
      }
    }
    return null;
  } catch (error) {
    console.error('👥 STAFF SERVICE: Error getting auth code:', error);
    return null;
  }
};

/**
 * Staff Login (New API endpoint)
 * @param {string} username - Staff username
 * @param {string} password - Staff password
 * @param {string} deviceToken - Device push token
 * @param {string} deviceType - Device type (ios/android)
 * @returns {Promise<Object>} - Login response
 */
export const staffLogin = async (
  username,
  password,
  deviceToken,
  deviceType = 'ios'
) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_LOGIN);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        deviceToken,
        deviceType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Staff login error:', error);
    throw error;
  }
};

/**
 * Get Staff Dashboard
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Dashboard data
 */
export const getStaffDashboard = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_DASHBOARD, {
      authCode: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    throw error;
  }
};

/**
 * Get Staff Timetable (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @param {string} date - Optional specific date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Timetable data
 */
export const getStaffTimetable = async (authCode = null, date = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const params = { authCode: auth };
    if (date) {
      params.date = date;
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_TIMETABLE, params);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching staff timetable:', error);
    throw error;
  }
};

/**
 * Store Class Attendance (New API endpoint)
 * @param {Object} attendanceData - Attendance data
 * @param {number} attendanceData.timetable - Timetable ID
 * @param {Array} attendanceData.attendance - Array of student attendance records
 * @param {string} attendanceData.topic - Class topic
 * @returns {Promise<Object>} - Response data
 */
export const storeClassAttendance = async (attendanceData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.STORE_ATTENDANCE);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error storing class attendance:', error);
    throw error;
  }
};

/**
 * Get Teacher Classes for Attendance (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Classes data
 */
export const getTeacherClassesForAttendance = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_CLASSES_ATTENDANCE, {
      auth_code: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching teacher classes for attendance:', error);
    throw error;
  }
};

/**
 * Store BPS Record (New API endpoint)
 * @param {Object} bpsData - BPS data
 * @param {string} bpsData.authCode - Staff authentication code
 * @param {Array} bpsData.records - Array of BPS records
 * @returns {Promise<Object>} - Response data
 */
export const storeBPSRecord = async (bpsData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_BPS_STORE);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bpsData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error storing BPS record:', error);
    throw error;
  }
};

/**
 * Get BPS Items (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - BPS items data
 */
export const getBPSItems = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_BPS_ITEMS, {
      authCode: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching BPS items:', error);
    throw error;
  }
};

/**
 * Create Homework Assignment (New API endpoint)
 * @param {Object} homeworkData - Homework assignment data
 * @returns {Promise<Object>} - Response data
 */
export const createHomeworkAssignment = async (homeworkData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEWORK_CREATE);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(homeworkData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating homework assignment:', error);
    throw error;
  }
};

/**
 * Get Teacher Homework Classes (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Classes data
 */
export const getTeacherHomeworkClasses = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.TEACHER_HOMEWORK_CLASSES, {
      auth_code: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching teacher homework classes:', error);
    throw error;
  }
};

/**
 * Grade Homework Submissions (New API endpoint)
 * @param {Object} gradeData - Grading data
 * @returns {Promise<Object>} - Response data
 */
export const gradeHomeworkSubmission = async (gradeData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEWORK_GRADE);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error grading homework submission:', error);
    throw error;
  }
};

/**
 * Get Homeroom Classrooms (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Classrooms data
 */
export const getHomeroomClassrooms = async (authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEROOM_CLASSROOMS, {
      auth_code: auth,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching homeroom classrooms:', error);
    throw error;
  }
};

/**
 * Get Homeroom Students (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @param {number} classroomId - Classroom ID
 * @returns {Promise<Object>} - Students data
 */
export const getHomeroomStudents = async (classroomId, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    if (!classroomId) {
      throw new Error('Classroom ID is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEROOM_STUDENTS, {
      auth_code: auth,
      classroom_id: classroomId,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching homeroom students:', error);
    throw error;
  }
};

/**
 * Get Homeroom Attendance (New API endpoint)
 * @param {number} classroomId - Classroom ID
 * @param {string} authCode - Staff authentication code
 * @param {string} date - Optional date (defaults to today)
 * @returns {Promise<Object>} - Attendance data
 */
export const getHomeroomAttendance = async (
  classroomId,
  authCode = null,
  date = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    if (!classroomId) {
      throw new Error('Classroom ID is required');
    }

    const params = {
      auth_code: auth,
      classroom_id: classroomId,
    };

    if (date) {
      params.date = date;
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEROOM_ATTENDANCE, params);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching homeroom attendance:', error);
    throw error;
  }
};

/**
 * Get Homeroom Student Profile (New API endpoint)
 * @param {number} studentId - Student ID
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Student profile data
 */
export const getHomeroomStudentProfile = async (studentId, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.HOMEROOM_STUDENT_PROFILE, {
      auth_code: auth,
      student_id: studentId,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching homeroom student profile:', error);
    throw error;
  }
};

/**
 * Send Notification to Students (New API endpoint)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Response data
 */
export const sendNotificationToStudents = async (notificationData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.NOTIFICATIONS_SEND);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending notification to students:', error);
    throw error;
  }
};

/**
 * Send Broadcast Notification (New API endpoint)
 * @param {Object} broadcastData - Broadcast notification data
 * @returns {Promise<Object>} - Response data
 */
export const sendBroadcastNotification = async (broadcastData) => {
  try {
    const url = buildApiUrl(Config.API_ENDPOINTS.NOTIFICATIONS_BROADCAST);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(broadcastData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    throw error;
  }
};

/**
 * Staff Pickup: Get Pickup Requests
 * @param {string|null} authCode
 * @param {Object} options
 * @param {string|null} options.date - YYYY-MM-DD
 * @param {('waiting'|'completed'|null)} options.status
 */
export const getStaffPickupRequests = async (
  authCode = null,
  { date = null, status = null } = {}
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) throw new Error('No authentication code found');

    console.log('📋 STAFF SERVICE: Fetching pickup requests with params:', {
      authCode: auth ? auth.substring(0, 8) + '...' : 'null',
      date,
      status,
    });

    const params = { authCode: auth };
    if (date) params.date = date;
    if (status) params.status = status;

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_PICKUP_REQUESTS, params);
    console.log('📋 STAFF SERVICE: Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('📋 STAFF SERVICE: Response status:', response.status);
    console.log('📋 STAFF SERVICE: Response headers:', response.headers);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response text first to debug
    const responseText = await response.text();
    console.log('📋 STAFF SERVICE: Raw response text:', responseText);
    console.log('📋 STAFF SERVICE: Response text type:', typeof responseText);

    // Try to parse as JSON
    if (!responseText || responseText.trim() === '') {
      console.warn('⚠️ STAFF SERVICE: Empty response received');
      return {
        success: false,
        message: 'Empty response from server',
        requests: [],
      };
    }

    try {
      const jsonData = JSON.parse(responseText);
      console.log('📋 STAFF SERVICE: Parsed JSON data:', jsonData);
      return jsonData;
    } catch (parseError) {
      console.error('📋 STAFF SERVICE: JSON parse error:', parseError);
      console.log('📋 STAFF SERVICE: Attempting text response parsing...');

      // Try to parse as text response (like "ok|message" format)
      const { parseApiTextResponse } = await import('../utils/apiHelpers');
      const parsedResponse = parseApiTextResponse(responseText);
      console.log('📋 STAFF SERVICE: Parsed text response:', parsedResponse);

      return {
        ...parsedResponse,
        requests: [], // Ensure requests array exists
      };
    }
  } catch (error) {
    console.error(
      '❌ STAFF SERVICE: Error fetching staff pickup requests:',
      error
    );
    throw error;
  }
};

/**
 * Staff Pickup: Scan Guardian QR
 * @param {string|null} authCode
 * @param {string} qr_token
 */
export const staffPickupScanQr = async (qr_token, authCode = null) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) throw new Error('No authentication code found');
    if (!qr_token) throw new Error('QR token is required');

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_PICKUP_SCAN_QR);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authCode: auth, qr_token }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error scanning guardian QR:', error);
    throw error;
  }
};

/**
 * Staff Pickup: Process Pickup
 * @param {Object} data
 * @param {string|null} data.authCode
 * @param {number} data.guardian_card_id
 * @param {number} data.request_id
 * @param {string|null} data.staff_notes
 */
export const staffPickupProcess = async ({
  authCode = null,
  guardian_card_id,
  request_id,
  staff_notes = null,
}) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) throw new Error('No authentication code found');
    if (!guardian_card_id) throw new Error('guardian_card_id is required');
    if (!request_id) throw new Error('request_id is required');

    const url = buildApiUrl(Config.API_ENDPOINTS.STAFF_PICKUP_PROCESS);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode: auth,
        guardian_card_id,
        request_id,
        staff_notes,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error processing pickup:', error);
    throw error;
  }
};
