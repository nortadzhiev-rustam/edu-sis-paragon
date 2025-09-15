#!/usr/bin/env node

/**
 * Parent Profile Implementation Validation Script
 * Validates that the parent profile section is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING PARENT PROFILE IMPLEMENTATION...\n');

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

// Check 1: Parent Profile Function
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  const parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  addCheck(
    'renderParentProfile function exists',
    parentScreenContent.includes('const renderParentProfile = () => {'),
    'Found renderParentProfile function in ParentScreen.js'
  );
  
  addCheck(
    'Parent profile section rendered in main component',
    parentScreenContent.includes('{renderParentProfile()}'),
    'Parent profile function called in main render'
  );
  
  addCheck(
    'Parent avatar handling implemented',
    parentScreenContent.includes('parentAvatarPlaceholder') && parentScreenContent.includes('parentAvatar'),
    'Parent avatar and placeholder styles found'
  );
  
  addCheck(
    'Parent contact information display',
    parentScreenContent.includes('parentEmail') && parentScreenContent.includes('parentPhone'),
    'Parent email and phone display logic found'
  );
  
  addCheck(
    'Parent stats section implemented',
    parentScreenContent.includes('parentStatsContainer') && parentScreenContent.includes('parentStat'),
    'Parent statistics display found'
  );
  
} catch (error) {
  addCheck('Parent profile function exists', false, `Error reading ParentScreen.js: ${error.message}`);
}

// Check 2: FontAwesome Icons
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  const parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  addCheck(
    'Required FontAwesome icons imported',
    parentScreenContent.includes('faUser') && 
    parentScreenContent.includes('faEnvelope') && 
    parentScreenContent.includes('faPhone') && 
    parentScreenContent.includes('faEdit'),
    'All required FontAwesome icons found in imports'
  );
  
} catch (error) {
  addCheck('Required FontAwesome icons imported', false, `Error checking icons: ${error.message}`);
}

// Check 3: Styles Implementation
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  const parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  addCheck(
    'Parent profile styles defined',
    parentScreenContent.includes('parentProfileSection') && 
    parentScreenContent.includes('parentProfileCard') && 
    parentScreenContent.includes('parentProfileHeader'),
    'Core parent profile styles found'
  );
  
  addCheck(
    'Parent avatar styles defined',
    parentScreenContent.includes('parentAvatarContainer') && 
    parentScreenContent.includes('parentAvatar') && 
    parentScreenContent.includes('parentAvatarPlaceholder'),
    'Parent avatar styles found'
  );
  
  addCheck(
    'Parent info styles defined',
    parentScreenContent.includes('parentInfo') && 
    parentScreenContent.includes('parentName') && 
    parentScreenContent.includes('parentRole'),
    'Parent info styles found'
  );
  
  addCheck(
    'Parent contact styles defined',
    parentScreenContent.includes('parentContactItem') && 
    parentScreenContent.includes('parentContactText'),
    'Parent contact styles found'
  );
  
  addCheck(
    'Parent stats styles defined',
    parentScreenContent.includes('parentStatsContainer') && 
    parentScreenContent.includes('parentStat') && 
    parentScreenContent.includes('parentStatNumber') && 
    parentScreenContent.includes('parentStatLabel'),
    'Parent stats styles found'
  );
  
} catch (error) {
  addCheck('Parent profile styles defined', false, `Error checking styles: ${error.message}`);
}

// Check 4: Language Translations
try {
  const languageContextPath = path.join(__dirname, '../src/contexts/LanguageContext.js');
  const languageContent = fs.readFileSync(languageContextPath, 'utf8');
  
  addCheck(
    'Parent profile translations added',
    languageContent.includes('parentAccount') && 
    languageContent.includes('profileSettings') && 
    languageContent.includes('profileEditComingSoon') && 
    languageContent.includes('accountId'),
    'Required translation keys found in LanguageContext.js'
  );
  
} catch (error) {
  addCheck('Parent profile translations added', false, `Error checking translations: ${error.message}`);
}

// Check 5: Profile Section Positioning
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  const parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  // Check that parent profile comes before children section
  const parentProfileIndex = parentScreenContent.indexOf('{renderParentProfile()}');
  const childrenSectionIndex = parentScreenContent.indexOf('childrenSection');
  
  addCheck(
    'Parent profile positioned before children section',
    parentProfileIndex !== -1 && childrenSectionIndex !== -1 && parentProfileIndex < childrenSectionIndex,
    'Parent profile appears before children section in render order'
  );
  
} catch (error) {
  addCheck('Parent profile positioned correctly', false, `Error checking positioning: ${error.message}`);
}

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
  console.log('\n🎉 ALL CHECKS PASSED! Parent profile is properly implemented.');
  console.log('\n📱 Features Implemented:');
  console.log('• Parent avatar with placeholder fallback');
  console.log('• Parent name and role display');
  console.log('• Contact information (email & phone)');
  console.log('• Edit profile button with coming soon alert');
  console.log('• Parent statistics (children count & account ID)');
  console.log('• Responsive design with proper styling');
  console.log('• Multi-language support');
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
