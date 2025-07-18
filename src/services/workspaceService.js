/**
 * Workspace Service
 * Handles all Google Drive workspace-related API calls including file management,
 * folder operations, search, and statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config, buildApiUrl } from '../config/env';

// Temporary flag for testing with mock data
const USE_MOCK_DATA = false; // Set to false when backend API is ready

// Mock data for testing
const mockWorkspaceStructure = {
  root_folder: {
    id: '1ABC123',
    name: 'SIS - Main Campus',
    type: 'branch_root',
    description: 'Main workspace folder for Main Campus branch',
    icon: 'fas fa-building',
    color: 'primary',
    web_link: 'https://drive.google.com/drive/folders/1ABC123',
    created_at: '2025-01-11 10:00:00',
    creator_name: 'System',
  },
  folders: [
    {
      id: '1DEF456',
      name: 'Staff Resources',
      type: 'staff_resources',
      description: 'Resources shared among staff members',
      icon: 'fas fa-users',
      color: 'success',
      web_link: 'https://drive.google.com/drive/folders/1DEF456',
      file_count: 25,
      total_size: '150.5 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
    },
    {
      id: '1GHI789',
      name: 'Student Resources',
      type: 'student_resources',
      description: 'Resources available to students',
      icon: 'fas fa-graduation-cap',
      color: 'info',
      web_link: 'https://drive.google.com/drive/folders/1GHI789',
      file_count: 15,
      total_size: '75.2 MB',
      created_at: '2025-01-11 10:00:00',
      creator_name: 'System',
    },
  ],
};

const mockFolderContents = {
  folder_info: {
    id: '1DEF456',
    name: 'Staff Resources',
    type: 'staff_resources',
    description: 'Resources shared among staff members',
    path: 'SIS - Main Campus / Staff Resources',
    icon: 'fas fa-users',
    color: 'success',
    web_link: 'https://drive.google.com/drive/folders/1DEF456',
    created_at: '2025-01-11 10:00:00',
    creator_name: 'System',
  },
  folders: [
    {
      id: '1JKL012',
      name: 'Lesson Plans',
      type: 'folder',
      folder_type: 'custom',
      description: 'Teacher lesson plans',
      icon: 'fas fa-folder',
      color: 'dark',
      web_link: 'https://drive.google.com/drive/folders/1JKL012',
      file_count: 12,
      created_at: '2025-01-11 11:00:00',
      creator_name: 'John Teacher',
    },
  ],
  files: [
    {
      id: '1MNO345',
      name: 'Staff Handbook 2025.pdf',
      original_name: 'Staff Handbook 2025.pdf',
      type: 'file',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      size: 2048576,
      formatted_size: '2.0 MB',
      description: 'Updated staff handbook for 2025',
      web_view_link: 'https://drive.google.com/file/d/1MNO345/view',
      web_content_link: 'https://drive.google.com/uc?id=1MNO345',
      is_google_file: false,
      is_shared: true,
      created_at: '2025-01-11 12:00:00',
      uploader_name: 'Admin User',
    },
    {
      id: '1PQR678',
      name: 'Meeting Notes.docx',
      original_name: 'Meeting Notes.docx',
      type: 'file',
      file_type: 'office',
      mime_type:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 524288,
      formatted_size: '512 KB',
      description: 'Weekly staff meeting notes',
      web_view_link: 'https://drive.google.com/file/d/1PQR678/view',
      web_content_link: 'https://drive.google.com/uc?id=1PQR678',
      is_google_file: false,
      is_shared: true,
      created_at: '2025-01-11 11:30:00',
      uploader_name: 'John Teacher',
    },
    {
      id: '1STU901',
      name: 'School Logo.png',
      original_name: 'School Logo.png',
      type: 'file',
      file_type: 'image',
      mime_type: 'image/png',
      size: 102400,
      formatted_size: '100 KB',
      description: 'Official school logo',
      web_view_link: 'https://drive.google.com/file/d/1STU901/view',
      web_content_link: 'https://drive.google.com/uc?id=1STU901',
      is_google_file: false,
      is_shared: true,
      created_at: '2025-01-11 10:15:00',
      uploader_name: 'Design Team',
    },
  ],
  total_items: 15,
};

// Helper function to get auth code
const getAuthCode = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.authCode;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth code:', error);
    return null;
  }
};

// Helper function to make API requests
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: Config.NETWORK.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get the main workspace structure for the user's branch
 * @returns {Promise<Object>} - Workspace structure data
 */
export const getWorkspaceStructure = async () => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (USE_MOCK_DATA) {
      console.log('📁 WORKSPACE: Loading demo data');
      return {
        success: true,
        workspace: mockWorkspaceStructure,
        branch_id: 1,
        user_type: 'staff',
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STRUCTURE, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching workspace structure:', error);

    // Check if it's a 404 error (API not implemented yet)
    if (error.message.includes('404')) {
      console.log(
        '📝 WORKSPACE: API endpoint not found (404), using mock data'
      );
      return {
        success: true,
        workspace: mockWorkspaceStructure,
        branch_id: 1,
        user_type: 'staff',
        _isMockData: true,
      };
    }

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('📝 WORKSPACE: API failed, falling back to mock data');
      return {
        success: true,
        workspace: mockWorkspaceStructure,
        branch_id: 1,
        user_type: 'staff',
        _isMockData: true,
      };
    }

    throw error;
  }
};

/**
 * Get files and subfolders within a specific folder
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Object>} - Folder contents data
 */
export const getFolderContents = async (folderId) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (!folderId) {
      throw new Error('Folder ID is required');
    }

    if (USE_MOCK_DATA) {
      console.log('📁 WORKSPACE: Loading demo folder contents');
      return {
        success: true,
        ...mockFolderContents,
      };
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_FOLDER_CONTENTS, {
      authCode,
      folder_id: folderId,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching folder contents:', error);

    // Check if it's a 404 error (API not implemented yet)
    if (error.message.includes('404')) {
      console.log(
        '📝 WORKSPACE: Folder contents API not found (404), using mock data'
      );
      return {
        success: true,
        ...mockFolderContents,
        _isMockData: true,
      };
    }

    // Fallback to mock data if API fails
    if (!USE_MOCK_DATA) {
      console.log('📝 WORKSPACE: API failed, falling back to mock data');
      return {
        success: true,
        ...mockFolderContents,
        _isMockData: true,
      };
    }

    throw error;
  }
};

/**
 * Upload a file to a specific folder in the workspace
 * @param {string} folderId - Target folder ID
 * @param {Object} file - File object to upload
 * @param {string} description - Optional file description
 * @returns {Promise<Object>} - Upload response data
 */
export const uploadWorkspaceFile = async (folderId, file, description = '') => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (!folderId) {
      throw new Error('Folder ID is required');
    }

    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('authCode', authCode);
    formData.append('folder_id', folderId);
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.UPLOAD_WORKSPACE_FILE);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: Config.NETWORK.TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Create a new folder in the workspace (staff only)
 * @param {string} folderName - Name for the new folder
 * @param {string} parentFolderId - Parent folder ID
 * @param {string} description - Optional folder description
 * @returns {Promise<Object>} - Create folder response data
 */
export const createWorkspaceFolder = async (
  folderName,
  parentFolderId,
  description = ''
) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (!folderName) {
      throw new Error('Folder name is required');
    }

    if (!parentFolderId) {
      throw new Error('Parent folder ID is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.CREATE_WORKSPACE_FOLDER);

    return await makeApiRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        authCode,
        folder_name: folderName,
        parent_folder_id: parentFolderId,
        description,
      }),
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Search for files across the workspace
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Search results data
 */
export const searchWorkspaceFiles = async (query) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (!query) {
      throw new Error('Search query is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.SEARCH_WORKSPACE_FILES, {
      authCode,
      query,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
};

/**
 * Get recently uploaded files from the workspace
 * @param {number} limit - Number of files to return (default: 20, max: 50)
 * @returns {Promise<Object>} - Recent files data
 */
export const getRecentWorkspaceFiles = async (limit = 20) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_RECENT_WORKSPACE_FILES, {
      authCode,
      limit: Math.min(limit, 50), // Ensure limit doesn't exceed 50
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching recent files:', error);
    throw error;
  }
};

/**
 * Get statistics about the workspace usage
 * @returns {Promise<Object>} - Workspace statistics data
 */
export const getWorkspaceStatistics = async () => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.GET_WORKSPACE_STATISTICS, {
      authCode,
    });
    return await makeApiRequest(url);
  } catch (error) {
    console.error('Error fetching workspace statistics:', error);
    throw error;
  }
};

/**
 * Delete a file or folder from the workspace (staff only)
 * @param {string} itemId - ID of the file or folder to delete
 * @param {boolean} isFolder - Set to true if deleting a folder (default: false)
 * @returns {Promise<Object>} - Delete response data
 */
export const deleteWorkspaceItem = async (itemId, isFolder = false) => {
  try {
    const authCode = await getAuthCode();
    if (!authCode) {
      throw new Error('No authentication code found');
    }

    if (!itemId) {
      throw new Error('Item ID is required');
    }

    const url = buildApiUrl(Config.API_ENDPOINTS.DELETE_WORKSPACE_ITEM);

    return await makeApiRequest(url, {
      method: 'POST', // Using POST as mentioned in API docs
      body: JSON.stringify({
        authCode,
        item_id: itemId,
        is_folder: isFolder,
      }),
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

/**
 * Get file type icon based on file extension or mime type
 * @param {string} fileName - File name
 * @param {string} mimeType - File mime type
 * @returns {string} - FontAwesome icon name
 */
export const getFileTypeIcon = (fileName, mimeType) => {
  const extension = fileName.split('.').pop().toLowerCase();

  // Document types
  if (['pdf'].includes(extension) || mimeType?.includes('pdf')) {
    return 'fas fa-file-pdf';
  }
  if (['doc', 'docx'].includes(extension) || mimeType?.includes('word')) {
    return 'fas fa-file-word';
  }
  if (['xls', 'xlsx'].includes(extension) || mimeType?.includes('sheet')) {
    return 'fas fa-file-excel';
  }
  if (
    ['ppt', 'pptx'].includes(extension) ||
    mimeType?.includes('presentation')
  ) {
    return 'fas fa-file-powerpoint';
  }

  // Image types
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension) ||
    mimeType?.includes('image')
  ) {
    return 'fas fa-file-image';
  }

  // Video types
  if (
    ['mp4', 'mov', 'avi', 'mkv', 'wmv'].includes(extension) ||
    mimeType?.includes('video')
  ) {
    return 'fas fa-file-video';
  }

  // Audio types
  if (
    ['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(extension) ||
    mimeType?.includes('audio')
  ) {
    return 'fas fa-file-audio';
  }

  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'fas fa-file-archive';
  }

  // Text types
  if (['txt', 'csv'].includes(extension) || mimeType?.includes('text')) {
    return 'fas fa-file-alt';
  }

  // Default file icon
  return 'fas fa-file';
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
