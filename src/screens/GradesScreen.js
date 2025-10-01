import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
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
  faChevronDown,
  faChevronUp,
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

  // Modal state for template details
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Expanded section state (only one section can be expanded at a time)
  const [expandedSection, setExpandedSection] = useState(null);

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

  // Group assessments by subject and template
  const groupAssessmentsBySubjectAndTemplate = (assessments) => {
    if (!assessments || !Array.isArray(assessments)) return [];

    const grouped = {};

    assessments.forEach((assessment) => {
      const subject = assessment.subject_name || 'Other';
      const templateName =
        assessment.template_info?.template_name ||
        assessment.assessment_name ||
        'Untitled';

      if (!grouped[subject]) {
        grouped[subject] = {
          templates: {},
          allAssessments: [],
        };
      }

      if (!grouped[subject].templates[templateName]) {
        grouped[subject].templates[templateName] = {
          templateName,
          subject,
          assessments: [],
          template_id: assessment.template_info?.template_id,
        };
      }

      grouped[subject].templates[templateName].assessments.push(assessment);
      grouped[subject].allAssessments.push(assessment);
    });

    // Convert to sections array for SectionList with calculated averages
    const sections = [];
    Object.keys(grouped).forEach((subject) => {
      const templates = Object.values(grouped[subject].templates);
      const allAssessments = grouped[subject].allAssessments;

      // Calculate subject average (for summative only)
      let subjectAverage = null;
      if (activeTab === 'summative') {
        const graded = allAssessments.filter(
          (a) => a.score_percentage !== null
        );
        if (graded.length > 0) {
          const sum = graded.reduce(
            (acc, a) => acc + (a.score_percentage || 0),
            0
          );
          subjectAverage = Math.round(sum / graded.length);
        }
      }

      sections.push({
        title: subject,
        data: templates,
        average: subjectAverage,
        assessmentCount: allAssessments.length,
      });
    });

    return sections;
  };

  // Toggle section - only one section can be expanded at a time
  const toggleSection = (sectionTitle) => {
    setExpandedSection((prev) => {
      // If tapping the currently expanded section, collapse it
      if (prev === sectionTitle) {
        return null;
      }
      // Otherwise, expand the tapped section (and collapse others)
      return sectionTitle;
    });
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

  // Render colorful section header with expand/collapse
  const renderSectionHeader = ({ section }) => {
    const { title, average, assessmentCount } = section;
    const isExpanded = expandedSection === title;
    const subjectColor = getSubjectColor(title);
    const subjectIcon = getSubjectIcon(title);
    const isFormative = activeTab === 'formative';
    const isDark = theme.dark;

    // Get grade letter and color
    const gradeColor = average !== null ? getGradeColor(average) : subjectColor;
    const gradeLetter = average !== null ? getGradeLabel(average) : 'N/A';

    // Adjust opacity for dark mode - use lighter background
    const backgroundOpacity = isDark ? '25' : '15';
    const badgeOpacity = isDark ? '35' : '20';

    return (
      <TouchableOpacity
        style={[
          styles.subjectSectionHeader,
          { backgroundColor: `${subjectColor}${backgroundOpacity}` },
        ]}
        onPress={() => toggleSection(title)}
        activeOpacity={0.7}
      >
        <View style={styles.subjectSectionLeft}>
          <View
            style={[
              styles.subjectSectionIcon,
              { backgroundColor: subjectColor },
            ]}
          >
            <FontAwesomeIcon icon={subjectIcon} size={18} color='#fff' />
          </View>
          <View style={styles.subjectSectionInfo}>
            <Text style={styles.subjectSectionTitle}>{title}</Text>
            <Text style={styles.subjectSectionSubtitle}>
              {assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.subjectSectionRight}>
          {!isFormative && average !== null && (
            <View
              style={[
                styles.subjectGradeBadge,
                { backgroundColor: `${gradeColor}${badgeOpacity}` },
              ]}
            >
              <Text style={[styles.subjectGradeText, { color: gradeColor }]}>
                {average}%
              </Text>
              <Text style={[styles.subjectGradeLetter, { color: gradeColor }]}>
                {gradeLetter}
              </Text>
            </View>
          )}
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            size={16}
            color={subjectColor}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Render template card (shows template with average grade)
  const renderTemplateCard = ({ item }) => {
    const { templateName, subject, assessments } = item;
    const isFormative = activeTab === 'formative';

    // Calculate average for template
    const calculateTemplateAverage = () => {
      if (isFormative) return null;

      const graded = assessments.filter((a) => a.score_percentage !== null);
      if (graded.length === 0) return null;

      const sum = graded.reduce((acc, a) => acc + (a.score_percentage || 0), 0);
      return Math.round(sum / graded.length);
    };

    const average = calculateTemplateAverage();
    const gradeColor = average !== null ? getGradeColor(average) : '#007AFF';
    const gradeLetter = average !== null ? getGradeLabel(average) : 'A';

    const handlePress = () => {
      setSelectedTemplate(item);
      setModalVisible(true);
    };

    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.templateCardHeader}>
          <View style={styles.templateCardLeft}>
            <Text style={styles.templateCardTitle}>{templateName}</Text>
            <Text style={styles.templateCardSubtitle}>
              {assessments.length} assessment
              {assessments.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.templateCardRight}>
            {!isFormative && average !== null && (
              <View
                style={[
                  styles.templateGradeBadge,
                  { backgroundColor: `${gradeColor}15` },
                ]}
              >
                <Text style={[styles.templateGradeText, { color: gradeColor }]}>
                  {average}%
                </Text>
                <Text
                  style={[styles.templateGradeLetter, { color: gradeColor }]}
                >
                  {gradeLetter}
                </Text>
              </View>
            )}
            <FontAwesomeIcon icon={faChevronRight} size={16} color='#999' />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      <>
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
      </>
    );
  };

  // Render template detail modal
  const renderTemplateModal = () => {
    if (!selectedTemplate) return null;

    const { templateName, subject, assessments } = selectedTemplate;
    const isFormative = activeTab === 'formative';

    // Calculate statistics
    const normalAssessments = assessments.filter(
      (a) =>
        !a.type_title?.toLowerCase().includes('final') &&
        !a.type_title?.toLowerCase().includes('exam')
    );
    const finalAssessments = assessments.filter(
      (a) =>
        a.type_title?.toLowerCase().includes('final') ||
        a.type_title?.toLowerCase().includes('exam')
    );

    const normalScore = normalAssessments.reduce(
      (sum, a) => sum + (a.raw_score || 0),
      0
    );
    const finalScore = finalAssessments.reduce(
      (sum, a) => sum + (a.raw_score || 0),
      0
    );

    // Calculate average
    const graded = assessments.filter((a) => a.score_percentage !== null);
    const average =
      graded.length > 0
        ? Math.round(
            graded.reduce((sum, a) => sum + (a.score_percentage || 0), 0) /
              graded.length
          )
        : null;
    const gradeColor = average !== null ? getGradeColor(average) : '#007AFF';
    const gradeLetter = average !== null ? getGradeLabel(average) : 'A';

    return (
      <Modal
        visible={modalVisible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={['top', 'left', 'right']}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalHeaderTitle}>{templateName}</Text>
              <Text style={styles.modalHeaderSubtitle}>
                {subject} • {assessments.length} assessments
              </Text>
            </View>
            {!isFormative && average !== null && (
              <View
                style={[
                  styles.modalHeaderBadge,
                  { backgroundColor: `${gradeColor}15` },
                ]}
              >
                <Text style={[styles.modalHeaderGrade, { color: gradeColor }]}>
                  {average}%
                </Text>
                <Text style={[styles.modalHeaderLetter, { color: gradeColor }]}>
                  {gradeLetter}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Assessments Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Assessments</Text>
              {assessments.map((assessment) => (
                <View
                  key={assessment.assessment_id}
                  style={styles.assessmentItem}
                >
                  <View style={styles.assessmentItemHeader}>
                    <Text style={styles.assessmentItemTitle}>
                      {assessment.assessment_name}
                    </Text>
                    {!isFormative && (
                      <View style={styles.assessmentTypeBadge}>
                        <Text style={styles.assessmentTypeBadgeText}>
                          {assessment.type_title}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.assessmentItemDate}>
                    • {assessment.date}
                  </Text>
                  <View style={styles.assessmentItemFooter}>
                    {!isFormative ? (
                      <>
                        <Text style={styles.assessmentItemScore}>
                          {assessment.raw_score !== null
                            ? `${assessment.raw_score}/${assessment.max_score}`
                            : 'Not graded'}
                        </Text>
                        {assessment.score_percentage !== null && (
                          <Text
                            style={[
                              styles.assessmentItemPercentage,
                              {
                                color: getGradeColor(
                                  assessment.score_percentage
                                ),
                              },
                            ]}
                          >
                            {assessment.score_percentage}%
                          </Text>
                        )}
                      </>
                    ) : (
                      <View style={styles.formativeCriteriaRow}>
                        {assessment.tt1 && (
                          <View
                            style={[
                              styles.formativeCriteriaBadge,
                              { backgroundColor: '#34C759' },
                            ]}
                          >
                            <Text style={styles.formativeCriteriaLabel}>
                              T&R
                            </Text>
                            <Text style={styles.formativeCriteriaValue}>
                              {assessment.tt1}
                            </Text>
                          </View>
                        )}
                        {assessment.tt2 && (
                          <View
                            style={[
                              styles.formativeCriteriaBadge,
                              { backgroundColor: '#FF9500' },
                            ]}
                          >
                            <Text style={styles.formativeCriteriaLabel}>
                              COM
                            </Text>
                            <Text style={styles.formativeCriteriaValue}>
                              {assessment.tt2}
                            </Text>
                          </View>
                        )}
                        {assessment.tt3 && (
                          <View
                            style={[
                              styles.formativeCriteriaBadge,
                              { backgroundColor: '#007AFF' },
                            ]}
                          >
                            <Text style={styles.formativeCriteriaLabel}>
                              APP
                            </Text>
                            <Text style={styles.formativeCriteriaValue}>
                              {assessment.tt3}
                            </Text>
                          </View>
                        )}
                        {assessment.tt4 && (
                          <View
                            style={[
                              styles.formativeCriteriaBadge,
                              { backgroundColor: '#FF3B30' },
                            ]}
                          >
                            <Text style={styles.formativeCriteriaLabel}>
                              COL
                            </Text>
                            <Text style={styles.formativeCriteriaValue}>
                              {assessment.tt4}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Calculation Breakdown (Summative only) */}
            {!isFormative && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Calculation Breakdown
                </Text>
                <View style={styles.calculationCard}>
                  <View style={styles.calculationRow}>
                    <View style={styles.calculationColumn}>
                      <Text style={styles.calculationLabel}>
                        Normal Assessments
                      </Text>
                      <Text style={styles.calculationValue}>
                        {normalAssessments.length}
                      </Text>
                    </View>
                    <View style={styles.calculationColumn}>
                      <Text style={styles.calculationLabel}>
                        Final Assessments
                      </Text>
                      <Text style={styles.calculationValue}>
                        {finalAssessments.length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.calculationDivider} />
                  <View style={styles.calculationRow}>
                    <View style={styles.calculationColumn}>
                      <Text style={styles.calculationLabel}>Normal Score</Text>
                      <Text style={styles.calculationValue}>{normalScore}</Text>
                    </View>
                    <View style={styles.calculationColumn}>
                      <Text style={styles.calculationLabel}>Final Score</Text>
                      <Text style={styles.calculationValue}>{finalScore}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Get sections for current tab
  const getSections = () => {
    const data =
      activeTab === 'summative' ? grades?.summative : grades?.formative;
    return groupAssessmentsBySubjectAndTemplate(data || []);
  };

  const sections = getSections();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Template Detail Modal */}
      {renderTemplateModal()}

      {/* Compact Header */}
      <View style={styles.compactHeaderContainer}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color='#fff' />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('assessments')}</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {studentName && (
          <View style={styles.studentContextBar}>
            <Text style={styles.studentContextName}>{studentName}</Text>
          </View>
        )}

        {/* Tab Navigation Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.tabContainer}>
            {renderTabButton('summative', t('summative'))}
            {renderTabButton('formative', t('formative'))}
          </View>
          {/* Enhanced Statistics Overview */}
          {renderStatisticsOverview()}
        </View>
      </View>

      <View style={[styles.content, isLandscape && styles.landscapeContent]}>
        {loading ? (
          // Show loading indicator
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        ) : (
          // Show template list grouped by subject
          <View style={styles.templateListContainer}>
            <SectionList
              sections={sections.map((section) => ({
                ...section,
                data: expandedSection === section.title ? section.data : [],
              }))}
              renderItem={renderTemplateCard}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item, index) => `${item.template_id}-${index}`}
              style={styles.fullWidth}
              contentContainerStyle={styles.templateGrid}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {activeTab === 'summative'
                      ? 'No summative assessments available'
                      : 'No formative assessments available'}
                  </Text>
                </View>
              }
            />
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
      paddingVertical: 5,
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
      elevation: 2,
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
    // Section Header Styles
    sectionHeader: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    // Subject Section Header Styles (Colorful & Expandable)
    subjectSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      borderRadius: 12,
      ...createSmallShadow(theme),
    },
    subjectSectionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    subjectSectionIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    subjectSectionInfo: {
      flex: 1,
    },
    subjectSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    subjectSectionSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    subjectSectionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    subjectGradeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 70,
    },
    subjectGradeText: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 2,
    },
    subjectGradeLetter: {
      fontSize: 14,
      fontWeight: '600',
    },
    gradeSectionHeader: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
      marginBottom: 8,
    },
    gradeSectionHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    // Strand Section Styles (for grouped assessments)
    strandSectionHeader: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.background,
      marginTop: 8,
      marginBottom: 4,
    },
    strandSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    strandSectionSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    // Strand Item Styles (individual assessment in section)
    strandItemContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      ...createSmallShadow(theme),
    },
    strandItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    strandItemLeft: {
      flex: 1,
      marginRight: 12,
    },
    strandItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    strandItemSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    strandItemRight: {
      alignItems: 'flex-end',
    },
    strandGradeBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 70,
    },
    strandGradeText: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 2,
    },
    strandGradeLetter: {
      fontSize: 14,
      fontWeight: '600',
    },
    // Formative Criteria Styles
    formativeCriteriaRow: {
      flexDirection: 'row',
      gap: 6,
    },
    formativeCriteriaBadge: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: 'center',
      minWidth: 40,
    },
    formativeCriteriaLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 2,
    },
    formativeCriteriaValue: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    // Template Card Styles
    templateListContainer: {
      flex: 1,
    },
    templateGrid: {
      paddingBottom: 20,
    },
    templateCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 26,
      marginVertical: 6,
      ...createSmallShadow(theme),
    },
    templateCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    templateCardLeft: {
      flex: 1,
      marginRight: 12,
    },
    templateCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    templateCardSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    templateCardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    templateGradeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 60,
    },
    templateGradeText: {
      fontSize: 16,
      fontWeight: '700',
    },
    templateGradeLetter: {
      fontSize: 12,
      fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      ...createSmallShadow(theme),
    },
    modalBackButton: {
      padding: 8,
      marginRight: 12,
    },
    modalHeaderCenter: {
      flex: 1,
    },
    modalHeaderTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    modalHeaderSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
    },
    modalHeaderBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: 60,
      marginLeft: 12,
    },
    modalHeaderGrade: {
      fontSize: 18,
      fontWeight: '700',
    },
    modalHeaderLetter: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalContent: {
      flex: 1,
    },
    modalSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    modalSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    assessmentItem: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...createSmallShadow(theme),
    },
    assessmentItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    assessmentItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    assessmentTypeBadge: {
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    assessmentTypeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    assessmentItemDate: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    assessmentItemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    assessmentItemScore: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    assessmentItemPercentage: {
      fontSize: 16,
      fontWeight: '700',
    },
    calculationCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      ...createSmallShadow(theme),
    },
    calculationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    calculationColumn: {
      flex: 1,
    },
    calculationLabel: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    calculationValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    calculationDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 16,
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
      marginHorizontal: 10, // Minimal horizontal margin for better width usage
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
      marginVertical: 12,
    },
    overviewTabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 0,
      marginBottom: 12,
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
