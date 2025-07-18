import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChartBar,
  faFile,
  faFolder,
  faHardDrive,
  faUsers,
  faUpload,
  faFilePdf,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getWorkspaceStatistics } from '../../services/workspaceService';
import { createSmallShadow } from '../../utils/commonStyles';

const WorkspaceStatistics = ({ onClose }) => {
  const { theme } = useTheme();

  // Initialize hooks first (before any early returns)
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load statistics
  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWorkspaceStatistics();
      if (response.success) {
        setStatistics(response.statistics);
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      setError('Failed to load statistics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // Safety check for theme
  if (!theme?.colors) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        edges={['top', 'left', 'right']}
      >
        <View
          style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 16,
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 8,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              backgroundColor: '#007AFF',
              padding: 15,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ width: 36, height: 36 }} />
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'center',
              }}
            >
              Workspace Statistics
            </Text>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={onClose}
            >
              <FontAwesomeIcon icon={faTimes} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666666' }}>
            Loading statistics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback theme
  const fallbackTheme = {
    colors: {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      primary: '#007AFF',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
    },
  };

  const styles = createStyles(theme);

  // Get file type icon
  const getFileTypeIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return faFilePdf;
      case 'images':
        return faFileImage;
      case 'videos':
        return faFileVideo;
      case 'audio':
        return faFileAudio;
      case 'google docs':
      case 'office':
        return faFileWord;
      case 'excel':
        return faFileExcel;
      case 'powerpoint':
        return faFilePowerpoint;
      default:
        return faFile;
    }
  };

  // Get file type color
  const getFileTypeColor = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '#FF6B6B';
      case 'images':
        return '#4ECDC4';
      case 'videos':
        return '#45B7D1';
      case 'audio':
        return '#96CEB4';
      case 'google docs':
      case 'office':
        return '#4A90E2';
      case 'excel':
        return '#50C878';
      case 'powerpoint':
        return '#FF8C42';
      default:
        return theme.colors.textSecondary;
    }
  };

  // Render statistic card
  const renderStatCard = (title, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesomeIcon icon={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  // Render file type breakdown
  const renderFileTypeBreakdown = () => {
    if (!statistics?.file_types) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>File Types</Text>
        <View style={styles.fileTypesContainer}>
          {Object.entries(statistics.file_types).map(([type, count]) => (
            <View key={type} style={styles.fileTypeItem}>
              <View style={styles.fileTypeIcon}>
                <FontAwesomeIcon
                  icon={getFileTypeIcon(type)}
                  size={16}
                  color={getFileTypeColor(type)}
                />
              </View>
              <Text style={styles.fileTypeName}>{type}</Text>
              <Text style={styles.fileTypeCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.compactHeaderContainer}>
          <View style={styles.navigationHeader}>
            <View style={styles.headerLeft} />
            <Text style={styles.headerTitle}>Workspace Statistics</Text>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={onClose}
            >
              <FontAwesomeIcon icon={faTimes} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.compactHeaderContainer}>
          <View style={styles.navigationHeader}>
            <View style={styles.headerLeft} />
            <Text style={styles.headerTitle}>Workspace Statistics</Text>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={onClose}
            >
              <FontAwesomeIcon icon={faTimes} size={18} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.compactHeaderContainer}>
        <View style={styles.navigationHeader}>
          <View style={styles.headerLeft} />

          <Text style={styles.headerTitle}>Workspace Statistics</Text>

          <TouchableOpacity style={styles.headerActionButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimes} size={18} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Files',
              statistics?.total_files || 0,
              faFile,
              theme.colors.primary
            )}
            {renderStatCard(
              'Total Folders',
              statistics?.total_folders || 0,
              faFolder,
              '#000000'
            )}
            {renderStatCard(
              'Storage Used',
              statistics?.formatted_total_size || '0 MB',
              faHardDrive,
              '#FF6B6B'
            )}
            {renderStatCard(
              'Shared Files',
              statistics?.shared_files || 0,
              faUsers,
              '#4ECDC4'
            )}
            {renderStatCard(
              'Recent Uploads',
              statistics?.recent_uploads || 0,
              faUpload,
              '#96CEB4'
            )}
            {renderStatCard(
              'My Uploads',
              statistics?.my_uploads || 0,
              faChartBar,
              '#45B7D1'
            )}
          </View>
        </View>

        {/* File Types Breakdown */}
        {renderFileTypeBreakdown()}

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch Information</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Branch ID: {statistics?.branch_id || 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              User Type: {statistics?.user_type || 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles (matching WorkspaceScreen)
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      ...createSmallShadow(theme),
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
    headerLeft: {
      width: 36,
      height: 36,
    },
    headerTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Legacy header styles (keeping for compatibility)
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    closeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.surface,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      width: '48%',
      ...createSmallShadow(theme),
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statTitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    fileTypesContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      ...createSmallShadow(theme),
    },
    fileTypeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    fileTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    fileTypeName: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
    fileTypeCount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    infoContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      ...createSmallShadow(theme),
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
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
  });

export default WorkspaceStatistics;
