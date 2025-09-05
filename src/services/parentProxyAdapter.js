/**
 * Parent Proxy Service Adapter
 * Adapts existing student services to work with Parent Proxy Access System
 * This allows existing screens to work seamlessly with parent proxy access
 */

import {
  getChildTimetable,
  getChildHomework,
  getChildAttendance,
  getChildGrades,
  getChildAssessment,
  getChildBpsProfile,
  getChildHealthInfo,
  getChildHealthRecords,
  getParentCalendarData,
  getParentCalendarUpcoming,
  getParentCalendarPersonal,
} from './parentService';

/**
 * Adapter for Timetable Service
 * Intercepts timetable requests and routes them through parent proxy if needed
 */
export const adaptTimetableService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get timetable data - supports both student direct access and parent proxy
     */
    getTimetableData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 TIMETABLE ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildTimetable(authCode, options.studentId);

          // Transform response to match expected format
          return {
            success: response.success,
            timetable: response.timetable || response.data?.timetable,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📚 TIMETABLE ADAPTER: Using direct student access');
          return await originalService.getTimetableData(authCode, options);
        }
      } catch (error) {
        console.error('❌ TIMETABLE ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for Homework Service
 * Intercepts homework requests and routes them through parent proxy if needed
 */
export const adaptHomeworkService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get homework data - supports both student direct access and parent proxy
     */
    getHomeworkData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 HOMEWORK ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildHomework(authCode, options.studentId);

          // Transform response to match expected format
          return {
            success: response.success,
            homework: response.homework || response.data?.homework,
            assignments: response.homework || response.data?.homework,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📝 HOMEWORK ADAPTER: Using direct student access');
          return await originalService.getHomeworkData(authCode, options);
        }
      } catch (error) {
        console.error('❌ HOMEWORK ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for Attendance Service
 * Intercepts attendance requests and routes them through parent proxy if needed
 */
export const adaptAttendanceService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get attendance data - supports both student direct access and parent proxy
     */
    getAttendanceData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 ATTENDANCE ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildAttendance(
            authCode,
            options.studentId
          );

          // Transform response to match expected format
          return {
            success: response.success,
            attendance: response.attendance || response.data?.attendance,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📊 ATTENDANCE ADAPTER: Using direct student access');
          return await originalService.getAttendanceData(authCode, options);
        }
      } catch (error) {
        console.error('❌ ATTENDANCE ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for Grades Service
 * Intercepts grades requests and routes them through parent proxy if needed
 */
export const adaptGradesService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get grades data - supports both student direct access and parent proxy
     */
    getGradesData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 GRADES ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildGrades(authCode, options.studentId);

          // Transform response to match expected format
          return {
            success: response.success,
            grades: response.grades || response.data?.grades,
            subjects:
              response.grades?.subjects || response.data?.grades?.subjects,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📈 GRADES ADAPTER: Using direct student access');
          return await originalService.getGradesData(authCode, options);
        }
      } catch (error) {
        console.error('❌ GRADES ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for Assessment Service
 * Intercepts assessment requests and routes them through parent proxy if needed
 */
export const adaptAssessmentService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get assessment data - supports both student direct access and parent proxy
     */
    getAssessmentData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 ASSESSMENT ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildAssessment(
            authCode,
            options.studentId
          );

          // Transform response to match expected format
          return {
            success: response.success,
            assessment: response.assessment || response.data?.assessment,
            formative_assessments: response.assessment?.formative_assessments,
            summative_assessments: response.assessment?.summative_assessments,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📝 ASSESSMENT ADAPTER: Using direct student access');
          return await originalService.getAssessmentData(authCode, options);
        }
      } catch (error) {
        console.error('❌ ASSESSMENT ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for BPS/Behavior Service
 * Intercepts BPS requests and routes them through parent proxy if needed
 */
export const adaptBehaviorService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get BPS data - supports both student direct access and parent proxy
     */
    getBpsData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 BPS ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);
          console.log('👤 Student ID:', options.studentId);

          const response = await getChildBpsProfile(
            authCode,
            options.studentId
          );

          // Transform response to match expected format
          return {
            success: response.success,
            bps_profile: response.bps_profile || response.data?.bps_profile,
            behavior_points: response.bps_profile?.behavior_points,
            recent_entries: response.bps_profile?.recent_entries,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('🎯 BPS ADAPTER: Using direct student access');
          return await originalService.getBpsData(authCode, options);
        }
      } catch (error) {
        console.error('❌ BPS ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

/**
 * Adapter for Calendar Service
 * Intercepts calendar requests and routes them through parent proxy if needed
 */
export const adaptCalendarService = (originalService) => {
  return {
    ...originalService,

    /**
     * Get calendar data - supports both student direct access and parent proxy
     */
    getCalendarData: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy) {
          console.log('🔄 CALENDAR ADAPTER: Using parent proxy access');
          console.log('🔑 Parent Auth Code:', authCode);

          const response = await getParentCalendarData(authCode);

          // Transform response to match expected format
          return {
            success: response.success,
            calendar: response.calendar || response.data?.calendar,
            events: response.calendar?.events || response.data?.events,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log('📅 CALENDAR ADAPTER: Using direct student access');
          return await originalService.getCalendarData(authCode, options);
        }
      } catch (error) {
        console.error('❌ CALENDAR ADAPTER: Error:', error);
        throw error;
      }
    },

    /**
     * Get upcoming calendar events - supports both student direct access and parent proxy
     */
    getUpcomingEvents: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy) {
          console.log(
            '🔄 CALENDAR ADAPTER: Using parent proxy for upcoming events'
          );
          console.log('🔑 Parent Auth Code:', authCode);

          const response = await getParentCalendarUpcoming(authCode);

          // Transform response to match expected format
          return {
            success: response.success,
            upcoming_events:
              response.upcoming_events || response.data?.upcoming_events,
            events: response.upcoming_events || response.data?.upcoming_events,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log(
            '📅 CALENDAR ADAPTER: Using direct student access for upcoming'
          );
          return await originalService.getUpcomingEvents(authCode, options);
        }
      } catch (error) {
        console.error(
          '❌ CALENDAR ADAPTER: Error fetching upcoming events:',
          error
        );
        throw error;
      }
    },

    /**
     * Get personal calendar events - supports both student direct access and parent proxy
     */
    getPersonalEvents: async (authCode, options = {}) => {
      try {
        // Check if this is a parent proxy request
        if (options.useParentProxy) {
          console.log(
            '🔄 CALENDAR ADAPTER: Using parent proxy for personal events'
          );
          console.log('🔑 Parent Auth Code:', authCode);

          const response = await getParentCalendarPersonal(authCode);

          // Transform response to match expected format
          return {
            success: response.success,
            personal_events:
              response.personal_events || response.data?.personal_events,
            events: response.personal_events || response.data?.personal_events,
            message: response.message,
          };
        } else {
          // Use original student service
          console.log(
            '📅 CALENDAR ADAPTER: Using direct student access for personal'
          );
          return await originalService.getPersonalEvents(authCode, options);
        }
      } catch (error) {
        console.error(
          '❌ CALENDAR ADAPTER: Error fetching personal events:',
          error
        );
        throw error;
      }
    },
  };
};

/**
 * Utility function to detect if request should use parent proxy
 */
export const shouldUseParentProxy = (navigationParams) => {
  return !!(
    navigationParams?.useParentProxy &&
    navigationParams?.studentId &&
    navigationParams?.parentData
  );
};

/**
 * Extract proxy options from navigation parameters
 */
export const extractProxyOptions = (navigationParams) => {
  if (!shouldUseParentProxy(navigationParams)) {
    return {};
  }

  return {
    useParentProxy: true,
    studentId: navigationParams.studentId,
    parentData: navigationParams.parentData,
    studentName: navigationParams.studentName,
  };
};

/**
 * Generic adapter factory
 * Creates an adapter for any service that needs parent proxy support
 */
export const createServiceAdapter = (originalService, proxyMethod) => {
  return {
    ...originalService,

    getData: async (authCode, options = {}) => {
      try {
        if (options.useParentProxy && options.studentId) {
          console.log('🔄 SERVICE ADAPTER: Using parent proxy access');
          const response = await proxyMethod(authCode, options.studentId);
          return response;
        } else {
          console.log('📚 SERVICE ADAPTER: Using direct student access');
          return await originalService.getData(authCode, options);
        }
      } catch (error) {
        console.error('❌ SERVICE ADAPTER: Error:', error);
        throw error;
      }
    },
  };
};

export default {
  adaptTimetableService,
  adaptHomeworkService,
  adaptAttendanceService,
  adaptGradesService,
  adaptAssessmentService,
  adaptBehaviorService,
  adaptCalendarService,
  shouldUseParentProxy,
  extractProxyOptions,
  createServiceAdapter,
};
