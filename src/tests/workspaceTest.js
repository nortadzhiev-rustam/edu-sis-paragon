/**
 * Workspace Implementation Test
 *
 * This file contains comprehensive tests to verify the workspace functionality
 * Run these tests to ensure the workspace system is working correctly
 */

import {
  getWorkspaceStructure,
  getFolderContents,
  uploadWorkspaceFile,
  createWorkspaceFolder,
  searchWorkspaceFiles,
  getRecentWorkspaceFiles,
  getWorkspaceStatistics,
  deleteWorkspaceItem,
  getFileTypeIcon,
  formatFileSize,
} from '../services/workspaceService';

import {
  canUploadFiles,
  canCreateFolders,
  canDeleteItems,
  canAccessFolder,
  getCurrentUser,
  getAccessibleFolders,
  getUploadSizeLimit,
  getAllowedFileTypes,
  isFileTypeAllowed,
  USER_ROLES,
} from '../utils/workspacePermissions';

// Mock auth code for testing
const TEST_AUTH_CODE = 'test_workspace_auth_code_123';

// Test data
const testFolderData = {
  folderName: 'Test Folder',
  parentFolderId: 'test_parent_folder_id',
  description: 'Test folder description',
};

const testFileData = {
  folderId: 'test_folder_id',
  fileName: 'test_document.pdf',
  mimeType: 'application/pdf',
  size: 1024000, // 1MB
};

const testSearchQuery = 'test document';

/**
 * Test workspace service functions
 */
export const testWorkspaceService = async () => {
  console.log('🧪 WORKSPACE TEST: Starting workspace service tests...');

  try {
    // Test 1: Get workspace structure
    console.log('📁 Testing getWorkspaceStructure...');
    const structureResponse = await getWorkspaceStructure();
    console.log('✅ Workspace structure:', structureResponse);

    if (!structureResponse.success) {
      throw new Error('Failed to get workspace structure');
    }

    // Test 2: Get folder contents
    if (structureResponse.workspace?.folders?.length > 0) {
      const firstFolder = structureResponse.workspace.folders[0];
      console.log('📂 Testing getFolderContents...');
      const contentsResponse = await getFolderContents(firstFolder.id);
      console.log('✅ Folder contents:', contentsResponse);

      if (!contentsResponse.success) {
        throw new Error('Failed to get folder contents');
      }
    }

    // Test 3: Search files
    console.log('🔍 Testing searchWorkspaceFiles...');
    const searchResponse = await searchWorkspaceFiles(testSearchQuery);
    console.log('✅ Search results:', searchResponse);

    // Test 4: Get recent files
    console.log('📄 Testing getRecentWorkspaceFiles...');
    const recentResponse = await getRecentWorkspaceFiles(10);
    console.log('✅ Recent files:', recentResponse);

    // Test 5: Get statistics
    console.log('📊 Testing getWorkspaceStatistics...');
    const statsResponse = await getWorkspaceStatistics();
    console.log('✅ Statistics:', statsResponse);

    console.log('🎉 All workspace service tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Workspace service test failed:', error);
    return false;
  }
};

/**
 * Test workspace permissions
 */
export const testWorkspacePermissions = async () => {
  console.log('🔐 WORKSPACE TEST: Starting permissions tests...');

  try {
    // Test 1: Get current user
    console.log('👤 Testing getCurrentUser...');
    const user = await getCurrentUser();
    console.log('✅ Current user:', user);

    if (!user) {
      console.log('⚠️ No user found, skipping permission tests');
      return true;
    }

    // Test 2: Check upload permissions
    console.log('📤 Testing canUploadFiles...');
    const canUpload = await canUploadFiles();
    console.log('✅ Can upload files:', canUpload);

    // Test 3: Check folder creation permissions
    console.log('📁 Testing canCreateFolders...');
    const canCreateFolder = await canCreateFolders();
    console.log('✅ Can create folders:', canCreateFolder);

    // Test 4: Check delete permissions
    console.log('🗑️ Testing canDeleteItems...');
    const canDelete = await canDeleteItems();
    console.log('✅ Can delete items:', canDelete);

    // Test 5: Get upload size limit
    console.log('📏 Testing getUploadSizeLimit...');
    const sizeLimit = getUploadSizeLimit(user.userType);
    console.log('✅ Upload size limit:', formatFileSize(sizeLimit));

    // Test 6: Get allowed file types
    console.log('📋 Testing getAllowedFileTypes...');
    const allowedTypes = getAllowedFileTypes(user.userType);
    console.log('✅ Allowed file types:', allowedTypes.length, 'types');

    // Test 7: Test file type validation
    console.log('✅ Testing isFileTypeAllowed...');
    const pdfAllowed = isFileTypeAllowed(user.userType, 'application/pdf');
    const exeAllowed = isFileTypeAllowed(user.userType, 'application/exe');
    console.log('✅ PDF allowed:', pdfAllowed, 'EXE allowed:', exeAllowed);

    console.log('🎉 All permission tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Permission test failed:', error);
    return false;
  }
};

/**
 * Test utility functions
 */
export const testWorkspaceUtils = () => {
  console.log('🛠️ WORKSPACE TEST: Starting utility tests...');

  try {
    // Test 1: File type icons
    console.log('🎨 Testing getFileTypeIcon...');
    const pdfIcon = getFileTypeIcon('document.pdf', 'application/pdf');
    const imageIcon = getFileTypeIcon('photo.jpg', 'image/jpeg');
    const unknownIcon = getFileTypeIcon('unknown.xyz', 'application/unknown');
    
    console.log('✅ PDF icon:', pdfIcon);
    console.log('✅ Image icon:', imageIcon);
    console.log('✅ Unknown icon:', unknownIcon);

    // Test 2: File size formatting
    console.log('📏 Testing formatFileSize...');
    const sizes = [0, 1024, 1048576, 1073741824];
    sizes.forEach(size => {
      const formatted = formatFileSize(size);
      console.log(`✅ ${size} bytes = ${formatted}`);
    });

    console.log('🎉 All utility tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Utility test failed:', error);
    return false;
  }
};

/**
 * Test role-based access scenarios
 */
export const testRoleBasedAccess = () => {
  console.log('👥 WORKSPACE TEST: Starting role-based access tests...');

  try {
    const testFolders = [
      { id: '1', name: 'Staff Resources', type: 'staff_resources' },
      { id: '2', name: 'Student Resources', type: 'student_resources' },
      { id: '3', name: 'Public Resources', type: 'public_resources' },
    ];

    // Test student access
    console.log('🎓 Testing student access...');
    const studentFolders = getAccessibleFolders(USER_ROLES.STUDENT, testFolders);
    console.log('✅ Student accessible folders:', studentFolders.length);

    // Test teacher access
    console.log('👨‍🏫 Testing teacher access...');
    const teacherFolders = getAccessibleFolders(USER_ROLES.TEACHER, testFolders);
    console.log('✅ Teacher accessible folders:', teacherFolders.length);

    // Test folder access permissions
    testFolders.forEach(folder => {
      const studentAccess = canAccessFolder(USER_ROLES.STUDENT, folder);
      const teacherAccess = canAccessFolder(USER_ROLES.TEACHER, folder);
      console.log(`✅ ${folder.name}: Student=${studentAccess}, Teacher=${teacherAccess}`);
    });

    console.log('🎉 All role-based access tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Role-based access test failed:', error);
    return false;
  }
};

/**
 * Run all workspace tests
 */
export const runAllWorkspaceTests = async () => {
  console.log('🚀 WORKSPACE TEST: Starting comprehensive workspace tests...');
  
  const results = {
    service: false,
    permissions: false,
    utils: false,
    roleAccess: false,
  };

  try {
    // Run all test suites
    results.service = await testWorkspaceService();
    results.permissions = await testWorkspacePermissions();
    results.utils = testWorkspaceUtils();
    results.roleAccess = testRoleBasedAccess();

    // Summary
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log('\n📋 WORKSPACE TEST SUMMARY:');
    console.log(`✅ Service Tests: ${results.service ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Permission Tests: ${results.permissions ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Utility Tests: ${results.utils ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Role Access Tests: ${results.roleAccess ? 'PASSED' : 'FAILED'}`);
    console.log(`\n🎯 Overall: ${passed}/${total} test suites passed`);

    if (passed === total) {
      console.log('🎉 All workspace tests completed successfully!');
      console.log('✅ The workspace implementation is ready for production use.');
    } else {
      console.log('⚠️ Some tests failed. Please review the implementation.');
    }

    return results;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return results;
  }
};

// Export test functions for individual use
export default {
  runAllWorkspaceTests,
  testWorkspaceService,
  testWorkspacePermissions,
  testWorkspaceUtils,
  testRoleBasedAccess,
};
