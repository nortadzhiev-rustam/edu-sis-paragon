import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  getWorkspaceStructure,
  getFolderContents,
  uploadWorkspaceFile,
  createWorkspaceFolder,
  searchWorkspaceFiles,
  getRecentWorkspaceFiles,
  getWorkspaceStatistics,
  deleteWorkspaceItem,
} from '../services/workspaceService';

// Initial state
const initialState = {
  workspaceStructure: null,
  currentFolder: null,
  folderContents: {},
  searchResults: null,
  recentFiles: null,
  statistics: null,
  loading: false,
  error: null,
  uploadProgress: {},
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_WORKSPACE_STRUCTURE: 'SET_WORKSPACE_STRUCTURE',
  SET_CURRENT_FOLDER: 'SET_CURRENT_FOLDER',
  SET_FOLDER_CONTENTS: 'SET_FOLDER_CONTENTS',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_RECENT_FILES: 'SET_RECENT_FILES',
  SET_STATISTICS: 'SET_STATISTICS',
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
  RESET_STATE: 'RESET_STATE',
};

// Reducer
const workspaceReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.SET_WORKSPACE_STRUCTURE:
      return { 
        ...state, 
        workspaceStructure: action.payload, 
        loading: false, 
        error: null 
      };
    
    case ActionTypes.SET_CURRENT_FOLDER:
      return { ...state, currentFolder: action.payload };
    
    case ActionTypes.SET_FOLDER_CONTENTS:
      return {
        ...state,
        folderContents: {
          ...state.folderContents,
          [action.payload.folderId]: action.payload.contents,
        },
        loading: false,
        error: null,
      };
    
    case ActionTypes.SET_SEARCH_RESULTS:
      return { 
        ...state, 
        searchResults: action.payload, 
        loading: false, 
        error: null 
      };
    
    case ActionTypes.SET_RECENT_FILES:
      return { 
        ...state, 
        recentFiles: action.payload, 
        loading: false, 
        error: null 
      };
    
    case ActionTypes.SET_STATISTICS:
      return { 
        ...state, 
        statistics: action.payload, 
        loading: false, 
        error: null 
      };
    
    case ActionTypes.SET_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.fileId]: action.payload.progress,
        },
      };
    
    case ActionTypes.CLEAR_SEARCH:
      return { ...state, searchResults: null };
    
    case ActionTypes.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Create context
const WorkspaceContext = createContext();

// Provider component
export const WorkspaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  // Load workspace structure
  const loadWorkspaceStructure = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      const response = await getWorkspaceStructure();
      if (response.success) {
        dispatch({ 
          type: ActionTypes.SET_WORKSPACE_STRUCTURE, 
          payload: response.workspace 
        });
      } else {
        dispatch({ 
          type: ActionTypes.SET_ERROR, 
          payload: 'Failed to load workspace structure' 
        });
      }
    } catch (error) {
      console.error('Error loading workspace structure:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
    }
  }, []);

  // Load folder contents
  const loadFolderContents = useCallback(async (folderId, forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && state.folderContents[folderId]) {
        return state.folderContents[folderId];
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      const response = await getFolderContents(folderId);
      if (response.success) {
        dispatch({
          type: ActionTypes.SET_FOLDER_CONTENTS,
          payload: {
            folderId,
            contents: response,
          },
        });
        return response;
      } else {
        dispatch({ 
          type: ActionTypes.SET_ERROR, 
          payload: 'Failed to load folder contents' 
        });
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
    }
  }, [state.folderContents]);

  // Upload file
  const uploadFile = useCallback(async (folderId, file, description = '') => {
    try {
      const fileId = `${Date.now()}_${file.name}`;
      
      // Set initial upload progress
      dispatch({
        type: ActionTypes.SET_UPLOAD_PROGRESS,
        payload: { fileId, progress: 0 },
      });

      const response = await uploadWorkspaceFile(folderId, file, description);
      
      if (response.success) {
        // Clear upload progress
        dispatch({
          type: ActionTypes.SET_UPLOAD_PROGRESS,
          payload: { fileId, progress: 100 },
        });

        // Refresh folder contents
        await loadFolderContents(folderId, true);
        
        return response;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, [loadFolderContents]);

  // Create folder
  const createFolder = useCallback(async (folderName, parentFolderId, description = '') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const response = await createWorkspaceFolder(folderName, parentFolderId, description);
      
      if (response.success) {
        // Refresh parent folder contents
        await loadFolderContents(parentFolderId, true);
        return response;
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, [loadFolderContents]);

  // Search files
  const searchFiles = useCallback(async (query) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.SET_ERROR, payload: null });

      const response = await searchWorkspaceFiles(query);
      if (response.success) {
        dispatch({ 
          type: ActionTypes.SET_SEARCH_RESULTS, 
          payload: response.results 
        });
      } else {
        dispatch({ 
          type: ActionTypes.SET_ERROR, 
          payload: 'Search failed' 
        });
      }
    } catch (error) {
      console.error('Error searching files:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
    }
  }, []);

  // Load recent files
  const loadRecentFiles = useCallback(async (limit = 20) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const response = await getRecentWorkspaceFiles(limit);
      if (response.success) {
        dispatch({ 
          type: ActionTypes.SET_RECENT_FILES, 
          payload: response.recent_files 
        });
      } else {
        dispatch({ 
          type: ActionTypes.SET_ERROR, 
          payload: 'Failed to load recent files' 
        });
      }
    } catch (error) {
      console.error('Error loading recent files:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const response = await getWorkspaceStatistics();
      if (response.success) {
        dispatch({ 
          type: ActionTypes.SET_STATISTICS, 
          payload: response.statistics 
        });
      } else {
        dispatch({ 
          type: ActionTypes.SET_ERROR, 
          payload: 'Failed to load statistics' 
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (itemId, isFolder = false, parentFolderId = null) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const response = await deleteWorkspaceItem(itemId, isFolder);
      if (response.success) {
        // Refresh parent folder contents if provided
        if (parentFolderId) {
          await loadFolderContents(parentFolderId, true);
        }
        return response;
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, [loadFolderContents]);

  // Clear search results
  const clearSearch = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SEARCH });
  }, []);

  // Set current folder
  const setCurrentFolder = useCallback((folder) => {
    dispatch({ type: ActionTypes.SET_CURRENT_FOLDER, payload: folder });
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    loadWorkspaceStructure,
    loadFolderContents,
    uploadFile,
    createFolder,
    searchFiles,
    loadRecentFiles,
    loadStatistics,
    deleteItem,
    clearSearch,
    setCurrentFolder,
    resetState,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// Hook to use workspace context
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
