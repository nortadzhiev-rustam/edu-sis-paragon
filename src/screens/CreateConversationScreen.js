import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faUser,
  faSearch,
  faChalkboardTeacher,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  getAvailableUsersForStudent,
  getAvailableUsersForParent,
  getAvailableUsersForStaff,
  createConversation,
} from '../services/messagingService';

const CreateConversationScreen = ({ navigation, route }) => {
  console.log(
    '🚀 GENERIC CreateConversationScreen loaded - handles parent, teacher, and student users'
  );

  const { theme, fontSizes } = useTheme();
  const { authCode, studentName, parentName, teacherName, userType } =
    route.params;

  const [topic, setTopic] = useState('');
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  const styles = createStyles(theme, safeFontSizes);

  // Load available users
  const loadAvailableUsers = useCallback(async () => {
    try {
      setLoading(true);

      console.log('🔍 CreateConversationScreen - userType:', userType);
      console.log('🔍 CreateConversationScreen - parentName:', parentName);
      console.log('🔍 CreateConversationScreen - teacherName:', teacherName);
      console.log('🔍 CreateConversationScreen - studentName:', studentName);

      // Use the appropriate service based on user type
      let response;
      if (userType === 'parent' || parentName) {
        console.log(
          '📞 Calling getAvailableUsersForParent with userType:',
          userType,
          'parentName:',
          parentName
        );
        console.log('📞 Function reference:', getAvailableUsersForParent.name);
        response = await getAvailableUsersForParent(null, authCode);
      } else if (userType === 'teacher' || userType === 'staff') {
        console.log(
          '📞 Calling getAvailableUsersForStaff with userType:',
          userType
        );
        console.log('📞 Function reference:', getAvailableUsersForStaff.name);
        response = await getAvailableUsersForStaff(null);
      } else {
        console.log(
          '📞 Calling getAvailableUsersForStudent with userType:',
          userType,
          'studentName:',
          studentName
        );
        console.log('📞 Function reference:', getAvailableUsersForStudent.name);
        response = await getAvailableUsersForStudent(null, authCode);
      }

      console.log('🔍 CREATE CONVERSATION - Full response:', response);
      console.log(
        '🔍 CREATE CONVERSATION - response.success:',
        response.success
      );
      console.log('🔍 CREATE CONVERSATION - response.data:', response.data);

      // Check if response has the data directly or in a data property
      const responseData = response.data || response;

      if (
        (response.success && response.data) ||
        (responseData && responseData.grouped_users)
      ) {
        console.log(
          '🔍 CREATE CONVERSATION - Using response data:',
          responseData
        );
        console.log(
          '🔍 CREATE CONVERSATION - grouped_users:',
          responseData.grouped_users
        );
        console.log(
          '🔍 CREATE CONVERSATION - grouped_users length:',
          responseData.grouped_users?.length
        );

        // Detailed logging of each group structure
        if (responseData.grouped_users) {
          responseData.grouped_users.forEach((group, index) => {
            console.log(`🔍 CREATE CONVERSATION - Group ${index} structure:`, {
              type: group.type,
              type_label: group.type_label,
              role: group.role,
              role_label: group.role_label,
              count: group.count,
              usersLength: group.users?.length,
              firstUser: group.users?.[0]
                ? {
                    id: group.users[0].id,
                    name: group.users[0].name,
                    role: group.users[0].role,
                    user_type: group.users[0].user_type,
                    position: group.users[0].position,
                    department: group.users[0].department,
                    title: group.users[0].title,
                    job_title: group.users[0].job_title,
                    staff_role: group.users[0].staff_role,
                    // Log all available fields to see what the API provides
                    allFields: Object.keys(group.users[0]),
                  }
                : null,
            });
          });
        }

        const groupedUsers = responseData.grouped_users || [];
        console.log(
          '🔍 CREATE CONVERSATION - Setting groupedUsers:',
          groupedUsers
        );
        setGroupedUsers(groupedUsers);
      } else {
        console.log(
          '🔍 CREATE CONVERSATION - Response failed or no data:',
          response
        );
      }
    } catch (error) {
      console.error('Error loading available users:', error);
      Alert.alert('Error', 'Failed to load available users');
    } finally {
      setLoading(false);
    }
  }, [authCode, userType, parentName, studentName]);

  useEffect(() => {
    loadAvailableUsers();
  }, [loadAvailableUsers]);

  // Handle user selection toggle
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Handle conversation creation
  const handleCreateConversation = useCallback(async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic for the conversation');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one person to message');
      return;
    }

    try {
      setCreating(true);
      const memberIds = selectedUsers.map((user) => user.id);
      const response = await createConversation(
        topic.trim(),
        memberIds,
        userType || 'student',
        authCode
      );

      if (response.success && response.data) {
        Alert.alert('Success', 'Conversation created successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ConversationScreen', {
                conversationUuid: response.data.conversation_uuid,
                conversationTopic: topic.trim(),
                authCode,
                studentName,
                parentName,
                teacherName,
                userType: userType || 'student',
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  }, [
    topic,
    selectedUsers,
    authCode,
    studentName,
    parentName,
    userType,
    navigation,
  ]);

  // Filter users based on search query
  const filteredGroupedUsers = groupedUsers
    .map((group) => ({
      ...group,
      users: group.users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.users.length > 0);

  // Create sections for SectionList
  const sections = filteredGroupedUsers.map((group) => {
    const title = group.type_label || group.role_label || group.type || 'Users';
    console.log(
      `🏷️ CREATE CONVERSATION - Group label: "${title}" (from type_label: "${group.type_label}", role_label: "${group.role_label}", type: "${group.type}")`
    );
    return {
      title,
      data: group.users,
      _sectionKey: group.type || group.role,
    };
  });

  console.log('🔍 CREATE CONVERSATION - groupedUsers state:', groupedUsers);
  console.log(
    '🔍 CREATE CONVERSATION - filteredGroupedUsers:',
    filteredGroupedUsers
  );
  console.log('🔍 CREATE CONVERSATION - sections for SectionList:', sections);
  console.log('🔍 CREATE CONVERSATION - searchQuery:', searchQuery);

  // Render selected users summary
  const renderSelectedSummary = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <View style={styles.selectedSummary}>
        <Text style={styles.selectedSummaryText}>
          Selected: {selectedUsers.map((u) => u.name).join(', ')}
        </Text>
      </View>
    );
  };

  // Render user item
  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userAvatar}>
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={styles.avatarImage}
              resizeMode='cover'
            />
          ) : (
            <FontAwesomeIcon
              icon={item.user_type === 'staff' ? faChalkboardTeacher : faUser}
              size={20}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.additional_info && (
            <Text style={styles.userType}>
              {item.additional_info.classroom ||
                item.additional_info.subject ||
                item.additional_info.role_title}
            </Text>
          )}
        </View>

        <View style={styles.checkIcon}>
          {isSelected && (
            <FontAwesomeIcon
              icon={faCheck}
              size={16}
              color={theme.colors.primary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render section header
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Conversation</Text>

        <TouchableOpacity
          style={[
            styles.createButton,
            (!topic.trim() || selectedUsers.length === 0 || creating) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateConversation}
          disabled={!topic.trim() || selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size='small' color={theme.colors.headerText} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Topic Input */}
      <View style={styles.topicContainer}>
        <Text style={styles.topicLabel}>What would you like to discuss?</Text>
        <TextInput
          style={styles.topicInput}
          placeholder='e.g., Question about homework, Request for help...'
          placeholderTextColor={theme.colors.textSecondary}
          value={topic}
          onChangeText={setTopic}
          maxLength={100}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesomeIcon
            icon={faSearch}
            size={16}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search users...'
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {renderSelectedSummary()}
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderUserItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) =>
            item.id?.toString() || `user-${Math.random()}`
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesomeIcon
                icon={faChalkboardTeacher}
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No users available to message
              </Text>
            </View>
          )}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme, fontSizes) => {
  // Safety check for fontSizes
  const safeFontSizes = fontSizes || {
    small: 12,
    medium: 16,
    large: 20,
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.headerText,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    createButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      color: theme.colors.headerText,
      fontWeight: '600',
      fontSize: 14,
    },
    topicContainer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    topicLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    topicInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    searchContainer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: theme.colors.text,
    },
    selectedSummary: {
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 8,
    },
    selectedSummaryText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    listContainer: {
      paddingBottom: 16,
    },
    sectionHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedUserItem: {
      backgroundColor: theme.colors.primaryLight,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: safeFontSizes.medium,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    userType: {
      fontSize: safeFontSizes.small,
      color: theme.colors.textSecondary,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyStateText: {
      fontSize: safeFontSizes.medium,
      color: theme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
  });
};

export default CreateConversationScreen;
