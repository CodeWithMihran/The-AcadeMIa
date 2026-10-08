import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {AppTabParamList} from '../navigation/types';
import {api, getApiErrorMessage, subjectApi} from '../services/api';
import {
  AppCard,
  BadgePill,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components';
import {colors, radii, spacing, typography} from '../theme';

interface Topic {
  _id: string;
  title: string;
  importance?: string;
}

interface Unit {
  _id: string;
  unitNumber?: number;
  unitTitle: string;
  topics?: Topic[];
}

interface Subject {
  _id: string;
  name: string;
  courseCode?: string;
  units?: Unit[];
}

type Props = BottomTabScreenProps<AppTabParamList, 'SubjectProgress'>;

export function SubjectProgressScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const {subjectId} = route.params;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (background = false) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const [subjectResponse, progressResponse] = await Promise.all([
          subjectApi.getSubject(subjectId),
          api.get(`/progress/${encodeURIComponent(subjectId)}`),
        ]);
        const result = (subjectResponse.data as {subject?: Subject}).subject;
        if (!result) {
          throw new Error('This subject is not available for your study profile.');
        }
        const progress = progressResponse.data as {completedTopicIds?: string[]};
        setSubject(result);
        setCompleted(new Set(progress.completedTopicIds || []));
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Could not load this subject’s progress.',
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [subjectId],
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const topics = useMemo(
    () => (subject?.units || []).flatMap(unit => unit.topics || []),
    [subject],
  );
  const completedCount = topics.filter(topic => completed.has(topic._id)).length;
  const completionPercent = topics.length
    ? Math.round((completedCount / topics.length) * 100)
    : 0;

  const toggleTopic = async (topicId: string) => {
    if (pending.has(topicId)) return;
    setPending(current => new Set(current).add(topicId));
    try {
      const response = await api.post('/progress/toggle', {subjectId, topicId});
      const result = response.data as {completed?: boolean};
      setCompleted(current => {
        const next = new Set(current);
        if (result.completed) next.add(topicId);
        else next.delete(topicId);
        return next;
      });
    } catch (requestError) {
      Alert.alert(
        'Progress not saved',
        getApiErrorMessage(requestError, 'Try again when you are back online.'),
      );
    } finally {
      setPending(current => {
        const next = new Set(current);
        next.delete(topicId);
        return next;
      });
    }
  };

  return (
    <View style={styles.screen}>
      {/* Classical App Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to overall progress"
          hitSlop={12}
          onPress={() => navigation.navigate('Progress')}
          style={styles.backButton}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>All Progress</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.topBarTitle}>
          {subject?.name || 'Subject Progress'}
        </Text>
        <View style={styles.topBarRight} />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <LoadingState message="Loading syllabus topic checklists…" minHeight={240} />
        </View>
      ) : error || !subject ? (
        <View style={styles.stateContainer}>
          <ErrorState
            title="Subject progress couldn’t load"
            message={error || 'This subject is not available.'}
            onRetry={load}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }>
          {/* Header Info */}
          <BadgePill
            label={subject.courseCode || 'SYLLABUS CHECKLIST'}
            variant="blue"
          />
          <Text style={styles.title}>{subject.name}</Text>
          <Text style={styles.subtitle}>
            Tap topics as you study them to update your readiness score and activity.
          </Text>

          {/* Aggregate Subject Readiness Hero */}
          <AppCard variant="inverse" style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryEyebrow}>OVERALL READINESS</Text>
                <Text style={styles.summaryValue}>{completionPercent}%</Text>
              </View>
              <Text style={styles.summaryCounter}>
                {completedCount} of {topics.length} topics
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, {width: `${completionPercent}%`}]} />
            </View>
          </AppCard>

          {/* Unit Breakdowns */}
          {subject.units?.length ? (
            subject.units.map((unit, index) => {
              const unitTopics = unit.topics || [];
              const doneCount = unitTopics.filter(t => completed.has(t._id)).length;
              const unitPercent = unitTopics.length
                ? Math.round((doneCount / unitTopics.length) * 100)
                : 0;

              return (
                <AppCard key={unit._id || index} style={styles.unitCard}>
                  <View style={styles.unitTop}>
                    <View style={styles.unitInfo}>
                      <BadgePill
                        label={`UNIT ${unit.unitNumber || index + 1}`}
                        variant="muted"
                      />
                      <Text style={styles.unitTitle}>{unit.unitTitle}</Text>
                    </View>
                    <Text
                      style={[
                        styles.unitPercent,
                        unitPercent === 100 && styles.unitPercentDone,
                      ]}>
                      {unitPercent}%
                    </Text>
                  </View>

                  <View style={styles.unitTrack}>
                    <View
                      style={[
                        styles.unitFill,
                        {width: `${unitPercent}%`},
                        unitPercent === 100 && styles.unitFillDone,
                      ]}
                    />
                  </View>

                  {unitTopics.length ? (
                    <View style={styles.topicsList}>
                      {unitTopics.map(topic => {
                        const isDone = completed.has(topic._id);
                        const isPending = pending.has(topic._id);

                        return (
                          <Pressable
                            key={topic._id}
                            accessibilityRole="checkbox"
                            accessibilityLabel={`${topic.title}, ${
                              isDone ? 'completed' : 'incomplete'
                            }`}
                            accessibilityState={{
                              checked: isDone,
                              disabled: isPending,
                            }}
                            disabled={isPending}
                            onPress={() => toggleTopic(topic._id)}
                            style={({pressed}) => [
                              styles.topicRow,
                              pressed && styles.topicRowPressed,
                            ]}>
                            <View
                              style={[
                                styles.checkbox,
                                isDone && styles.checkboxDone,
                              ]}>
                              {isPending ? (
                                <ActivityIndicator
                                  size="small"
                                  color={isDone ? '#fff' : colors.primary}
                                />
                              ) : isDone ? (
                                <Text style={styles.checkIcon}>✓</Text>
                              ) : null}
                            </View>

                            <View style={styles.topicCopy}>
                              <Text
                                style={[
                                  styles.topicTitle,
                                  isDone && styles.topicTitleDone,
                                ]}>
                                {topic.title}
                              </Text>
                              {Boolean(topic.importance) && (
                                <Text
                                  style={[
                                    styles.importanceBadge,
                                    topic.importance === 'HIGH' &&
                                      styles.importanceBadgeHigh,
                                  ]}>
                                  {topic.importance} PRIORITY
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyUnitText}>
                      No topics added for this unit yet.
                    </Text>
                  )}
                </AppCard>
              );
            })
          ) : (
            <EmptyState
              icon="📚"
              title="No units to track"
              description="Units and topics for this subject will appear as soon as the syllabus is configured."
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backChevron: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 4,
    lineHeight: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  topBarRight: {
    width: 60,
  },
  stateContainer: {
    padding: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 16,
  },
  title: {
    ...typography.titleLg,
    fontSize: 24,
    lineHeight: 30,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.md,
    padding: spacing.md + 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.textInverseMuted,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textInverse,
    marginTop: 2,
  },
  summaryCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverseMuted,
  },
  track: {
    height: 6,
    overflow: 'hidden',
    marginTop: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.darkSurfaceBorder,
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  unitCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  unitTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  unitInfo: {
    flex: 1,
  },
  unitTitle: {
    ...typography.titleSm,
    fontSize: 16,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  unitPercent: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  unitPercentDone: {
    color: colors.success.text,
  },
  unitTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
  },
  unitFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  unitFillDone: {
    backgroundColor: colors.success.indicator,
  },
  topicsList: {
    marginTop: spacing.xxs,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.xxs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  topicRowPressed: {
    opacity: 0.8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkIcon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  topicCopy: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textPrimary,
  },
  topicTitleDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  importanceBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textFaint,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  importanceBadgeHigh: {
    color: colors.warning.text,
  },
  emptyUnitText: {
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
