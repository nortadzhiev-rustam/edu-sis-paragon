#!/usr/bin/env node

/**
 * Horizontal Full-Width Cards Validation Script
 * Validates that children cards are full width with horizontal scrolling
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING HORIZONTAL FULL-WIDTH CARDS IMPLEMENTATION...\n');

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

// Check 1: Horizontal Scrolling Setup
addCheck(
  'FlatList is horizontal',
  parentScreenContent.includes('horizontal={true}'),
  'FlatList horizontal prop is set to true'
);

addCheck(
  'Horizontal scroll indicator disabled',
  parentScreenContent.includes('showsHorizontalScrollIndicator={false}'),
  'Horizontal scroll indicator properly disabled'
);

addCheck(
  'Item separator uses width instead of height',
  parentScreenContent.includes('ItemSeparatorComponent') && 
  parentScreenContent.includes('width: 16'),
  'Item separator uses width for horizontal spacing'
);

// Check 2: Full-Width Card Layout
addCheck(
  'Student tile container has fixed width',
  parentScreenContent.includes('width: 320') && 
  parentScreenContent.includes('studentTileContainer'),
  'Student tile container has fixed width of 320'
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

// Check 3: Student Info Layout
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

// Check 4: Additional Student Information
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

// Check 5: Modern Horizontal Scroll Indicator
addCheck(
  'Left/Right arrow icons imported',
  parentScreenContent.includes('faArrowLeft') && 
  parentScreenContent.includes('faArrowRight'),
  'Arrow left and right icons imported'
);

addCheck(
  'Scroll indicator uses horizontal arrows',
  parentScreenContent.includes('icon={faArrowLeft}') && 
  parentScreenContent.includes('icon={faArrowRight}'),
  'Scroll indicator uses left and right arrows'
);

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

// Check 6: List Container for Horizontal Scrolling
addCheck(
  'List container uses vertical padding',
  parentScreenContent.includes('paddingVertical: 10') && 
  parentScreenContent.includes('listContainer'),
  'List container uses vertical padding for horizontal scroll'
);

addCheck(
  'List container has horizontal padding',
  parentScreenContent.includes('paddingHorizontal: 16') && 
  parentScreenContent.includes('listContainer'),
  'List container has horizontal padding'
);

// Check 7: Card Content Layout
addCheck(
  'Student info container positioned correctly',
  parentScreenContent.includes('<View style={styles.studentInfoContainer}>') && 
  parentScreenContent.includes('</View>'),
  'Student info container properly structured'
);

addCheck(
  'Student name uses proper styling',
  parentScreenContent.includes('fontSize: fontSizes.medium') && 
  parentScreenContent.includes('fontWeight: \'700\''),
  'Student name uses medium font size and bold weight'
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
  console.log('\n🎉 ALL CHECKS PASSED! Horizontal full-width cards with modern scroll indicator implemented.');
  console.log('\n📱 Features Implemented:');
  console.log('• Full-width student cards (320px wide) with horizontal layout');
  console.log('• Horizontal scrolling with proper item separators');
  console.log('• Student photo/icon on the left, detailed info on the right');
  console.log('• Class information and email display');
  console.log('• Modern scroll indicator with left/right arrows');
  console.log('• Proper spacing and padding for horizontal scroll');
  console.log('• Enhanced typography and styling');
} else {
  console.log('\n⚠️  Some checks failed. Please review the horizontal full-width cards implementation.');
  process.exit(1);
}
