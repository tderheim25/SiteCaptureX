import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const CameraScreen = ({ route, navigation }) => {
  const { siteId } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isSixteenNine, setIsSixteenNine] = useState(true);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!siteId) {
      Alert.alert('Missing Site', 'No site selected.');
      navigation.goBack();
    }
  }, [siteId]);

  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleAspect = () => setIsSixteenNine((v) => !v);

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!photo) return;
      navigation.navigate('Gallery', { siteId, captured: [photo] });
    } catch (e) {
      console.error(e);
      Alert.alert('Camera Error', 'Failed to take photo');
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aspectRatio = isSixteenNine ? { width: 9, height: 16 } : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          ratio={isSixteenNine ? '16:9' : undefined}
        />
        {/* Mask overlay for 16:9 portrait */}
        {isSixteenNine && (
          <View pointerEvents="none" style={styles.aspectMask} />
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.controlButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleAspect} style={styles.toggleAspect}>
          <Text style={styles.toggleAspectText}>{isSixteenNine ? '16:9 Portrait' : 'Full'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFacing} style={styles.controlButton}>
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.shutterRow}>
        <TouchableOpacity onPress={takePhoto} style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionText: { color: '#333', marginBottom: 16 },
  permissionBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#4A90E2', borderRadius: 8 },
  permissionBtnText: { color: '#fff', fontWeight: '600' },
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  aspectMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
  },
  toggleAspect: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  toggleAspectText: { color: '#fff', fontWeight: '600' },
  shutterRow: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
});

export default CameraScreen;