import React, {useCallback, useRef, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {getApiErrorMessage, studyToolsApi, subjectApi} from '../services/api';
import {
  attendanceForecast,
  calculateCgpa,
  calculateSgpa,
  requiredExternalMarks,
} from '../utils/studyCalculations';
import {
  AppCard,
  AppHeader,
  BadgePill,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SectionHeading,
} from '../components';
import {colors, radii, spacing, typography} from '../theme';

type Assessment = {
  name: string;
  category: string;
  marks: number | string;
  maxMarks: number | string;
};
type Attendance = {
  subject?: string | null;
  subjectName: string;
  classesHeld: number | string;
  classesAttended: number | string;
  threshold: number | string;
};
type Sessional = {
  subject?: string | null;
  subjectName: string;
  internalMaximum: number | string;
  externalMaximum: number | string;
  targetPercent: number | string;
  assessments: Assessment[];
};
type Subject = {
  _id: string;
  name: string;
  courseCode?: string;
  credits?: number;
};
type GradeBand = {
  label: string;
  minimumPercent: number;
  gradePoint: number;
};

const DEFAULT_SCALE: GradeBand[] = [
  {label: 'A+', minimumPercent: 90, gradePoint: 10},
  {label: 'A', minimumPercent: 80, gradePoint: 9},
  {label: 'B+', minimumPercent: 70, gradePoint: 8},
  {label: 'B', minimumPercent: 60, gradePoint: 7},
  {label: 'C', minimumPercent: 50, gradePoint: 6},
  {label: 'D', minimumPercent: 40, gradePoint: 5},
  {label: 'F', minimumPercent: 0, gradePoint: 0},
];

const EMPTY_OVERALL: {
  classesHeld: number | string;
  classesAttended: number | string;
  threshold: number | string;
} = {classesHeld: 0, classesAttended: 0, threshold: 75};

const CATEGORIES = ['MIDTERM', 'CLASS_TEST', 'LAB_VIVA', 'OTHER'];
type Tab = 'attendance' | 'sessionals' | 'planner';

export function StudyToolsScreen(): React.JSX.Element {
  const {user} = useAuth();
  const [tab, setTab] = useState<Tab>('attendance');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [overall, setOverall] = useState(EMPTY_OVERALL);
  const [sessionals, setSessionals] = useState<Sessional[]>([]);
  const [planner, setPlanner] = useState<{
    previousCgpa: number | string;
    completedCredits: number | string;
    targetCgpa: number | string;
    gradeScale: GradeBand[];
  }>({
    previousCgpa: 0,
    completedCredits: 0,
    targetCgpa: 8.5,
    gradeScale: DEFAULT_SCALE,
  });
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [toolsResponse, subjectsResponse] = await Promise.all([
        studyToolsApi.get(),
        subjectApi.getSubjects(),
      ]);
      const tools = toolsResponse.data as {
        attendance?: Attendance[];
        overallAttendance?: typeof EMPTY_OVERALL;
        sessionals?: Sessional[];
        planner?: {
          previousCgpa?: number;
          completedCredits?: number;
          targetCgpa?: number;
          gradeScale?: GradeBand[];
          projections?: Array<{subject: string; percent: number}>;
        };
      };
      const nextSubjects =
        (subjectsResponse.data as {subjects?: Subject[]}).subjects || [];
      const attendanceBySubject = new Map(
        (tools.attendance || [])
          .filter(row => row.subject)
          .map(row => [String(row.subject), row]),
      );
      const sessionalBySubject = new Map(
        (tools.sessionals || [])
          .filter(row => row.subject)
          .map(row => [String(row.subject), row]),
      );

      setSubjects(nextSubjects);
      setAttendance([
        ...(tools.attendance || []),
        ...nextSubjects
          .filter(subject => !attendanceBySubject.has(subject._id))
          .map(subject => ({
            subject: subject._id,
            subjectName: subject.name,
            classesHeld: 0,
            classesAttended: 0,
            threshold: 75,
          })),
      ]);
      setOverall({...EMPTY_OVERALL, ...(tools.overallAttendance || {})});
      setSessionals([
        ...(tools.sessionals || []),
        ...nextSubjects
          .filter(subject => !sessionalBySubject.has(subject._id))
          .map(subject => ({
            subject: subject._id,
            subjectName: subject.name,
            internalMaximum: 40,
            externalMaximum: 60,
            targetPercent: 40,
            assessments: [],
          })),
      ]);
      const nextPlanner = {...planner, ...(tools.planner || {})};
      if (!nextPlanner.gradeScale?.length) nextPlanner.gradeScale = DEFAULT_SCALE;
      setPlanner(nextPlanner);
      setMarks(
        Object.fromEntries(
          nextSubjects.map(subject => {
            const stored = tools.planner?.projections?.find(
              item => String(item.subject) === subject._id,
            );
            return [subject._id, stored ? String(stored.percent) : ''];
          }),
        ),
      );
      hasLoaded.current = true;
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Could not load your saved study tools.'),
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded.current) {
        load().catch(unexpectedError => {
          setError(
            getApiErrorMessage(unexpectedError, 'Could not load your study tools.'),
          );
          setLoading(false);
        });
      }
    }, [load]),
  );

  const updateAttendance = (
    index: number,
    field: 'classesHeld' | 'classesAttended' | 'threshold',
    value: string,
  ) =>
    setAttendance(rows =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? {...row, [field]: value} : row,
      ),
    );

  const updateSessional = (
    index: number,
    field: 'internalMaximum' | 'externalMaximum' | 'targetPercent',
    value: string,
  ) =>
    setSessionals(rows =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? {...row, [field]: value} : row,
      ),
    );

  const updateAssessment = (
    rowIndex: number,
    assessmentIndex: number,
    field: keyof Assessment,
    value: string,
  ) =>
    setSessionals(rows =>
      rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              assessments: row.assessments.map((assessment, itemIndex) =>
                itemIndex === assessmentIndex
                  ? {...assessment, [field]: value}
                  : assessment,
              ),
            }
          : row,
      ),
    );

  const save = async () => {
    setError('');
    setNotice('');
    setSaving(true);
    try {
      if (tab === 'attendance') {
        const records = [
          ...attendance,
          {subjectName: 'Overall attendance', ...overall},
        ];
        const invalid = records.some(item => attendanceForecast(item).error);
        if (invalid) {
          throw new Error(
            'Check that class counts are whole numbers and attended classes do not exceed classes held.',
          );
        }
        await studyToolsApi.saveAttendance(
          attendance.map(item => ({
            ...item,
            classesHeld: Number(item.classesHeld),
            classesAttended: Number(item.classesAttended),
            threshold: Number(item.threshold),
          })),
          {
            classesHeld: Number(overall.classesHeld),
            classesAttended: Number(overall.classesAttended),
            threshold: Number(overall.threshold),
          },
        );
      } else if (tab === 'sessionals') {
        if (
          sessionals.some(
            item =>
              !item.subjectName.trim() ||
              requiredExternalMarks(item).error ||
              item.assessments.some(
                row =>
                  !row.name.trim() ||
                  String(row.marks).trim() === '' ||
                  String(row.maxMarks).trim() === '' ||
                  !CATEGORIES.includes(row.category),
              ),
          )
        ) {
          throw new Error(
            'Check subject names, maximum marks, target percentage, and assessment scores.',
          );
        }
        await studyToolsApi.saveSessionals(
          sessionals.map(item => ({
            ...item,
            internalMaximum: Number(item.internalMaximum),
            externalMaximum: Number(item.externalMaximum),
            targetPercent: Number(item.targetPercent),
            assessments: item.assessments.map(row => ({
              ...row,
              marks: Number(row.marks),
              maxMarks: Number(row.maxMarks),
            })),
          })),
        );
      } else {
        if (user?.track !== 'UNIVERSITY') {
          throw new Error('The credit planner is available for university students.');
        }
        const previousCgpa = Number(planner.previousCgpa);
        const completedCredits = Number(planner.completedCredits);
        const targetCgpa = Number(planner.targetCgpa);
        if (
          [planner.previousCgpa, planner.completedCredits, planner.targetCgpa].some(
            val => String(val).trim() === '',
          ) ||
          ![previousCgpa, completedCredits, targetCgpa].every(Number.isFinite) ||
          previousCgpa < 0 ||
          previousCgpa > 10 ||
          completedCredits < 0 ||
          targetCgpa < 0 ||
          targetCgpa > 10
        ) {
          throw new Error(
            'Enter a valid CGPA, completed credit count, and target (CGPA 0–10).',
          );
        }
        const projectedRows = subjects.filter(subject => marks[subject._id] !== '');
        if (
          projectedRows.some(
            subject =>
              !Number.isFinite(Number(marks[subject._id])) ||
              Number(marks[subject._id]) < 0 ||
              Number(marks[subject._id]) > 100,
          )
        ) {
          throw new Error('Projected marks must be between 0 and 100%.');
        }
        await studyToolsApi.savePlanner({
          previousCgpa,
          completedCredits,
          targetCgpa,
          gradeScale: planner.gradeScale,
          projections: projectedRows.map(subject => ({
            subject: subject._id,
            percent: Number(marks[subject._id]),
          })),
        });
      }
      setNotice('Saved successfully. Synced with your web account.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : getApiErrorMessage(saveError, 'Could not save your changes.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const overallForecast = attendanceForecast(overall);
  const projections = subjects
    .filter(subject => marks[subject._id] !== '')
    .map(subject => ({
      credits: Number(subject.credits) || 0,
      percent: marks[subject._id],
    }));
  const sgpa = calculateSgpa(projections, planner.gradeScale);
  const currentCredits = projections.reduce(
    (sum, item) => sum + (item.credits > 0 ? item.credits : 0),
    0,
  );
  const allCreditSubjectsProjected = subjects
    .filter(subject => Number(subject.credits) > 0)
    .every(subject => marks[subject._id] !== '');
  const cgpa = allCreditSubjectsProjected
    ? calculateCgpa(
        planner.previousCgpa,
        planner.completedCredits,
        sgpa,
        currentCredits,
      )
    : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <AppHeader
        eyebrow="PLAN YOUR SEMESTER"
        title="Daily study tools"
        subtitle="Attendance forecasts, internal marks, and SGPA/CGPA modeling."
      />

      {/* Classical Segmented Tab Switch */}
      <View style={styles.tabContainer}>
        {(['attendance', 'sessionals', 'planner'] as Tab[]).map(val => (
          <Pressable
            key={val}
            accessibilityRole="tab"
            accessibilityState={{selected: tab === val}}
            onPress={() => {
              setTab(val);
              setError('');
              setNotice('');
            }}
            style={[styles.tabButton, tab === val && styles.tabButtonActive]}>
            <Text
              style={[styles.tabButtonText, tab === val && styles.tabButtonTextActive]}>
              {val === 'attendance'
                ? 'Attendance'
                : val === 'sessionals'
                ? 'Internal Marks'
                : 'SGPA / CGPA'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <LoadingState message="Loading your saved study tools…" minHeight={200} />
      ) : error && !attendance.length && !sessionals.length ? (
        <ErrorState
          title="Study tools unavailable"
          message={error}
          onRetry={load}
        />
      ) : (
        <>
          {/* TAB 1: ATTENDANCE */}
          {tab === 'attendance' && (
            <>
              {/* Overall Attendance Card */}
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <BadgePill label="OVERALL" variant="blue" />
                  <Text style={styles.cardHeaderTitle}>Semester Aggregate</Text>
                </View>

                <View style={styles.fieldsRow}>
                  <NumberInputField
                    label="Classes Held"
                    value={overall.classesHeld}
                    onChange={val =>
                      setOverall(curr => ({...curr, classesHeld: val}))
                    }
                  />
                  <NumberInputField
                    label="Attended"
                    value={overall.classesAttended}
                    onChange={val =>
                      setOverall(curr => ({...curr, classesAttended: val}))
                    }
                  />
                </View>

                <NumberInputField
                  label="Required Criteria %"
                  value={overall.threshold}
                  onChange={val =>
                    setOverall(curr => ({...curr, threshold: val}))
                  }
                />

                {overallForecast.error ? (
                  <Text style={styles.errorText}>{overallForecast.error}</Text>
                ) : (
                  <View
                    style={[
                      styles.forecastBox,
                      (overallForecast.percent ?? 0) >= Number(overall.threshold)
                        ? styles.forecastSafe
                        : styles.forecastWarning,
                    ]}>
                    <Text
                      style={[
                        styles.forecastPercent,
                        (overallForecast.percent ?? 0) >=
                        Number(overall.threshold)
                          ? styles.forecastPercentSafe
                          : styles.forecastPercentWarning,
                      ]}>
                      {overallForecast.percent === null
                        ? '—'
                        : `${overallForecast.percent.toFixed(1)}%`}
                    </Text>
                    <Text style={styles.forecastMessage}>
                      {overallForecast.message}
                    </Text>
                  </View>
                )}
              </AppCard>

              {/* By-Subject Attendance */}
              <SectionHeading
                eyebrow="COURSEWISE"
                title="Subject Breakdown"
              />

              {attendance.length ? (
                attendance.map((item, index) => {
                  const forecast = attendanceForecast(item);
                  const isSafe =
                    (forecast.percent ?? 0) >= Number(item.threshold);

                  return (
                    <AppCard
                      key={item.subject || `${item.subjectName}-${index}`}
                      style={styles.card}>
                      <Text style={styles.subjectCardTitle}>
                        {item.subjectName}
                      </Text>

                      <View style={styles.fieldsRow}>
                        <NumberInputField
                          label="Classes Held"
                          value={item.classesHeld}
                          onChange={val =>
                            updateAttendance(index, 'classesHeld', val)
                          }
                        />
                        <NumberInputField
                          label="Attended"
                          value={item.classesAttended}
                          onChange={val =>
                            updateAttendance(index, 'classesAttended', val)
                          }
                        />
                      </View>

                      <NumberInputField
                        label="Required %"
                        value={item.threshold}
                        onChange={val =>
                          updateAttendance(index, 'threshold', val)
                        }
                      />

                      {forecast.error ? (
                        <Text style={styles.errorText}>{forecast.error}</Text>
                      ) : (
                        <View
                          style={[
                            styles.forecastBox,
                            isSafe ? styles.forecastSafe : styles.forecastWarning,
                          ]}>
                          <Text
                            style={[
                              styles.forecastPercent,
                              isSafe
                                ? styles.forecastPercentSafe
                                : styles.forecastPercentWarning,
                            ]}>
                            {forecast.percent === null
                              ? '—'
                              : `${forecast.percent.toFixed(1)}%`}
                          </Text>
                          <Text style={styles.forecastMessage}>
                            {forecast.message}
                          </Text>
                        </View>
                      )}
                    </AppCard>
                  );
                })
              ) : (
                <EmptyState
                  icon="📚"
                  title="No subjects registered"
                  description="Add subjects to your academic profile to track attendance per subject."
                />
              )}
            </>
          )}

          {/* TAB 2: INTERNAL MARKS (SESSIONALS) */}
          {tab === 'sessionals' && (
            <>
              <SectionHeading
                eyebrow="PASSING & CRITERIA"
                title="Internal & External Targets"
              />

              {sessionals.map((item, index) => {
                const result = requiredExternalMarks(item);

                return (
                  <AppCard
                    key={item.subject || `${item.subjectName}-${index}`}
                    style={styles.card}>
                    <Text style={styles.subjectCardTitle}>
                      {item.subjectName}
                    </Text>

                    <View style={styles.fieldsRow}>
                      <NumberInputField
                        label="Internal Max"
                        value={item.internalMaximum}
                        onChange={val =>
                          updateSessional(index, 'internalMaximum', val)
                        }
                      />
                      <NumberInputField
                        label="External Max"
                        value={item.externalMaximum}
                        onChange={val =>
                          updateSessional(index, 'externalMaximum', val)
                        }
                      />
                    </View>

                    <NumberInputField
                      label="Target Passing Aggregate %"
                      value={item.targetPercent}
                      onChange={val =>
                        updateSessional(index, 'targetPercent', val)
                      }
                    />

                    {/* Assessments Breakdown */}
                    {item.assessments.map((assessment, assessmentIndex) => (
                      <View
                        key={`${index}-${assessmentIndex}`}
                        style={styles.assessmentItem}>
                        <TextInput
                          accessibilityLabel="Assessment name"
                          value={assessment.name}
                          onChangeText={val =>
                            updateAssessment(index, assessmentIndex, 'name', val)
                          }
                          placeholder="e.g. Midterm 1, Class Test"
                          placeholderTextColor={colors.textFaint}
                          style={styles.assessmentNameInput}
                        />

                        <View style={styles.fieldsRow}>
                          <NumberInputField
                            label="Score"
                            value={assessment.marks}
                            onChange={val =>
                              updateAssessment(index, assessmentIndex, 'marks', val)
                            }
                          />
                          <NumberInputField
                            label="Maximum"
                            value={assessment.maxMarks}
                            onChange={val =>
                              updateAssessment(
                                index,
                                assessmentIndex,
                                'maxMarks',
                                val,
                              )
                            }
                          />
                        </View>

                        <View style={styles.categoryRow}>
                          {CATEGORIES.map(category => (
                            <Pressable
                              key={category}
                              accessibilityRole="radio"
                              accessibilityState={{
                                selected: assessment.category === category,
                              }}
                              onPress={() =>
                                updateAssessment(
                                  index,
                                  assessmentIndex,
                                  'category',
                                  category,
                                )
                              }
                              style={[
                                styles.categoryChip,
                                assessment.category === category &&
                                  styles.categoryChipActive,
                              ]}>
                              <Text
                                style={[
                                  styles.categoryChipText,
                                  assessment.category === category &&
                                    styles.categoryChipTextActive,
                                ]}>
                                {category.replace('_', ' ')}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}

                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setSessionals(rows =>
                          rows.map((row, rIndex) =>
                            rIndex === index
                              ? {
                                  ...row,
                                  assessments: [
                                    ...row.assessments,
                                    {
                                      name: '',
                                      category: 'OTHER',
                                      marks: '',
                                      maxMarks: '',
                                    },
                                  ],
                                }
                              : row,
                          ),
                        )
                      }
                      style={styles.addAssessmentBtn}>
                      <Text style={styles.addAssessmentText}>
                        + Add Sessional Assessment
                      </Text>
                    </Pressable>

                    {result.error ? (
                      <Text style={styles.errorText}>{result.error}</Text>
                    ) : (
                      <View
                        style={[
                          styles.forecastBox,
                          result.achievable
                            ? styles.forecastSafe
                            : styles.forecastWarning,
                        ]}>
                        <Text
                          style={[
                            styles.forecastPercent,
                            result.achievable
                              ? styles.forecastPercentSafe
                              : styles.forecastPercentWarning,
                          ]}>
                          {result.achievable
                            ? `${result.needed.toFixed(1)} marks required`
                            : 'Score target not achievable'}
                        </Text>
                        <Text style={styles.forecastMessage}>
                          Required in external exam to meet your target
                          aggregate.
                        </Text>
                      </View>
                    )}
                  </AppCard>
                );
              })}

              {!sessionals.length && (
                <EmptyState
                  icon="📝"
                  title="No subjects to track"
                  description="Add subjects in your academic profile to track internal tests and sessional marks."
                />
              )}
            </>
          )}

          {/* TAB 3: SGPA / CGPA PLANNER */}
          {tab === 'planner' &&
            (user?.track !== 'UNIVERSITY' ? (
              <EmptyState
                icon="🎓"
                title="Credit planner"
                description="The SGPA/CGPA credit planner is tailored for university students with credit-based grading."
              />
            ) : (
              <>
                <AppCard style={styles.card}>
                  <Text style={styles.cardHeaderTitle}>Starting Benchmark</Text>

                  <View style={styles.fieldsRow}>
                    <NumberInputField
                      label="Previous CGPA"
                      value={planner.previousCgpa}
                      onChange={val =>
                        setPlanner(curr => ({...curr, previousCgpa: val}))
                      }
                    />
                    <NumberInputField
                      label="Completed Credits"
                      value={planner.completedCredits}
                      onChange={val =>
                        setPlanner(curr => ({...curr, completedCredits: val}))
                      }
                    />
                  </View>

                  <NumberInputField
                    label="Target CGPA"
                    value={planner.targetCgpa}
                    onChange={val =>
                      setPlanner(curr => ({...curr, targetCgpa: val}))
                    }
                  />

                  <Text style={styles.scaleHeader}>
                    Saved University Grade Bands
                  </Text>
                  <View style={styles.scaleRow}>
                    {planner.gradeScale.map(band => (
                      <BadgePill
                        key={`${band.label}-${band.minimumPercent}`}
                        label={`${band.label} ≥ ${band.minimumPercent}%`}
                        variant="muted"
                      />
                    ))}
                  </View>
                </AppCard>

                <AppCard style={styles.card}>
                  <Text style={styles.cardHeaderTitle}>
                    Semester Projections
                  </Text>
                  <Text style={styles.cardMuted}>
                    Enter your expected score percentage in each credit subject.
                  </Text>

                  {subjects
                    .filter(sub => Number(sub.credits) > 0)
                    .map(subject => (
                      <View key={subject._id} style={styles.projectionRow}>
                        <View style={styles.projectionCopy}>
                          <Text numberOfLines={1} style={styles.projectionName}>
                            {subject.name}
                          </Text>
                          <Text style={styles.projectionCredits}>
                            {subject.credits} Credits
                          </Text>
                        </View>
                        <TextInput
                          accessibilityLabel={`${subject.name} projected percentage`}
                          value={marks[subject._id] || ''}
                          onChangeText={val =>
                            setMarks(curr => ({...curr, [subject._id]: val}))
                          }
                          keyboardType="decimal-pad"
                          placeholder="%"
                          placeholderTextColor={colors.textFaint}
                          style={styles.percentInput}
                        />
                      </View>
                    ))}

                  {!subjects.some(sub => Number(sub.credits) > 0) && (
                    <Text style={styles.mutedText}>
                      Credit weights not assigned to subjects in this semester.
                    </Text>
                  )}

                  <View style={styles.forecastBox}>
                    <Text style={styles.forecastPercent}>
                      SGPA {sgpa === null ? '—' : sgpa.toFixed(2)}
                    </Text>
                    <Text style={styles.forecastMessage}>
                      Projected CGPA:{' '}
                      <Text style={styles.bold}>
                        {cgpa === null ? '—' : cgpa.toFixed(2)}
                      </Text>
                      {!allCreditSubjectsProjected
                        ? ' · complete all credit projections for CGPA'
                        : ''}
                    </Text>
                  </View>
                </AppCard>
              </>
            ))}

          {/* Feedback Alerts */}
          {Boolean(error) && (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          )}

          {Boolean(notice) && (
            <View style={styles.noticeAlert}>
              <Text style={styles.noticeAlertText}>{notice}</Text>
            </View>
          )}

          {/* Save Action */}
          <PrimaryButton
            label={
              saving
                ? 'Saving Changes…'
                : `Save ${
                    tab === 'attendance'
                      ? 'Attendance'
                      : tab === 'sessionals'
                      ? 'Marks'
                      : 'Planner'
                  }`
            }
            loading={saving}
            disabled={saving}
            onPress={save}
            variant="dark"
            style={styles.saveBtn}
          />
        </>
      )}
    </ScrollView>
  );
}

function NumberInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (val: string) => void;
}): React.JSX.Element {
  return (
    <View style={styles.numberField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={String(value ?? '')}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
      />
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
    paddingBottom: spacing.xxl + 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.primarySubtle,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardHeaderTitle: {
    ...typography.titleSm,
    fontSize: 15,
  },
  subjectCardTitle: {
    ...typography.titleSm,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardMuted: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numberField: {
    flex: 1,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  forecastBox: {
    marginTop: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.primarySubtle,
  },
  forecastSafe: {
    backgroundColor: colors.success.bg,
  },
  forecastWarning: {
    backgroundColor: colors.warning.bg,
  },
  forecastPercent: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  forecastPercentSafe: {
    color: colors.success.text,
  },
  forecastPercentWarning: {
    color: colors.warning.text,
  },
  forecastMessage: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger.text,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  assessmentItem: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
  },
  assessmentNameInput: {
    height: 40,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  categoryChipActive: {
    backgroundColor: colors.primarySubtle,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  addAssessmentBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  addAssessmentText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  scaleHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  projectionCopy: {
    flex: 1,
  },
  projectionName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  projectionCredits: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  percentInput: {
    width: 64,
    height: 40,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: spacing.xs,
  },
  bold: {
    fontWeight: '800',
  },
  errorAlert: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.danger.bg,
    borderWidth: 1,
    borderColor: colors.danger.border,
  },
  errorAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger.text,
  },
  noticeAlert: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.success.bg,
    borderWidth: 1,
    borderColor: colors.success.border,
  },
  noticeAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success.text,
  },
  saveBtn: {
    alignSelf: 'stretch',
    minHeight: 48,
    marginTop: spacing.md,
  },
});
