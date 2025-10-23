import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const screenWidth = Dimensions.get('window').width;

/**
 * PerformanceChart Component
 * 
 * Displays a line chart showing weekly attendance performance
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of attendance percentages [Mon, Tue, Wed, Thu, Fri]
 * @param {Array} props.labels - Array of day labels (default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
 */
export default function PerformanceChart({ data = [0, 0, 0, 0, 0], labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // Ensure data has valid values
  const chartData = data.map((val) => (typeof val === 'number' && !isNaN(val) ? val : 0));

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  const chartDataConfig = {
    labels: labels,
    datasets: [
      {
        data: chartData,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 {t('thisWeeksPerformance')}</Text>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartDataConfig}
          width={screenWidth - 64}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          fromZero={true}
          segments={4}
        />
      </View>

      <Text style={styles.subtitle}>Attendance Rate Trend</Text>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    chart: {
      borderRadius: 12,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
  });

