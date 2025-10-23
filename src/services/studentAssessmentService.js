/**
 * Student Assessment Service
 * Handles fetching student assessments using the unified API
 * 
 * API Documentation: Based on Mobile Assessment API v2.0
 * Endpoint: GET /mobile-api/student/assessments
 */

import { Config, buildApiUrl } from '../config/env';

/**
 * Get student assessments using unified API
 * Returns all assessments (summative and formative) in a single unified array
 * 
 * @param {string} authCode - Student's authentication code
 * @param {number|null} studentId - Optional student ID (for parent access)
 * @returns {Promise<Object>} - Unified assessment data
 * 
 * Response structure:
 * {
 *   success: true,
 *   student_id: number,
 *   academic_year_id: number,
 *   branch_id: number,
 *   assessments: [...],      // Unified list (all assessments)
 *   summative: [...],        // Points-based only
 *   formative: [...],        // Text-based only
 *   statistics: {
 *     summative: { total_assessments, graded_assessments, average_percentage, ... },
 *     formative: { total_assessments, graded_assessments, ... },
 *     total_assessments: number,
 *     total_graded: number
 *   }
 * }
 */
export const getStudentAssessments = async (authCode, studentId = null) => {
  try {
    console.log('📊 STUDENT ASSESSMENTS: Fetching unified assessments', {
      authCode: authCode ? 'provided' : 'missing',
      studentId: studentId || 'not provided (direct student access)',
    });

    // Build URL with optional student_id parameter for parent access
    const params = { authCode };
    if (studentId) {
      params.student_id = studentId;
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_ASSESSMENTS, params);
    console.log('🌐 STUDENT ASSESSMENTS: API URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ STUDENT ASSESSMENTS: API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ STUDENT ASSESSMENTS: Success', {
      success: data.success,
      totalAssessments: data.assessments?.length || 0,
      summativeCount: data.summative?.length || 0,
      formativeCount: data.formative?.length || 0,
      studentId: data.student_id,
      academicYearId: data.academic_year_id,
    });

    // Validate response structure
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch assessments');
    }

    return data;
  } catch (error) {
    console.error('❌ STUDENT ASSESSMENTS: Error fetching assessments:', error);
    throw error;
  }
};

/**
 * Transform legacy grades data to unified assessment format
 * This is a helper function for backward compatibility
 * 
 * @param {Object} legacyData - Old format with separate summative/formative arrays
 * @returns {Object} - Unified format
 */
export const transformLegacyToUnified = (legacyData) => {
  if (!legacyData) return null;

  // If already in unified format, return as is
  if (legacyData.assessments && Array.isArray(legacyData.assessments)) {
    return legacyData;
  }

  // Transform legacy format
  const summative = legacyData.summative || [];
  const formative = legacyData.formative || [];

  // Combine and sort by date (newest first)
  const assessments = [...summative, ...formative].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  return {
    success: true,
    student_id: legacyData.student_id,
    academic_year_id: legacyData.academic_year_id,
    branch_id: legacyData.branch_id,
    assessments,
    summative,
    formative,
    statistics: legacyData.statistics || {
      summative: {
        total_assessments: summative.length,
        graded_assessments: summative.filter(a => a.is_graded === 1).length,
        ungraded_assessments: summative.filter(a => a.is_graded !== 1).length,
      },
      formative: {
        total_assessments: formative.length,
        graded_assessments: formative.filter(a => a.is_graded === 1).length,
        ungraded_assessments: formative.filter(a => a.is_graded !== 1).length,
      },
      total_assessments: assessments.length,
      total_graded: assessments.filter(a => a.is_graded === 1).length,
    },
  };
};

/**
 * Filter assessments by subject
 * 
 * @param {Array} assessments - Array of assessments
 * @param {string} subjectName - Subject name to filter by
 * @returns {Array} - Filtered assessments
 */
export const filterBySubject = (assessments, subjectName) => {
  if (!assessments || !Array.isArray(assessments)) return [];
  if (!subjectName) return assessments;
  
  return assessments.filter(a => a.subject_name === subjectName);
};

/**
 * Filter assessments by grading type
 * 
 * @param {Array} assessments - Array of assessments
 * @param {string} gradingType - 'points' or 'text'
 * @returns {Array} - Filtered assessments
 */
export const filterByGradingType = (assessments, gradingType) => {
  if (!assessments || !Array.isArray(assessments)) return [];
  if (!gradingType) return assessments;
  
  return assessments.filter(a => a.grading_type === gradingType);
};

/**
 * Get unique subjects from assessments
 * 
 * @param {Array} assessments - Array of assessments
 * @returns {Array} - Array of unique subject names
 */
export const getUniqueSubjects = (assessments) => {
  if (!assessments || !Array.isArray(assessments)) return [];
  
  const subjects = new Set();
  assessments.forEach(a => {
    if (a.subject_name) {
      subjects.add(a.subject_name);
    }
  });
  
  return Array.from(subjects).sort();
};

/**
 * Calculate subject average from assessments
 * 
 * @param {Array} assessments - Array of assessments for a subject
 * @returns {number|null} - Average percentage or null if no graded assessments
 */
export const calculateSubjectAverage = (assessments) => {
  if (!assessments || !Array.isArray(assessments)) return null;
  
  // Only include graded points-based assessments
  const gradedAssessments = assessments.filter(a => 
    a.is_graded === 1 && 
    a.grading_type === 'points' &&
    a.score_percentage !== null &&
    a.score_percentage !== undefined
  );
  
  if (gradedAssessments.length === 0) return null;
  
  // Simple average for now (can be enhanced with weighted average later)
  const sum = gradedAssessments.reduce((acc, a) => acc + parseFloat(a.score_percentage), 0);
  return Math.round(sum / gradedAssessments.length);
};

export default {
  getStudentAssessments,
  transformLegacyToUnified,
  filterBySubject,
  filterByGradingType,
  getUniqueSubjects,
  calculateSubjectAverage,
};

