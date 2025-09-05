/**
 * Staff Reports Service
 * Handles new staff reports API endpoints as per TEACHER_STAFF_API.md
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
          console.log(`📊 STAFF REPORTS SERVICE: Using ${userType} auth code`);
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
        console.log('📊 STAFF REPORTS SERVICE: Using generic auth code');
        return authCode;
      }
    }
    return null;
  } catch (error) {
    console.error('📊 STAFF REPORTS SERVICE: Error getting auth code:', error);
    return null;
  }
};

/**
 * Get Class Attendance Report (New API endpoint)
 * @param {number} classId - Class/Grade ID
 * @param {string} authCode - Staff authentication code
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object>} - Attendance report data
 */
export const getClassAttendanceReport = async (
  classId,
  authCode = null,
  startDate = null,
  endDate = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    if (!classId) {
      throw new Error('Class ID is required');
    }

    const params = {
      authCode: auth,
      class_id: classId,
    };

    if (startDate) {
      params.start_date = startDate;
    }

    if (endDate) {
      params.end_date = endDate;
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.REPORTS_STAFF_CLASS_ATTENDANCE,
      params
    );

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
    console.error('Error fetching class attendance report:', error);
    throw error;
  }
};

/**
 * Get Homework Analytics (New API endpoint)
 * @param {string} authCode - Staff authentication code
 * @param {number} subjectId - Optional subject ID filter
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object>} - Homework analytics data
 */
export const getHomeworkAnalytics = async (
  authCode = null,
  subjectId = null,
  startDate = null,
  endDate = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    const params = {
      authCode: auth,
    };

    if (subjectId) {
      params.subject_id = subjectId;
    }

    if (startDate) {
      params.start_date = startDate;
    }

    if (endDate) {
      params.end_date = endDate;
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.REPORTS_STAFF_HOMEWORK_ANALYTICS,
      params
    );

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
    console.error('Error fetching homework analytics:', error);
    throw error;
  }
};

/**
 * Generate comprehensive staff report
 * @param {string} reportType - Type of report ('attendance', 'homework', 'bps')
 * @param {Object} filters - Report filters
 * @param {string} authCode - Staff authentication code
 * @returns {Promise<Object>} - Report data
 */
export const generateStaffReport = async (
  reportType,
  filters = {},
  authCode = null
) => {
  try {
    const auth = authCode || (await getAuthCode());
    if (!auth) {
      throw new Error('No authentication code found');
    }

    switch (reportType) {
      case 'attendance':
        return await getClassAttendanceReport(
          filters.classId,
          auth,
          filters.startDate,
          filters.endDate
        );

      case 'homework':
        return await getHomeworkAnalytics(
          auth,
          filters.subjectId,
          filters.startDate,
          filters.endDate
        );

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  } catch (error) {
    console.error('Error generating staff report:', error);
    throw error;
  }
};

/**
 * Export report data to different formats
 * @param {Object} reportData - Report data to export
 * @param {string} format - Export format ('json', 'csv')
 * @returns {Promise<string>} - Exported data
 */
export const exportReportData = async (reportData, format = 'json') => {
  try {
    if (!reportData) {
      throw new Error('Report data is required');
    }

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(reportData, null, 2);

      case 'csv':
        // Basic CSV conversion for simple data structures
        if (
          reportData.student_breakdown &&
          Array.isArray(reportData.student_breakdown)
        ) {
          const headers = Object.keys(reportData.student_breakdown[0] || {});
          const csvHeaders = headers.join(',');
          const csvRows = reportData.student_breakdown.map((row) =>
            headers.map((header) => `"${row[header] || ''}"`).join(',')
          );
          return [csvHeaders, ...csvRows].join('\n');
        }
        return JSON.stringify(reportData, null, 2);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Error exporting report data:', error);
    throw error;
  }
};

/**
 * Get report summary statistics
 * @param {Object} reportData - Report data
 * @returns {Object} - Summary statistics
 */
export const getReportSummary = (reportData) => {
  try {
    if (!reportData || !reportData.report_data) {
      return null;
    }

    const { report_data } = reportData;

    return {
      totalRecords: report_data.student_breakdown?.length || 0,
      averageScore: report_data.summary?.class_average || 0,
      highestScore: report_data.summary?.highest_score || 0,
      lowestScore: report_data.summary?.lowest_score || 0,
      totalStudents: report_data.summary?.total_students || 0,
      reportType: reportData.report_type || 'unknown',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating report summary:', error);
    return null;
  }
};

/**
 * Validate report parameters
 * @param {string} reportType - Report type
 * @param {Object} filters - Report filters
 * @returns {Object} - Validation result
 */
export const validateReportParameters = (reportType, filters = {}) => {
  const errors = [];

  if (!reportType) {
    errors.push('Report type is required');
  }

  if (reportType === 'attendance' && !filters.classId) {
    errors.push('Class ID is required for attendance reports');
  }

  if (filters.startDate && filters.endDate) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    if (startDate > endDate) {
      errors.push('Start date must be before end date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
