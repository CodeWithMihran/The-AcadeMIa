import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {adminApi, communityApi, getApiErrorMessage, tenantApi} from '../services/api';

type Tenant = {_id: string; name: string; shortCode: string; type: string; affiliatedColleges?: Array<{_id?: string; code?: string; name: string}>};
type CampusUser = {_id: string; name: string; email: string; role: string; track?: string; tenant?: {_id?: string; name?: string; shortCode?: string} | string; college?: string; branch?: string; campusAmbassador?: {active?: boolean; tenant?: {_id?: string; shortCode?: string} | string; college?: string; branches?: string[]; semesters?: number[]}};

export function CampusAdminPanel(): React.JSX.Element {
  useAppTheme();
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userId, setUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [college, setCollege] = useState('');
  const [branches, setBranches] = useState('');
  const [semesters, setSemesters] = useState<number[]>([]);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, tenantsResponse] = await Promise.all([adminApi.users(), tenantApi.getTenants()]);
      const userBody = usersResponse.data as {users?: CampusUser[]};
      const tenantBody = tenantsResponse.data as {tenants?: Tenant[]};
      setUsers(Array.isArray(userBody.users) ? userBody.users : []);
      setTenants((tenantBody.tenants || []).filter(item => item.type === 'UNIVERSITY'));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load ambassador administration.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  const selectedTenant = tenants.find(item => item._id === tenantId);
  const eligibleUsers = useMemo(() => users.filter(item => item.role !== 'admin' && item.track === 'UNIVERSITY'), [users]);
  const ambassadors = users.filter(item => item.campusAmbassador?.active);

  const assign = async () => {
    if (!userId || !tenantId) { setError('Choose a student and university before assigning access.'); return; }
    const target = eligibleUsers.find(item => item._id === userId);
    const targetTenant = typeof target?.tenant === 'object' ? target.tenant?._id : target?.tenant;
    if (targetTenant && targetTenant !== tenantId) { setError('The selected student belongs to a different university.'); return; }
    const branchList = [...new Set(branches.split(',').map(value => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean))];
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await communityApi.grantAmbassador(userId, {active: true, tenantId, college, branches: branchList, semesters});
      setNotice((response.data as {message?: string}).message || 'Campus ambassador access granted.');
      setBranches(''); setSemesters([]); await load();
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Could not grant ambassador access.')); }
    finally { setSaving(false); }
  };

  const revoke = (item: CampusUser) => Alert.alert('Revoke ambassador access?', `${item.name} will lose the scoped moderator role.`, [
    {text: 'Keep access', style: 'cancel'},
    {text: 'Revoke', style: 'destructive', onPress: () => {
      setSaving(true);
      communityApi.grantAmbassador(item._id, {active: false, branches: [], semesters: []})
        .then(response => { setNotice((response.data as {message?: string}).message || 'Ambassador access revoked.'); return load(); })
        .catch(requestError => setError(getApiErrorMessage(requestError, 'Could not revoke ambassador access.')))
        .finally(() => setSaving(false));
    }},
  ]);

  const grantCredits = async () => {
    const amount = Number(delta);
    if (!userId || !Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1000 || reason.trim().length < 3) {
      setError('Select a student, enter a non-zero whole credit adjustment within 1,000, and provide an audit reason.'); return;
    }
    setSaving(true); setError(''); setNotice('');
    const requestId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const response = await communityApi.adjustCredits(userId, {delta: amount, description: reason.trim(), requestId});
      setNotice((response.data as {message?: string}).message || 'Credit adjustment recorded in the ledger.');
      setDelta(''); setReason('');
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Could not adjust credits.')); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.state}><ActivityIndicator color="#16794b"/><Text style={styles.muted}>Loading campus administration…</Text></View>;

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.intro}>Assign university and campus scopes to student moderators, or record an audited credit adjustment. Server permissions and validation remain authoritative.</Text>
    {error ? <View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => load()}><Text style={styles.link}>Retry</Text></Pressable></View> : null}
    {notice ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Assign campus ambassador</Text>
      <Text style={styles.muted}>Students must already belong to the selected university. Branch and semester filters can be left blank to cover all.</Text>
      <Text style={styles.label}>Student</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{eligibleUsers.map(item => <Pressable key={item._id} accessibilityRole="radio" accessibilityState={{selected:userId===item._id}} onPress={() => {setUserId(item._id); setTenantId(typeof item.tenant==='object' ? item.tenant?._id || '' : item.tenant || '');}} style={[styles.chip,userId===item._id&&styles.selected]}><Text numberOfLines={1} style={[styles.chipText,userId===item._id&&styles.selectedText]}>{item.name}</Text></Pressable>)}</ScrollView>
      {!eligibleUsers.length ? <Text style={styles.muted}>No university students are available to assign.</Text> : null}
      <Text style={styles.label}>University</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{tenants.map(item => <Pressable key={item._id} accessibilityRole="radio" accessibilityState={{selected:tenantId===item._id}} onPress={() => {setTenantId(item._id); setCollege('');}} style={[styles.chip,tenantId===item._id&&styles.selected]}><Text numberOfLines={1} style={[styles.chipText,tenantId===item._id&&styles.selectedText]}>{item.shortCode} · {item.name}</Text></Pressable>)}</ScrollView>
      {selectedTenant?.affiliatedColleges?.length ? <><Text style={styles.label}>Campus scope (optional)</Text><View style={styles.chips}>{selectedTenant.affiliatedColleges.map(item => <Pressable key={item._id||item.code||item.name} accessibilityRole="radio" accessibilityState={{selected:college===item.name}} onPress={() => setCollege(college===item.name?'':item.name)} style={[styles.chip, college===item.name&&styles.selected]}><Text style={[styles.chipText,college===item.name&&styles.selectedText]}>{item.name}</Text></Pressable>)}</View></> : null}
      <Text style={styles.label}>Branches (optional, comma separated)</Text><TextInput accessibilityLabel="Ambassador branch scope" value={branches} onChangeText={setBranches} placeholder="CSE, AIML" placeholderTextColor="#929bad" style={styles.input}/>
      <Text style={styles.label}>Semesters (none means all)</Text><View style={styles.chips}>{[1,2,3,4,5,6,7,8].map(value => <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{checked:semesters.includes(value)}} onPress={() => setSemesters(current => current.includes(value)?current.filter(item=>item!==value):[...current,value].sort())} style={[styles.semester,semesters.includes(value)&&styles.selected]}><Text style={[styles.chipText,semesters.includes(value)&&styles.selectedText]}>{value}</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" disabled={saving} onPress={assign} style={[styles.button,saving&&styles.disabled]}><Text style={styles.buttonText}>{saving?'Saving…':'Grant scoped access'}</Text></Pressable>
    </View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Adjust contributor credits</Text><Text style={styles.muted}>Each change is recorded in the existing append-only credit ledger with a required reason.</Text>
      <Text style={styles.label}>Student</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{users.filter(item=>item.role!=='admin').map(item=><Pressable key={item._id} accessibilityRole="radio" accessibilityState={{selected:userId===item._id}} onPress={()=>setUserId(item._id)} style={[styles.chip,userId===item._id&&styles.selected]}><Text numberOfLines={1} style={[styles.chipText,userId===item._id&&styles.selectedText]}>{item.name}</Text></Pressable>)}</ScrollView>
      <TextInput accessibilityLabel="Credit change" value={delta} onChangeText={setDelta} keyboardType="number-pad" placeholder="Positive grant or negative correction" placeholderTextColor="#929bad" style={styles.input}/>
      <TextInput accessibilityLabel="Credit adjustment audit reason" value={reason} onChangeText={setReason} maxLength={200} placeholder="Audit reason" placeholderTextColor="#929bad" style={styles.input}/>
      <Pressable accessibilityRole="button" disabled={saving} onPress={grantCredits} style={[styles.button,saving&&styles.disabled]}><Text style={styles.buttonText}>{saving?'Recording…':'Record credit adjustment'}</Text></Pressable>
    </View>
    <View style={styles.card}><Text style={styles.cardTitle}>Active ambassadors · {ambassadors.length}</Text>{ambassadors.length?ambassadors.map(item=><View key={item._id} style={styles.ambassador}><View style={styles.userCopy}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.muted}>{item.email} · {item.campusAmbassador?.college||'All campuses'} · {item.campusAmbassador?.branches?.join(', ')||'All branches'} · {item.campusAmbassador?.semesters?.length?`Sem ${item.campusAmbassador.semesters.join(', ')}`:'All semesters'}</Text></View><Pressable accessibilityRole="button" disabled={saving} onPress={()=>revoke(item)}><Text style={styles.danger}>Revoke</Text></Pressable></View>):<Text style={styles.muted}>No ambassadors are currently assigned.</Text>}</View>
  </ScrollView>;
}

const styles=createAdaptiveStyles(StyleSheet.create({content:{padding:16,paddingBottom:32,gap:12},state:{padding:20,alignItems:'center',gap:9},intro:{color:'#687187',fontSize:12,lineHeight:18},card:{padding:15,borderWidth:1,borderColor:'#e7eaf1',borderRadius:15,backgroundColor:'#fff'},cardTitle:{color:'#101828',fontSize:15,fontWeight:'900'},muted:{marginTop:5,color:'#687187',fontSize:11,lineHeight:17},label:{marginTop:14,marginBottom:6,color:'#475467',fontSize:10,fontWeight:'900'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,paddingVertical:2},chip:{maxWidth:250,minHeight:44,justifyContent:'center',paddingHorizontal:11,borderWidth:1,borderColor:'#dfe4ed',borderRadius:10,backgroundColor:'#fff'},chipText:{color:'#687187',fontSize:10,fontWeight:'800'},selected:{borderColor:'#16794b',backgroundColor:'#ecfdf3'},selectedText:{color:'#16794b'},semester:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#dfe4ed',borderRadius:10},input:{minHeight:44,marginTop:9,paddingHorizontal:12,borderWidth:1,borderColor:'#dfe4ed',borderRadius:10,color:'#101828',fontSize:12,backgroundColor:'#fff'},button:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',marginTop:14,paddingHorizontal:14,borderRadius:10,backgroundColor:'#16794b'},buttonText:{color:'#fff',fontSize:11,fontWeight:'900'},disabled:{opacity:.55},errorBox:{padding:12,borderWidth:1,borderColor:'#fecdca',borderRadius:12,backgroundColor:'#fff5f5'},error:{color:'#b42318',fontSize:11,lineHeight:16},link:{marginTop:7,color:'#16794b',fontSize:11,fontWeight:'900'},notice:{padding:12,borderRadius:12,backgroundColor:'#edfcf2',color:'#067647',fontSize:11,fontWeight:'800'},ambassador:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#edf0f5'},userCopy:{flex:1},rowTitle:{color:'#101828',fontSize:12,fontWeight:'900'},danger:{padding:8,color:'#b42318',fontSize:10,fontWeight:'900'}}));
