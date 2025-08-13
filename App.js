import React from 'react' 
 import { NavigationContainer } from '@react-navigation/native' 
 import { createStackNavigator } from '@react-navigation/stack' 
 import { StatusBar } from 'expo-status-bar' 

 import SignInScreen from './screens/SignInScreen' 
import SignUpScreen from './screens/SignUpScreen' 
import TabNavigator from './components/TabNavigator' 
import AdminPanel from './screens/AdminPanel'
import UploadPhotosScreen from './screens/UploadPhotosScreen'
import CameraScreen from './screens/CameraScreen'
import GalleryPickerScreen from './screens/GalleryPickerScreen' 
 
 const Stack = createStackNavigator() 
 
 export default function App() { 
   return ( 
     <NavigationContainer> 
       <StatusBar style="auto" /> 
       <Stack.Navigator 
         initialRouteName="SignIn" 
         screenOptions={{ 
           headerStyle: { 
             backgroundColor: '#007AFF', 
           }, 
           headerTintColor: '#fff', 
           headerTitleStyle: { 
             fontWeight: 'bold', 
           }, 
         }} 
       > 
         <Stack.Screen 
           name="SignIn" 
           component={SignInScreen} 
           options={{ title: 'Sign In' }} 
         /> 
         <Stack.Screen 
           name="SignUp" 
           component={SignUpScreen} 
           options={{ title: 'Create Account' }} 
         /> 
         <Stack.Screen 
           name="Home" 
           component={TabNavigator} 
           options={{ 
             title: 'SiteSnap', 
             headerLeft: () => null, // Remove back button 
           }} 
         /> 
         <Stack.Screen 
          name="AdminPanel" 
          component={AdminPanel} 
          options={{ title: 'User Management' }} 
        /> 
        <Stack.Screen
          name="UploadPhotos"
          component={UploadPhotosScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Gallery"
          component={GalleryPickerScreen}
          options={{ headerShown: false }}
        /> 
       </Stack.Navigator> 
     </NavigationContainer> 
   ) 
 }
