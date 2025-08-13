import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../lib/AuthService';

const UploadPhotosScreen = ({ navigation }) => {
  const [selectedSite, setSelectedSite] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSiteSelector, setShowSiteSelector] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const fetchedSites = await AuthService.getSites();
      setSites(fetchedSites || []);
    } catch (error) {
      console.error('Error loading sites:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const selectSite = (site) => {
    setSelectedSite(site);
    setShowSiteSelector(false);
  };

  const openCamera = () => {
    if (!selectedSite) {
      Alert.alert('Select Site', 'Please select a job site first');
      return;
    }
    navigation.navigate('Camera', { siteId: selectedSite.id });
  };

  const openGallery = () => {
    if (!selectedSite) {
      Alert.alert('Select Site', 'Please select a job site first');
      return;
    }
    navigation.navigate('Gallery', { siteId: selectedSite.id });
  };

  const renderSiteItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.siteItem} 
      onPress={() => selectSite(item)}
    >
      <View style={styles.siteInfo}>
        <Text style={styles.siteName}>{item.name}</Text>
        <Text style={styles.siteAddress}>{item.address}</Text>
        {item.project_code && (
          <View style={styles.projectCodeBadge}>
            <Text style={styles.projectCodeText}>{item.project_code}</Text>
          </View>
        )}
      </View>
      <Ionicons name="checkmark-circle" size={24} color="#00D4AA" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Upload Photos</Text>
          <Text style={styles.subtitle}>Document progress and issues at your job sites</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#00D4AA" />
            <Text style={styles.sectionTitle}>Select Job Site</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.siteSelector}
            onPress={() => setShowSiteSelector(true)}
          >
            <Text style={[styles.siteSelectorText, !selectedSite && styles.placeholderText]}>
              {selectedSite ? selectedSite.name : 'Choose a job site...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {selectedSite && (
            <View style={styles.selectedSiteInfo}>
              <Ionicons name="location" size={16} color="#00D4AA" />
              <Text style={styles.selectedSiteName}>{selectedSite.name}</Text>
              <Text style={styles.selectedSiteAddress}>{selectedSite.address}</Text>
              {selectedSite.project_code && (
                <View style={styles.selectedProjectCode}>
                  <Text style={styles.selectedProjectCodeText}>{selectedSite.project_code}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          {/* Use Camera Card */}
          <TouchableOpacity 
            style={[styles.actionCard, !selectedSite && styles.disabledCard]}
            onPress={openCamera}
            disabled={!selectedSite}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={32} color={selectedSite ? "#4A90E2" : "#999"} />
            </View>
            <Text style={[styles.actionTitle, !selectedSite && styles.disabledText]}>
              Use Camera
            </Text>
            <Text style={[styles.actionDescription, !selectedSite && styles.disabledText]}>
              Capture photos with your webcam
            </Text>
            <View style={[styles.actionButton, !selectedSite && styles.disabledButton]}>
              <Text style={[styles.actionButtonText, !selectedSite && styles.disabledButtonText]}>
                Start Camera
              </Text>
            </View>
          </TouchableOpacity>

          {/* Upload Files Card */}
          <TouchableOpacity 
            style={[styles.actionCard, !selectedSite && styles.disabledCard]}
            onPress={openGallery}
            disabled={!selectedSite}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="cloud-upload" size={32} color={selectedSite ? "#4A90E2" : "#999"} />
            </View>
            <Text style={[styles.actionTitle, !selectedSite && styles.disabledText]}>
              Upload Files
            </Text>
            <Text style={[styles.actionDescription, !selectedSite && styles.disabledText]}>
              Drag & drop photos or click to browse
            </Text>
            <View style={[styles.actionButton, !selectedSite && styles.disabledButton]}>
              <Text style={[styles.actionButtonText, !selectedSite && styles.disabledButtonText]}>
                Browse Files
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Site Selection Modal */}
      <Modal
        visible={showSiteSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSiteSelector(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job Site</Text>
              <TouchableOpacity onPress={() => setShowSiteSelector(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#00D4AA" style={styles.loader} />
            ) : (
              <FlatList
                data={sites}
                keyExtractor={item => String(item.id)}
                renderItem={renderSiteItem}
                style={styles.sitesList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  headerContent: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  siteSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  selectedSiteInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectedSiteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  selectedSiteAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 24,
    width: '100%',
    marginTop: 4,
  },
  selectedProjectCode: {
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 24,
    marginTop: 8,
  },
  selectedProjectCodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 32,
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.5,
  },
  actionIcon: {
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  disabledText: {
    color: '#999',
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  disabledButton: {
    backgroundColor: '#e1e5e9',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    padding: 40,
  },
  sitesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  siteAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  projectCodeBadge: {
    backgroundColor: '#e7f3ff',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  projectCodeText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UploadPhotosScreen;