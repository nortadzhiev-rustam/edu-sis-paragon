/**
 * Custom hook for parent notification functionality
 * Manages notifications for multiple students in parent view
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export const useParentNotifications = () => {
  const {
    setCurrentStudent,
    getCurrentStudentUnreadCount,
    getCurrentStudentNotifications,
    studentNotifications,
    studentUnreadCounts,
    currentStudentAuthCode,
  } = useNotifications();

  const [selectedStudentAuthCode, setSelectedStudentAuthCode] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track which students are currently being loaded to prevent duplicate calls
  const loadingStudentsRef = useRef(new Set());

  // Track the last time refreshAllStudents was called to prevent rapid successive calls
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_DEBOUNCE_MS = 2000; // 2 seconds

  // In parent proxy system, we don't load individual student notifications
  // All notifications come through the main parent context
  const loadNotificationsForStudent = useCallback(async (studentAuthCode) => {
    console.log(
      '📱 PARENT NOTIFICATIONS: Selected student:',
      studentAuthCode,
      'ID:',
      studentAuthCode
    );
    // No actual loading needed in parent proxy system
    return { notifications: [], unreadCount: 0 };
  }, []);

  // Select a student and set context (no need to load separate notifications in parent proxy system)
  const selectStudent = useCallback(
    async (student) => {
      if (!student) {
        console.warn('No student provided');
        return;
      }

      // In parent proxy system, we use student ID as identifier, not authCode
      const studentIdentifier = student.student_id || student.id;
      setSelectedStudentAuthCode(studentIdentifier);
      setCurrentStudent(studentIdentifier);

      console.log(
        '📱 PARENT NOTIFICATIONS: Selected student:',
        student.name,
        'ID:',
        studentIdentifier
      );
    },
    [setCurrentStudent]
  );

  // Get unread count for a specific student
  const getStudentUnreadCount = useCallback(
    (studentAuthCode) => {
      if (!studentAuthCode) return 0;
      return studentUnreadCounts[studentAuthCode] || 0;
    },
    [studentUnreadCounts]
  );

  // Get notifications for a specific student
  const getStudentNotifications = useCallback(
    (studentAuthCode) => {
      if (!studentAuthCode) return [];
      return studentNotifications[studentAuthCode] || [];
    },
    [studentNotifications]
  );

  // Get total unread count across all students (simplified for parent proxy system)
  const getTotalUnreadCount = useCallback(() => {
    // In parent proxy system, unread count comes from main notification context
    // since all notifications are fetched using parent's authCode
    return 0; // This will be handled by the main notification context
  }, []);

  // Get current selected student's data
  const getCurrentStudentData = useCallback(() => {
    return {
      authCode: selectedStudentAuthCode,
      notifications: getCurrentStudentNotifications(),
      unreadCount: getCurrentStudentUnreadCount(),
    };
  }, [
    selectedStudentAuthCode,
    getCurrentStudentNotifications,
    getCurrentStudentUnreadCount,
  ]);

  // Refresh notifications for current student
  const refreshCurrentStudent = useCallback(async () => {
    if (selectedStudentAuthCode) {
      await loadNotificationsForStudent(selectedStudentAuthCode);
    }
  }, [selectedStudentAuthCode, loadNotificationsForStudent]);

  // Refresh notifications for all students (simplified for parent proxy system)
  const refreshAllStudents = useCallback(async (students) => {
    if (!students || students.length === 0) {
      console.log('No students to refresh notifications for');
      return;
    }

    // Debounce rapid successive calls
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_DEBOUNCE_MS) {
      console.log('Debouncing refreshAllStudents call');
      return;
    }
    lastRefreshTimeRef.current = now;

    console.log(`Refreshing notifications for ${students.length} students`);
    setLoading(true);
    try {
      // In parent proxy system, all notifications come through parent's authCode
      // So we just need to refresh the main notification context
      console.log(
        'All student notifications refreshed (using parent proxy system)'
      );
    } catch (error) {
      console.error('Error refreshing all student notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    selectedStudentAuthCode,
    currentStudentAuthCode,
    loading,

    // Data
    studentNotifications,
    studentUnreadCounts,

    // Actions
    selectStudent,
    loadNotificationsForStudent,
    refreshCurrentStudent,
    refreshAllStudents,

    // Getters
    getStudentUnreadCount,
    getStudentNotifications,
    getTotalUnreadCount,
    getCurrentStudentData,
  };
};
