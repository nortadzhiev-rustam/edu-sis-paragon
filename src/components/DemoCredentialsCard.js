import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DemoCredentialsCard = ({ onCredentialSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demo Credentials</Text>
      <Text style={styles.subtitle}>Demo mode is available</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default DemoCredentialsCard;
