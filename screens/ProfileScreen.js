import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../lib/AuthService';

const colors = {
  text: '#111827',
  card: '#FFFFFF',
  input: '#F5F5F5',
  muted: '#8E8E93',
  primary: '#00D4AA',
  secondary: '#00B894',
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (user) {
          const p = await AuthService.getProfile(user.id);
          if (mounted) setProfile(p);
        }
      } catch (e) {
        console.warn('Failed to load profile', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      // Update password via Supabase auth
      await AuthService.updatePassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8, color: colors.text }}>
        Profile
      </Text>
      {profile && (
        <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: colors.muted, marginBottom: 4 }}>Email</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{profile.email}</Text>
          {profile.full_name ? (
            <>
              <Text style={{ color: colors.muted, marginTop: 12, marginBottom: 4 }}>Name</Text>
              <Text style={{ color: colors.text }}>{profile.full_name}</Text>
            </>
          ) : null}
        </View>
      )}

      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: colors.text }}>
        Change Password
      </Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.muted, marginBottom: 6 }}>Current Password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={{ backgroundColor: colors.input, color: colors.text, borderRadius: 8, padding: 12 }}
          />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.muted, marginBottom: 6 }}>New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={{ backgroundColor: colors.input, color: colors.text, borderRadius: 8, padding: 12 }}
          />
        </View>

        <TouchableOpacity disabled={loading} onPress={onChangePassword}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={{ padding: 14, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Updating...' : 'Update Password'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onLogout} style={{ marginTop: 24 }}>
        <View style={{ backgroundColor: '#ef4444', padding: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Ionicons name="log-out-outline" size={18} color="white" style={{ marginRight: 6 }} />
          <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Signing out...' : 'Logout'}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}