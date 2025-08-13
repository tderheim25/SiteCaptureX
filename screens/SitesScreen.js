import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Modal, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { AuthService } from '../lib/AuthService'

const StatusBadge = ({ status }) => {
  const { label, color, bg } = useMemo(() => {
    switch (status) {
      case 'active':
        return { label: 'active', color: '#27ae60', bg: 'rgba(39, 174, 96, 0.12)' }
      case 'completed':
        return { label: 'completed', color: '#6c63ff', bg: 'rgba(108, 99, 255, 0.12)' }
      case 'on_hold':
        return { label: 'on hold', color: '#f39c12', bg: 'rgba(243, 156, 18, 0.12)' }
      default:
        return { label: status || 'active', color: '#27ae60', bg: 'rgba(39, 174, 96, 0.12)' }
    }
  }, [status])

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}> 
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  )
}

const SitesScreen = ({ navigation }) => {
  const [sites, setSites] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newSite, setNewSite] = useState({ name: '', address: '', status: 'active', project_code: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const list = await AuthService.getSites()
      setSites(list)
      setFiltered(list)
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }

  const onSearch = (q) => {
    setSearch(q)
    if (!q.trim()) {
      setFiltered(sites)
      return
    }
    const lower = q.toLowerCase()
    setFiltered(
      sites.filter(s =>
        (s.name || '').toLowerCase().includes(lower) ||
        (s.address || '').toLowerCase().includes(lower) ||
        (s.project_code || '').toLowerCase().includes(lower) ||
        (s.status || '').toLowerCase().includes(lower)
      )
    )
  }

  const openAdd = () => {
    setNewSite({ name: '', address: '', status: 'active', project_code: '' })
    setIsAddOpen(true)
  }

  const saveSite = async () => {
    if (!newSite.name.trim()) {
      Alert.alert('Validation', 'Please enter a site name')
      return
    }
    try {
      setSaving(true)
      const added = await AuthService.addSite(newSite)
      setIsAddOpen(false)
      setNewSite({ name: '', address: '', status: 'active', project_code: '' })
      // Optimistically prepend new item
      setSites(prev => [added, ...prev])
      onSearch(search)
    } catch (e) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.siteCard}>
      <View style={styles.siteHeader}>
        <Text style={styles.siteName}>{item.name}</Text>
        <StatusBadge status={item.status} />
      </View>
      {!!item.address && (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.rowText}>{item.address}</Text>
        </View>
      )}
      {!!item.project_code && (
        <View style={[styles.row, styles.codeRow]}>
          <Text style={styles.codeText}>{item.project_code}</Text>
        </View>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewButton} onPress={() => { /* placeholder: navigate to details later */ }}>
          <Text style={styles.viewButtonText}>View Site</Text>
          <Ionicons name="open-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.title}>Job Sites</Text>
        <Text style={styles.subtitle}>Manage photos and documentation for all your projects</Text>
        <TouchableOpacity style={styles.newSiteButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newSiteText}>New Site</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sites by name or code"
          value={search}
          onChangeText={onSearch}
          placeholderTextColor="#999"
        />
        {!!search && (
          <TouchableOpacity onPress={() => onSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        style={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No sites yet. Tap New Site to add your first project.</Text>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSites(true)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filtered.length === 0 ? { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 } : { paddingHorizontal: 20, paddingBottom: 40 }}
      />

      {/* Floating add button inside the tab */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <LinearGradient colors={["#00D4AA", "#00B894"]} style={styles.fabGradient}>
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isAddOpen} transparent animationType="fade" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Site</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Site Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Riverside Apartments"
                value={newSite.name}
                onChangeText={(t) => setNewSite(s => ({ ...s, name: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 123 Main St, Downtown"
                value={newSite.address}
                onChangeText={(t) => setNewSite(s => ({ ...s, address: t }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Project Code (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. RA-2024-002"
                value={newSite.project_code}
                onChangeText={(t) => setNewSite(s => ({ ...s, project_code: t }))}
              />
            </View>

            {/* Simple status selector */}
            <View style={styles.statusRow}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {['active', 'completed', 'on_hold'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusOption, newSite.status === s && styles.statusOptionActive]}
                    onPress={() => setNewSite(prev => ({ ...prev, status: s }))}
                  >
                    <Text style={[styles.statusOptionText, newSite.status === s && styles.statusOptionTextActive]}>
                      {s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddOpen(false)} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSite} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6, textAlign: 'left' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  newSiteButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newSiteText: { color: '#fff', fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#333' },
  clearButton: { padding: 5 },

  list: { flex: 1 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 24, fontSize: 16 },

  siteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  siteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  siteName: { fontSize: 18, fontWeight: '800', color: '#2d3748' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  rowText: { color: '#666' },
  codeRow: { marginTop: 8 },
  codeText: { backgroundColor: '#eef2f7', color: '#556', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700' },
  cardActions: { marginTop: 14, flexDirection: 'row' },
  viewButton: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  viewButtonText: { color: '#fff', fontWeight: '700' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },

  fab: { position: 'absolute', right: 22, bottom: 32 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#111827' },
  inputGroup: { marginTop: 10 },
  inputLabel: { fontSize: 14, color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  statusRow: { marginTop: 12 },
  statusOptions: { flexDirection: 'row', gap: 8 },
  statusOption: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EEF2F7' },
  statusOptionActive: { backgroundColor: '#D1FAE5' },
  statusOptionText: { color: '#374151', fontWeight: '600' },
  statusOptionTextActive: { color: '#065F46' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { backgroundColor: '#f0f2f5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  cancelText: { color: '#333', fontWeight: '700' },
  saveBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: '800' },
})

export default SitesScreen