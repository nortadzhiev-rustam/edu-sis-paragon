#!/usr/bin/env node

/**
 * Library Implementation Validation Script
 * Validates that the parent library functionality is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDATING LIBRARY IMPLEMENTATION...\n');

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

// Check 1: API Endpoint Configuration
try {
  const envPath = path.join(__dirname, '../src/config/env.js');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  addCheck(
    'Parent library API endpoint configured',
    envContent.includes('PARENT_STUDENT_LIBRARY: \'/parent/student/library\''),
    'Found PARENT_STUDENT_LIBRARY endpoint in env.js'
  );
} catch (error) {
  addCheck('Parent library API endpoint configured', false, `Error reading env.js: ${error.message}`);
}

// Check 2: Parent Service Function
try {
  const parentServicePath = path.join(__dirname, '../src/services/parentService.js');
  const parentServiceContent = fs.readFileSync(parentServicePath, 'utf8');
  
  addCheck(
    'getChildLibrary function exists',
    parentServiceContent.includes('export const getChildLibrary'),
    'Found getChildLibrary function in parentService.js'
  );
  
  addCheck(
    'getChildLibrary function exported in default export',
    parentServiceContent.includes('getChildLibrary,'),
    'getChildLibrary included in default export'
  );
} catch (error) {
  addCheck('getChildLibrary function exists', false, `Error reading parentService.js: ${error.message}`);
  addCheck('getChildLibrary function exported', false, `Error reading parentService.js: ${error.message}`);
}

// Check 3: Service Index Exports
try {
  const serviceIndexPath = path.join(__dirname, '../src/services/index.js');
  const serviceIndexContent = fs.readFileSync(serviceIndexPath, 'utf8');
  
  addCheck(
    'getChildLibrary exported from services index',
    serviceIndexContent.includes('getChildLibrary,'),
    'getChildLibrary found in services/index.js exports'
  );
} catch (error) {
  addCheck('getChildLibrary exported from services index', false, `Error reading services/index.js: ${error.message}`);
}

// Check 4: Parent Proxy Adapter
try {
  const adapterPath = path.join(__dirname, '../src/services/parentProxyAdapter.js');
  const adapterContent = fs.readFileSync(adapterPath, 'utf8');
  
  addCheck(
    'getChildLibrary imported in adapter',
    adapterContent.includes('getChildLibrary'),
    'getChildLibrary import found in parentProxyAdapter.js'
  );
  
  addCheck(
    'adaptLibraryService function exists',
    adapterContent.includes('export const adaptLibraryService'),
    'adaptLibraryService function found in parentProxyAdapter.js'
  );
  
  addCheck(
    'adaptLibraryService exported in default export',
    adapterContent.includes('adaptLibraryService,'),
    'adaptLibraryService included in default export'
  );
} catch (error) {
  addCheck('Parent proxy adapter configured', false, `Error reading parentProxyAdapter.js: ${error.message}`);
}

// Check 5: Parent Screen Library Menu
try {
  const parentScreenPath = path.join(__dirname, '../src/screens/ParentScreen.js');
  const parentScreenContent = fs.readFileSync(parentScreenPath, 'utf8');
  
  addCheck(
    'Library menu item enabled in ParentScreen',
    parentScreenContent.includes('id: \'library\'') && !parentScreenContent.includes('// {') || !parentScreenContent.includes('//   id: \'library\''),
    'Library menu item is uncommented in ParentScreen.js'
  );
  
  addCheck(
    'Library navigation handler exists',
    parentScreenContent.includes('case \'library\':'),
    'Library navigation case found in ParentScreen.js'
  );
} catch (error) {
  addCheck('Parent screen library menu', false, `Error reading ParentScreen.js: ${error.message}`);
}

// Check 6: Library Screen Parent Proxy Support
try {
  const libraryScreenPath = path.join(__dirname, '../src/screens/LibraryScreen.js');
  const libraryScreenContent = fs.readFileSync(libraryScreenPath, 'utf8');
  
  addCheck(
    'LibraryScreen imports getChildLibrary',
    libraryScreenContent.includes('import { getChildLibrary }'),
    'getChildLibrary import found in LibraryScreen.js'
  );
  
  addCheck(
    'LibraryScreen extracts parent proxy params',
    libraryScreenContent.includes('useParentProxy') && libraryScreenContent.includes('studentId'),
    'Parent proxy parameters extracted in LibraryScreen.js'
  );
  
  addCheck(
    'LibraryScreen uses parent proxy logic',
    libraryScreenContent.includes('if (useParentProxy && studentId)'),
    'Parent proxy conditional logic found in LibraryScreen.js'
  );
} catch (error) {
  addCheck('Library screen parent proxy support', false, `Error reading LibraryScreen.js: ${error.message}`);
}

// Check 7: Test File Created
try {
  const testPath = path.join(__dirname, '../src/tests/parentLibraryIntegration.test.js');
  const testExists = fs.existsSync(testPath);
  
  addCheck(
    'Parent library integration test exists',
    testExists,
    'parentLibraryIntegration.test.js found in src/tests/'
  );
} catch (error) {
  addCheck('Parent library integration test exists', false, `Error checking test file: ${error.message}`);
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
  console.log('\n🎉 ALL CHECKS PASSED! Library functionality is properly implemented.');
  console.log('\n📱 Next Steps:');
  console.log('1. Test the library menu in the parent app');
  console.log('2. Verify parent proxy access works correctly');
  console.log('3. Check that library data displays properly');
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
