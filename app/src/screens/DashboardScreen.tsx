import React, {useCallback, useRef, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useFocusEffect} from '@react-navigation/native';
import {AppTabParamList} from '../navigation/types';
import {useAuth} from '../context/AuthContext';
import {api, getApiErrorMessage, subjectApi} from '../services/api';
import {
  AppCard,
  AppHeader,
  BadgePill,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
  SkillRadarChart,
  SkillRadarPoint,
} from '../components';
import {colors, radii, spacing, typography} from '../theme';

interface SubjectSummary {
  _id: string;
  name: string;
  courseCode?: string;
  branch?: string;
  semester?: number;
  units?: Array<{topics?: Array<unknown>}>;
}

interface DashboardData {
  subjects: SubjectSummary[];
  readiness: number;
  progressMap: Record<string, number>;
  skillRadar: SkillRadarPoint[];
}

type Props = BottomTabScreenProps<AppTabParamList, 'Dashboard'>;

export function DashboardScreen({navigation}: Props): React.JSX.Element {
  const {user} = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoaded = useRef(false);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [subjectsResponse, progressResponse] = await Promise.all([
        subjectApi.getSubjects(),
        api.get('/progress/overview'),
      ]);
      const subjectsBody = subjectsResponse.data as {subjects?: SubjectSummary[]};
      const progressBody = progressResponse.data as {
        averageReadiness?: number;
        subjectProgressMap?: Record<string, number>;
        skillRadar?: SkillRadarPoint[];
        completedTopics?: number;
        totalTopics?: number;
      };
      setData({
        subjects: subjectsBody.subjects || [],
        readiness: Number(progressBody.averageReadiness) || 0,
        progressMap: progressBody.subjectProgressMap || {},
        skillRadar: Array.isArray(progressBody.skillRadar) ? progressBody.skillRadar : [],
      });
      hasLoaded.current = true;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current).catch(() => {});
    }, [load]),
  );

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'student';
  const totalUnits =
    data?.subjects.reduce((sum, subject) => sum + (subject.units?.length || 0), 0) || 0;

  const academicSubtitle =
    user?.track === 'UNIVERSITY'
      ? `${
          user?.tenant && typeof user.tenant === 'object'
            ? user.tenant.shortCode || user.tenant.name
            : 'University'
        } · ${user?.branch || 'Your branch'} · Semester ${user?.semester || '—'}`
      : `${user?.targetExam || 'Competitive exam'} · Target ${
          user?.targetYear || 'year not set'
        }`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={colors.primary}
        />
      }>
      <AppHeader
        eyebrow="YOUR ACADEMIC WORKSPACE"
        title={`Welcome back, ${firstName}.`}
        subtitle={academicSubtitle}
      />

      {error ? (
        <ErrorState
          title="Dashboard couldn’t load"
          message={error}
          onRetry={() => load(false)}
        />
      ) : loading ? (
        <LoadingState message="Loading your subjects and progress…" minHeight={200} />
      ) : (
        <>
          {/* Key Metric Counters */}
          <View style={styles.statsRow}>
            <StatCard label="Enrolled Subjects" value={data?.subjects.length || 0} />
            <StatCard label="Syllabus Units" value={totalUnits} />
            <StatCard
              label="Readiness"
              value={`${data?.readiness || 0}%`}
              valueColor={
                (data?.readiness || 0) >= 75
                  ? colors.success.text
                  : (data?.readiness || 0) >= 40
                  ? colors.primary
                  : colors.warning.text
              }
            />
          </View>

          {/* Quick Study-Tools Shortcut Banner */}
          <AppCard
            onPress={() => navigation.navigate('StudyTools')}
            accessibilityLabel="Open daily study tools: attendance forecasting and marks planner"
            style={styles.studyToolsCard}>
            <View style={styles.studyToolsContent}>
              <View style={styles.studyToolsIconBox}>
                <Text style={styles.studyToolsIcon}>⚡</Text>
              </View>
              <View style={styles.studyToolsText}>
                <Text style={styles.studyToolsTitle}>Daily Study Tools</Text>
                <Text style={styles.studyToolsSub}>
                  Forecast 75% attendance, track marks & model SGPA
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </AppCard>

          {/* Primary Subject Shelf */}
          <SectionHeading
            eyebrow="KEEP LEARNING"
            title="Your subjects"
            actionLabel={data?.subjects.length ? 'See all' : undefined}
            onAction={() => navigation.navigate('Subjects')}
          />

          {data?.subjects.length ? (
            data.subjects.slice(0, 4).map(subject => {
              const progress = data.progressMap[subject._id] || 0;
              const topicCount =
                subject.units?.reduce(
                  (sum, unit) => sum + (unit.topics?.length || 0),
                  0,
                ) || 0;
              const unitCount = subject.units?.length || 0;

              return (
                <AppCard
                  key={subject._id}
                  onPress={() => navigation.navigate('Subjects')}
                  accessibilityLabel={`Open ${subject.name}, ${progress}% complete`}
                  style={styles.subjectCard}>
                  <View style={styles.subjectTop}>
                    <BadgePill
                      label={subject.courseCode || 'SUBJECT'}
                      variant="blue"
                    />
                    <Text style={styles.progressPercent}>{progress}%</Text>
                  </View>

                  <Text numberOfLines={2} style={styles.subjectName}>
                    {subject.name}
                  </Text>

                  <Text style={styles.subjectMeta}>
                    {unitCount} {unitCount === 1 ? 'unit' : 'units'} · {topicCount}{' '}
                    {topicCount === 1 ? 'topic' : 'topics'}
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {width: `${Math.min(100, Math.max(0, progress))}%`},
                      ]}
                    />
                  </View>
                </AppCard>
              );
            })
          ) : (
            <EmptyState
              icon="📚"
              title="Your subject shelf is ready"
              description="No subjects are linked to this academic track yet. Explore the subject catalog or update your profile."
              actionLabel="Browse catalog"
              onAction={() => navigation.navigate('Subjects')}
            />
          )}

          {/* Syllabus Readiness Overview */}
          <AppCard variant="accent" style={styles.readinessCard}>
            <Text style={styles.sectionEyebrowAccent}>STEADY PROGRESS</Text>
            <Text style={styles.readinessHeading}>
              {data?.readiness || 0}% average syllabus readiness
            </Text>
            <Text style={styles.readinessSub}>
              Topic completion is stored securely and stays synced with your web workspace.
            </Text>
          </AppCard>

          {/* Career Bridge Skill Radar */}
          <AppCard style={styles.skillsCard}>
            <Text style={styles.sectionEyebrow}>CAREER PRACTICE</Text>
            <Text style={styles.skillsTitle}>Your skill radar</Text>
            <Text style={styles.skillsSub}>
              Scores reflect completed interview problems, coding practice, and GATE
              resources mapped to your subjects.
            </Text>
            <SkillRadarChart data={data?.skillRadar || []} />
          </AppCard>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  valueColor = colors.textPrimary,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, {color: valueColor}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  studyToolsCard: {
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.primaryBorder,
  },
  studyToolsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studyToolsIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyToolsIcon: {
    fontSize: 16,
  },
  studyToolsText: {
    flex: 1,
  },
  studyToolsTitle: {
    ...typography.titleSm,
    fontSize: 14,
  },
  studyToolsSub: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textMuted,
  },
  chevron: {
    color: colors.textFaint,
    fontSize: 22,
    fontWeight: '700',
  },
  subjectCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  subjectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  subjectName: {
    marginTop: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  subjectMeta: {
    marginTop: spacing.xxs + 2,
    color: colors.textMuted,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    marginTop: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  readinessCard: {
    marginTop: spacing.md,
    padding: spacing.md + 2,
  },
  sectionEyebrowAccent: {
    ...typography.eyebrow,
    color: colors.primary,
    fontSize: 9,
  },
  readinessHeading: {
    marginTop: spacing.xs,
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '900',
  },
  readinessSub: {
    marginTop: spacing.xxs + 2,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  skillsCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  sectionEyebrow: {
    ...typography.eyebrow,
    color: colors.textFaint,
    fontSize: 9,
  },
  skillsTitle: {
    ...typography.titleSm,
    marginTop: 2,
  },
  skillsSub: {
    ...typography.bodySm,
    marginTop: spacing.xxs,
    color: colors.textMuted,
  },
});
