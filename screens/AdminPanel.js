import React, { useState, useEffect } from 'react' 
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput, 
  RefreshControl, 
  StatusBar, 
  Modal 
} from 'react-native' 
import { Ionicons } from '@expo/vector-icons' 
import { LinearGradient } from 'expo-linear-gradient' 
import { AuthService } from '../lib/AuthService' 
 
 const AdminPanel = ({ navigation }) => { 
   const [users, setUsers] = useState([]) 
   const [filteredUsers, setFilteredUsers] = useState([]) 
   const [loading, setLoading] = useState(true) 
   const [refreshing, setRefreshing] = useState(false) 
   const [userRole, setUserRole] = useState(null) 
   const [searchQuery, setSearchQuery] = useState('') 
   const [roleMenuUserId, setRoleMenuUserId] = useState(null)
 
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
 
   const loadUsers = async (isRefresh = false) => { 
     try { 
       if (isRefresh) setRefreshing(true) 
       const allUsers = await AuthService.getAllUsers() 
       setUsers(allUsers) 
       setFilteredUsers(allUsers) 
     } catch (error) { 
       Alert.alert('Error', 'Failed to load users: ' + error.message) 
     } finally { 
       setLoading(false) 
       if (isRefresh) setRefreshing(false) 
     } 
   } 

   const handleSearch = (query) => { 
     setSearchQuery(query) 
     if (query.trim() === '') { 
       setFilteredUsers(users) 
     } else { 
       const filtered = users.filter(user => 
         (user.full_name?.toLowerCase().includes(query.toLowerCase())) || 
         (user.username?.toLowerCase().includes(query.toLowerCase())) || 
         (user.role?.toLowerCase().includes(query.toLowerCase())) 
       ) 
       setFilteredUsers(filtered) 
     } 
   } 

   const onRefresh = () => { 
     loadUsers(true) 
   } 
 
   const updateUserRole = async (userId, newRole) => { 
     if (userRole !== 'admin') { 
       Alert.alert('Permission Denied', 'Only administrators can change user roles.') 
       return 
     } 
 
     try { 
       const result = await AuthService.updateUserRole(userId, newRole) 
       console.log('Role update result:', result)
       Alert.alert('Success', 'User role updated successfully') 
       loadUsers() // Refresh the list 
     } catch (error) { 
       console.error('Role update error:', error.message)
       Alert.alert('Error', 'Failed to update user role: ' + error.message) 
     } 
   } 

   const openRoleMenu = (userId) => setRoleMenuUserId(userId)
   const closeRoleMenu = () => setRoleMenuUserId(null)
   const getRoleColor = (role) => { 
     switch (role) { 
       case 'admin': return '#FF6B6B' 
       case 'manager': return '#4ECDC4' 
       case 'user': return '#45B7D1' 
       default: return '#95A5A6' 
     } 
   } 

   const getRoleIcon = (role) => { 
     switch (role) { 
       case 'admin': return 'shield-checkmark' 
       case 'manager': return 'people' 
       case 'user': return 'person' 
       default: return 'help-circle' 
     } 
   } 

   const renderUserItem = ({ item }) => ( 
     <View style={styles.userItem}> 
       <View style={styles.userAvatar}> 
         <LinearGradient 
           colors={[getRoleColor(item.role), getRoleColor(item.role) + '80']} 
           style={styles.avatarGradient} 
         > 
           <Ionicons name={getRoleIcon(item.role)} size={24} color="white" /> 
         </LinearGradient> 
       </View> 
       
       <View style={styles.userInfo}> 
         <Text style={styles.userName}>{item.full_name || item.username || 'No name'}</Text> 
         <Text style={styles.userEmail}>{item.username}</Text> 
         <View style={styles.roleContainer}> 
           <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}> 
             <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}> 
               {item.role.toUpperCase()} 
             </Text> 
           </View> 
         </View> 
       </View> 
       
       {userRole === 'admin' && ( 
        <TouchableOpacity style={styles.roleDropdownButton} onPress={() => openRoleMenu(item.id)}> 
          <Text style={styles.roleDropdownText}>Change</Text> 
          <Ionicons name="chevron-down" size={18} color="#333" /> 
        </TouchableOpacity> 
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
       <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" /> 
       
       <LinearGradient 
         colors={['#667eea', '#764ba2']} 
         style={styles.header} 
       > 
         <Text style={styles.title}>User Management</Text> 
         <Text style={styles.subtitle}> 
           {userRole === 'admin' ? 'Manage user roles and permissions' : 'View user directory'} 
         </Text> 
       </LinearGradient> 
       
       <View style={styles.searchContainer}> 
         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} /> 
         <TextInput 
           style={styles.searchInput} 
           placeholder="Search users by name, email, or role..." 
           value={searchQuery} 
           onChangeText={handleSearch} 
           placeholderTextColor="#999" 
         /> 
         {searchQuery.length > 0 && ( 
           <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}> 
             <Ionicons name="close-circle" size={20} color="#666" /> 
           </TouchableOpacity> 
         )} 
       </View> 
       
       <View style={styles.statsContainer}> 
         <Text style={styles.statsText}> 
           {filteredUsers.length} of {users.length} users 
         </Text> 
       </View> 
       
       <FlatList 
         data={filteredUsers} 
         keyExtractor={(item) => item.id} 
         renderItem={renderUserItem} 
         style={styles.userList} 
         refreshControl={ 
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> 
         } 
         showsVerticalScrollIndicator={false} 
       /> 

      {/* Role selection modal */}
      <Modal visible={!!roleMenuUserId} transparent animationType="fade" onRequestClose={closeRoleMenu}>
        <View style={styles.modalBackdrop}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Set Role</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => { updateUserRole(roleMenuUserId, 'user'); closeRoleMenu() }}>
              <Ionicons name="person" size={18} color="#45B7D1" />
              <Text style={styles.menuItemText}>User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { updateUserRole(roleMenuUserId, 'manager'); closeRoleMenu() }}>
              <Ionicons name="people" size={18} color="#4ECDC4" />
              <Text style={styles.menuItemText}>Manager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { updateUserRole(roleMenuUserId, 'admin'); closeRoleMenu() }}>
              <Ionicons name="shield-checkmark" size={18} color="#FF6B6B" />
              <Text style={styles.menuItemText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeRoleMenu} style={styles.menuCloseButton}>
              <Text style={styles.menuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
     </View> 
   ) 
 } 
 
 const styles = StyleSheet.create({ 
   container: { 
     flex: 1, 
     backgroundColor: '#f8f9fa', 
   }, 
   header: { 
     paddingTop: 60, 
     paddingBottom: 30, 
     paddingHorizontal: 20, 
     borderBottomLeftRadius: 25, 
     borderBottomRightRadius: 25, 
   }, 
   title: { 
     fontSize: 28, 
     fontWeight: 'bold', 
     color: 'white', 
     marginBottom: 8, 
     textAlign: 'center', 
   }, 
   subtitle: { 
     fontSize: 16, 
     color: 'rgba(255, 255, 255, 0.9)', 
     textAlign: 'center', 
   }, 
   searchContainer: { 
     flexDirection: 'row', 
     alignItems: 'center', 
     backgroundColor: 'white', 
     marginHorizontal: 20, 
     marginTop: 20, 
     marginBottom: 10, 
     borderRadius: 15, 
     paddingHorizontal: 15, 
     shadowColor: '#000', 
     shadowOffset: { width: 0, height: 2 }, 
     shadowOpacity: 0.1, 
     shadowRadius: 8, 
     elevation: 3, 
   }, 
   searchIcon: { 
     marginRight: 10, 
   }, 
   searchInput: { 
     flex: 1, 
     height: 50, 
     fontSize: 16, 
     color: '#333', 
   }, 
   clearButton: { 
     padding: 5, 
   }, 
   statsContainer: { 
     paddingHorizontal: 20, 
     marginBottom: 15, 
   }, 
   statsText: { 
     fontSize: 14, 
     color: '#666', 
     fontWeight: '500', 
   }, 
   userList: { 
     flex: 1, 
     paddingHorizontal: 20, 
   }, 
   userItem: { 
     backgroundColor: 'white', 
     padding: 20, 
     marginBottom: 15, 
     borderRadius: 15, 
     flexDirection: 'row', 
     alignItems: 'center', 
     shadowColor: '#000', 
     shadowOffset: { width: 0, height: 3 }, 
     shadowOpacity: 0.1, 
     shadowRadius: 10, 
     elevation: 4, 
   }, 
   userAvatar: { 
     marginRight: 15, 
   }, 
   avatarGradient: { 
     width: 50, 
     height: 50, 
     borderRadius: 25, 
     justifyContent: 'center', 
     alignItems: 'center', 
   }, 
   userInfo: { 
     flex: 1, 
   }, 
   userName: { 
     fontSize: 18, 
     fontWeight: 'bold', 
     color: '#333', 
     marginBottom: 4, 
   }, 
   userEmail: { 
     fontSize: 14, 
     color: '#666', 
     marginBottom: 8, 
   }, 
   roleContainer: { 
     flexDirection: 'row', 
   }, 
   roleBadge: { 
     paddingHorizontal: 12, 
     paddingVertical: 4, 
     borderRadius: 12, 
   }, 
   roleText: { 
     fontSize: 12, 
     fontWeight: 'bold', 
   }, 
   roleSelector: { 
     width: 120, 
     backgroundColor: '#f8f9fa', 
     borderRadius: 10, 
   }, 
   rolePicker: { 
     height: 40, 
   }, 
   roleDropdownButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     height: 36,
     backgroundColor: '#f0f2f5',
     borderRadius: 10,
   },
   roleDropdownText: {
     marginRight: 6,
     color: '#333',
     fontWeight: '600',
   },
   modalBackdrop: {
     flex: 1,
     backgroundColor: 'rgba(0,0,0,0.3)',
     justifyContent: 'center',
     alignItems: 'center',
     padding: 24,
   },
   menuContainer: {
     width: '100%',
     maxWidth: 360,
     backgroundColor: 'white',
     borderRadius: 16,
     paddingVertical: 12,
     paddingHorizontal: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 12,
     elevation: 6,
   },
   menuTitle: {
     fontSize: 16,
     fontWeight: '700',
     color: '#333',
     marginBottom: 8,
   },
   menuItem: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 10,
     gap: 8,
   },
   menuItemText: {
     fontSize: 16,
     color: '#333',
     marginLeft: 10,
   },
   menuCloseButton: {
     marginTop: 6,
     alignSelf: 'flex-end',
     paddingVertical: 6,
     paddingHorizontal: 10,
     borderRadius: 8,
     backgroundColor: '#f0f2f5',
   },
   menuCloseText: {
     color: '#333',
     fontWeight: '600',
   },
   loadingText: { 
     fontSize: 18, 
     textAlign: 'center', 
     color: '#666', 
     marginTop: 50, 
   }, 
 }) 
 
 export default AdminPanel