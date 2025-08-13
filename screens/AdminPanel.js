import React, { useState, useEffect } from 'react' 
 import { 
   View, 
   Text, 
   FlatList, 
   TouchableOpacity, 
   StyleSheet, 
   Alert 
 } from 'react-native' 
 import { Picker } from '@react-native-picker/picker' 
 import { AuthService } from '../lib/AuthService' 
 
 const AdminPanel = ({ navigation }) => { 
   const [users, setUsers] = useState([]) 
   const [loading, setLoading] = useState(true) 
   const [userRole, setUserRole] = useState(null) 
 
   useEffect(() => { 
     checkUserRole() 
   }, []) 
 
   const checkUserRole = async () => { 
     try { 
       const currentUser = await AuthService.getCurrentUser() 
       if (currentUser) { 
         const profile = await AuthService.getProfile(currentUser.id) 
         setUserRole(profile.role) 
         
         if (profile.role === 'admin' || profile.role === 'manager') { 
           loadUsers() 
         } else { 
           Alert.alert('Access Denied', 'You do not have permission to access this area.') 
           navigation.goBack() 
         } 
       } 
     } catch (error) { 
       console.log('Error checking user role:', error.message) 
       navigation.goBack() 
     } 
   } 
 
   const loadUsers = async () => { 
     try { 
       const allUsers = await AuthService.getAllUsers() 
       setUsers(allUsers) 
     } catch (error) { 
       Alert.alert('Error', 'Failed to load users: ' + error.message) 
     } finally { 
       setLoading(false) 
     } 
   } 
 
   const updateUserRole = async (userId, newRole) => { 
     if (userRole !== 'admin') { 
       Alert.alert('Permission Denied', 'Only administrators can change user roles.') 
       return 
     } 
 
     try { 
       await AuthService.updateUserRole(userId, newRole) 
       Alert.alert('Success', 'User role updated successfully') 
       loadUsers() // Refresh the list 
     } catch (error) { 
       Alert.alert('Error', 'Failed to update user role: ' + error.message) 
     } 
   } 
 
   const renderUserItem = ({ item }) => ( 
     <View style={styles.userItem}> 
       <View style={styles.userInfo}> 
         <Text style={styles.userName}>{item.full_name || 'No name'}</Text> 
         <Text style={styles.userEmail}>{item.username}</Text> 
         <Text style={styles.currentRole}>Current: {item.role}</Text> 
       </View> 
       
       {userRole === 'admin' && ( 
         <View style={styles.roleSelector}> 
           <Picker 
             selectedValue={item.role} 
             onValueChange={(newRole) => updateUserRole(item.id, newRole)} 
             style={styles.rolePicker} 
           > 
             <Picker.Item label="User" value="user" /> 
             <Picker.Item label="Manager" value="manager" /> 
             <Picker.Item label="Admin" value="admin" /> 
           </Picker> 
         </View> 
       )} 
     </View> 
   ) 
 
   if (loading) { 
     return ( 
       <View style={styles.container}> 
         <Text style={styles.loadingText}>Loading users...</Text> 
       </View> 
     ) 
   } 
 
   return ( 
     <View style={styles.container}> 
       <Text style={styles.title}>User Management</Text> 
       <Text style={styles.subtitle}> 
         {userRole === 'admin' ? 'You can view and modify user roles' : 'You can view users (Admin role required to modify)'} 
       </Text> 
       
       <FlatList 
         data={users} 
         keyExtractor={(item) => item.id} 
         renderItem={renderUserItem} 
         style={styles.userList} 
       /> 
     </View> 
   ) 
 } 
 
 const styles = StyleSheet.create({ 
   container: { 
     flex: 1, 
     backgroundColor: '#f5f5f5', 
     padding: 20, 
   }, 
   title: { 
     fontSize: 24, 
     fontWeight: 'bold', 
     color: '#333', 
     marginBottom: 10, 
     textAlign: 'center', 
   }, 
   subtitle: { 
     fontSize: 14, 
     color: '#666', 
     marginBottom: 20, 
     textAlign: 'center', 
   }, 
   userList: { 
     flex: 1, 
   }, 
   userItem: { 
     backgroundColor: 'white', 
     padding: 15, 
     marginBottom: 10, 
     borderRadius: 8, 
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     alignItems: 'center', 
     shadowColor: '#000', 
     shadowOffset: { 
       width: 0, 
       height: 1, 
     }, 
     shadowOpacity: 0.1, 
     shadowRadius: 2, 
     elevation: 2, 
   }, 
   userInfo: { 
     flex: 1, 
   }, 
   userName: { 
     fontSize: 16, 
     fontWeight: 'bold', 
     color: '#333', 
   }, 
   userEmail: { 
     fontSize: 14, 
     color: '#666', 
     marginTop: 2, 
   }, 
   currentRole: { 
     fontSize: 12, 
     color: '#007AFF', 
     marginTop: 2, 
     fontWeight: 'bold', 
   }, 
   roleSelector: { 
     width: 120, 
   }, 
   rolePicker: { 
     height: 40, 
   }, 
   loadingText: { 
     fontSize: 18, 
     textAlign: 'center', 
     color: '#666', 
     marginTop: 50, 
   }, 
 }) 
 
 export default AdminPanel