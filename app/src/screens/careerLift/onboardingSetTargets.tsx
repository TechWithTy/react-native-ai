import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import {
  getHighlightedSkillsForRole,
  getPositionGoalsForRole,
  getRoleOptionsForTrack,
  getSalaryRangesForRole,
  useCareerSetupStore,
} from '../../store/careerSetup'
import { HorizontalScrollableSection } from './components/horizontalScrollableSection'
import { SearchableInput } from './components/searchableInput'
import { CLTheme } from './theme'

const MAX_BADGES_PER_ROW = 4
const MAX_BADGE_ROWS = 4

function toBadgeRows(items: string[]): string[][] {
  const limited = items.slice(0, MAX_BADGES_PER_ROW * MAX_BADGE_ROWS)
  const rows: string[][] = []
  for (let i = 0; i < limited.length; i += MAX_BADGES_PER_ROW) {
    rows.push(limited.slice(i, i + MAX_BADGES_PER_ROW))
  }
  return rows
}

export function OnboardingSetTargetsScreen({ navigation }: any) {
  const selectedTrack = useCareerSetupStore(state => state.roleTrack)
  const targetRole = useCareerSetupStore(state => state.targetRole)
  const desiredSalaryRange = useCareerSetupStore(state => state.desiredSalaryRange)
  const selectedGoals = useCareerSetupStore(state => state.selectedGoals)
  const selectedSkills = useCareerSetupStore(state => state.selectedSkills)
  const setCareerSetup = useCareerSetupStore(state => state.setCareerSetup)
  const [roleSearchQuery, setRoleSearchQuery] = useState('')

  const roleSuggestions = useMemo(() => getRoleOptionsForTrack(selectedTrack), [selectedTrack])
  const filteredRoleSuggestions = useMemo(() => {
    const query = roleSearchQuery.trim().toLowerCase()
    if (!query) return roleSuggestions
    return roleSuggestions.filter(role => role.toLowerCase().includes(query))
  }, [roleSearchQuery, roleSuggestions])

  const highlightedSkills = useMemo(
    () => getHighlightedSkillsForRole(selectedTrack, targetRole),
    [selectedTrack, targetRole]
  )
  const positionGoals = useMemo(
    () => getPositionGoalsForRole(selectedTrack, targetRole),
    [selectedTrack, targetRole]
  )
  const salaryRanges = useMemo(
    () => getSalaryRangesForRole(selectedTrack, targetRole),
    [selectedTrack, targetRole]
  )
  const goalRows = useMemo(() => toBadgeRows(positionGoals), [positionGoals])
  const skillRows = useMemo(() => toBadgeRows(highlightedSkills), [highlightedSkills])



  useEffect(() => {
    const nextGoals = selectedGoals.filter(goal => positionGoals.includes(goal))
    const nextSkills = selectedSkills.filter(skill => highlightedSkills.includes(skill))

    const normalizedGoals = nextGoals
    const normalizedSkills = nextSkills

    const goalsChanged = normalizedGoals.join('|') !== selectedGoals.join('|')
    const skillsChanged = normalizedSkills.join('|') !== selectedSkills.join('|')
    if (goalsChanged || skillsChanged) {
      setCareerSetup({
        selectedGoals: normalizedGoals,
        selectedSkills: normalizedSkills,
      })
    }
  }, [highlightedSkills, positionGoals, selectedGoals, selectedSkills, setCareerSetup])

  const toggleGoal = (goal: string) => {
    const next = selectedGoals.includes(goal)
      ? selectedGoals.filter(item => item !== goal)
      : [...selectedGoals, goal]
    setCareerSetup({ selectedGoals: next.length ? next : [goal] })
  }

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter(item => item !== skill)
      : [...selectedSkills, skill]
    setCareerSetup({ selectedSkills: next.length ? next : [skill] })
  }
  
  const canProceed = 
    targetRole.trim().length > 0 && 
    desiredSalaryRange.trim().length > 0 && 
    selectedGoals.length > 0 && 
    selectedSkills.length > 0
  const roleValidationText = !targetRole.trim() ? 'Choose a target role to continue.' : ''
  const salaryValidationText = !desiredSalaryRange.trim() ? 'Select a desired salary range to continue.' : ''
  const goalsValidationText = selectedGoals.length === 0 ? 'Select at least one position goal to continue.' : ''
  const skillsValidationText = selectedSkills.length === 0 ? 'Select at least one highlighted skill to continue.' : ''

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.topMetaRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topLinkBtn} activeOpacity={0.9}>
            <MaterialIcons name="arrow-back" size={24} color={CLTheme.text.muted} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>

        </View>
        <Text style={styles.headerTitle}>Set Your Target</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '66%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Role Track</Text>
          <Text style={styles.helperText}>Search roles for your selected track: {selectedTrack}</Text>
          <SearchableInput
            value={roleSearchQuery}
            onChangeText={setRoleSearchQuery}
            placeholder='Ex: Product Designer'
          />
          <View style={styles.chipsRow}>
            {filteredRoleSuggestions.map(item => {
              const selected = targetRole === item
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCareerSetup({ targetRole: item })}
                  style={[styles.chip, selected && styles.chipSelected]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          {filteredRoleSuggestions.length === 0 ? (
            <Text style={styles.emptyText}>No role matches this search.</Text>
          ) : null}
          {roleValidationText ? <Text style={styles.validationText}>{roleValidationText}</Text> : null}
        </View>

        <HorizontalScrollableSection title='Desired Salary Range' contentContainerStyle={styles.horizontalScrollRow}>
          <View style={styles.badgeRow}>
            {salaryRanges.map(range => {
              const selected = desiredSalaryRange === range
              return (
                <TouchableOpacity
                  key={range}
                  onPress={() => setCareerSetup({ desiredSalaryRange: range })}
                  style={[styles.salaryChip, selected && styles.salaryChipSelected]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.salaryChipText, selected && styles.salaryChipTextSelected]}>{range}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </HorizontalScrollableSection>
        {salaryValidationText ? <Text style={styles.validationText}>{salaryValidationText}</Text> : null}

        <HorizontalScrollableSection title='Position Goals' contentContainerStyle={styles.horizontalRowsContent}>
          <View style={styles.rowsWrap}>
            {goalRows.map((row, rowIndex) => (
              <View key={`goal-row-${rowIndex}`} style={styles.badgeRow}>
                {row.map(goal => (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => toggleGoal(goal)}
                    style={[styles.goalBadge, selectedGoals.includes(goal) && styles.goalBadgeSelected]}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.goalBadgeText, selectedGoals.includes(goal) && styles.goalBadgeTextSelected]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </HorizontalScrollableSection>
        {goalsValidationText ? <Text style={styles.validationText}>{goalsValidationText}</Text> : null}

        <HorizontalScrollableSection title='Highlighted Skills' contentContainerStyle={styles.horizontalRowsContent}>
          <View style={styles.rowsWrap}>
            {skillRows.map((row, rowIndex) => (
              <View key={`skill-row-${rowIndex}`} style={styles.badgeRow}>
                {row.map(skill => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    style={[styles.skillChip, selectedSkills.includes(skill) && styles.skillChipSelected]}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.skillChipText, selectedSkills.includes(skill) && styles.skillChipTextSelected]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </HorizontalScrollableSection>
        {skillsValidationText ? <Text style={styles.validationText}>{skillsValidationText}</Text> : null}
      </ScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          onPress={() => {
            if (canProceed) {
              navigation.navigate('ResumeIngestion')
            }
          }}
          disabled={!canProceed}
          style={[
            styles.cta,
            !canProceed && { opacity: 0.5, backgroundColor: CLTheme.border }
          ]}
          activeOpacity={0.9}
        >
          <Text style={[styles.ctaText, !canProceed && { color: CLTheme.text.secondary }]}>Continue</Text>
        </TouchableOpacity>
        {!canProceed ? (
          <Text style={styles.validationDockText}>Complete all required selections to continue.</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CLTheme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topLinkBtn: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLinkText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: CLTheme.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  progressTrack: {
    marginHorizontal: 16,
    height: 6,
    borderRadius: 999,
    backgroundColor: CLTheme.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d6cf2',
    borderRadius: 999,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionTitle: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 8,
  },
  helperText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    marginBottom: 8,
  },
  emptyText: {
    marginTop: 8,
    color: CLTheme.text.secondary,
    fontSize: 12,
  },
  validationText: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  rowsWrap: {
    gap: 8,
  },
  horizontalRowsContent: {
    paddingRight: 8,
  },
  horizontalScrollRow: {
    gap: 8,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
  },
  salaryChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  salaryChipSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: '#0d6cf2',
  },
  salaryChipText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  salaryChipTextSelected: {
    color: '#fff',
  },
  goalBadge: {
    minWidth: 138,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  goalBadgeSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: 'rgba(13,108,242,0.15)',
  },
  goalBadgeText: {
    color: CLTheme.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalBadgeTextSelected: {
    color: '#dbeafe',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CLTheme.border,
    backgroundColor: CLTheme.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: '#0d6cf2',
  },
  chipText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  skillChip: {
    minWidth: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.35)',
    backgroundColor: 'rgba(13,108,242,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillChipSelected: {
    borderColor: '#0d6cf2',
    backgroundColor: '#0d6cf2',
  },
  skillChipText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  skillChipTextSelected: {
    color: '#fff',
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: CLTheme.border,
    padding: 14,
    backgroundColor: CLTheme.background,
    gap: 8,
  },
  cta: {
    backgroundColor: '#0d6cf2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  validationDockText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryCta: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: CLTheme.card,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryCtaText: {
    color: CLTheme.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
})
