/**
 * Workspace Permissions Utility
 * Handles role-based access control for workspace features
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  STAFF: 'staff',
  ADMIN: 'admin',
  HEAD_OF_SECTION: 'head_of_section',
  HEAD_OF_SCHOOL: 'head_of_school',
};

// Permission levels
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
};

// Get current user data
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user has specific permission
export const hasPermission = (userRole, permission, resourceType = 'general') => {
  const rolePermissions = getRolePermissions(userRole);
  
  if (!rolePermissions) {
    return false;
  }

  // Check resource-specific permissions first
  if (rolePermissions[resourceType] && rolePermissions[resourceType].includes(permission)) {
    return true;
  }

  // Check general permissions
  if (rolePermissions.general && rolePermissions.general.includes(permission)) {
    return true;
  }

  return false;
};

// Get permissions for a specific role
export const getRolePermissions = (userRole) => {
  const permissions = {
    [USER_ROLES.STUDENT]: {
      general: [PERMISSIONS.READ],
      files: [PERMISSIONS.READ],
      folders: [PERMISSIONS.READ],
      upload: [], // Students cannot upload by default
      create_folder: [], // Students cannot create folders
      delete: [], // Students cannot delete
    },
    
    [USER_ROLES.TEACHER]: {
      general: [PERMISSIONS.READ, PERMISSIONS.WRITE],
      files: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      folders: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      upload: [PERMISSIONS.WRITE],
      create_folder: [PERMISSIONS.WRITE],
      delete: [PERMISSIONS.DELETE],
    },
    
    [USER_ROLES.STAFF]: {
      general: [PERMISSIONS.READ, PERMISSIONS.WRITE],
      files: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      folders: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      upload: [PERMISSIONS.WRITE],
      create_folder: [PERMISSIONS.WRITE],
      delete: [PERMISSIONS.DELETE],
    },
    
    [USER_ROLES.HEAD_OF_SECTION]: {
      general: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      files: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      folders: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE],
      upload: [PERMISSIONS.WRITE],
      create_folder: [PERMISSIONS.WRITE],
      delete: [PERMISSIONS.DELETE],
    },
    
    [USER_ROLES.HEAD_OF_SCHOOL]: {
      general: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      files: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      folders: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      upload: [PERMISSIONS.WRITE],
      create_folder: [PERMISSIONS.WRITE],
      delete: [PERMISSIONS.DELETE],
    },
    
    [USER_ROLES.ADMIN]: {
      general: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      files: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      folders: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.DELETE, PERMISSIONS.ADMIN],
      upload: [PERMISSIONS.WRITE],
      create_folder: [PERMISSIONS.WRITE],
      delete: [PERMISSIONS.DELETE],
    },
  };

  return permissions[userRole] || null;
};

// Check if user can upload files
export const canUploadFiles = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return hasPermission(user.userType, PERMISSIONS.WRITE, 'upload');
};

// Check if user can create folders
export const canCreateFolders = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return hasPermission(user.userType, PERMISSIONS.WRITE, 'create_folder');
};

// Check if user can delete items
export const canDeleteItems = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return hasPermission(user.userType, PERMISSIONS.DELETE, 'delete');
};

// Check if user can view statistics
export const canViewStatistics = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // All authenticated users can view statistics
  return hasPermission(user.userType, PERMISSIONS.READ, 'general');
};

// Check if user can access workspace
export const canAccessWorkspace = async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // All authenticated users can access workspace (read-only for students)
  return hasPermission(user.userType, PERMISSIONS.READ, 'general');
};

// Get user-friendly role name
export const getRoleName = (userRole) => {
  const roleNames = {
    [USER_ROLES.STUDENT]: 'Student',
    [USER_ROLES.TEACHER]: 'Teacher',
    [USER_ROLES.STAFF]: 'Staff',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.HEAD_OF_SECTION]: 'Head of Section',
    [USER_ROLES.HEAD_OF_SCHOOL]: 'Head of School',
  };

  return roleNames[userRole] || 'Unknown';
};

// Get accessible folders for user role
export const getAccessibleFolders = (userRole, allFolders) => {
  if (!allFolders) return [];

  // Students can only access student resources
  if (userRole === USER_ROLES.STUDENT) {
    return allFolders.filter(folder => 
      folder.type === 'student_resources' || 
      folder.type === 'public_resources'
    );
  }

  // Staff and teachers can access all folders
  return allFolders;
};

// Check if user can access specific folder
export const canAccessFolder = (userRole, folder) => {
  if (!folder) return false;

  // Students can only access student and public resources
  if (userRole === USER_ROLES.STUDENT) {
    return folder.type === 'student_resources' || 
           folder.type === 'public_resources' ||
           folder.type === 'branch_root';
  }

  // Staff and teachers can access all folders
  return true;
};

// Get upload file size limit based on user role
export const getUploadSizeLimit = (userRole) => {
  const limits = {
    [USER_ROLES.STUDENT]: 10 * 1024 * 1024, // 10MB
    [USER_ROLES.TEACHER]: 50 * 1024 * 1024, // 50MB
    [USER_ROLES.STAFF]: 50 * 1024 * 1024, // 50MB
    [USER_ROLES.HEAD_OF_SECTION]: 100 * 1024 * 1024, // 100MB
    [USER_ROLES.HEAD_OF_SCHOOL]: 100 * 1024 * 1024, // 100MB
    [USER_ROLES.ADMIN]: 100 * 1024 * 1024, // 100MB
  };

  return limits[userRole] || 10 * 1024 * 1024; // Default 10MB
};

// Get allowed file types based on user role
export const getAllowedFileTypes = (userRole) => {
  const studentTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'text/plain',
  ];

  const staffTypes = [
    ...studentTypes,
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'video/mp4', 'video/mov', 'video/avi',
    'audio/mp3', 'audio/wav',
  ];

  if (userRole === USER_ROLES.STUDENT) {
    return studentTypes;
  }

  return staffTypes;
};

// Check if file type is allowed for user
export const isFileTypeAllowed = (userRole, mimeType) => {
  const allowedTypes = getAllowedFileTypes(userRole);
  return allowedTypes.includes(mimeType);
};
