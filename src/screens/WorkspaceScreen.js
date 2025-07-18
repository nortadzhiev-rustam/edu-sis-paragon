import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFolder,
  faFile,
  faSearch,
  faPlus,
  faUpload,
  faArrowLeft,
  faEllipsisV,
  faChartBar,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import {
  getResponsiveHeaderFontSize,
  createMediumShadow,
} from '../utils/commonStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getWorkspaceStructure,
  getFolderContents,
  getFileTypeIcon,
  formatFileSize,
  createWorkspaceFolder,
  searchWorkspaceFiles,
} from '../services/workspaceService';
import { createSmallShadow } from '../utils/commonStyles';
import {
  FileUploadHandler,
  WorkspaceStatistics,
} from '../components/workspace';
import {
  canUploadFiles,
  canCreateFolders,
  canDeleteItems,
  canAccessFolder,
  getCurrentUser,
  getAccessibleFolders,
} from '../utils/workspacePermissions';

export default function WorkspaceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Safety check for theme
  if (!theme || !theme.colors) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666666' }}>
            Loading workspace...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback theme in case of issues
  const fallbackTheme = {
    colors: {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      primary: '#007AFF',
      accent: '#FF6B6B',
      text: '#000000',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#E0E0E0',
      error: '#FF3B30',
    },
  };

  const safeTheme = theme || fallbackTheme;
  const styles = createStyles(safeTheme);

  // Navigation state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [isRootView, setIsRootView] = useState(true);

  // Data state
  const [workspaceData, setWorkspaceData] = useState(null);
  const [folderContents, setFolderContents] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // Permission state
  const [permissions, setPermissions] = useState({
    canUpload: false,
    canCreateFolder: false,
    canDelete: false,
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Load user permissions
  const loadUserPermissions = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const [canUpload, canCreateFolder, canDelete] = await Promise.all([
        canUploadFiles(),
        canCreateFolders(),
        canDeleteItems(),
      ]);

      setPermissions({
        canUpload,
        canCreateFolder,
        canDelete,
      });
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  }, []);

  // Load initial workspace structure
  const loadWorkspaceStructure = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWorkspaceStructure();
      if (response.success) {
        // Store the raw workspace data - filtering will be done in render
        setWorkspaceData(response.workspace);
        setIsRootView(true);
        setCurrentFolder(null);
        setFolderPath([]);
        setIsMockData(response._isMockData || false);
      } else {
        setError('Failed to load workspace');
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
      setError('Failed to load workspace: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Remove currentUser dependency

  // Load folder contents
  const loadFolderContents = useCallback(async (folderId, folderName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getFolderContents(folderId);
      if (response.success) {
        setFolderContents(response);
        setCurrentFolder({ id: folderId, name: folderName });
        setIsRootView(false);
      } else {
        setError('Failed to load folder contents');
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
      setError('Failed to load folder contents: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Navigate to folder
  const navigateToFolder = useCallback(
    (folder) => {
      const newPath = [...folderPath, { id: folder.id, name: folder.name }];
      setFolderPath(newPath);
      loadFolderContents(folder.id, folder.name);
    },
    [folderPath, loadFolderContents]
  );

  // Navigate back
  const navigateBack = useCallback(() => {
    if (isRootView && folderPath.length === 0) {
      // At root level - go back to the calling screen (TeacherScreen or ParentScreen)
      navigation.goBack();
    } else if (folderPath.length === 0) {
      // Go back to root
      loadWorkspaceStructure();
    } else {
      // Go back to previous folder
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);

      if (newPath.length === 0) {
        loadWorkspaceStructure();
      } else {
        const parentFolder = newPath[newPath.length - 1];
        loadFolderContents(parentFolder.id, parentFolder.name);
      }
    }
  }, [
    isRootView,
    folderPath,
    navigation,
    loadWorkspaceStructure,
    loadFolderContents,
  ]);

  // Handle file press
  const handleFilePress = useCallback((file) => {
    if (file.web_view_link) {
      // Open file in browser or show preview
      Alert.alert(file.name, 'Choose an action:', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Online',
          onPress: () => {
            // TODO: Open in browser or WebView
            console.log('Opening file:', file.web_view_link);
          },
        },
        {
          text: 'Download',
          onPress: () => {
            // TODO: Download file
            console.log('Downloading file:', file.web_content_link);
          },
        },
      ]);
    }
  }, []);

  // Handle file upload success
  const handleUploadSuccess = useCallback(
    (uploadedFile) => {
      console.log('File uploaded successfully:', uploadedFile);
      // Refresh current folder contents
      onRefresh();
    },
    [onRefresh]
  );

  // Handle file upload error
  const handleUploadError = useCallback((error) => {
    console.error('File upload error:', error);
  }, []);

  // Handle search
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      setError(null);

      const response = await searchWorkspaceFiles(query.trim());
      if (response.success) {
        setSearchResults(response.results);
      } else {
        setError('Search failed');
      }
    } catch (error) {
      console.error('Error searching files:', error);
      setError('Search failed: ' + error.message);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      const parentFolderId =
        currentFolder?.id || workspaceData?.root_folder?.id;
      if (!parentFolderId) {
        Alert.alert('Error', 'Cannot determine parent folder');
        return;
      }

      const response = await createWorkspaceFolder(
        newFolderName.trim(),
        parentFolderId,
        newFolderDescription.trim()
      );

      if (response.success) {
        Alert.alert('Success', 'Folder created successfully!');
        setShowCreateFolder(false);
        setNewFolderName('');
        setNewFolderDescription('');
        onRefresh();
      } else {
        Alert.alert('Error', 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder: ' + error.message);
    }
  }, [
    newFolderName,
    newFolderDescription,
    currentFolder,
    workspaceData,
    onRefresh,
  ]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isRootView) {
      loadWorkspaceStructure();
    } else if (currentFolder) {
      loadFolderContents(currentFolder.id, currentFolder.name);
    }
  }, [isRootView, currentFolder, loadWorkspaceStructure, loadFolderContents]);

  // Initial load
  useEffect(() => {
    const initializeWorkspace = async () => {
      await loadUserPermissions();
      await loadWorkspaceStructure();
    };

    initializeWorkspace();
  }, []); // Empty dependency array to run only once

  // Render folder item
  const renderFolderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigateToFolder(item)}
    >
      <View style={styles.itemIcon}>
        <FontAwesomeIcon
          icon={faFolder}
          size={24}
          color={safeTheme.colors.primary}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description || 'Folder'}
        </Text>
        {item.file_count !== undefined && (
          <Text style={styles.itemMeta}>
            {item.file_count} files
            {item.total_size && ` • ${item.total_size}`}
          </Text>
        )}
      </View>
      <FontAwesomeIcon
        icon={faEllipsisV}
        size={16}
        color={safeTheme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  // Render file item
  const renderFileItem = ({ item }) => {
    const fileIcon = getFileTypeIcon(item.name, item.mime_type);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleFilePress(item)}
      >
        <View style={styles.itemIcon}>
          <FontAwesomeIcon
            icon={fileIcon}
            size={24}
            color={safeTheme.colors.accent}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description || item.file_type?.toUpperCase() || 'File'}
          </Text>
          <Text style={styles.itemMeta}>
            {item.formatted_size || formatFileSize(item.size || 0)}
            {item.uploader_name && ` • ${item.uploader_name}`}
          </Text>
        </View>
        <FontAwesomeIcon
          icon={faEllipsisV}
          size={16}
          color={safeTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.compactHeaderContainer}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              fontSize: getResponsiveHeaderFontSize(2, 'Workspace'),
            },
          ]}
          numberOfLines={1}
        >
          {searchResults
            ? 'Search Results'
            : isRootView
            ? 'Workspace'
            : currentFolder?.name || 'Folder'}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setShowActions(true)}
          >
            <FontAwesomeIcon icon={faEllipsisV} size={18} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle section */}
      {(searchResults || isMockData || folderPath.length > 0) && (
        <View style={styles.subtitleContainer}>
          {searchResults ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {searching
                ? 'Searching...'
                : `${searchResults.length} results found`}
            </Text>
          ) : isMockData ? (
            <Text
              style={[
                styles.headerSubtitle,
                { color: safeTheme.colors.accent },
              ]}
              numberOfLines={1}
            >
              Demo Mode - API Not Connected
            </Text>
          ) : (
            folderPath.length > 0 && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {folderPath.map((p) => p.name).join(' / ')}
              </Text>
            )
          )}
        </View>
      )}

      {showSearch && (
        <View style={styles.searchContainer}>
          <FontAwesomeIcon
            icon={faSearch}
            size={16}
            color={safeTheme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search files and folders...'
            placeholderTextColor={safeTheme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={safeTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare data for rendering
  const renderData = searchResults
    ? searchResults
    : isRootView
    ? currentUser && workspaceData?.folders
      ? getAccessibleFolders(currentUser.userType, workspaceData.folders)
      : workspaceData?.folders || []
    : [...(folderContents?.folders || []), ...(folderContents?.files || [])];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {renderHeader()}

      <View style={styles.content}>
        <FlatList
          data={renderData}
          keyExtractor={(item) => item.id}
          renderItem={
            searchResults
              ? (item) =>
                  item.item.type === 'folder'
                    ? renderFolderItem(item)
                    : renderFileItem(item)
              : isRootView
              ? renderFolderItem
              : (item) =>
                  item.item.type === 'folder'
                    ? renderFolderItem(item)
                    : renderFileItem(item)
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[safeTheme.colors.primary]}
              tintColor={safeTheme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType='fade'
        onRequestClose={() => setShowActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionMenuContainer}>
            <Text style={styles.actionMenuTitle}>Workspace Actions</Text>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActions(false);
                setShowSearch(!showSearch);
              }}
            >
              <FontAwesomeIcon
                icon={faSearch}
                size={20}
                color={safeTheme.colors.primary}
              />
              <Text style={styles.actionMenuText}>
                {showSearch ? 'Hide Search' : 'Search Files'}
              </Text>
            </TouchableOpacity>

            {!isRootView && permissions.canCreateFolder && (
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  setShowActions(false);
                  setShowCreateFolder(true);
                }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  size={20}
                  color={safeTheme.colors.primary}
                />
                <Text style={styles.actionMenuText}>Create Folder</Text>
              </TouchableOpacity>
            )}

            {!isRootView && permissions.canUpload && (
              <View style={styles.uploadSection}>
                <FileUploadHandler
                  folderId={currentFolder?.id}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setShowActions(false);
                setShowStatistics(true);
              }}
            >
              <FontAwesomeIcon
                icon={faChartBar}
                size={20}
                color={safeTheme.colors.primary}
              />
              <Text style={styles.actionMenuText}>View Statistics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelMenuItem}
              onPress={() => setShowActions(false)}
            >
              <Text style={styles.cancelMenuText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolder}
        transparent
        animationType='slide'
        onRequestClose={() => setShowCreateFolder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createFolderContainer}>
            <Text style={styles.createFolderTitle}>Create New Folder</Text>

            <TextInput
              style={styles.folderNameInput}
              placeholder='Folder name'
              placeholderTextColor={safeTheme.colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={50}
            />

            <TextInput
              style={styles.folderDescriptionInput}
              placeholder='Description (optional)'
              placeholderTextColor={safeTheme.colors.textSecondary}
              value={newFolderDescription}
              onChangeText={setNewFolderDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.createFolderActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setNewFolderDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateFolder}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatistics}
        animationType='slide'
        onRequestClose={() => setShowStatistics(false)}
      >
        <WorkspaceStatistics onClose={() => setShowStatistics(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles (matching ParentScreen)
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      ...createMediumShadow(theme),
      overflow: 'hidden',
      zIndex: 1,
    },
    navigationHeader: {
      backgroundColor: theme.colors.headerBackground,
      padding: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    subtitleContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 15,
      paddingBottom: 10,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    // Legacy header styles (keeping for compatibility)
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      ...createSmallShadow(theme),
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 15,
      marginBottom: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    listContainer: {
      padding: 16,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...createSmallShadow(theme),
    },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    itemDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    itemMeta: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.surface,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionMenuContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 280,
      ...createSmallShadow(theme),
    },
    actionMenuTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    actionMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionMenuText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
    },
    uploadSection: {
      marginVertical: 8,
    },
    cancelMenuItem: {
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      marginTop: 8,
      alignItems: 'center',
    },
    cancelMenuText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    createFolderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 320,
      ...createSmallShadow(theme),
    },
    createFolderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    folderNameInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    folderDescriptionInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      textAlignVertical: 'top',
      minHeight: 80,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    createFolderActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      marginRight: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    createButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      marginLeft: 8,
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.surface,
    },
  });
