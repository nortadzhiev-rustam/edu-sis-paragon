// Environment configuration
// Centralized configuration for the entire application

// API Configuration
export const Config = {
  // Base API Configuration
  // For physical devices, use your computer's IP address instead of 127.0.0.1
  // Your Mac's IP address: 192.168.10.2
  API_BASE_URL: 'http://192.168.10.2:8001/mobile-api',
  API_DOMAIN: 'http://192.168.10.2:8001',

  // API Endpoints
  API_ENDPOINTS: {
    // Authentication Endpoints
    UNIFIED_LOGIN: '/login',
    STAFF_LOGIN: '/auth/staff/login',
    CHECK_STAFF_CREDENTIALS: '/check-staff-credentials',
    CHECK_STUDENT_CREDENTIALS: '/check-student-credentials',
    CHECK_PARENT_CREDENTIALS: '/check-parent-credentials',
    GET_STUDENT_TIMETABLE: '/get-student-timetable2',
    GET_TEACHER_TIMETABLE: '/get-teacher-timetable-data/',
    GET_STUDENT_GRADES: '/get-student-grades',
    GET_STUDENT_ATTENDANCE: '/get-student-attendance-data',
    GET_STUDENT_HOMEWORK: '/get-student-homework-data',
    GET_STUDENT_BPS: '/get-student-bps-data',
    GET_TEACHER_BPS: '/get-teacher-bps-data/',
    GET_ATTENDANCE_DETAILS: '/get-attendance-details/',
    GET_CLASS_STUDENTS: '/get-class-students/',
    GET_CLASS_STUDENTS_FOR_BPS: '/get-class-students-for-bps/',
    TAKE_ATTENDANCE: '/attendance/api-store',
    UPDATE_ATTENDANCE: '/update-attendance/',
    STORE_BPS: '/discipline/store-bps',
    DELETE_BPS: '/discipline/delete-bps',
    GET_TEACHER_CLASSES: '/teacher/attendance/classes',
    // Notification API Endpoints
    GET_NOTIFICATIONS_LEGACY: '/get-notifications/',
    GET_NOTIFICATIONS: '/notifications/list',
    MARK_NOTIFICATION_READ: '/notifications/mark-read',
    MARK_ALL_NOTIFICATIONS_READ: '/notifications/mark-all-read',
    GET_NOTIFICATION_CATEGORIES: '/notifications/categories',
    SEND_NOTIFICATION: '/notifications/send',
    GET_NOTIFICATION_STATISTICS: '/notifications/statistics',

    // Real-time Notification Endpoints
    SEND_BPS_NOTIFICATION: '/notifications/realtime/bps',
    SEND_ATTENDANCE_REMINDER: '/notifications/realtime/attendance-reminder',
    SEND_RICH_NOTIFICATION: '/notifications/realtime/rich',
    SEND_STAFF_NOTIFICATION: '/notifications/realtime/staff',

    // Homeroom API Endpoints
    GET_HOMEROOM_CLASSROOMS: '/homeroom/classrooms',
    GET_HOMEROOM_ATTENDANCE: '/homeroom/attendance',
    GET_HOMEROOM_STUDENT_PROFILE: '/homeroom/student-profile',
    GET_HOMEROOM_STUDENTS: '/homeroom/students',
    GET_HOMEROOM_DISCIPLINE: '/homeroom/discipline',

    // Messaging API Endpoints
    GET_CONVERSATIONS: '/messaging/conversations',
    GET_CONVERSATION_MESSAGES: '/messaging/conversation/messages',
    GET_CONVERSATION_MEMBERS: '/messaging/conversation/members',
    SEND_MESSAGE: '/messaging/send-message',
    CREATE_CONVERSATION: '/messaging/create-conversation',
    GET_AVAILABLE_USERS: '/messaging/available-users', // Legacy endpoint (deprecated)
    GET_AVAILABLE_USERS_STUDENT: '/messaging/available-users/student', // Student-specific endpoint
    GET_AVAILABLE_USERS_STAFF: '/messaging/available-users/staff', // Staff-specific endpoint
    GET_AVAILABLE_USERS_PARENT: '/messaging/available-users/parent', // Parent-specific endpoint
    SEARCH_MESSAGES: '/messaging/search',
    MARK_MESSAGES_READ: '/messaging/mark-read',
    MARK_MESSAGE_READ: '/messaging/mark-message-read', // NEW: Individual message read endpoint
    UPLOAD_MESSAGE_ATTACHMENT: '/messaging/upload-attachment',
    DELETE_CONVERSATION: '/messaging/conversation/delete',
    LEAVE_CONVERSATION: '/messaging/conversation/leave',
    DELETE_MESSAGE: '/messaging/message/delete',

    // Health API Endpoints
    GET_STUDENT_HEALTH_RECORDS: '/health/student/records',
    GET_STUDENT_HEALTH_INFO: '/health/student/info',
    GET_TEACHER_HEALTH_DATA: '/health/teacher/data',
    CREATE_STUDENT_HEALTH_RECORD: '/health/student/create-record',
    CREATE_STAFF_HEALTH_RECORD: '/health/staff/create-record',
    CREATE_GUEST_HEALTH_RECORD: '/health/guest/create-record',
    UPDATE_STUDENT_HEALTH_INFO: '/health/student/update-info',
    DELETE_HEALTH_RECORD: '/health/delete-record',
    GET_STAFF_HEALTH_RECORDS: '/health/staff/records',
    GET_HOMEROOM_STUDENTS_HEALTH_INFO: '/health/homeroom/students-info',
    GET_HEALTH_LOOKUP_DATA: '/health/lookup-data',
    GET_STUDENT_HEALTH_LEGACY: '/get-student-health/',
    SEND_HEALTH_NOTIFICATION: '/notifications/health/send',
    SEND_EMERGENCY_HEALTH_ALERT: '/notifications/health/emergency',
    SEND_HEALTH_REMINDER: '/notifications/health/reminder',

    // Logout API Endpoints
    REMOVE_USER_FROM_DEVICE: '/remove-user-from-device/',

    // Branch Selection API Endpoints
    SWITCH_BRANCH: '/switch-branch/',
    GET_CURRENT_BRANCH: '/get-current-branch/',

    // Information Data API Endpoints
    GET_ABOUT_DATA: '/about-data/',
    GET_CONTACTS_DATA: '/contacts-data/',
    GET_FAQ_DATA: '/faq-data/',

    // Profile API Endpoints
    GET_PROFILE: '/profile/',
    UPDATE_PROFILE: '/profile/update',
    UPLOAD_PROFILE_PHOTO: '/profile/upload-photo',
    CHANGE_PASSWORD: '/profile/change-password',
    GET_PROFILE_COMPLETENESS: '/profile/completeness',

    // Guardian Pickup API Endpoints
    CREATE_GUARDIAN: '/pickup/guardians/create',
    LIST_GUARDIANS: '/pickup/guardians/list',
    UPDATE_GUARDIAN_PROFILE: '/guardian/complete-profile',
    ROTATE_QR_TOKEN: '/pickup/guardians/rotate-qr',
    QR_LOGIN: '/pickup/qr/login',
    DEACTIVATE_GUARDIAN: '/guardians/deactivate',
    DELETE_GUARDIAN: '/pickup/guardians/delete',
    REACTIVATE_GUARDIAN: '/pickup/guardians/reactivate',

    // Pickup Request API Endpoints
    CREATE_PICKUP_REQUEST: '/pickup-request/',
    PARENT_CREATE_PICKUP_REQUEST: '/pickup-request/',
    PARENT_CREATE_MULTIPLE_PICKUP_REQUESTS: '/pickup-request/multiple',
    GUARDIAN_CREATE_PICKUP_REQUEST: '/pickup-request/',
    GET_SCHOOL_LOCATION: '/school/location',
    PARENT_GENERATE_QR: '/pickup/parent/generate-qr',
    GET_PENDING_PICKUP_REQUESTS: '/pickup/parent/pending-requests',

    // Pickup History API Endpoints
    PARENT_PICKUP_HISTORY: '/pickup/parent/history',
    GUARDIAN_PICKUP_HISTORY: '/guardian/pickup-history',

    // Staff Pickup API Endpoints
    STAFF_PICKUP_REQUESTS: '/staff/pickup/requests',
    STAFF_PICKUP_SCAN_QR: '/staff/pickup/scan-qr',
    STAFF_PICKUP_PROCESS: '/staff/pickup/process',

    // Parent Proxy API Endpoints (Parent-Student Access System)
    GET_PARENT_CHILDREN: '/parent/children/',
    PARENT_STUDENT_TIMETABLE: '/parent/student/timetable',
    PARENT_STUDENT_HOMEWORK: '/parent/student/homework',
    PARENT_STUDENT_ATTENDANCE: '/parent/student/attendance',
    PARENT_STUDENT_GRADES: '/parent/student/grades',
    PARENT_STUDENT_ASSESSMENT: '/parent/student/assessment',
    PARENT_STUDENT_BPS_PROFILE: '/parent/student/bps-profile',
    PARENT_STUDENT_HEALTH_INFO: '/parent/student/health-info',
    PARENT_STUDENT_HEALTH_RECORDS: '/parent/student/health-records',
    PARENT_STUDENT_LIBRARY: '/parent/student/library',

    // Parent Calendar API Endpoints
    PARENT_CALENDAR_DATA: '/parent/calendar/data',
    PARENT_CALENDAR_UPCOMING: '/parent/calendar/upcoming',
    PARENT_CALENDAR_PERSONAL: '/parent/calendar/personal',

    // Calendar API Endpoints
    GET_CALENDAR_DATA: '/calendar/data',
    GET_CALENDAR_PERSONAL: '/calendar/personal',
    GET_CALENDAR_UPCOMING: '/calendar/upcoming',
    GET_CALENDAR_MONTHLY: '/calendar/monthly',

    // Workspace API Endpoints
    GET_WORKSPACE_STRUCTURE: '/workspace/structure',
    GET_FOLDER_CONTENTS: '/workspace/folder-contents',
    UPLOAD_WORKSPACE_FILE: '/workspace/upload-file',
    CREATE_WORKSPACE_FOLDER: '/workspace/create-folder',
    SEARCH_WORKSPACE_FILES: '/workspace/search',
    GET_RECENT_WORKSPACE_FILES: '/workspace/recent-files',
    GET_WORKSPACE_STATISTICS: '/workspace/statistics',
    DELETE_WORKSPACE_ITEM: '/workspace/delete-item',

    // Homework Assignment API Endpoints (Primary - Teachers)
    GET_TEACHER_HOMEWORK_LIST: '/teacher/homework/list',
    GET_TEACHER_HOMEWORK_DETAILS: '/teacher/homework/details',
    CREATE_HOMEWORK_ASSIGNMENT: '/teacher/homework/create',
    CLOSE_HOMEWORK_ASSIGNMENT: '/teacher/homework/close',
    PROVIDE_HOMEWORK_FEEDBACK: '/teacher/homework/feedback',
    // Homework Submission API Endpoints (Primary - Students)
    MARK_HOMEWORK_VIEWED: '/homework/mark-viewed',
    SUBMIT_HOMEWORK: '/homework/submit',
    MARK_HOMEWORK_DONE: '/homework/mark-done',
    UPLOAD_HOMEWORK_FILE: '/homework/upload-file',
    UPDATE_HOMEWORK_SUBMISSION: '/homework/update-submission',

    // Homework Folder API Endpoints (For Materials/Resources)
    CREATE_HOMEWORK_FOLDER: '/homework/folder/create',
    UPLOAD_HOMEWORK_FOLDER_FILE: '/homework/folder/upload-file',
    GET_TEACHER_HOMEWORK_FOLDERS: '/homework/folder/teacher/list',
    GET_TEACHER_HOMEWORK_FOLDERS_SIMPLE: '/homework/folder/teacher/list-simple',
    GET_STUDENT_HOMEWORK_FOLDERS: '/homework/folder/student/list',
    GET_HOMEWORK_FOLDER_FILES: '/homework/folder/files',
    SUBMIT_HOMEWORK_FOLDER: '/homework/submission/upload',
    GET_HOMEWORK_SUBMISSIONS: '/homework/submission/list',
    GET_TEACHER_HOMEWORK_CLASSES: '/teacher/homework/classes',

    // Reports API Endpoints
    GET_AVAILABLE_REPORTS: '/reports/available',
    // Student Reports
    GET_STUDENT_ATTENDANCE_REPORT: '/reports/student/attendance',
    GET_STUDENT_GRADES_REPORT: '/reports/student/grades',
    GET_STUDENT_BPS_REPORT: '/reports/student/bps',
    GET_STUDENT_HOMEWORK_REPORT: '/reports/student/homework',
    GET_STUDENT_LIBRARY_REPORT: '/reports/student/library',
    // Staff Reports
    GET_STAFF_CLASSES: '/reports/staff/classes',
    GET_CLASS_ATTENDANCE_REPORT: '/reports/staff/class-attendance',
    GET_CLASS_ASSESSMENT_REPORT: '/reports/staff/class-assessment',
    GET_BEHAVIORAL_ANALYTICS_REPORT: '/reports/staff/behavioral-analytics',
    GET_HOMEWORK_ANALYTICS_REPORT: '/reports/staff/homework-analytics',
  },

  // Web Resources
  WEB_ENDPOINTS: {
    CALENDAR: '/calendar',
    CONTACTS: '/contacts',
    MESSAGES: '/messages',
    ABOUT: '/about',
    FAQ: '/faq',
  },

  // App Configuration
  APP: {
    NAME: 'ParagonISC - Student',
    VERSION: '1.0.0',
    BUNDLE_ID: 'com.edunovaasia.edusis',
  },

  // Development Configuration
  DEV: {
    USE_DUMMY_DATA: false,
    ENABLE_LOGGING: true, // Enable for app review debugging
    ENABLE_DEBUG_MODE: false, // Enable detailed debugging for app review
  },

  // Network Configuration
  NETWORK: {
    TIMEOUT: 10000,
    ENABLE_CLEARTEXT_TRAFFIC: true,
  },

  // Device Configuration
  DEVICE: {
    DEFAULT_TYPE: 'ios',
  },

  // Storage Keys
  STORAGE_KEYS: {
    USER_DATA: 'userData',
    TEACHER_USER_DATA: 'teacherUserData',
    PARENT_USER_DATA: 'parentUserData',
    STUDENT_USER_DATA: 'studentUserData',
    STUDENT_ACCOUNTS: 'studentAccounts',
    SELECTED_STUDENT: 'selectedStudent',
    CALENDAR_USER_DATA: 'calendarUserData',
    GUARDIAN_DATA: 'guardianData',
    GUARDIAN_AUTH_CODE: 'guardianAuthCode',
    GUARDIAN_CHILD_DATA: 'guardianChildData',
    NOTIFICATION_HISTORY: 'notificationHistory',
  },
};

// Helper functions to build URLs
export const buildApiUrl = (endpoint, params = {}) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL ends with slash
  const baseUrl = Config.API_BASE_URL.endsWith('/')
    ? Config.API_BASE_URL
    : Config.API_BASE_URL + '/';

  // Build base URL
  let fullUrl = baseUrl + cleanEndpoint;

  // Manually build query string without encoding
  const queryParams = [];
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.push(`${key}=${params[key]}`);
    }
  });

  if (queryParams.length > 0) {
    fullUrl += '?' + queryParams.join('&');
  }

  return fullUrl;
};

export const buildWebUrl = (endpoint, params = {}) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure base URL ends with slash
  const baseUrl = Config.API_BASE_URL.endsWith('/')
    ? Config.API_BASE_URL
    : Config.API_BASE_URL + '/';

  // Construct the full URL
  const fullUrl = baseUrl + cleanEndpoint;
  const url = new URL(fullUrl);

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

// Export individual configurations for backward compatibility
export const API_BASE_URL_CONFIG = Config.API_BASE_URL;
export const USE_DUMMY_DATA_CONFIG = Config.DEV.USE_DUMMY_DATA;

export default Config;
