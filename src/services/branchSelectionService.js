import { Config, buildApiUrl } from '../config/env';
import { makeApiRequest } from '../utils/apiHelpers';

/**
 * Branch Selection Service
 * Handles branch switching and current branch information for mobile app
 */

/**
 * Switch to a different branch
 * @param {string} authCode - User's authentication code
 * @param {number} branchId - Branch ID to switch to
 * @returns {Promise<Object>} - API response with success status and current branch info
 */
export const switchBranch = async (authCode, branchId) => {
  try {
    console.log('🔄 BRANCH SERVICE: Switching to branch:', branchId);
    console.log('🔑 BRANCH SERVICE: Auth code:', authCode ? 'available' : 'missing');

    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    if (!branchId) {
      throw new Error('Branch ID is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SWITCH_BRANCH);
    
    const requestBody = {
      authCode: authCode,
      branch_id: parseInt(branchId, 10)
    };

    console.log('🔄 BRANCH SERVICE: Request body:', requestBody);

    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('✅ BRANCH SERVICE: Switch branch response:', response);

    if (response.success) {
      console.log('✅ BRANCH SERVICE: Branch switched successfully to:', response.current_branch?.branch_name);
      return response;
    } else {
      console.error('❌ BRANCH SERVICE: Failed to switch branch:', response.message);
      throw new Error(response.message || 'Failed to switch branch');
    }

  } catch (error) {
    console.error('❌ BRANCH SERVICE: Error switching branch:', error);
    throw error;
  }
};

/**
 * Get current branch information and accessible branches
 * @param {string} authCode - User's authentication code
 * @returns {Promise<Object>} - API response with current branch and accessible branches
 */
export const getCurrentBranchInfo = async (authCode) => {
  try {
    console.log('📍 BRANCH SERVICE: Getting current branch info');
    console.log('🔑 BRANCH SERVICE: Auth code:', authCode ? 'available' : 'missing');

    if (!authCode) {
      throw new Error('Authentication code is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_CURRENT_BRANCH);
    
    const requestBody = {
      authCode: authCode
    };

    console.log('📍 BRANCH SERVICE: Request body:', requestBody);

    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('✅ BRANCH SERVICE: Current branch info response:', response);

    if (response.success) {
      console.log('✅ BRANCH SERVICE: Current branch:', response.current_branch?.branch_name);
      console.log('✅ BRANCH SERVICE: Accessible branches:', response.accessible_branches?.length || 0);
      return response;
    } else {
      console.error('❌ BRANCH SERVICE: Failed to get current branch info:', response.message);
      throw new Error(response.message || 'Failed to get current branch info');
    }

  } catch (error) {
    console.error('❌ BRANCH SERVICE: Error getting current branch info:', error);
    throw error;
  }
};

/**
 * Check if user has access to multiple branches
 * @param {string} authCode - User's authentication code
 * @returns {Promise<boolean>} - True if user has access to multiple branches
 */
export const hasMultipleBranches = async (authCode) => {
  try {
    const branchInfo = await getCurrentBranchInfo(authCode);
    return branchInfo.accessible_branches && branchInfo.accessible_branches.length > 1;
  } catch (error) {
    console.error('❌ BRANCH SERVICE: Error checking multiple branches:', error);
    return false;
  }
};

/**
 * Get user's accessible branches
 * @param {string} authCode - User's authentication code
 * @returns {Promise<Array>} - Array of accessible branches
 */
export const getAccessibleBranches = async (authCode) => {
  try {
    const branchInfo = await getCurrentBranchInfo(authCode);
    return branchInfo.accessible_branches || [];
  } catch (error) {
    console.error('❌ BRANCH SERVICE: Error getting accessible branches:', error);
    return [];
  }
};

/**
 * Switch branch and update local storage
 * @param {string} authCode - User's authentication code
 * @param {number} branchId - Branch ID to switch to
 * @param {Function} updateCallback - Optional callback to update UI state
 * @returns {Promise<Object>} - API response with success status and current branch info
 */
export const switchBranchWithStorage = async (authCode, branchId, updateCallback = null) => {
  try {
    // Call API to switch branch
    const response = await switchBranch(authCode, branchId);

    if (response.success) {
      // Update local storage with new branch selection
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('selectedBranchId', branchId.toString());
        console.log('✅ BRANCH SERVICE: Updated local storage with branch ID:', branchId);
      } catch (storageError) {
        console.error('⚠️ BRANCH SERVICE: Failed to update local storage:', storageError);
        // Don't throw error for storage failure, API call was successful
      }

      // Call update callback if provided
      if (updateCallback && typeof updateCallback === 'function') {
        try {
          await updateCallback(response);
        } catch (callbackError) {
          console.error('⚠️ BRANCH SERVICE: Callback error:', callbackError);
          // Don't throw error for callback failure, API call was successful
        }
      }
    }

    return response;
  } catch (error) {
    console.error('❌ BRANCH SERVICE: Error in switchBranchWithStorage:', error);
    throw error;
  }
};

/**
 * Branch Selection Service Export
 */
export default {
  switchBranch,
  getCurrentBranchInfo,
  hasMultipleBranches,
  getAccessibleBranches,
  switchBranchWithStorage,
};
