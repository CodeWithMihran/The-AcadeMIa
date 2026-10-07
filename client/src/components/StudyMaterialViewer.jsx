import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { getEmbeddedUrl } from '../utils/embedHelpers';

function ActiveStudyMaterialViewer({ material, onClose }) {
  const viewerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const embedUrl = useMemo(() => (material ? getEmbeddedUrl(material.url, material.kind) : null), [material]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!material) return undefined;
    const viewerElement = viewerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        setIsFullscreen(false);
        onCloseRef.current();
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && viewerElement.contains(document.fullscreenElement)));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement === viewerElement) document.exitFullscreen?.();
    };
  }, [material]);

  const closeViewer = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement && viewerRef.current?.contains(document.fullscreenElement)) {
      Promise.resolve(document.exitFullscreen?.()).catch(() => {});
    }
    onCloseRef.current();
  };

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    try {
      if (isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
        return;
      }
      if (document.fullscreenElement && viewerRef.current.contains(document.fullscreenElement)) await document.exitFullscreen();
      else if (viewerRef.current.requestFullscreen) await viewerRef.current.requestFullscreen();
      else setIsFullscreen(true);
    } catch {
      setIsFullscreen(true);
    }
  };

  const viewerSize = isFullscreen
    ? 'h-dvh w-screen max-w-none rounded-none'
    : 'h-[94dvh] w-full max-w-[1720px] rounded-2xl';

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-0 backdrop-blur-sm sm:p-3 md:p-5 ${isFullscreen ? 'bg-black p-0' : ''}`}
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewer(); }}
    >
      <section
        ref={viewerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${material.title} viewer`}
        className={`flex min-h-0 flex-col overflow-hidden border border-white/10 bg-surface shadow-2xl transition-[width,height,max-width,border-radius] duration-300 ${viewerSize}`}
      >
        <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black text-content sm:text-base">{material.title}</h2>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600 sm:text-[10px]">
              {material.kind === 'video' ? 'Lecture player' : 'Study material'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-content-secondary transition duration-200 hover:bg-surface-subtle hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isFullscreen ? <Minimize2 aria-hidden="true" className="h-4 w-4" /> : <Maximize2 aria-hidden="true" className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={closeViewer}
              aria-label="Close viewer"
              title="Close viewer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-content-muted transition duration-200 hover:bg-surface-subtle hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        {embedUrl ? (
          <div className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ${material.kind === 'video' ? 'bg-black' : 'bg-surface-subtle'}`}>
            <iframe
              key={embedUrl}
              title={material.title}
              src={embedUrl}
              className={material.kind === 'video' ? 'h-full w-full max-w-full bg-black' : 'h-full w-full bg-surface'}
              style={material.kind === 'video' ? { width: 'min(100%, 160vh)', height: 'auto', maxHeight: '100%', aspectRatio: '16 / 9' } : undefined}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            {material.kind !== 'video' && (
              <p className="pointer-events-none absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-center text-[10px] leading-4 text-white shadow-lg sm:bottom-4 sm:text-xs">
                If the provider blocks embedded viewing, adjust its sharing permissions and try again.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm font-semibold text-red-600">
            This material link is invalid. Use an HTTP or HTTPS URL.
          </div>
        )}
      </section>
    </div>
  );
}

export default function StudyMaterialViewer({ material, onClose }) {
  if (!material) return null;
  const viewerKey = `${material.kind || 'material'}:${material.url || ''}:${material.title || ''}`;
  return <ActiveStudyMaterialViewer key={viewerKey} material={material} onClose={onClose} />;
}
