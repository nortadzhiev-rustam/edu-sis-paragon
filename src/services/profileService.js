/**
 * Profile Service
 * Handles user profile management for Teachers, Students, and Parents
 * Implements comprehensive profile update functionality
 */

import { Config } from '../config/env';
import { buildApiUrl, makeApiRequest } from '../utils/apiHelpers';

// Flag to toggle between dummy data and real API
const USE_DUMMY_DATA = Config.DEV.USE_DUMMY_DATA;

// Temporary debug flag - set to true to see what real API returns
const DEBUG_API_RESPONSES = true;

/**
 * Get user profile data
 * @param {string} authCode - User's authentication code
 * @returns {Promise<Object>} - Profile data response
 */
export const getProfile = async (authCode) => {
  try {
    console.log('👤 PROFILE SERVICE: Getting user profile');
    console.log('🔧 PROFILE SERVICE: USE_DUMMY_DATA =', USE_DUMMY_DATA);
    console.log(
      '🔧 PROFILE SERVICE: DEBUG_API_RESPONSES =',
      DEBUG_API_RESPONSES
    );
    console.log(
      '🔑 PROFILE SERVICE: Auth code:',
      authCode ? 'provided' : 'missing'
    );

    if (USE_DUMMY_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return mock profile data
      return {
        success: true,
        data: {
          user_id: 12345,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          address: '123 Main Street, City, Country',
          date_of_birth: '1990-01-01',
          gender: 'male',
          profile_photo:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          user_type: 'teacher',
          created_at: '2023-01-01T00:00:00.000000Z',
          updated_at: '2023-12-01T10:30:00.000000Z',
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_PROFILE, { authCode });
    console.log('🌐 PROFILE SERVICE: Making API call to:', url);

    const response = await makeApiRequest(url, {
      method: 'GET',
    });

    console.log('📡 PROFILE SERVICE: API response:', response);
    console.log(
      '📸 PROFILE SERVICE: Profile photo from API:',
      response?.data?.profile_photo
    );

    return response;
  } catch (error) {
    console.error('❌ PROFILE SERVICE: Error getting profile:', error);
    console.error('❌ PROFILE SERVICE: Error details:', {
      message: error.message,
      status: error.status,
      url: error.url || 'unknown',
    });

    // If API fails, you might want to return a fallback response
    // instead of throwing an error, depending on your app's needs
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} authCode - User's authentication code
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Update response
 */
export const updateProfile = async (authCode, profileData) => {
  try {
    console.log('📝 PROFILE SERVICE: Updating user profile');
    console.log('📝 PROFILE SERVICE: Profile data:', profileData);

    if (USE_DUMMY_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate validation errors for testing
      if (profileData.email === 'test@error.com') {
        return {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
          },
        };
      }

      // Simulate successful update
      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user_id: 12345,
          updated_fields: Object.keys(profileData),
          updated_at: new Date().toISOString(),
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPDATE_PROFILE);
    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        ...profileData,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ PROFILE SERVICE: Error updating profile:', error);
    throw error;
  }
};

/**
 * Upload profile photo
 * @param {string} authCode - User's authentication code
 * @param {Object} photo - Photo file object with uri, type, and fileName
 * @returns {Promise<Object>} - Upload response
 */
export const uploadProfilePhoto = async (authCode, photo) => {
  try {
    console.log('📸 PROFILE SERVICE: Uploading profile photo');
    console.log('📸 PROFILE SERVICE: Photo info:', {
      uri: photo.uri ? 'provided' : 'missing',
      type: photo.type,
      fileName: photo.fileName,
    });

    if (USE_DUMMY_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate file size error for testing
      if (photo.fileName && photo.fileName.includes('large')) {
        return {
          success: false,
          error: 'File size exceeds maximum limit of 5MB',
        };
      }

      // Simulate successful upload
      return {
        success: true,
        message: 'Photo uploaded successfully',
        photo_url: `https://example.com/storage/profile_photos/user_12345_${Date.now()}.jpg`,
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('authCode', authCode);
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || 'profile_photo.jpg',
    });

    const url = buildApiUrl(Config.API_ENDPOINTS.UPLOAD_PROFILE_PHOTO);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('📸 PROFILE SERVICE: Photo upload response:', data);

    return data;
  } catch (error) {
    console.error('❌ PROFILE SERVICE: Error uploading photo:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} authCode - User's authentication code
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} passwordConfirmation - Password confirmation
 * @returns {Promise<Object>} - Change password response
 */
export const changePassword = async (
  authCode,
  currentPassword,
  newPassword,
  passwordConfirmation
) => {
  try {
    console.log('🔐 PROFILE SERVICE: Changing user password');

    if (USE_DUMMY_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate validation errors for testing
      if (currentPassword === 'wrong') {
        return {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            current_password: ['The current password is incorrect.'],
          },
        };
      }

      if (newPassword !== passwordConfirmation) {
        return {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            password_confirmation: [
              'The password confirmation does not match.',
            ],
          },
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            password: ['The password must be at least 8 characters.'],
          },
        };
      }

      // Simulate successful password change
      return {
        success: true,
        message: 'Password changed successfully',
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CHANGE_PASSWORD);
    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authCode,
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ PROFILE SERVICE: Error changing password:', error);
    throw error;
  }
};

/**
 * Get profile completeness information
 * @param {string} authCode - User's authentication code
 * @returns {Promise<Object>} - Profile completeness data
 */
export const getProfileCompleteness = async (authCode) => {
  try {
    console.log('📊 PROFILE SERVICE: Getting profile completeness');

    if (USE_DUMMY_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return mock completeness data
      return {
        success: true,
        data: {
          completeness_percentage: 85.71,
          is_complete: false,
          missing_field_names: ['address'],
          completed_field_names: [
            'name',
            'email',
            'phone',
            'profile_photo',
            'date_of_birth',
            'gender',
          ],
          required_fields_by_type: {
            teacher: ['name', 'email', 'profile_photo', 'phone', 'address'],
            student: [
              'name',
              'email',
              'profile_photo',
              'date_of_birth',
              'gender',
              'phone',
              'address',
              'emergency_contact',
              'emergency_phone',
            ],
            parent: ['name', 'email', 'profile_photo', 'phone', 'address'],
          },
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_PROFILE_COMPLETENESS, {
      authCode,
    });
    const response = await makeApiRequest(url, {
      method: 'GET',
    });

    return response;
  } catch (error) {
    console.error(
      '❌ PROFILE SERVICE: Error getting profile completeness:',
      error
    );
    throw error;
  }
};

/**
 * Validate profile data
 * @param {Object} profileData - Profile data to validate
 * @param {string} userType - User type (teacher, student, parent)
 * @returns {Object} - Validation result with errors
 */
export const validateProfileData = (profileData, userType = 'teacher') => {
  const errors = {};

  // Name validation
  if (!profileData.name || profileData.name.trim().length === 0) {
    errors.name = ['Name is required'];
  } else if (profileData.name.length > 255) {
    errors.name = ['Name must not exceed 255 characters'];
  }

  // Email validation
  if (!profileData.email || profileData.email.trim().length === 0) {
    errors.email = ['Email is required'];
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      errors.email = ['Please enter a valid email address'];
    } else if (profileData.email.length > 255) {
      errors.email = ['Email must not exceed 255 characters'];
    }
  }

  // Phone validation
  if (profileData.phone && profileData.phone.length > 20) {
    errors.phone = ['Phone number must not exceed 20 characters'];
  }

  // Address validation
  if (profileData.address && profileData.address.length > 500) {
    errors.address = ['Address must not exceed 500 characters'];
  }

  // Date of birth validation (for students)
  if (userType === 'student' && profileData.date_of_birth) {
    const birthDate = new Date(profileData.date_of_birth);
    const today = new Date();
    if (birthDate >= today) {
      errors.date_of_birth = ['Date of birth must be before today'];
    }
  }

  // Gender validation
  if (
    profileData.gender &&
    !['male', 'female', 'other'].includes(profileData.gender)
  ) {
    errors.gender = ['Gender must be male, female, or other'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate photo file
 * @param {Object} photo - Photo file object
 * @returns {Object} - Validation result
 */
export const validatePhoto = (photo) => {
  const errors = [];

  if (!photo || !photo.uri) {
    errors.push('Photo file is required');
    return { isValid: false, errors };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (photo.type && !allowedTypes.includes(photo.type.toLowerCase())) {
    errors.push('Photo must be JPEG, JPG, PNG, GIF, or WebP format');
  }

  // Check file size (5MB limit)
  if (photo.fileSize && photo.fileSize > 5 * 1024 * 1024) {
    errors.push('Photo size must not exceed 5MB');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {string} confirmation - Password confirmation
 * @returns {Object} - Validation result
 */
export const validatePassword = (password, confirmation) => {
  const errors = {};

  if (!password || password.length < 8) {
    errors.password = ['Password must be at least 8 characters long'];
  }

  if (password !== confirmation) {
    errors.password_confirmation = ['Password confirmation does not match'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Profile Service Export
 */
export default {
  // Core API methods
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  getProfileCompleteness,

  // Validation methods
  validateProfileData,
  validatePhoto,
  validatePassword,
};
