import React from 'react' 
 import { NavigationContainer } from '@react-navigation/native' 
 import { createStackNavigator } from '@react-navigation/stack' 
 import { StatusBar } from 'expo-status-bar' 
import { TouchableOpacity, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthService } from './lib/AuthService'
 
 import SignInScreen from './screens/SignInScreen' 
import SignUpScreen from './screens/SignUpScreen' 
import TabNavigator from './components/TabNavigator' 
import AdminPanel from './screens/AdminPanel'
import UploadPhotosScreen from './screens/UploadPhotosScreen'
import CameraScreen from './screens/CameraScreen'
import SiteDetailsScreen from './screens/SiteDetailsScreen';
import GalleryPickerScreen from './screens/GalleryPickerScreen' 
import WaitingApprovalScreen from './screens/WaitingApprovalScreen'
 
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
 
          options={({ navigation }) => ({
            title: 'SiteSnap',
            headerLeft: () => null, // Remove back button
            headerRight: () => (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await AuthService.signOut()
                  } catch (e) {
                    // ignore sign out error, still navigate to sign in
                  } finally {
                    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                accessibilityLabel="Log out"
                testID="header-logout-button"
              >
                <Ionicons name="log-out-outline" size={22} color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '600' }}>Logout</Text>
              </TouchableOpacity>
            ),
          })} 
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
        <Stack.Screen
          name="SiteDetails"
          component={SiteDetailsScreen}
          options={{ title: 'Site Details' }}
        /> 
        <Stack.Screen 
          name="WaitingApproval" 
          component={WaitingApprovalScreen} 
          options={{ title: 'Waiting for Approval', headerShown: false }} 
        />
       </Stack.Navigator> 
     </NavigationContainer> 
   ) 
 }
