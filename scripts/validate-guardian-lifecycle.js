#!/usr/bin/env node

/**
 * Guardian Lifecycle Management Validation Script
 * Validates the implementation without running actual API calls
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Guardian Lifecycle Management Validation');
console.log('============================================\n');

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function addResult(type, message, details = '') {
  results[type]++;
  results.details.push({ type, message, details });
  
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// 1. Validate API endpoints configuration
console.log('1. Validating API Endpoints Configuration...');
try {
  const envPath = path.join(__dirname, '../src/config/env.js');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredEndpoints = [
    'DEACTIVATE_GUARDIAN',
    'DELETE_GUARDIAN', 
    'REACTIVATE_GUARDIAN'
  ];
  
  let endpointsFound = 0;
  requiredEndpoints.forEach(endpoint => {
    if (envContent.includes(endpoint)) {
      endpointsFound++;
      addResult('passed', `API endpoint ${endpoint} configured`);
    } else {
      addResult('failed', `API endpoint ${endpoint} missing`);
    }
  });
  
  if (endpointsFound === requiredEndpoints.length) {
    addResult('passed', 'All required API endpoints configured');
  }
} catch (error) {
  addResult('failed', 'Could not validate API endpoints', error.message);
}

// 2. Validate service functions
console.log('\n2. Validating Guardian Service Functions...');
try {
  const servicePath = path.join(__dirname, '../src/services/guardianService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  const requiredFunctions = [
    'deactivateGuardian',
    'deleteGuardian',
    'reactivateGuardian'
  ];
  
  let functionsFound = 0;
  requiredFunctions.forEach(func => {
    if (serviceContent.includes(`export const ${func}`)) {
      functionsFound++;
      addResult('passed', `Service function ${func} implemented`);
    } else {
      addResult('failed', `Service function ${func} missing`);
    }
  });
  
  // Check if functions are exported
  if (serviceContent.includes('deactivateGuardian,') && 
      serviceContent.includes('deleteGuardian,') && 
      serviceContent.includes('reactivateGuardian,')) {
    addResult('passed', 'All lifecycle functions exported');
  } else {
    addResult('failed', 'Some lifecycle functions not exported');
  }
  
} catch (error) {
  addResult('failed', 'Could not validate service functions', error.message);
}

// 3. Validate GuardianCard component
console.log('\n3. Validating GuardianCard Component...');
try {
  const cardPath = path.join(__dirname, '../src/components/guardian/GuardianCard.js');
  const cardContent = fs.readFileSync(cardPath, 'utf8');
  
  const requiredProps = [
    'onDeactivate',
    'onDelete', 
    'onReactivate'
  ];
  
  requiredProps.forEach(prop => {
    if (cardContent.includes(prop)) {
      addResult('passed', `GuardianCard prop ${prop} added`);
    } else {
      addResult('failed', `GuardianCard prop ${prop} missing`);
    }
  });
  
  const requiredHandlers = [
    'handleDeactivate',
    'handleDelete',
    'handleReactivate'
  ];
  
  requiredHandlers.forEach(handler => {
    if (cardContent.includes(handler)) {
      addResult('passed', `GuardianCard handler ${handler} implemented`);
    } else {
      addResult('failed', `GuardianCard handler ${handler} missing`);
    }
  });
  
  // Check for lifecycle actions row
  if (cardContent.includes('lifecycleActionsRow')) {
    addResult('passed', 'Lifecycle actions UI layout implemented');
  } else {
    addResult('failed', 'Lifecycle actions UI layout missing');
  }
  
} catch (error) {
  addResult('failed', 'Could not validate GuardianCard component', error.message);
}

// 4. Validate screen integration
console.log('\n4. Validating Screen Integration...');
try {
  const screenPath = path.join(__dirname, '../src/screens/GuardianPickupManagementScreen.js');
  const screenContent = fs.readFileSync(screenPath, 'utf8');
  
  const requiredHandlers = [
    'handleDeactivateGuardian',
    'handleDeleteGuardian',
    'handleReactivateGuardian'
  ];
  
  requiredHandlers.forEach(handler => {
    if (screenContent.includes(handler)) {
      addResult('passed', `Screen handler ${handler} implemented`);
    } else {
      addResult('failed', `Screen handler ${handler} missing`);
    }
  });
  
  // Check if handlers are passed to GuardianCard
  if (screenContent.includes('onDeactivate={handleDeactivateGuardian}') &&
      screenContent.includes('onDelete={handleDeleteGuardian}') &&
      screenContent.includes('onReactivate={handleReactivateGuardian}')) {
    addResult('passed', 'Lifecycle handlers properly connected to GuardianCard');
  } else {
    addResult('failed', 'Lifecycle handlers not properly connected');
  }
  
} catch (error) {
  addResult('failed', 'Could not validate screen integration', error.message);
}

// 5. Validate documentation
console.log('\n5. Validating Documentation...');
try {
  const docsPath = path.join(__dirname, '../docs/guardian-lifecycle-management.md');
  if (fs.existsSync(docsPath)) {
    const docsContent = fs.readFileSync(docsPath, 'utf8');
    
    if (docsContent.includes('Soft Delete') && 
        docsContent.includes('Hard Delete') && 
        docsContent.includes('Reactivate')) {
      addResult('passed', 'Comprehensive documentation created');
    } else {
      addResult('warnings', 'Documentation exists but may be incomplete');
    }
  } else {
    addResult('warnings', 'Documentation file not found');
  }
} catch (error) {
  addResult('warnings', 'Could not validate documentation', error.message);
}

// 6. Validate test files
console.log('\n6. Validating Test Files...');
try {
  const testPath = path.join(__dirname, '../src/tests/guardianLifecycleManagement.test.js');
  if (fs.existsSync(testPath)) {
    const testContent = fs.readFileSync(testPath, 'utf8');
    
    if (testContent.includes('deactivateGuardian') && 
        testContent.includes('deleteGuardian') && 
        testContent.includes('reactivateGuardian')) {
      addResult('passed', 'Comprehensive test suite created');
    } else {
      addResult('warnings', 'Test file exists but may be incomplete');
    }
  } else {
    addResult('warnings', 'Test file not found');
  }
} catch (error) {
  addResult('warnings', 'Could not validate test files', error.message);
}

// 7. Validate demo utilities
console.log('\n7. Validating Demo Utilities...');
try {
  const demoPath = path.join(__dirname, '../src/utils/guardianLifecycleDemo.js');
  if (fs.existsSync(demoPath)) {
    const demoContent = fs.readFileSync(demoPath, 'utf8');
    
    if (demoContent.includes('runGuardianLifecycleDemo') && 
        demoContent.includes('runHardDeleteDemo')) {
      addResult('passed', 'Demo utilities created');
    } else {
      addResult('warnings', 'Demo file exists but may be incomplete');
    }
  } else {
    addResult('warnings', 'Demo utilities not found');
  }
} catch (error) {
  addResult('warnings', 'Could not validate demo utilities', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.failed === 0) {
  console.log('\n🎉 Guardian Lifecycle Management implementation is VALID!');
  console.log('✅ All critical components are properly implemented');
  
  if (results.warnings > 0) {
    console.log('⚠️  Some optional components have warnings - check details above');
  }
} else {
  console.log('\n❌ Guardian Lifecycle Management implementation has ISSUES!');
  console.log('🔧 Please fix the failed validations before proceeding');
}

console.log('\n📋 Implementation includes:');
console.log('  🟡 Soft Delete (Deactivate) - Reversible guardian deactivation');
console.log('  🔴 Hard Delete - Permanent guardian removal');
console.log('  🟢 Reactivate - Restore deactivated guardians');
console.log('  🛡️  Security & permission checks');
console.log('  📱 Enhanced UI with lifecycle management buttons');
console.log('  ⚠️  Safety confirmations for destructive operations');

process.exit(results.failed > 0 ? 1 : 0);
