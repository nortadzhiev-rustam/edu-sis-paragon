/**
 * ProfilePhotoUpload Component
 *
 * A reusable component for profile photo upload with camera and gallery options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCamera,
  faImage,
  faUser,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';

const ProfilePhotoUpload = ({
  currentPhoto,
  onPhotoSelected,
  onPhotoRemoved,
  uploading = false,
  theme,
  size = 'large',
  editable = true,
  style = {},
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const styles = createStyles(theme, size);

  // Reset image load error when currentPhoto changes
  useEffect(() => {
    setImageLoadError(false);
  }, [currentPhoto]);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request media library permissions
      const libraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ PHOTO UPLOAD: Permission error:', error);
      return false;
    }
  };

  const handleCamera = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('📸 PHOTO UPLOAD: Camera photo selected:', {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          fileSize: photo.fileSize,
        });

        onPhotoSelected({
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          fileName: `camera_photo_${Date.now()}.jpg`,
          fileSize: photo.fileSize,
        });
      }
    } catch (error) {
      console.error('❌ PHOTO UPLOAD: Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('📸 PHOTO UPLOAD: Gallery photo selected:', {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          fileSize: photo.fileSize,
        });

        onPhotoSelected({
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          fileName: photo.fileName || `gallery_photo_${Date.now()}.jpg`,
          fileSize: photo.fileSize,
        });
      }
    } catch (error) {
      console.error('❌ PHOTO UPLOAD: Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handlePhotoOptions = () => {
    const options = [
      {
        text: 'Take Photo',
        onPress: handleCamera,
        icon: faCamera,
      },
      {
        text: 'Choose from Gallery',
        onPress: handleGallery,
        icon: faImage,
      },
    ];

    if (currentPhoto && onPhotoRemoved) {
      options.push({
        text: 'Remove Photo',
        onPress: () => {
          Alert.alert(
            'Remove Photo',
            'Are you sure you want to remove your profile photo?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: onPhotoRemoved,
              },
            ]
          );
        },
        icon: faTrash,
        style: 'destructive',
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Select Photo',
      'Choose how you want to update your photo',
      options
    );
  };

  // Clean up photo URL to remove incorrect storage/ path
  const cleanPhotoUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    // Remove the incorrect "storage/" part from the URL
    let cleanedUrl = url.replace(/\/storage\/+/g, '/');

    // Also fix any remaining double slashes (but preserve protocol://)
    cleanedUrl = cleanedUrl.replace(/([^:]\/)\/+/g, '$1');

    console.log('🔧 PROFILE PHOTO UPLOAD: Cleaned URL:', {
      original: url,
      cleaned: cleanedUrl,
      changed: url !== cleanedUrl,
    });

    return cleanedUrl;
  };

  const renderPhoto = () => {
    const cleanedPhotoUrl = cleanPhotoUrl(currentPhoto);

    console.log(
      '📸 PROFILE PHOTO UPLOAD: Rendering photo with currentPhoto:',
      currentPhoto,
      'Type:',
      typeof currentPhoto,
      'Length:',
      currentPhoto?.length,
      'Cleaned URL:',
      cleanedPhotoUrl
    );

    if (uploading) {
      return (
        <View style={[styles.photoContainer, styles.photoUploading]}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      );
    }

    if (cleanedPhotoUrl && !imageLoadError) {
      return (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: cleanedPhotoUrl }}
            style={styles.photo}
            resizeMode='cover'
            onError={(error) => {
              console.log('❌ PROFILE PHOTO UPLOAD: Image load error:', error);
              console.log(
                '❌ PROFILE PHOTO UPLOAD: Failed URL:',
                cleanedPhotoUrl
              );
              console.log(
                '❌ PROFILE PHOTO UPLOAD: Original URL:',
                currentPhoto
              );
              setImageLoadError(true);
            }}
            onLoad={() => {
              console.log('✅ PROFILE PHOTO UPLOAD: Image loaded successfully');
              console.log(
                '✅ PROFILE PHOTO UPLOAD: Loaded URL:',
                cleanedPhotoUrl
              );
              setImageLoadError(false);
            }}
          />
          {editable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handlePhotoOptions}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faEdit}
                size={16}
                color={theme.colors.surface}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.photoContainer, styles.photoPlaceholder]}
        onPress={editable ? handlePhotoOptions : undefined}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <FontAwesomeIcon
          icon={faUser}
          size={size === 'large' ? 40 : size === 'medium' ? 32 : 24}
          color={theme.colors.textLight}
        />
        {editable && <Text style={styles.placeholderText}>Add Photo</Text>}
      </TouchableOpacity>
    );
  };

  return <View style={[styles.container, style]}>{renderPhoto()}</View>;
};

const createStyles = (theme, size) => {
  const photoSize = size === 'large' ? 120 : size === 'medium' ? 80 : 60;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: 16,
    },
    photoContainer: {
      width: photoSize,
      height: photoSize,
      borderRadius: photoSize / 2,
      position: 'relative',
      // Remove overflow: 'hidden' to allow edit button to be fully visible
    },
    photo: {
      width: '100%',
      height: '100%',
      borderRadius: photoSize / 2, // Keep the circular shape for the photo
    },
    photoPlaceholder: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoUploading: {
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      position: 'absolute',
      bottom: -4, // Move slightly outside the photo container
      right: -4, // Move slightly outside the photo container
      backgroundColor: theme.colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
      // Add shadow for better visibility
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    placeholderText: {
      fontSize: 12,
      color: theme.colors.textLight,
      marginTop: 4,
      textAlign: 'center',
    },
    uploadingText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginTop: 8,
      textAlign: 'center',
    },
  });
};

export default ProfilePhotoUpload;
