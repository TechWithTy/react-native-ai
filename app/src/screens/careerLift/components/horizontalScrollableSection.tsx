import { ReactNode, useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { CLTheme } from '../theme'

type HorizontalScrollableSectionProps = {
  title: string
  children: ReactNode
  containerStyle?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function HorizontalScrollableSection({
  title,
  children,
  containerStyle,
  contentContainerStyle,
}: HorizontalScrollableSectionProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const canScroll = useMemo(() => contentWidth > containerWidth + 1, [contentWidth, containerWidth])

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width)
  }, [])

  const handleContentSizeChange = useCallback((width: number) => {
    setContentWidth(width)
  }, [])

  return (
    <View style={[styles.sectionWrap, containerStyle]}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {canScroll ? (
          <View style={styles.scrollHintWrap}>
            <Text style={styles.scrollHintText}>Scroll</Text>
            <Feather name='chevron-right' size={13} color={CLTheme.text.secondary} />
          </View>
        ) : null}
      </View>
      <View onLayout={handleLayout}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.defaultHorizontalContent, contentContainerStyle]}
          onContentSizeChange={handleContentSizeChange}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  scrollHintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scrollHintText: {
    color: CLTheme.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  defaultHorizontalContent: {
    paddingRight: 8,
  },
})
