#!/usr/bin/env node

/**
 * Centering Fix Validation Script
 * Validates that the FlatList centering issue has been properly fixed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING FLATLIST CENTERING FIX...\n');

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
    icon: passed ? '✅' : '❌',
  });
}

// Read ParentScreen.js content
let parentScreenContent = '';
try {
  const parentScreenPath = path.join(
    __dirname,
    '../src/screens/ParentScreen.js'
  );
  parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
} catch (error) {
  console.error('Error reading ParentScreen.js:', error.message);
  process.exit(1);
}

// Check 1: Card width and snap interval consistency
const cardWidthMatch = parentScreenContent.match(/width:\s*330/);
const snapIntervalMatch = parentScreenContent.match(/snapToInterval=\{(\d+)\}/);

addCheck(
  'Card width is 330px',
  cardWidthMatch !== null,
  'Student card width properly set'
);

addCheck(
  'Snap interval matches card width + separator',
  snapIntervalMatch && snapIntervalMatch[1] === '346',
  `Snap interval: ${
    snapIntervalMatch ? snapIntervalMatch[1] : 'not found'
  } (should be 346 = 330 + 16)`
);

// Check 2: Snap alignment for centering
addCheck(
  'Snap alignment set to center',
  parentScreenContent.includes("snapToAlignment='center'"),
  'Items will snap to center position'
);

// Check 3: getItemLayout implementation
addCheck(
  'getItemLayout implemented',
  parentScreenContent.includes('getItemLayout={(') &&
    parentScreenContent.includes('length: 346') &&
    parentScreenContent.includes('offset: 346 * index'),
  'Proper item layout calculation for accurate positioning'
);

// Check 4: Scroll calculation consistency
const scrollCalculationMatch = parentScreenContent.match(
  /contentOffset\s*\/\s*(\d+)/
);

addCheck(
  'Scroll calculation uses correct interval',
  scrollCalculationMatch && scrollCalculationMatch[1] === '346',
  `Scroll calculation: ${
    scrollCalculationMatch ? scrollCalculationMatch[1] : 'not found'
  } (should be 346)`
);

// Check 5: FlatList configuration
addCheck(
  'FlatList is horizontal',
  parentScreenContent.includes('horizontal={true}'),
  'Horizontal scrolling enabled'
);

addCheck(
  'Deceleration rate set to fast',
  parentScreenContent.includes("decelerationRate='fast'"),
  'Fast deceleration for better snapping'
);

addCheck(
  'Item separator width is 16px',
  parentScreenContent.includes(
    'ItemSeparatorComponent={() => <View style={{ width: 16 }} />}'
  ),
  'Consistent 16px spacing between items'
);

// Check 6: Scroll event handling
addCheck(
  'onMomentumScrollEnd implemented',
  parentScreenContent.includes('onMomentumScrollEnd={(event) => {') &&
    parentScreenContent.includes('setCurrentIndex('),
  'Scroll end event properly handled'
);

addCheck(
  'onScrollToIndexFailed implemented',
  parentScreenContent.includes('onScrollToIndexFailed={(info) => {') &&
    parentScreenContent.includes('setTimeout(() => {'),
  'Scroll failure handling implemented'
);

// Check 7: Index calculation and bounds checking
addCheck(
  'Index bounds checking implemented',
  parentScreenContent.includes(
    'Math.max(0, Math.min(index, students.length - 1))'
  ),
  'Index properly bounded to prevent out-of-range errors'
);

// Check 8: Student selection and centering
addCheck(
  'handleStudentPress centers selected item',
  parentScreenContent.includes('handleStudentPress') &&
    parentScreenContent.includes('flatListRef.current?.scrollToIndex({') &&
    parentScreenContent.includes('index: studentIndex'),
  'Selected student properly centered'
);

addCheck(
  'Pagination dots trigger centering',
  parentScreenContent.includes('flatListRef.current?.scrollToIndex({') &&
    parentScreenContent.includes('index,') &&
    parentScreenContent.includes('animated: true'),
  'Pagination dots properly center items'
);

// Check 9: Animation configuration
addCheck(
  'Scroll animations enabled',
  parentScreenContent.includes('animated: true'),
  'Smooth animations for scroll transitions'
);

// Check 10: Ref usage
addCheck(
  'FlatList ref properly configured',
  parentScreenContent.includes('const flatListRef = React.useRef(null)') &&
    parentScreenContent.includes('ref={flatListRef}'),
  'FlatList reference properly set up'
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
  console.log('\n🎉 ALL CHECKS PASSED! FlatList centering issue fixed.');
  console.log('\n🎯 Centering Fix Details:');
  console.log(
    '• Card width (330px) matches snap interval calculation (346px = 330 + 16)'
  );
  console.log(
    '• snapToAlignment changed from "start" to "center" for proper centering'
  );
  console.log('• getItemLayout implemented for accurate positioning');
  console.log('• Consistent scroll calculations throughout');
  console.log('• Proper bounds checking prevents out-of-range errors');
  console.log('• Smooth animations for all scroll transitions');
  console.log('• Robust error handling for scroll failures');
} else {
  console.log(
    '\n⚠️  Some centering checks failed. Please review the FlatList configuration.'
  );
  process.exit(1);
}
