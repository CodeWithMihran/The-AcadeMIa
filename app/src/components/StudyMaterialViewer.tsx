import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import {WebView} from 'react-native-webview';
import {colors, spacing, createAdaptiveStyles} from '../theme';
import {readAuthToken} from '../services/tokenStore';
import {API_BASE_URL} from '../services/api';
import {useAppTheme} from '../context/ThemeContext';

export interface StudyMaterial {
  title: string;
  url: string;
  kind?: 'pdf' | 'web';
  authenticated?: boolean;
}

function normalizeUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function youtubeVideoId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let videoId = '';
    if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      videoId = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function embedUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'drive.google.com') {
      const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
      if (id) return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
    }
    if (host === 'docs.google.com') {
      const match = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
      if (match) return `https://docs.google.com/${match[1]}/d/${encodeURIComponent(match[2])}/preview`;
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function appOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

function youtubeDocument(videoId: string, origin: string): string {
  const playerUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  playerUrl.searchParams.set('playsinline', '1');
  if (origin) playerUrl.searchParams.set('widget_referrer', origin);

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${playerUrl.toString()}" title="YouTube lecture" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></body></html>`;
}

export function StudyMaterialViewer({
  material,
  onClose,
}: {
  material: StudyMaterial | null;
  onClose: () => void;
}): React.JSX.Element {
  const {reduceMotion} = useAppTheme();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const normalizedUrl = useMemo(() => material ? normalizeUrl(material.url) : null, [material]);
  const embeddedUrl = useMemo(() => normalizedUrl ? embedUrl(normalizedUrl) : '', [normalizedUrl]);
  const videoId = useMemo(() => normalizedUrl ? youtubeVideoId(normalizedUrl) : null, [normalizedUrl]);
  const youtubeOrigin = useMemo(() => appOrigin(), []);
  const isProviderEmbed = normalizedUrl !== null && (embeddedUrl !== normalizedUrl || videoId !== null);
  const isPdf = Boolean(material && !isProviderEmbed && (
    material.kind === 'pdf' || /\.pdf(?:$|[?#])/i.test(normalizedUrl || '') || /\/community\/notes\/[^/]+\/file(?:$|[?#])/i.test(normalizedUrl || '')
  ));

  useEffect(() => {
    let active = true;
    setLoading(Boolean(material));
    setLoadError('');
    setPageCount(null);
    setToken(null);
    if (material?.authenticated) {
      readAuthToken().then(value => {
        if (active) {
          if (!value) setLoadError('Your sign-in has expired. Sign in again, then reopen this material.');
          setToken(value);
        }
      }).catch(() => {
        if (active) setLoadError('Could not read your secure sign-in. Sign in again to open this material.');
      });
    }
    return () => { active = false; };
  }, [material]);

  const openExternally = async () => {
    if (!normalizedUrl) return;
    try {
      await Linking.openURL(normalizedUrl);
    } catch {
      setLoadError('This resource could not be opened by a browser or compatible app.');
    }
  };

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={Boolean(material)}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text numberOfLines={1} style={styles.title}>{material?.title || 'Study material'}</Text>
            <Text style={styles.subtitle}>{isPdf ? 'PDF READER' : 'STUDY MATERIAL VIEWER'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close study material" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        {!material ? null : !normalizedUrl ? (
          <Fallback message="This resource has an invalid or unsupported link." onOpen={undefined} />
        ) : loadError ? (
          <Fallback message={loadError} onOpen={material.authenticated ? undefined : openExternally} />
        ) : material.authenticated && token === null ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Checking secure access…</Text></View>
        ) : isPdf ? (
          <View style={styles.viewer}>
            <Pdf
              source={{uri: normalizedUrl, ...(material.authenticated && token ? {headers: {Authorization: `Bearer ${token}`}} : {})}}
              trustAllCerts={false}
              enableDoubleTapZoom
              enablePaging={false}
              onLoadProgress={() => setLoading(true)}
              onLoadComplete={count => { setPageCount(count); setLoading(false); }}
              onError={() => { setLoading(false); setLoadError('The PDF could not be displayed here. Its provider may block in-app access, or the file may no longer be available.'); }}
              style={styles.pdf}
            />
            {loading && <View pointerEvents="none" style={styles.loadingOverlay}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading PDF…</Text></View>}
            {pageCount !== null && <View pointerEvents="none" style={styles.pageBadge}><Text style={styles.pageText}>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</Text></View>}
          </View>
        ) : (
          <View style={styles.viewer}>
            <WebView
              source={videoId
                ? {html: youtubeDocument(videoId, youtubeOrigin), ...(youtubeOrigin ? {baseUrl: `${youtubeOrigin}/`} : {})}
                : {uri: embeddedUrl}}
              originWhitelist={videoId ? ['*'] : undefined}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction
              onLoadStart={() => { setLoading(true); setLoadError(''); }}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setLoadError('This provider could not display the material inside the app.'); }}
              onHttpError={event => {
                if (event.nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setLoadError(`The provider returned an error (${event.nativeEvent.statusCode}).`);
                }
              }}
              style={styles.webview}
            />
            {loading && <View pointerEvents="none" style={styles.loadingOverlay}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Opening material…</Text></View>}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Fallback({message, onOpen}: {message: string; onOpen?: () => void}): React.JSX.Element {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Can’t show this material here</Text>
      <Text style={styles.fallbackMessage}>{message}</Text>
      {onOpen && <Pressable accessibilityRole="button" onPress={() => onOpen()} style={styles.fallbackButton}><Text style={styles.fallbackButtonText}>Open in browser</Text></Pressable>}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  root: {flex: 1, backgroundColor: '#17191f'},
  header: {minHeight: 66, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center', backgroundColor: '#111318', borderBottomWidth: 1, borderBottomColor: '#30333b'},
  heading: {flex: 1, minWidth: 0, marginRight: spacing.sm},
  title: {color: '#fff', fontSize: 15, fontWeight: '800'},
  subtitle: {marginTop: 4, color: '#a9b4d0', fontSize: 9, fontWeight: '800', letterSpacing: 1.1},
  closeButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#252832'},
  closeText: {color: '#fff', fontSize: 28, lineHeight: 31},
  viewer: {flex: 1, position: 'relative'},
  pdf: {flex: 1, width: '100%', backgroundColor: '#24262b'},
  webview: {flex: 1, backgroundColor: '#fff'},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg},
  loadingOverlay: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23,25,31,0.75)'},
  loadingText: {marginTop: spacing.sm, color: '#e4e8f1', fontSize: 13, fontWeight: '700'},
  pageBadge: {position: 'absolute', right: spacing.md, bottom: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(17,19,24,0.78)'},
  pageText: {color: '#fff', fontSize: 10, fontWeight: '800'},
  fallback: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background},
  fallbackTitle: {color: colors.textPrimary, fontSize: 19, fontWeight: '900', textAlign: 'center'},
  fallbackMessage: {marginTop: spacing.sm, color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center'},
  fallbackButton: {minHeight: 46, marginTop: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primary},
  fallbackButtonText: {color: '#fff', fontSize: 13, fontWeight: '800'},
}));
