import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {createAdaptiveStyles} from '../theme';

type InterviewQuestion = {question?: string; answerMarkdown?: string; companies?: string[] | string; topic?: string; difficulty?: string; isPremium?: boolean; [key: string]: unknown};
type CodingLink = {title?: string; platform?: string; url?: string; topic?: string; difficulty?: string; isPremium?: boolean; [key: string]: unknown};
type GatePyq = {title?: string; year?: number | string; topic?: string; url?: string; isPremium?: boolean; [key: string]: unknown};
export type CareerBridgeValue = {
  interviewQuestions?: InterviewQuestion[];
  codingLinks?: CodingLink[];
  gate?: {examCode?: string; weightageMinMarks?: number | string | null; weightageMaxMarks?: number | string | null; weightagePeriod?: string; pyqs?: GatePyq[]; [key: string]: unknown};
  [key: string]: unknown;
};

const emptyValue = (): CareerBridgeValue => ({interviewQuestions: [], codingLinks: [], gate: {examCode: 'GATE CS', weightageMinMarks: null, weightageMaxMarks: null, weightagePeriod: '', pyqs: []}});

export function normalizeCareerBridge(value: CareerBridgeValue): CareerBridgeValue {
  const cleanText = (input: unknown) => typeof input === 'string' ? input.trim() : '';
  const hasText = (...fields: unknown[]) => fields.some(field => Array.isArray(field) ? field.some(Boolean) : cleanText(field).length > 0);
  const requireUrl = (url: string, label: string) => {
    try {
      if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error();
    } catch {
      throw new Error(`${label} needs a valid HTTP or HTTPS URL.`);
    }
  };
  const interviewQuestions = (value.interviewQuestions || []).filter(item => hasText(item.question, item.answerMarkdown, item.companies, item.topic, item.difficulty)).map(item => {
    const question = cleanText(item.question);
    if (!question) throw new Error('Each interview question needs question text.');
    const companies = Array.isArray(item.companies) ? item.companies : cleanText(item.companies).split(',');
    const normalizedCompanies = [...new Set(companies.map(cleanText).filter(Boolean))];
    if (normalizedCompanies.length > 20 || normalizedCompanies.some(company => company.length > 60)) throw new Error('Use at most 20 company tags, with 60 characters or fewer per tag.');
    if (cleanText(item.answerMarkdown).length > 20000) throw new Error('Interview answers must be 20,000 characters or fewer.');
    return {...item, question, answerMarkdown: cleanText(item.answerMarkdown), topic: cleanText(item.topic), difficulty: cleanText(item.difficulty), companies: normalizedCompanies, isPremium: item.isPremium === true};
  });
  const codingLinks = (value.codingLinks || []).filter(item => hasText(item.title, item.platform, item.url, item.topic, item.difficulty)).map(item => {
    const title = cleanText(item.title);
    const url = cleanText(item.url);
    if (!title) throw new Error('Each coding resource needs a title.');
    requireUrl(url, `“${title}”`);
    return {...item, title, url, platform: cleanText(item.platform) || 'Other', topic: cleanText(item.topic), difficulty: cleanText(item.difficulty), isPremium: item.isPremium === true};
  });
  const gate = value.gate || {};
  const pyqs = (gate.pyqs || []).filter(item => hasText(item.title, item.year, item.topic, item.url)).map(item => {
    const title = cleanText(item.title);
    const url = cleanText(item.url);
    if (!title) throw new Error('Each GATE PYQ needs a title.');
    requireUrl(url, `“${title}”`);
    const yearText = item.year == null ? '' : String(item.year).trim();
    const year = yearText ? Number(yearText) : undefined;
    if (year !== undefined && (!Number.isInteger(year) || year < 1980 || year > 2100)) throw new Error(`Enter a valid year for “${title}” (1980–2100).`);
    return {...item, title, url, year, topic: cleanText(item.topic), isPremium: item.isPremium === true};
  });
  const parseWeight = (raw: number | string | null | undefined, label: string) => {
    if (raw == null || String(raw).trim() === '') return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) throw new Error(`${label} must be between 0 and 100 marks.`);
    return parsed;
  };
  const minimum = parseWeight(gate.weightageMinMarks, 'Minimum GATE weightage');
  const maximum = parseWeight(gate.weightageMaxMarks, 'Maximum GATE weightage');
  if (minimum != null && maximum != null && minimum > maximum) throw new Error('Maximum GATE weightage cannot be below the minimum.');
  return {
    ...value,
    interviewQuestions,
    codingLinks,
    gate: {
      ...gate,
      examCode: cleanText(gate.examCode) || 'GATE CS',
      weightageMinMarks: minimum,
      weightageMaxMarks: maximum,
      weightagePeriod: cleanText(gate.weightagePeriod),
      pyqs,
    },
  };
}

export function AdminCareerBridgeEditor({value, onChange}: {value: CareerBridgeValue; onChange: (value: CareerBridgeValue) => void}): React.JSX.Element {
  const data = {...emptyValue(), ...value, gate: {...emptyValue().gate, ...(value.gate || {})}} as CareerBridgeValue;
  const questions = data.interviewQuestions || [];
  const links = data.codingLinks || [];
  const gate = data.gate || {};
  const pyqs = gate.pyqs || [];
  const update = (patch: Partial<CareerBridgeValue>) => onChange({...data, ...patch});
  const updateQuestion = (index: number, patch: Partial<InterviewQuestion>) => update({interviewQuestions: questions.map((item, i) => i === index ? {...item, ...patch} : item)});
  const updateLink = (index: number, patch: Partial<CodingLink>) => update({codingLinks: links.map((item, i) => i === index ? {...item, ...patch} : item)});
  const updateGate = (patch: Partial<NonNullable<CareerBridgeValue['gate']>>) => update({gate: {...gate, ...patch}});
  const updatePyq = (index: number, patch: Partial<GatePyq>) => updateGate({pyqs: pyqs.map((item, i) => i === index ? {...item, ...patch} : item)});

  return <View>
    <Text style={styles.intro}>Add career resources with guided fields. The student app receives the same Career Bridge data shape as the website.</Text>
    <View style={styles.headingRow}><Text style={styles.section}>Interview questions</Text><AddButton label="Add question" onPress={() => update({interviewQuestions: [...questions, {question: '', answerMarkdown: '', companies: [], topic: '', difficulty: '', isPremium: false}]})}/></View>
    {questions.map((item, index) => <View key={String(item._id || index)} style={styles.card}>
      <CardHeading title={`Question ${index + 1}`} onRemove={() => update({interviewQuestions: questions.filter((_, i) => i !== index)})}/>
      <Field label="Question"><TextInput accessibilityLabel={`Interview question ${index + 1}`} value={item.question || ''} onChangeText={question => updateQuestion(index, {question})} multiline style={[styles.input, styles.multiline]} placeholder="Write the interview question"/></Field>
      <Field label="Answer (Markdown supported)"><TextInput accessibilityLabel={`Interview answer ${index + 1}`} value={item.answerMarkdown || ''} onChangeText={answerMarkdown => updateQuestion(index, {answerMarkdown})} multiline style={[styles.input, styles.multiline]}/></Field>
      <Field label="Companies (comma separated)"><TextInput accessibilityLabel={`Question ${index + 1} company tags`} value={Array.isArray(item.companies) ? item.companies.join(', ') : item.companies || ''} onChangeText={companies => updateQuestion(index, {companies})} style={styles.input} placeholder="Google, Microsoft, Amazon"/></Field>
      <View style={styles.row}><Field label="Topic"><TextInput accessibilityLabel={`Question ${index + 1} topic`} value={item.topic || ''} onChangeText={topic => updateQuestion(index, {topic})} style={styles.input}/></Field><Field label="Difficulty"><TextInput accessibilityLabel={`Question ${index + 1} difficulty`} value={item.difficulty || ''} onChangeText={difficulty => updateQuestion(index, {difficulty})} style={styles.input} placeholder="Easy / Medium / Hard"/></Field></View>
      <PremiumToggle enabled={item.isPremium === true} onPress={() => updateQuestion(index, {isPremium: item.isPremium !== true})}/>
    </View>)}

    <View style={styles.headingRow}><Text style={styles.section}>Coding practice</Text><AddButton label="Add link" onPress={() => update({codingLinks: [...links, {title: '', platform: '', url: '', topic: '', difficulty: '', isPremium: false}]})}/></View>
    {links.map((item, index) => <View key={String(item._id || index)} style={styles.card}>
      <CardHeading title={`Practice link ${index + 1}`} onRemove={() => update({codingLinks: links.filter((_, i) => i !== index)})}/>
      <Field label="Title"><TextInput accessibilityLabel={`Coding link ${index + 1} title`} value={item.title || ''} onChangeText={title => updateLink(index, {title})} style={styles.input} placeholder="e.g. Binary tree traversal"/></Field>
      <Field label="URL"><TextInput accessibilityLabel={`Coding link ${index + 1} URL`} value={item.url || ''} onChangeText={url => updateLink(index, {url})} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} placeholder="https://…"/></Field>
      <View style={styles.row}><Field label="Platform"><TextInput accessibilityLabel={`Coding link ${index + 1} platform`} value={item.platform || ''} onChangeText={platform => updateLink(index, {platform})} style={styles.input} placeholder="LeetCode, GFG"/></Field><Field label="Topic"><TextInput accessibilityLabel={`Coding link ${index + 1} topic`} value={item.topic || ''} onChangeText={topic => updateLink(index, {topic})} style={styles.input}/></Field></View>
      <Field label="Difficulty"><TextInput accessibilityLabel={`Coding link ${index + 1} difficulty`} value={item.difficulty || ''} onChangeText={difficulty => updateLink(index, {difficulty})} style={styles.input} placeholder="Easy / Medium / Hard"/></Field>
      <PremiumToggle enabled={item.isPremium === true} onPress={() => updateLink(index, {isPremium: item.isPremium !== true})}/>
    </View>)}

    <Text style={styles.section}>GATE insights</Text>
    <View style={styles.card}>
      <Field label="Exam label"><TextInput accessibilityLabel="GATE exam label" value={gate.examCode || ''} onChangeText={examCode => updateGate({examCode})} style={styles.input} placeholder="GATE CS"/></Field>
      <View style={styles.row}><Field label="Minimum marks"><TextInput accessibilityLabel="Minimum GATE marks" value={gate.weightageMinMarks == null ? '' : String(gate.weightageMinMarks)} onChangeText={weightageMinMarks => updateGate({weightageMinMarks})} keyboardType="decimal-pad" style={styles.input}/></Field><Field label="Maximum marks"><TextInput accessibilityLabel="Maximum GATE marks" value={gate.weightageMaxMarks == null ? '' : String(gate.weightageMaxMarks)} onChangeText={weightageMaxMarks => updateGate({weightageMaxMarks})} keyboardType="decimal-pad" style={styles.input}/></Field></View>
      <Field label="Period / context"><TextInput accessibilityLabel="GATE weightage period" value={gate.weightagePeriod || ''} onChangeText={weightagePeriod => updateGate({weightagePeriod})} style={styles.input} placeholder="e.g. Recent GATE CS papers"/></Field>
      <View style={styles.headingRow}><Text style={styles.subsection}>Previous-year questions</Text><AddButton label="Add PYQ" onPress={() => updateGate({pyqs: [...pyqs, {title: '', year: '', topic: '', url: '', isPremium: false}]})}/></View>
      {pyqs.map((item, index) => <View key={String(item._id || index)} style={styles.resourceCard}>
        <CardHeading title={`GATE PYQ ${index + 1}`} onRemove={() => updateGate({pyqs: pyqs.filter((_, i) => i !== index)})}/>
        <Field label="Title"><TextInput accessibilityLabel={`GATE PYQ ${index + 1} title`} value={item.title || ''} onChangeText={title => updatePyq(index, {title})} style={styles.input}/></Field>
        <View style={styles.row}><Field label="Year"><TextInput accessibilityLabel={`GATE PYQ ${index + 1} year`} value={item.year == null ? '' : String(item.year)} onChangeText={year => updatePyq(index, {year})} keyboardType="number-pad" style={styles.input}/></Field><Field label="Topic"><TextInput accessibilityLabel={`GATE PYQ ${index + 1} topic`} value={item.topic || ''} onChangeText={topic => updatePyq(index, {topic})} style={styles.input}/></Field></View>
        <Field label="URL"><TextInput accessibilityLabel={`GATE PYQ ${index + 1} URL`} value={item.url || ''} onChangeText={url => updatePyq(index, {url})} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} placeholder="https://…"/></Field>
        <PremiumToggle enabled={item.isPremium === true} onPress={() => updatePyq(index, {isPremium: item.isPremium !== true})}/>
      </View>)}
    </View>
  </View>;
}

function Field({label, children}: React.PropsWithChildren<{label: string}>): React.JSX.Element {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}
function CardHeading({title, onRemove}: {title: string; onRemove: () => void}): React.JSX.Element {
  return <View style={styles.headingRow}><Text style={styles.cardTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${title}`} onPress={onRemove} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></Pressable></View>;
}
function AddButton({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.addButton}><Text style={styles.addText}>＋ {label}</Text></Pressable>;
}
function PremiumToggle({enabled, onPress}: {enabled: boolean; onPress: () => void}): React.JSX.Element {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{checked: enabled}} onPress={onPress} style={styles.premiumToggle}><View style={[styles.checkbox, enabled && styles.checkboxActive]}>{enabled ? <Text style={styles.check}>✓</Text> : null}</View><Text style={styles.premiumText}>Premium resource</Text></Pressable>;
}

const styles = createAdaptiveStyles(StyleSheet.create({
  intro: {marginTop: 5, color: '#687187', fontSize: 11, lineHeight: 16},
  section: {marginTop: 18, color: '#101828', fontSize: 13, fontWeight: '900'},
  subsection: {color: '#475467', fontSize: 11, fontWeight: '900'},
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 11},
  card: {marginTop: 8, padding: 11, borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 12, backgroundColor: '#f8f9fc'},
  resourceCard: {marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 10, backgroundColor: '#ffffff'},
  cardTitle: {color: '#101828', fontSize: 11, fontWeight: '900'},
  field: {flex: 1, minWidth: 0, marginTop: 8},
  label: {marginBottom: 5, color: '#737b8c', fontSize: 9, fontWeight: '900'},
  input: {minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 9, color: '#101828', backgroundColor: '#ffffff', fontSize: 11},
  multiline: {minHeight: 76, textAlignVertical: 'top'},
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  addButton: {minHeight: 40, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: '#b7e4c7', borderRadius: 9, backgroundColor: '#ecfdf3'},
  addText: {color: '#16794b', fontSize: 10, fontWeight: '900'},
  removeButton: {minHeight: 40, justifyContent: 'center', paddingHorizontal: 8},
  removeText: {color: '#b42318', fontSize: 10, fontWeight: '800'},
  premiumToggle: {minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 5},
  checkbox: {width: 19, height: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#929bad', borderRadius: 5, backgroundColor: '#ffffff'},
  checkboxActive: {borderColor: '#16794b', backgroundColor: '#16794b'},
  check: {color: '#ffffff', fontSize: 12, fontWeight: '900'},
  premiumText: {color: '#475467', fontSize: 10, fontWeight: '700'},
}));
