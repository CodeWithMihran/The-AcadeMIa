import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getApiErrorMessage, progressApi, subjectApi} from '../services/api';
import {
  AppCard,
  BadgePill,
  ErrorState,
  LoadingState,
  SectionHeading,
} from '../components';
import {colors, radii, spacing, typography} from '../theme';

interface Resource {
  _id?: string;
  title: string;
  link?: string;
  url?: string;
}

interface Topic {
  _id: string;
  title: string;
  importance?: string;
}

interface Unit {
  _id: string;
  unitNumber: number;
  unitTitle: string;
  topics?: Topic[];
  notes?: Resource[];
  books?: Resource[];
  pyqs?: Resource[];
  youtubeLinks?: Resource[];
  examYearsCovered?: number[];
  examQuestions?: Array<{
    _id?: string;
    topic: string;
    question: string;
    year: number;
    marks?: number;
    sourceUrl?: string;
  }>;
  rapidRevision?: Record<string, string>;
  quickSummary?: Record<string, string>;
}

interface VaultSubject {
  _id: string;
  name: string;
  courseCode?: string;
  units?: Unit[];
  careerBridge?: {
    interviewQuestions?: Array<{
      _id?: string;
      question: string;
      answerMarkdown?: string;
      topic?: string;
      companies?: string[];
      difficulty?: string;
    }>;
    codingLinks?: Array<{
      _id?: string;
      title: string;
      url: string;
      platform?: string;
      topic?: string;
      difficulty?: string;
    }>;
    gate?: {
      examCode?: string;
      weightageMinMarks?: number;
      weightageMaxMarks?: number;
      pyqs?: Array<{
        _id?: string;
        title: string;
        url: string;
        year?: number;
        topic?: string;
      }>;
    };
  };
}

interface Props {
  subjectId: string;
  onBack: () => void;
  onOpenProgress: () => void;
}

export function SubjectVaultScreen({
  subjectId,
  onBack,
  onOpenProgress,
}: Props): React.JSX.Element {
  const [subject, setSubject] = useState<VaultSubject | null>(null);
  const [completedCareer, setCompletedCareer] = useState<Set<string>>(new Set());
  const [pendingCareer, setPendingCareer] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [highYieldOnly, setHighYieldOnly] = useState(false);
  const [mode, setMode] = useState<'academic' | 'career'>('academic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectResponse, careerProgressResponse] = await Promise.all([
        subjectApi.getSubject(subjectId),
        progressApi.getCareer(subjectId),
      ]);
      const subjectBody = subjectResponse.data as {subject?: VaultSubject};
      if (!subjectBody.subject) {
        throw new Error('The subject was not found for this academic profile.');
      }
      setSubject(subjectBody.subject);
      const careerProgress = careerProgressResponse.data as {
        completed?: Array<{resourceType: string; resourceId: string}>;
      };
      setCompletedCareer(
        new Set(
          (careerProgress.completed || []).map(
            item => `${item.resourceType}:${item.resourceId}`,
          ),
        ),
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load this subject vault.'));
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    load().catch(unexpectedError => {
      setError(getApiErrorMessage(unexpectedError, 'Could not load this subject vault.'));
      setLoading(false);
    });
  }, [load]);

  const setCareerCompleted = async (
    resourceType: 'INTERVIEW_QUESTION' | 'CODING_LINK',
    resourceId: string,
  ) => {
    const key = `${resourceType}:${resourceId}`;
    const completed = !completedCareer.has(key);
    setPendingCareer(current => new Set(current).add(key));
    try {
      await progressApi.setCareerCompletion({
        subjectId,
        resourceType,
        resourceId,
        completed,
      });
      setCompletedCareer(current => {
        const next = new Set(current);
        if (completed) next.add(key);
        else next.delete(key);
        return next;
      });
    } catch (requestError) {
      Alert.alert(
        'Practice progress not saved',
        getApiErrorMessage(requestError, 'Try again when you are back online.'),
      );
    } finally {
      setPendingCareer(current => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  const reportBrokenLink = (
    resourceId: string,
    resourceType: 'CODING_LINK' | 'GATE_PYQ',
  ) => {
    Alert.alert(
      'Report a broken link?',
      'The AcadeMIa admin team will review this resource.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Report link',
          onPress: () => {
            subjectApi
              .reportBrokenLink(subjectId, resourceId, resourceType)
              .then(response =>
                Alert.alert(
                  'Report received',
                  (response.data as {message?: string}).message ||
                    'Thank you for helping keep resources up to date.',
                ),
              )
              .catch(requestError =>
                Alert.alert(
                  'Report not sent',
                  getApiErrorMessage(requestError, 'Please try again later.'),
                ),
              );
          },
        },
      ],
    );
  };

  const openResource = async (url?: string) => {
    if (!url || !/^https?:\/\//i.test(url)) {
      Alert.alert(
        'Resource unavailable',
        'This material does not have a valid web link yet.',
      );
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Could not open resource',
        'Check that a browser or compatible viewer is available on this device.',
      );
    }
  };

  const units = subject?.units || [];
  const topicTotal = units.reduce(
    (sum, unit) => sum + (unit.topics?.length || 0),
    0,
  );
  const career = subject?.careerBridge;
  const gate = career?.gate;

  const visibleUnits = highYieldOnly
    ? units.filter(unit => {
        const coveredYears = new Set(unit.examYearsCovered || []).size;
        const questions = unit.examQuestions || [];
        const repeatedTopic = questions.some(
          question =>
            questions.filter(
              item =>
                item.topic.toLocaleLowerCase() ===
                question.topic.toLocaleLowerCase(),
            ).length >= 2,
        );
        const observedFrequentTopic =
          coveredYears > 0 && questions.length / coveredYears >= 0.5;
        return (
          unit.topics?.some(topic => topic.importance === 'HIGH') ||
          repeatedTopic ||
          observedFrequentTopic
        );
      })
    : units;

  return (
    <View style={styles.screen}>
      {/* Classical App Header Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to subject catalog"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Subjects</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.topBarTitle}>
          {subject?.name || 'Subject Vault'}
        </Text>
        <View style={styles.topBarRight} />
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <LoadingState message="Opening subject vault…" minHeight={240} />
        </View>
      ) : error || !subject ? (
        <View style={styles.stateContainer}>
          <ErrorState
            title="This vault couldn’t load"
            message={error || 'Subject not found.'}
            onRetry={load}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* Vault Hero Card */}
          <AppCard style={styles.heroCard}>
            <View style={styles.heroTop}>
              <BadgePill
                label={subject.courseCode || 'SUBJECT VAULT'}
                variant="blue"
              />
              {Boolean(gate?.weightageMinMarks) && (
                <BadgePill
                  label={`${gate?.examCode || 'GATE'} · ${gate?.weightageMinMarks}${
                    gate?.weightageMaxMarks &&
                    gate.weightageMaxMarks !== gate.weightageMinMarks
                      ? `–${gate.weightageMaxMarks}`
                      : ''
                  } marks`}
                  variant="indigo"
                />
              )}
            </View>

            <Text style={styles.heroTitle}>{subject.name}</Text>
            <Text style={styles.heroMeta}>
              {units.length} {units.length === 1 ? 'unit' : 'units'} · {topicTotal}{' '}
              {topicTotal === 1 ? 'topic' : 'topics'} ·{' '}
              {(career?.interviewQuestions?.length || 0) +
                (career?.codingLinks?.length || 0)}{' '}
              career practice items
            </Text>
          </AppCard>

          {/* Classical Segmented Mode Switcher */}
          <View style={styles.segmentContainer}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{selected: mode === 'academic'}}
              onPress={() => setMode('academic')}
              style={[
                styles.segmentTab,
                mode === 'academic' && styles.segmentTabActive,
              ]}>
              <Text
                style={[
                  styles.segmentText,
                  mode === 'academic' && styles.segmentTextActive,
                ]}>
                Academic Syllabus
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{selected: mode === 'career'}}
              onPress={() => setMode('career')}
              style={[
                styles.segmentTab,
                mode === 'career' && styles.segmentTabActive,
              ]}>
              <Text
                style={[
                  styles.segmentText,
                  mode === 'career' && styles.segmentTextActive,
                ]}>
                Career Bridge
              </Text>
            </Pressable>
          </View>

          {/* Quick Progress Navigation Link */}
          <AppCard
            onPress={onOpenProgress}
            accessibilityLabel="Track subject syllabus and topic progress"
            style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressIconCircle}>
                <Text style={styles.progressIcon}>✓</Text>
              </View>
              <View style={styles.progressCopy}>
                <Text style={styles.progressTitle}>Track Subject Progress</Text>
                <Text style={styles.progressSub}>
                  Update unit checklist and topic readiness
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </AppCard>

          {mode === 'academic' ? (
            <>
              {/* High-Yield Filter Toggle */}
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{checked: highYieldOnly}}
                onPress={() => setHighYieldOnly(value => !value)}
                style={[
                  styles.highYieldBar,
                  highYieldOnly && styles.highYieldBarActive,
                ]}>
                <Text style={styles.highYieldIcon}>
                  {highYieldOnly ? '🔥' : '⚡'}
                </Text>
                <Text
                  style={[
                    styles.highYieldLabel,
                    highYieldOnly && styles.highYieldLabelActive,
                  ]}>
                  {highYieldOnly
                    ? 'High-Yield Filter Active (Exam Night)'
                    : 'Show High-Yield Exam Units Only'}
                </Text>
                <Text style={styles.highYieldIndicator}>
                  {highYieldOnly ? 'ON' : 'OFF'}
                </Text>
              </Pressable>

              {visibleUnits.length ? (
                visibleUnits.map((unit, index) => (
                  <AppCard
                    key={unit._id || index}
                    style={styles.unitCard}>
                    <View style={styles.unitHeader}>
                      <BadgePill
                        label={`UNIT ${unit.unitNumber || index + 1}`}
                        variant="muted"
                      />
                      <Text style={styles.unitTopicCounter}>
                        {unit.topics?.length || 0} topics
                      </Text>
                    </View>

                    <Text style={styles.unitTitle}>{unit.unitTitle}</Text>

                    {/* Topics List */}
                    {unit.topics?.length ? (
                      <View style={styles.topicContainer}>
                        {unit.topics.map(topic => (
                          <View key={topic._id} style={styles.topicRow}>
                            <View
                              style={[
                                styles.topicBullet,
                                topic.importance === 'HIGH' &&
                                  styles.topicBulletHigh,
                              ]}
                            />
                            <View style={styles.topicCopy}>
                              <Text style={styles.topicTitle}>
                                {topic.title}
                              </Text>
                              <Text
                                style={[
                                  styles.topicImportance,
                                  topic.importance === 'HIGH' &&
                                    styles.topicImportanceHigh,
                                ]}>
                                {topic.importance || 'STANDARD'} YIELD
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.mutedText}>
                        No topics listed for this unit yet.
                      </Text>
                    )}

                    {/* Study Material Groups */}
                    <ResourceList
                      title="Study Notes"
                      icon="📝"
                      resources={unit.notes}
                      onOpen={openResource}
                    />
                    <ResourceList
                      title="Reference Books & PDFs"
                      icon="📖"
                      resources={unit.books}
                      onOpen={openResource}
                    />
                    <ResourceList
                      title="Previous Year Question Papers (PYQs)"
                      icon="📜"
                      resources={unit.pyqs}
                      onOpen={openResource}
                    />
                    <ResourceList
                      title="Video Lectures"
                      icon="▶️"
                      resources={unit.youtubeLinks}
                      onOpen={openResource}
                    />

                    {/* Exam Night Questions & Recurrence */}
                    {Boolean(unit.examQuestions?.length) && (
                      <View style={styles.examSection}>
                        <Text style={styles.sectionHeaderTitle}>
                          🔥 Exam Night: High-Frequency Questions
                        </Text>
                        {unit.examQuestions?.slice(0, 8).map((item, qIndex) => {
                          const coveredYears = new Set(
                            unit.examYearsCovered || [],
                          );
                          const occurrences =
                            unit.examQuestions?.filter(
                              q =>
                                q.topic.toLocaleLowerCase() ===
                                item.topic.toLocaleLowerCase(),
                            ).length || 1;

                          return (
                            <View
                              key={item._id || qIndex}
                              style={styles.examQuestionItem}>
                              <Text style={styles.questionText}>
                                {item.year} · {item.question}
                                {item.marks ? ` (${item.marks} marks)` : ''}
                              </Text>
                              {Boolean(coveredYears.size) && (
                                <Text style={styles.recurrenceText}>
                                  ★ Observed {occurrences}x across {coveredYears.size}{' '}
                                  reviewed exam years
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Rapid Revision Box */}
                    {Object.values(unit.rapidRevision || {}).some(Boolean) && (
                      <View style={styles.revisionBox}>
                        <Text style={styles.revisionHeading}>
                          ⚡ Rapid Revision Summary
                        </Text>
                        {Object.entries(unit.rapidRevision || {})
                          .filter(([, val]) => Boolean(val))
                          .map(([key, val]) => (
                            <Text key={key} style={styles.revisionPoint}>
                              • <Text style={styles.bold}>{key}:</Text> {val}
                            </Text>
                          ))}
                      </View>
                    )}

                    {/* 10-Mark Structured Outline */}
                    {Object.values(unit.quickSummary || {}).some(Boolean) && (
                      <View style={styles.outlineBox}>
                        <Text style={styles.outlineHeading}>
                          📋 10-Mark Answer Outline
                        </Text>
                        {Object.entries(unit.quickSummary || {})
                          .filter(([, val]) => Boolean(val))
                          .map(([key, val]) => (
                            <Text key={key} style={styles.outlinePoint}>
                              {key}: {val}
                            </Text>
                          ))}
                      </View>
                    )}
                  </AppCard>
                ))
              ) : (
                <AppCard style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    {highYieldOnly
                      ? 'No high-yield units tagged'
                      : 'No units available yet'}
                  </Text>
                  <Text style={styles.emptyMuted}>
                    {highYieldOnly
                      ? 'Turn off the high-yield filter above to see all syllabus units.'
                      : 'Syllabus content for this subject is being added by administrators.'}
                  </Text>
                </AppCard>
              )}
            </>
          ) : (
            /* Career Bridge View */
            <AppCard style={styles.careerContainer}>
              <BadgePill label="CAREER BRIDGE" variant="indigo" />
              <Text style={styles.careerTitle}>
                Subject-Mapped Career Practice
              </Text>
              <Text style={styles.careerSubtitle}>
                Connect this subject to technical interviews, LeetCode practice,
                and GATE preparation.
              </Text>

              {/* Difficulty Filter Chips */}
              <Text style={styles.filterGroupTitle}>Difficulty Level</Text>
              <View style={styles.chipRow}>
                {['All', 'Easy', 'Medium', 'Hard'].map(val => (
                  <Pressable
                    key={val}
                    accessibilityRole="tab"
                    accessibilityState={{selected: difficultyFilter === val}}
                    onPress={() => setDifficultyFilter(val)}
                    style={[
                      styles.filterChip,
                      difficultyFilter === val && styles.filterChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        difficultyFilter === val && styles.filterChipTextActive,
                      ]}>
                      {val}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Company Filter Chips */}
              {Boolean(
                career?.interviewQuestions?.some(item => item.companies?.length),
              ) && (
                <>
                  <Text style={styles.filterGroupTitle}>Target Company</Text>
                  <View style={styles.chipRow}>
                    {[
                      'All',
                      ...Array.from(
                        new Set(
                          (career?.interviewQuestions || []).flatMap(
                            item => item.companies || [],
                          ),
                        ),
                      ),
                    ].map(val => (
                      <Pressable
                        key={val}
                        accessibilityRole="tab"
                        accessibilityState={{selected: companyFilter === val}}
                        onPress={() => setCompanyFilter(val)}
                        style={[
                          styles.filterChip,
                          companyFilter === val && styles.filterChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.filterChipText,
                            companyFilter === val && styles.filterChipTextActive,
                          ]}>
                          {val}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Technical Interview Questions */}
              {Boolean(career?.interviewQuestions?.length) && (
                <View style={styles.careerSection}>
                  <SectionHeading
                    title="Interview Questions"
                    eyebrow="TECHNICAL PREP"
                  />
                  {(career?.interviewQuestions || [])
                    .filter(
                      item =>
                        (difficultyFilter === 'All' ||
                          item.difficulty === difficultyFilter) &&
                        (companyFilter === 'All' ||
                          item.companies?.includes(companyFilter)),
                    )
                    .map((item, idx) => {
                      const isComplete = completedCareer.has(
                        `INTERVIEW_QUESTION:${item._id}`,
                      );
                      const isPending = pendingCareer.has(
                        `INTERVIEW_QUESTION:${item._id}`,
                      );

                      return (
                        <View key={item._id || idx} style={styles.careerRow}>
                          <Text style={styles.questionTitle}>{item.question}</Text>
                          <Text style={styles.careerTagLine}>
                            {[
                              item.topic,
                              item.difficulty,
                              item.companies?.join(', '),
                            ]
                              .filter(Boolean)
                              .join('  ·  ')}
                          </Text>

                          {Boolean(item.answerMarkdown) && (
                            <View style={styles.answerBox}>
                              <Text style={styles.answerText}>
                                {item.answerMarkdown}
                              </Text>
                            </View>
                          )}

                          {Boolean(item._id) && (
                            <Pressable
                              accessibilityRole="checkbox"
                              accessibilityState={{
                                checked: isComplete,
                                disabled: isPending,
                              }}
                              disabled={isPending}
                              onPress={() =>
                                setCareerCompleted(
                                  'INTERVIEW_QUESTION',
                                  item._id!,
                                )
                              }
                              style={[
                                styles.checkButton,
                                isComplete && styles.checkButtonDone,
                              ]}>
                              {isPending ? (
                                <ActivityIndicator size="small" color="#315cf5" />
                              ) : (
                                <Text
                                  style={[
                                    styles.checkButtonText,
                                    isComplete && styles.checkButtonTextDone,
                                  ]}>
                                  {isComplete
                                    ? '✓ Concept Understood'
                                    : 'Mark Understood'}
                                </Text>
                              )}
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                </View>
              )}

              {/* Coding Practice Links */}
              {Boolean(career?.codingLinks?.length) && (
                <View style={styles.careerSection}>
                  <SectionHeading
                    title="Coding Problems"
                    eyebrow="LEETCODE & PLATFORMS"
                  />
                  {(career?.codingLinks || [])
                    .filter(
                      item =>
                        difficultyFilter === 'All' ||
                        item.difficulty === difficultyFilter,
                    )
                    .map((item, idx) => {
                      const isSolved = completedCareer.has(
                        `CODING_LINK:${item._id}`,
                      );
                      const isPending = pendingCareer.has(
                        `CODING_LINK:${item._id}`,
                      );

                      return (
                        <View key={item._id || idx} style={styles.careerRow}>
                          <Pressable
                            accessibilityRole="link"
                            onPress={() => openResource(item.url)}
                            style={styles.resourcePressable}>
                            <Text numberOfLines={2} style={styles.linkTitle}>
                              {item.platform || 'Code'} · {item.title}
                            </Text>
                            <Text style={styles.openText}>Solve ↗</Text>
                          </Pressable>

                          {Boolean(item._id) && (
                            <View style={styles.actionRow}>
                              <Pressable
                                accessibilityRole="checkbox"
                                accessibilityState={{
                                  checked: isSolved,
                                  disabled: isPending,
                                }}
                                disabled={isPending}
                                onPress={() =>
                                  setCareerCompleted('CODING_LINK', item._id!)
                                }
                                style={[
                                  styles.checkButton,
                                  isSolved && styles.checkButtonDone,
                                ]}>
                                {isPending ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#315cf5"
                                  />
                                ) : (
                                  <Text
                                    style={[
                                      styles.checkButtonText,
                                      isSolved && styles.checkButtonTextDone,
                                    ]}>
                                    {isSolved ? '✓ Problem Solved' : 'Mark Solved'}
                                  </Text>
                                )}
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                  reportBrokenLink(item._id!, 'CODING_LINK')
                                }>
                                <Text style={styles.reportText}>Report</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              )}

              {/* GATE PYQ Section */}
              {Boolean(gate?.pyqs?.length) && (
                <View style={styles.careerSection}>
                  <SectionHeading
                    title="GATE Past Questions"
                    eyebrow="EXAM WEIGHTAGE"
                  />
                  {(gate?.pyqs || []).map((item, idx) => (
                    <View key={item._id || idx} style={styles.careerRow}>
                      <Pressable
                        accessibilityRole="link"
                        onPress={() => openResource(item.url)}
                        style={styles.resourcePressable}>
                        <Text numberOfLines={2} style={styles.linkTitle}>
                          {item.year || 'GATE'} · {item.topic || item.title}
                        </Text>
                        <Text style={styles.openText}>Open ↗</Text>
                      </Pressable>
                      {Boolean(item._id) && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() =>
                            reportBrokenLink(item._id!, 'GATE_PYQ')
                          }
                          style={styles.reportButton}>
                          <Text style={styles.reportText}>
                            Report broken link
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </AppCard>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ResourceList({
  title,
  icon,
  resources,
  onOpen,
}: {
  title: string;
  icon: string;
  resources?: Resource[];
  onOpen: (url?: string) => void;
}): React.JSX.Element | null {
  if (!resources?.length) return null;
  return (
    <View style={styles.resourceBlock}>
      <Text style={styles.resourceBlockHeader}>
        {icon}  {title}
      </Text>
      {resources.map((res, index) => (
        <Pressable
          key={res._id || index}
          accessibilityRole="link"
          accessibilityLabel={`Open ${res.title}`}
          onPress={() => onOpen(res.link || res.url)}
          style={({pressed}) => [
            styles.resourceItem,
            pressed && styles.resourceItemPressed,
          ]}>
          <Text numberOfLines={2} style={styles.resourceItemTitle}>
            {res.title}
          </Text>
          <Text style={styles.resourceItemAction}>Open ↗</Text>
        </Pressable>
      ))}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 16,
  },
  heroCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.titleMd,
    fontSize: 22,
    lineHeight: 28,
    marginTop: spacing.xs + 2,
  },
  heroMeta: {
    ...typography.bodySm,
    marginTop: spacing.xxs + 2,
    color: colors.textMuted,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginVertical: spacing.xs + 2,
  },
  segmentTab: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  segmentTabActive: {
    backgroundColor: colors.primarySubtle,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  progressCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryBorder,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  progressCopy: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  progressSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chevron: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  highYieldBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  highYieldBarActive: {
    backgroundColor: colors.warning.bg,
    borderColor: colors.warning.border,
  },
  highYieldIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  highYieldLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  highYieldLabelActive: {
    color: colors.warning.text,
  },
  highYieldIndicator: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
  },
  unitCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitTopicCounter: {
    ...typography.caption,
    color: colors.textFaint,
  },
  unitTitle: {
    ...typography.titleSm,
    fontSize: 18,
    lineHeight: 23,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  topicContainer: {
    marginTop: spacing.xxs,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.textFaint,
  },
  topicBulletHigh: {
    backgroundColor: colors.warning.indicator,
    width: 8,
    height: 8,
  },
  topicCopy: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  topicImportance: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textFaint,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  topicImportanceHigh: {
    color: colors.warning.text,
  },
  mutedText: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginVertical: spacing.xs,
  },
  resourceBlock: {
    marginTop: spacing.md,
  },
  resourceBlockHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.sm,
    marginBottom: spacing.xxs,
  },
  resourceItemPressed: {
    backgroundColor: colors.primarySubtle,
  },
  resourceItemTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  resourceItemAction: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  examSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  examQuestionItem: {
    marginBottom: spacing.xs,
    paddingBottom: spacing.xxs,
  },
  questionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning.text,
    marginTop: 2,
  },
  revisionBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
  },
  revisionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  revisionPoint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 3,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  outlineBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  outlineHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  outlinePoint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 3,
  },
  careerContainer: {
    padding: spacing.md,
  },
  careerTitle: {
    ...typography.titleSm,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  careerSubtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  filterGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs + 2,
    marginBottom: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryBorder,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  careerSection: {
    marginTop: spacing.md,
  },
  careerRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    color: colors.textPrimary,
  },
  careerTagLine: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textFaint,
    marginTop: 3,
  },
  answerBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  answerText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  checkButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  checkButtonDone: {
    backgroundColor: colors.success.bg,
  },
  checkButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  checkButtonTextDone: {
    color: colors.success.text,
  },
  resourcePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  linkTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  openText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  reportText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger.text,
  },
  reportButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.titleSm,
    textAlign: 'center',
  },
  emptyMuted: {
    ...typography.bodySm,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
});
