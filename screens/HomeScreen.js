import React, { useState, useEffect } from 'react' 
 import { 
   View, 
   Text, 
   TouchableOpacity, 
   StyleSheet, 
   Alert 
 } from 'react-native' 
 import { AuthService } from '../lib/AuthService' 
 
 const HomeScreen = ({ navigation }) => { 
   const [user, setUser] = useState(null) 
   const [profile, setProfile] = useState(null) 
   const [loading, setLoading] = useState(true) 
 
   useEffect(() => { 
     loadUser() 
   }, []) 
 
   const loadUser = async () => { 
     try { 
       const currentUser = await AuthService.getCurrentUser() 
       if (currentUser) { 
         setUser(currentUser) 
         
         // Try to load profile 
         const userProfile = await AuthService.getProfile(currentUser.id) 
         setProfile(userProfile) 
       } 
     } catch (error) { 
       console.log('Error loading user:', error.message) 
     } finally { 
       setLoading(false) 
     } 
   } 
 
   const handleSignOut = async () => { 
     try { 
       await AuthService.signOut() 
       navigation.navigate('SignIn') 
     } catch (error) { 
       Alert.alert('Error', error.message) 
     } 
   } 
 
   if (loading) { 
     return ( 
       <View style={styles.container}> 
         <Text style={styles.loadingText}>Loading...</Text> 
       </View> 
     ) 
   } 
 
   return ( 
     <View style={styles.container}> 
       <View style={styles.content}> 
         <Text style={styles.title}>Welcome to SiteSnap!</Text> 
         
         {user && ( 
           <View style={styles.userInfo}> 
             <Text style={styles.email}>Email: {user.email}</Text> 
             {profile && ( 
               <> 
                 {profile.username && <Text style={styles.info}>Username: {profile.username}</Text>} 
                 {profile.full_name && <Text style={styles.info}>Name: {profile.full_name}</Text>} 
                 {profile.role && ( 
                   <Text style={[styles.info, styles.roleText]}> 
                     Role: {profile.role.toUpperCase()} 
                   </Text> 
                 )} 
               </> 
             )} 
           </View> 
         )} 
 
         <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}> 
           <Text style={styles.signOutText}>Sign Out</Text> 
         </TouchableOpacity> 
 
         {profile && (profile.role === 'admin' || profile.role === 'manager') && ( 
           <TouchableOpacity 
             style={styles.adminButton} 
             onPress={() => navigation.navigate('AdminPanel')} 
           > 
             <Text style={styles.adminButtonText}>User Management</Text> 
           </TouchableOpacity> 
         )} 
       </View> 
     </View> 
   ) 
 } 
 
 const styles = StyleSheet.create({ 
   container: { 
     flex: 1, 
     backgroundColor: '#f5f5f5', 
     padding: 20, 
   }, 
   content: { 
     flex: 1, 
     justifyContent: 'center', 
     alignItems: 'center', 
   }, 
   title: { 
     fontSize: 32, 
     fontWeight: 'bold', 
     color: '#333', 
     marginBottom: 30, 
     textAlign: 'center', 
   }, 
   userInfo: { 
     backgroundColor: 'white', 
     padding: 20, 
     borderRadius: 10, 
     marginBottom: 30, 
     minWidth: '80%', 
     shadowColor: '#000', 
     shadowOffset: { 
       width: 0, 
       height: 2, 
     }, 
     shadowOpacity: 0.1, 
     shadowRadius: 3.84, 
     elevation: 5, 
   }, 
   email: { 
     fontSize: 16, 
     fontWeight: 'bold', 
     color: '#333', 
     marginBottom: 5, 
   }, 
   info: { 
     fontSize: 16, 
     color: '#666', 
     marginBottom: 5, 
   }, 
   roleText: { 
     fontWeight: 'bold', 
     color: '#007AFF', 
   }, 
   signOutButton: { 
     backgroundColor: '#FF3B30', 
     paddingVertical: 15, 
     paddingHorizontal: 30, 
     borderRadius: 8, 
     marginBottom: 10, 
   }, 
   signOutText: { 
     color: 'white', 
     fontSize: 16, 
     fontWeight: 'bold', 
   }, 
   adminButton: { 
     backgroundColor: '#34C759', 
     paddingVertical: 15, 
     paddingHorizontal: 30, 
     borderRadius: 8, 
   }, 
   adminButtonText: { 
     color: 'white', 
     fontSize: 16, 
     fontWeight: 'bold', 
     textAlign: 'center', 
   }, 
   loadingText: { 
     fontSize: 18, 
     textAlign: 'center', 
     color: '#666', 
   }, 
 }) 
 
 export default HomeScreen