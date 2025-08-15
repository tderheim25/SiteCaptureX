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
  const [editVisible, setEditVisible] = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Enhanced filtering and selection
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [bulkActionVisible, setBulkActionVisible] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
 
   useEffect(() => { 
     checkUserRole() 
   }, []) 
 
   const checkUserRole = async () => { 
     try { 
       const currentUser = await AuthService.getCurrentUser() 
       if (currentUser) { 
         const profile = await AuthService.getProfile(currentUser.id) 
         setUserRole(profile.role) 
         
         // Only admins can access User Management
         if (profile.role === 'admin') { 
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
       applyFilters(allUsers)
     } catch (error) { 
       Alert.alert('Error', 'Failed to load users: ' + error.message) 
     } finally { 
       setLoading(false) 
       if (isRefresh) setRefreshing(false) 
     } 
   } 

   const applyFilters = (list, query = searchQuery) => {
     let result = [...list]
     const q = (query || '').trim().toLowerCase()
     if (q) {
       result = result.filter(user =>
         (user.full_name?.toLowerCase().includes(q)) ||
         (user.username?.toLowerCase().includes(q)) ||
         (user.email?.toLowerCase().includes(q)) ||
         (user.role?.toLowerCase().includes(q))
       )
     }
     if (filterRole !== 'all') {
       result = result.filter(u => (u.role || 'user') === filterRole)
     }
     if (filterStatus !== 'all') {
       result = result.filter(u => (u.status || 'active') === filterStatus)
     }
     result.sort((a,b) => {
       const dir = sortOrder === 'asc' ? 1 : -1
       if (sortBy === 'name') {
         const an = (a.full_name || a.username || '').toLowerCase()
         const bn = (b.full_name || b.username || '').toLowerCase()
         return an.localeCompare(bn) * dir
       }
       if (sortBy === 'role') {
         const ar = (a.role || 'user').toLowerCase()
         const br = (b.role || 'user').toLowerCase()
         return ar.localeCompare(br) * dir
       }
       if (sortBy === 'created') {
         const ad = new Date(a.created_at || 0).getTime()
         const bd = new Date(b.created_at || 0).getTime()
         return (ad - bd) * dir
       }
       return 0
     })
     setFilteredUsers(result)
   }

   const handleSearch = (query) => {
     setSearchQuery(query)
     applyFilters(users, query)
   } 

   // Re-apply filters when dependencies change
   useEffect(() => {
     applyFilters(users)
   }, [users, filterRole, filterStatus, sortBy, sortOrder])

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

   // Admin edit helpers
   const openEdit = (user) => {
     setEditUserId(user.id)
     setEditFullName(user.full_name || '')
     setEditUsername(user.username || '')
     setEditEmail(user.email || '')
     setEditVisible(true)
   }

   const closeEdit = () => {
     setEditVisible(false)
     setEditUserId(null)
     setEditFullName('')
     setEditUsername('')
     setEditEmail('')
   }

   const saveEdit = async () => {
     if (!editUserId) return
     try {
       setSaving(true)
       const payload = { full_name: editFullName, username: editUsername }
       await AuthService.updateUserProfile(editUserId, payload)
       Alert.alert('Success', 'User details updated successfully')
       closeEdit()
       loadUsers()
     } catch (e) {
       Alert.alert('Error', e.message || 'Failed to update user')
     } finally {
       setSaving(false)
     }
   }

   const sendPasswordReset = async () => {
     if (!editEmail) {
       Alert.alert('Email missing', 'This user does not have an email address on file.')
       return
     }
     try {
       setSaving(true)
       await AuthService.sendPasswordReset(editEmail)
       Alert.alert('Password reset', 'Password reset email sent to ' + editEmail)
     } catch (e) {
       Alert.alert('Error', e.message || 'Failed to send reset email')
     } finally {
       setSaving(false)
     }
   }

   // Selection helpers
   const toggleSelectionMode = () => {
     setSelectionMode(prev => !prev)
     if (selectionMode) {
       // leaving selection mode clears selection
       setSelectedUsers(new Set())
     }
   }

   const toggleSelect = (userId) => {
     setSelectedUsers(prev => {
       const next = new Set(prev)
       if (next.has(userId)) next.delete(userId)
       else next.add(userId)
       return next
     })
   }

   const isSelected = (userId) => selectedUsers.has(userId)

   const clearSelection = () => setSelectedUsers(new Set())
   const selectAllVisible = () => setSelectedUsers(new Set(filteredUsers.map(u => u.id)))

   // Status toggle
   const handleToggleStatus = async (user) => {
     if (userRole !== 'admin') {
       Alert.alert('Permission Denied', 'Only administrators can change user status.')
       return
     }
     try {
       const nextActive = (user.status || 'active') !== 'active' // if disabled -> enable, else disable
       await AuthService.toggleUserStatus(user.id, nextActive)
       Alert.alert('Success', `User ${nextActive ? 'enabled' : 'disabled'} successfully`)
       loadUsers()
     } catch (e) {
       Alert.alert('Error', e.message || 'Failed to update status')
     }
   }

   const handleApprove = async (userId) => {
     try {
       await AuthService.setUserStatus(userId, 'active');
       Alert.alert('Success', 'User approved successfully');
       loadUsers();
     } catch (e) {
       Alert.alert('Error', e.message || 'Failed to approve user');
     }
   };

   const handleReject = async (userId) => {
     try {
       await AuthService.setUserStatus(userId, 'disabled');
       Alert.alert('Success', 'User rejected successfully');
       loadUsers();
     } catch (e) {
       Alert.alert('Error', e.message || 'Failed to reject user');
     }
   };
   const handleBulkRole = async (newRole) => {
     if (selectedUsers.size === 0) return
     try {
       await AuthService.bulkUpdateRoles(Array.from(selectedUsers), newRole)
       Alert.alert('Success', `Updated role to ${newRole} for ${selectedUsers.size} user(s).`)
       clearSelection()
       loadUsers()
     } catch (e) {
       Alert.alert('Error', e.message || 'Bulk role update failed')
     }
   }

   const handleBulkStatus = async (active) => {
     if (selectedUsers.size === 0) return
     try {
       const ids = Array.from(selectedUsers)
       for (const id of ids) {
         await AuthService.toggleUserStatus(id, active)
       }
       Alert.alert('Success', `${active ? 'Enabled' : 'Disabled'} ${ids.length} user(s).`)
       clearSelection()
       loadUsers()
     } catch (e) {
       Alert.alert('Error', e.message || 'Bulk status update failed')
     }
   }
 
   const renderUser = ({ item }) => ( 
     <View style={styles.userItem}> 
       {selectionMode && (
         <TouchableOpacity
           onPress={() => toggleSelect(item.id)}
           style={[styles.checkbox, isSelected(item.id) && styles.checkboxChecked]}
         >
           {isSelected(item.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
         </TouchableOpacity>
       )}
       <View style={styles.userAvatar}> 
         <LinearGradient 
           colors={[getRoleColor(item.role), '#FFF']} 
           style={styles.avatarGradient} 
         > 
           <Ionicons name={getRoleIcon(item.role)} size={24} color="white" /> 
         </LinearGradient> 
       </View> 
       <View style={styles.userInfo}> 
         <Text style={styles.userName}>{item.full_name || item.username || 'Unknown User'}</Text> 
         <Text style={styles.userEmail}>{item.email || 'N/A'}</Text> 
         <View style={[styles.roleContainer, { alignItems: 'center' }]}> 
           <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}> 
             <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}> 
               {item.role?.toUpperCase() || 'USER'}
             </Text> 
           </View> 
           <View style={[styles.statusBadge, getStatusStyle(item.status || 'active')]}> 
             <Ionicons name={getStatusIcon(item.status || 'active')} size={14} color={getStatusColor(item.status || 'active')} />
             <Text style={{ marginLeft: 6, color: getStatusColor(item.status || 'active'), fontWeight: '600' }}>
               {getStatusText(item.status || 'active')}
             </Text>
           </View>
         </View> 
       </View> 
       {userRole === 'admin' && item.status === 'pending' ? (
         <View style={styles.userActions}>
           <TouchableOpacity onPress={() => handleApprove(item.id)} style={styles.actionButton}>
             <Ionicons name="checkmark-outline" size={20} color="#16a34a" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => handleReject(item.id)} style={styles.actionButton}>
             <Ionicons name="close-outline" size={20} color="#dc2626" />
           </TouchableOpacity>
         </View>
       ) : (
         <View style={styles.userActions}>
           <TouchableOpacity
             onPress={() => openRoleMenu(item.id)}
             style={styles.actionButton}
           >
             <Ionicons name="key-outline" size={20} color="#333" />
           </TouchableOpacity>
           <TouchableOpacity
             onPress={() => openEdit(item)}
             style={styles.actionButton}
           >
             <Ionicons name="create-outline" size={20} color="#333" />
           </TouchableOpacity>
           <TouchableOpacity
             onPress={() => handleToggleStatus(item)}
             style={styles.actionButton}
           >
             <Ionicons name={(item.status || 'active') === 'active' ? 'lock-closed-outline' : 'lock-open-outline'} size={20} color="#333" />
           </TouchableOpacity>
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
       <StatusBar barStyle="light-content" /> 
       <LinearGradient 
         colors={['#667eea', '#764ba2']} 
         style={styles.header} 
       > 
         <Text style={styles.title}>User Management</Text> 
         <Text style={styles.subtitle}>Manage user roles and permissions</Text> 
       </LinearGradient> 
 
       <View style={styles.searchContainer}> 
         <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} /> 
         <TextInput 
           style={styles.searchInput} 
           placeholder="Search users..." 
           value={searchQuery} 
           onChangeText={handleSearch} 
         /> 
         {searchQuery.length > 0 && ( 
           <TouchableOpacity 
             onPress={() => handleSearch('')} 
             style={styles.clearButton} 
           > 
             <Ionicons name="close-circle" size={20} color="#666" /> 
           </TouchableOpacity> 
         )} 
       </View> 
 
       <View style={styles.statsContainer}> 
         <Text style={styles.statsText}> 
           Showing {filteredUsers.length} of {users.length} users 
         </Text> 
       </View> 
 
       {/* Filters & Sorting */}
       <View style={styles.filterBar}>
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           <Text style={styles.filterLabel}>Role:</Text>
           {['all','admin','manager','user'].map(r => (
             <TouchableOpacity key={r} style={[styles.pill, filterRole === r && styles.pillActive]} onPress={() => setFilterRole(r)}>
               <Text style={[styles.pillText, filterRole === r && styles.pillTextActive]}>{r[0].toUpperCase()+r.slice(1)}</Text>
             </TouchableOpacity>
           ))}
         </View>
         <View style={{ height: 10 }} />
         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
           <Text style={styles.filterLabel}>Status:</Text>
           {['all','active','pending','disabled'].map(s => (
             <TouchableOpacity key={s} style={[styles.pill, filterStatus === s && styles.pillActive]} onPress={() => setFilterStatus(s)}>
               <Text style={[styles.pillText, filterStatus === s && styles.pillTextActive]}>{s[0].toUpperCase()+s.slice(1)}</Text>
             </TouchableOpacity>
           ))}
         </View>
         <View style={{ height: 10 }} />
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={styles.filterLabel}>Sort:</Text>
             {[
               { key: 'name', label: 'Name' },
               { key: 'role', label: 'Role' },
               { key: 'created', label: 'Created' },
             ].map(opt => (
               <TouchableOpacity key={opt.key} style={[styles.pill, sortBy === opt.key && styles.pillActive]} onPress={() => setSortBy(opt.key)}>
                 <Text style={[styles.pillText, sortBy === opt.key && styles.pillTextActive]}>{opt.label}</Text>
               </TouchableOpacity>
             ))}
             <TouchableOpacity style={[styles.pill, styles.orderPill]} onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
               <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={sortOrder === 'asc' ? '#00B894' : '#00B894'} />
               <Text style={[styles.pillText, styles.orderPillText]}>{sortOrder.toUpperCase()}</Text>
             </TouchableOpacity>
           </View>
           {userRole === 'admin' && (
             <TouchableOpacity style={[styles.pill, selectionMode && styles.pillActive]} onPress={toggleSelectionMode}>
               <Ionicons name={selectionMode ? 'checkbox' : 'square-outline'} size={14} color={selectionMode ? '#fff' : '#00B894'} />
               <Text style={[styles.pillText, selectionMode && styles.pillTextActive]}>{selectionMode ? 'Done' : 'Select'}</Text>
             </TouchableOpacity>
           )}
         </View>
       </View>
 
       <FlatList 
         style={styles.userList} 
         data={filteredUsers} 
         renderItem={renderUser} 
         keyExtractor={(item) => item.id} 
         refreshControl={ 
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> 
         } 
         showsVerticalScrollIndicator={false} 
       /> 

       {/* Bulk action bar */}
       {selectionMode && selectedUsers.size > 0 && (
         <View style={styles.bulkBar}>
           <Text style={styles.bulkInfo}>{selectedUsers.size} selected</Text>
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
             <TouchableOpacity style={[styles.bulkButton]} onPress={selectAllVisible}>
               <Text style={styles.bulkButtonText}>Select All</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={() => handleBulkStatus(true)}>
               <Text style={styles.bulkButtonText}>Enable</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={() => handleBulkStatus(false)}>
               <Text style={styles.bulkButtonText}>Disable</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={() => handleBulkRole('admin')}>
               <Text style={styles.bulkButtonText}>Make Admin</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={() => handleBulkRole('manager')}>
               <Text style={styles.bulkButtonText}>Make Manager</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={() => handleBulkRole('user')}>
               <Text style={styles.bulkButtonText}>Make User</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.bulkButton]} onPress={clearSelection}>
               <Text style={styles.bulkButtonText}>Clear</Text>
             </TouchableOpacity>
           </View>
         </View>
       )}

       {/* Role menu modal */}
       <Modal
         visible={roleMenuUserId !== null}
         transparent={true}
         animationType="fade"
         onRequestClose={closeRoleMenu}
       >
         <TouchableOpacity
           style={styles.modalBackdrop}
           activeOpacity={1}
           onPress={closeRoleMenu}
         >
           <View style={styles.menuContainer}>
             <Text style={styles.menuTitle}>Select Role</Text>
             
             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => {
                 updateUserRole(roleMenuUserId, 'user')
                 closeRoleMenu()
               }}
             >
               <Ionicons name="person" size={20} color="#45B7D1" />
               <Text style={styles.menuItemText}>User</Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => {
                 updateUserRole(roleMenuUserId, 'manager')
                 closeRoleMenu()
               }}
             >
               <Ionicons name="people" size={20} color="#4ECDC4" />
               <Text style={styles.menuItemText}>Manager</Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={styles.menuItem}
               onPress={() => {
                 updateUserRole(roleMenuUserId, 'admin')
                 closeRoleMenu()
               }}
             >
               <Ionicons name="shield-checkmark" size={20} color="#FF6B6B" />
               <Text style={styles.menuItemText}>Admin</Text>
             </TouchableOpacity>
             
             <TouchableOpacity
               style={styles.menuCloseButton}
               onPress={closeRoleMenu}
             >
               <Text style={styles.menuCloseText}>Cancel</Text>
             </TouchableOpacity>
           </View>
         </TouchableOpacity>
       </Modal>

       {/* Edit User modal */}
       <Modal
         visible={editVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={closeEdit}
       >
         <TouchableOpacity
           style={styles.modalBackdrop}
           activeOpacity={1}
           onPress={closeEdit}
         >
           <View style={styles.menuContainer}>
             <Text style={styles.menuTitle}>Edit User</Text>
 
             <View style={styles.formRow}>
               <Text style={styles.formLabel}>Full name</Text>
               <TextInput
                 value={editFullName}
                 onChangeText={setEditFullName}
                 placeholder="Full name"
                 style={styles.formInput}
               />
             </View>
             <View style={styles.formRow}>
               <Text style={styles.formLabel}>Username</Text>
               <TextInput
                 value={editUsername}
                 onChangeText={setEditUsername}
                 placeholder="Username"
                 autoCapitalize="none"
                 style={styles.formInput}
               />
             </View>
             <View style={styles.formRow}>
               <Text style={styles.formLabel}>Email</Text>
               <TextInput
                 value={editEmail}
                 editable={false}
                 placeholder="Email (read-only)"
                 style={[styles.formInput, { backgroundColor: '#f5f6f8', color: '#777' }]}
               />
               <Text style={styles.formHelp}>Email is managed by Auth; send a reset to change password.</Text>
             </View>
 
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
               <TouchableOpacity
                 onPress={sendPasswordReset}
                 disabled={saving}
                 style={[styles.primaryButton, { backgroundColor: '#6c5ce7' }]}
               >
                 <Text style={styles.primaryButtonText}>Send Reset Email</Text>
               </TouchableOpacity>
               <View style={{ width: 10 }} />
               <TouchableOpacity
                 onPress={saveEdit}
                 disabled={saving}
                 style={styles.primaryButton}
               >
                 <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
               </TouchableOpacity>
             </View>
 
             <TouchableOpacity
               style={[styles.menuCloseButton, { marginTop: 10 }]
               }
               onPress={closeEdit}
             >
               <Text style={styles.menuCloseText}>Close</Text>
             </TouchableOpacity>
           </View>
         </TouchableOpacity>
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
  filterBar: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  filterLabel: {
    marginRight: 8,
    color: '#444',
    fontWeight: '600',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 28,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#00B894',
  },
  pillText: {
    color: '#00B894',
    fontWeight: '600',
    fontSize: 12,
  },
  pillTextActive: {
    color: '#fff',
  },
  orderPill: {
    paddingHorizontal: 8,
    gap: 6,
  },
  orderPillText: {
    marginLeft: 6,
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
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#00B894',
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
    flexShrink: 1,
    marginRight: 10,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
  },
  statusBadgeDisabled: {
    backgroundColor: '#fef2f2',
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
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
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
  formRow: {
    marginTop: 8,
  },
  formLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  formInput: {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formHelp: {
    marginTop: 6,
    fontSize: 12,
    color: '#777',
  },
  primaryButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#00B894',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  bulkBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bulkInfo: {
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  bulkButton: {
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 8,
  },
  bulkButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingText: { 
    fontSize: 18, 
    textAlign: 'center', 
    color: '#666', 
    marginTop: 50, 
  } 
}) 

// Helper functions for user status display
const getStatusStyle = (status) => {
  switch (status) {
    case 'active': return {};
    case 'pending': return styles.statusBadgePending;
    case 'disabled': return styles.statusBadgeDisabled;
    default: return {};
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return 'checkmark-circle';
    case 'pending': return 'hourglass-outline';
    case 'disabled': return 'close-circle';
    default: return 'checkmark-circle';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return '#16a34a';
    case 'pending': return '#d97706';
    case 'disabled': return '#dc2626';
    default: return '#16a34a';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'disabled': return 'Disabled';
    default: return 'Active';
  }
};
export default AdminPanel;
