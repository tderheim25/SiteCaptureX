import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PhotoService } from '../lib/PhotoService';

const GalleryPickerScreen = ({ route, navigation }) => {
  const { siteId, captured } = route.params || {};
  const [permissionStatus, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (captured?.length) {
      setImages((prev) => [...captured, ...prev]);
    }
  }, [captured]);

  useEffect(() => {
    (async () => {
      if (!permissionStatus || !permissionStatus.granted) {
        await requestPermission();
      }
    })();
  }, [permissionStatus]);

  const pickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 10,
      });
      if (!res.canceled) {
        const selected = res.assets || [];
        setImages((prev) => [...prev, ...selected]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Picker Error', 'Failed to open gallery');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.thumbWrap}>
      <Image source={{ uri: item.uri }} style={styles.thumb} />
    </View>
  );

  const uploadAll = async () => {
    if (!siteId) {
      Alert.alert('Missing Site', 'No site selected.');
      return;
    }
    if (images.length === 0) return;

    try {
      setUploading(true);
      let lastProgress = 0;
      const result = await PhotoService.uploadPhotos(images, siteId, (uploaded, total) => {
        // Avoid spamming alerts; update every photo or when total small
        if (uploaded !== lastProgress) {
          lastProgress = uploaded;
          console.log(`Uploaded ${uploaded}/${total}`);
        }
      });

      const successCount = result.successful.length;
      const failCount = result.failed.length;

      if (successCount > 0) {
        Alert.alert('Upload complete', `${successCount} photo(s) uploaded successfully${failCount ? `, ${failCount} failed` : ''}.`);
      } else {
        Alert.alert('Upload failed', 'No photos were uploaded.');
      }

      if (successCount > 0) {
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Upload Error', e.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={pickImages} disabled={uploading}>
          <Ionicons name="images" size={20} color="#4A90E2" />
          <Text style={styles.toolbarBtnText}>Browse Files</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolbarBtn, images.length === 0 && styles.disabledBtn]} disabled={images.length === 0 || uploading} onPress={uploadAll}>
          <Ionicons name="cloud-upload" size={20} color={images.length && !uploading ? '#4A90E2' : '#999'} />
          <Text style={[styles.toolbarBtnText, images.length === 0 && styles.disabledText]}>{uploading ? 'Uploading…' : `Upload (${images.length})`}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={images}
        keyExtractor={(item, index) => `${item.assetId || item.fileName || item.uri}-${index}`}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: '#e1e5e9',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#f9fbff'
  },
  toolbarBtnText: { color: '#4A90E2', fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },
  disabledText: { color: '#999' },
  grid: { padding: 8 },
  thumbWrap: { width: '33.33%', aspectRatio: 1, padding: 4 },
  thumb: { flex: 1, borderRadius: 8 },
});

export default GalleryPickerScreen;