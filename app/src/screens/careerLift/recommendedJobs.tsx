import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  FlatList
} from 'react-native'
import { MaterialIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useJobTrackerStore, JobEntry } from '../../store/jobTrackerStore'
import { CLTheme } from './theme'
import { useNavigation } from '@react-navigation/native'
import { useUserProfileStore } from '../../store/userProfileStore'

const { height } = Dimensions.get('window')

export function RecommendedJobsScreen() {
  const navigation = useNavigation<any>()
  const { activeFilter, setFilter, recommendedJobs } = useJobTrackerStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null)

  const dynamicFilters = ['All Matches', 'Remote', 'Full-time', 'Product Design']

  // Filter Logic
  const filteredJobs = recommendedJobs.filter(job => {
    const matchesSearch = 
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesFilter = true
    if (activeFilter !== 'All Matches') {
       if (activeFilter === 'Remote') matchesFilter = job.location.toLowerCase().includes('remote') || (job.tags?.includes('Remote') ?? false)
       else if (activeFilter === 'Full-time') matchesFilter = (job.tags?.includes('Full-time') ?? false)
       else matchesFilter = job.role.toLowerCase().includes(activeFilter.toLowerCase())
    }

    return matchesSearch && matchesFilter
  })

  const handleCardPress = (job: JobEntry) => {
    setSelectedJob(job)
    setModalVisible(true)
  }

  const renderJobCard = ({ item }: { item: JobEntry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.logoBox}>
            {item.logo ? (
               <Image source={{ uri: item.logo }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <Text style={styles.logoText}>{item.company.charAt(0)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.roleText}>{item.role}</Text>
            <Text style={styles.companyText}>{item.company} • {item.location}</Text>
          </View>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchPercentage}>{item.match}</Text>
          <Text style={styles.matchLabel}>MATCH</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {item.tags?.map((tag, index) => (
          <View key={index} style={styles.tagChip}>
            <Text style={[
              styles.tagText,
              tag === 'Remote' || tag === 'Hybrid' ? { color: CLTheme.accent } : {}
            ]}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
         <TouchableOpacity 
            style={styles.viewDetailsBtn}
            onPress={() => handleCardPress(item)}
            activeOpacity={0.8}
         >
            <Text style={styles.viewDetailsText}>View Details</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.bookmarkBtn}>
            <MaterialIcons name="bookmark-border" size={22} color={CLTheme.text.muted} />
         </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
           <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                 <MaterialIcons name="arrow-back" size={24} color={CLTheme.accent} />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Recommended for You</Text>
           </View>
           <TouchableOpacity style={styles.notificationBtn}>
              <MaterialIcons name="notifications-none" size={24} color={CLTheme.text.primary} />
              <View style={styles.notificationDot} />
           </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchRow}>
           <View style={styles.searchContainer}>
              <Feather name="search" size={18} color={CLTheme.text.muted} style={{marginRight: 8}} />
              <TextInput 
                  placeholder="Search job titles, companies..." 
                  placeholderTextColor={CLTheme.text.muted}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
           </View>
           <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="tune" size={20} color={CLTheme.text.secondary} />
           </TouchableOpacity>
        </View>

        {/* Filter Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {dynamicFilters.map(filter => (
               <TouchableOpacity 
                  key={filter}
                  style={[
                    styles.filterChip, 
                    activeFilter === filter && styles.activeFilterChip
                  ]}
                  onPress={() => setFilter(filter)}
               >
                  <Text style={[
                     styles.filterText,
                     activeFilter === filter && styles.activeFilterText
                  ]}>{filter}</Text>
               </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={item => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{height: 100}} />} // Padding for bottom nav
      />

       {/* Job Details Modal */}
       <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                    <View style={styles.modalHandle} />
                </View>
                {selectedJob && (
                    <View style={{ flex: 1 }}>
                        <View style={styles.modalTop}>
                             <View style={[styles.logoBoxLarge, { backgroundColor: '#f8fafc' }]}>
                                {selectedJob.logo ? (
                                    <Image source={{ uri: selectedJob.logo }} style={styles.logoImageLarge} resizeMode="contain" />
                                ) : (
                                    <Text style={styles.logoTextLarge}>{selectedJob.company.charAt(0)}</Text>
                                )}
                            </View>
                            <Text style={styles.modalRole}>{selectedJob.role}</Text>
                            <Text style={styles.modalCompany}>{selectedJob.company} • {selectedJob.location}</Text>
                            
                            <View style={styles.modalTagsRow}>
                                {selectedJob.tags?.map((tag, i) => (
                                     <View key={i} style={styles.modalTag}>
                                        <Text style={styles.modalTagText}>{tag}</Text>
                                     </View>
                                ))}
                            </View>

                            <View style={[styles.statusBadge, { alignSelf: 'center', marginTop: 12, borderWidth: 1, borderColor: CLTheme.border }]}>
                                <Text style={[styles.statusText, { fontSize: 12, color: CLTheme.text.primary }]}>{selectedJob.match} Match</Text>
                            </View>
                        </View>

                        <ScrollView style={styles.modalBody}>
                           <Text style={styles.modalSectionTitle}>NOTES</Text>
                           <View style={styles.notesBox}>
                               <Text style={styles.notesText}>This job is a great match for your profile. Consider applying quickly as it was posted recently.</Text>
                           </View>
                           <View style={{ height: 40 }} />
                        </ScrollView>

                         <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.secondaryButtonText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => alert('Apply Flow')}>
                                <Text style={styles.primaryButtonText}>Apply Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    backgroundColor: 'rgba(16, 23, 34, 0.8)', // CLTheme.background + opacity
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CLTheme.border,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CLTheme.text.primary,
    letterSpacing: -0.5,
  },
  notificationBtn: {
     width: 40,
     height: 40, 
     borderRadius: 20,
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'transparent', // HTML uses hover bg
  },
  notificationDot: {
     position: 'absolute',
     top: 8,
     right: 8,
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: CLTheme.accent,
  },
  searchRow: {
     flexDirection: 'row',
     gap: 8,
     marginBottom: 16,
  },
  searchContainer: {
     flex: 1,
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: CLTheme.card,
     borderRadius: 8,
     paddingHorizontal: 12,
     height: 44,
  },
  searchInput: {
     flex: 1,
     color: CLTheme.text.primary,
     fontSize: 14,
  },
  filterBtn: {
     width: 44,
     height: 44,
     borderRadius: 8,
     backgroundColor: CLTheme.card,
     alignItems: 'center',
     justifyContent: 'center',
  },
  filterScroll: {
     gap: 8,
     paddingRight: 16,
  },
  filterChip: {
     paddingHorizontal: 14,
     paddingVertical: 8,
     borderRadius: 20,
     backgroundColor: CLTheme.card,
     borderWidth: 1,
     borderColor: 'transparent',
  },
  activeFilterChip: {
     backgroundColor: CLTheme.accent,
  },
  filterText: {
     fontSize: 12,
     fontWeight: '600',
     color: CLTheme.text.secondary,
  },
  activeFilterText: {
     color: '#fff',
  },
  listContent: {
     padding: 16,
     gap: 16,
  },
  card: {
     backgroundColor: CLTheme.card,
     borderRadius: 12,
     padding: 16,
     borderWidth: 1,
     borderColor: CLTheme.border,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 2,
  },
  cardHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: 12,
  },
  cardHeaderLeft: {
     flexDirection: 'row',
     gap: 12,
     flex: 1,
  },
  logoBox: {
     width: 48,
     height: 48,
     borderRadius: 8,
     backgroundColor: '#f1f5f9', // Light placeholder bg
     overflow: 'hidden',
     alignItems: 'center',
     justifyContent: 'center',
  },
  logoImage: {
     width: '100%',
     height: '100%',
  },
  logoText: {
     fontSize: 18,
     fontWeight: '700',
     color: '#64748b',
  },
  roleText: {
     fontSize: 16,
     fontWeight: '700',
     color: CLTheme.text.primary,
     marginTop: 2,
  },
  companyText: {
     fontSize: 13,
     fontWeight: '500',
     color: CLTheme.text.muted,
     marginTop: 2,
  },
  matchBadge: {
     alignItems: 'flex-end',
  },
  matchPercentage: {
     fontSize: 18,
     fontWeight: '700',
     color: CLTheme.accent,
  },
  matchLabel: {
     fontSize: 10,
     fontWeight: '700',
     color: CLTheme.text.muted,
     textTransform: 'uppercase',
  },
  tagsRow: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
     marginBottom: 16,
  },
  tagChip: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     backgroundColor: CLTheme.border,
     borderRadius: 4,
  },
  tagText: {
     fontSize: 11,
     fontWeight: '600',
     color: CLTheme.text.secondary,
  },
  cardFooter: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
     paddingTop: 12,
     borderTopWidth: 1,
     borderTopColor: CLTheme.border,
  },
  viewDetailsBtn: {
     flex: 1,
     backgroundColor: CLTheme.accent,
     borderRadius: 8,
     paddingVertical: 10,
     alignItems: 'center',
  },
  viewDetailsText: {
     fontSize: 14,
     fontWeight: '700',
     color: '#fff',
  },
  bookmarkBtn: {
     width: 40,
     height: 40,
     borderRadius: 8,
     backgroundColor: CLTheme.border,
     alignItems: 'center',
     justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.75,
    backgroundColor: CLTheme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: CLTheme.border,
  },
  modalHeader: {
      alignItems: 'center',
      marginBottom: 20,
  },
  modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: CLTheme.border,
      borderRadius: 2,
  },
  modalTop: {
      alignItems: 'center',
      marginBottom: 24,
  },
  logoBoxLarge: {
     width: 64,
     height: 64,
     borderRadius: 16,
     marginBottom: 16,
     overflow: 'hidden',
     alignItems: 'center',
     justifyContent: 'center',
  },
  logoImageLarge: {
      width: '100%',
      height: '100%',
  },
  logoTextLarge: {
      fontSize: 24,
      fontWeight: '700',
      color: '#64748b',
  },
  modalRole: {
     fontSize: 20,
     fontWeight: '700',
     color: CLTheme.text.primary,
     textAlign: 'center',
     marginBottom: 4,
  },
  modalCompany: {
      fontSize: 14,
      color: CLTheme.text.muted,
      textAlign: 'center',
  },
  modalTagsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
  },
  modalTag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: CLTheme.border,
      borderRadius: 100,
  },
  modalTagText: {
      fontSize: 12,
      color: CLTheme.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalBody: {
      flex: 1,
  },
  modalSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: CLTheme.text.muted,
      marginBottom: 8,
      letterSpacing: 0.5,
  },
  notesBox: {
      backgroundColor: CLTheme.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: CLTheme.border,
  },
  notesText: {
      color: CLTheme.text.secondary,
      lineHeight: 20,
  },
  modalFooter: {
      flexDirection: 'row',
      gap: 12,
  },
  primaryButton: {
      flex: 1,
      backgroundColor: CLTheme.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
  },
  primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
  },
  secondaryButton: {
     paddingHorizontal: 20,
     paddingVertical: 14,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: CLTheme.border,
     backgroundColor: CLTheme.card,
  },
  secondaryButtonText: {
      color: CLTheme.text.primary,
      fontWeight: '600',
  },
})
