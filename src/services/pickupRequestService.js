/**
 * Pickup Request Service
 * Handles pickup request operations for both parents and guardians
 */

import Config from '../config/env';
import { buildApiUrl, makeApiRequest } from '../utils/apiHelpers';
import {
  getCurrentLocation,
  validatePickupLocation,
  getSchoolLocation,
  formatDistance,
} from './locationService';

// Mock data flag - set to false when connecting to real API
const USE_MOCK_DATA = false;

/**
 * Create multiple pickup requests for parent
 * @param {string} authCode - Parent authentication code
 * @param {Array<number>} studentIds - Array of student IDs
 * @returns {Promise<Object>} - API response
 */
export const createMultipleParentPickupRequests = async (
  authCode,
  studentIds
) => {
  try {
    console.log('🚗 PICKUP REQUEST: Creating multiple parent pickup requests');
    console.log('🔑 PICKUP REQUEST: Auth code:', authCode);
    console.log('👨‍🎓 PICKUP REQUEST: Student IDs:', studentIds);

    // Get current location
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      throw new Error(
        'Unable to get your current location. Please check location permissions.'
      );
    }

    // Validate location is within pickup range
    const locationValidation = validatePickupLocation(currentLocation);
    if (!locationValidation.isValid) {
      throw new Error(
        `You are too far from campus. Please make request when you are at least 150 meters close to campus! [${formatDistance(
          locationValidation.distance
        )}]`
      );
    }

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful response for multiple students
      const mockResults = studentIds.map((studentId, index) => ({
        student_id: studentId,
        student_name: `Student ${index + 1}`,
        success: true,
        message: 'Pickup request created successfully',
        request_id: Date.now() + index,
        distance: formatDistance(locationValidation.distance),
      }));

      return {
        success: true,
        message: `Processed ${studentIds.length} successful and 0 failed requests`,
        summary: {
          total_requested: studentIds.length,
          successful: studentIds.length,
          failed: 0,
        },
        results: mockResults,
        parent_info: {
          name: 'John Smith',
          phone: '+1234567890',
        },
      };
    }

    // Real API call
    const url = buildApiUrl(
      Config.API_ENDPOINTS.PARENT_CREATE_MULTIPLE_PICKUP_REQUESTS
    );

    const requestBody = {
      authCode,
      student_ids: studentIds,
      lat: currentLocation.latitude,
      lon: currentLocation.longitude,
    };

    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response;
  } catch (error) {
    console.error(
      '❌ PICKUP REQUEST: Error creating multiple pickup requests:',
      error
    );
    throw error;
  }
};

/**
 * Create a pickup request for parent (single child)
 * @param {string} authCode - Parent authentication code
 * @param {number} studentId - Student ID (optional for parents with single child)
 * @returns {Promise<Object>} - API response
 */
export const createParentPickupRequest = async (authCode, studentId = null) => {
  try {
    console.log('🚗 PICKUP REQUEST: Creating parent pickup request');
    console.log('🔑 PICKUP REQUEST: Auth code:', authCode);
    console.log('👨‍🎓 PICKUP REQUEST: Student ID:', studentId);

    // Get current location
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      throw new Error(
        'Unable to get your current location. Please check location permissions.'
      );
    }

    // Validate location is within pickup range
    const locationValidation = validatePickupLocation(currentLocation);
    if (!locationValidation.isValid) {
      throw new Error(
        `You are too far from campus. Please make request when you are at least 150 meters close to campus! [${formatDistance(
          locationValidation.distance
        )}]`
      );
    }

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful response
      return {
        success: true,
        message: 'Your request recorded for student: [Alice Smith]',
        data: {
          request_id: Date.now(),
          student_name: 'Alice Smith',
          student_id: studentId || 12345,
          parent_name: 'John Smith',
          request_time: new Date().toISOString(),
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            distance_from_campus: locationValidation.distance,
          },
          status: 'pending',
        },
      };
    }

    // Real API call
    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_CREATE_PICKUP_REQUEST, {
      authCode,
      lat: currentLocation.latitude,
      lon: currentLocation.longitude,
      ...(studentId && { student_id: studentId }),
    });

    const response = await makeApiRequest(url);
    return response;
  } catch (error) {
    console.error(
      '❌ PICKUP REQUEST: Error creating parent pickup request:',
      error
    );
    throw error;
  }
};

/**
 * Create a pickup request for guardian
 * @param {string} authCode - Guardian authentication code
 * @param {string} qrToken - Guardian QR token (optional)
 * @returns {Promise<Object>} - API response
 */
export const createGuardianPickupRequest = async (authCode, qrToken = null) => {
  try {
    console.log('🚗 PICKUP REQUEST: Creating guardian pickup request');
    console.log('🔑 PICKUP REQUEST: Auth code:', authCode);
    console.log(
      '🔑 PICKUP REQUEST: QR Token:',
      qrToken ? 'provided' : 'not provided'
    );

    // Get current location
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      throw new Error(
        'Unable to get your current location. Please check location permissions.'
      );
    }

    // Validate location is within pickup range
    const locationValidation = validatePickupLocation(currentLocation);
    if (!locationValidation.isValid) {
      throw new Error(
        `You are too far from campus. Please make request when you are at least 150 meters close to campus! [${formatDistance(
          locationValidation.distance
        )}]`
      );
    }

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful response
      return {
        success: true,
        message: 'Your request recorded for student: [Jane Doe]',
        data: {
          request_id: Date.now(),
          student_name: 'Jane Doe',
          student_id: 104551,
          guardian_name: 'John Driver',
          request_time: new Date().toISOString(),
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            distance_from_campus: locationValidation.distance,
          },
          status: 'pending',
        },
      };
    }

    // Real API call
    const requestParams = {
      authCode,
      lat: currentLocation.latitude,
      lon: currentLocation.longitude,
    };

    // Add qr_token if provided
    if (qrToken) {
      requestParams.qr_token = qrToken;
    }

    const url = buildApiUrl(
      Config.API_ENDPOINTS.GUARDIAN_CREATE_PICKUP_REQUEST,
      requestParams
    );

    const response = await makeApiRequest(url);
    return response;
  } catch (error) {
    console.error(
      '❌ PICKUP REQUEST: Error creating guardian pickup request:',
      error
    );
    throw error;
  }
};

/**
 * Generic pickup request creation (determines user type automatically)
 * @param {string} authCode - Authentication code
 * @param {string} userType - User type ('parent' or 'guardian')
 * @param {number} studentId - Student ID (for parents with multiple children)
 * @param {string} qrToken - QR token (for guardians, optional)
 * @returns {Promise<Object>} - API response
 */
export const createPickupRequest = async (
  authCode,
  userType,
  studentId = null,
  qrToken = null
) => {
  try {
    console.log(
      '🚗 PICKUP REQUEST: Creating pickup request for user type:',
      userType
    );

    if (userType === 'parent') {
      return await createParentPickupRequest(authCode, studentId);
    } else if (userType === 'guardian') {
      return await createGuardianPickupRequest(authCode, qrToken);
    } else {
      throw new Error('Invalid user type. Must be "parent" or "guardian".');
    }
  } catch (error) {
    console.error('❌ PICKUP REQUEST: Error creating pickup request:', error);
    throw error;
  }
};

/**
 * Check if user can make a pickup request (location and business rules)
 * @param {string} authCode - Authentication code
 * @returns {Promise<Object>} - Validation result
 */
export const validatePickupRequest = async (authCode) => {
  try {
    console.log('✅ PICKUP REQUEST: Validating pickup request eligibility');

    // Get school location first
    const schoolLocation = await getSchoolLocation(authCode);
    if (!schoolLocation) {
      console.warn(
        '⚠️ PICKUP REQUEST: Could not fetch school location, using defaults'
      );
    }

    // Get current location
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      return {
        canRequest: false,
        reason: 'location_unavailable',
        message:
          'Unable to get your current location. Please check location permissions.',
        schoolLocation,
      };
    }

    // Validate location is within pickup range
    const locationValidation = validatePickupLocation(
      currentLocation,
      schoolLocation
    );
    if (!locationValidation.isValid) {
      return {
        canRequest: false,
        reason: 'too_far_from_campus',
        message: locationValidation.message,
        distance: locationValidation.distance, // Keep as number for formatting in UI
        threshold: locationValidation.threshold,
        schoolLocation,
      };
    }

    // Check user permissions from school location API
    if (
      schoolLocation?.user_info &&
      !schoolLocation.user_info.can_make_pickup_request
    ) {
      return {
        canRequest: false,
        reason: 'permission_denied',
        message: 'You do not have permission to make pickup requests.',
        schoolLocation,
      };
    }

    // Additional business rule validations could be added here
    // For example: check if user already made a request today

    return {
      canRequest: true,
      reason: 'eligible',
      message: 'You are eligible to make a pickup request',
      distance: locationValidation.distance, // Keep as number for formatting in UI
      location: currentLocation,
      schoolLocation,
    };
  } catch (error) {
    console.error('❌ PICKUP REQUEST: Error validating pickup request:', error);
    return {
      canRequest: false,
      reason: 'validation_error',
      message: 'Error validating pickup request. Please try again.',
    };
  }
};

/**
 * Parse API response message to extract student name
 * @param {string} message - API response message
 * @returns {string|null} - Extracted student name or null
 */
export const extractStudentNameFromResponse = (message) => {
  try {
    // Extract student name from message like "Your request recorded for student: [Alice Smith]"
    const match = message.match(/\[([^\]]+)\]/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('❌ PICKUP REQUEST: Error extracting student name:', error);
    return null;
  }
};

/**
 * Format pickup request response for display
 * @param {Object} response - API response
 * @returns {Object} - Formatted response
 */
export const formatPickupRequestResponse = (response) => {
  try {
    const studentName = extractStudentNameFromResponse(response.message);

    return {
      success: response.success,
      message: response.message,
      studentName,
      timestamp: new Date().toISOString(),
      data: response.data || {},
    };
  } catch (error) {
    console.error('❌ PICKUP REQUEST: Error formatting response:', error);
    return {
      success: false,
      message: 'Error processing pickup request response',
      studentName: null,
      timestamp: new Date().toISOString(),
      data: {},
    };
  }
};

/**
 * Generate QR code for parent pickup
 * @param {string} authCode - Parent authentication code
 * @returns {Promise<Object>} - QR code data
 */
export const generateParentPickupQR = async (authCode) => {
  try {
    console.log('📱 PICKUP QR: Generating parent QR code');
    console.log('🔑 PICKUP QR: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock QR code response
      return {
        success: true,
        message: 'Parent QR code generated successfully',
        parent_info: {
          name: 'John Smith',
          phone: '+1234567890',
          email: 'john@example.com',
        },
        children: [
          {
            id: 123456,
            name: 'John Smith Jr.',
            photo: '/path/to/photo.jpg',
          },
          {
            id: 789012,
            name: 'Jane Smith',
            photo: '/path/to/photo2.jpg',
          },
        ],
        qr_token: authCode,
        qr_url: `https://school.com/pickup/qr/parent?token=${authCode}`,
        instructions:
          'Show this QR code to staff during pickup. Make sure you have a pending pickup request first.',
      };
    }

    // Real API call
    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_GENERATE_QR);

    const requestBody = {
      authCode,
    };

    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response;
  } catch (error) {
    console.error('❌ PICKUP QR: Error generating QR code:', error);
    throw error;
  }
};

/**
 * Get pending pickup requests for parent
 * @param {string} authCode - Parent authentication code
 * @returns {Promise<Object>} - Pending requests data
 */
export const getPendingPickupRequests = async (authCode) => {
  try {
    console.log('📋 PICKUP REQUESTS: Getting pending requests');
    console.log('🔑 PICKUP REQUESTS: Auth code:', authCode);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock pending requests
      return {
        success: true,
        pending_requests: [
          {
            request_id: 999,
            student_id: 123456,
            student_name: 'John Smith Jr.',
            request_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            status: 'pending',
            distance: '45m',
          },
          {
            request_id: 1000,
            student_id: 789012,
            student_name: 'Jane Smith',
            request_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            status: 'pending',
            distance: '45m',
          },
        ],
        parent_info: {
          name: 'John Smith',
          phone: '+1234567890',
          email: 'john@example.com',
        },
      };
    }

    // Real API call
    const url = buildApiUrl(Config.API_ENDPOINTS.GET_PENDING_PICKUP_REQUESTS, {
      authCode,
    });

    const response = await makeApiRequest(url);

    // Transform the real API response to match expected format for backward compatibility
    if (response.success && response.pending_requests) {
      // Transform each pending request to match expected format
      const transformedRequests = response.pending_requests.map((request) => ({
        request_id: request.request_id,
        student_id: request.student.id,
        student_name: request.student.name,
        student_photo: request.student.photo,
        branch_id: request.student.branch_id,
        request_time: `${response.date} ${request.created_at}`, // Combine date and time
        status: request.status,
        distance: request.distance,
        request_date: request.request_date,
        created_at: request.created_at,
      }));

      return {
        success: response.success,
        pending_requests: transformedRequests,
        parent_info: response.parent_info,
        summary: response.summary,
        can_generate_qr: response.can_generate_qr,
        message: response.message,
        date: response.date,
        completed_requests: response.completed_requests || [],
      };
    }

    return response;
  } catch (error) {
    console.error('❌ PICKUP REQUESTS: Error getting pending requests:', error);
    throw error;
  }
};

/**
 * Get parent pickup history
 * @param {string} authCode - Parent authentication code
 * @param {Object} options - Query options
 * @param {string} options.start_date - Start date (Y-m-d format)
 * @param {string} options.end_date - End date (Y-m-d format)
 * @param {number} options.student_id - Filter by specific child
 * @param {number} options.limit - Number of records to return (default: 50, max: 200)
 * @param {number} options.page - Page number for pagination (default: 1)
 * @returns {Promise<Object>} - API response with pickup history
 */
export const getParentPickupHistory = async (authCode, options = {}) => {
  try {
    console.log('📚 PARENT PICKUP HISTORY: Loading pickup history...');
    console.log('🔑 PARENT PICKUP HISTORY: Auth code:', authCode);
    console.log('⚙️ PARENT PICKUP HISTORY: Options:', options);

    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response
      return {
        success: true,
        parent_info: {
          name: 'John Doe',
          phone: '+855123456789',
        },
        date_range: {
          start_date: options.start_date || '2024-01-01',
          end_date: options.end_date || new Date().toISOString().split('T')[0],
        },
        summary: {
          total_pickups: 15,
          parent_pickups: 10,
          guardian_pickups: 5,
          children_count: 2,
        },
        pagination: {
          current_page: options.page || 1,
          total_pages: 1,
          total_records: 15,
          per_page: options.limit || 50,
          has_next_page: false,
          has_previous_page: false,
        },
        pickup_history: [
          {
            log_id: 123,
            student: {
              id: 456,
              name: 'Jane Doe',
              photo: '/path/to/photo.jpg',
              branch_id: 1,
            },
            pickup_person: {
              name: 'Parent',
              relation: 'Parent',
              type: 'parent',
            },
            processed_by: {
              staff_id: 789,
              staff_name: 'Teacher Smith',
            },
            pickup_date: '2024-01-15',
            pickup_time: '15:30:00',
            pickup_datetime: '2024-01-15 15:30:00',
            formatted_date: 'Jan 15, 2024',
            formatted_time: '3:30 PM',
          },
          {
            log_id: 124,
            student: {
              id: 457,
              name: 'John Doe Jr.',
              photo: '/path/to/photo2.jpg',
              branch_id: 1,
            },
            pickup_person: {
              name: 'Mary Johnson',
              relation: 'Grandmother',
              type: 'guardian',
            },
            processed_by: {
              staff_id: 790,
              staff_name: 'Teacher Brown',
            },
            pickup_date: '2024-01-14',
            pickup_time: '16:00:00',
            pickup_datetime: '2024-01-14 16:00:00',
            formatted_date: 'Jan 14, 2024',
            formatted_time: '4:00 PM',
          },
        ],
      };
    }

    // Real API call
    const url = buildApiUrl(Config.API_ENDPOINTS.PARENT_PICKUP_HISTORY, {
      authCode,
      ...options,
    });

    console.log('🌐 PARENT PICKUP HISTORY: API URL:', url);

    const response = await makeApiRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ PARENT PICKUP HISTORY: API response:', response);
    return response;
  } catch (error) {
    console.error('❌ PARENT PICKUP HISTORY: Error:', error);
    throw error;
  }
};

/**
 * Get guardian pickup history
 * @param {string} authCode - Guardian authentication code
 * @param {Object} options - Query options
 * @param {string} options.start_date - Start date (Y-m-d format)
 * @param {string} options.end_date - End date (Y-m-d format)
 * @param {number} options.limit - Number of records to return (default: 50, max: 200)
 * @param {number} options.page - Page number for pagination (default: 1)
 * @returns {Promise<Object>} - API response with pickup history
 */
export const getGuardianPickupHistory = async (authCode, options = {}) => {
  try {
    console.log('📚 GUARDIAN PICKUP HISTORY: Loading pickup history...');
    console.log('🔑 GUARDIAN PICKUP HISTORY: Auth code:', authCode);
    console.log('⚙️ GUARDIAN PICKUP HISTORY: Options:', options);

    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response
      return {
        success: true,
        guardian_info: {
          name: 'Mary Johnson',
          relation: 'Grandmother',
          phone: '+855987654321',
          email: 'mary@example.com',
        },
        student_info: {
          id: 456,
          name: 'Jane Doe',
          photo: '/path/to/photo.jpg',
        },
        date_range: {
          start_date: options.start_date || '2024-01-01',
          end_date: options.end_date || new Date().toISOString().split('T')[0],
        },
        summary: {
          total_pickups: 8,
          guardian_name: 'Mary Johnson',
        },
        pagination: {
          current_page: options.page || 1,
          total_pages: 1,
          total_records: 8,
          per_page: options.limit || 50,
          has_next_page: false,
          has_previous_page: false,
        },
        pickup_history: [
          {
            log_id: 124,
            student: {
              id: 456,
              name: 'Jane Doe',
              photo: '/path/to/photo.jpg',
              branch_id: 1,
            },
            pickup_person: {
              name: 'Mary Johnson',
              relation: 'Grandmother',
              type: 'guardian',
            },
            processed_by: {
              staff_id: 789,
              staff_name: 'Teacher Smith',
            },
            pickup_date: '2024-01-14',
            pickup_time: '16:00:00',
            pickup_datetime: '2024-01-14 16:00:00',
            formatted_date: 'Jan 14, 2024',
            formatted_time: '4:00 PM',
          },
        ],
      };
    }

    // Real API call
    const url = buildApiUrl(Config.API_ENDPOINTS.GUARDIAN_PICKUP_HISTORY, {
      authCode,
      ...options,
    });

    console.log('🌐 GUARDIAN PICKUP HISTORY: API URL:', url);

    const response = await makeApiRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ GUARDIAN PICKUP HISTORY: API response:', response);
    return response;
  } catch (error) {
    console.error('❌ GUARDIAN PICKUP HISTORY: Error:', error);
    throw error;
  }
};

/**
 * Pickup Request Service Export
 */
export default {
  createParentPickupRequest,
  createMultipleParentPickupRequests,
  createGuardianPickupRequest,
  createPickupRequest,
  validatePickupRequest,
  generateParentPickupQR,
  getPendingPickupRequests,
  getParentPickupHistory,
  getGuardianPickupHistory,
  extractStudentNameFromResponse,
  formatPickupRequestResponse,
};
