import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import SitesScreen from '../screens/SitesScreen';
import AdminPanel from '../screens/AdminPanel';

const Tab = createBottomTabNavigator();

const DarkTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Sites') {
            iconName = focused ? 'globe' : 'globe-outline';
          } else if (route.name === 'Capture') {
            iconName = 'add';
          } else if (route.name === 'User Management') {
            iconName = focused ? 'people' : 'people-outline';
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
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: 'rgba(45, 55, 72, 0.95)', // Dark background
          borderRadius: 25,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          borderTopWidth: 0,
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
      <Tab.Screen 
        name="User Management" 
        component={AdminPanel}
        options={{ tabBarLabel: 'User Management' }}
      />
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

export default DarkTabNavigator;