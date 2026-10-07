/**
 * Normalize supported study-material URLs for safe, embedded viewing.
 * Returns null for invalid URLs and preserves ordinary web links as-is.
 */
export function getEmbeddedUrl(rawUrl, kind) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  if (kind === 'video') {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let videoId = '';
    if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      videoId = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || '';
    }
    if (videoId) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
  }

  if (url.hostname.toLowerCase().includes('drive.google.com')) {
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
    if (fileId) return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  }

  if (url.hostname.toLowerCase() === 'docs.google.com') {
    const docMatch = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (docMatch) return `https://docs.google.com/${docMatch[1]}/d/${encodeURIComponent(docMatch[2])}/preview`;
  }

  // Let the browser's built-in PDF viewer render PDF files inside the vault.
  if (kind === 'pdf' && url.pathname.toLowerCase().endsWith('.pdf')) url.hash = 'toolbar=1';
  return url.toString();
}
