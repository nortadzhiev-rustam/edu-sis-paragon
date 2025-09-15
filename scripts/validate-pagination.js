#!/usr/bin/env node

/**
 * Pagination Implementation Validation Script
 * Validates that dotted pagination and centering functionality is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING PAGINATION IMPLEMENTATION...\n');

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

// Check 1: State Management
addCheck(
  'Current index state exists',
  parentScreenContent.includes('const [currentIndex, setCurrentIndex] = useState(0)'),
  'Current index state properly initialized'
);

addCheck(
  'useEffect for index synchronization exists',
  parentScreenContent.includes('useEffect(() => {') && 
  parentScreenContent.includes('selectedStudent && students.length > 0'),
  'useEffect to sync currentIndex with selectedStudent found'
);

// Check 2: FlatList Configuration
addCheck(
  'FlatList has snap to interval',
  parentScreenContent.includes('snapToInterval={336}'),
  'FlatList configured with proper snap interval'
);

addCheck(
  'FlatList has snap alignment',
  parentScreenContent.includes('snapToAlignment=\'start\''),
  'FlatList configured with start alignment'
);

addCheck(
  'FlatList has deceleration rate',
  parentScreenContent.includes('decelerationRate=\'fast\''),
  'FlatList configured with fast deceleration'
);

addCheck(
  'onMomentumScrollEnd handler exists',
  parentScreenContent.includes('onMomentumScrollEnd={(event) => {') && 
  parentScreenContent.includes('setCurrentIndex'),
  'Scroll end handler updates current index'
);

// Check 3: Pagination Indicator
addCheck(
  'Pagination container exists',
  parentScreenContent.includes('paginationContainer') && 
  parentScreenContent.includes('students.length > 1'),
  'Pagination container renders when multiple students'
);

addCheck(
  'Pagination dots are mapped from students',
  parentScreenContent.includes('students.map((_, index) => (') && 
  parentScreenContent.includes('paginationDot'),
  'Pagination dots mapped from students array'
);

addCheck(
  'Active dot styling exists',
  parentScreenContent.includes('paginationDotActive') && 
  parentScreenContent.includes('index === currentIndex'),
  'Active dot styling based on current index'
);

addCheck(
  'Dot press handler exists',
  parentScreenContent.includes('onPress={() => {') && 
  parentScreenContent.includes('setCurrentIndex(index)') && 
  parentScreenContent.includes('scrollToIndex'),
  'Dot press handler updates index and scrolls'
);

// Check 4: Pagination Styles
addCheck(
  'Pagination container style exists',
  parentScreenContent.includes('paginationContainer: {') && 
  parentScreenContent.includes('flexDirection: \'row\'') && 
  parentScreenContent.includes('justifyContent: \'center\''),
  'Pagination container style properly defined'
);

addCheck(
  'Pagination dot style exists',
  parentScreenContent.includes('paginationDot: {') && 
  parentScreenContent.includes('width: 8') && 
  parentScreenContent.includes('height: 8') && 
  parentScreenContent.includes('borderRadius: 4'),
  'Pagination dot style properly defined'
);

addCheck(
  'Active pagination dot style exists',
  parentScreenContent.includes('paginationDotActive: {') && 
  parentScreenContent.includes('backgroundColor: theme.colors.primary') && 
  parentScreenContent.includes('transform: [{ scale: 1.2 }]'),
  'Active pagination dot style with scaling'
);

// Check 5: Student Selection Centering
addCheck(
  'handleStudentPress updates current index',
  parentScreenContent.includes('const studentIndex = students.findIndex') && 
  parentScreenContent.includes('setCurrentIndex(studentIndex)'),
  'Student press handler updates current index'
);

addCheck(
  'handleStudentPress scrolls to selected student',
  parentScreenContent.includes('flatListRef.current?.scrollToIndex({') && 
  parentScreenContent.includes('index: studentIndex') && 
  parentScreenContent.includes('animated: true'),
  'Student press handler scrolls to selected student'
);

// Check 6: Scroll Calculation
addCheck(
  'Scroll offset calculation exists',
  parentScreenContent.includes('const contentOffset = event.nativeEvent.contentOffset.x') && 
  parentScreenContent.includes('const index = Math.round(contentOffset / 336)'),
  'Proper scroll offset calculation for pagination'
);

addCheck(
  'Index bounds checking exists',
  parentScreenContent.includes('Math.max(0, Math.min(index, students.length - 1))'),
  'Index bounds checking prevents out of range values'
);

// Check 7: Integration
addCheck(
  'Pagination replaces old scroll indicator',
  !parentScreenContent.includes('Modern Scroll Indicator') || 
  !parentScreenContent.includes('scrollToSeeMore'),
  'Old scroll indicator removed in favor of pagination'
);

addCheck(
  'TouchableOpacity used for dots',
  parentScreenContent.includes('<TouchableOpacity') && 
  parentScreenContent.includes('key={index}') && 
  parentScreenContent.includes('paginationDot'),
  'TouchableOpacity used for interactive dots'
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
  console.log('\n🎉 ALL CHECKS PASSED! Pagination with centering functionality implemented.');
  console.log('\n📱 Features Implemented:');
  console.log('• Dotted pagination indicator under FlatList');
  console.log('• Interactive dots that scroll to specific students');
  console.log('• Active dot highlighting based on current position');
  console.log('• Automatic centering when student is selected');
  console.log('• Smooth scrolling with snap-to-interval');
  console.log('• Proper state synchronization between scroll and selection');
  console.log('• Responsive dot scaling for active state');
} else {
  console.log('\n⚠️  Some checks failed. Please review the pagination implementation.');
  process.exit(1);
}
