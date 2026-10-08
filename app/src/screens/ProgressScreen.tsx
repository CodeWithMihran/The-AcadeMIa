import React, {useCallback, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useFocusEffect} from '@react-navigation/native';
import {SkillRadarChart, SkillRadarPoint} from '../components/SkillRadarChart';
import {AppTabParamList} from '../navigation/types';
import {api, getApiErrorMessage} from '../services/api';
import {
  AppCard,
  AppHeader,
  BadgePill,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeading,
} from '../components';
import {colors, radii, spacing, typography} from '../theme';

type Overview = {
  averageReadiness?: number;
  totalSubjects?: number;
  subjectProgressMap?: Record<string, number>;
  skillRadar?: SkillRadarPoint[];
};
type Subject = {_id: string; name: string; courseCode?: string};
type Props = BottomTabScreenProps<AppTabParamList, 'Progress'>;

export function ProgressScreen({navigation}: Props): React.JSX.Element {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [progressResponse, subjectsResponse] = await Promise.all([
        api.get('/progress/overview'),
        api.get('/subjects'),
      ]);
      setOverview(progressResponse.data as Overview);
      setSubjects(
        (subjectsResponse.data as {subjects?: Subject[]}).subjects || [],
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Could not load your progress.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true).catch(() => {});
    }, [load]),
  );

  const readiness = Math.min(
    100,
    Math.max(0, Number(overview?.averageReadiness) || 0),
  );

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
        eyebrow="YOUR LEARNING JOURNAL"
        title="Progress"
        subtitle="Syllabus readiness and subject-mapped career practice scores."
      />

      {error ? (
        <ErrorState
          title="Progress couldn’t load"
          message={error}
          onRetry={() => load(false)}
        />
      ) : loading ? (
        <LoadingState message="Loading your learning progress…" minHeight={200} />
      ) : (
        <>
          {/* Aggregate Overview Card */}
          <AppCard variant="inverse" style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryEyebrow}>AVERAGE READINESS</Text>
                <Text style={styles.summaryValue}>{readiness}%</Text>
              </View>
              <Text style={styles.summaryCounter}>
                {overview?.totalSubjects || 0} active subjects
              </Text>
            </View>

            <View style={styles.track}>
              <View style={[styles.fill, {width: `${readiness}%`}]} />
            </View>
            <Text style={styles.summaryCaption}>
              Calculated across completed syllabus topics and past question reviews.
            </Text>
          </AppCard>

          {/* Subject Progress Section */}
          <SectionHeading
            eyebrow="SYLLABUS BY SUBJECT"
            title="Course Breakdown"
          />

          {subjects.length ? (
            subjects.map(subject => {
              const value = Math.min(
                100,
                Math.max(
                  0,
                  Number(overview?.subjectProgressMap?.[subject._id]) || 0,
                ),
              );

              return (
                <AppCard
                  key={subject._id}
                  onPress={() =>
                    navigation.navigate('SubjectProgress', {
                      subjectId: subject._id,
                    })
                  }
                  accessibilityLabel={`${subject.name}, ${value}% complete`}
                  style={styles.subjectCard}>
                  <View style={styles.cardHeader}>
                    <BadgePill
                      label={subject.courseCode || 'SUBJECT'}
                      variant="blue"
                    />
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreText}>{value}%</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </View>

                  <Text numberOfLines={2} style={styles.subjectName}>
                    {subject.name}
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, {width: `${value}%`}]}
                    />
                  </View>

                  <Text style={styles.tapPrompt}>
                    Tap to open unit and topic checklist ›
                  </Text>
                </AppCard>
              );
            })
          ) : (
            <EmptyState
              icon="📚"
              title="No subjects to track yet"
              description="Subjects configured for your study cohort will appear here automatically."
            />
          )}

          {/* Career Practice Skill Radar */}
          <AppCard style={styles.skillsCard}>
            <Text style={styles.skillsEyebrow}>CAREER PRACTICE RADAR</Text>
            <Text style={styles.skillsTitle}>Subject Career Scores</Text>
            <Text style={styles.skillsMuted}>
              Points reflect completed interview problems and coding links across
              all subjects.
            </Text>
            <SkillRadarChart data={overview?.skillRadar || []} />
          </AppCard>
        </>
      )}
    </ScrollView>
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
    paddingBottom: spacing.xxl + 24,
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
    fontSize: 34,
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
  summaryCaption: {
    ...typography.caption,
    color: colors.textInverseMuted,
    marginTop: spacing.sm,
  },
  subjectCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  chevron: {
    color: colors.textFaint,
    fontSize: 18,
    fontWeight: '800',
  },
  subjectName: {
    ...typography.titleSm,
    fontSize: 16,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  tapPrompt: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  skillsCard: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  skillsEyebrow: {
    ...typography.eyebrow,
    color: colors.textFaint,
    fontSize: 9,
  },
  skillsTitle: {
    ...typography.titleSm,
    marginTop: 2,
  },
  skillsMuted: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
