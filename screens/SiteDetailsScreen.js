import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhotoService } from '../lib/PhotoService';

import { LinearGradient } from 'expo-linear-gradient';

const SiteDetailsScreen = ({ route, navigation }) => {
  const { site } = route.params;
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const sitePhotos = await PhotoService.getPhotos(site.id);
        setPhotos(sitePhotos);
        setPhotoCount(sitePhotos.length);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [site.id]);

  const renderPhoto = ({ item }) => (
    <TouchableOpacity style={styles.photoContainer}>
      <Image source={{ uri: item.public_url }} style={styles.photo} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.title}>{site.name}</Text>
        <Text style={styles.subtitle}>{site.address}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="images-outline" size={20} color="#fff" />
          <Text style={styles.photoCount}>{photoCount} photos</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#00D4AA" style={styles.loader} />
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          style={styles.gallery}
          contentContainerStyle={styles.galleryContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.9, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoCount: { fontSize: 16, color: '#fff', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center' },
  gallery: { flex: 1, padding: 4 },
  galleryContent: { paddingBottom: 20 },
  photoContainer: { flex: 1/3, margin: 4, aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
  photo: { flex: 1 },
});

export default SiteDetailsScreen;