import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import React, {useCallback, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {api, getApiErrorMessage} from '../services/api';
import {useAuth} from '../context/AuthContext';
import {profileUpdatePayload} from './ProfileScreen';
import {AppCard, AppHeader, EmptyState, LoadingState, PrimaryButton, SectionHeading} from '../components';

type Ranking = {success?: boolean; available?: boolean; participating?: boolean; message?: string; cohortSize?: number; yourRank?: number | null; yourReadiness?: number | null; topTenPercent?: boolean; cohort?: {college?: string; branch?: string; semester?: number}; topTen?: Array<{rank: number; label: string; averageReadiness: number}>};
export function RankingsScreen(): React.JSX.Element {
  useAppTheme();
  const {user}=useAuth();
  const [data,setData]=useState<Ranking|null>(null); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [error,setError]=useState(''); const [saving,setSaving]=useState(false);
  const load=useCallback(async(background=false)=>{background?setRefreshing(true):setLoading(true);setError('');try{const response=await api.get('/progress/leaderboard');setData(response.data as Ranking);}catch(e){setError(getApiErrorMessage(e,'Could not load cohort rankings.'));}finally{setLoading(false);setRefreshing(false);}},[]);
  useFocusEffect(useCallback(()=>{load(true).catch(()=>{});},[load]));
  const setOptIn=async()=>{if(!data)return;setSaving(true);try{await api.put('/auth/profile',profileUpdatePayload(user,{leaderboardOptIn:!data.participating}));await load(true);}catch(e){setError(getApiErrorMessage(e,'Could not update leaderboard privacy.'));}finally{setSaving(false);}};
  if(loading)return <View style={styles.center}><LoadingState message="Loading your cohort…" minHeight={160}/></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor="#16794b"/>}>
    <AppHeader eyebrow="LEARN TOGETHER" title="Rankings" subtitle="Private cohort rankings use syllabus readiness. Your name and email are never shown." />
    {error?<AppCard style={styles.errorCard}><Text style={styles.error}>{error}</Text><PrimaryButton label="Try again" variant="ghost" onPress={()=>load()} style={styles.retry}/></AppCard>:null}
    {data?.available? <><AppCard variant="inverse" style={styles.highlight}><Text style={styles.highlightLabel}>YOUR COHORT POSITION</Text><Text style={styles.rank}>{data.yourRank?`#${data.yourRank}`:'Not ranked'}</Text><Text style={styles.highlightMeta}>{data.yourReadiness ?? 0}% readiness · {data.cohortSize} opted-in students</Text>{data.cohort&&<Text style={styles.highlightMeta}>{data.cohort.college} · {data.cohort.branch} · Semester {data.cohort.semester}</Text>}{data.topTenPercent&&<Text style={styles.badge}>Top 10% of your cohort</Text>}</AppCard><SectionHeading title="Top performers" />{data.topTen?.map((row,index)=><AppCard key={`${row.rank}-${index}`} style={styles.card}><Text style={styles.peer}>{row.label}</Text><Text style={styles.score}>{row.averageReadiness}%</Text></AppCard>)}</>:<EmptyState title="Rankings are not available yet" description={data?.message||'Complete your academic profile and opt in to join your campus cohort.'} style={styles.empty}/>}
    <AppCard style={styles.privacy}><Text style={styles.cardTitle}>Leaderboard privacy</Text><Text style={styles.muted}>Participation is optional. Peers see anonymous labels and readiness scores only.</Text><PrimaryButton accessibilityLabel={data?.participating?'Leave rankings':'Join rankings'} label={saving?'Saving…':data?.participating?'Leave rankings':'Join rankings'} variant="primary" loading={saving} onPress={setOptIn} style={styles.button}/></AppCard>
  </ScrollView>;
}
const styles=createAdaptiveStyles(StyleSheet.create({screen:{flex:1,backgroundColor:'#f7f8fc'},content:{padding:20,paddingBottom:36},center:{flex:1,justifyContent:'center'},highlight:{marginTop:8,backgroundColor:'#111318'},highlightLabel:{color:'#a8e2c3',fontSize:10,fontWeight:'900',letterSpacing:1},rank:{marginTop:7,color:'#fff',fontSize:36,fontWeight:'900'},highlightMeta:{marginTop:6,color:'#d9deea',fontSize:12},badge:{alignSelf:'flex-start',marginTop:12,paddingHorizontal:10,paddingVertical:6,borderRadius:9,backgroundColor:'#16794b',color:'#fff',fontWeight:'800'},card:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10,padding:16},cardTitle:{color:'#101828',fontSize:15,fontWeight:'900'},peer:{flex:1,color:'#101828',fontSize:14,fontWeight:'800'},score:{color:'#16794b',fontSize:15,fontWeight:'900'},muted:{marginTop:6,color:'#687187',fontSize:13,lineHeight:20},privacy:{marginTop:24,padding:16},button:{marginTop:13},retry:{marginTop:8,alignSelf:'flex-start'},errorCard:{marginTop:14,padding:14},empty:{marginTop:14},error:{color:'#9b1c1c',fontSize:13}}));
