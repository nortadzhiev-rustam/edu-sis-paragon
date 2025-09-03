/**
 * Guardian Service
 * Handles all guardian-related API calls for the pickup system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Mock data for development/testing
const mockGuardians = [
  {
    pickup_card_id: 1,
    student_id: 123,
    name: 'John Driver',
    relation: 'driver',
    phone: '+1234567890',
    status: 1,
    qr_token: 'a1b2c3d4e5f6g7h8',
    qr_url: 'https://school.com/pickup/qr/login?token=a1b2c3d4e5f6g7h8',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  {
    pickup_card_id: 2,
    student_id: 123,
    name: 'Jane Relative',
    relation: 'aunt',
    phone: '+1987654321',
    status: 1,
    qr_token: 'x9y8z7w6v5u4t3s2',
    qr_url: 'https://school.com/pickup/qr/login?token=x9y8z7w6v5u4t3s2',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-12T11:00:00Z',
  },
];

// Temporary flag for testing with mock data
const USE_MOCK_DATA = false;

/**
 * Make API request with error handling
 */
const makeApiRequest = async (url, options = {}) => {
  try {
    console.log('🔗 GUARDIAN SERVICE: Making API request to:', url);
    console.log('📤 GUARDIAN SERVICE: Request options:', options);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log('📥 GUARDIAN SERVICE: Response received:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: API request failed:', error);
    throw error;
  }
};

/**
 * Create a new guardian for a student
 */
export const createGuardian = async (authCode, guardianData) => {
  try {
    console.log('👤 GUARDIAN SERVICE: Creating guardian:', guardianData);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newGuardian = {
        pickup_card_id: Date.now(),
        student_id: guardianData.student_id,
        name: guardianData.name,
        relation: guardianData.relation,
        phone: guardianData.phone,
        status: 1,
        qr_token: Math.random().toString(36).substring(2, 18),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      newGuardian.qr_url = `https://school.com/pickup/qr/login?token=${newGuardian.qr_token}`;

      return {
        success: true,
        guardian: newGuardian,
        qr_token: newGuardian.qr_token,
        qr_url: newGuardian.qr_url,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_GUARDIAN);
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        ...guardianData,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error creating guardian:', error);
    throw error;
  }
};

/**
 * Get list of guardians for a student or all children
 */
export const listGuardians = async (authCode, studentId = null) => {
  try {
    console.log('📋 GUARDIAN SERVICE: Fetching guardians list');
    console.log('👤 GUARDIAN SERVICE: Auth code:', authCode);
    console.log('🎓 GUARDIAN SERVICE: Student ID filter:', studentId);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filteredGuardians = mockGuardians;
      if (studentId) {
        filteredGuardians = mockGuardians.filter(
          (g) => g.student_id === studentId
        );
      }

      return {
        success: true,
        guardians: filteredGuardians,
      };
    }

    const params = { authCode };
    if (studentId) {
      params.student_id = studentId;
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.LIST_GUARDIANS, params);
    const response = await makeApiRequest(url);

    return response;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error fetching guardians:', error);
    throw error;
  }
};

/**
 * Rotate QR token for a guardian
 */
export const rotateQrToken = async (authCode, pickupCardId) => {
  try {
    console.log(
      '🔄 GUARDIAN SERVICE: Rotating QR token for guardian:',
      pickupCardId
    );

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newToken = Math.random().toString(36).substring(2, 18);
      const newUrl = `https://school.com/pickup/qr/login?token=${newToken}`;

      return {
        success: true,
        qr_token: newToken,
        qr_url: newUrl,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.ROTATE_QR_TOKEN);
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        pickup_card_id: pickupCardId,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error rotating QR token:', error);
    throw error;
  }
};

/**
 * Validate guardian data before submission
 */
export const validateGuardianData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Guardian name is required');
  }

  if (!data.relation || data.relation.trim().length === 0) {
    errors.push('Relation to student is required');
  }

  if (!data.student_id) {
    errors.push('Student selection is required');
  }

  // Validate phone number if provided
  if (data.phone && data.phone.trim().length > 0) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
  }

  // Validate name length
  if (data.name && data.name.trim().length > 100) {
    errors.push('Guardian name must be less than 100 characters');
  }

  // Validate relation length
  if (data.relation && data.relation.trim().length > 50) {
    errors.push('Relation must be less than 50 characters');
  }

  return errors;
};

/**
 * Get common guardian relations
 */
export const getGuardianRelations = () => {
  return [
    { label: 'Driver', value: 'driver' },
    { label: 'Grandparent', value: 'grandparent' },
    { label: 'Uncle', value: 'uncle' },
    { label: 'Aunt', value: 'aunt' },
    { label: 'Sibling', value: 'sibling' },
    { label: 'Family Friend', value: 'family_friend' },
    { label: 'Caregiver', value: 'caregiver' },
    { label: 'Relative', value: 'relative' },
    { label: 'Other', value: 'other' },
  ];
};

/**
 * Format guardian data for display
 */
export const formatGuardianForDisplay = (guardian) => {
  return {
    ...guardian,
    displayName: guardian.name,
    displayRelation:
      guardian.relation.charAt(0).toUpperCase() +
      guardian.relation.slice(1).replace('_', ' '),
    displayPhone: guardian.phone || 'No phone number',
    isActive: guardian.status === 1,
    createdDate: new Date(guardian.created_at).toLocaleDateString(),
    updatedDate: new Date(guardian.updated_at).toLocaleDateString(),
  };
};

/**
 * Check if guardian limit is reached for a student
 */
export const checkGuardianLimit = (guardians, studentId) => {
  const activeGuardians = guardians.filter(
    (g) => g.student_id === studentId && g.status === 1
  );

  return {
    count: activeGuardians.length,
    limit: 5,
    isAtLimit: activeGuardians.length >= 5,
    remaining: Math.max(0, 5 - activeGuardians.length),
  };
};

/**
 * Generate QR code data URL for display
 */
export const generateQrCodeDataUrl = async (qrToken) => {
  try {
    // This would typically use a QR code library like react-native-qrcode-svg
    // For now, return the token as is
    return qrToken;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error generating QR code:', error);
    throw error;
  }
};

/**
 * Upload guardian photo
 */
export const uploadGuardianPhoto = async (authCode, photo) => {
  try {
    console.log('📸 GUARDIAN SERVICE: Uploading guardian photo');

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: true,
        message: 'Photo uploaded successfully',
        photo_url: `https://school.com/storage/guardian_photos/guardian_${Date.now()}.jpg`,
        photo_path: `guardian_photos/guardian_${Date.now()}.jpg`,
      };
    }

    const formData = new FormData();
    formData.append('auth_code', authCode);
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type,
      name: photo.fileName || 'guardian_photo.jpg',
    });

    const url = buildApiUrl('/guardian/upload-photo');
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('📸 GUARDIAN SERVICE: Photo upload response:', data);

    return data;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error uploading photo:', error);
    throw error;
  }
};

/**
 * Complete guardian profile
 */
export const completeGuardianProfile = async (authCode, profileData) => {
  try {
    console.log('👤 GUARDIAN SERVICE: Completing guardian profile');

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        success: true,
        message: 'Profile completed successfully',
        guardian: {
          name: 'John Driver',
          relation: 'driver',
          phone: '+1234567890',
          email: profileData.email,
          national_id: profileData.national_id,
          emergency_contact: profileData.emergency_contact,
          address: profileData.address,
          guardian_photo:
            profileData.photo_path ||
            'https://school.com/storage/guardian_photos/guardian_123.jpg',
          profile_complete: true,
          pickup_card_id: 123,
        },
      };
    }

    const url = buildApiUrl('/guardian/complete-profile');
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        auth_code: authCode,
        ...profileData,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error completing profile:', error);
    throw error;
  }
};

/**
 * Guardian QR Login with profile completion check
 */
export const guardianQrLogin = async (token, deviceInfo) => {
  try {
    console.log('🔐 GUARDIAN SERVICE: Guardian QR login');
    console.log('🔐 GUARDIAN SERVICE: Input token:', token);
    console.log('🔐 GUARDIAN SERVICE: Input deviceInfo:', deviceInfo);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate first-time login requiring profile completion
      return {
        success: true,
        message: 'Welcome! Please complete your profile to continue.',
        auth_code: 'guardian_auth_' + Math.random().toString(36).substring(2),
        user_type: 'guardian',
        first_time_login: true,
        profile_complete: false,
        requires_profile_completion: true,
        next_step: 'complete_profile',
        guardian: {
          name: 'John Driver',
          relation: 'driver',
          phone: '+1234567890',
          email: null,
          national_id: null,
          emergency_contact: null,
          address: null,
          pickup_card_id: 123,
        },
        child: {
          student_id: 104551,
          name: 'Jane Doe',
          branch_id: 2,
        },
      };
    }

    // Validate required parameters
    if (!token?.trim()) {
      throw new Error('Token is required');
    }
    if (!deviceInfo?.deviceToken) {
      throw new Error('Device token is required');
    }
    if (!deviceInfo?.deviceType) {
      throw new Error('Device type is required');
    }

    // Create form data for POST body
    const formParams = {
      token: token.trim(),
      deviceToken: deviceInfo.deviceToken,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName || 'Unknown Device',
    };

    console.log('📤 GUARDIAN SERVICE: Form params object:', formParams);

    const formData = new URLSearchParams();
    formData.append('token', formParams.token);
    formData.append('deviceToken', formParams.deviceToken);
    formData.append('deviceType', formParams.deviceType);
    formData.append('deviceName', formParams.deviceName);

    const url = buildApiUrl('/pickup/qr/login');
    console.log('🔗 GUARDIAN SERVICE: Making API request to:', url);
    console.log('📤 GUARDIAN SERVICE: Form data string:', formData.toString());
    console.log('📤 GUARDIAN SERVICE: Form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: "${value}" (type: ${typeof value})`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formData.toString(),
    });

    console.log('🔐 GUARDIAN SERVICE: Response status:', response.status);
    console.log('🔐 GUARDIAN SERVICE: Response headers:', response.headers);

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GUARDIAN SERVICE: HTTP error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ GUARDIAN SERVICE: Non-JSON response:', responseText);
      throw new Error('Server returned non-JSON response. Check API endpoint.');
    }

    const data = await response.json();
    console.log('🔐 GUARDIAN SERVICE: QR login response:', data);

    return data;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error in QR login:', error);
    throw error;
  }
};

/**
 * Update Guardian Profile
 */
export const updateGuardianProfile = async (authCode, profileData) => {
  try {
    console.log('📝 GUARDIAN SERVICE: Updating guardian profile');
    console.log('📝 GUARDIAN SERVICE: Profile data:', profileData);

    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate successful update
      return {
        success: true,
        message: 'Profile updated successfully',
        guardian: {
          ...profileData,
          pickup_card_id: 6254, // Keep existing pickup card ID
          guardian_photo:
            'http://localhost/storage/guardian_photos/guardian_6254_1234567890.jpg',
        },
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPDATE_GUARDIAN_PROFILE);
    const response = await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        auth_code: authCode,
        ...profileData,
      }),
    });

    return response;
  } catch (error) {
    console.error('❌ GUARDIAN SERVICE: Error updating profile:', error);
    throw error;
  }
};

/**
 * Guardian Service Export
 */
export default {
  createGuardian,
  listGuardians,
  rotateQrToken,
  validateGuardianData,
  getGuardianRelations,
  formatGuardianForDisplay,
  checkGuardianLimit,
  generateQrCodeDataUrl,
  uploadGuardianPhoto,
  completeGuardianProfile,
  guardianQrLogin,
  updateGuardianProfile,
};
