#!/usr/bin/env node

/**
 * Test script to validate the complete app separation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Complete App Separation...\n');

// Test 1: Check directory structure
console.log('1. Checking directory structure...');
const requiredDirs = [
  'apps/teacher-app/src',
  'apps/parent-student-app/src',
  'apps/teacher-app/src/components',
  'apps/parent-student-app/src/components',
  'apps/teacher-app/src/contexts',
  'apps/parent-student-app/src/contexts',
  'apps/teacher-app/src/services',
  'apps/parent-student-app/src/services',
];

let structureValid = true;
requiredDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir} exists`);
  } else {
    console.log(`   ❌ ${dir} missing`);
    structureValid = false;
  }
});

// Test 2: Check package.json files
console.log('\n2. Checking package.json files...');
const packageFiles = [
  'package.json',
  'apps/teacher-app/package.json',
  'apps/parent-student-app/package.json',
];

let packagesValid = true;
packageFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`   ✅ ${file} - ${pkg.name}`);
    } catch (e) {
      console.log(`   ❌ ${file} - Invalid JSON`);
      packagesValid = false;
    }
  } else {
    console.log(`   ❌ ${file} missing`);
    packagesValid = false;
  }
});

// Test 3: Check app configuration files
console.log('\n3. Checking app configuration files...');
const configFiles = [
  'apps/teacher-app/app.json',
  'apps/parent-student-app/app.json',
  'apps/teacher-app/babel.config.js',
  'apps/parent-student-app/babel.config.js',
];

let configValid = true;
configFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
    configValid = false;
  }
});

// Test 4: Check for complete separation
console.log('\n4. Checking for complete separation...');
const teacherPkg = JSON.parse(
  fs.readFileSync('apps/teacher-app/package.json', 'utf8')
);
const parentPkg = JSON.parse(
  fs.readFileSync('apps/parent-student-app/package.json', 'utf8')
);

const hasSharedDep = (pkg) => {
  return (
    pkg.dependencies &&
    (pkg.dependencies['edu-sis-shared'] || pkg.dependencies['workspace:*'])
  );
};

if (!hasSharedDep(teacherPkg) && !hasSharedDep(parentPkg)) {
  console.log('   ✅ No shared library dependencies found');
} else {
  console.log('   ❌ Apps still have shared library dependencies');
  configValid = false;
}

// Test 5: Check asset files
console.log('\n5. Checking asset files...');
const assetFiles = [
  'apps/teacher-app/assets/teacher_app_logo.png',
  'apps/parent-student-app/assets/parent_student_app_logo.png',
];

let assetsValid = true;
assetFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ⚠️  ${file} missing (will need to be created)`);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log(`   Directory Structure: ${structureValid ? '✅' : '❌'}`);
console.log(`   Package Files: ${packagesValid ? '✅' : '❌'}`);
console.log(`   Configuration: ${configValid ? '✅' : '❌'}`);
console.log(`   Assets: ${assetsValid ? '⚠️' : '❌'}`);

const overallValid = structureValid && packagesValid && configValid;
console.log(
  `\n🎯 Overall Setup: ${overallValid ? '✅ READY' : '❌ NEEDS WORK'}`
);

if (overallValid) {
  console.log('\n🚀 Next steps:');
  console.log('   1. cd apps/teacher-app && npm install');
  console.log('   2. cd apps/parent-student-app && npm install');
  console.log('   3. Test each app: npm start');
} else {
  console.log('\n🔧 Please fix the issues above before proceeding.');
}

console.log('\n✨ Complete app separation test complete!');
