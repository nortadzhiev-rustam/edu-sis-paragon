/**
 * Services Index
 * Central export point for all service modules
 */

// Authentication Services
export * from './authService';

// Staff Services (New API endpoints)
export * from './staffService';
export * from './staffReportsService';

// Existing Services
export * from './homeworkService';
export * from './notificationService';
export * from './informationService';
export * from './demoModeService';

// Service Categories for organized imports
export { default as InformationService } from './informationService';

/**
 * Quick access to new staff API functions
 */
export {
  // Staff Authentication
  staffLogin,
  
  // Staff Dashboard
  getStaffDashboard,
  
  // Staff Timetable
  getStaffTimetable,
  
  // Attendance Management
  storeClassAttendance,
  getTeacherClassesForAttendance,
  
  // BPS Management
  storeBPSRecord,
  getBPSItems,
  
  // Homework Management
  createHomeworkAssignment,
  getTeacherHomeworkClasses,
  gradeHomeworkSubmission,
  
  // Homeroom Management
  getHomeroomClassrooms,
  getHomeroomStudents,
  getHomeroomAttendance,
  getHomeroomStudentProfile,
  
  // Notifications
  sendNotificationToStudents,
  sendBroadcastNotification,
} from './staffService';

/**
 * Quick access to staff reports functions
 */
export {
  // Reports
  getClassAttendanceReport,
  getHomeworkAnalytics,
  generateStaffReport,
  exportReportData,
  getReportSummary,
  validateReportParameters,
} from './staffReportsService';

/**
 * Service configuration and utilities
 */
export const ServiceConfig = {
  // API endpoint categories
  ENDPOINTS: {
    STAFF: 'staff',
    HOMEROOM: 'homeroom', 
    HOMEWORK: 'homework',
    REPORTS: 'reports',
    NOTIFICATIONS: 'notifications',
  },
  
  // Service status
  STATUS: {
    AVAILABLE: 'available',
    LEGACY: 'legacy',
    DEPRECATED: 'deprecated',
  },
  
  // Service mapping for migration
  MIGRATION_MAP: {
    // Old function -> New function
    'teacherLogin': 'staffLogin',
    'GET_TEACHER_TIMETABLE': 'getStaffTimetable',
    'TAKE_ATTENDANCE': 'storeClassAttendance',
    'STORE_BPS': 'storeBPSRecord',
    'CREATE_HOMEWORK_ASSIGNMENT': 'createHomeworkAssignment',
  },
};

/**
 * Service health check utility
 */
export const checkServiceHealth = async () => {
  const services = {
    staff: false,
    homework: false,
    notifications: false,
    reports: false,
  };
  
  try {
    // Test staff service
    const { getStaffDashboard } = await import('./staffService');
    services.staff = typeof getStaffDashboard === 'function';
    
    // Test homework service  
    const { createHomeworkAssignment } = await import('./staffService');
    services.homework = typeof createHomeworkAssignment === 'function';
    
    // Test notification service
    const { sendNotificationToStudents } = await import('./staffService');
    services.notifications = typeof sendNotificationToStudents === 'function';
    
    // Test reports service
    const { getClassAttendanceReport } = await import('./staffReportsService');
    services.reports = typeof getClassAttendanceReport === 'function';
    
  } catch (error) {
    console.error('Service health check failed:', error);
  }
  
  return services;
};

/**
 * Get service documentation
 */
export const getServiceDocumentation = () => {
  return {
    staffService: {
      description: 'New staff API endpoints for authentication, dashboard, timetable, attendance, BPS, homework, and homeroom management',
      endpoints: [
        'staffLogin',
        'getStaffDashboard', 
        'getStaffTimetable',
        'storeClassAttendance',
        'storeBPSRecord',
        'createHomeworkAssignment',
        'getHomeroomClassrooms',
      ],
      documentation: 'See TEACHER_STAFF_API.md for detailed API documentation',
    },
    staffReportsService: {
      description: 'Staff reporting and analytics functions',
      endpoints: [
        'getClassAttendanceReport',
        'getHomeworkAnalytics',
        'generateStaffReport',
        'exportReportData',
      ],
      documentation: 'Provides comprehensive reporting capabilities for staff',
    },
    legacyServices: {
      description: 'Existing services maintained for compatibility',
      services: [
        'authService (teacherLogin)',
        'homeworkService (legacy homework functions)',
        'notificationService (legacy notification functions)',
      ],
      note: 'Legacy services are maintained for backward compatibility but new implementations should use the new staff services',
    },
  };
};
