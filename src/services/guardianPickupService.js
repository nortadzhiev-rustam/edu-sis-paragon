/**
 * Guardian & Pickup Combined Service
 * Provides combined workflows for guardian management and pickup requests
 */

import guardianService from './guardianService';
import {
  createParentPickupRequest,
  createMultipleParentPickupRequests,
  getPendingPickupRequests,
  validatePickupRequest,
} from './pickupRequestService';

/**
 * Create guardian and immediately create pickup request
 * @param {string} authCode - Parent authentication code
 * @param {Object} guardianData - Guardian information
 * @param {number} studentId - Student ID for pickup request
 * @returns {Promise<Object>} - Combined response
 */
export const createGuardianAndPickupRequest = async (
  authCode,
  guardianData,
  studentId
) => {
  try {
    console.log('🔄 GUARDIAN-PICKUP: Creating guardian and pickup request...');

    // Step 1: Create guardian
    const guardianResponse = await guardianService.createGuardian(
      authCode,
      guardianData
    );

    if (!guardianResponse.success) {
      throw new Error(
        guardianResponse.message || 'Failed to create guardian'
      );
    }

    console.log('✅ GUARDIAN-PICKUP: Guardian created successfully');

    // Step 2: Create pickup request
    const pickupResponse = await createParentPickupRequest(authCode, studentId);

    if (!pickupResponse.success) {
      console.warn(
        '⚠️ GUARDIAN-PICKUP: Guardian created but pickup request failed'
      );
      return {
        success: true,
        guardian: guardianResponse.guardian,
        pickup: null,
        message: `Guardian created successfully, but pickup request failed: ${pickupResponse.message}`,
        partialSuccess: true,
      };
    }

    console.log('✅ GUARDIAN-PICKUP: Both guardian and pickup request created');

    return {
      success: true,
      guardian: guardianResponse.guardian,
      pickup: pickupResponse.data,
      message: 'Guardian created and pickup request submitted successfully',
      qr_data: {
        guardian_qr: guardianResponse.qr_url,
        pickup_qr: pickupResponse.qr_data,
      },
    };
  } catch (error) {
    console.error('❌ GUARDIAN-PICKUP: Error in combined operation:', error);
    throw error;
  }
};

/**
 * Emergency pickup workflow - creates temporary guardian and immediate pickup
 * @param {string} authCode - Parent authentication code
 * @param {Object} emergencyData - Emergency guardian and pickup data
 * @returns {Promise<Object>} - Emergency response
 */
export const createEmergencyPickup = async (authCode, emergencyData) => {
  try {
    console.log('🚨 EMERGENCY PICKUP: Starting emergency workflow...');

    const { guardianInfo, studentId, emergencyReason } = emergencyData;

    // Create emergency guardian with special marking
    const emergencyGuardianData = {
      ...guardianInfo,
      relation: guardianInfo.relation || 'emergency_contact',
      emergency: true,
      emergency_reason: emergencyReason,
    };

    const result = await createGuardianAndPickupRequest(
      authCode,
      emergencyGuardianData,
      studentId
    );

    if (result.success) {
      return {
        ...result,
        emergency: true,
        message: `Emergency pickup request created. Guardian: ${guardianInfo.name}`,
      };
    }

    throw new Error(result.message || 'Emergency pickup creation failed');
  } catch (error) {
    console.error('❌ EMERGENCY PICKUP: Error:', error);
    throw error;
  }
};

/**
 * Get comprehensive guardian and pickup data for a parent
 * @param {string} authCode - Parent authentication code
 * @param {number} studentId - Optional student ID filter
 * @returns {Promise<Object>} - Combined data
 */
export const getGuardianPickupData = async (authCode, studentId = null) => {
  try {
    console.log('📊 GUARDIAN-PICKUP: Loading comprehensive data...');

    const [guardiansResponse, pickupsResponse, validationResponse] =
      await Promise.allSettled([
        guardianService.listGuardians(authCode),
        getPendingPickupRequests(authCode),
        validatePickupRequest(authCode),
      ]);

    const result = {
      success: true,
      guardians: [],
      pendingPickups: [],
      canMakeRequest: false,
      locationStatus: null,
      summary: {
        totalGuardians: 0,
        activePickups: 0,
        eligibleForPickup: false,
      },
    };

    // Process guardians
    if (
      guardiansResponse.status === 'fulfilled' &&
      guardiansResponse.value.success
    ) {
      let guardians = guardiansResponse.value.guardians || [];
      
      // Filter by student if specified
      if (studentId) {
        guardians = guardians.filter(g => g.student_id === studentId);
      }
      
      result.guardians = guardians;
      result.summary.totalGuardians = guardians.length;
    }

    // Process pending pickups
    if (
      pickupsResponse.status === 'fulfilled' &&
      pickupsResponse.value.success
    ) {
      const pickups = pickupsResponse.value.pending_requests || [];
      result.pendingPickups = pickups;
      result.summary.activePickups = pickups.length;
    }

    // Process validation
    if (
      validationResponse.status === 'fulfilled' &&
      validationResponse.value
    ) {
      result.canMakeRequest = validationResponse.value.canRequest || false;
      result.locationStatus = validationResponse.value;
      result.summary.eligibleForPickup = result.canMakeRequest;
    }

    console.log('✅ GUARDIAN-PICKUP: Data loaded successfully');
    return result;
  } catch (error) {
    console.error('❌ GUARDIAN-PICKUP: Error loading data:', error);
    throw error;
  }
};

/**
 * Bulk create pickup requests for multiple guardians
 * @param {string} authCode - Parent authentication code
 * @param {Array} guardianIds - Array of guardian pickup_card_ids
 * @param {Array} studentIds - Array of student IDs
 * @returns {Promise<Object>} - Bulk operation result
 */
export const createBulkPickupRequests = async (
  authCode,
  guardianIds,
  studentIds
) => {
  try {
    console.log('📦 BULK PICKUP: Creating multiple pickup requests...');

    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const response = await createParentPickupRequest(authCode, studentId);
        results.push({
          studentId,
          success: response.success,
          data: response.data,
          message: response.message,
        });
      } catch (error) {
        errors.push({
          studentId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      results,
      errors,
      summary: {
        total: studentIds.length,
        successful: results.filter(r => r.success).length,
        failed: errors.length,
      },
    };
  } catch (error) {
    console.error('❌ BULK PICKUP: Error:', error);
    throw error;
  }
};

/**
 * Quick pickup request for existing guardian
 * @param {string} authCode - Parent authentication code
 * @param {number} guardianId - Guardian pickup_card_id
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Quick pickup result
 */
export const createQuickPickupRequest = async (
  authCode,
  guardianId,
  studentId
) => {
  try {
    console.log('⚡ QUICK PICKUP: Creating quick pickup request...');

    // Validate guardian exists
    const guardiansResponse = await guardianService.listGuardians(authCode);
    if (!guardiansResponse.success) {
      throw new Error('Failed to verify guardian');
    }

    const guardian = guardiansResponse.guardians.find(
      g => g.pickup_card_id === guardianId
    );

    if (!guardian) {
      throw new Error('Guardian not found');
    }

    // Create pickup request
    const pickupResponse = await createParentPickupRequest(authCode, studentId);

    if (!pickupResponse.success) {
      throw new Error(
        pickupResponse.message || 'Failed to create pickup request'
      );
    }

    return {
      success: true,
      guardian,
      pickup: pickupResponse.data,
      message: `Quick pickup request created for ${guardian.name}`,
    };
  } catch (error) {
    console.error('❌ QUICK PICKUP: Error:', error);
    throw error;
  }
};

/**
 * Get pickup history with guardian information
 * @param {string} authCode - Parent authentication code
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Pickup history with guardian data
 */
export const getPickupHistory = async (authCode, options = {}) => {
  try {
    console.log('📚 PICKUP HISTORY: Loading pickup history...');

    // This would typically call a pickup history API endpoint
    // For now, return mock data structure
    return {
      success: true,
      history: [],
      message: 'Pickup history feature coming soon',
    };
  } catch (error) {
    console.error('❌ PICKUP HISTORY: Error:', error);
    throw error;
  }
};

/**
 * Guardian Pickup Service Export
 */
export default {
  createGuardianAndPickupRequest,
  createEmergencyPickup,
  getGuardianPickupData,
  createBulkPickupRequests,
  createQuickPickupRequest,
  getPickupHistory,
};
