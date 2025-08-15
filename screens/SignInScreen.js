import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '../lib/AuthService';

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      const { user, session } = await AuthService.signIn(email, password);
      if (user && session) {
        const profile = await AuthService.getProfile(user.id);
        if (profile.status === 'pending') {
          navigation.navigate('WaitingApproval');
        } else if (profile.status === 'disabled') {
          Alert.alert('Account Disabled', 'Your account has been disabled. Please contact an administrator.');
        } else {
          navigation.navigate('Home');
        }
      } else {
        Alert.alert('Sign In Error', 'Invalid credentials.');
      }
    } catch (error) {
      Alert.alert('Sign In Error', error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://ryuzzetivvijkiribkzt.supabase.co/storage/v1/object/public/SiteCaptureXLogo/SiteCaptureX%20logo%20cropped.png' }}
        style={styles.logo}
      />
      <Text style={styles.poweredBy}>Powered by Derheim Inc</Text>
      <Text style={styles.welcome}>Welcome back!</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <LinearGradient colors={['#007AFF', '#005BB5']} style={styles.gradient}>
          <Text style={styles.buttonText}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signup}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 50,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signup: {
    textAlign: 'center',
    marginTop: 24,
    color: '#007AFF',
    fontSize: 16,
  },
  logo: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 8,
  },
  poweredBy: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
});

export default SignInScreen;