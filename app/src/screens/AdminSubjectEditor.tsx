import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {tenantApi, getApiErrorMessage} from '../services/api';
import {createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';
import {AdminCareerBridgeEditor, CareerBridgeValue, normalizeCareerBridge} from './AdminCareerBridgeEditor';

type Resource = {title?: string; link?: string};
type Topic = {title?: string; importance?: string};
type ExamQuestion = {question: string; topic: string; year: number | string; marks: number | string | null; sourceLabel: string; sourceUrl: string};
type Unit = {unitNumber?: number; unitTitle?: string; topics?: Topic[]; notes?: Resource[]; books?: Resource[]; pyqs?: Resource[]; youtubeLinks?: Resource[]; examYearsCovered?: number[]; examQuestions?: ExamQuestion[]; rapidRevision?: Record<string, string>; quickSummary?: Record<string, string>; [key: string]: unknown};
type Tenant = {_id: string; name: string; shortCode: string};
type SubjectDraft = {name?: string; courseCode?: string; track?: string; tenant?: {_id?: string} | string | null; tenantId?: string; branch?: string; semester?: number; credits?: number; examCategory?: string; units?: Unit[]; careerBridge?: Record<string, unknown>; [key: string]: unknown};
type UnitAdvanced = {years: string; revision: Record<string, string>; summary: Record<string, string>; questions: ExamQuestion[]};
const MATERIALS: Array<{key: keyof Unit; label: string}> = [{key: 'notes', label: 'Notes'}, {key: 'books', label: 'Books / PDFs'}, {key: 'pyqs', label: 'PYQs'}, {key: 'youtubeLinks', label: 'Lectures'}];
const REVISION_FIELDS = [['formulas', 'Formulas'], ['derivations', 'Core derivations'], ['diagrams', 'Diagrams and block diagrams'], ['keyPoints', 'Key points']] as const;
const SUMMARY_FIELDS = [['definition', 'Definition'], ['diagram', 'Diagram / illustration'], ['workingPrinciple', 'Working principle'], ['advantages', 'Advantages'], ['disadvantages', 'Disadvantages / limitations']] as const;

export function AdminSubjectEditor({subject, busy, onCancel, onSave}: {subject: SubjectDraft; busy: boolean; onCancel: () => void; onSave: (draft: SubjectDraft) => void}): React.JSX.Element {
  useAppTheme();
  const [draft, setDraft] = useState<SubjectDraft>(subject);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantError, setTenantError] = useState('');
  const [advanced, setAdvanced] = useState<Record<number, UnitAdvanced>>(() => Object.fromEntries((subject.units || []).map((unit,index)=>[index,{years:(unit.examYearsCovered||[]).join(', '),revision:{formulas:'',derivations:'',diagrams:'',keyPoints:'',...(unit.rapidRevision||{})},summary:{definition:'',diagram:'',workingPrinciple:'',advantages:'',disadvantages:'',...(unit.quickSummary||{})},questions:(unit.examQuestions||[]).map(question=>({...question,year:String(question.year),marks:question.marks == null ? '' : String(question.marks)}))}])));

  useEffect(() => {
    let active = true;
    tenantApi.getTenants().then(response => {
      if (active) setTenants(((response.data as {tenants?: Tenant[]}).tenants || []).filter(item => (item as Tenant & {type?: string}).type === 'UNIVERSITY'));
    }).catch(error => { if (active) setTenantError(getApiErrorMessage(error, 'Could not load universities.')); });
    return () => { active = false; };
  }, []);

  const update = (key: keyof SubjectDraft, value: unknown) => setDraft(current => ({...current, [key]: value}));
  const updateUnit = (index: number, value: Partial<Unit>) => setDraft(current => ({...current, units: (current.units || []).map((unit, unitIndex) => unitIndex === index ? {...unit, ...value} : unit)}));
  const addUnit = () => {
    const index=(draft.units||[]).length;
    update('units', [...(draft.units || []), {unitNumber: index + 1, unitTitle: '', topics: [], notes: [], books: [], pyqs: [], youtubeLinks: [], examYearsCovered: [], examQuestions: [], rapidRevision: {}, quickSummary: {}}]);
    setAdvanced(current=>({...current,[index]:{years:'',revision:{formulas:'',derivations:'',diagrams:'',keyPoints:''},summary:{definition:'',diagram:'',workingPrinciple:'',advantages:'',disadvantages:''},questions:[]}}));
  };
  const removeUnit = (index:number) => {
    update('units',(draft.units||[]).filter((_,unitIndex)=>unitIndex!==index));
    setAdvanced(current=>Object.fromEntries(Object.entries(current).filter(([key])=>Number(key)!==index).map(([key,value])=>[Number(key)>index?Number(key)-1:Number(key),value])));
  };
  const changeTopics = (unit: Unit, value: string) => {
    const old = unit.topics || [];
    const lines = value.split('\n').map(item => item.trim()).filter(Boolean);
    return lines.map((title, index) => ({...old[index], title, importance: old[index]?.importance || 'MEDIUM'}));
  };
  const addResource = (unit: Unit, key: keyof Unit) => updateUnit((draft.units || []).indexOf(unit), {[key]: [...((unit[key] as Resource[] | undefined) || []), {title: '', link: ''}]});
  const updateResource = (unit: Unit, key: keyof Unit, index: number, field: keyof Resource, value: string) => updateUnit((draft.units || []).indexOf(unit), {[key]: ((unit[key] as Resource[] | undefined) || []).map((item, itemIndex) => itemIndex === index ? {...item, [field]: value} : item)});
  const save = () => {
    try {
      const careerBridge = normalizeCareerBridge((draft.careerBridge || {}) as CareerBridgeValue);
      const units = (draft.units || []).map((unit,index)=>{
        const extra = advanced[index] || {years:'',revision:{},summary:{},questions:[]};
        const years=extra.years.split(',').map(value=>value.trim()).filter(Boolean).map(Number);
        if(years.some(year=>!Number.isInteger(year)||year<1980||year>2100))throw new Error('Exam years must be whole years between 1980 and 2100.');
        const questions=extra.questions.filter(question=>[question.question,question.topic,question.sourceLabel,question.sourceUrl,String(question.marks ?? '')].some(value=>String(value || '').trim())).map(question=>{
          const year=Number(question.year);
          const marks=question.marks === '' || question.marks == null ? null : Number(question.marks);
          const questionText=String(question.question || '').trim();
          const topic=String(question.topic || '').trim();
          const sourceLabel=String(question.sourceLabel || '').trim();
          if(!questionText||!topic||!sourceLabel||!Number.isInteger(year)||year<1980||year>2100||(marks!=null&&(!Number.isFinite(marks)||marks<0||marks>100))) throw new Error('Each past exam question needs question text, a topic, a valid year, and a source label. Marks must be from 0 to 100.');
          return {...question,question:questionText,topic,sourceLabel,year,marks};
        });
        return {...unit,examYearsCovered:[...new Set(years)],rapidRevision:extra.revision,quickSummary:extra.summary,examQuestions:questions};
      });
      const tenantId = typeof draft.tenant === 'object' ? draft.tenant?._id : draft.tenant;
      onSave({...draft, units, tenantId: draft.track === 'UNIVERSITY' ? (draft.tenantId || tenantId || '') : '', careerBridge});
    } catch (error) {
      setTenantError(error instanceof Error ? error.message : 'Correct the advanced subject fields before saving.');
    }
  };

  return <View style={styles.wrapper}>
    <View style={styles.titleRow}><View style={styles.flex}><Text style={styles.title}>{draft._id ? 'Edit subject' : 'Create subject'}</Text><Text style={styles.muted}>Use the guided syllabus fields below. Existing Exam Night and Career Bridge data is preserved.</Text></View><Pressable accessibilityRole="button" onPress={onCancel} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.form} contentContainerStyle={styles.formContent}>
      <Text style={styles.section}>Subject details</Text>
      <Field label="Subject name"><TextInput accessibilityLabel="Subject name" value={String(draft.name || '')} onChangeText={value => update('name', value)} style={styles.input}/></Field>
      <Field label="Course code"><TextInput accessibilityLabel="Course code" value={String(draft.courseCode || '')} onChangeText={value => update('courseCode', value.toUpperCase())} style={styles.input}/></Field>
      <Text style={styles.label}>Track</Text><View style={styles.row}>{(['UNIVERSITY','JEE','NEET'] as const).map(track=><Pressable key={track} accessibilityRole="radio" accessibilityState={{selected:draft.track===track}} onPress={()=>update('track',track)} style={[styles.choice,draft.track===track&&styles.selected]}><Text style={[styles.choiceText,draft.track===track&&styles.selectedText]}>{track}</Text></Pressable>)}</View>
      {draft.track === 'UNIVERSITY' ? <>
        <Field label="University tenant">{tenants.length?<View style={styles.row}>{tenants.map(item=><Pressable key={item._id} accessibilityRole="radio" accessibilityState={{selected:(draft.tenantId || (typeof draft.tenant==='object'?draft.tenant?._id:draft.tenant))===item._id}} onPress={()=>update('tenantId',item._id)} style={[styles.choice, (draft.tenantId || (typeof draft.tenant==='object'?draft.tenant?._id:draft.tenant))===item._id&&styles.selected]}><Text style={[styles.choiceText,(draft.tenantId || (typeof draft.tenant==='object'?draft.tenant?._id:draft.tenant))===item._id&&styles.selectedText]}>{item.shortCode}</Text></Pressable>)}</View>:<Text style={styles.muted}>{tenantError||'Loading universities…'}</Text>}</Field>
        <Field label="Branch"><TextInput accessibilityLabel="Subject branch" value={String(draft.branch || '')} onChangeText={value=>update('branch',value.toUpperCase())} style={styles.input}/></Field>
        <View style={styles.row}><Field label="Semester"><TextInput accessibilityLabel="Subject semester" keyboardType="number-pad" value={String(draft.semester ?? '')} onChangeText={value=>update('semester',value)} style={styles.input}/></Field><Field label="Official credits"><TextInput accessibilityLabel="Subject credits" keyboardType="decimal-pad" value={String(draft.credits ?? '')} onChangeText={value=>update('credits',value)} style={styles.input}/></Field></View>
      </> : <Field label="Exam category"><TextInput accessibilityLabel="Exam category" value={String(draft.examCategory || '')} onChangeText={value=>update('examCategory',value)} placeholder="Physics, Chemistry, Mathematics, Biology" style={styles.input}/></Field>}
      <Text style={styles.section}>Syllabus units</Text>
      {(draft.units || []).map((unit, index)=><View key={String((unit as { _id?: string })._id || index)} style={styles.unit}>
        <View style={styles.titleRow}><Text style={styles.unitTitle}>Unit {index+1}</Text><Pressable accessibilityRole="button" onPress={()=>removeUnit(index)}><Text style={styles.remove}>Remove</Text></Pressable></View>
        <Field label="Unit title"><TextInput accessibilityLabel={`Unit ${index+1} title`} value={String(unit.unitTitle||'')} onChangeText={value=>updateUnit(index,{unitTitle:value,unitNumber:Number(unit.unitNumber)||index+1})} style={styles.input}/></Field>
        <Field label="Topics (one per line)"><TextInput accessibilityLabel={`Unit ${index+1} topics`} value={(unit.topics||[]).map(item=>item.title||'').join('\n')} onChangeText={value=>updateUnit(index,{topics:changeTopics(unit,value)})} multiline style={[styles.input,styles.multiline]}/></Field>
        {(unit.topics||[]).map((topic, topicIndex)=><View key={topicIndex} style={styles.row}><Text style={styles.topicLabel}>{topic.title}</Text><View style={styles.row}>{(['HIGH','MEDIUM','LOW'] as const).map(importance=><Pressable key={importance} accessibilityRole="radio" accessibilityState={{selected:topic.importance===importance}} onPress={()=>updateUnit(index,{topics:(unit.topics||[]).map((entry,i)=>i===topicIndex?{...entry,importance}:entry)})} style={[styles.importance,topic.importance===importance&&styles.selected]}><Text style={[styles.importanceText,topic.importance===importance&&styles.selectedText]}>{importance}</Text></Pressable>)}</View></View>)}
        {MATERIALS.map(({key,label})=><View key={key}><View style={styles.titleRow}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" onPress={()=>addResource(unit,key)}><Text style={styles.link}>+ Add</Text></Pressable></View>{((unit[key] as Resource[]|undefined)||[]).map((resource, resourceIndex)=><View key={resourceIndex} style={styles.resource}><TextInput accessibilityLabel={`${label} resource title`} value={resource.title||''} onChangeText={value=>updateResource(unit,key,resourceIndex,'title',value)} placeholder="Title" style={styles.input}/><TextInput accessibilityLabel={`${label} resource URL`} value={resource.link||''} onChangeText={value=>updateResource(unit,key,resourceIndex,'link',value)} autoCapitalize="none" placeholder="https://…" style={styles.input}/><Pressable accessibilityRole="button" onPress={()=>updateUnit(index,{[key]:((unit[key] as Resource[])||[]).filter((_,i)=>i!==resourceIndex)})}><Text style={styles.remove}>Remove resource</Text></Pressable></View>)}</View>)}
        <Text style={styles.label}>Exam years reviewed (comma separated)</Text><TextInput accessibilityLabel={`Unit ${index+1} exam coverage years`} value={advanced[index]?.years ?? (unit.examYearsCovered||[]).join(', ')} onChangeText={value=>setAdvanced(current=>({...current,[index]:{...(current[index]||{revision:{},summary:{},questions:[]}),years:value}}))} placeholder="2022, 2023, 2024" style={styles.input}/>
        <Text style={styles.advancedHint}>Add clear, exam-ready content to each section. These fields map directly to the student revision sheet.</Text>
        <Text style={styles.label}>10-minute rapid revision</Text>
        {REVISION_FIELDS.map(([key,label])=><Field key={key} label={label}><TextInput accessibilityLabel={`Unit ${index+1} rapid revision ${label}`} value={advanced[index]?.revision[key] ?? ''} onChangeText={value=>setAdvanced(current=>{const previous=current[index]||{years:'',revision:{},summary:{},questions:[]};return {...current,[index]:{...previous,revision:{...previous.revision,[key]:value}}};})} multiline style={[styles.input,styles.multiline]} placeholder={`Add ${label.toLowerCase()}…`}/></Field>)}
        <Text style={styles.label}>10-mark answer outline</Text>
        {SUMMARY_FIELDS.map(([key,label])=><Field key={key} label={label}><TextInput accessibilityLabel={`Unit ${index+1} 10-mark outline ${label}`} value={advanced[index]?.summary[key] ?? ''} onChangeText={value=>setAdvanced(current=>{const previous=current[index]||{years:'',revision:{},summary:{},questions:[]};return {...current,[index]:{...previous,summary:{...previous.summary,[key]:value}}};})} multiline style={[styles.input,styles.multiline]} placeholder={`Write the ${label.toLowerCase()} section…`}/></Field>)}
        <Text style={styles.label}>Past exam questions</Text>
        {(advanced[index]?.questions || []).map((question, questionIndex)=><View key={questionIndex} style={styles.questionCard}>
          <View style={styles.titleRow}><Text style={styles.questionTitle}>Question {questionIndex+1}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove exam question ${questionIndex+1}`} onPress={()=>setAdvanced(current=>({...current,[index]:{...(current[index] as UnitAdvanced),questions:(current[index]?.questions||[]).filter((_,i)=>i!==questionIndex)}}))}><Text style={styles.remove}>Remove</Text></Pressable></View>
          {([['question','Question text'],['topic','Topic'],['year','Exam year'],['marks','Marks'],['sourceLabel','Source label'],['sourceUrl','Source URL']] as const).map(([field,label])=><TextInput key={field} accessibilityLabel={`Unit ${index+1} question ${questionIndex+1} ${label}`} value={String(question[field] ?? '')} onChangeText={value=>setAdvanced(current=>({...current,[index]:{...(current[index] as UnitAdvanced),questions:(current[index]?.questions||[]).map((item,i)=>i===questionIndex?{...item,[field]:value}:item)}}))} keyboardType={field==='year'||field==='marks'?'number-pad':'default'} autoCapitalize={field==='sourceUrl'?'none':'sentences'} autoCorrect={field==='sourceUrl'?false:undefined} multiline={field==='question'} placeholder={label} style={[styles.input,field==='question'&&styles.multiline]}/>)}
        </View>)}
        <Pressable accessibilityRole="button" onPress={()=>setAdvanced(current=>{const previous=current[index]||{years:'',revision:{},summary:{},questions:[]};return {...current,[index]:{...previous,questions:[...previous.questions,{question:'',topic:'',year:String(new Date().getFullYear()),marks:'',sourceLabel:'',sourceUrl:''}]}};})} style={styles.add}><Text style={styles.addText}>＋ Add exam question</Text></Pressable>
      </View>)}
      <Pressable accessibilityRole="button" onPress={addUnit} style={styles.add}><Text style={styles.addText}>＋ Add unit</Text></Pressable>
      <Text style={styles.section}>Career Bridge</Text><AdminCareerBridgeEditor value={(draft.careerBridge || {}) as CareerBridgeValue} onChange={careerBridge => update('careerBridge', careerBridge)}/>
      {tenantError?<Text accessibilityRole="alert" style={styles.error}>{tenantError}</Text>:null}
      <View style={styles.actions}><Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={save} style={[styles.save,busy&&styles.disabled]}><Text style={styles.saveText}>{busy?'Saving…':'Save subject'}</Text></Pressable></View>
    </ScrollView>
  </View>;
}

function Field({label,children}:{label:string;children:React.ReactNode}):React.JSX.Element{return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;}
const styles=createAdaptiveStyles(StyleSheet.create({wrapper:{maxHeight:700,padding:14,borderWidth:1,borderColor:'#e7eaf1',borderRadius:16,backgroundColor:'#fff'},titleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},flex:{flex:1},title:{color:'#101828',fontSize:16,fontWeight:'900'},muted:{marginTop:5,color:'#687187',fontSize:11,lineHeight:16},close:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#f2f4f8'},closeText:{color:'#687187',fontSize:24},form:{marginTop:9},formContent:{paddingBottom:12},section:{marginTop:16,marginBottom:6,color:'#101828',fontSize:13,fontWeight:'900'},field:{flex:1,marginTop:8},label:{marginTop:5,marginBottom:5,color:'#737b8c',fontSize:9,fontWeight:'900',letterSpacing:.4},advancedHint:{marginTop:6,color:'#687187',fontSize:10,lineHeight:15},input:{minHeight:44,paddingHorizontal:10,paddingVertical:8,borderWidth:1,borderColor:'#dfe4ed',borderRadius:9,color:'#101828',backgroundColor:'#fff',fontSize:11},multiline:{minHeight:78,textAlignVertical:'top'},row:{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'},choice:{minHeight:44,justifyContent:'center',paddingHorizontal:10,borderWidth:1,borderColor:'#dfe4ed',borderRadius:9,backgroundColor:'#fff'},choiceText:{color:'#687187',fontSize:9,fontWeight:'900'},selected:{borderColor:'#16794b',backgroundColor:'#ecfdf3'},selectedText:{color:'#16794b'},questionCard:{marginTop:9,padding:10,borderWidth:1,borderColor:'#e7eaf1',borderRadius:11,backgroundColor:'#f8f9fc'},questionTitle:{color:'#101828',fontSize:11,fontWeight:'900'},unit:{marginTop:10,padding:11,borderWidth:1,borderColor:'#e7eaf1',borderRadius:13,backgroundColor:'#f8f9fc'},unitTitle:{color:'#101828',fontSize:12,fontWeight:'900'},remove:{paddingVertical:6,color:'#b42318',fontSize:9,fontWeight:'900'},topicLabel:{flex:1,minWidth:100,color:'#475467',fontSize:10,fontWeight:'700'},importance:{minHeight:44,justifyContent:'center',paddingHorizontal:6,borderWidth:1,borderColor:'#dfe4ed',borderRadius:7},importanceText:{color:'#687187',fontSize:7,fontWeight:'900'},resource:{marginTop:6,padding:8,borderRadius:10,backgroundColor:'#fff'},link:{color:'#16794b',fontSize:10,fontWeight:'900'},add:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:10},addText:{color:'#16794b',fontSize:11,fontWeight:'900'},actions:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:14},cancel:{minHeight:44,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:'#dfe4ed',borderRadius:10},cancelText:{color:'#687187',fontSize:11,fontWeight:'800'},save:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderRadius:10,backgroundColor:'#16794b'},saveText:{color:'#fff',fontSize:11,fontWeight:'900'},disabled:{opacity:.55},error:{marginTop:8,color:'#b42318',fontSize:10,lineHeight:15}}));
