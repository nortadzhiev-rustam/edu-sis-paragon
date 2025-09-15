#!/usr/bin/env node

/**
 * Full-Width Cards Validation Script
 * Validates that children cards are full width with modern scroll indicator
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING FULL-WIDTH CARDS IMPLEMENTATION...\n');

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

// Read ParentScreen.js content
let parentScreenContent = '';
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
} catch (error) {
  console.error('Error reading ParentScreen.js:', error.message);
  process.exit(1);
}

// Read LanguageContext.js content
let languageContent = '';
try {
  const languageContextPath = path.join(__dirname, '../src/contexts/LanguageContext.js');
  languageContent = fs.readFileSync(languageContextPath, 'utf8');
} catch (error) {
  console.error('Error reading LanguageContext.js:', error.message);
  process.exit(1);
}

// Check 1: Full-Width Card Layout
addCheck(
  'Student tile container is full width',
  parentScreenContent.includes('width: \'100%\'') && 
  parentScreenContent.includes('studentTileContainer'),
  'Student tile container uses full width'
);

addCheck(
  'Student tile uses horizontal layout',
  parentScreenContent.includes('flexDirection: \'row\'') && 
  parentScreenContent.includes('alignItems: \'center\''),
  'Student tile uses horizontal row layout'
);

addCheck(
  'Student tile has proper minimum height',
  parentScreenContent.includes('minHeight: 120'),
  'Student tile has minimum height of 120'
);

// Check 2: Student Info Container
addCheck(
  'Student info container exists',
  parentScreenContent.includes('studentInfoContainer') && 
  parentScreenContent.includes('flex: 1'),
  'Student info container with flex layout found'
);

addCheck(
  'Student photo has right margin',
  parentScreenContent.includes('marginRight: 16') && 
  parentScreenContent.includes('studentPhoto'),
  'Student photo has proper right margin'
);

addCheck(
  'Student icon container has right margin',
  parentScreenContent.includes('marginRight: 16') && 
  parentScreenContent.includes('studentIconContainer'),
  'Student icon container has proper right margin'
);

// Check 3: Additional Student Information
addCheck(
  'Student class info style exists',
  parentScreenContent.includes('studentClass') && 
  parentScreenContent.includes('color: theme.colors.primary'),
  'Student class style with primary color found'
);

addCheck(
  'Student email style exists',
  parentScreenContent.includes('studentEmail') && 
  parentScreenContent.includes('fontStyle: \'italic\''),
  'Student email style with italic font found'
);

addCheck(
  'Class info rendered in student card',
  parentScreenContent.includes('item.class_name') && 
  parentScreenContent.includes('item.grade_name'),
  'Class name and grade name rendering found'
);

addCheck(
  'Email rendered in student card',
  parentScreenContent.includes('item.email') && 
  parentScreenContent.includes('item.student_email'),
  'Email rendering with fallback found'
);

// Check 4: Vertical Scroll Layout
addCheck(
  'FlatList is vertical (no horizontal prop)',
  !parentScreenContent.includes('horizontal={true}') && 
  !parentScreenContent.includes('horizontal: true'),
  'FlatList horizontal prop removed'
);

addCheck(
  'Vertical scroll indicator disabled',
  parentScreenContent.includes('showsVerticalScrollIndicator={false}'),
  'Vertical scroll indicator properly disabled'
);

addCheck(
  'Item separator component added',
  parentScreenContent.includes('ItemSeparatorComponent') && 
  parentScreenContent.includes('height: 8'),
  'Item separator with 8px height found'
);

// Check 5: Modern Scroll Indicator
addCheck(
  'Scroll indicator container style exists',
  parentScreenContent.includes('scrollIndicatorContainer') && 
  parentScreenContent.includes('justifyContent: \'center\''),
  'Scroll indicator container style found'
);

addCheck(
  'Scroll indicator style exists',
  parentScreenContent.includes('scrollIndicator') && 
  parentScreenContent.includes('borderRadius: 20'),
  'Scroll indicator with rounded corners found'
);

addCheck(
  'Arrow icons imported',
  parentScreenContent.includes('faArrowUp') && 
  parentScreenContent.includes('faArrowDown'),
  'Arrow up and down icons imported'
);

addCheck(
  'Scroll indicator rendered conditionally',
  parentScreenContent.includes('students.length > 3') && 
  parentScreenContent.includes('scrollIndicatorContainer'),
  'Scroll indicator shows when more than 3 students'
);

// Check 6: Translation Keys
addCheck(
  'Scroll indicator translation added',
  languageContent.includes('scrollToSeeMore') && 
  languageContent.includes('Scroll to see more'),
  'Scroll indicator translation found'
);

addCheck(
  'Class not available translation added',
  languageContent.includes('classNotAvailable') && 
  languageContent.includes('Class not available'),
  'Class not available translation found'
);

addCheck(
  'Email not available translation added',
  languageContent.includes('emailNotAvailable') && 
  languageContent.includes('Email not available'),
  'Email not available translation found'
);

// Check 7: List Container Updates
addCheck(
  'List container uses horizontal padding',
  parentScreenContent.includes('paddingHorizontal: 16') && 
  parentScreenContent.includes('listContainer'),
  'List container uses horizontal padding instead of left/right'
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
  console.log('\n🎉 ALL CHECKS PASSED! Full-width cards with modern scroll indicator implemented.');
  console.log('\n📱 Features Implemented:');
  console.log('• Full-width student cards with horizontal layout');
  console.log('• Student photo/icon on the left, info on the right');
  console.log('• Class information and email display');
  console.log('• Vertical scrolling with item separators');
  console.log('• Modern scroll indicator with arrow icons');
  console.log('• Multi-language support for new features');
  console.log('• Responsive design with proper spacing');
} else {
  console.log('\n⚠️  Some checks failed. Please review the full-width cards implementation.');
  process.exit(1);
}
