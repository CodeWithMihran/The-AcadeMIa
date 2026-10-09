import {useAppTheme} from '../context/ThemeContext';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import {AppTabParamList} from '../navigation/types';
import {getApiErrorMessage, subjectApi} from '../services/api';
import {SubjectVaultScreen} from './SubjectVaultScreen';
import {
  AppCard,
  AppHeader,
  BadgePill,
  EmptyState,
  ErrorState,
  LoadingState,
  SearchInput,
} from '../components';
import {colors, spacing, typography, createAdaptiveStyles} from '../theme';

interface SubjectRow {
  _id: string;
  name: string;
  courseCode?: string;
  track?: string;
  branch?: string;
  semester?: number;
  examCategory?: string;
  units?: Array<{topics?: Array<unknown>}>;
}

type Props = BottomTabScreenProps<AppTabParamList, 'Subjects'>;

export function SubjectCatalogScreen({navigation}: Props): React.JSX.Element {
  useAppTheme();
  const {user} = useAuth();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoaded = React.useRef(false);

  const loadSubjects = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await subjectApi.getSubjects();
      setSubjects((response.data as {subjects?: SubjectRow[]}).subjects || []);
      hasLoaded.current = true;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load subjects.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects(hasLoaded.current).catch(() => {});
    }, [loadSubjects]),
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim().toLocaleLowerCase()), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!selectedSubject) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedSubject(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedSubject]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      if (!debouncedSearch) return true;
      const haystack = [
        subject.name,
        subject.courseCode,
        subject.branch,
        subject.examCategory,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [subjects, debouncedSearch]);

  if (selectedSubject) {
    return (
      <SubjectVaultScreen
        subjectId={selectedSubject}
        onBack={() => setSelectedSubject(null)}
        onOpenProgress={() =>
          navigation.navigate('SubjectProgress', {subjectId: selectedSubject})
        }
      />
    );
  }

  const trackSubtitle =
    user?.track === 'UNIVERSITY'
      ? `${user?.branch || 'Your branch'} · Semester ${user?.semester || '—'}`
      : `${user?.targetExam || 'Competitive exam'} study track`;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppHeader
          eyebrow="YOUR STUDY LIBRARY"
          title="Subjects"
          subtitle={trackSubtitle}
          style={styles.noMarginHeader}
        />
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by subject name or course code…"
          accessibilityLabel="Search subjects by name or code"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <LoadingState message="Finding your subjects…" minHeight={200} />
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <ErrorState
            title="Subjects couldn’t load"
            message={error}
            onRetry={() => loadSubjects(false)}
          />
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadSubjects(true)}
              tintColor={colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                icon={subjects.length ? '🔍' : '📚'}
                title={
                  subjects.length
                    ? 'No matching subjects'
                    : 'No subjects available yet'
                }
                description={
                  subjects.length
                    ? 'Check your spelling or try searching by branch or course code.'
                    : 'Your academic cohort does not have subjects configured yet. Contact your campus administrator.'
                }
                actionLabel={subjects.length ? 'Clear search' : undefined}
                onAction={subjects.length ? () => setSearch('') : undefined}
              />
            </View>
          }
          renderItem={({item}) => {
            const units = item.units?.length || 0;
            const topics =
              item.units?.reduce(
                (sum, unit) => sum + (unit.topics?.length || 0),
                0,
              ) || 0;

            const metadataString = [
              item.branch || item.examCategory,
              item.semester ? `Sem ${item.semester}` : null,
              `${units} ${units === 1 ? 'unit' : 'units'}`,
              `${topics} ${topics === 1 ? 'topic' : 'topics'}`,
            ]
              .filter(Boolean)
              .join('  ·  ');

            return (
              <AppCard
                onPress={() => setSelectedSubject(item._id)}
                accessibilityLabel={`Open ${item.name}`}
                style={styles.subjectCard}>
                <View style={styles.cardTop}>
                  <BadgePill
                    label={item.courseCode || item.track || 'SUBJECT'}
                    variant="blue"
                  />
                  <Text style={styles.openChevron}>›</Text>
                </View>

                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.meta}>{metadataString}</Text>
              </AppCard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  noMarginHeader: {
    marginBottom: spacing.xs,
  },
  searchInput: {
    marginTop: spacing.xs,
  },
  stateContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl + 8,
    flexGrow: 1,
  },
  emptyContainer: {
    marginTop: spacing.md,
  },
  subjectCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openChevron: {
    color: colors.textFaint,
    fontSize: 22,
    fontWeight: '700',
  },
  subjectName: {
    ...typography.titleSm,
    marginTop: spacing.xs + 2,
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    ...typography.caption,
    marginTop: spacing.xxs + 2,
    color: colors.textMuted,
  },
}));
