import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import SitesScreen from '../screens/SitesScreen';
import AdminPanel from '../screens/AdminPanel';
import { AuthService } from '../lib/AuthService';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [role, setRole] = useState('user');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const current = await AuthService.getCurrentUser();
        if (current) {
          const profile = await AuthService.getProfile(current.id);
          if (isMounted) setRole(profile.role || 'user');
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Sites') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Capture') {
            iconName = 'camera';
          } else if (route.name === 'User Management') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Special styling for the center capture button
          if (route.name === 'Capture') {
            return (
              <View style={styles.captureButton}>
                <LinearGradient
                  colors={['#00D4AA', '#00B894']}
                  style={styles.captureGradient}
                >
                  <Ionicons name={iconName} size={28} color="white" />
                </LinearGradient>
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00D4AA',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          // Pin to bottom edge (no floating pill)
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Sites" 
        component={SitesScreen}
        options={{ tabBarLabel: 'Sites' }}
      />
      <Tab.Screen 
        name="Capture" 
        component={SitesScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const parent = navigation.getParent();
            (parent ?? navigation).navigate('UploadPhotos');
          },
        })}
        options={{ 
          tabBarLabel: '',
          tabBarIconStyle: { marginTop: -10 }
        }}
      />
      {role === 'admin' ? (
        <Tab.Screen 
          name="User Management" 
          component={AdminPanel}
          options={{ tabBarLabel: 'User Management' }}
        />
      ) : (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: 'Profile' }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  captureButton: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default TabNavigator;