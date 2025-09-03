/**
 * Login Debugger Utility
 * Comprehensive debugging for login issues on physical devices
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { getDeviceToken } from './messaging';
import { getLoginDeviceInfo } from './deviceInfo';
import { diagnoseNetworkIssues, testApiConnectivity } from './networkConfig';
import { Config } from '../config/env';

/**
 * Comprehensive login debugging
 */
export const debugLogin = async (username, password) => {
  console.log('🔍 STARTING COMPREHENSIVE LOGIN DEBUG...');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    isPhysicalDevice: Device.isDevice,
    username: username ? 'provided' : 'missing',
    password: password ? 'provided' : 'missing',
    steps: [],
    issues: [],
    recommendations: [],
  };
  
  try {
    // Step 1: Device Information
    debugInfo.steps.push('Collecting device information...');
    const deviceInfo = await getLoginDeviceInfo();
    debugInfo.deviceInfo = deviceInfo;
    console.log('📱 DEVICE INFO:', deviceInfo);
    
    // Step 2: Network Diagnosis
    debugInfo.steps.push('Diagnosing network connectivity...');
    const networkDiagnosis = await diagnoseNetworkIssues(Config.API_BASE_URL);
    debugInfo.networkDiagnosis = networkDiagnosis;
    
    if (networkDiagnosis.issues.length > 0) {
      debugInfo.issues.push(...networkDiagnosis.issues);
      debugInfo.recommendations.push(...networkDiagnosis.suggestions);
    }
    
    // Step 3: Firebase Token
    debugInfo.steps.push('Checking Firebase device token...');
    try {
      const deviceToken = await getDeviceToken();
      debugInfo.deviceToken = {
        available: !!deviceToken,
        length: deviceToken?.length || 0,
        type: typeof deviceToken,
        preview: deviceToken ? deviceToken.substring(0, 30) + '...' : 'none',
      };
      
      if (!deviceToken) {
        debugInfo.issues.push('Firebase device token not available');
        debugInfo.recommendations.push('Check Firebase configuration and permissions');
      }
    } catch (tokenError) {
      debugInfo.issues.push(`Firebase token error: ${tokenError.message}`);
      debugInfo.deviceToken = { error: tokenError.message };
    }
    
    // Step 4: API Connectivity Test
    debugInfo.steps.push('Testing API connectivity...');
    const apiTest = await testApiConnectivity(Config.API_BASE_URL);
    debugInfo.apiConnectivity = apiTest;
    
    if (!apiTest.success) {
      debugInfo.issues.push(`API not reachable: ${apiTest.error}`);
      
      // Specific recommendations based on error type
      if (apiTest.errorType === 'TypeError' && apiTest.error.includes('Network request failed')) {
        debugInfo.recommendations.push('Network request failed - check if server is running');
        debugInfo.recommendations.push('Verify firewall settings allow connections on port 8000');
      }
      
      if (Config.API_BASE_URL.includes('127.0.0.1') && Device.isDevice) {
        debugInfo.recommendations.push('Replace 127.0.0.1 with your computer\'s IP address for physical devices');
      }
    }
    
    // Step 5: Storage Check
    debugInfo.steps.push('Checking AsyncStorage...');
    try {
      const testKey = 'debug_test_' + Date.now();
      await AsyncStorage.setItem(testKey, 'test');
      await AsyncStorage.removeItem(testKey);
      debugInfo.asyncStorage = { working: true };
    } catch (storageError) {
      debugInfo.asyncStorage = { working: false, error: storageError.message };
      debugInfo.issues.push(`AsyncStorage error: ${storageError.message}`);
    }
    
    // Step 6: Platform-specific checks
    debugInfo.steps.push('Running platform-specific checks...');
    if (Platform.OS === 'android') {
      debugInfo.platformChecks = {
        networkSecurityConfig: 'Check if network_security_config.xml allows HTTP traffic',
        cleartextTraffic: 'Verify android:usesCleartextTraffic="true" in manifest',
      };
      
      if (!Device.isDevice) {
        debugInfo.recommendations.push('For Android emulator, try using 10.0.2.2 instead of 127.0.0.1');
      }
    } else if (Platform.OS === 'ios') {
      debugInfo.platformChecks = {
        ats: 'Check App Transport Security settings for HTTP connections',
        simulator: Device.isDevice ? 'Physical device' : 'Simulator',
      };
    }
    
    // Generate summary
    debugInfo.summary = {
      totalIssues: debugInfo.issues.length,
      criticalIssues: debugInfo.issues.filter(issue => 
        issue.includes('not reachable') || 
        issue.includes('Network request failed') ||
        issue.includes('127.0.0.1')
      ).length,
      hasNetworkIssues: debugInfo.issues.some(issue => 
        issue.includes('network') || issue.includes('connectivity')
      ),
      hasTokenIssues: debugInfo.issues.some(issue => 
        issue.includes('token') || issue.includes('Firebase')
      ),
    };
    
  } catch (error) {
    debugInfo.error = error.message;
    debugInfo.issues.push(`Debug process error: ${error.message}`);
  }
  
  console.log('📊 LOGIN DEBUG COMPLETE:', debugInfo);
  return debugInfo;
};

/**
 * Quick network test for login screen
 */
export const quickNetworkTest = async () => {
  try {
    const result = await testApiConnectivity(Config.API_BASE_URL);
    return {
      success: result.success,
      message: result.success 
        ? 'API server is reachable' 
        : `Cannot reach server: ${result.error}`,
      details: result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Network test failed: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * Get IP address suggestions for current network
 */
export const getIpSuggestions = () => {
  const suggestions = [];
  
  if (Platform.OS === 'android' && !Device.isDevice) {
    suggestions.push({
      ip: '10.0.2.2:8000',
      description: 'Android Emulator Host',
      recommended: true,
    });
  }
  
  // Common local network IPs
  const commonIPs = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102',
    '192.168.0.100', '192.168.0.101', '192.168.0.102',
    '172.16.0.100', '172.16.0.101',
  ];
  
  commonIPs.forEach(ip => {
    suggestions.push({
      ip: `${ip}:8000`,
      description: `Local Network (${ip})`,
      recommended: false,
    });
  });
  
  return suggestions;
};

/**
 * Format debug info for display
 */
export const formatDebugInfo = (debugInfo) => {
  const lines = [];
  
  lines.push(`🔍 Login Debug Report - ${debugInfo.timestamp}`);
  lines.push(`📱 Platform: ${debugInfo.platform} (${debugInfo.isPhysicalDevice ? 'Physical Device' : 'Simulator'})`);
  lines.push('');
  
  if (debugInfo.issues.length > 0) {
    lines.push('❌ Issues Found:');
    debugInfo.issues.forEach(issue => lines.push(`  • ${issue}`));
    lines.push('');
  }
  
  if (debugInfo.recommendations.length > 0) {
    lines.push('💡 Recommendations:');
    debugInfo.recommendations.forEach(rec => lines.push(`  • ${rec}`));
    lines.push('');
  }
  
  lines.push('📊 Technical Details:');
  lines.push(`  • API URL: ${Config.API_BASE_URL}`);
  lines.push(`  • API Reachable: ${debugInfo.apiConnectivity?.success ? 'Yes' : 'No'}`);
  lines.push(`  • Device Token: ${debugInfo.deviceToken?.available ? 'Available' : 'Missing'}`);
  lines.push(`  • AsyncStorage: ${debugInfo.asyncStorage?.working ? 'Working' : 'Error'}`);
  
  return lines.join('\n');
};
