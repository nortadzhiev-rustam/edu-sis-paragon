/**
 * Parent Service
 * Handles parent authentication and proxy access to children's academic data
 * Implements the Parent-Student Proxy Access System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Mock data for development/testing
const mockParentData = {
  parent_id: 106890,
  parent_name: 'John Parent',
  parent_photo: '/data/parentFiles/parent_106890.jpg', // Add parent photo for testing
  auth_code: 'fc7e72c3d19cccc4ec1482aa3f104b9bbb',
  user_type: 'parent',
  children: [
    {
      student_id: 103295,
      student_name: 'Samithidh Koeut',
      classroom_name: '12A',
      academic_year: '2025-2026',
      grade_level: 12,
    },
    {
      student_id: 102914,
      student_name: 'Hengpiseth Sok',
      classroom_name: '12C',
      academic_year: '2025-2026',
      grade_level: 12,
    },
  ],
};

// Temporary flag for testing with mock data
const USE_MOCK_DATA = false;

/**
 * Make API request with error handling
 */
const makeApiRequest = async (url, options = {}) => {
  try {
    console.log('🔗 PARENT SERVICE: Making API request to:', url);
    console.log('📤 PARENT SERVICE: Request options:', options);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('📥 PARENT SERVICE: Response received:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ PARENT SERVICE: API request failed:', error);
    throw error;
  }
};

/**
 * Get parent's children list
 * @param {string} authCode - Parent's authentication code
 * @returns {Promise<Object>} - Children data
 */
export const getParentChildren = async (authCode) => {
  try {
    console.log('👨‍👩‍👧‍👦 PARENT SERVICE: Fetching parent children');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        success: true,
        children: mockParentData.children,
        total_children: mockParentData.children.length,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_PARENT_CHILDREN, {
      authCode,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching children:', error);
    throw error;
  }
};

/**
 * Get child's timetable using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Timetable data
 */
export const getChildTimetable = async (authCode, studentId) => {
  try {
    console.log('📅 PARENT SERVICE: Fetching child timetable');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Return mock data in the same format as real API
      const mockApiResponse = {
        1: [
          {
            timetable_id: 116247,
            week_day: 1,
            week_time: 1,
            grade_id: 8080,
            subject_id: 32,
            subject_name: '12C - English',
            teacher_id: 107443,
            teacher_name: 'Andrew Beecher',
          },
          {
            timetable_id: 117177,
            week_day: 1,
            week_time: 2,
            grade_id: 8081,
            subject_id: 20,
            subject_name: '12C - Maths',
            teacher_id: 106007,
            teacher_name: 'Melisbek Gapparov',
          },
        ],
        2: [
          {
            timetable_id: 116264,
            week_day: 2,
            week_time: 1,
            grade_id: 8080,
            subject_id: 32,
            subject_name: '12C - English',
            teacher_id: 107443,
            teacher_name: 'Andrew Beecher',
          },
        ],
      };

      return {
        success: true,
        timetable: transformTimetableData(mockApiResponse),
        message: 'Mock timetable data retrieved successfully',
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_TIMETABLE, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    // Transform the response to match expected timetable format
    if (response && typeof response === 'object' && !response.success) {
      // The API returns the timetable data directly as an object with day numbers as keys
      const transformedResponse = {
        success: true,
        timetable: transformTimetableData(response),
        message: 'Timetable data retrieved successfully',
      };

      console.log(
        '🔄 PARENT SERVICE: Transformed timetable response:',
        transformedResponse
      );
      return transformedResponse;
    }

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching child timetable:', error);
    throw error;
  }
};

/**
 * Get child's homework using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Homework data
 */
export const getChildHomework = async (authCode, studentId) => {
  try {
    console.log('📚 PARENT SERVICE: Fetching child homework');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 700));

      return {
        success: true,
        homework: [
          {
            id: 1,
            subject: 'Mathematics',
            title: 'Algebra Problems',
            description: 'Complete exercises 1-20 from chapter 5',
            due_date: '2025-08-30',
            status: 'pending',
            teacher: 'Mr. Smith',
          },
          {
            id: 2,
            subject: 'English',
            title: 'Essay Writing',
            description: 'Write a 500-word essay on climate change',
            due_date: '2025-09-02',
            status: 'submitted',
            teacher: 'Ms. Johnson',
          },
        ],
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_HOMEWORK, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching child homework:', error);
    throw error;
  }
};

/**
 * Get child's attendance using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Attendance data
 */
export const getChildAttendance = async (authCode, studentId) => {
  try {
    console.log('📊 PARENT SERVICE: Fetching child attendance');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        attendance: {
          total_days: 180,
          present_days: 165,
          absent_days: 15,
          attendance_percentage: 91.7,
          recent_records: [
            {
              date: '2025-08-26',
              status: 'present',
              periods: [
                { period: 1, status: 'present' },
                { period: 2, status: 'present' },
                { period: 3, status: 'absent' },
              ],
            },
          ],
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_ATTENDANCE, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching child attendance:', error);
    throw error;
  }
};

/**
 * Get child's grades/assessment using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Grades/assessment data
 */
export const getChildGrades = async (authCode, studentId) => {
  try {
    console.log('📈 PARENT SERVICE: Fetching child grades');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        success: true,
        student_id: studentId,
        academic_year_id: 2024,
        branch_id: 1,

        summative: [
          {
            assessment_id: 101,
            date: '2025-08-25',
            subject_name: 'Mathematics',
            assessment_name: 'Midterm Exam',
            type_title: 'Written Test',
            type_percentage: 60,
            raw_score: 88,
            calculated_grade: 88.0,
            letter_grade: 'B+',
            max_score: 100,
            score_percentage: 88.0,
            comment: 'Good understanding of concepts',
            teacher_name: 'Sarah Johnson',
            is_graded: 1,
            display_score: '88.0 (B+)',

            template_info: {
              template_id: 5,
              template_name: 'Standard Math Template',
              assessment_types: [
                {
                  type_id: 1,
                  title: 'Written Test',
                  percentage: 60,
                  description: 'Main exam',
                },
                {
                  type_id: 2,
                  title: 'Homework',
                  percentage: 25,
                  description: 'Daily assignments',
                },
                {
                  type_id: 3,
                  title: 'Participation',
                  percentage: 15,
                  description: 'Class participation',
                },
              ],
            },

            grading_context: {
              has_template: true,
              is_weighted: true,
              total_possible_percentage: 100,
            },
          },
          {
            assessment_id: 102,
            date: '2025-08-22',
            subject_name: 'English',
            assessment_name: 'Essay Analysis',
            type_title: 'Essay',
            type_percentage: 50,
            raw_score: 92,
            calculated_grade: 92.0,
            letter_grade: 'A',
            max_score: 100,
            score_percentage: 92.0,
            comment: 'Excellent analytical skills',
            teacher_name: 'John Smith',
            is_graded: 1,
            display_score: '92.0 (A)',

            template_info: {
              template_id: 7,
              template_name: 'Literature Assessment Template',
              assessment_types: [
                {
                  type_id: 1,
                  title: 'Essay',
                  percentage: 50,
                  description: 'Written analysis',
                },
                {
                  type_id: 2,
                  title: 'Reading Comprehension',
                  percentage: 30,
                  description: 'Text understanding',
                },
                {
                  type_id: 3,
                  title: 'Discussion',
                  percentage: 20,
                  description: 'Class participation',
                },
              ],
            },

            grading_context: {
              has_template: true,
              is_weighted: true,
              total_possible_percentage: 100,
            },
          },
        ],

        formative: [
          {
            assessment_id: 201,
            tt1: 4,
            tt2: 3,
            tt3: 4,
            tt4: 3,
            teacher_name: 'Sarah Johnson',
            subject_name: 'Mathematics',
            assessment_name: 'Quiz 1',
            strand_id: null,
            strand_name: null,
            skill_id: null,
            skill_name: null,
            date: '2025-08-20',
            max_score: null,
            is_graded: 1,
            grading_status: 'Graded',
          },
        ],

        statistics: {
          summative: {
            total_assessments: 2,
            graded_assessments: 2,
            ungraded_assessments: 0,
            average_grade: 90.0,
            highest_grade: 92.0,
            lowest_grade: 88.0,
            with_templates: 2,
          },
          formative: {
            total_assessments: 1,
            graded_assessments: 1,
            ungraded_assessments: 0,
          },
          overall: {
            total_assessments: 3,
            total_graded: 3,
            total_ungraded: 0,
            completion_rate: 100.0,
            average_performance: 90.0,
          },
        },

        enhanced_features: {
          weighted_calculations: true,
          letter_grades: true,
          template_support: true,
          grade_analytics: true,
        },

        api_version: '2.0',
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_GRADES, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching child grades:', error);
    throw error;
  }
};

/**
 * Get child's assessment data using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Assessment data
 */
export const getChildAssessment = async (authCode, studentId) => {
  try {
    console.log('📝 PARENT SERVICE: Fetching child assessment');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 650));

      return {
        success: true,
        assessment: {
          formative_assessments: [
            {
              id: 1,
              subject: 'Mathematics',
              title: 'Algebra Quiz',
              score: 85,
              max_score: 100,
              percentage: 85.0,
              date: '2025-08-20',
              teacher: 'Mr. Smith',
            },
          ],
          summative_assessments: [
            {
              id: 2,
              subject: 'Mathematics',
              title: 'Midterm Exam',
              score: 88,
              max_score: 100,
              percentage: 88.0,
              date: '2025-08-25',
              teacher: 'Mr. Smith',
            },
          ],
          upcoming_assessments: [
            {
              id: 3,
              subject: 'English',
              title: 'Literature Test',
              scheduled_date: '2025-09-01',
              teacher: 'Ms. Johnson',
            },
          ],
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_ASSESSMENT, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching child assessment:', error);
    throw error;
  }
};

/**
 * Get child's BPS profile using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - BPS profile data
 */
export const getChildBpsProfile = async (authCode, studentId) => {
  try {
    console.log('🎯 PARENT SERVICE: Fetching child BPS profile');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 750));

      return {
        success: true,
        bps_profile: {
          student_info: {
            student_id: studentId,
            name: 'Samithidh Koeut',
            classroom: '12A',
            academic_year: '2025-2026',
          },
          behavior_points: {
            total_positive: 45,
            total_negative: -8,
            net_points: 37,
            current_level: 'Good Standing',
          },
          recent_entries: [
            {
              id: 1,
              type: 'positive',
              title: 'Excellent Participation',
              points: 5,
              date: '2025-08-25',
              teacher: 'Mr. Smith',
              note: 'Outstanding contribution to class discussion',
            },
            {
              id: 2,
              type: 'negative',
              title: 'Late to Class',
              points: -2,
              date: '2025-08-24',
              teacher: 'Ms. Johnson',
              note: 'Arrived 10 minutes late',
            },
          ],
          monthly_summary: {
            august_2025: {
              positive: 15,
              negative: -3,
              net: 12,
            },
            july_2025: {
              positive: 20,
              negative: -2,
              net: 18,
            },
          },
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_BPS_PROFILE, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching child BPS profile:',
      error
    );
    throw error;
  }
};

/**
 * Get child's health info using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Health info data
 */
export const getChildHealthInfo = async (authCode, studentId) => {
  try {
    console.log('🏥 PARENT SERVICE: Fetching child health info');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        success: true,
        health_info: {
          student_info: {
            student_id: studentId,
            name: 'Samithidh Koeut',
            classroom: '12A',
            academic_year: '2025-2026',
          },
          basic_info: {
            height: '165 cm',
            weight: '55 kg',
            blood_type: 'O+',
            allergies: ['Peanuts', 'Shellfish'],
            medical_conditions: ['Asthma'],
            emergency_contact: {
              name: 'Parent Name',
              phone: '+855 12 345 678',
              relationship: 'Parent',
            },
          },
          vaccination_status: {
            covid19: {
              status: 'Fully Vaccinated',
              last_dose: '2024-06-15',
              vaccine_type: 'Pfizer',
            },
            routine_vaccines: {
              status: 'Up to date',
              last_updated: '2024-01-15',
            },
          },
          health_screening: {
            last_checkup: '2024-08-01',
            vision: 'Normal',
            hearing: 'Normal',
            dental: 'Good',
            bmi_status: 'Normal',
          },
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_HEALTH_INFO, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching child health info:',
      error
    );
    throw error;
  }
};

/**
 * Get child's health records using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Health records data
 */
export const getChildHealthRecords = async (authCode, studentId) => {
  try {
    console.log('📋 PARENT SERVICE: Fetching child health records');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 650));

      return {
        success: true,
        health_records: {
          medical_visits: [
            {
              id: 1,
              date: '2025-08-20',
              type: 'Routine Checkup',
              nurse: 'Ms. Johnson',
              symptoms: 'None',
              treatment: 'General health assessment',
              notes: 'Student is in good health',
              follow_up_required: false,
            },
            {
              id: 2,
              date: '2025-08-15',
              type: 'Injury',
              nurse: 'Ms. Smith',
              symptoms: 'Minor cut on finger',
              treatment: 'Cleaned wound, applied bandage',
              notes: 'Small cut from art class, healing well',
              follow_up_required: false,
            },
          ],
          medication_log: [
            {
              id: 1,
              date: '2025-08-18',
              medication: 'Paracetamol',
              dosage: '500mg',
              reason: 'Headache',
              administered_by: 'School Nurse',
              parent_consent: true,
            },
          ],
          health_alerts: [
            {
              id: 1,
              type: 'Allergy Alert',
              description: 'Student has peanut allergy',
              severity: 'High',
              action_required: 'Keep EpiPen available',
              active: true,
            },
          ],
          immunization_records: [
            {
              vaccine: 'COVID-19',
              date_administered: '2024-06-15',
              vaccine_type: 'Pfizer',
              dose_number: 2,
              next_due: null,
            },
            {
              vaccine: 'Flu Shot',
              date_administered: '2024-10-01',
              vaccine_type: 'Seasonal Influenza',
              dose_number: 1,
              next_due: '2025-10-01',
            },
          ],
        },
      };
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.PARENT_STUDENT_HEALTH_RECORDS,
      {
        authCode,
        student_id: studentId,
      }
    );
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching child health records:',
      error
    );
    throw error;
  }
};

/**
 * Get child's library data using parent proxy access
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Library data
 */
export const getChildLibrary = async (authCode, studentId) => {
  try {
    console.log('📚 PARENT SERVICE: Fetching child library data');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        available_books: [
          {
            id: 1,
            title: 'Advanced Mathematics: Calculus and Beyond',
            author: 'Dr. Sarah Mitchell',
            isbn: '978-0-123456-78-9',
            category: 'Mathematics',
            availability: 'Available',
            location: 'Science Section - Shelf A3',
          },
          {
            id: 2,
            title: 'World History: Ancient Civilizations',
            author: 'Prof. Michael Chen',
            isbn: '978-0-987654-32-1',
            category: 'History',
            availability: 'Available',
            location: 'History Section - Shelf B2',
          },
        ],
        currently_borrowed: [
          {
            id: 3,
            title: 'Introduction to Physics',
            author: 'Dr. Emily Johnson',
            isbn: '978-0-456789-01-2',
            borrowed_date: '2025-09-01',
            due_date: '2025-09-15',
            days_remaining: 0,
            status: 'borrowed',
            category: 'Physics',
            location: 'Science Section - Shelf A1',
          },
        ],
        library_history: [
          {
            id: 4,
            title: 'Chemistry Fundamentals',
            author: 'Dr. Robert Wilson',
            borrowed_date: '2025-08-15',
            returned_date: '2025-08-29',
            status: 'returned',
            category: 'Chemistry',
          },
        ],
        overdue_books: [],
        library_statistics: {
          borrowing_limit: 2,
          currently_borrowed: 1,
          remaining_limit: 1,
          can_borrow_more: true,
          total_borrowed_this_year: 11,
          books_returned_on_time: 10,
          overdue_count: 0,
          total_fines: 0,
        },
        student_info: {
          student_id: studentId,
          student_name: 'Demo Student',
          student_photo: '/data/studentFiles/demo/student_photo.jpg',
          branch_id: 1,
        },
        summary: {
          total_currently_borrowed: 1,
          total_overdue: 0,
          total_history_records: 14,
          can_borrow_more: true,
          borrowing_limit: 2,
          remaining_limit: 1,
        },
        generated_at: new Date().toISOString(),
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_STUDENT_LIBRARY, {
      authCode,
      student_id: studentId,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching child library data:',
      error
    );
    throw error;
  }
};

/**
 * Get comprehensive child data (all academic information)
 * @param {string} authCode - Parent's authentication code
 * @param {number} studentId - Child's student ID
 * @returns {Promise<Object>} - Comprehensive child data
 */
export const getChildComprehensiveData = async (authCode, studentId) => {
  try {
    console.log('📊 PARENT SERVICE: Fetching comprehensive child data');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);
    console.log('👤 PARENT SERVICE: Student ID:', studentId);

    // Fetch all data in parallel for better performance
    const [
      timetableData,
      homeworkData,
      attendanceData,
      gradesData,
      assessmentData,
      bpsData,
      healthInfoData,
      healthRecordsData,
    ] = await Promise.allSettled([
      getChildTimetable(authCode, studentId),
      getChildHomework(authCode, studentId),
      getChildAttendance(authCode, studentId),
      getChildGrades(authCode, studentId),
      getChildAssessment(authCode, studentId),
      getChildBpsProfile(authCode, studentId),
      getChildHealthInfo(authCode, studentId),
      getChildHealthRecords(authCode, studentId),
    ]);

    return {
      success: true,
      student_id: studentId,
      data: {
        timetable:
          timetableData.status === 'fulfilled' ? timetableData.value : null,
        homework:
          homeworkData.status === 'fulfilled' ? homeworkData.value : null,
        attendance:
          attendanceData.status === 'fulfilled' ? attendanceData.value : null,
        grades: gradesData.status === 'fulfilled' ? gradesData.value : null,
        assessment:
          assessmentData.status === 'fulfilled' ? assessmentData.value : null,
        bps_profile: bpsData.status === 'fulfilled' ? bpsData.value : null,
        health_info:
          healthInfoData.status === 'fulfilled' ? healthInfoData.value : null,
        health_records:
          healthRecordsData.status === 'fulfilled'
            ? healthRecordsData.value
            : null,
      },
      errors: {
        timetable:
          timetableData.status === 'rejected' ? timetableData.reason : null,
        homework:
          homeworkData.status === 'rejected' ? homeworkData.reason : null,
        attendance:
          attendanceData.status === 'rejected' ? attendanceData.reason : null,
        grades: gradesData.status === 'rejected' ? gradesData.reason : null,
        assessment:
          assessmentData.status === 'rejected' ? assessmentData.reason : null,
        bps_profile: bpsData.status === 'rejected' ? bpsData.reason : null,
        health_info:
          healthInfoData.status === 'rejected' ? healthInfoData.reason : null,
        health_records:
          healthRecordsData.status === 'rejected'
            ? healthRecordsData.reason
            : null,
      },
    };
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching comprehensive data:',
      error
    );
    throw error;
  }
};

/**
 * Transform timetable data from API format to expected format
 * @param {Object} apiData - Raw API response with day numbers as keys
 * @returns {Object} - Transformed timetable data
 */
const transformTimetableData = (apiData) => {
  try {
    console.log('🔄 PARENT SERVICE: Transforming timetable data:', apiData);

    // Day mapping from numbers to names
    const dayMapping = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday',
    };

    // Time slot mapping
    const timeSlotMapping = {
      1: '07:30-08:15',
      2: '08:15-09:00',
      3: '09:00-09:45',
      4: '10:00-10:45',
      5: '10:45-11:30',
      6: '11:30-12:15',
      7: '13:00-13:45',
      8: '13:45-14:30',
    };

    const transformedData = {};

    // Transform each day's data
    Object.keys(apiData).forEach((dayNumber) => {
      const dayName = dayMapping[parseInt(dayNumber)];
      if (!dayName) return;

      const daySchedule = apiData[dayNumber];
      if (!Array.isArray(daySchedule)) return;

      // Sort by time slot
      const sortedSchedule = daySchedule.sort(
        (a, b) => a.week_time - b.week_time
      );

      // Transform each period
      const transformedPeriods = sortedSchedule.map((period) => ({
        period: period.week_time,
        time: timeSlotMapping[period.week_time] || `Period ${period.week_time}`,
        subject: period.subject_name || 'Unknown Subject',
        teacher: period.teacher_name || 'Unknown Teacher',
        room: period.room || 'TBA',
        subject_id: period.subject_id,
        teacher_id: period.teacher_id,
        timetable_id: period.timetable_id,
        grade_id: period.grade_id,
      }));

      transformedData[dayName] = transformedPeriods;
    });

    console.log(
      '✅ PARENT SERVICE: Timetable data transformed successfully:',
      transformedData
    );
    return transformedData;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error transforming timetable data:',
      error
    );
    return {};
  }
};

/**
 * Utility Functions
 */

/**
 * Save parent data to AsyncStorage
 * @param {Object} parentData - Parent data to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveParentData = async (parentData) => {
  try {
    const parentDataString = JSON.stringify(parentData);
    await AsyncStorage.setItem('parentData', parentDataString);
    console.log('✅ PARENT SERVICE: Parent data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Failed to save parent data:', error);
    return false;
  }
};

/**
 * Get parent data from AsyncStorage
 * @returns {Promise<Object|null>} - Parent data or null
 */
export const getParentData = async () => {
  try {
    const parentDataString = await AsyncStorage.getItem('parentData');
    if (parentDataString) {
      return JSON.parse(parentDataString);
    }
    return null;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Failed to get parent data:', error);
    return null;
  }
};

/**
 * Save children data to AsyncStorage
 * @param {Array} children - Children data to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveChildrenData = async (children) => {
  try {
    const childrenDataString = JSON.stringify(children);
    await AsyncStorage.setItem('childrenData', childrenDataString);
    console.log('✅ PARENT SERVICE: Children data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Failed to save children data:', error);
    return false;
  }
};

/**
 * Get children data from AsyncStorage
 * @returns {Promise<Array>} - Children data array
 */
export const getChildrenData = async () => {
  try {
    const childrenDataString = await AsyncStorage.getItem('childrenData');
    if (childrenDataString) {
      return JSON.parse(childrenDataString);
    }
    return [];
  } catch (error) {
    console.error('❌ PARENT SERVICE: Failed to get children data:', error);
    return [];
  }
};

/**
 * Format child data for display
 * @param {Object} child - Child data object
 * @returns {Object} - Formatted child data
 */
export const formatChildForDisplay = (child) => {
  return {
    ...child,
    displayName: child.student_name || child.name || 'Unknown Student',
    displayClass: child.classroom_name || child.class_name || 'Unknown Class',
    displayYear: child.academic_year || 'Unknown Year',
    displayId: child.student_id || 'Unknown ID',
  };
};

/**
 * Check if parent has access to specific child
 * @param {Array} children - Parent's children array
 * @param {number} studentId - Student ID to check
 * @returns {boolean} - Access status
 */
export const hasAccessToChild = (children, studentId) => {
  return children.some((child) => child.student_id === studentId);
};

/**
 * Get child by student ID
 * @param {Array} children - Parent's children array
 * @param {number} studentId - Student ID to find
 * @returns {Object|null} - Child data or null
 */
export const getChildById = (children, studentId) => {
  return children.find((child) => child.student_id === studentId) || null;
};

/**
 * Get parent calendar data
 * @param {string} authCode - Parent's authentication code
 * @returns {Promise<Object>} - Calendar data
 */
export const getParentCalendarData = async (authCode) => {
  try {
    console.log('📅 PARENT SERVICE: Fetching parent calendar data');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        success: true,
        calendar: {
          events: [
            {
              id: 1,
              title: 'Parent-Teacher Conference',
              date: '2025-09-10',
              time: '14:00',
              type: 'meeting',
              description:
                'Quarterly parent-teacher conference for all students',
              location: 'School Auditorium',
            },
            {
              id: 2,
              title: 'School Holiday',
              date: '2025-09-15',
              type: 'holiday',
              description: 'National Holiday - School Closed',
            },
            {
              id: 3,
              title: 'Sports Day',
              date: '2025-09-20',
              time: '08:00',
              type: 'event',
              description: 'Annual school sports day event',
              location: 'School Sports Ground',
            },
          ],
          total_events: 3,
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_CALENDAR_DATA, {
      authCode,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching calendar data:', error);
    throw error;
  }
};

/**
 * Get parent upcoming calendar events
 * @param {string} authCode - Parent's authentication code
 * @returns {Promise<Object>} - Upcoming events data
 */
export const getParentCalendarUpcoming = async (authCode) => {
  try {
    console.log('📅 PARENT SERVICE: Fetching upcoming calendar events');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      return {
        success: true,
        upcoming_events: [
          {
            id: 1,
            title: 'Parent-Teacher Conference',
            date: '2025-09-10',
            time: '14:00',
            type: 'meeting',
            days_until: 5,
            priority: 'high',
          },
          {
            id: 3,
            title: 'Sports Day',
            date: '2025-09-20',
            time: '08:00',
            type: 'event',
            days_until: 15,
            priority: 'medium',
          },
        ],
        total_upcoming: 2,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_CALENDAR_UPCOMING, {
      authCode,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ PARENT SERVICE: Error fetching upcoming events:', error);
    throw error;
  }
};

/**
 * Get parent personal calendar events
 * @param {string} authCode - Parent's authentication code
 * @returns {Promise<Object>} - Personal calendar data
 */
export const getParentCalendarPersonal = async (authCode) => {
  try {
    console.log('📅 PARENT SERVICE: Fetching personal calendar events');
    console.log('🔑 PARENT SERVICE: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        personal_events: [
          {
            id: 101,
            title: 'Meeting with Math Teacher',
            date: '2025-09-08',
            time: '15:30',
            type: 'appointment',
            student_name: 'Samithidh Koeut',
            teacher_name: 'Ms. Johnson',
            subject: 'Mathematics',
            notes: 'Discuss progress in algebra',
          },
          {
            id: 102,
            title: 'Pickup Reminder',
            date: '2025-09-09',
            time: '16:00',
            type: 'reminder',
            student_name: 'Hengpiseth Sok',
            notes: 'Early pickup for dental appointment',
          },
        ],
        total_personal: 2,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_CALENDAR_PERSONAL, {
      authCode,
    });
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error(
      '❌ PARENT SERVICE: Error fetching personal calendar:',
      error
    );
    throw error;
  }
};

/**
 * Parent Service Export
 */
export default {
  // Core API methods
  getParentChildren,
  getChildTimetable,
  getChildHomework,
  getChildAttendance,
  getChildGrades,
  getChildAssessment,
  getChildBpsProfile,
  getChildHealthInfo,
  getChildHealthRecords,
  getChildLibrary,
  getChildComprehensiveData,

  // Calendar API methods
  getParentCalendarData,
  getParentCalendarUpcoming,
  getParentCalendarPersonal,

  // Utility methods
  saveParentData,
  getParentData,
  saveChildrenData,
  getChildrenData,
  formatChildForDisplay,
  hasAccessToChild,
  getChildById,
};
