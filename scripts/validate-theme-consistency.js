#!/usr/bin/env node

/**
 * Theme Consistency Validation Script
 * Validates that ParentProfileScreen uses consistent theme colors with other screens
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING THEME CONSISTENCY...\n');

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

// Read files
let parentProfileScreenContent = '';
let parentScreenContent = '';
let themeContextContent = '';

try {
  const parentProfileScreenPath = path.join(
    __dirname,
    '../src/screens/ParentProfileScreen.js'
  );
  parentProfileScreenContent = fs.readFileSync(parentProfileScreenPath, 'utf8');

  const parentScreenPath = path.join(
    __dirname,
    '../src/screens/ParentScreen.js'
  );
  parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');

  const themeContextPath = path.join(
    __dirname,
    '../src/contexts/ThemeContext.js'
  );
  themeContextContent = fs.readFileSync(themeContextPath, 'utf8');
} catch (error) {
  console.error('Error reading files:', error.message);
  process.exit(1);
}

// Check 1: No invalid theme colors used
addCheck(
  'No primaryLight color used in ParentProfileScreen',
  !parentProfileScreenContent.includes('theme.colors.primaryLight'),
  'primaryLight is not a valid theme color'
);

addCheck(
  'No primaryLight color used in ParentScreen',
  !parentScreenContent.includes('theme.colors.primaryLight'),
  'primaryLight is not a valid theme color'
);

// Check 2: Consistent header styling
addCheck(
  'ParentProfileScreen uses headerBackground',
  parentProfileScreenContent.includes(
    'backgroundColor: theme.colors.headerBackground'
  ),
  'Header background matches other screens'
);

addCheck(
  'ParentProfileScreen uses headerText color',
  parentProfileScreenContent.includes('color: theme.colors.headerText'),
  'Header text color matches other screens'
);

addCheck(
  'Back button uses headerText color',
  parentProfileScreenContent.includes('color={theme.colors.headerText}'),
  'Back button icon color matches header text'
);

// Check 3: Valid theme colors used
const validThemeColors = [
  'primary',
  'secondary',
  'merchandise',
  'background',
  'surface',
  'surfaceSecondary',
  'text',
  'textSecondary',
  'textLight',
  'textOnPrimary',
  'textOnSecondary',
  'border',
  'divider',
  'success',
  'warning',
  'error',
  'info',
  'card',
  'cardSecondary',
  'headerBackground',
  'headerText',
  'tabBackground',
  'tabActive',
  'tabInactive',
  'shadow',
  'bpsPositive',
  'bpsNegative',
  'bpsSelected',
  'bpsBackground',
  'accent',
  'highlight',
  'muted',
];

// Extract theme color usage from ParentProfileScreen
const themeColorMatches =
  parentProfileScreenContent.match(/theme\.colors\.(\w+)/g) || [];
const usedColors = themeColorMatches.map((match) =>
  match.replace('theme.colors.', '')
);
const invalidColors = usedColors.filter(
  (color) => !validThemeColors.includes(color)
);

addCheck(
  'All theme colors are valid in ParentProfileScreen',
  invalidColors.length === 0,
  invalidColors.length > 0
    ? `Invalid colors: ${invalidColors.join(', ')}`
    : 'All colors are valid'
);

// Check 4: Consistent surface and background usage
addCheck(
  'Uses surface color for cards',
  parentProfileScreenContent.includes('backgroundColor: theme.colors.surface'),
  'Surface color used for card backgrounds'
);

addCheck(
  'Uses background color for main container',
  parentProfileScreenContent.includes(
    'backgroundColor: theme.colors.background'
  ),
  'Background color used for main container'
);

// Check 5: Consistent text colors
addCheck(
  'Uses primary text color',
  parentProfileScreenContent.includes('color: theme.colors.text'),
  'Primary text color used appropriately'
);

addCheck(
  'Uses secondary text color',
  parentProfileScreenContent.includes('color: theme.colors.textSecondary'),
  'Secondary text color used appropriately'
);

// Check 6: Consistent border and shadow usage
addCheck(
  'Uses border color',
  parentProfileScreenContent.includes('borderColor: theme.colors.border') ||
    parentProfileScreenContent.includes(
      'borderBottomColor: theme.colors.border'
    ),
  'Border color used consistently'
);

addCheck(
  'Uses createMediumShadow utility',
  parentProfileScreenContent.includes('createMediumShadow(theme)'),
  'Shadow utility used for consistent shadows'
);

// Check 7: Theme context properly imported and used
addCheck(
  'Theme context imported',
  parentProfileScreenContent.includes('import { useTheme') &&
    parentProfileScreenContent.includes("from '../contexts/ThemeContext'"),
  'Theme context properly imported'
);

addCheck(
  'Theme hook used',
  parentProfileScreenContent.includes('const { theme } = useTheme()'),
  'Theme hook properly used'
);

// Check 8: Consistent with other screens
addCheck(
  'Similar header structure to other screens',
  parentProfileScreenContent.includes('headerBackground') &&
    parentProfileScreenContent.includes('headerText') &&
    parentProfileScreenContent.includes('faArrowLeft'),
  'Header structure matches other screens'
);

addCheck(
  'Similar card styling to other screens',
  parentProfileScreenContent.includes('borderRadius: 16') &&
    parentProfileScreenContent.includes('padding: 20'),
  'Card styling matches other screens'
);

// Check 9: Font sizes consistency
addCheck(
  'Uses getLanguageFontSizes',
  parentProfileScreenContent.includes('getLanguageFontSizes') &&
    parentProfileScreenContent.includes('fontSize: fontSizes.'),
  'Font sizes use consistent system'
);

// Check 10: SafeAreaView usage
addCheck(
  'Uses SafeAreaView',
  parentProfileScreenContent.includes('SafeAreaView') &&
    parentProfileScreenContent.includes(
      "from 'react-native-safe-area-context'"
    ),
  'SafeAreaView used for proper screen layout'
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
  console.log('\n🎉 ALL CHECKS PASSED! Theme consistency achieved.');
  console.log('\n🎨 Theme Consistency Features:');
  console.log(
    '• Consistent header styling with headerBackground and headerText'
  );
  console.log('• Valid theme colors used throughout');
  console.log('• Proper surface and background color usage');
  console.log('• Consistent text color hierarchy');
  console.log('• Unified border and shadow styling');
  console.log('• Matching card and container styling');
  console.log('• Consistent font size system');
  console.log('• Proper SafeAreaView implementation');
} else {
  console.log(
    '\n⚠️  Some theme consistency checks failed. Please review the implementation.'
  );
  process.exit(1);
}
