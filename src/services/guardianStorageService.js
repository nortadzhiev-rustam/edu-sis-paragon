/**
 * Guardian Storage Service
 * Handles persistent storage of guardian login data using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config/env';

/**
 * Store guardian login data after successful authentication
 * @param {Object} guardianData - Guardian information
 * @param {string} authCode - Authentication code
 * @param {Object} childData - Child information
 * @returns {Promise<boolean>} - Success status
 */
export const storeGuardianData = async (guardianData, authCode, childData) => {
  try {
    console.log('💾 GUARDIAN STORAGE: Storing guardian login data...');
    console.log('💾 GUARDIAN STORAGE: Guardian:', guardianData?.name);
    console.log('💾 GUARDIAN STORAGE: Child:', childData?.name);
    console.log('💾 GUARDIAN STORAGE: Has auth code:', !!authCode);

    // Store guardian data
    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.GUARDIAN_DATA,
      JSON.stringify(guardianData)
    );

    // Store auth code
    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.GUARDIAN_AUTH_CODE,
      authCode
    );

    // Store child data
    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.GUARDIAN_CHILD_DATA,
      JSON.stringify(childData)
    );

    // Store login timestamp for session management
    const loginData = {
      timestamp: Date.now(),
      guardianId: guardianData?.pickup_card_id,
      childId: childData?.student_id,
    };
    await AsyncStorage.setItem('guardianLoginData', JSON.stringify(loginData));

    console.log('✅ GUARDIAN STORAGE: Guardian data stored successfully');
    return true;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to store guardian data:', error);
    return false;
  }
};

/**
 * Retrieve stored guardian login data
 * @returns {Promise<Object|null>} - Guardian login data or null
 */
export const getStoredGuardianData = async () => {
  try {
    console.log('🔍 GUARDIAN STORAGE: Retrieving stored guardian data...');

    const [guardianDataStr, authCode, childDataStr, loginDataStr] = await Promise.all([
      AsyncStorage.getItem(Config.STORAGE_KEYS.GUARDIAN_DATA),
      AsyncStorage.getItem(Config.STORAGE_KEYS.GUARDIAN_AUTH_CODE),
      AsyncStorage.getItem(Config.STORAGE_KEYS.GUARDIAN_CHILD_DATA),
      AsyncStorage.getItem('guardianLoginData'),
    ]);

    // Check if all required data exists
    if (!guardianDataStr || !authCode || !childDataStr) {
      console.log('⚠️ GUARDIAN STORAGE: Incomplete guardian data found');
      return null;
    }

    // Parse stored data
    const guardianData = JSON.parse(guardianDataStr);
    const childData = JSON.parse(childDataStr);
    const loginData = loginDataStr ? JSON.parse(loginDataStr) : null;

    // Check if session is still valid (optional - you can set expiry time)
    if (loginData) {
      const sessionAge = Date.now() - loginData.timestamp;
      const maxSessionAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      
      if (sessionAge > maxSessionAge) {
        console.log('⚠️ GUARDIAN STORAGE: Guardian session expired, clearing data');
        await clearGuardianData();
        return null;
      }
    }

    console.log('✅ GUARDIAN STORAGE: Retrieved guardian data successfully');
    console.log('✅ GUARDIAN STORAGE: Guardian:', guardianData?.name);
    console.log('✅ GUARDIAN STORAGE: Child:', childData?.name);

    return {
      guardian: guardianData,
      authCode,
      child: childData,
      loginData,
    };
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to retrieve guardian data:', error);
    // Clear corrupted data
    await clearGuardianData();
    return null;
  }
};

/**
 * Clear all stored guardian data (logout)
 * @returns {Promise<boolean>} - Success status
 */
export const clearGuardianData = async () => {
  try {
    console.log('🧹 GUARDIAN STORAGE: Clearing guardian data...');

    const keysToRemove = [
      Config.STORAGE_KEYS.GUARDIAN_DATA,
      Config.STORAGE_KEYS.GUARDIAN_AUTH_CODE,
      Config.STORAGE_KEYS.GUARDIAN_CHILD_DATA,
      'guardianLoginData',
    ];

    await AsyncStorage.multiRemove(keysToRemove);

    console.log('✅ GUARDIAN STORAGE: Guardian data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to clear guardian data:', error);
    return false;
  }
};

/**
 * Check if guardian is currently logged in
 * @returns {Promise<boolean>} - Login status
 */
export const isGuardianLoggedIn = async () => {
  try {
    const guardianData = await getStoredGuardianData();
    return guardianData !== null;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to check login status:', error);
    return false;
  }
};

/**
 * Update stored guardian data (after profile edit)
 * @param {Object} updatedGuardianData - Updated guardian information
 * @returns {Promise<boolean>} - Success status
 */
export const updateStoredGuardianData = async (updatedGuardianData) => {
  try {
    console.log('📝 GUARDIAN STORAGE: Updating stored guardian data...');

    await AsyncStorage.setItem(
      Config.STORAGE_KEYS.GUARDIAN_DATA,
      JSON.stringify(updatedGuardianData)
    );

    console.log('✅ GUARDIAN STORAGE: Guardian data updated successfully');
    return true;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to update guardian data:', error);
    return false;
  }
};

/**
 * Get guardian auth code only
 * @returns {Promise<string|null>} - Auth code or null
 */
export const getGuardianAuthCode = async () => {
  try {
    const authCode = await AsyncStorage.getItem(Config.STORAGE_KEYS.GUARDIAN_AUTH_CODE);
    return authCode;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Failed to get auth code:', error);
    return null;
  }
};

/**
 * Validate stored guardian data integrity
 * @returns {Promise<boolean>} - Data integrity status
 */
export const validateGuardianDataIntegrity = async () => {
  try {
    const storedData = await getStoredGuardianData();
    
    if (!storedData) {
      return false;
    }

    const { guardian, authCode, child } = storedData;

    // Validate required fields
    const isValid = 
      guardian && 
      guardian.name && 
      guardian.pickup_card_id &&
      authCode &&
      child &&
      child.student_id &&
      child.name;

    if (!isValid) {
      console.log('⚠️ GUARDIAN STORAGE: Data integrity check failed, clearing data');
      await clearGuardianData();
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ GUARDIAN STORAGE: Data integrity validation failed:', error);
    await clearGuardianData();
    return false;
  }
};

export default {
  storeGuardianData,
  getStoredGuardianData,
  clearGuardianData,
  isGuardianLoggedIn,
  updateStoredGuardianData,
  getGuardianAuthCode,
  validateGuardianDataIntegrity,
};
