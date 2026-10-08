import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {adminApi, getApiErrorMessage} from '../services/api';

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  college?: string;
  branch?: string;
};

type Props = {
  deletingUserId: string;
  onDelete: (user: AdminUser, onDeleted: () => void) => void;
};

export function AdminUsersPanel({deletingUserId, onDelete}: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    const sequence = ++requestSequence.current;
    const timer = setTimeout(() => {
      setSearching(true);
      setError('');
      adminApi.users(query.trim())
        .then(response => {
          if (sequence !== requestSequence.current) return;
          const body = response.data as {users?: AdminUser[]};
          setUsers(Array.isArray(body.users) ? body.users : []);
        })
        .catch(requestError => {
          if (sequence !== requestSequence.current) return;
          setError(getApiErrorMessage(requestError, 'Could not load the user directory.'));
        })
        .finally(() => {
          if (sequence !== requestSequence.current) return;
          setLoading(false);
          setSearching(false);
        });
    }, query ? 300 : 0);

    return () => {
      clearTimeout(timer);
      // Ignore a response that arrives after the query changes or this screen closes.
      requestSequence.current += 1;
    };
  }, [query, retryKey]);

  return (
    <View>
      <Text style={styles.section}>User directory</Text>
      <TextInput
        accessibilityLabel="Search users by name, email, campus, or branch"
        value={query}
        onChangeText={setQuery}
        placeholder="Search name, email, campus, branch"
        placeholderTextColor="#858da0"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      <View style={styles.resultsHeader}>
        <Text style={styles.caption}>{users.length} {users.length === 1 ? 'user' : 'users'} shown</Text>
        {searching && <ActivityIndicator size="small" color="#315cf5" accessibilityLabel="Searching users" />}
      </View>

      {loading ? (
        <View style={styles.stateCard} accessibilityRole="progressbar" accessibilityLabel="Loading user directory">
          <ActivityIndicator size="small" color="#315cf5" />
          <Text style={styles.muted}>Loading users…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.errorTitle}>Users couldn’t load</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setLoading(true); setRetryKey(value => value + 1); }} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : users.length ? users.map(user => (
        <View key={user._id} style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.userCopy}>
              <Text style={styles.cardTitle}>{user.name}</Text>
              <Text style={styles.caption}>{user.email} · {user.role}</Text>
              {!!(user.college || user.branch) && <Text style={styles.caption}>{[user.college, user.branch].filter(Boolean).join(' · ')}</Text>}
            </View>
            {user.role !== 'admin' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${user.name}`}
                accessibilityState={{disabled: deletingUserId === user._id}}
                disabled={deletingUserId === user._id}
                onPress={() => onDelete(user, () => setUsers(current => current.filter(item => item._id !== user._id)))}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>{deletingUserId === user._id ? '…' : 'Delete'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      )) : (
        <View style={styles.stateCard}>
          <Text style={styles.cardTitle}>{query.trim() ? 'No matching users' : 'No users found'}</Text>
          <Text style={styles.muted}>{query.trim() ? 'Try a name, email, or campus with different spelling.' : 'User accounts will appear here after registration.'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 5, marginBottom: 10, color: '#101828', fontSize: 17, fontWeight: '900'},
  input: {height: 45, paddingHorizontal: 12, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 11, color: '#101828', backgroundColor: '#fff'},
  resultsHeader: {minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  card: {marginTop: 9, padding: 14, borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 14, backgroundColor: '#fff'},
  userRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  userCopy: {flex: 1},
  cardTitle: {color: '#101828', fontSize: 13, fontWeight: '900'},
  caption: {marginTop: 4, color: '#737b8c', fontSize: 10, lineHeight: 15},
  deleteButton: {minHeight: 40, justifyContent: 'center', paddingHorizontal: 8},
  deleteText: {color: '#9b1c1c', fontSize: 11, fontWeight: '900'},
  stateCard: {marginTop: 10, padding: 16, borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 14, backgroundColor: '#fff'},
  muted: {marginTop: 7, color: '#687187', fontSize: 12, lineHeight: 18},
  errorTitle: {color: '#9b1c1c', fontSize: 14, fontWeight: '900'},
  retryButton: {alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', marginTop: 10, paddingHorizontal: 13, borderRadius: 9, backgroundColor: '#111318'},
  retryText: {color: '#fff', fontSize: 11, fontWeight: '900'},
});
