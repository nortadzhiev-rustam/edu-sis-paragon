import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Config, buildApiUrl } from '../config/env';
import {
  faArrowLeft,
  faChartLine,
  faBook,
  faTrophy,
  faUser,
  faChevronRight,
  faCalculator,
  faFlask,
  faMicroscope,
  faAtom,
  faRunning,
  faLaptopCode,
  faGlobe,
  faPalette,
  faLandmark,
  faMapMarkedAlt,
  faLanguage,
  faMusic,
  faTheaterMasks,
  faCameraRetro,
  faTools,
  faBusinessTime,
  faBalanceScale,
  faHeartbeat,
  faLeaf,
  faBell,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBadge from '../components/NotificationBadge';
import {
  createSmallShadow,
  createMediumShadow,
  createCardShadow,
  fontSize,
} from '../utils/commonStyles';
import { getDemoStudentGradesData } from '../services/demoModeService';

// Import Parent Proxy Access System
import { getChildGrades } from '../services/parentService';
import {
  shouldUseParentProxy,
  extractProxyOptions,
} from '../services/parentProxyAdapter';

// Simple separator component - only shows in portrait mode
const GradeSeparator = () => null; // We'll use marginVertical on cards instead

export default function GradesScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { unreadCount, refreshNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState('summative');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  // Extract route parameters including parent proxy parameters
  const { authCode, studentId, useParentProxy, parentData, studentName } =
    route.params || {};
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);

  // Subject filtering state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSubjectList, setShowSubjectList] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshNotifications();
    }, [refreshNotifications])
  );

  // Enable rotation for this screen
  useScreenOrientation(true);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Determine if device is in landscape mode
  const isLandscape = screenData.width > screenData.height;

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Fetch grades data
  const fetchGrades = async () => {
    if (!authCode) {
      return;
    }

    try {
      setLoading(true);

      // Check if this is demo mode
      if (authCode && authCode.startsWith('DEMO_AUTH_')) {
        console.log('🎭 DEMO MODE: Using demo student grades data');
        const demoData = getDemoStudentGradesData();
        setGrades(demoData);
        setLoading(false);
        return;
      }

      // Check if this is parent proxy access
      const proxyOptions = extractProxyOptions(route.params);
      if (shouldUseParentProxy(route.params)) {
        console.log('🔄 GRADES: Using parent proxy access');
        console.log('🔑 Parent Auth Code:', authCode);
        console.log('👤 Student ID:', proxyOptions.studentId);

        const response = await getChildGrades(authCode, proxyOptions.studentId);

        if (response.success && (response.summative || response.formative)) {
          // The API returns summative and formative directly in the response, not nested under 'grades'
          setGrades({
            summative: response.summative || [],
            formative: response.formative || [],
            statistics: response.statistics,
            academic_year_id: response.academic_year_id,
            student_id: response.student_id,
          });
        } else {
          console.warn('⚠️ GRADES: No grades data in parent proxy response');
          setGrades(null);
        }
      } else {
        // Use direct student access (existing behavior)
        console.log('📚 GRADES: Using direct student access');

        const url = buildApiUrl(Config.API_ENDPOINTS.GET_STUDENT_GRADES, {
          authCode,
        });

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          setGrades(data);
        } else {
          // Handle error silently
          console.error('Failed to fetch grades:', response.status);
        }
      }
    } catch (error) {
      // Handle error silently
      console.error('❌ GRADES: Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [authCode]);

  // Extract unique subjects from grades data
  const extractSubjects = (gradesData) => {
    const subjects = new Set();

    if (gradesData?.summative && Array.isArray(gradesData.summative)) {
      gradesData.summative.forEach((item) => {
        if (item.subject_name) {
          subjects.add(item.subject_name);
        }
      });
    }

    if (gradesData?.formative && Array.isArray(gradesData.formative)) {
      gradesData.formative.forEach((item) => {
        if (item.subject_name) {
          subjects.add(item.subject_name);
        }
      });
    }

    // If no API data, extract from dummy data
    if (
      (!gradesData?.summative || gradesData.summative.length === 0) &&
      (!gradesData?.formative || gradesData.formative.length === 0)
    ) {
      // Add dummy subjects for testing
      ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'].forEach(
        (subject) => {
          subjects.add(subject);
        }
      );
    }

    return Array.from(subjects);
  };

  // Update available subjects when grades data changes
  useEffect(() => {
    if (grades) {
      const subjects = extractSubjects(grades);
      setAvailableSubjects(subjects);
    }
  }, [grades]);

  // Reset pagination when tab or subject changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedSubject, showSubjectList]);

  // Pagination utility functions
  const getPaginatedData = (data) => {
    if (!data || data.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    return paginatedData;
  };

  const getTotalPages = (data) => {
    if (!data || data.length === 0) return 0;
    return Math.ceil(data.length / itemsPerPage);
  };

  const goToNextPage = (totalPages) => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectList(false);
    setCurrentPage(1); // Reset pagination when selecting a subject
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setShowSubjectList(true);
    setCurrentPage(1);
  };

  // Helper function to get specific subject icon
  const getSubjectIcon = (subject) => {
    const subjectLower = subject.toLowerCase();

    // Mathematics
    if (
      subjectLower.includes('math') ||
      subjectLower.includes('algebra') ||
      subjectLower.includes('geometry') ||
      subjectLower.includes('calculus') ||
      subjectLower.includes('statistics')
    ) {
      return faCalculator;
    }

    // Sciences
    if (subjectLower.includes('physics')) return faAtom;
    if (subjectLower.includes('chemistry')) return faFlask;
    if (
      subjectLower.includes('biology') ||
      subjectLower.includes('life science')
    )
      return faMicroscope;
    if (subjectLower.includes('science') && !subjectLower.includes('computer'))
      return faFlask;

    // Languages
    if (
      subjectLower.includes('english') ||
      subjectLower.includes('language arts') ||
      subjectLower.includes('literature') ||
      subjectLower.includes('writing')
    ) {
      return faLanguage;
    }

    // Social Studies
    if (subjectLower.includes('history')) return faLandmark;
    if (subjectLower.includes('geography') || subjectLower.includes('geo'))
      return faMapMarkedAlt;
    if (
      subjectLower.includes('global perspective') ||
      subjectLower.includes('global studies') ||
      subjectLower.includes('world studies')
    )
      return faGlobe;

    // Technology & Computing
    if (
      subjectLower.includes('ict') ||
      subjectLower.includes('computer') ||
      subjectLower.includes('computing') ||
      subjectLower.includes('technology') ||
      subjectLower.includes('programming') ||
      subjectLower.includes('coding')
    ) {
      return faLaptopCode;
    }

    // Arts
    if (
      subjectLower.includes('art') ||
      subjectLower.includes('drawing') ||
      subjectLower.includes('painting') ||
      subjectLower.includes('design')
    ) {
      return faPalette;
    }
    if (
      subjectLower.includes('music') ||
      subjectLower.includes('band') ||
      subjectLower.includes('orchestra') ||
      subjectLower.includes('choir')
    ) {
      return faMusic;
    }
    if (
      subjectLower.includes('drama') ||
      subjectLower.includes('theater') ||
      subjectLower.includes('theatre') ||
      subjectLower.includes('acting')
    ) {
      return faTheaterMasks;
    }
    if (
      subjectLower.includes('photography') ||
      subjectLower.includes('media')
    ) {
      return faCameraRetro;
    }

    // Physical Education & Health
    if (
      subjectLower.includes('physical education') ||
      subjectLower.includes('pe') ||
      subjectLower.includes('sport') ||
      subjectLower.includes('fitness') ||
      subjectLower.includes('gym') ||
      subjectLower.includes('athletics')
    ) {
      return faRunning;
    }
    if (subjectLower.includes('health') || subjectLower.includes('wellness')) {
      return faHeartbeat;
    }

    // Business & Economics
    if (
      subjectLower.includes('business') ||
      subjectLower.includes('economics') ||
      subjectLower.includes('finance') ||
      subjectLower.includes('accounting')
    ) {
      return faBusinessTime;
    }

    // Law & Government
    if (
      subjectLower.includes('law') ||
      subjectLower.includes('government') ||
      subjectLower.includes('civics') ||
      subjectLower.includes('politics')
    ) {
      return faBalanceScale;
    }

    // Environmental Studies
    if (
      subjectLower.includes('environmental') ||
      subjectLower.includes('ecology') ||
      subjectLower.includes('earth science')
    ) {
      return faLeaf;
    }

    // Technical/Vocational
    if (
      subjectLower.includes('engineering') ||
      subjectLower.includes('technical') ||
      subjectLower.includes('workshop') ||
      subjectLower.includes('construction')
    ) {
      return faTools;
    }

    // Default fallback
    return faBook;
  };

  // Helper function to get random but consistent color for each subject
  const getSubjectColor = (subject) => {
    // Array of beautiful colors
    const colors = [
      '#FF9500', // Orange
      '#007AFF', // Blue
      '#34C759', // Green
      '#AF52DE', // Purple
      '#FF3B30', // Red
      '#5856D6', // Indigo
      '#FF2D92', // Pink
      '#FF9F0A', // Amber
      '#30D158', // Mint
      '#64D2FF', // Cyan
      '#BF5AF2', // Violet
      '#FF6482', // Rose
      '#32ADE6', // Light Blue
      '#FFD60A', // Yellow
      '#AC8E68', // Brown
    ];

    // Generate a consistent hash from the subject name
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      const char = subject.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use the hash to pick a color consistently
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Helper function to calculate average grade for a subject using enhanced data
  const getSubjectAverage = (subject) => {
    if (!grades) return null;

    console.log(`📊 GRADES: Calculating average for ${subject}`);
    console.log(`📊 GRADES: Available grades data:`, grades);

    const subjectGrades = [];

    // Use enhanced calculated_grade field for summative assessments
    if (grades.summative) {
      console.log(`📊 GRADES: Processing ${subject} grades from API data`);
      grades.summative.forEach((grade, index) => {
        if (grade.subject_name === subject && grade.is_graded === 1) {
          // Calculate percentage from raw score and max score if needed
          let gradeValue;

          // First try to get the percentage directly
          if (
            grade.calculated_grade !== null &&
            grade.calculated_grade !== undefined
          ) {
            // Check if calculated_grade looks like a raw score instead of percentage
            // If calculated_grade is very low but we have raw_score/max_score that would give a higher percentage,
            // then calculated_grade is probably the raw score, not the percentage
            if (
              grade.raw_score !== null &&
              grade.max_score !== null &&
              grade.max_score > 0
            ) {
              const calculatedPercentage =
                (grade.raw_score / grade.max_score) * 100;
              // If calculated_grade is much lower than the calculated percentage, it's probably a raw score
              if (grade.calculated_grade < calculatedPercentage * 0.5) {
                console.log(
                  `📊 GRADES: calculated_grade (${grade.calculated_grade}) seems to be raw score, using calculated percentage (${calculatedPercentage})`
                );
                gradeValue = calculatedPercentage;
              } else {
                gradeValue = grade.calculated_grade;
              }
            } else {
              gradeValue = grade.calculated_grade;
            }
          } else if (
            grade.score_percentage !== null &&
            grade.score_percentage !== undefined
          ) {
            gradeValue = grade.score_percentage;
          } else if (
            grade.percentage !== null &&
            grade.percentage !== undefined
          ) {
            gradeValue = grade.percentage;
          } else if (
            grade.raw_score !== null &&
            grade.raw_score !== undefined &&
            grade.max_score !== null &&
            grade.max_score !== undefined &&
            grade.max_score > 0
          ) {
            // Calculate percentage from raw score and max score
            gradeValue = (grade.raw_score / grade.max_score) * 100;
          } else {
            gradeValue = null;
          }

          console.log(
            `📊 GRADES: Grade ${index + 1} - ${
              grade.assessment_name || grade.title || 'Unknown'
            }`
          );
          console.log(
            `📊 GRADES: Raw data - calculated_grade: ${grade.calculated_grade}, score_percentage: ${grade.score_percentage}, raw_score: ${grade.raw_score}/${grade.max_score}`
          );
          console.log(
            `📊 GRADES: Final grade value: ${gradeValue}%, weight: ${
              grade.type_percentage || 'N/A'
            }`
          );
          console.log('---');

          if (gradeValue !== null && gradeValue !== undefined) {
            // Try to get weight from type_percentage, fallback to max_score as weight
            const weight = grade.type_percentage || grade.max_score || null;

            subjectGrades.push({
              grade: gradeValue,
              weight: weight, // Weight from assessment type or max score
              maxScore: grade.max_score || 100, // Max score for this assessment
              rawScore: grade.raw_score || null,
              title: grade.assessment_name || grade.title || 'Unknown',
            });

            console.log(
              `📊 GRADES: Added grade - ${
                grade.assessment_name || grade.title
              }: ${gradeValue}% (weight: ${weight})`
            );
          }
        }
      });
    }

    // For formative assessments, we don't include them in percentage average
    // as they use a different scale (tt1-tt4 with 1-4 ratings)

    if (subjectGrades.length === 0) return null;

    // Check if we have weight information for ALL grades in this subject
    const hasAllWeights = subjectGrades.every(
      (g) => g.weight !== null && g.weight !== undefined
    );

    console.log(`📊 GRADES: ${subject} - Has all weights: ${hasAllWeights}`);
    console.log(`📊 GRADES: ${subject} - Grade details:`, subjectGrades);

    if (hasAllWeights) {
      const totalWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);

      // Check if weight system is complete (should total 100% or close to it)
      const isWeightSystemComplete = totalWeight >= 95 && totalWeight <= 105; // Allow 5% tolerance

      console.log(`📊 GRADES: Total weight for ${subject}: ${totalWeight}%`);
      console.log(
        `📊 GRADES: Weight system complete: ${isWeightSystemComplete}`
      );

      if (isWeightSystemComplete) {
        // Use weighted average calculation when weight system is complete
        console.log(`📊 GRADES: Using weighted calculation for ${subject}`);
        console.log(
          '📊 GRADES: Grade data:',
          subjectGrades.map((g) => `${g.grade}% (weight: ${g.weight}%)`)
        );

        const totalWeightedScore = subjectGrades.reduce(
          (sum, g) => sum + g.grade * g.weight,
          0
        );

        console.log(`📊 GRADES: Total weighted score: ${totalWeightedScore}`);

        if (totalWeight === 0) {
          // Fallback to simple average if weights sum to 0
          const average =
            subjectGrades.reduce((a, b) => a + b.grade, 0) /
            subjectGrades.length;
          console.log(
            `📊 GRADES: Weighted calculation failed (total weight = 0), using simple average: ${Math.round(
              average
            )}%`
          );
          return Math.round(average);
        }

        // Calculate weighted average: (sum of grade * weight) / total weight
        const weightedAverage = totalWeightedScore / totalWeight;
        console.log(
          `📊 GRADES: Weighted average for ${subject}: ${Math.round(
            weightedAverage
          )}%`
        );
        return Math.round(weightedAverage);
      } else {
        // Weight system is incomplete, use simple average
        console.log(
          `📊 GRADES: Weight system incomplete for ${subject} (${totalWeight}% total), using simple average`
        );
        const average =
          subjectGrades.reduce((a, b) => a + b.grade, 0) / subjectGrades.length;
        console.log(
          `📊 GRADES: Simple average for ${subject}: ${Math.round(average)}%`
        );
        return Math.round(average);
      }
    } else {
      // Use simple average calculation when not all weights are available
      console.log(
        `📊 GRADES: Using simple average for ${subject} (missing weight data)`
      );
      console.log(
        '📊 GRADES: Grade data:',
        subjectGrades.map((g) => `${g.grade}%`)
      );

      const average =
        subjectGrades.reduce((a, b) => a + b.grade, 0) / subjectGrades.length;
      console.log(
        `📊 GRADES: Simple average for ${subject}: ${Math.round(average)}%`
      );
      return Math.round(average);
    }
  };

  const renderSubjectCard = useCallback(
    (subject) => {
      const subjectColor = getSubjectColor(subject);
      const subjectIcon = getSubjectIcon(subject);
      const average = getSubjectAverage(subject);

      // Calculate enhanced grade counts and statistics
      const subjectSummative =
        grades?.summative?.filter((g) => g.subject_name === subject) || [];
      const subjectFormative =
        grades?.formative?.filter((g) => g.subject_name === subject) || [];

      const summativeCount = subjectSummative.length;
      const formativeCount = subjectFormative.length;
      const totalGrades = summativeCount + formativeCount;

      // Enhanced statistics for this subject
      const templatedAssessments = subjectSummative.filter(
        (g) => g.template_info && g.grading_context?.has_template
      ).length;
      const weightedAssessments = subjectSummative.filter(
        (g) => g.grading_context?.is_weighted
      ).length;

      // Check if this subject uses weighted calculation
      const hasWeightData = subjectSummative.every(
        (g) => g.type_percentage !== null && g.type_percentage !== undefined
      );

      // Check if weight system is complete
      const totalSubjectWeight = subjectSummative.reduce(
        (sum, g) => sum + (g.type_percentage || 0),
        0
      );
      const isWeightSystemComplete =
        hasWeightData && totalSubjectWeight >= 95 && totalSubjectWeight <= 105;

      const calculationMethod = isWeightSystemComplete
        ? 'Weighted'
        : hasWeightData
        ? 'Incomplete Weights'
        : 'Simple Average';
      const gradedSummative = subjectSummative.filter(
        (g) => g.is_graded === 1
      ).length;
      const gradedFormative = subjectFormative.filter(
        (g) => g.is_graded === 1
      ).length;
      const completionRate =
        totalGrades > 0
          ? Math.round(
              ((gradedSummative + gradedFormative) / totalGrades) * 100
            )
          : 0;

      // Get grade letter based on average
      const getGradeLetter = (avg) => {
        if (avg === null || avg === undefined || isNaN(avg)) return 'N/A';
        if (avg >= 85) return 'A';
        if (avg >= 70) return 'B';
        if (avg >= 60) return 'C';
        if (avg >= 50) return 'D';
        return 'F';
      };

      const gradeLetter = getGradeLetter(average);
      const hasValidAverage =
        average !== null && average !== undefined && !isNaN(average);

      // Create dynamic styles (these are lightweight and subject-specific)
      const cardBackgroundStyle = { backgroundColor: `${subjectColor}08` };
      const iconContainerStyle = { backgroundColor: subjectColor };
      const gradeCircleStyle = { borderColor: subjectColor };
      const coloredTextStyle = { color: subjectColor };
      const typeDotStyle = { backgroundColor: subjectColor };
      const typeDotFadedStyle = { backgroundColor: `${subjectColor}60` };
      const progressFillStyle = {
        width: `${hasValidAverage ? Math.min(average, 100) : 0}%`,
        backgroundColor: subjectColor,
      };

      return (
        <TouchableOpacity
          key={subject}
          style={[styles.modernSubjectCard, cardBackgroundStyle]}
          onPress={() => handleSubjectSelect(subject)}
          activeOpacity={0.9}
        >
          {/* Header with Icon and Title */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.subjectIconContainer, iconContainerStyle]}>
                <FontAwesomeIcon icon={subjectIcon} size={14} color='#fff' />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.modernSubjectTitle} numberOfLines={2}>
                  {subject.length > 16
                    ? `${subject.substring(0, 16)}...`
                    : subject}
                </Text>
                <View style={styles.assessmentInfo}>
                  <FontAwesomeIcon icon={faBook} size={8} color='#666' />
                  <Text style={styles.assessmentCount}>
                    {totalGrades} assessments
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => handleSubjectSelect(subject)}
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                size={14}
                color={subjectColor}
              />
            </TouchableOpacity>
          </View>

          {/* Main Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.gradeSection}>
              <View style={[styles.gradeCircle, gradeCircleStyle]}>
                <Text
                  style={[
                    styles.gradeLetterText,
                    gradeLetter === 'N/A'
                      ? { color: '#8E8E93' }
                      : coloredTextStyle,
                  ]}
                >
                  {gradeLetter}
                </Text>
              </View>
              <Text style={styles.gradeLabel}>Grade</Text>
            </View>

            <View style={styles.percentageSection}>
              <View style={styles.percentageDisplay}>
                <Text
                  style={[
                    styles.percentageNumber,
                    hasValidAverage ? coloredTextStyle : { color: '#8E8E93' },
                  ]}
                >
                  {hasValidAverage ? average : '--'}
                </Text>
                {hasValidAverage && (
                  <Text style={[styles.percentageSymbol, coloredTextStyle]}>
                    %
                  </Text>
                )}
              </View>
              <Text style={styles.percentageLabel}>
                Average{' '}
                {isWeightSystemComplete
                  ? '(Weighted)'
                  : hasWeightData
                  ? '(Incomplete)'
                  : '(Simple)'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {hasValidAverage && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={[styles.progressValue, coloredTextStyle]}>
                  {average}%
                </Text>
              </View>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, progressFillStyle]} />
                </View>
              </View>
            </View>
          )}

          {/* Enhanced Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.typeBreakdown}>
              {summativeCount > 0 && (
                <View style={styles.typeItem}>
                  <View style={[styles.typeDot, typeDotStyle]} />
                  <Text style={styles.typeText}>
                    {summativeCount} Summative
                  </Text>
                </View>
              )}
              {formativeCount > 0 && (
                <View style={styles.typeItem}>
                  <View style={[styles.typeDot, typeDotFadedStyle]} />
                  <Text style={styles.typeText}>
                    {formativeCount} Formative
                  </Text>
                </View>
              )}
            </View>

            {/* Enhanced Statistics Row */}
            <View style={styles.enhancedStatsRow}>
              {templatedAssessments > 0 && (
                <View style={styles.enhancedStatItem}>
                  <Text style={styles.enhancedStatText}>
                    📋 {templatedAssessments}
                  </Text>
                </View>
              )}
              {weightedAssessments > 0 && (
                <View style={styles.enhancedStatItem}>
                  <Text style={styles.enhancedStatText}>
                    ⚖️ {weightedAssessments}
                  </Text>
                </View>
              )}
              <View style={styles.enhancedStatItem}>
                <Text
                  style={[
                    styles.enhancedStatText,
                    {
                      color:
                        completionRate >= 80
                          ? '#34C759'
                          : completionRate >= 60
                          ? '#FF9500'
                          : '#FF3B30',
                    },
                  ]}
                >
                  ✅ {completionRate}%
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [grades, styles]
  );

  const renderTabButton = (tabName, title) => (
    <TouchableOpacity
      key={tabName}
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === tabName && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Helper function to get grade performance color
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#34C759'; // Green for excellent
    if (percentage >= 80) return '#1D428A'; // Blue for good (brand primary)
    if (percentage >= 70) return '#FF9500'; // Orange for average
    if (percentage >= 60) return '#FF3B30'; // Red for below average
    return '#8E8E93'; // Gray for poor
  };

  // Helper function to get grade performance label
  const getGradeLabel = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return 'N/A'; // Not Applicable or Ungraded if no percentage
    }
    if (percentage >= 90) return 'A*'; // Outstanding
    if (percentage >= 80) return 'A'; // Excellent
    if (percentage >= 70) return 'B'; // Good
    if (percentage >= 60) return 'C'; // Satisfactory
    if (percentage >= 50) return 'D'; // Passing
    if (percentage >= 40) return 'E'; // Minimum Passing / Needs Improvement
    return 'U'; // Ungraded / Fail
  };

  // Modern grade card component
  const renderGradeCard = ({ item, index }) => {
    const isFormative = activeTab === 'formative';

    // Calculate card width based on orientation
    const cardStyle = isLandscape
      ? [
          styles.gradeCard,
          styles.landscapeGradeCard,
          index % 2 === 0 && styles.evenGradeCard,
        ]
      : [styles.gradeCard, index % 2 === 0 && styles.evenGradeCard];

    // For formative grades, use enhanced assessment criteria layout
    if (isFormative) {
      // Enhanced assessment criteria with better labels and values
      const assessmentCriteria = [
        {
          label: 'T&R',
          fullLabel: 'Thinking & Reasoning',
          value: item.tt1 || '',
          color: '#34C759',
        },
        {
          label: 'COM',
          fullLabel: 'Communication',
          value: item.tt2 || '',
          color: '#FF9500',
        },
        {
          label: 'APP',
          fullLabel: 'Application',
          value: item.tt3 || '',
          color: '#007AFF',
        },
        {
          label: 'COL',
          fullLabel: 'Collaboration',
          value: item.tt4 || '',
          color: '#FF3B30',
        },
      ].filter(
        (criteria) => criteria.value && criteria.value.toString().trim() !== ''
      ); // Only show criteria with values

      const isGraded = item.is_graded === 1;
      const gradingStatus =
        item.grading_status || (isGraded ? 'Graded' : 'Not Graded');

      return (
        <View style={cardStyle}>
          <View style={styles.gradeCardHeader}>
            <View style={styles.gradeCardLeft}>
              <Text
                style={[
                  styles.gradeTitle,
                  isLandscape && styles.landscapeGradeTitle,
                ]}
                numberOfLines={isLandscape ? 2 : 3}
              >
                {item.title}
              </Text>
              <Text style={styles.gradeDate}>Date: {item.date}</Text>
              {item.strand_name && (
                <Text style={styles.gradeDate}>Strand: {item.strand_name}</Text>
              )}
              {item.skill_name && (
                <Text style={styles.gradeDate}>Skill: {item.skill_name}</Text>
              )}
            </View>
            <View style={styles.gradeCardRight}>
              <View style={styles.assessmentCriteriaContainer}>
                {assessmentCriteria.map((criteria) => (
                  <View
                    key={criteria.label}
                    style={[
                      styles.criteriaItem,
                      { backgroundColor: criteria.color },
                    ]}
                  >
                    <Text style={styles.criteriaLabel}>{criteria.label}</Text>
                    <Text style={styles.criteriaValue}>{criteria.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.gradeCardBody}>
            <View style={styles.gradeDetails}>
              <View style={styles.gradeDetailItem}>
                <FontAwesomeIcon
                  icon={faUser}
                  size={isLandscape ? 12 : 14}
                  color='#666'
                />
                <Text
                  style={[
                    styles.gradeDetailText,
                    isLandscape && styles.landscapeDetailText,
                  ]}
                  numberOfLines={1}
                >
                  {item.teacher}
                </Text>
              </View>
              <View style={styles.gradeDetailItem}>
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  size={isLandscape ? 12 : 14}
                  color={isGraded ? '#34C759' : '#FF9500'}
                />
                <Text
                  style={[
                    styles.gradeDetailText,
                    isLandscape && styles.landscapeDetailText,
                    { color: isGraded ? '#34C759' : '#FF9500' },
                  ]}
                  numberOfLines={1}
                >
                  {gradingStatus}
                </Text>
              </View>
            </View>

            {/* Criteria Legend */}
            {assessmentCriteria.length > 0 && (
              <View style={styles.criteriaLegend}>
                <Text style={styles.criteriaLegendTitle}>
                  Assessment Criteria (1-4 scale):
                </Text>
                {assessmentCriteria.map((criteria) => (
                  <Text key={criteria.label} style={styles.criteriaLegendItem}>
                    • {criteria.label}: {criteria.fullLabel} ({criteria.value})
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    }

    // For summative grades, use enhanced data
    const calculatedGrade =
      item.score_percentage !== null && item.score_percentage !== undefined
        ? parseFloat(item.score_percentage)
        : null;
    const letterGrade =
      item.letter_grade ||
      (calculatedGrade !== null ? getGradeLabel(calculatedGrade) : 'N/A');
    const gradeColor =
      calculatedGrade !== null ? getGradeColor(calculatedGrade) : '#8E8E93';
    const hasTemplate =
      item.template_info && item.grading_context?.has_template;

    return (
      <View style={cardStyle}>
        <View style={styles.gradeCardHeader}>
          <View style={styles.gradeCardLeft}>
            <Text
              style={[
                styles.gradeTitle,
                isLandscape && styles.landscapeGradeTitle,
              ]}
              numberOfLines={isLandscape ? 2 : 3}
            >
              {item.title}
            </Text>
            {item.strand && item.strand !== 'N/A' && (
              <Text style={styles.gradeDate}>Strand: {item.strand}</Text>
            )}
            <Text style={styles.gradeDate}>Date: {item.date}</Text>
            {hasTemplate && item.template_info?.template_name && (
              <Text style={styles.templateInfo}>
                📋 {item.template_info.template_name}
              </Text>
            )}
          </View>
          <View style={styles.gradeCardRight}>
            <View
              style={[
                styles.gradeScoreContainer,
                {
                  backgroundColor: `${gradeColor}15`,
                },
                isLandscape && styles.landscapeScoreContainer,
              ]}
            >
              <Text
                style={[
                  styles.gradeScore,
                  { color: gradeColor },
                  isLandscape && styles.landscapeGradeScore,
                ]}
              >
                {calculatedGrade !== null ? `${calculatedGrade}%` : 'N/A'}
              </Text>
              <Text
                style={[
                  styles.gradePercentage,
                  { color: gradeColor },
                  isLandscape && styles.landscapeGradePercentage,
                ]}
              >
                {item.raw_score !== null && item.max_score !== null
                  ? `${item.raw_score}/${item.max_score}`
                  : 'Not Graded'}
              </Text>
              {letterGrade && letterGrade !== 'N/A' && (
                <Text
                  style={[
                    styles.letterGrade,
                    { color: gradeColor },
                    isLandscape && styles.landscapeLetterGrade,
                  ]}
                >
                  {letterGrade}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.gradeCardBody}>
          <View style={styles.gradeDetails}>
            <View style={styles.gradeDetailItem}>
              <FontAwesomeIcon
                icon={faUser}
                size={isLandscape ? 12 : 14}
                color='#666'
              />
              <Text
                style={[
                  styles.gradeDetailText,
                  isLandscape && styles.landscapeDetailText,
                ]}
                numberOfLines={1}
              >
                {item.teacher}
              </Text>
            </View>
            <View style={styles.gradeDetailItem}>
              <FontAwesomeIcon
                icon={faTrophy}
                size={isLandscape ? 12 : 14}
                color='#666'
              />
              <Text
                style={[
                  styles.gradeDetailText,
                  isLandscape && styles.landscapeDetailText,
                ]}
                numberOfLines={1}
              >
                {item.type}
                {item.type_percentage && ` (${item.type_percentage}%)`}
              </Text>
            </View>
          </View>

          {/* Enhanced comment display */}
          {item.comment && (
            <View style={styles.commentSection}>
              <Text style={styles.commentText} numberOfLines={2}>
                💬 {item.comment}
              </Text>
            </View>
          )}

          <View style={styles.gradePerformanceContainer}>
            <View
              style={[
                styles.gradePerformanceBadge,
                { backgroundColor: gradeColor },
                isLandscape && styles.landscapePerformanceBadge,
              ]}
            >
              <Text
                style={[
                  styles.gradePerformanceText,
                  isLandscape && styles.landscapePerformanceText,
                ]}
              >
                {letterGrade}
              </Text>
            </View>
            {hasTemplate && item.grading_context?.is_weighted && (
              <View style={styles.weightedBadge}>
                <Text style={styles.weightedText}>⚖️ Weighted</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPaginationControls = (data) => {
    const totalPages = getTotalPages(data);

    // Show pagination if there's any data
    if (!data || data.length === 0) {
      return null;
    }

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            isFirstPage && styles.disabledButton,
          ]}
          onPress={goToPreviousPage}
          disabled={isFirstPage}
        >
          <Text
            style={[
              styles.paginationButtonText,
              isFirstPage && styles.disabledText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.itemsInfoText}>
            Showing{' '}
            {Math.min(
              itemsPerPage,
              data.length - (currentPage - 1) * itemsPerPage
            )}{' '}
            of {data.length} items
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, isLastPage && styles.disabledButton]}
          onPress={() => goToNextPage(totalPages)}
          disabled={isLastPage}
        >
          <Text
            style={[
              styles.paginationButtonText,
              isLastPage && styles.disabledText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSummativeContent = () => {
    // Use real API data if available, otherwise show dummy data
    let summativeData = [];

    if (grades?.summative && Array.isArray(grades.summative)) {
      // Transform enhanced API data to match our table format
      summativeData = grades.summative.map((item, index) => {
        // Enhanced API provides: calculated_grade, letter_grade, display_score, template_info
        const isGraded = item.is_graded === 1;

        // Use enhanced fields for better display
        const calculatedGrade = item.calculated_grade;
        const letterGrade = item.letter_grade;
        const rawScore = item.raw_score;
        const maxScore = item.max_score || 100;
        const scorePercentage = item.score_percentage;

        // Create score display using enhanced data
        let scoreDisplay;
        if (!isGraded) {
          scoreDisplay = t('notGraded');
        } else if (item.display_score) {
          // Use pre-formatted display_score from enhanced API
          scoreDisplay = item.display_score;
        } else if (rawScore !== null && rawScore !== undefined) {
          // Fallback to raw score display
          scoreDisplay = `${rawScore}/${maxScore}`;
        } else {
          scoreDisplay = t('notGraded');
        }

        // Use calculated_grade for percentage display if available
        const percentageDisplay =
          isGraded && calculatedGrade !== null && calculatedGrade !== undefined
            ? `${calculatedGrade}%`
            : scorePercentage !== null && scorePercentage !== undefined
            ? `${scorePercentage}%`
            : t('notGraded');

        return {
          id: item.assessment_id || item.id || index + 1,
          date: item.date || 'N/A',
          subject: item.subject_name || 'N/A',
          strand: item.strand_name || 'N/A',
          title: item.assessment_name || 'N/A',
          score: scoreDisplay,
          percentage: percentageDisplay,
          type: item.type_title || 'N/A',
          teacher: item.teacher_name || 'N/A',
          // Enhanced fields for better UI
          calculated_grade: calculatedGrade,
          letter_grade: letterGrade,
          score_percentage: scorePercentage,
          comment: item.comment,
          template_info: item.template_info,
          grading_context: item.grading_context,
          raw_score: rawScore,
          max_score: maxScore,
          type_percentage: item.type_percentage,
        };
      });
    } else {
      // Fallback dummy data for testing with different max scores and weights
      summativeData = [
        {
          id: 1,
          date: '2025-03-19',
          subject: 'Mathematics',
          strand: 'Geometry',
          title: 'Quiz 1',
          score: '9/10', // 90% of 10 = 9/10
          percentage: '90%',
          type: 'Quiz',
          teacher: 'Su Su Htwe',
          // Enhanced fields for weighted calculation testing
          calculated_grade: 90,
          score_percentage: 90,
          raw_score: 9,
          max_score: 10,
          type_percentage: 10, // 10% weight
        },
        {
          id: 2,
          date: '2025-03-18',
          subject: 'Mathematics',
          strand: 'Algebra',
          title: 'Quiz 2',
          score: '5/10', // 50% of 10 = 5/10
          percentage: '50%',
          type: 'Quiz',
          teacher: 'Su Su Htwe',
          // Enhanced fields for weighted calculation testing
          calculated_grade: 50,
          score_percentage: 50,
          raw_score: 5,
          max_score: 10,
          type_percentage: 10, // 10% weight
        },
        {
          id: 3,
          date: '2025-03-17',
          subject: 'Mathematics',
          strand: 'Calculus',
          title: 'Midterm Exam',
          score: '40/40', // 100% of 40 = 40/40
          percentage: '100%',
          type: 'Exam',
          teacher: 'Su Su Htwe',
          // Enhanced fields for weighted calculation testing
          calculated_grade: 100,
          score_percentage: 100,
          raw_score: 40,
          max_score: 40,
          type_percentage: 40, // 40% weight
        },
        {
          id: 4,
          date: '2025-03-16',
          subject: 'Mathematics',
          strand: 'Statistics',
          title: 'Final Project',
          score: '40/40', // 100% of 40 = 40/40
          percentage: '100%',
          type: 'Project',
          teacher: 'Su Su Htwe',
          // Enhanced fields for weighted calculation testing
          calculated_grade: 100,
          score_percentage: 100,
          raw_score: 40,
          max_score: 40,
          type_percentage: 40, // 40% weight
        },
        {
          id: 5,
          date: '2025-03-19',
          subject: 'English',
          strand: 'Literature',
          title: 'Essay Writing',
          score: '46/50', // 92% of 50 = 46/50
          percentage: '92%',
          type: 'Assignment',
          teacher: 'Ms. Johnson',
          // Enhanced fields - no weights for simple average testing
          calculated_grade: 92,
          score_percentage: 92,
          raw_score: 46,
          max_score: 50,
        },
        {
          id: 2,
          date: '2024-01-20',
          subject: 'English',
          strand: 'Literature',
          title: 'Essay Writing',
          score: '46/50', // 92% of 50 = 46/50
          percentage: '92%',
          type: 'Assignment',
          teacher: 'Ms. Johnson',
        },
        {
          id: 3,
          date: '2024-01-25',
          subject: 'Physics',
          strand: 'Mechanics',
          title: 'Motion & Forces',
          score: '39/50', // 78% of 50 = 39/50
          percentage: '78%',
          type: 'Quiz',
          teacher: 'Dr. Brown',
        },
        {
          id: 4,
          date: '2024-02-01',
          subject: 'Chemistry',
          strand: 'Organic',
          title: 'Lab Report',
          score: '21/25', // 84% of 25 = 21/25
          percentage: '84%',
          type: 'Lab',
          teacher: 'Ms. Davis',
        },
        // Add more dummy data to test pagination (consistent data)
        {
          id: 5,
          date: '2024-02-05',
          subject: 'Biology',
          strand: 'Genetics',
          title: 'DNA Structure',
          score: '95/100',
          percentage: '95%',
          type: 'Project',
          teacher: 'Mr. Wilson',
        },
        {
          id: 6,
          date: '2024-02-10',
          subject: 'Mathematics',
          strand: 'Calculus',
          title: 'Derivatives Test',
          score: '88/100',
          percentage: '88%',
          type: 'Test',
          teacher: 'Ms. Smith',
        },
        {
          id: 7,
          date: '2024-02-15',
          subject: 'Physics',
          strand: 'Thermodynamics',
          title: 'Heat Transfer',
          score: '82/100',
          percentage: '82%',
          type: 'Quiz',
          teacher: 'Dr. Brown',
        },
        {
          id: 8,
          date: '2024-02-20',
          subject: 'Chemistry',
          strand: 'Inorganic',
          title: 'Periodic Table',
          score: '90/100',
          percentage: '90%',
          type: 'Assignment',
          teacher: 'Ms. Davis',
        },
        {
          id: 9,
          date: '2024-02-25',
          subject: 'English',
          strand: 'Grammar',
          title: 'Sentence Structure',
          score: '85/100',
          percentage: '85%',
          type: 'Test',
          teacher: 'Ms. Johnson',
        },
        {
          id: 10,
          date: '2024-03-01',
          subject: 'Biology',
          strand: 'Ecology',
          title: 'Ecosystem Study',
          score: '92/100',
          percentage: '92%',
          type: 'Project',
          teacher: 'Mr. Wilson',
        },
        {
          id: 11,
          date: '2024-03-05',
          subject: 'Mathematics',
          strand: 'Statistics',
          title: 'Data Analysis',
          score: '87/100',
          percentage: '87%',
          type: 'Assignment',
          teacher: 'Ms. Smith',
        },
        {
          id: 12,
          date: '2024-03-10',
          subject: 'Physics',
          strand: 'Optics',
          title: 'Light Refraction',
          score: '89/100',
          percentage: '89%',
          type: 'Lab',
          teacher: 'Dr. Brown',
        },
        {
          id: 13,
          date: '2024-03-15',
          subject: 'Chemistry',
          strand: 'Organic',
          title: 'Functional Groups',
          score: '91/100',
          percentage: '91%',
          type: 'Test',
          teacher: 'Ms. Davis',
        },
        {
          id: 14,
          date: '2024-03-20',
          subject: 'English',
          strand: 'Literature',
          title: 'Poetry Analysis',
          score: '86/100',
          percentage: '86%',
          type: 'Essay',
          teacher: 'Ms. Johnson',
        },
        {
          id: 15,
          date: '2024-03-25',
          subject: 'Biology',
          strand: 'Anatomy',
          title: 'Human Body Systems',
          score: '94/100',
          percentage: '94%',
          type: 'Test',
          teacher: 'Mr. Wilson',
        },
      ];
    }

    // Filter by selected subject
    if (selectedSubject) {
      summativeData = summativeData.filter(
        (item) => item.subject === selectedSubject
      );
    }

    // Check if we have any summative data to display
    if (summativeData.length === 0) {
      return (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>
            {selectedSubject
              ? `No summative grades available for ${selectedSubject} yet.`
              : 'No summative grades available yet.'}
          </Text>
        </View>
      );
    }

    // Safety check: ensure currentPage doesn't exceed totalPages
    const totalPages = getTotalPages(summativeData);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return null; // Re-render will happen with correct page
    }

    // Get paginated data
    const paginatedData = getPaginatedData(summativeData);

    return (
      <View style={styles.modernGradesContainer}>
        <FlatList
          data={paginatedData}
          renderItem={renderGradeCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.gradesList,
            isLandscape && { paddingHorizontal: 0 }, // Remove padding in landscape for full width
          ]}
          ItemSeparatorComponent={GradeSeparator}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? 'landscape' : 'portrait'} // Force re-render when orientation changes
        />
        <View style={styles.paginationSection}>
          {renderPaginationControls(summativeData)}
        </View>
      </View>
    );
  };

  // Render enhanced statistics display
  const renderStatisticsOverview = () => {
    if (!grades?.statistics) return null;

    const { summative, formative, overall } = grades.statistics;
    const hasEnhancedFeatures = grades?.enhanced_features;

    // Only show statistics if there's actual data
    const hasData =
      overall?.total_assessments > 0 ||
      summative?.total_assessments > 0 ||
      formative?.total_assessments > 0;

    if (!hasData) return null;

    // Helper function to format percentage values
    const formatPercentage = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '--';
      return value.toFixed(1);
    };

    // Helper function to format count values
    const formatCount = (value) => {
      if (value === null || value === undefined) return '0';
      return value.toString();
    };

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsTitle}>📊 Performance Overview</Text>

        <View style={styles.statisticsGrid}>
          {/* Overall Statistics */}
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsCardTitle}>OVERALL</Text>
            <View style={styles.statisticsMainValueContainer}>
              <Text style={styles.statisticsMainValue}>
                {formatPercentage(overall.average_performance)}
              </Text>
              <Text style={styles.statisticsUnit}>%</Text>
            </View>

            <Text style={styles.statisticsLabel}>Average Performance</Text>
            <View style={styles.statisticsDetails}>
              <Text style={styles.statisticsDetailText}>
                📝 {formatCount(overall.total_assessments)} Total
              </Text>
              <Text style={styles.statisticsDetailText}>
                ✅ {formatPercentage(overall.completion_rate)}% Complete
              </Text>
            </View>
          </View>

          {/* Summative Statistics */}
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsCardTitle}>SUMMATIVE</Text>
            <View style={styles.statisticsMainValueContainer}>
              <Text style={styles.statisticsMainValue}>
                {formatPercentage(summative.average_grade)}
              </Text>
              <Text style={styles.statisticsUnit}>%</Text>
            </View>

            <Text style={styles.statisticsLabel}>Average Grade</Text>
            <View style={styles.statisticsDetails}>
              <Text style={styles.statisticsDetailText}>
                📈 High: {formatPercentage(summative.highest_grade)}%
              </Text>
              <Text style={styles.statisticsDetailText}>
                📉 Low: {formatPercentage(summative.lowest_grade)}%
              </Text>
              {hasEnhancedFeatures?.template_support && (
                <Text style={styles.statisticsDetailText}>
                  📋 {formatCount(summative.with_templates)} Templates
                </Text>
              )}
            </View>
          </View>

          {/* Formative Statistics */}
          <View style={styles.statisticsCard}>
            <Text style={styles.statisticsCardTitle}>FORMATIVE</Text>
            <View style={styles.statisticsMainValueContainer}>
              <Text style={styles.statisticsMainValue}>
                {formatCount(formative.graded_assessments)}
              </Text>
              <Text style={styles.statisticsUnit}></Text>
            </View>
            <Text style={styles.statisticsLabel}>Graded Assessments</Text>
            <View style={styles.statisticsDetails}>
              <Text style={styles.statisticsDetailText}>
                📊 {formatCount(formative.total_assessments)} Total
              </Text>
              <Text style={styles.statisticsDetailText}>
                ⏳ {formatCount(formative.ungraded_assessments)} Pending
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFormativeContent = () => {
    // Use real API data if available, otherwise show message
    let formativeData = [];

    if (grades?.formative && Array.isArray(grades.formative)) {
      // Transform enhanced formative API data
      formativeData = grades.formative.map((item, index) => {
        return {
          id: item.assessment_id || item.id || index + 1,
          date: item.date || 'N/A',
          subject: item.subject_name || 'N/A',
          title: item.assessment_name || 'N/A',
          teacher: item.teacher_name || 'N/A',
          // Enhanced formative assessment criteria (1-4 scale)
          tt1: item.tt1 || '', // Thinking & Reasoning
          tt2: item.tt2 || '', // Communication
          tt3: item.tt3 || '', // Application
          tt4: item.tt4 || '', // Collaboration
          // Enhanced fields
          strand_id: item.strand_id,
          strand_name: item.strand_name,
          skill_id: item.skill_id,
          skill_name: item.skill_name,
          max_score: item.max_score,
          is_graded: item.is_graded,
          grading_status:
            item.grading_status ||
            (item.is_graded === 1 ? 'Graded' : 'Not Graded'),
        };
      });
    }

    // Filter by selected subject
    if (selectedSubject) {
      formativeData = formativeData.filter(
        (item) => item.subject === selectedSubject
      );
    }

    if (formativeData.length === 0) {
      return (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>
            {selectedSubject
              ? `No life skills grades available for ${selectedSubject} yet.`
              : 'No life skills grades available yet.'}
          </Text>
        </View>
      );
    }

    // Safety check: ensure currentPage doesn't exceed totalPages
    const totalPages = getTotalPages(formativeData);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      return null; // Re-render will happen with correct page
    }

    // Get paginated data
    const paginatedData = getPaginatedData(formativeData);

    return (
      <View style={styles.modernGradesContainer}>
        <FlatList
          data={paginatedData}
          renderItem={renderGradeCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.gradesList,
            isLandscape && { paddingHorizontal: 0 }, // Remove padding in landscape for full width
          ]}
          ItemSeparatorComponent={GradeSeparator}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? 'landscape' : 'portrait'} // Force re-render when orientation changes
        />
        <View style={styles.paginationSection}>
          {renderPaginationControls(formativeData)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (showSubjectList) {
                navigation.goBack();
              } else {
                setShowSubjectList(true);
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {showSubjectList
                ? `${t('assessments')}`
                : isLandscape
                ? `${selectedSubject} - ${
                    activeTab === 'summative' ? t('summative') : t('formative')
                  }`
                : selectedSubject.substring(0, 16) || t('grades')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {isLandscape && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() =>
                  setActiveTab(
                    activeTab === 'summative' ? 'formative' : 'summative'
                  )
                }
              >
                <Text style={styles.switchButtonText}>
                  {activeTab === 'summative' ? 'F' : 'S'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {studentName && (
          <View style={styles.studentContextBar}>
            <Text style={styles.studentContextName}>{studentName}</Text>
          </View>
        )}

        {/* Tab Navigation Subheader - Only show when not in subject list and not landscape */}
        {!showSubjectList && !isLandscape && (
          <View style={styles.subHeader}>
            <View style={styles.tabContainer}>
              {renderTabButton('summative', t('summative'))}
              {renderTabButton('formative', t('formative'))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {loading ? (
          // Show loading indicator
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        ) : showSubjectList ? (
          // Show subject selection screen
          <View style={styles.subjectListContainer}>
            {/* Enhanced Statistics Overview */}
            {renderStatisticsOverview()}

            <FlatList
              data={availableSubjects}
              renderItem={({ item }) => renderSubjectCard(item)}
              keyExtractor={(item) => item}
              numColumns={1}
              style={styles.fullWidth}
              contentContainerStyle={styles.subjectGrid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          // Show grades table for selected subject
          <View style={styles.gradesContainer}>
            {/* Tab Content */}
            <View style={styles.scrollContainer}>
              {activeTab === 'summative'
                ? renderSummativeContent()
                : renderFormativeContent()}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Compact Header Styles
    compactHeaderContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
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
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    studentContextBar: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 6,
    },

    studentContextName: {
      fontSize: fontSize.xxl,
      fontWeight: '900',
      color: theme.colors.text,
    },
    // Legacy header style (keeping for compatibility)
    header: {
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
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    notificationButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    switchButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    switchButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    studentInfo: {
      backgroundColor: '#fff',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    studentNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    landscapeContent: {
      paddingHorizontal: 20, // More padding in landscape for better use of space
    },
    // Subject List Screen Styles
    subjectListContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 5,
    },
    // Enhanced Header Section
    headerSection: {
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    headerIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 149, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: theme.colors.warning,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 2,
      borderColor: 'rgba(255, 149, 0, 0.2)',
    },
    subjectListTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    subjectListSubtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    subjectGrid: {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    subjectRow: {
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    fullWidth: {
      width: '100%',
    },

    // Modern Subject Card Styles - Compact Design for 2-column layout
    modernSubjectCard: {
      backgroundColor: theme.colors.card,
      width: '100%', // Full width for single column layout
      marginVertical: 6,
      marginHorizontal: 0,
      borderRadius: 12,
      padding: 16, // Increased padding for better spacing in full width
      // Removed overflow: 'hidden' to prevent shadow clipping on Android
      // Only show border on iOS - Android elevation provides sufficient visual separation
      ...(Platform.OS === 'ios' && {
        borderWidth: 1,
        borderColor: theme.colors.border,
      }),
      // Enhanced shadow with border fallback for Android (no elevation to prevent clipping)
      ...createCardShadow(theme),
    },
    subjectCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    subjectIconContainer: {
      width: 28, // Reduced size for smaller cards
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6, // Reduced margin
      // Enhanced shadow using platform-specific utilities
      ...createMediumShadow(theme),
    },
    subjectInfo: {
      flex: 1,
    },
    modernSubjectTitle: {
      fontSize: 12, // Reduced font size for smaller cards
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 1,
      letterSpacing: 0.1,
    },
    subjectGradeCount: {
      fontSize: 14,
      color: '#666',
    },
    subjectCardRight: {
      alignItems: 'flex-end',
    },
    averageContainer: {
      alignItems: 'center',
      marginRight: 10,
    },
    averageText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    averageLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 2,
    },

    // Dashboard-style Subject Card Styles
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4, // Reduced margin for smaller cards
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    titleContainer: {
      flex: 1,
    },
    assessmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    assessmentCount: {
      fontSize: 8, // Reduced font size
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginLeft: 2, // Reduced margin
    },
    expandButton: {
      width: 28, // Reduced size for smaller cards
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.small,
      elevation: 3,
    },

    // Stats Row Section
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 6, // Reduced margin for smaller cards
      paddingVertical: 3, // Reduced padding
    },
    gradeSection: {
      alignItems: 'center',
      flex: 1,
    },
    gradeCircle: {
      width: 24, // Reduced size for smaller cards
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
      // Enhanced shadow using platform-specific utilities
      ...createSmallShadow(theme),
    },
    gradeLetterText: {
      fontSize: 10, // Reduced font size for smaller cards
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    gradeLabel: {
      fontSize: 7, // Reduced font size
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    percentageSection: {
      alignItems: 'center',
      flex: 1,
    },
    percentageDisplay: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4, // Reduced margin
    },
    percentageNumber: {
      fontSize: 14, // Reduced font size for smaller cards
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    percentageSymbol: {
      fontSize: 10, // Reduced font size
      fontWeight: '600',
      marginLeft: 1,
    },
    percentageLabel: {
      fontSize: 7, // Reduced font size
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    assessmentsSection: {
      alignItems: 'center',
      flex: 1,
    },
    assessmentsIndicator: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    assessmentsNumber: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    assessmentsLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },

    // Progress Section
    progressSection: {
      marginBottom: 6, // Reduced margin for smaller cards
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3, // Reduced margin
    },
    progressLabel: {
      fontSize: 8, // Reduced font size
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    progressValue: {
      fontSize: 8, // Reduced font size
      fontWeight: '600',
      color: theme.colors.text,
    },
    progressBarWrapper: {
      width: '100%',
    },
    progressTrack: {
      width: '100%',
      height: 3, // Reduced height for smaller cards
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },

    // Bottom Info Section
    bottomInfo: {
      marginTop: 1, // Reduced margin
    },
    typeBreakdown: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6, // Reduced gap for smaller cards
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeDot: {
      width: 4, // Reduced size for smaller cards
      height: 4,
      borderRadius: 2,
      marginRight: 4, // Reduced margin
    },
    typeText: {
      fontSize: 8, // Reduced font size for smaller cards
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },

    // Floating Badge
    floatingBadge: {
      position: 'absolute',
      top: 28, // Adjusted position for smaller cards
      right: 48, // Adjusted position for smaller expand button
      width: 20, // Reduced size for smaller cards
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      // Enhanced shadow using platform-specific utilities
      ...createSmallShadow(theme),
    },

    // Grades Screen Styles
    gradesContainer: {
      flex: 1,
    },
    subjectHeader: {
      margin: 10,
    },

    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 0,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 2,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeTabButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 5,
    },
    // Modern Grades Container Styles
    modernGradesContainer: {
      flex: 1,
      width: '100%', // Ensure full width usage
    },
    gradesList: {
      paddingBottom: 20,
      paddingHorizontal: 5, // Minimal horizontal padding to maximize width usage
    },
    gradeSeparator: {
      height: 12,
    },

    // Modern Grade Card Styles
    gradeCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 2, // Minimal horizontal margin for better width usage
      marginVertical: 6, // Add vertical margin for better spacing in two-column layout
      ...createSmallShadow(theme), // Enhanced shadow with border fallback for Android
      flex: 1, // Allow cards to expand in landscape mode
    },
    evenGradeCard: {
      backgroundColor: theme.colors.card,
    },
    gradeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    gradeCardLeft: {
      flex: 1,
      marginRight: 15,
    },
    gradeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 6,
    },
    gradeDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    gradeCardRight: {
      alignItems: 'flex-end',
    },
    gradeScoreContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 80,
    },
    gradeScore: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    gradePercentage: {
      fontSize: 14,
      fontWeight: '600',
    },
    gradeCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gradeDetails: {
      flex: 1,
    },
    gradeDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    gradeDetailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    gradePerformanceContainer: {
      alignItems: 'flex-end',
    },
    gradePerformanceBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    gradePerformanceText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },

    // Landscape-specific styles for grade cards
    landscapeGradeCard: {
      width: '49%', // Two cards per row with minimal margin for full width usage
      marginHorizontal: '0.5%',
    },
    landscapeGradeTitle: {
      fontSize: 16, // Slightly smaller for landscape
    },
    landscapeScoreContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 70,
    },
    landscapeGradeScore: {
      fontSize: 14,
    },
    landscapeGradePercentage: {
      fontSize: 12,
    },
    landscapeDetailText: {
      fontSize: 12,
    },
    landscapePerformanceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    landscapePerformanceText: {
      fontSize: 10,
    },

    // Assessment Criteria Styles for Formative Grades
    assessmentCriteriaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
      maxWidth: 140,
    },
    criteriaItem: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginLeft: 6,
      marginBottom: 6,
      minWidth: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    criteriaLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
    },
    comingSoon: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    comingSoonText: {
      fontSize: 16,
      color: '#666',
      fontStyle: 'italic',
    },
    // Pagination styles
    paginationSection: {
      flexShrink: 0, // Prevent pagination from shrinking
    },
    landscapePaginationSection: {
      marginBottom: 20, // Add bottom margin in landscape mode
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 5,
      backgroundColor: theme.colors.card,
      // Only show top border on iOS - Android elevation provides sufficient visual separation
      ...(Platform.OS === 'ios' && {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }),

      margin: 10,
      borderRadius: 30,
      ...createSmallShadow(theme),
      minHeight: 60, // Ensure minimum height for pagination
    },
    paginationButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      backgroundColor: '#FF9500',
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
    },
    disabledButton: {
      backgroundColor: '#ccc',
    },
    paginationButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    disabledText: {
      color: '#999',
    },
    pageInfo: {
      alignItems: 'center',
    },
    pageInfoText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    itemsInfoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    // Enhanced Grade Card Styles
    templateInfo: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    letterGrade: {
      fontSize: 12,
      fontWeight: 'bold',
      marginTop: 2,
    },
    landscapeLetterGrade: {
      fontSize: 10,
    },
    commentSection: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    commentText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    weightedBadge: {
      backgroundColor: theme.colors.warning + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    weightedText: {
      fontSize: 10,
      color: theme.colors.warning,
      fontWeight: '600',
    },

    // Enhanced Formative Assessment Styles
    criteriaValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginTop: 2,
    },
    criteriaLegend: {
      marginTop: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    criteriaLegendTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    criteriaLegendItem: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 16,
      marginBottom: 2,
    },

    // Enhanced Statistics Display Styles
    statisticsContainer: {
      backgroundColor: theme.colors.card,
      width: '95%',
      marginVertical: 8,
      borderRadius: 16,
      padding: 16,
      ...createCardShadow(theme),
    },
    statisticsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    statisticsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statisticsCard: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 5,
      marginHorizontal: 4,
      alignItems: 'center',
      ...createSmallShadow(theme),
      minHeight: 140,
    },
    statisticsCardTitle: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    statisticsMainValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      lineHeight: 32,
    },
    statisticsUnit: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 2,
    },
    statisticsLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    statisticsDetails: {
      alignItems: 'center',
      width: '100%',
    },
    statisticsDetailText: {
      fontSize: 9,
      color: theme.colors.textSecondary,
      marginBottom: 3,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 12,
    },
    enhancedFeaturesIndicator: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: 8,
      padding: 8,
      marginTop: 8,
    },
    enhancedFeaturesText: {
      fontSize: 11,
      color: theme.colors.primary,
      textAlign: 'center',
      fontWeight: '500',
    },

    statisticsMainValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    // Enhanced Subject Card Statistics Styles
    enhancedStatsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 3, // Reduced margin for smaller cards
      paddingTop: 3, // Reduced padding
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '40',
    },
    enhancedStatItem: {
      marginHorizontal: 3, // Reduced margin for smaller cards
    },
    enhancedStatText: {
      fontSize: 7, // Reduced font size for smaller cards
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },

    // Loading Container Styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
      fontWeight: '500',
    },
  });
