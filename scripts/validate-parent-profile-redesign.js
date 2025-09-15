#!/usr/bin/env node

/**
 * Parent Profile Redesign Validation Script
 * Validates that the parent profile has been simplified and a separate ParentProfileScreen created
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING PARENT PROFILE REDESIGN...\n');

const checks = [];
let passedChecks = 0;
let totalChecks = 0;

function addCheck(description, condition, details = '') {
  totalChecks++;
  const passed = condition;
  if (passed) passedChecks++;
  
  checks.push({
    description,
    passed,
    details,
    icon: passed ? '✅' : '❌'
  });
}

// Read files
let parentScreenContent = '';
let parentProfileScreenContent = '';
let appJsContent = '';
let languageContextContent = '';

try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  const parentProfileScreenPath = path.join(__dirname, '../src/screens/ParentProfileScreen.js');
  parentProfileScreenContent = fs.readFileSync(parentProfileScreenPath, 'utf8');
  
  const appJsPath = path.join(__dirname, '../App.js');
  appJsContent = fs.readFileSync(appJsPath, 'utf8');
  
  const languageContextPath = path.join(__dirname, '../src/contexts/LanguageContext.js');
  languageContextContent = fs.readFileSync(languageContextPath, 'utf8');
} catch (error) {
  console.error('Error reading files:', error.message);
  process.exit(1);
}

// Check 1: ParentProfileScreen exists and is properly structured
addCheck(
  'ParentProfileScreen file exists',
  parentProfileScreenContent.length > 0,
  'Separate parent profile screen created'
);

addCheck(
  'ParentProfileScreen has proper imports',
  parentProfileScreenContent.includes('import React') && 
  parentProfileScreenContent.includes('from \'react-native\'') &&
  parentProfileScreenContent.includes('SafeAreaView') &&
  parentProfileScreenContent.includes('FontAwesomeIcon'),
  'All necessary imports included'
);

addCheck(
  'ParentProfileScreen has navigation header',
  parentProfileScreenContent.includes('headerTitle') && 
  parentProfileScreenContent.includes('backButton') &&
  parentProfileScreenContent.includes('navigation.goBack()'),
  'Proper navigation header with back button'
);

addCheck(
  'ParentProfileScreen has detailed profile sections',
  parentProfileScreenContent.includes('renderProfileHeader') && 
  parentProfileScreenContent.includes('renderInfoSection') &&
  parentProfileScreenContent.includes('contactInformation'),
  'Detailed profile sections implemented'
);

// Check 2: ParentScreen simplified profile
addCheck(
  'ParentScreen profile is simplified',
  !parentScreenContent.includes('parentContactItem') && 
  !parentScreenContent.includes('parentContactText') &&
  !parentScreenContent.includes('parentEditButton'),
  'Complex profile elements removed from ParentScreen'
);

addCheck(
  'ParentScreen profile is touchable',
  parentScreenContent.includes('TouchableOpacity') && 
  parentScreenContent.includes('navigation.navigate(\'ParentProfile\')') &&
  parentScreenContent.includes('activeOpacity={0.7}'),
  'Profile card is touchable and navigates to ParentProfile'
);

addCheck(
  'ParentScreen has simplified layout',
  parentScreenContent.includes('flexDirection: \'row\'') && 
  parentScreenContent.includes('alignItems: \'center\'') &&
  parentScreenContent.includes('tapToViewProfile'),
  'Simplified horizontal layout with tap instruction'
);

// Check 3: Navigation setup
addCheck(
  'ParentProfileScreen imported in App.js',
  appJsContent.includes('import ParentProfileScreen from \'./src/screens/ParentProfileScreen\''),
  'ParentProfileScreen properly imported'
);

addCheck(
  'ParentProfile navigation route exists',
  appJsContent.includes('name=\'ParentProfile\'') && 
  appJsContent.includes('component={ParentProfileScreen}'),
  'Navigation route configured'
);

// Check 4: Translation keys
addCheck(
  'Translation keys added',
  languageContextContent.includes('tapToViewProfile') && 
  languageContextContent.includes('parentProfile') &&
  languageContextContent.includes('contactInformation'),
  'Required translation keys added'
);

// Check 5: Styling improvements
addCheck(
  'ParentScreen styles updated',
  parentScreenContent.includes('borderRadius: 16') && 
  parentScreenContent.includes('padding: 16') &&
  !parentScreenContent.includes('parentProfileHeader'),
  'ParentScreen styles simplified and updated'
);

addCheck(
  'ParentProfileScreen has comprehensive styles',
  parentProfileScreenContent.includes('headerSection') && 
  parentProfileScreenContent.includes('infoSection') &&
  parentProfileScreenContent.includes('createMediumShadow'),
  'ParentProfileScreen has proper styling'
);

// Check 6: User experience improvements
addCheck(
  'Profile avatar size appropriate',
  parentScreenContent.includes('width: 44') && 
  parentScreenContent.includes('height: 44') &&
  parentScreenContent.includes('borderRadius: 22'),
  'Avatar size optimized for compact design'
);

addCheck(
  'Detailed profile has larger avatar',
  parentProfileScreenContent.includes('width: 80') && 
  parentProfileScreenContent.includes('height: 80') &&
  parentProfileScreenContent.includes('borderRadius: 40'),
  'Detailed profile has appropriately sized avatar'
);

addCheck(
  'Edit functionality preserved',
  parentProfileScreenContent.includes('handleEditProfile') && 
  parentProfileScreenContent.includes('profileEditComingSoon'),
  'Edit profile functionality maintained in detailed view'
);

// Check 7: Data handling
addCheck(
  'Parent data loading implemented',
  parentProfileScreenContent.includes('loadParentData') && 
  parentProfileScreenContent.includes('AsyncStorage.getItem') &&
  parentProfileScreenContent.includes('currentUserData'),
  'Proper data loading from AsyncStorage'
);

addCheck(
  'Loading state handled',
  parentProfileScreenContent.includes('loading') && 
  parentProfileScreenContent.includes('setLoading') &&
  parentProfileScreenContent.includes('loadingContainer'),
  'Loading state properly managed'
);

// Check 8: Information display
addCheck(
  'Contact information displayed',
  parentProfileScreenContent.includes('parentEmail') && 
  parentProfileScreenContent.includes('parentPhone') &&
  parentProfileScreenContent.includes('faEnvelope') &&
  parentProfileScreenContent.includes('faPhone'),
  'Contact information properly displayed with icons'
);

addCheck(
  'Additional info displayed',
  parentProfileScreenContent.includes('address') && 
  parentProfileScreenContent.includes('authCode') &&
  parentProfileScreenContent.includes('joinDate'),
  'Additional profile information displayed'
);

// Display Results
console.log('📋 VALIDATION RESULTS:\n');

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.icon} ${check.description}`);
  if (check.details) {
    console.log(`   ${check.details}`);
  }
  console.log('');
});

console.log('📊 SUMMARY:');
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ALL CHECKS PASSED! Parent profile redesign completed successfully.');
  console.log('\n📱 Implementation Summary:');
  console.log('• Simple, compact parent profile card in ParentScreen');
  console.log('• Touchable card navigates to detailed ParentProfileScreen');
  console.log('• Comprehensive profile information in separate screen');
  console.log('• Proper navigation setup and routing');
  console.log('• Clean, modern design with appropriate styling');
  console.log('• Maintained edit functionality in detailed view');
  console.log('• Proper data loading and state management');
} else {
  console.log('\n⚠️  Some checks failed. Please review the parent profile redesign.');
  process.exit(1);
}
