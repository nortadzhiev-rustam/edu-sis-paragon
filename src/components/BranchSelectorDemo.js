import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBuilding, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import {
  getCurrentBranchInfo,
  switchBranchWithStorage,
} from '../services/branchSelectionService';

/**
 * Branch Selector Demo Component
 * Demonstrates the mobile branch selection API integration
 */
const BranchSelectorDemo = ({ authCode, onBranchChange }) => {
  const [currentBranch, setCurrentBranch] = useState(null);
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load branch information on component mount
  useEffect(() => {
    loadBranchInfo();
  }, [authCode]);

  const loadBranchInfo = async () => {
    if (!authCode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🌿 BRANCH DEMO: Loading branch information');
      
      const branchInfo = await getCurrentBranchInfo(authCode);
      
      if (branchInfo.success) {
        setCurrentBranch(branchInfo.current_branch);
        setAccessibleBranches(branchInfo.accessible_branches || []);
        
        console.log('✅ BRANCH DEMO: Branch info loaded');
        console.log('📍 Current branch:', branchInfo.current_branch?.branch_name);
        console.log('🏢 Accessible branches:', branchInfo.accessible_branches?.length || 0);
      } else {
        console.error('❌ BRANCH DEMO: Failed to load branch info:', branchInfo.message);
        Alert.alert('Error', 'Failed to load branch information');
      }
    } catch (error) {
      console.error('❌ BRANCH DEMO: Error loading branch info:', error);
      Alert.alert('Error', 'Failed to load branch information: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSwitch = async (branchId, branchName) => {
    if (switching || branchId === currentBranch?.branch_id) return;

    try {
      setSwitching(true);
      setShowDropdown(false);
      
      console.log('🔄 BRANCH DEMO: Switching to branch:', branchName);
      
      const response = await switchBranchWithStorage(authCode, branchId);
      
      if (response.success) {
        setCurrentBranch(response.current_branch);
        console.log('✅ BRANCH DEMO: Branch switched successfully to:', response.current_branch?.branch_name);
        
        // Notify parent component of branch change
        if (onBranchChange) {
          onBranchChange(response.current_branch);
        }
        
        Alert.alert('Success', `Switched to ${response.current_branch?.branch_name}`);
      } else {
        console.error('❌ BRANCH DEMO: Failed to switch branch:', response.message);
        Alert.alert('Error', 'Failed to switch branch: ' + response.message);
      }
    } catch (error) {
      console.error('❌ BRANCH DEMO: Error switching branch:', error);
      Alert.alert('Error', 'Failed to switch branch: ' + error.message);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading branch information...</Text>
      </View>
    );
  }

  if (!currentBranch || accessibleBranches.length <= 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          {!currentBranch 
            ? 'No branch information available' 
            : 'Single branch access - no switching needed'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Branch Selection Demo</Text>
      
      {/* Current Branch Display */}
      <TouchableOpacity
        style={styles.currentBranchContainer}
        onPress={() => setShowDropdown(!showDropdown)}
        disabled={switching}
      >
        <FontAwesomeIcon icon={faBuilding} size={16} color="#007AFF" />
        <View style={styles.branchInfo}>
          <Text style={styles.currentBranchText}>
            {currentBranch.branch_name}
          </Text>
          <Text style={styles.branchCount}>
            {accessibleBranches.length} branches available
          </Text>
        </View>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          size={12} 
          color="#666"
          style={[
            styles.chevron,
            showDropdown && styles.chevronRotated
          ]}
        />
      </TouchableOpacity>

      {/* Switching Indicator */}
      {switching && (
        <View style={styles.switchingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.switchingText}>Switching branch...</Text>
        </View>
      )}

      {/* Branch Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {accessibleBranches.map((branch) => (
            <TouchableOpacity
              key={branch.branch_id}
              style={[
                styles.branchOption,
                branch.is_active && styles.branchOptionActive
              ]}
              onPress={() => handleBranchSwitch(branch.branch_id, branch.branch_name)}
              disabled={switching}
            >
              <Text style={[
                styles.branchOptionText,
                branch.is_active && styles.branchOptionTextActive,
                switching && styles.branchOptionTextDisabled
              ]}>
                {branch.branch_name}
              </Text>
              {branch.is_active && (
                <Text style={styles.activeIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadBranchInfo}
        disabled={loading || switching}
      >
        <Text style={styles.refreshButtonText}>Refresh Branch Info</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  currentBranchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  branchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currentBranchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  branchCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  switchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  switchingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  branchOptionActive: {
    backgroundColor: '#e3f2fd',
  },
  branchOptionText: {
    fontSize: 14,
    color: '#333',
  },
  branchOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  branchOptionTextDisabled: {
    opacity: 0.5,
  },
  activeIndicator: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  refreshButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default BranchSelectorDemo;
