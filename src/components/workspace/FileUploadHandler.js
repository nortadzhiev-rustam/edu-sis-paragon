import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faUpload,
  faCamera,
  faImage,
  faFile,
  faTimes,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadWorkspaceFile } from '../../services/workspaceService';
import { createSmallShadow } from '../../utils/commonStyles';
import {
  getCurrentUser,
  getUploadSizeLimit,
  getAllowedFileTypes,
  isFileTypeAllowed,
} from '../../utils/workspacePermissions';

const FileUploadHandler = ({
  folderId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
}) => {
  const { theme } = useTheme();

  // Initialize hooks first (before any early returns)
  const [showOptions, setShowOptions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [maxFileSize, setMaxFileSize] = useState(100 * 1024 * 1024);

  // Load user permissions on mount
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
          if (user) {
            const sizeLimit = getUploadSizeLimit(user.userType);
            setMaxFileSize(sizeLimit);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback theme for when the context is not ready
  const fallbackTheme = {
    colors: {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      primary: '#007AFF',
      textSecondary: '#666666',
      border: '#E0E0E0',
      text: '#000000',
    },
  };

  // Safety check for theme
  if (!theme?.colors) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator size='small' color='#007AFF' />
        <Text style={{ marginTop: 8, fontSize: 14, color: '#666666' }}>
          Loading...
        </Text>
      </View>
    );
  }

  const styles = createStyles(theme);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to upload images.'
      );
      return false;
    }
    return true;
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    setShowOptions(false);

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Add a small delay to ensure UI state is settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await validateAndPrepareFile(asset);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      if (!error.message.includes('User cancelled')) {
        setTimeout(() => {
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }, 100);
      }
    }
  };

  // Handle image selection
  const handleImagePicker = async () => {
    setShowOptions(false);

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Add a small delay to ensure UI state is settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await validateAndPrepareFile(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (!error.message.includes('User cancelled')) {
        setTimeout(() => {
          Alert.alert('Error', 'Failed to select image. Please try again.');
        }, 100);
      }
    }
  };

  // Handle document selection
  const handleDocumentPicker = async () => {
    setShowOptions(false);

    try {
      // Add a small delay to ensure UI state is settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false, // Changed to false to avoid cache issues
        multiple: false,
      });

      console.log('Document picker result:', result);

      // Check if component is still mounted before proceeding
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await validateAndPrepareFile(asset);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      // More specific error handling
      if (
        error.message.includes('User cancelled') ||
        error.message.includes('canceled')
      ) {
        // User cancelled, don't show error
        return;
      }
      // Only show alert if component is still active
      setTimeout(() => {
        Alert.alert('Error', 'Failed to select document. Please try again.');
      }, 100);
    }
  };

  // Validate and prepare file for upload
  const validateAndPrepareFile = async (file) => {
    // Check file size
    if (file.size && file.size > maxFileSize) {
      Alert.alert(
        'File Too Large',
        `Please select a file smaller than ${Math.round(
          maxFileSize / (1024 * 1024)
        )}MB`
      );
      return;
    }

    // Check file type based on user role
    if (
      file.mimeType &&
      currentUser &&
      !isFileTypeAllowed(currentUser.userType, file.mimeType)
    ) {
      Alert.alert(
        'Unsupported File Type',
        'This file type is not allowed for your user role. Please contact your administrator for more information.'
      );
      return;
    }

    setSelectedFile(file);
    setShowDescriptionModal(true);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setShowDescriptionModal(false);

      // Create file object for upload
      const fileToUpload = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name || 'upload',
      };

      const response = await uploadWorkspaceFile(
        folderId,
        fileToUpload,
        fileDescription.trim()
      );

      if (response.success) {
        onUploadSuccess?.(response.file);
        Alert.alert('Success', 'File uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onUploadError?.(error);
      Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setFileDescription('');
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    setShowDescriptionModal(false);
    setSelectedFile(null);
    setFileDescription('');
  };

  if (uploading) {
    return (
      <View style={styles.uploadingContainer}>
        <ActivityIndicator size='small' color={theme.colors.primary} />
        <Text style={styles.uploadingText}>Uploading...</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.uploadButton, disabled && styles.disabledButton]}
        onPress={() => setShowOptions(true)}
        disabled={disabled}
      >
        <FontAwesomeIcon
          icon={faUpload}
          size={16}
          color={disabled ? theme.colors.textSecondary : theme.colors.surface}
        />
        <Text
          style={[styles.uploadButtonText, disabled && styles.disabledText]}
        >
          Upload File
        </Text>
      </TouchableOpacity>

      {/* Upload Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType='fade'
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Upload File</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOptions(false)}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCameraCapture}
            >
              <FontAwesomeIcon
                icon={faCamera}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleImagePicker}
            >
              <FontAwesomeIcon
                icon={faImage}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.optionText}>Choose Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDocumentPicker}
            >
              <FontAwesomeIcon
                icon={faFile}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.optionText}>Choose Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* File Description Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent
        animationType='slide'
        onRequestClose={cancelUpload}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Add Description</Text>
            <Text style={styles.descriptionSubtitle}>
              {selectedFile?.name || 'Selected file'}
            </Text>

            <TextInput
              style={styles.descriptionInput}
              placeholder='Enter file description (optional)'
              placeholderTextColor={theme.colors.textSecondary}
              value={fileDescription}
              onChangeText={setFileDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.descriptionActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelUpload}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadConfirmButton}
                onPress={handleFileUpload}
              >
                <Text style={styles.uploadConfirmButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      ...createSmallShadow(theme),
    },
    disabledButton: {
      backgroundColor: theme.colors.border,
    },
    uploadButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.surface,
      marginLeft: 8,
    },
    disabledText: {
      color: theme.colors.textSecondary,
    },
    uploadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    uploadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 280,
      ...createSmallShadow(theme),
    },
    optionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    optionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
    },
    descriptionContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      minWidth: 320,
      ...createSmallShadow(theme),
    },
    descriptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    descriptionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    descriptionInput: {
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
    descriptionActions: {
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
    uploadConfirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      marginLeft: 8,
      alignItems: 'center',
    },
    uploadConfirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.surface,
    },
  });

export default FileUploadHandler;
