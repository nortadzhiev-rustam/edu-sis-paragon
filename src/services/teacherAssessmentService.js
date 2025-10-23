/**
 * Teacher Assessment Service
 * Handles all teacher assessment-related API calls for grade entry and assessment management
 *
 * API Documentation: Mobile API - Teacher Assessment Endpoints
 */

import { Config, buildApiUrl } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from './authService';

/**
 * Helper function to get auth code from storage (supports user-type-specific storage)
 */
const getAuthCode = async () => {
  try {
    // First, check the generic userData key to determine which user is currently active
    let currentUserType = null;
    try {
      const genericUserData = await AsyncStorage.getItem('userData');
      if (genericUserData) {
        const user = JSON.parse(genericUserData);
        currentUserType = user.userType;
        console.log('📊 ASSESSMENT SERVICE: Current active user type:', currentUserType);
      }
    } catch (error) {
      console.log('⚠️ ASSESSMENT SERVICE: Could not determine current user type');
    }

    // If we know the current user type, get their specific auth code
    if (currentUserType) {
      const userData = await getUserData(currentUserType, AsyncStorage);
      if (userData && (userData.authCode || userData.auth_code)) {
        const authCode = userData.authCode || userData.auth_code;
        console.log('📊 ASSESSMENT SERVICE: Using auth code:', authCode?.substring(0, 8) + '...');
        return authCode;
      }
    }

    // Fallback: Try teacher type first (most likely for assessments)
    const userTypes = ['teacher', 'parent', 'student'];
    for (const userType of userTypes) {
      const userData = await getUserData(userType, AsyncStorage);
      if (userData) {
        const authCode = userData.authCode || userData.auth_code;
        if (authCode) {
          console.log(`📊 ASSESSMENT SERVICE: Using ${userType} auth code (fallback)`);
          return authCode;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('📊 ASSESSMENT SERVICE: Error getting auth code:', error);
    return null;
  }
};

/**
 * Helper function to make API requests with proper error handling
 */
const makeAssessmentApiRequest = async (url, options = {}) => {
  try {
    console.log('📊 ASSESSMENT API REQUEST:', url);

    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT || 30000,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    const responseText = await response.text();
    console.log('📊 ASSESSMENT API RESPONSE:', responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('📊 Assessment API request failed:', error);
    throw error;
  }
};

/**
 * 1. Get Teacher's Assessments List
 * Retrieves all assessments (both formative and summative) for the authenticated teacher
 *
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with summative and formative assessments
 */
export const getTeacherAssessments = async (authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_TEACHER_ASSESSMENTS, { authCode: auth });
    const response = await makeAssessmentApiRequest(url);

    console.log('📊 GET TEACHER ASSESSMENTS: Success', {
      summativeCount: response.data?.summative?.length || 0,
      formativeCount: response.data?.formative?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 GET TEACHER ASSESSMENTS: Error', error);
    throw error;
  }
};

/**
 * 2. Get Assessment Details
 * Retrieves detailed information about a specific assessment including all student grades
 *
 * @param {number} assessmentId - Assessment ID
 * @param {string} type - Assessment type: "summative" or "formative"
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with assessment details and student grades
 */
export const getAssessmentDetails = async (assessmentId, type, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_ASSESSMENT_DETAILS, {
      authCode: auth,
      assessment_id: assessmentId,
      type: type,
    });

    const response = await makeAssessmentApiRequest(url);

    console.log('📊 GET ASSESSMENT DETAILS: Success', {
      assessmentId,
      type,
      studentCount: response.data?.students?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 GET ASSESSMENT DETAILS: Error', error);
    throw error;
  }
};

/**
 * 3. Get Grade Students
 * Retrieves all active students in a specific grade
 *
 * @param {number} gradeId - Grade ID
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with list of students
 */
export const getGradeStudents = async (gradeId, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_GRADE_STUDENTS, {
      authCode: auth,
      grade_id: gradeId,
    });

    const response = await makeAssessmentApiRequest(url);

    console.log('📊 GET GRADE STUDENTS: Success', {
      gradeId,
      studentCount: response.data?.count || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 GET GRADE STUDENTS: Error', error);
    throw error;
  }
};

/**
 * 4. Get Assessment Options
 * Retrieves all available options for creating assessments (subjects, grades, templates, strands, skills)
 *
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with subjects, grades, templates, strands, and skills
 */
export const getAssessmentOptions = async (authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_ASSESSMENT_OPTIONS, {
      authCode: auth,
    });

    const response = await makeAssessmentApiRequest(url);

    console.log('📊 GET ASSESSMENT OPTIONS: Success', {
      subjectsCount: response.data?.subjects?.length || 0,
      strandsCount: response.data?.strands?.length || 0,
      skillsCount: response.data?.skills?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 GET ASSESSMENT OPTIONS: Error', error);
    throw error;
  }
};

/**
 * 5. Save Summative Grade (Single Student)
 * Saves or updates a summative grade for a single student
 *
 * @param {Object} gradeData - Grade data
 * @param {number} gradeData.assessment_id - Assessment ID
 * @param {number} gradeData.student_id - Student ID
 * @param {number} gradeData.score - Score value
 * @param {string} gradeData.comment - Optional comment
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with saved grade data
 */
export const saveSummativeGrade = async (gradeData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SAVE_SUMMATIVE_GRADE);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...gradeData,
      }),
    });

    console.log('📊 SAVE SUMMATIVE GRADE: Success', {
      assessmentId: gradeData.assessment_id,
      studentId: gradeData.student_id,
      score: gradeData.score,
    });

    return response;
  } catch (error) {
    console.error('📊 SAVE SUMMATIVE GRADE: Error', error);
    throw error;
  }
};

/**
 * 6. Save Formative Grade (Single Student)
 * Saves or updates a formative grade for a single student
 *
 * @param {Object} gradeData - Grade data
 * @param {number} gradeData.assessment_id - Assessment ID
 * @param {number} gradeData.student_id - Student ID
 * @param {number} gradeData.t1 - EE (Exceeding Expectations) percentage
 * @param {number} gradeData.t2 - ME (Meeting Expectations) percentage
 * @param {number} gradeData.t3 - AE (Approaching Expectations) percentage
 * @param {number} gradeData.t4 - BE (Below Expectations) percentage
 * @param {string} gradeData.comment - Optional comment
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with saved grade data
 */
export const saveFormativeGrade = async (gradeData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SAVE_FORMATIVE_GRADE);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...gradeData,
      }),
    });

    console.log('📊 SAVE FORMATIVE GRADE: Success', {
      assessmentId: gradeData.assessment_id,
      studentId: gradeData.student_id,
    });

    return response;
  } catch (error) {
    console.error('📊 SAVE FORMATIVE GRADE: Error', error);
    throw error;
  }
};



/**
 * 7. Save Summative Grades (Bulk - Multiple Students)
 * Saves or updates summative grades for multiple students at once
 * This is the recommended method for mobile apps as it reduces network requests
 *
 * @param {number} assessmentId - Assessment ID
 * @param {Array<Object>} grades - Array of grade objects
 * @param {number} grades[].student_id - Student ID
 * @param {number} grades[].score - Score value
 * @param {string} grades[].comment - Optional comment
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with saved count and errors
 */
export const saveSummativeGradesBulk = async (assessmentId, grades, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SAVE_SUMMATIVE_GRADES_BULK);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        assessment_id: assessmentId,
        grades: grades,
      }),
    });

    console.log('📊 SAVE SUMMATIVE GRADES BULK: Success', {
      assessmentId,
      savedCount: response.data?.saved_count || 0,
      totalCount: response.data?.total_count || 0,
      errors: response.data?.errors?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 SAVE SUMMATIVE GRADES BULK: Error', error);
    throw error;
  }
};

/**
 * 8. Save Formative Grades (Bulk - Multiple Students)
 * Saves or updates formative grades for multiple students at once
 *
 * @param {number} assessmentId - Assessment ID
 * @param {Array<Object>} grades - Array of grade objects
 * @param {number} grades[].student_id - Student ID
 * @param {number} grades[].t1 - EE percentage
 * @param {number} grades[].t2 - ME percentage
 * @param {number} grades[].t3 - AE percentage
 * @param {number} grades[].t4 - BE percentage
 * @param {string} grades[].comment - Optional comment
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with saved count and errors
 */
export const saveFormativeGradesBulk = async (assessmentId, grades, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SAVE_FORMATIVE_GRADES_BULK);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        assessment_id: assessmentId,
        grades: grades,
      }),
    });

    console.log('📊 SAVE FORMATIVE GRADES BULK: Success', {
      assessmentId,
      savedCount: response.data?.saved_count || 0,
      totalCount: response.data?.total_count || 0,
      errors: response.data?.errors?.length || 0,
    });

    return response;
  } catch (error) {
    console.error('📊 SAVE FORMATIVE GRADES BULK: Error', error);
    throw error;
  }
};

/**
 * 9. Create Summative Assessment
 * Creates a new summative assessment and automatically creates grade entries for all students
 * Also sends push notifications to all students
 *
 * @param {Object} assessmentData - Assessment data
 * @param {string} assessmentData.assessment_name - Name of the assessment
 * @param {number} assessmentData.subject_id - Subject ID
 * @param {number} assessmentData.grade_id - Grade ID
 * @param {string} assessmentData.date - Assessment date (YYYY-MM-DD)
 * @param {number} assessmentData.max_score - Maximum possible score
 * @param {number} assessmentData.template_id - Optional score template ID
 * @param {number} assessmentData.strand - Optional strand/skill ID
 * @param {string} assessmentData.comment - Optional comment/description
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with assessment ID and student count
 */
export const createSummativeAssessment = async (assessmentData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_SUMMATIVE_ASSESSMENT);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...assessmentData,
      }),
    });

    console.log('📊 CREATE SUMMATIVE ASSESSMENT: Success', {
      assessmentId: response.data?.assessment_id,
      studentCount: response.data?.student_count,
    });

    return response;
  } catch (error) {
    console.error('📊 CREATE SUMMATIVE ASSESSMENT: Error', error);
    throw error;
  }
};

/**
 * 10. Create Formative Assessment
 * Creates a new formative assessment and automatically creates grade entries for all students
 * Also sends push notifications to all students
 *
 * @param {Object} assessmentData - Assessment data
 * @param {string} assessmentData.assessment_name - Name of the assessment
 * @param {number} assessmentData.subject_id - Subject ID
 * @param {number} assessmentData.grade_id - Grade ID
 * @param {string} assessmentData.date - Assessment date (YYYY-MM-DD)
 * @param {number} assessmentData.formative_type_id - Optional formative type template ID
 * @param {number} assessmentData.skill - Optional skill ID
 * @param {number} assessmentData.strand - Optional strand ID
 * @param {string} assessmentData.comment - Optional comment/description
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with assessment ID and student count
 */
export const createFormativeAssessment = async (assessmentData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_FORMATIVE_ASSESSMENT);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...assessmentData,
      }),
    });

    console.log('📊 CREATE FORMATIVE ASSESSMENT: Success', {
      assessmentId: response.data?.assessment_id,
      studentCount: response.data?.student_count,
    });

    return response;
  } catch (error) {
    console.error('📊 CREATE FORMATIVE ASSESSMENT: Error', error);
    throw error;
  }
};

/**
 * 11. Create Assessment (Unified)
 * Creates a new assessment using the unified grading type system
 * Supports both points-based (summative) and text-based (formative) assessments
 *
 * @param {Object} assessmentData - Assessment data
 * @param {string} assessmentData.assessment_name - Name of the assessment
 * @param {string|number} assessmentData.grading_type - "points" or "text" (or 1/0)
 * @param {number} assessmentData.subject_id - Subject ID
 * @param {number} assessmentData.grade_id - Grade ID
 * @param {string} assessmentData.date - Assessment date (YYYY-MM-DD)
 * @param {number} assessmentData.max_score - Maximum score (required if grading_type is "points")
 * @param {number} assessmentData.category_id - Optional category ID
 * @param {string} assessmentData.comment - Optional comment/description
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with assessment ID and student count
 */
export const createAssessment = async (assessmentData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_ASSESSMENT);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...assessmentData,
      }),
    });

    console.log('📊 CREATE ASSESSMENT (UNIFIED): Success', {
      assessmentId: response.data?.assessment_id,
      studentCount: response.data?.student_count,
      gradingType: assessmentData.grading_type,
    });

    return response;
  } catch (error) {
    console.error('📊 CREATE ASSESSMENT (UNIFIED): Error', error);
    throw error;
  }
};

/**
 * 12. Save Grade (Unified)
 * Saves a grade using the unified grading type system
 * Automatically detects whether to save score or text_grade based on assessment type
 *
 * @param {Object} gradeData - Grade data
 * @param {number} gradeData.assessment_id - Assessment ID
 * @param {number} gradeData.student_id - Student ID
 * @param {number} gradeData.score - Score value (for points-based assessments)
 * @param {string} gradeData.text_grade - Text grade (for text-based assessments)
 * @param {string} authCode - Optional auth code override
 * @returns {Promise<Object>} - Response with saved grade data
 */
export const saveGrade = async (gradeData, authCode = null) => {
  try {
    const auth = authCode || await getAuthCode();
    if (!auth) {
      throw new Error('No authentication code available');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SAVE_GRADE);

    const response = await makeAssessmentApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode: auth,
        ...gradeData,
      }),
    });

    console.log('📊 SAVE GRADE (UNIFIED): Success', {
      assessmentId: gradeData.assessment_id,
      studentId: gradeData.student_id,
      score: gradeData.score,
      textGrade: gradeData.text_grade,
    });

    return response;
  } catch (error) {
    console.error('📊 SAVE GRADE (UNIFIED): Error', error);
    throw error;
  }
};

/**
 * Export all assessment service functions
 */
export default {
  // Unified endpoints (recommended)
  createAssessment,
  saveGrade,
  // List and details
  getTeacherAssessments,
  getAssessmentDetails,
  getGradeStudents,
  getAssessmentOptions,
  // Legacy endpoints (still supported)
  saveSummativeGrade,
  saveFormativeGrade,
  saveSummativeGradesBulk,
  saveFormativeGradesBulk,
  createSummativeAssessment,
  createFormativeAssessment,
};
