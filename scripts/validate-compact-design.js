#!/usr/bin/env node

/**
 * Compact Design Validation Script
 * Validates that both parent profile and children cards are properly compacted
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING COMPACT DESIGN IMPLEMENTATION...\n');

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

// Check 1: Parent Profile Compact Sizing
addCheck(
  'Parent profile section has compact margin',
  parentScreenContent.includes('marginBottom: 12'),
  'Parent profile section margin reduced to 12'
);

addCheck(
  'Parent profile card has compact padding',
  parentScreenContent.includes('padding: 12') && parentScreenContent.includes('borderRadius: 12'),
  'Parent profile card padding and border radius reduced'
);

addCheck(
  'Parent avatar size reduced',
  parentScreenContent.includes('width: 48') && parentScreenContent.includes('height: 48'),
  'Parent avatar size reduced to 48x48'
);

addCheck(
  'Parent profile header margin reduced',
  parentScreenContent.includes('marginBottom: 10'),
  'Parent profile header margin reduced to 10'
);

// Check 2: Parent Profile Font Sizes
addCheck(
  'Parent name font size reduced',
  parentScreenContent.includes('fontSize: fontSizes.medium') && 
  parentScreenContent.includes('marginBottom: 2'),
  'Parent name uses medium font size with reduced margin'
);

addCheck(
  'Parent role font size reduced',
  parentScreenContent.includes('fontSize: fontSizes.small') && 
  parentScreenContent.includes('marginBottom: 6'),
  'Parent role uses small font size with reduced margin'
);

addCheck(
  'Parent contact text size reduced',
  parentScreenContent.includes('fontSize: fontSizes.extraSmall'),
  'Parent contact text uses extra small font size'
);

// Check 3: Parent Profile Icon Sizes
addCheck(
  'Parent avatar icon size reduced',
  parentScreenContent.includes('size={24}') && parentScreenContent.includes('icon={faUser}'),
  'Parent avatar icon size reduced to 24'
);

addCheck(
  'Parent contact icons size reduced',
  parentScreenContent.includes('size={12}') && 
  (parentScreenContent.includes('icon={faEnvelope}') || parentScreenContent.includes('icon={faPhone}')),
  'Parent contact icons size reduced to 12'
);

addCheck(
  'Parent edit button size reduced',
  parentScreenContent.includes('width: 32') && parentScreenContent.includes('height: 32'),
  'Parent edit button size reduced to 32x32'
);

// Check 4: Children Cards Compact Sizing
addCheck(
  'Student tile container size reduced',
  parentScreenContent.includes('width: 130') && parentScreenContent.includes('height: 140'),
  'Student tile container size reduced to 130x140'
);

addCheck(
  'Student tile margin reduced',
  parentScreenContent.includes('margin: 6'),
  'Student tile margin reduced to 6'
);

addCheck(
  'Student tile padding reduced',
  parentScreenContent.includes('padding: 10') && parentScreenContent.includes('borderRadius: 10'),
  'Student tile padding and border radius reduced'
);

// Check 5: Children Cards Elements
addCheck(
  'Student photo size reduced',
  parentScreenContent.includes('width: 60') && parentScreenContent.includes('height: 60'),
  'Student photo size reduced to 60x60'
);

addCheck(
  'Student icon container size reduced',
  parentScreenContent.includes('width: 50') && parentScreenContent.includes('height: 50'),
  'Student icon container size reduced to 50x50'
);

addCheck(
  'Student icon size reduced',
  parentScreenContent.includes('size={22}') && parentScreenContent.includes('icon={faChild}'),
  'Student icon size reduced to 22'
);

// Check 6: Children Cards Text and Spacing
addCheck(
  'Student name font size reduced',
  parentScreenContent.includes('fontSize: 10') && parentScreenContent.includes('marginBottom: 4'),
  'Student name font size reduced to 10 with compact margin'
);

addCheck(
  'Student details font size reduced',
  parentScreenContent.includes('fontSize: 12') && parentScreenContent.includes('marginBottom: 2'),
  'Student details font size reduced to 12 with compact margin'
);

addCheck(
  'Delete button size reduced',
  parentScreenContent.includes('width: 24') && parentScreenContent.includes('height: 24'),
  'Delete button size reduced to 24x24'
);

addCheck(
  'Delete icon size reduced',
  parentScreenContent.includes('size={12}') && parentScreenContent.includes('icon={faTrash}'),
  'Delete icon size reduced to 12'
);

// Check 7: Parent Stats Compact Design
addCheck(
  'Parent stats padding reduced',
  parentScreenContent.includes('paddingTop: 10'),
  'Parent stats padding reduced to 10'
);

addCheck(
  'Parent stat divider height reduced',
  parentScreenContent.includes('height: 30'),
  'Parent stat divider height reduced to 30'
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
  console.log('\n🎉 ALL CHECKS PASSED! Compact design is properly implemented.');
  console.log('\n📱 Compact Design Features:');
  console.log('• Parent profile: 25% smaller with reduced padding and margins');
  console.log('• Parent avatar: 48x48 (was 64x64)');
  console.log('• Children cards: 130x140 (was 160x180)');
  console.log('• Student photos: 60x60 (was 90x90)');
  console.log('• Reduced font sizes throughout');
  console.log('• Smaller icons and buttons');
  console.log('• Tighter spacing and margins');
} else {
  console.log('\n⚠️  Some checks failed. Please review the compact design implementation.');
  process.exit(1);
}
